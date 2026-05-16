import cv2
import numpy as np

def find_boxes(img_path):
    print(f"--- {img_path} ---")
    img = cv2.imread(img_path)
    if img is None:
        print("Failed to load image.")
        return
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Threshold to find dark areas (the black boxes)
    _, thresh = cv2.threshold(gray, 40, 255, cv2.THRESH_BINARY_INV)
    
    # Find contours
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    boxes = []
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area > 100000: # Filter out small noise
            rect = cv2.minAreaRect(cnt)
            # rect is ((center_x, center_y), (width, height), angle)
            boxes.append((rect, area))
            
    # Sort by Y coordinate (top to bottom)
    boxes.sort(key=lambda b: b[0][0][1])
    
    for i, (rect, area) in enumerate(boxes):
        (cx, cy), (w, h), angle = rect
        # Fix angle and w/h orientation
        if w < h:
            angle += 90
            w, h = h, w
        if angle > 45:
            angle -= 90
        elif angle < -45:
            angle += 90
            
        # Convert angle to radians for HTML5 canvas
        angle_rad = angle * np.pi / 180.0
        
        # Calculate top-left x, y (before rotation, relative to center)
        x = cx - w/2
        y = cy - h/2
        print(f"Photo {i+1}: x={x:.1f}, y={y:.1f}, w={w:.1f}, h={h:.1f}, angle_deg={angle:.2f}, angle_rad={angle_rad:.4f}")

find_boxes("assets/Frame Photobooth/Frame 1 Strip Biru.png")
find_boxes("assets/Frame Photobooth/Frame 1 Strip Ungu.png")
find_boxes("assets/Frame Photobooth/Frame 3 Strip Biru.png")
find_boxes("assets/Frame Photobooth/Frame 3 Strip Ungu.png")
