from PIL import Image, ImageEnhance
import io
import torch
import clip
import numpy as np

# ----------------------------
# 画像の加工処理
# ----------------------------
def process_image(image: Image.Image) -> Image.Image:
    """明るさ・コントラスト・シャープネスを調整した画像を返す"""
    image = ImageEnhance.Brightness(image).enhance(1.2)
    image = ImageEnhance.Contrast(image).enhance(1.3)
    image = ImageEnhance.Sharpness(image).enhance(2.0)
    return image

# ----------------------------
# CLIPモデルの読み込み
# ----------------------------
def load_clip_model():
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model, preprocess = clip.load("ViT-B/32", device=device)
    return model, preprocess, device

# ----------------------------
# CLIPによる画像ジャンル分類
# ----------------------------
def classify_image_clip(image: Image.Image):
    class_prompts = [
        "a bottle of gin", "a bottle of whisky", "a bottle of rum", "a bottle of sake",
        "a glass of wine", "a glass of beer", "a cocktail", "a bar counter",
        "a cup of coffee", "a slice of cake", "a bowl of ramen", "a sushi platter"
    ]
    model, preprocess, device = load_clip_model()
    inputs = torch.cat([clip.tokenize(c) for c in class_prompts]).to(device)
    image_input = preprocess(image).unsqueeze(0).to(device)

    with torch.no_grad():
        logits_per_image, _ = model(image_input, inputs)
        probs = logits_per_image.softmax(dim=-1).cpu().numpy()[0]

    best_idx = int(np.argmax(probs))
    return class_prompts[best_idx], probs[best_idx], class_prompts

# ----------------------------
# ジャンルに応じたキャプション生成
# ----------------------------
def generate_caption(label: str) -> str:
    phrases = {
        "a bottle of gin": "こだわりのクラフトジンで夜を彩る一杯を。",
        "a bottle of whisky": "芳醇な香りが広がるウイスキーをどうぞ。",
        "a bottle of rum": "深いコクが魅力のラムで乾杯。",
        "a bottle of sake": "日本の味をそのままに、純米酒のひととき。",
        "a glass of wine": "大人の夜を演出する赤ワインとともに。",
        "a glass of beer": "仕事終わりの一杯にぴったりなビール。",
        "a cocktail": "夜の時間にぴったりな一杯を。",
        "a bar counter": "静かな夜にしっとりと。",
        "a cup of coffee": "午後の休息に、ほっとひと息。",
        "a slice of cake": "甘い時間をお楽しみください。",
        "a bowl of ramen": "スープまで飲み干したくなる美味しさ。",
        "a sushi platter": "新鮮なネタが自慢の一貫をどうぞ。"
    }
    return phrases.get(label, "おすすめの一品をぜひご賞味ください！")

# ----------------------------
# ハッシュタグの自動生成
# ----------------------------
def generate_hashtags(business: str, audience: str):
    tags = ["#InstaFood", "#グルメ", "#食べスタグラム", "#おしゃれごはん"]
    if business == "カフェ": tags += ["#カフェ巡り", "#CafeTime"]
    if business == "居酒屋": tags += ["#居酒屋メシ", "#日本酒好き"]
    if business == "バー": tags += ["#BarTime", "#クラフトジン"]
    if business == "和食": tags += ["#和食", "#JapaneseCuisine"]
    if business == "洋食": tags += ["#洋食ランチ", "#WesternFood"]
    if business == "中華": tags += ["#中華料理", "#DimSum"]
    if audience == "インスタ好き": tags += ["#映えグルメ", "#フォトジェニック"]
    if audience == "外国人観光客": tags += ["#VisitJapan", "#TokyoFoodie"]
    if audience == "会社員": tags += ["#ランチタイム", "#お疲れ様です"]
    if audience == "シニア": tags += ["#落ち着いた時間", "#ゆっくりごはん"]
    if audience == "OL": tags += ["#女子会ごはん", "#OLランチ"]
    return sorted(set(tags))[:20]
