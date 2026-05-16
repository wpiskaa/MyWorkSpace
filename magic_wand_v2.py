import cv2
import numpy as np

configs = {
    "assets/Frame Photobooth/Frame 3 Strip Biru.png": [
        {'x': 254.7, 'y': 988.3, 'w': 1454.3, 'h': 1036.9},
        {'x': 499.5, 'y': 2122.7, 'w': 1277.6, 'h': 912.0},
        {'x': 191.6, 'y': 3130.6, 'w': 1291.3, 'h': 926.9}
    ],
    "assets/Frame Photobooth/Frame 3 Strip Ungu.png": [
        {'x': 231.2, 'y': 997.3, 'w': 1477.9, 'h': 1038.6},
        {'x': 500.4, 'y': 2144.6, 'w': 1278.9, 'h': 907.4},
        {'x': 192.2, 'y': 3159.1, 'w': 1289.9, 'h': 946.3}
    ],
    "assets/Frame Photobooth/Frame 1 Strip Biru.png": [
        {'x': 466.2, 'y': 1353.1, 'w': 2105.5, 'h': 2040.9}
    ],
    "assets/Frame Photobooth/Frame 1 Strip Ungu.png": [
        {'x': 481.7, 'y': 1318.8, 'w': 2140.7, 'h': 2118.3}
    ]
}

def process_image(img_path, boxes):
    print(f"Processing {img_path}")
    img = cv2.imread(img_path, cv2.IMREAD_UNCHANGED)
    if img is None: return
    if img.shape[2] == 3:
        img = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)
        
    H, W = img.shape[:2]
    alpha = img[:, :, 3].astype(np.float32)
    
    for box in boxes:
        # Get bounds with generous padding so we don't cut off the blur
        pad = 40
        x0 = max(0, int(box['x']) - pad)
        y0 = max(0, int(box['y']) - pad)
        x1 = min(W, int(box['x'] + box['w']) + pad)
        y1 = min(H, int(box['y'] + box['h']) + pad)
        
        # We know the placeholder color is roughly [35, 35, 35]
        target_color = np.array([35.0, 35.0, 35.0], dtype=np.float32)
        
        region = img[y0:y1, x0:x1, :3].astype(np.float32)
        
        diff = region - target_color
        dist = np.sqrt(np.sum(diff**2, axis=2))
        
        # Local mask: 0 (transparent) where dist is small, 255 where dist is large
        # Let's use a tight distance threshold so we only capture the dark grey
        local_alpha = np.clip((dist - 15) / 20.0 * 255.0, 0, 255).astype(np.uint8)
        
        # Apply Gaussian blur to the local mask to make the edges buttery smooth
        local_alpha_smooth = cv2.GaussianBlur(local_alpha, (15, 15), 0)
        
        # To avoid the blur causing weird boxes at the padding edges, we enforce the padding edges to be 255
        # (Though we shouldn't have dark grey near the padding edges anyway)
        
        existing_alpha = alpha[y0:y1, x0:x1]
        alpha[y0:y1, x0:x1] = np.minimum(existing_alpha, local_alpha_smooth.astype(np.float32))

    img[:, :, 3] = alpha.astype(np.uint8)
    cv2.imwrite(img_path, img)

for path, boxes in configs.items():
    process_image(path, boxes)
