import cv2
import numpy as np

def make_smooth_transparent(img_path):
    print(f"Processing {img_path}...")
    img = cv2.imread(img_path, cv2.IMREAD_UNCHANGED)
    if img is None:
        print("Failed to load image")
        return
    if img.shape[2] == 3:
        img = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)
        
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Create a safe zone mask for the big boxes only
    _, box_mask = cv2.threshold(gray, 50, 255, cv2.THRESH_BINARY_INV)
    contours, _ = cv2.findContours(box_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    safe_zone = np.zeros_like(gray)
    for cnt in contours:
        if cv2.contourArea(cnt) > 100000:
            # Draw the box, but expand it slightly to include the glow area
            cv2.drawContours(safe_zone, [cnt], -1, 255, -1)
            
    kernel = np.ones((15, 15), np.uint8)
    safe_zone = cv2.dilate(safe_zone, kernel, iterations=2)
    
    # Inside the safe zone, we map brightness to alpha.
    # Background grey is ~35.
    # Let's say brightness <= 45 -> alpha = 0
    # brightness >= 90 -> alpha = 255
    # Smooth transition in between.
    
    alpha_ramp = np.clip((gray.astype(float) - 40) / 50.0 * 255.0, 0, 255).astype(np.uint8)
    
    # Outside the safe zone, alpha_ramp is 255
    alpha_ramp[safe_zone == 0] = 255
    
    # Combine with original alpha
    final_alpha = np.minimum(img[:, :, 3], alpha_ramp)
    img[:, :, 3] = final_alpha
    
    cv2.imwrite(img_path, img)
    print(f"Saved smooth transparent {img_path}")

frames = [
    "assets/Frame Photobooth/Frame 1 Strip Biru.png",
    "assets/Frame Photobooth/Frame 1 Strip Ungu.png",
    "assets/Frame Photobooth/Frame 3 Strip Biru.png",
    "assets/Frame Photobooth/Frame 3 Strip Ungu.png"
]

for f in frames:
    make_smooth_transparent(f)
