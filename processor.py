
from PIL import Image, ImageEnhance
import io

def process_images(files):
    results = []
    for file in files:
        image = Image.open(file).convert("RGB")
        image = ImageEnhance.Brightness(image).enhance(1.2)
        image = ImageEnhance.Contrast(image).enhance(1.3)
        image = ImageEnhance.Sharpness(image).enhance(2.0)
        results.append((file.name, image))
    return results
