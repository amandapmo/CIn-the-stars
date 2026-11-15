"""Prepare a deduplicated, leaf-grouped PlantVillage classification dataset."""

import hashlib
import json
import random
import shutil
import urllib.request
from collections import Counter, defaultdict
from pathlib import Path

from analyze_plantvillage import IMAGE_EXTENSIONS, comparison_key, write_csv


VISION_DIRECTORY = Path(__file__).resolve().parents[1]
EXCLUDED_CLASSES = {
    'Blueberry___healthy', 'Raspberry___healthy', 'Soybean___healthy',
}
SPLIT_RATIOS = {'train': 0.70, 'val': 0.15, 'test': 0.15}
DEFAULT_SEED = 42
EXPECTED_CLASS_COUNT = 35
UPSTREAM_COMMIT = '7f7ecc7e1eaca78107e3affe7cb5abd9427e139a'
LEAF_MAP_URL = (
    'https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/'
    f'{UPSTREAM_COMMIT}/leaf-map.json'
)
METADATA_CLASS_ALIASES = {'Apple_Frogeye Spot': 'Apple___Black_rot'}

PREPARATION_LIMITATIONS = (
    (
        'No guarantee of physical leaf independence for images without '
        'complete metadata; visual near-duplicates are not detected.'
    ),
    (
        'UUID identifies an image, not necessarily a physical leaf. '
        'Numeric camera sequences are not treated as leaf IDs.'
    ),
    (
        'Official leaf IDs are scoped to their class; cross-class physical '
        'identity cannot be established from these metadata.'
    ),
    (
        'Apple_Frogeye Spot metadata is mapped to Apple___Black_rot; '
        'dataset class names are unchanged.'
    ),
    (
        'Split ratios are approximate because connected leaf groups '
        'are indivisible.'
    ),
    (
        'Pixel decoding belongs to the audit; preparation copies bytes '
        'without re-encoding or repeating content-integrity verification.'
    ),
)

ImageRecord = dict[str, str]
ReportRow = dict[str, str | int | float]


