import csv
import json
from pathlib import Path

import torch
from sklearn.metrics import accuracy_score, classification_report
from torch.utils.data import DataLoader
from torchvision.datasets import ImageFolder
from ultralytics import YOLO
from ultralytics.data.augment import classify_transforms
from ultralytics.models.yolo.classify import ClassificationValidator

from evaluate import collate_images


PROJECT_DIRECTORY = Path(__file__).resolve().parent
DATASET_DIRECTORY = PROJECT_DIRECTORY / 'data/leaf_diseases'
MODEL_PATH = (
    PROJECT_DIRECTORY / 'runs/leaf_diseases_yolov8n_cls/weights/best.pt'
)
OUTPUT_DIRECTORY = PROJECT_DIRECTORY / 'runs/leaf_diseases_evaluation'


def save_results(
    validator: ClassificationValidator,
    dataset: ImageFolder,
) -> None:
    targets = torch.cat(validator.targets).numpy()
    predictions = torch.cat(validator.pred)[:, 0].numpy()
    class_names = dataset.classes
    report = classification_report(
        targets, predictions, labels=range(len(class_names)),
        target_names=class_names, output_dict=True, zero_division=0,
    )
    records = [
        {
            'path': image_path,
            'crop': Path(image_path).name.split('___', 1)[0],
            'true_class': class_names[label],
            'predicted_class': class_names[prediction],
        }
        for (image_path, label), prediction
        in zip(dataset.samples, predictions)
    ]
    crop_metrics = []
    for crop in sorted({record['crop'] for record in records}):
        crop_records = [record for record in records if record['crop'] == crop]
        correct = sum(record['true_class'] == record['predicted_class']
                      for record in crop_records)
        crop_metrics.append({
            'crop': crop, 'images': len(crop_records),
            'correct': correct, 'errors': len(crop_records) - correct,
            'accuracy': correct / len(crop_records),
        })
    correct = int((targets == predictions).sum())
    summary = {
        'checkpoint': str(MODEL_PATH), 'split': 'test', 'images': len(targets),
        'top1_accuracy': accuracy_score(targets, predictions),
        'correct': correct, 'errors': len(targets) - correct,
        'classification_report': report, 'by_crop': crop_metrics,
        'limitation': (
            'The source checkpoint was pretrained on PlantVillage. '
            'This is not a fully independent test or evidence of '
            'generalization to unseen species.'
        ),
    }
    (OUTPUT_DIRECTORY / 'summary.json').write_text(
        json.dumps(summary, indent=2) + '\n', encoding='utf-8'
    )
    class_metrics = [dict(class_name=name, **report[name])
                     for name in class_names]
    for filename, rows in [('class_metrics', class_metrics),
                           ('crop_metrics', crop_metrics),
                           ('predictions', records)]:
        with (OUTPUT_DIRECTORY / f'{filename}.csv').open(
            'w', newline=''
        ) as file:
            writer = csv.DictWriter(file, fieldnames=list(rows[0]))
            writer.writeheader()
            writer.writerows(rows)
    with (OUTPUT_DIRECTORY / 'confusion_matrix.csv').open(
        'w', newline=''
    ) as file:
        writer = csv.writer(file)
        writer.writerow(['true_class', *class_names])
        matrix = validator.confusion_matrix.matrix.T.astype(int)
        writer.writerows([name, *counts]
                         for name, counts in zip(class_names, matrix))
    print(json.dumps(summary, indent=2))


def evaluate_model() -> None:
    model = YOLO(str(MODEL_PATH))
    dataset = ImageFolder(
        DATASET_DIRECTORY / 'test', transform=classify_transforms(size=224)
    )
    if dataset.classes != list(model.names.values()):
        raise ValueError('Test class order differs from the checkpoint labels')
    dataloader = DataLoader(
        dataset, batch_size=8, shuffle=False, num_workers=0,
        collate_fn=collate_images,
    )
    validator = ClassificationValidator(dataloader=dataloader, args={
        'data': str(DATASET_DIRECTORY), 'split': 'test', 'device': 0,
        'imgsz': 224, 'batch': 8, 'workers': 0, 'plots': True,
        'project': str(PROJECT_DIRECTORY / 'runs'),
        'name': OUTPUT_DIRECTORY.name, 'exist_ok': True,
    })
    validator(model=model.model)
    save_results(validator, dataset)


if __name__ == '__main__':
    evaluate_model()
