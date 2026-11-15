from pathlib import Path

from ultralytics import YOLO


PROJECT_DIRECTORY = Path(__file__).resolve().parent
DATASET_DIRECTORY = PROJECT_DIRECTORY / 'data/leaf_diseases'
MODEL_PATH = (
    PROJECT_DIRECTORY / 'runs/plantvillage_yolov8n_cls-3/weights/best.pt'
)


def train_model() -> None:
    model = YOLO(str(MODEL_PATH))
    model.train(
        data=str(DATASET_DIRECTORY),
        epochs=50,
        imgsz=224,
        batch=8,
        patience=10,
        seed=42,
        device=0,
        workers=0,
        cache=False,
        optimizer='AdamW',
        lr0=0.0001,
        pretrained=True,
        resume=False,
        deterministic=True,
        split='val',
        project=str(PROJECT_DIRECTORY / 'runs'),
        name='leaf_diseases_yolov8n_cls',
        exist_ok=False,
    )


if __name__ == '__main__':
    train_model()
