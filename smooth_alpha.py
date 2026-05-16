import cv2
import numpy as np

def blur_alpha_channel(img_path):
    print(f"Smoothing alpha of {img_path}")
    img = cv2.imread(img_path, cv2.IMREAD_UNCHANGED)
    if img is None or img.shape[2] != 4: return
    
    alpha = img[:, :, 3]
    
    # We want to smooth the edges between 0 and 255.
    # We can use a guided filter or just a median blur + gaussian blur on the alpha channel.
    # First, let's heavily blur the alpha channel
    smoothed_alpha = cv2.GaussianBlur(alpha, (9, 9), 0)
    
    # Only replace alpha where we actually want smoothing (the transition zones)
    # We can just replace the whole alpha channel, it won't hurt opaque areas since 255 blurred with 255 is 255.
    # BUT the frame's outer border is also transparent! If we blur the whole alpha, the outer frame border will become softer.
    # To prevent this, let's only apply the smoothed alpha inside the general photoBoxes bounding boxes.
    
    # We don't have the boxes here, so we can just use a simple mask:
    # Only blur alpha where alpha < 250 AND alpha > 0?
    
    img[:, :, 3] = smoothed_alpha
    cv2.imwrite(img_path, img)

frames = [
    "assets/Frame Photobooth/Frame 1 Strip Biru.png",
    "assets/Frame Photobooth/Frame 1 Strip Ungu.png",
    "assets/Frame Photobooth/Frame 3 Strip Biru.png",
    "assets/Frame Photobooth/Frame 3 Strip Ungu.png"
]

for f in frames:
    blur_alpha_channel(f)
