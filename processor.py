from PIL import Image
import numpy as np
import cv2
import io

def process_image(pil_image):
    # PIL → OpenCV
    cv_image = np.array(pil_image)
    cv_image = cv2.cvtColor(cv_image, cv2.COLOR_RGB2BGR)

    # グレースケール変換
    gray = cv2.cvtColor(cv_image, cv2.COLOR_BGR2GRAY)
    # 二値化
    _, thresh = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY_INV)

    # 最大の輪郭を取得（被写体と思われる）
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if contours:
        cnt = max(contours, key=cv2.contourArea)
        x, y, w, h = cv2.boundingRect(cnt)

        # 少し余白を追加
        pad = 20
        x = max(x - pad, 0)
        y = max(y - pad, 0)
        w = min(w + pad * 2, cv_image.shape[1] - x)
        h = min(h + pad * 2, cv_image.shape[0] - y)

        cropped = cv_image[y:y+h, x:x+w]
        cropped = cv2.resize(cropped, (600, 600), interpolation=cv2.INTER_AREA)
        message = "構図補正を行いました（トリミング＋中央寄せ）"
    else:
        cropped = cv2.resize(cv_image, (600, 600), interpolation=cv2.INTER_AREA)
        message = "構図補正は行われませんでした（輪郭検出失敗）"

    # OpenCV → PIL
    processed_pil = Image.fromarray(cv2.cvtColor(cropped, cv2.COLOR_BGR2RGB))
    return processed_pil, message
