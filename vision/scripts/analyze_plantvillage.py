import csv
import hashlib
import json
from collections import Counter, defaultdict
from io import BytesIO
from pathlib import Path
from typing import Iterable

from PIL import Image


VISION_DIRECTORY = Path(__file__).resolve().parents[1]
IMAGE_EXTENSIONS = {
    '.jpg', '.jpeg', '.png', '.bmp', '.gif', '.tif', '.tiff', '.webp',
}
SEGMENTED_SUFFIX = '_final_masked'
UUID_PART_LENGTHS = (8, 4, 4, 4, 12)
HEX_DIGITS = '0123456789abcdefABCDEF'

ReportRow = dict[str, str | int | bool]
ImagePaths = dict[str, Path]


def scan_dataset(
    dataset_directory: Path,
) -> tuple[list[str], ImagePaths, list[ReportRow]]:
    """Collect class directories, image paths, and structural problems."""
    class_names = sorted(
        directory.name
        for directory in dataset_directory.iterdir()
        if directory.is_dir() and not directory.is_symlink()
    )
    image_paths: ImagePaths = {}
    problems: list[ReportRow] = []

    for file_path in sorted(dataset_directory.rglob('*')):
        relative_path = file_path.relative_to(dataset_directory)
        relative_name = relative_path.as_posix()

        if file_path.is_symlink():
            raise RuntimeError(f'Symbolic link not supported: {file_path}')

        if file_path.is_dir():
            if len(relative_path.parts) > 1:
                problems.append({
                    'path': relative_name,
                    'kind': 'unexpected_directory',
                    'detail': 'nested class directory',
                })
            continue

        is_image = file_path.suffix.lower() in IMAGE_EXTENSIONS
        if not is_image or len(relative_path.parts) < 2:
            problems.append({
                'path': relative_name,
                'kind': 'unexpected_file',
                'detail': 'extension or location',
            })

        if is_image:
            image_paths[relative_name] = file_path

    return class_names, image_paths, problems


def build_class_rows(
    class_names: list[str],
    image_paths: ImagePaths,
    problems: list[ReportRow],
) -> list[ReportRow]:
    """Classify directory labels and assemble the class count report."""
    image_counts = Counter(
        Path(name).parts[0]
        for name in image_paths if len(Path(name).parts) > 1
    )
    class_rows: list[ReportRow] = []

    for class_name in class_names:
        plant_name, separator, condition = class_name.partition('___')
        if not separator:
            classification = 'unknown'
            problems.append({
                'path': class_name,
                'kind': 'unexpected_class_name',
                'detail': 'missing ___ separator',
            })
        elif condition.casefold() == 'healthy':
            classification = 'healthy'
        else:
            classification = 'diseased_or_pest'

        class_rows.append({
            'class': class_name,
            'image_count': image_counts[class_name],
            'classification': classification,
        })

    return class_rows


def inspect_images(
    image_paths: ImagePaths,
    problems: list[ReportRow],
) -> dict[str, list[str]]:
    """Hash images for duplicates and fully decode them with Pillow."""
    paths_by_hash: dict[str, list[str]] = defaultdict(list)
    for relative_name, image_path in image_paths.items():
        try:
            image_bytes = image_path.read_bytes()
        except OSError as error:
            problems.append({
                'path': relative_name,
                'kind': 'read_error',
                'detail': str(error),
            })
            continue

        image_hash = hashlib.sha256(image_bytes).hexdigest()
        paths_by_hash[image_hash].append(relative_name)
        try:
            with Image.open(BytesIO(image_bytes)) as image:
                image.verify()
            with Image.open(BytesIO(image_bytes)) as image:
                image.load()
        except (OSError, SyntaxError, ValueError) as error:
            problems.append({
                'path': relative_name,
                'kind': 'unreadable_image',
                'detail': str(error),
            })
    return paths_by_hash


def build_duplicate_rows(
    paths_by_hash: dict[str, list[str]],
) -> list[ReportRow]:
    """List files sharing a SHA-256 hash, including class conflicts."""
    duplicate_rows: list[ReportRow] = []

    for image_hash, relative_names in sorted(paths_by_hash.items()):
        if len(relative_names) < 2:
            continue

        class_names = {
            Path(relative_name).parts[0] for relative_name in relative_names
        }
        for relative_name in relative_names:
            duplicate_rows.append({
                'sha256': image_hash,
                'path': relative_name,
                'group_size': len(relative_names),
                'cross_class': len(class_names) > 1,
            })

    return duplicate_rows


