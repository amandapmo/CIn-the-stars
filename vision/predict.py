import csv
import random
from pathlib import Path
from textwrap import fill

import matplotlib.pyplot as plt
from ultralytics import YOLO


PROJECT_DIRECTORY = Path(__file__).resolve().parent
TEST_DIRECTORY = PROJECT_DIRECTORY / 'data/plantvillage/processed/test'
MODEL_PATH = (
    PROJECT_DIRECTORY / 'runs/plantvillage_yolov8n_cls-3/weights/best.pt'
)
OUTPUT_DIRECTORY = PROJECT_DIRECTORY / 'runs/plantvillage_predictions'
EVALUATION_PATH = (
    PROJECT_DIRECTORY / 'runs/plantvillage_evaluation/predictions.csv'
)


def select_samples() -> list[Path]:
    random_generator = random.Random(42)
    image_paths = [
        random_generator.choice(sorted(class_directory.iterdir()))
        for class_directory in sorted(TEST_DIRECTORY.iterdir())
        if class_directory.is_dir()
    ]
    with EVALUATION_PATH.open() as file:
        errors = [
            row for row in csv.DictReader(file)
            if row['true_class'] != row['predicted_class']
        ]
    error_examples = random_generator.sample(errors, min(5, len(errors)))
    image_paths.extend(Path(row['path']) for row in error_examples)
    return list(dict.fromkeys(image_paths))


def predict_samples() -> None:
    model = YOLO(str(MODEL_PATH))
    image_paths = select_samples()
    OUTPUT_DIRECTORY.mkdir(parents=True, exist_ok=True)
    grid_rows = (len(image_paths) + 4) // 5
    figure, axes = plt.subplots(grid_rows, 5, figsize=(20, 4 * grid_rows))
    for axis in axes.flat:
        axis.axis('off')

    results = model.predict(
        [str(path) for path in image_paths], device=0, imgsz=224,
        batch=16, stream=True, verbose=False,
    )
    with (OUTPUT_DIRECTORY / 'predictions.csv').open('w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow([
            'path', 'true_class', 'predicted_class', 'confidence', 'correct',
        ])
        for index, (result, axis) in enumerate(zip(results, axes.flat)):
            true_class = Path(result.path).parent.name
            predicted_class = result.names[result.probs.top1]
            confidence = result.probs.top1conf.item()
            correct = true_class == predicted_class
            status = 'CORRECT' if correct else 'ERROR'
            writer.writerow([
                result.path, true_class, predicted_class, confidence, correct,
            ])
            result.save(filename=str(OUTPUT_DIRECTORY / f'{index:02d}.jpg'))
            axis.imshow(result.orig_img[:, :, ::-1])
            axis.set_title(
                fill(f'True: {true_class}', 32) + '\n'
                + fill(f'Pred: {predicted_class}', 32)
                + f'\n{confidence:.2%} | {status}',
                fontsize=8, color='green' if correct else 'red',
            )
            print(true_class, '->', predicted_class,
                  f'{confidence:.2%}', status)

    figure.tight_layout()
    figure.savefig(OUTPUT_DIRECTORY / 'predictions_grid.jpg', dpi=150)
    plt.close(figure)


if __name__ == '__main__':
    predict_samples()
