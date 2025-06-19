# processor.py

from PIL import Image
import numpy as np
import io
import torchvision.transforms as transforms

# --- AI構図補正関数（トリミング・回転・比率変更） ---
def auto_compose_image(image: Image.Image) -> Image.Image:
    # PIL → Tensor変換
    transform_tensor = transforms.ToTensor()
    img_tensor = transform_tensor(image)

    # 基本情報
    orig_w, orig_h = image.size
    aspect_ratio = orig_w / orig_h

    # 中央寄せトリミング（1:1基準）
    target_ratio = 1.0
    if aspect_ratio > target_ratio:
        # 横長 → 左右をカット
        new_w = int(orig_h * target_ratio)
        left = (orig_w - new_w) // 2
        image = image.crop((left, 0, left + new_w, orig_h))
    elif aspect_ratio < target_ratio:
        # 縦長 → 上下をカット
        new_h = int(orig_w / target_ratio)
        top = (orig_h - new_h) // 2
        image = image.crop((0, top, orig_w, top + new_h))

    # 傾き補正（傾き検出は後で高度化）
    # 仮実装：傾きはないと仮定（将来的に回転角推定追加）

    # 最終サイズリサイズ（インスタ推奨：1080x1080）
    image = image.resize((1080, 1080))
    return image

# --- メイン加工関数 ---
def process_image(image: Image.Image) -> Image.Image:
    # 明るさ・コントラスト・シャープネス補正（プレースホルダ）
    image = image.convert("RGB")
    
    # 構図補正AI適用
    composed = auto_compose_image(image)

    return composed
