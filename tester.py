import cv2
import os

def preprocess_image(image_path):
    image = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    return image

def match_features(image, template, min_match_count=10):
    # 使用ORB检测和描述符
    orb = cv2.ORB_create()
    keypoints1, descriptors1 = orb.detectAndCompute(image, None)
    keypoints2, descriptors2 = orb.detectAndCompute(template, None)

    if descriptors1 is None or descriptors2 is None:
        return 0  # 如果没有检测到描述符，返回0

    # 确保描述符类型一致
    if descriptors1.dtype != descriptors2.dtype:
        descriptors1 = descriptors1.astype('uint8')
        descriptors2 = descriptors2.astype('uint8')

    # 使用BFMatcher进行匹配
    bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
    matches = bf.match(descriptors1, descriptors2)

    # 排序和选择最佳匹配
    matches = sorted(matches, key=lambda x: x.distance)

    # 只返回满足最小匹配数量条件的匹配结果
    match_count = len(matches)
    if match_count > min_match_count:
        return match_count
    else:
        return 0

def detect_and_match_shapes(image_path, template_folder, min_match_count=10):
    image = preprocess_image(image_path)
    templates = {}

    for root, dirs, files in os.walk(template_folder):
        for template_name in files:
            if template_name.endswith(".png"):
                template_path = os.path.join(root, template_name)
                template = cv2.imread(template_path, cv2.IMREAD_GRAYSCALE)
                if template is None:
                    print(f"Warning: Could not load template {template_path}")
                    continue
                template_name = template_name.replace("processed_", "").replace(".png", "")
                templates[template_name] = template

    results = {}

    for name, template in templates.items():
        match_count = match_features(image, template, min_match_count)
        if match_count > 0:  # 如果匹配数量超过阈值，记录结果
            results[name] = match_count

    return results

if __name__ == "__main__":
    template_folder = r'D:\AU\UQcourse\2024s2\7381\image_recongnize\pythonProject\template\processed'
    image_path = os.path.join(r'D:\AU\UQcourse\2024s2\7381\image_recongnize\pythonProject\tester\1.png')

    print(f"Image path: {image_path}")
    results = detect_and_match_shapes(image_path, template_folder, min_match_count=20)  # 设置更高的匹配要求
    print("Match results:")
    for key, value in results.items():
        print(f"{key}: {value}")
