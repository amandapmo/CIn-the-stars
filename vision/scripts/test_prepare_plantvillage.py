import unittest

from prepare_plantvillage import (
    assign_splits,
    camera_name,
    explicit_leaf_name,
    group_images,
    remove_duplicates,
)


def image_record(
    filename: str,
    digest: str,
    class_name: str = 'Plant___healthy',
) -> dict[str, str]:
    return {
        'source_path': f'{class_name}/{filename}',
        'class': class_name,
        'sha256': digest,
    }


class PreparationTests(unittest.TestCase):
    """Guard against leaf leakage and conflicting duplicate labels."""

    def test_filename_normalization(self) -> None:
        filename = (
            'Plant___healthy/12345678-abcd-1234-abcd-123456789abc'
            '___GH_HL Leaf 259.1 copy 2.JPG'
        )
        self.assertEqual(camera_name(filename), 'gh_hl leaf 259.1')
        self.assertEqual(
            explicit_leaf_name(camera_name(filename)), 'gh_hl leaf 259'
        )
        self.assertEqual(
            camera_name('Plant___healthy/copyright.jpg'), 'copyright'
        )
        self.assertEqual(explicit_leaf_name('camera 259.1'), 'camera 259.1')

    def test_transitive_metadata_and_duplicate_evidence(self) -> None:
        records = [
            image_record('first.jpg', 'same_hash'),
            image_record('second.jpg', 'same_hash'),
            image_record('third.jpg', 'different_hash'),
        ]
        leaf_map = {
            'first': ['Plant___healthy:::1'],
            'second': ['Plant___healthy:::2'],
            'third': ['Plant___healthy:::2'],
        }
        group_images(records, leaf_map)
        retained, duplicates = remove_duplicates(records)
        self.assertEqual(len(retained), 2)
        self.assertEqual(duplicates[0]['kept_path'], records[0]['source_path'])
        self.assertEqual(len({record['group_id'] for record in records}), 1)
        assign_splits(retained, 42)
        self.assertEqual(len({record['split'] for record in retained}), 1)

    def test_classes_scope_metadata_and_detect_hash_conflicts(self) -> None:
        records = [
            image_record('leaf.jpg', 'first', 'First___healthy'),
            image_record('leaf.jpg', 'second', 'Second___healthy'),
        ]
        leaf_map = {'leaf': ['First___healthy:::1', 'Second___healthy:::1']}
        group_images(records, leaf_map)
        self.assertNotEqual(records[0]['group_id'], records[1]['group_id'])
        records[1]['sha256'] = records[0]['sha256']
        with self.assertRaisesRegex(ValueError, 'conflicting classes'):
            remove_duplicates(records)

    def test_seed_reproducibility_and_group_integrity(self) -> None:
        records = [
            image_record(
                f'Leaf {leaf_number}.{view_number}.jpg',
                f'{leaf_number}-{view_number}',
            )
            for leaf_number in range(30) for view_number in range(2)
        ]
        group_images(records, {})
        assign_splits(records, 42)
        first_assignment = [record['split'] for record in records]
        assign_splits(records, 42)
        self.assertEqual(
            first_assignment, [record['split'] for record in records]
        )
        self.assertEqual(
            {record['split'] for record in records}, {'train', 'val', 'test'}
        )
        group_splits: dict[str, set[str]] = {}
        for record in records:
            group_id = record['group_id']
            group_splits.setdefault(group_id, set()).add(record['split'])
        self.assertTrue(
            all(len(splits) == 1 for splits in group_splits.values())
        )


if __name__ == '__main__':
    unittest.main()
