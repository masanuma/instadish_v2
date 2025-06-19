from PIL import Image
import io

def apply_composition_correction(image_bytes):
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    # 仮の処理（何もしていない）
    return image, {}
