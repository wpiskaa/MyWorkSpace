import cv2
import numpy as np
import math

# Coordinate from photobooth.html FRAME_CONFIG
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
    if img.shape[2] == 3:
        img = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)
        
    H, W = img.shape[:2]
    
    # We will modify the alpha channel
    alpha = img[:, :, 3].astype(np.float32)
    
    for box in boxes:
        # Get integer bounds, expanding slightly
        x0 = max(0, int(box['x']) - 20)
        y0 = max(0, int(box['y']) - 20)
        x1 = min(W, int(box['x'] + box['w']) + 20)
        y1 = min(H, int(box['y'] + box['h']) + 20)
        
        # Sample the center color
        cx = int(box['x'] + box['w']/2)
        cy = int(box['y'] + box['h']/2)
        target_color = img[cy, cx, :3].astype(np.float32)
        
        # Extract region
        region = img[y0:y1, x0:x1, :3].astype(np.float32)
        
        # Calculate Euclidean distance to target color
        diff = region - target_color
        dist = np.sqrt(np.sum(diff**2, axis=2))
        
        # Map distance to alpha
        # dist < 15 -> alpha 0
        # dist > 50 -> alpha 255
        # between 15 and 50 -> smooth ramp
        region_alpha = np.clip((dist - 15) / 35.0 * 255.0, 0, 255)
        
        # Merge with existing alpha (take the minimum so we don't make transparent things opaque)
        existing_alpha = alpha[y0:y1, x0:x1]
        alpha[y0:y1, x0:x1] = np.minimum(existing_alpha, region_alpha)

    img[:, :, 3] = alpha.astype(np.uint8)
    cv2.imwrite(img_path, img)

for path, boxes in configs.items():
    process_image(path, boxes)
