import csv
import shutil
from collections import Counter
from pathlib import Path


PROJECT_DIRECTORY = Path(__file__).resolve().parents[1]
SOURCE_DIRECTORY = PROJECT_DIRECTORY / 'data/plantvillage/processed'
OUTPUT_DIRECTORY = PROJECT_DIRECTORY / 'data/leaf_diseases'
MANIFEST_PATH = (
    PROJECT_DIRECTORY / 'reports/plantvillage/prepared_manifest.csv'
)
SPLITS = ('train', 'val', 'test')
CLASS_MAPPING = {
    'Tomato___Late_blight': 'late_blight',
    'Potato___Late_blight': 'late_blight',
    'Tomato___Early_blight': 'early_blight',
    'Potato___Early_blight': 'early_blight',
    'Tomato___Bacterial_spot': 'bacterial_spot_solanaceae',
    'Pepper,_bell___Bacterial_spot': 'bacterial_spot_solanaceae',
    'Tomato___healthy': 'healthy',
    'Potato___healthy': 'healthy',
    'Pepper,_bell___healthy': 'healthy',
}


def select_images() -> list[dict]:
    """Match selected source files to the existing split and leaf manifest."""
    with MANIFEST_PATH.open(newline='', encoding='utf-8') as manifest_file:
        records = [
            row for row in csv.DictReader(manifest_file)
            if row['class'] in CLASS_MAPPING
        ]
    source_paths = {
        path.relative_to(SOURCE_DIRECTORY).as_posix()
        for split in SPLITS
        for class_name in CLASS_MAPPING
        for path in (SOURCE_DIRECTORY / split / class_name).iterdir()
        if path.is_file()
    }
    manifest_paths = {record['destination_path'] for record in records}
    if source_paths != manifest_paths:
        raise ValueError('Selected files do not match the existing manifest')

    group_splits = {}
    hash_assignments = {}
    selected_records = []
    for record in records:
        split = record['split']
        if Path(record['destination_path']).parts[0] != split:
            raise ValueError('Manifest path and split disagree')
        group_id = record['group_id']
        if group_splits.setdefault(group_id, split) != split:
            raise ValueError('A recorded leaf group crosses dataset splits')

        assignment = (split, CLASS_MAPPING[record['class']])
        previous = hash_assignments.get(record['sha256'])
        if previous is not None:
            if previous != assignment:
                raise ValueError(
                    'Duplicate content has conflicting assignments'
                )
            continue
        hash_assignments[record['sha256']] = assignment
        selected_records.append(record)

    fallback_count = sum(
        record['grouping_method'] != 'official_metadata'
        for record in selected_records
    )
    print('No cross-split groups or hashes found in the selected metadata.')
    print(f'{fallback_count} images lack matching official leaf metadata.')
    print('Manifest hashes are used; current image bytes are not rehashed.')
    print('Physical leaf independence and visual uniqueness are not proven.')
    return selected_records


def prepare_dataset() -> None:
    """Copy the selected classes while retaining every existing split."""
    if OUTPUT_DIRECTORY.exists() and any(OUTPUT_DIRECTORY.iterdir()):
        raise FileExistsError(f'Destination is not empty: {OUTPUT_DIRECTORY}')
    records = select_images()
    target_classes = sorted(set(CLASS_MAPPING.values()))
    for split in SPLITS:
        for class_name in target_classes:
            (OUTPUT_DIRECTORY / split / class_name).mkdir(
                parents=True, exist_ok=True
            )

    counts = Counter()
    for record in records:
        source_path = SOURCE_DIRECTORY / record['destination_path']
        class_name = CLASS_MAPPING[record['class']]
        filename = f"{record['class']}__{source_path.name}"
        destination = (
            OUTPUT_DIRECTORY / record['split'] / class_name / filename
        )
        shutil.copy2(source_path, destination)
        counts[(class_name, record['split'])] += 1

    print(f'\n{"Class":30} {"train":>7} {"val":>7} {"test":>7} {"total":>7}')
    for class_name in target_classes:
        split_counts = [counts[(class_name, split)] for split in SPLITS]
        print(f'{class_name:30}', *(f'{count:7}' for count in split_counts),
              f'{sum(split_counts):7}')
    print(f'Total: {len(records)} images. Output: {OUTPUT_DIRECTORY}')
    print('The previous checkpoint has already seen these training species.')


if __name__ == '__main__':
    prepare_dataset()
