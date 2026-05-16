import cv2
import numpy as np

def verify_boxes(img_path, out_path):
    img = cv2.imread(img_path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, 40, 255, cv2.THRESH_BINARY_INV)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    boxes = []
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area > 100000:
            rect = cv2.minAreaRect(cnt)
            boxes.append((rect, area))
            
    boxes.sort(key=lambda b: b[0][0][1])
    
    for i, (rect, area) in enumerate(boxes):
        (cx, cy), (w, h), angle = rect
        if w < h:
            angle += 90
            w, h = h, w
        if angle > 45:
            angle -= 90
        elif angle < -45:
            angle += 90
            
        angle_rad = angle * np.pi / 180.0
        x = cx - w/2
        y = cy - h/2
        
        # Draw on image
        box_points = cv2.boxPoints(((cx, cy), (w, h), angle))
        box_points = np.intp(box_points)
        cv2.drawContours(img, [box_points], 0, (0, 255, 0), 10)
        cv2.putText(img, f"{i+1}", (int(cx), int(cy)), cv2.FONT_HERSHEY_SIMPLEX, 5, (0,0,255), 10)
        
    cv2.imwrite(out_path, img)

verify_boxes("assets/Frame Photobooth/Frame 3 Strip Biru.png", "debug_3strip.png")
verify_boxes("assets/Frame Photobooth/Frame 1 Strip Biru.png", "debug_1strip.png")
