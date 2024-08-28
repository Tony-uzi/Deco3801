import os
import cv2


def preprocess_image(image_path, output_path):
    # 读取图像
    image = cv2.imread(image_path)

    # 转为灰度图
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # 使用高斯模糊减少噪声
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    # 边缘检测
    edged = cv2.Canny(blurred, 50, 150)

    # 保存处理后的图像
    cv2.imwrite(output_path, edged)


def batch_process_templates(input_dir, output_dir):
    for root, dirs, files in os.walk(input_dir):
        # 获取相对路径并创建对应的输出目录
        relative_path = os.path.relpath(root, input_dir)
        output_subdir = os.path.join(output_dir, relative_path)

        if not os.path.exists(output_subdir):
            os.makedirs(output_subdir)

        for filename in files:
            if filename.endswith(".png"):  # 只处理PNG文件
                input_path = os.path.join(root, filename)
                processed_filename = "processed_" + filename
                processed_path = os.path.join(output_subdir, processed_filename)

                preprocess_image(input_path, processed_path)
                print(f"Processed {filename} and saved as {processed_path}")


if __name__ == "__main__":
    input_template_dir = r"D:\AU\UQcourse\2024s2\7381\image_recongnize\pythonProject\template\raw"
    output_processed_dir = r"D:\AU\UQcourse\2024s2\7381\image_recongnize\pythonProject\template\processed"

    batch_process_templates(input_template_dir, output_processed_dir)