def comparison_key(relative_name: str) -> str:
    """Normalize UUIDs and segmentation suffixes, preserving the class."""
    image_path = Path(relative_name)
    image_stem = image_path.stem
    possible_uuid, separator, original_stem = image_stem.partition('___')
    uuid_parts = possible_uuid.split('-')

    part_lengths = tuple(len(uuid_part) for uuid_part in uuid_parts)
    uuid_characters = ''.join(uuid_parts)
    has_uuid_prefix = (
        bool(separator)
        and part_lengths == UUID_PART_LENGTHS
        and all(character in HEX_DIGITS for character in uuid_characters)
    )
    if has_uuid_prefix:
        image_stem = original_stem

    if image_stem.endswith(SEGMENTED_SUFFIX):
        image_stem = image_stem[:-len(SEGMENTED_SUFFIX)]

    return (image_path.parent / image_stem.casefold()).as_posix()


def compare_exact_names(
    color_images: ImagePaths,
    segmented_images: ImagePaths,
) -> list[ReportRow]:
    """List relative filenames present in only one variant."""
    differences: list[ReportRow] = []
    for side, unique_names in (
        ('color_only', color_images.keys() - segmented_images.keys()),
        ('segmented_only', segmented_images.keys() - color_images.keys()),
    ):
        for relative_name in sorted(unique_names):
            differences.append({'side': side, 'path': relative_name})
    return differences


def compare_stems(
    color_images: ImagePaths,
    segmented_images: ImagePaths,
) -> list[ReportRow]:
    """Compare filename multiplicities while ignoring only extensions."""
    color_stems = Counter(
        str(Path(name).with_suffix('')) for name in color_images
    )
    segmented_stems = Counter(
        str(Path(name).with_suffix('')) for name in segmented_images
    )
    differences: list[ReportRow] = []

    for side, unmatched_stems in (
        ('color_only', color_stems - segmented_stems),
        ('segmented_only', segmented_stems - color_stems),
    ):
        for image_stem, image_count in sorted(unmatched_stems.items()):
            differences.append({
                'side': side,
                'class_and_stem': image_stem,
                'count': image_count,
            })
    return differences


def group_normalized_names(image_paths: ImagePaths) -> dict[str, list[str]]:
    """Group original names under their normalized comparison keys."""
    normalized_names: dict[str, list[str]] = defaultdict(list)
    for relative_name in image_paths:
        normalized_names[comparison_key(relative_name)].append(relative_name)
    return normalized_names


def compare_normalized_names(
    color_images: ImagePaths,
    segmented_images: ImagePaths,
) -> tuple[list[ReportRow], dict[str, int]]:
    """Compare normalized multiplicities and count ambiguous name groups."""
    color_names = group_normalized_names(color_images)
    segmented_names = group_normalized_names(segmented_images)
    differences: list[ReportRow] = []

    for normalized_name in sorted(color_names.keys() | segmented_names.keys()):
        color_paths = color_names.get(normalized_name, [])
        segmented_paths = segmented_names.get(normalized_name, [])
        if len(color_paths) != len(segmented_paths):
            differences.append({
                'comparison_key': normalized_name,
                'color_count': len(color_paths),
                'segmented_count': len(segmented_paths),
                'color_paths': json.dumps(color_paths),
                'segmented_paths': json.dumps(segmented_paths),
            })

    collisions = {
        'color': sum(len(names) > 1 for names in color_names.values()),
        'segmented': sum(len(names) > 1 for names in segmented_names.values()),
    }
    return differences, collisions


def build_summary(
    class_rows: list[ReportRow],
    color_images: ImagePaths,
    segmented_images: ImagePaths,
    color_problems: list[ReportRow],
    segmented_problems: list[ReportRow],
    duplicate_rows: list[ReportRow],
    comparisons: dict[str, list[ReportRow]],
    normalized_collisions: dict[str, int],
) -> dict[str, object]:
    """Aggregate audit totals using the existing report schema."""
    duplicate_groups: dict[str, list[ReportRow]] = defaultdict(list)
    for duplicate_row in duplicate_rows:
        duplicate_groups[str(duplicate_row['sha256'])].append(duplicate_row)

    healthy_rows = [
        row for row in class_rows if row['classification'] == 'healthy'
    ]
    return {
        'classes': len(class_rows),
        'color_images': len(color_images),
        'segmented_images': len(segmented_images),
        'healthy_classes': len(healthy_rows),
        'healthy_images': sum(int(row['image_count']) for row in healthy_rows),
        'color_problems': dict(
            Counter(problem['kind'] for problem in color_problems)
        ),
        'segmented_structure_problems': dict(
            Counter(problem['kind'] for problem in segmented_problems)
        ),
        'duplicate_groups': len(duplicate_groups),
        'files_in_duplicate_groups': len(duplicate_rows),
        'redundant_duplicate_files': (
            len(duplicate_rows) - len(duplicate_groups)
        ),
        'cross_class_duplicate_groups': sum(
            bool(group[0]['cross_class'])
            for group in duplicate_groups.values()
        ),
        'exact_name_differences': len(comparisons['filename_differences']),
        'stem_difference_count': len(comparisons['stem_differences']),
        'normalized_differences': comparisons['normalized_differences'],
        'normalized_collisions': normalized_collisions,
        'scope': (
            'Full decoding and SHA-256: color only. '
            'Segmented: structure and filenames only.'
        ),
        'decoder': 'Pillow',
        'classification_basis': (
            'class directory label; not a clinical assessment'
        ),
    }


