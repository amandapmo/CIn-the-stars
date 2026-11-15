import csv
import json
from pathlib import Path

import torch
from sklearn.metrics import classification_report
from torch.utils.data import DataLoader
from torchvision.datasets import ImageFolder
from ultralytics import YOLO
from ultralytics.data.augment import classify_transforms
from ultralytics.models.yolo.classify import ClassificationValidator


PROJECT_DIRECTORY = Path(__file__).resolve().parent
DATASET_DIRECTORY = PROJECT_DIRECTORY / 'data/plantvillage/processed'
MODEL_PATH = (
    PROJECT_DIRECTORY / 'runs/plantvillage_yolov8n_cls-3/weights/best.pt'
)
OUTPUT_DIRECTORY = PROJECT_DIRECTORY / 'runs/plantvillage_evaluation'


def collate_images(samples: list) -> dict[str, torch.Tensor]:
    return {
        'img': torch.stack([image for image, label in samples]),
        'cls': torch.tensor([label for image, label in samples]),
    }


def save_results(
    validator: ClassificationValidator,
    dataset: ImageFolder,
) -> None:
    class_names = dataset.classes
    targets = torch.cat(validator.targets).numpy()
    predictions = torch.cat(validator.pred)[:, 0].numpy()
    report = classification_report(
        targets, predictions, labels=range(len(class_names)),
        target_names=class_names, output_dict=True, zero_division=0,
    )
    summary = {
        'checkpoint': str(MODEL_PATH), 'split': 'test',
        'images': len(targets), 'classes': len(class_names),
        'top1_accuracy': float(validator.metrics.top1),
        'top5_accuracy': float(validator.metrics.top5),
        'classification_report': report,
    }
    (OUTPUT_DIRECTORY / 'summary.json').write_text(
        json.dumps(summary, indent=2) + '\n', encoding='utf-8'
    )
    with (OUTPUT_DIRECTORY / 'class_metrics.csv').open(
        'w', newline=''
    ) as file:
        writer = csv.writer(file)
        writer.writerow([
            'class', 'precision', 'recall', 'f1_score', 'support',
        ])
        for class_name in class_names:
            scores = report[class_name]
            writer.writerow([
                class_name, scores['precision'], scores['recall'],
                scores['f1-score'], int(scores['support']),
            ])
    with (OUTPUT_DIRECTORY / 'confusion_matrix.csv').open(
        'w', newline=''
    ) as file:
        writer = csv.writer(file)
        writer.writerow(['true_class', *class_names])
        matrix = validator.confusion_matrix.matrix.T.astype(int)
        writer.writerows(
            [class_name, *counts]
            for class_name, counts in zip(class_names, matrix)
        )
    with (OUTPUT_DIRECTORY / 'predictions.csv').open('w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(['path', 'true_class', 'predicted_class'])
        writer.writerows(
            [image_path, class_names[label], class_names[prediction]]
            for (image_path, label), prediction
            in zip(dataset.samples, predictions)
        )
    print(
        'Top-1:', summary['top1_accuracy'],
        'Top-5:', summary['top5_accuracy'],
    )
    print('Macro:', report['macro avg'])


def evaluate_model() -> None:
    model = YOLO(str(MODEL_PATH))
    dataset = ImageFolder(
        DATASET_DIRECTORY / 'test', transform=classify_transforms(size=224)
    )
    if dataset.classes != list(model.names.values()):
        raise ValueError('Test class order differs from the checkpoint labels')

    dataloader = DataLoader(
        dataset, batch_size=32, shuffle=False, num_workers=2,
        collate_fn=collate_images,
    )
    validator = ClassificationValidator(dataloader=dataloader, args={
        'data': str(DATASET_DIRECTORY), 'split': 'test', 'device': 0,
        'imgsz': 224, 'batch': 32, 'plots': True,
        'project': str(PROJECT_DIRECTORY / 'runs'),
        'name': OUTPUT_DIRECTORY.name, 'exist_ok': True,
    })
    validator(model=model.model)
    save_results(validator, dataset)


if __name__ == '__main__':
    evaluate_model()
