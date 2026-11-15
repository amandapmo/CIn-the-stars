import csv
from pathlib import Path

from ultralytics import YOLO


PROJECT_DIRECTORY = Path(__file__).resolve().parent
IMAGE_DIRECTORY = PROJECT_DIRECTORY / 'data/manual_validation'
MODEL_PATH = (
    PROJECT_DIRECTORY / 'runs/leaf_diseases_yolov8n_cls/weights/best.pt'
)
OUTPUT_DIRECTORY = PROJECT_DIRECTORY / 'runs/manual_validation'
IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.bmp', '.webp', '.tif', '.tiff'}


def predict_images() -> None:
    """Save visual suspicions from new photos, loading at most eight at once."""
    image_paths = sorted(
        path for path in IMAGE_DIRECTORY.iterdir()
        if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS
    )
    if not image_paths:
        print(f'Nenhuma imagem disponível em {IMAGE_DIRECTORY}')
        return

    model = YOLO(str(MODEL_PATH))
    OUTPUT_DIRECTORY.mkdir(parents=True, exist_ok=True)
    print('As previsões são suspeitas visuais, não diagnósticos confirmados.')
    with (OUTPUT_DIRECTORY / 'predictions.csv').open(
        'w', newline='', encoding='utf-8'
    ) as output_file:
        writer = csv.writer(output_file)
        writer.writerow(['filename', 'predicted_class', 'confidence'])
        for start in range(0, len(image_paths), 8):
            image_batch = image_paths[start:start + 8]
            results = model.predict(
                [str(path) for path in image_batch], device=0, batch=8,
                workers=0, imgsz=224, stream=True, save=False, verbose=False,
            )
            for result in results:
                filename = Path(result.path).name
                predicted_class = result.names[result.probs.top1]
                confidence = result.probs.top1conf.item()
                writer.writerow([filename, predicted_class, confidence])
                print(f'{filename}: {predicted_class} ({confidence:.2%})')


if __name__ == '__main__':
    predict_images()