def write_csv(
    report_path: Path,
    columns: list[str],
    rows: Iterable[ReportRow],
) -> None:
    """Write a UTF-8 CSV with a stable column order."""
    with report_path.open('w', encoding='utf-8', newline='') as report_stream:
        writer = csv.DictWriter(report_stream, fieldnames=columns)
        writer.writeheader()
        writer.writerows(rows)


def generate_reports(
    reports_directory: Path,
    class_rows: list[ReportRow],
    problem_rows: list[ReportRow],
    duplicate_rows: list[ReportRow],
    comparisons: dict[str, list[ReportRow]],
    summary: dict[str, object],
) -> None:
    """Save the seven audit reports with their original formats."""
    reports_directory.mkdir(parents=True, exist_ok=True)
    write_csv(
        reports_directory / 'classes.csv',
        ['class', 'image_count', 'classification'], class_rows,
    )
    write_csv(
        reports_directory / 'problems.csv',
        ['variant', 'path', 'kind', 'detail'], problem_rows,
    )
    write_csv(
        reports_directory / 'duplicates.csv',
        ['sha256', 'path', 'group_size', 'cross_class'], duplicate_rows,
    )

    comparison_columns = {
        'filename_differences': ['side', 'path'],
        'stem_differences': ['side', 'class_and_stem', 'count'],
        'normalized_differences': [
            'comparison_key', 'color_count', 'segmented_count',
            'color_paths', 'segmented_paths',
        ],
    }
    for report_name, columns in comparison_columns.items():
        write_csv(
            reports_directory / f'{report_name}.csv',
            columns, comparisons[report_name],
        )

    summary_text = json.dumps(summary, indent=2, ensure_ascii=False) + '\n'
    summary_path = reports_directory / 'summary.json'
    summary_path.write_text(summary_text, encoding='utf-8')


def run_audit(
    raw_directory: Path,
    reports_directory: Path,
) -> dict[str, object]:
    """Inspect, decode, compare, and report on local images."""
    class_names, color_images, color_problems = scan_dataset(
        raw_directory / 'color'
    )
    segmented_classes, segmented_images, segmented_problems = scan_dataset(
        raw_directory / 'segmented'
    )

    paths_by_hash = inspect_images(color_images, color_problems)
    class_rows = build_class_rows(class_names, color_images, color_problems)
    duplicate_rows = build_duplicate_rows(paths_by_hash)
    normalized_differences, normalized_collisions = compare_normalized_names(
        color_images, segmented_images
    )
    comparisons = {
        'filename_differences': compare_exact_names(
            color_images, segmented_images
        ),
        'stem_differences': compare_stems(color_images, segmented_images),
        'normalized_differences': normalized_differences,
    }
    summary = build_summary(
        class_rows, color_images, segmented_images, color_problems,
        segmented_problems, duplicate_rows, comparisons, normalized_collisions,
    )
    problem_rows = [
        dict(variant='color', **problem) for problem in color_problems
    ]
    problem_rows.extend(
        dict(variant='segmented', **problem) for problem in segmented_problems
    )
    generate_reports(
        reports_directory, class_rows, problem_rows,
        duplicate_rows, comparisons, summary,
    )
    return summary


def main() -> None:
    """Audit local images and write the existing CSV and JSON reports."""
    summary = run_audit(
        VISION_DIRECTORY / 'data/plantvillage/raw',
        VISION_DIRECTORY / 'reports/plantvillage',
    )
    print(json.dumps(summary, indent=2, ensure_ascii=False))


if __name__ == '__main__':
    main()
