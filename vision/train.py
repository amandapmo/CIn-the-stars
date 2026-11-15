from pathlib import Path

from ultralytics import YOLO


PROJECT_DIRECTORY = Path(__file__).resolve().parent
DATASET_DIRECTORY = PROJECT_DIRECTORY / 'data' / 'plantvillage' / 'processed'
MODEL_PATH = PROJECT_DIRECTORY / 'models' / 'yolov8n-cls.pt'
RESULTS_DIRECTORY = PROJECT_DIRECTORY / 'runs'


def train_model() -> None:
    model = YOLO(str(MODEL_PATH))
    model.train(
        data=str(DATASET_DIRECTORY),
        epochs=50,
        imgsz=224,
        batch=16,
        patience=10,
        seed=42,
        device=0,
        workers=2,
        split='val',
        project=str(RESULTS_DIRECTORY),
        name='plantvillage_yolov8n_cls',
    )



if __name__ == '__main__':
    train_model()
