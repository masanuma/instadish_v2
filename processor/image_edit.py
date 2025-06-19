
from PIL import Image
import io

def apply_composition_correction(image_bytes):
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    width, height = image.size
    crop_margin = 0.05
    left = int(width * crop_margin)
    top = int(height * crop_margin)
    right = int(width * (1 - crop_margin))
    bottom = int(height * (1 - crop_margin))
    cropped = image.crop((left, top, right, bottom))
    return cropped, "構図補正を実施しました（トリミング）"
