from PIL import Image
import io

def apply_composition_correction(image_bytes):
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    width, height = image.size
    new_width = int(width * 0.9)
    new_height = int(height * 0.9)
    left = (width - new_width) // 2
    top = (height - new_height) // 2
    right = left + new_width
    bottom = top + new_height

    cropped_image = image.crop((left, top, right, bottom))

    output = io.BytesIO()
    cropped_image.save(output, format="JPEG")
    output.seek(0)

    return output, cropped_image