import cv2
import numpy as np

def make_transparent(img_path):
    print(f"Processing {img_path}...")
    # Load with alpha channel
    img = cv2.imread(img_path, cv2.IMREAD_UNCHANGED)
    if img is None:
        return
        
    if img.shape[2] == 3:
        img = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)
        
    # The placeholder color is roughly (26, 26, 26) in RGB or similar dark grey
    # We create a mask for this color.
    # We can use floodFill from the center of the known boxes to be safe.
    
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, 40, 255, cv2.THRESH_BINARY_INV)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    mask = np.zeros(img.shape[:2], dtype=np.uint8)
    
    for cnt in contours:
        if cv2.contourArea(cnt) > 100000:
            # Instead of a bounding box, draw the exact contour!
            cv2.drawContours(mask, [cnt], -1, 255, -1)
            
    # Now wherever mask is 255, we want to make the image transparent.
    # To handle anti-aliasing (smooth edges), let's blur the mask slightly
    # or just set alpha to 0 for the exact contour.
    
    img[mask == 255, 3] = 0
    
    cv2.imwrite(img_path, img)
    print(f"Saved transparent version of {img_path}")

frames = [
    "assets/Frame Photobooth/Frame 1 Strip Biru.png",
    "assets/Frame Photobooth/Frame 1 Strip Ungu.png",
    "assets/Frame Photobooth/Frame 3 Strip Biru.png",
    "assets/Frame Photobooth/Frame 3 Strip Ungu.png"
]

for f in frames:
    make_transparent(f)
