
from PIL import Image

def auto_crop_and_rotate(image: Image.Image) -> (Image.Image, str):
    # 仮の構図補正処理：少し回転し、周囲をトリミング
    rotated = image.rotate(-1.5, expand=True)
    cropped = rotated.crop((10, 10, rotated.width - 10, rotated.height - 10))
    message = "構図補正を実行しました：回転 -1.5度、トリミング 10px"
    return cropped, message
