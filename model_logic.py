
import torch
import clip
import numpy as np

def classify_image_clip(image):
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model, preprocess = clip.load("ViT-B/32", device=device)

    class_prompts = [
        "a bottle of gin", "a bottle of whisky", "a cocktail", "a coffee", "a dish", "a dessert"
    ]
    inputs = torch.cat([clip.tokenize(p) for p in class_prompts]).to(device)
    image_input = preprocess(image).unsqueeze(0).to(device)

    with torch.no_grad():
        logits_per_image, _ = model(image_input, inputs)
        probs = logits_per_image.softmax(dim=-1).cpu().numpy()[0]

    best = int(np.argmax(probs))
    return class_prompts[best], probs[best]

def generate_caption(label):
    captions = {
        "a bottle of gin": "クラフトジンで乾杯。",
        "a bottle of whisky": "芳醇なウイスキーをどうぞ。",
        "a cocktail": "美しいカクテルのひととき。",
        "a coffee": "ほっと一息、カフェタイム。",
        "a dish": "こだわりの料理をお楽しみください。",
        "a dessert": "甘くて幸せな時間を。"
    }
    return captions.get(label, "素敵な一品をどうぞ。")

def generate_hashtags(business, audience):
    base = ["#InstaFood", "#グルメ", "#おしゃれごはん"]
    if business == "バー":
        base += ["#BarTime", "#クラフトジン"]
    elif business == "カフェ":
        base += ["#CafeTime", "#カフェ巡り"]
    elif business == "レストラン":
        base += ["#レストランディナー", "#美食"]
    if audience == "インスタ好き":
        base += ["#映えグルメ", "#フォトジェニック"]
    elif audience == "外国人観光客":
        base += ["#VisitJapan", "#TokyoEats"]
    elif audience == "OL":
        base += ["#女子会ランチ", "#OLランチ"]
    return sorted(set(base))[:20]