def hash_file(file_path: Path) -> str:
    """Calculate a file's SHA-256 without loading it entirely into memory."""
    digest = hashlib.sha256()
    with file_path.open('rb') as image_stream:
        for chunk in iter(lambda: image_stream.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def read_images(source_directory: Path) -> list[ImageRecord]:
    """Inventory original images and reject unexpected files or layout."""
    records: list[ImageRecord] = []
    for class_directory in sorted(source_directory.iterdir()):
        if class_directory.is_symlink() or not class_directory.is_dir():
            raise ValueError(f'Expected a class directory: {class_directory}')
        for image_path in sorted(class_directory.iterdir()):
            if (
                image_path.is_symlink()
                or not image_path.is_file()
                or image_path.suffix.lower() not in IMAGE_EXTENSIONS
            ):
                raise ValueError(f'Unexpected dataset entry: {image_path}')
            relative_path = image_path.relative_to(source_directory)
            records.append({
                'source_path': relative_path.as_posix(),
                'class': class_directory.name,
                'sha256': hash_file(image_path),
            })
        print(f'Inventoried {class_directory.name}', flush=True)
    return records


def load_leaf_map(metadata_path: Path) -> dict[str, list[str]]:
    """Read official leaf metadata, fetching it only when absent."""
    if not metadata_path.exists():
        with urllib.request.urlopen(LEAF_MAP_URL, timeout=60) as response:
            metadata_bytes = response.read()
        metadata_path.parent.mkdir(parents=True, exist_ok=True)
        with metadata_path.open('xb') as metadata_stream:
            metadata_stream.write(metadata_bytes)
    return json.loads(metadata_path.read_text(encoding='utf-8'))


def camera_name(relative_name: str) -> str:
    """Remove UUID, extension, segmentation suffix, and copy suffixes."""
    normalized_name = Path(comparison_key(relative_name)).name
    original_name, copy_marker, copy_number = normalized_name.rpartition(
        ' copy'
    )
    copy_number = copy_number.strip()
    if copy_marker and (not copy_number or copy_number.isdigit()):
        return original_name.strip()
    return normalized_name.strip()


def explicit_leaf_name(image_name: str) -> str:
    """Group explicit 'Leaf 259.1' and 'Leaf 259.2' under 'Leaf 259'."""
    name_prefix, leaf_marker, leaf_number = image_name.rpartition('leaf ')
    number_parts = leaf_number.split('.')
    has_leaf_number = all(part.isdigit() for part in number_parts)
    if leaf_marker and has_leaf_number:
        return f'{name_prefix}{leaf_marker}{number_parts[0]}'
    return image_name


def official_leaf_ids(
    image_name: str,
    class_name: str,
    leaf_map: dict[str, list[str]],
) -> list[str]:
    """Select all official leaf suggestions belonging to the image's class."""
    matching_ids = []
    for suggestion in leaf_map.get(image_name, []):
        metadata_class, separator, leaf_number = suggestion.partition(':::')
        metadata_class = METADATA_CLASS_ALIASES.get(
            metadata_class, metadata_class
        )
        if separator and metadata_class == class_name:
            matching_ids.append(f'{metadata_class}:::{leaf_number}')
    return sorted(set(matching_ids))


def find_group(group_parents: dict[str, str], group_key: str) -> str:
    """Find a connected group's representative, shortening future lookups."""
    group_parents.setdefault(group_key, group_key)
    root_key = group_key
    while group_parents[root_key] != root_key:
        root_key = group_parents[root_key]
    while group_parents[group_key] != group_key:
        parent_key = group_parents[group_key]
        group_parents[group_key] = root_key
        group_key = parent_key
    return root_key


def group_images(
    records: list[ImageRecord],
    leaf_map: dict[str, list[str]],
) -> None:
    """Join transitive leaf, camera-name, explicit-leaf, and hash evidence."""
    group_parents: dict[str, str] = {}
    for record in records:
        image_name = camera_name(record['source_path'])
        class_name = record['class']
        leaf_ids = official_leaf_ids(image_name, class_name, leaf_map)
        group_keys = [
            f'camera:{class_name}/{image_name}',
            f'filename_leaf:{class_name}/{explicit_leaf_name(image_name)}',
            f'hash:{record["sha256"]}',
        ]
        group_keys.extend(f'official:{leaf_id}' for leaf_id in leaf_ids)
        first_root = find_group(group_parents, group_keys[0])
        for group_key in group_keys[1:]:
            other_root = find_group(group_parents, group_key)
            if first_root != other_root:
                group_parents[other_root] = first_root
        record['camera_name'] = image_name
        record['filename_leaf'] = explicit_leaf_name(image_name)
        record['official_leaf_ids'] = json.dumps(leaf_ids)
        record['grouping_method'] = (
            'official_metadata' if leaf_ids else 'filename_fallback'
        )
        record['group_id'] = group_keys[0]

    for record in records:
        record['group_id'] = find_group(group_parents, record['group_id'])


def remove_duplicates(
    records: list[ImageRecord],
) -> tuple[list[ImageRecord], list[ReportRow]]:
    """Keep the first sorted path per hash and record every discarded copy."""
    kept_by_hash: dict[str, ImageRecord] = {}
    duplicate_rows: list[ReportRow] = []
    for record in records:
        kept_record = kept_by_hash.get(record['sha256'])
        if kept_record is None:
            kept_by_hash[record['sha256']] = record
            continue
        if kept_record['class'] != record['class']:
            raise ValueError(
                'Duplicate content has conflicting classes: '
                f'{record["source_path"]}'
            )
        duplicate_rows.append({
            'sha256': record['sha256'],
            'class': record['class'],
            'kept_path': kept_record['source_path'],
            'discarded_path': record['source_path'],
        })
    return list(kept_by_hash.values()), duplicate_rows


def assign_splits(records: list[ImageRecord], seed: int) -> None:
    """Assign indivisible groups to approximate 70/15/15 within each class."""
    groups: dict[str, list[ImageRecord]] = defaultdict(list)
    for record in records:
        groups[record['group_id']].append(record)

    groups_by_class: dict[str, list[list[ImageRecord]]] = defaultdict(list)
    for group_records in groups.values():
        class_names = {record['class'] for record in group_records}
        if len(class_names) != 1:
            raise ValueError(
                'A connected leaf group spans classes; refusing to split it'
            )
        groups_by_class[group_records[0]['class']].append(group_records)

    random_generator = random.Random(seed)
    for class_name in sorted(groups_by_class):
        class_groups = sorted(
            groups_by_class[class_name],
            key=lambda group: group[0]['source_path'],
        )
        random_generator.shuffle(class_groups)
        class_groups.sort(key=len, reverse=True)
        class_total = sum(len(group) for group in class_groups)
        split_counts = dict.fromkeys(SPLIT_RATIOS, 0)

        for group_records in class_groups:
            chosen_split = min(
                SPLIT_RATIOS,
                key=lambda split_name: (
                    (split_counts[split_name] + len(group_records))
                    / (class_total * SPLIT_RATIOS[split_name])
                ),
            )
            split_counts[chosen_split] += len(group_records)
            for record in group_records:
                record['split'] = chosen_split
                destination_path = Path(chosen_split) / record['source_path']
                record['destination_path'] = destination_path.as_posix()


def ensure_empty_destination(destination_directory: Path) -> None:
    """Refuse to overwrite any existing processed dataset or symbolic link."""
    if destination_directory.is_symlink():
        raise ValueError('The processed directory must not be a symbolic link')
    if not destination_directory.exists():
        return
    if (
        not destination_directory.is_dir()
        or any(destination_directory.iterdir())
    ):
        raise ValueError(
            f'Processed destination is not empty: {destination_directory}'
        )


def copy_images(
    records: list[ImageRecord],
    source_directory: Path,
    destination_directory: Path,
) -> None:
    """Copy image bytes to new files, preserving every original filename."""
    class_names = sorted({record['class'] for record in records})
    for split_name in SPLIT_RATIOS:
        for class_name in class_names:
            class_directory = destination_directory / split_name / class_name
            class_directory.mkdir(parents=True, exist_ok=True)
    for image_number, record in enumerate(records, start=1):
        source_path = source_directory / record['source_path']
        destination_path = destination_directory / record['destination_path']
        with (
            source_path.open('rb') as source_stream,
            destination_path.open('xb') as destination_stream,
        ):
            shutil.copyfileobj(source_stream, destination_stream)
        if image_number % 5000 == 0:
            print(f'Copied {image_number}/{len(records)} images', flush=True)


def validate_splits(records: list[ImageRecord]) -> dict[str, object]:
    """Check the selected classes and indivisible leaf groups."""
    class_names = {record['class'] for record in records}
    if (
        len(class_names) != EXPECTED_CLASS_COUNT
        or class_names & EXCLUDED_CLASSES
    ):
        raise ValueError('Expected the 35 selected classes')

    group_splits: dict[str, set[str]] = defaultdict(set)
    for record in records:
        group_splits[record['group_id']].add(record['split'])
    if any(len(splits) > 1 for splits in group_splits.values()):
        raise ValueError('A leaf group appears in multiple splits')

    class_split_counts = Counter(
        (record['class'], record['split']) for record in records
    )
    return {
        'class_count': len(class_names),
        'known_leaf_groups_crossing_splits': 0,
        'empty_class_splits': [
            f'{split_name}/{class_name}'
            for split_name in SPLIT_RATIOS
            for class_name in sorted(class_names)
            if not class_split_counts[(class_name, split_name)]
        ],
        'physical_leaf_identity_guaranteed_for_all_images': False,
    }


def build_preparation_class_rows(
    original_records: list[ImageRecord],
    records: list[ImageRecord],
    duplicate_rows: list[ReportRow],
) -> list[ReportRow]:
    """Summarize class counts, group coverage, and effective split ratios."""
    original_counts = Counter(record['class'] for record in original_records)
    duplicate_counts = Counter(str(row['class']) for row in duplicate_rows)
    records_by_class: dict[str, list[ImageRecord]] = defaultdict(list)
    for record in records:
        records_by_class[record['class']].append(record)

    class_rows: list[ReportRow] = []
    for class_name, class_records in sorted(records_by_class.items()):
        class_total = len(class_records)
        official_count = sum(
            record['grouping_method'] == 'official_metadata'
            for record in class_records
        )
        fallback_count = sum(
            record['grouping_method'] == 'filename_fallback'
            for record in class_records
        )
        leaf_group_ids = {record['group_id'] for record in class_records}
        split_counts = Counter(record['split'] for record in class_records)
        class_row: ReportRow = {
            'class': class_name,
            'original_images': original_counts[class_name],
            'duplicates_discarded': duplicate_counts[class_name],
            'processed_images': class_total,
            'leaf_groups': len(leaf_group_ids),
            'official_metadata_images': official_count,
            'filename_fallback_images': fallback_count,
        }
        for split_name in SPLIT_RATIOS:
            class_row[split_name] = split_counts[split_name]
            class_row[f'{split_name}_ratio'] = (
                split_counts[split_name] / class_total
            )
        class_rows.append(class_row)

    return class_rows


def build_preparation_summary(
    original_records: list[ImageRecord],
    selected_records: list[ImageRecord],
    records: list[ImageRecord],
    duplicate_rows: list[ReportRow],
    validation: dict[str, object],
    seed: int,
) -> dict[str, object]:
    """Assemble preparation totals, provenance, and scientific limitations."""
    original_counts = Counter(record['class'] for record in original_records)
    split_counts = Counter(record['split'] for record in records)
    fallback_count = sum(
        record['grouping_method'] == 'filename_fallback' for record in records
    )
    excluded_count = len(original_records) - len(selected_records)
    processed_total = len(records)
    accounted_total = excluded_count + len(duplicate_rows) + processed_total
    if len(original_records) != accounted_total:
        raise ValueError('Preparation totals do not reconcile')

    warnings = [
        f'{fallback_count} retained images lack matching official leaf '
        'IDs; filename grouping is a heuristic.'
    ]
    warnings.extend(PREPARATION_LIMITATIONS)
    if validation['empty_class_splits']:
        warnings.append(
            'Empty class/split combinations: '
            f'{validation["empty_class_splits"]}'
        )

    return {
        'seed': seed,
        'original_images': len(original_records),
        'excluded_classes': {
            class_name: original_counts[class_name]
            for class_name in sorted(EXCLUDED_CLASSES)
        },
        'excluded_class_images': excluded_count,
        'duplicate_images_discarded': len(duplicate_rows),
        'processed_images': processed_total,
        'processed_classes': len({record['class'] for record in records}),
        'target_ratios': SPLIT_RATIOS,
        'split_counts': {
            split_name: split_counts[split_name] for split_name in SPLIT_RATIOS
        },
        'effective_ratios': {
            split_name: split_counts[split_name] / processed_total
            for split_name in SPLIT_RATIOS
        },
        'grouping_method': (
            'Connected components of class-scoped official leaf IDs, '
            'normalized camera names, explicit Leaf numbers, and SHA-256; '
            'whole groups assigned by class.'
        ),
        'split_method': (
            'Seeded shuffle, stable largest-group-first ordering, then '
            'lowest projected target-relative occupancy.'
        ),
        'leaf_groups': len({record['group_id'] for record in records}),
        'official_metadata_images': processed_total - fallback_count,
        'filename_fallback_images': fallback_count,
        'metadata': {
            'url': LEAF_MAP_URL,
            'commit': UPSTREAM_COMMIT,
        },
        'validation': validation,
        'warnings': warnings,
    }


def generate_reports(
    reports_directory: Path,
    original_records: list[ImageRecord],
    selected_records: list[ImageRecord],
    records: list[ImageRecord],
    duplicate_rows: list[ReportRow],
    validation: dict[str, object],
    seed: int,
) -> dict[str, object]:
    """Write class statistics, duplicates, the manifest, and the summary."""
    class_rows = build_preparation_class_rows(
        original_records, records, duplicate_rows
    )
    summary = build_preparation_summary(
        original_records, selected_records, records,
        duplicate_rows, validation, seed,
    )
    excluded_rows = [
        {'class': class_name, 'image_count': image_count}
        for class_name, image_count in summary['excluded_classes'].items()
    ]

    reports_directory.mkdir(parents=True, exist_ok=True)
    write_csv(
        reports_directory / 'prepared_classes.csv',
        list(class_rows[0]), class_rows,
    )
    write_csv(
        reports_directory / 'prepared_duplicates.csv',
        ['sha256', 'class', 'kept_path', 'discarded_path'], duplicate_rows,
    )
    write_csv(
        reports_directory / 'prepared_manifest.csv', list(records[0]), records,
    )
    write_csv(
        reports_directory / 'prepared_excluded_classes.csv',
        ['class', 'image_count'], excluded_rows,
    )
    summary_path = reports_directory / 'prepared_summary.json'
    summary_text = json.dumps(summary, indent=2, ensure_ascii=False) + '\n'
    summary_path.write_text(summary_text, encoding='utf-8')
    return summary


def prepare_dataset(
    source_directory: Path,
    destination_directory: Path,
    metadata_path: Path,
    reports_directory: Path,
    seed: int = DEFAULT_SEED,
) -> dict[str, object]:
    """Filter, group, deduplicate, split, and copy the selected images."""
    ensure_empty_destination(destination_directory)
    original_records = read_images(source_directory)
    selected_records = [
        record for record in original_records
        if record['class'] not in EXCLUDED_CLASSES
    ]
    group_images(selected_records, load_leaf_map(metadata_path))
    records, duplicate_rows = remove_duplicates(selected_records)
    assign_splits(records, seed)
    validation = validate_splits(records)
    copy_images(records, source_directory, destination_directory)
    return generate_reports(
        reports_directory, original_records, selected_records,
        records, duplicate_rows, validation, seed,
    )


def main() -> None:
    summary = prepare_dataset(
        VISION_DIRECTORY / 'data/plantvillage/raw/color',
        VISION_DIRECTORY / 'data/plantvillage/processed',
        VISION_DIRECTORY / 'data/plantvillage/metadata/leaf-map.json',
        VISION_DIRECTORY / 'reports/plantvillage',
    )
    print(json.dumps(summary, indent=2, ensure_ascii=False))


if __name__ == '__main__':
    main()
