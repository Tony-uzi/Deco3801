def file_handle(filename: str):
    with open(filename, 'r') as f:
        lines = f.readlines()  # 读取所有行
        for line in reversed(lines):  # 反转行的顺序
            translator(line.strip())  # 去除行末尾的空白字符，并处理

def translator(line: str) -> str:
    readable_line = ""
    line_parts = line.split()  # 按空格拆分成代码部分和操作部分

    # 确保有操作符存在，并验证其有效性
    if len(line_parts) < 2:
        print(f"错误：在行 '{line}' 中找不到操作符。")
        return

    codes = line_parts[0]  # 8-bit 代码部分
    operation = line_parts[1]  # 操作部分

    # 验证操作符是否有效
    valid_operations = {"STACK", "RAW", "ROTATE_1", "ROTATE_2", "ROTATE_3"}
    if operation not in valid_operations:
        print(f"错误：无效的操作符 '{operation}'。")
        return

    object_codes = codes.split(":")  # 按冒号拆分为多组 8-bit 代码

    # 层次名称
    layer_names = ["第一层", "第二层", "第三层", "第四层"]
    # 形状映射
    shape_map = {"-": "空象限", "C": "圆形", "R": "方形", "W": "风车形", "S": "星形"}
    # 颜色映射
    color_map = {"u": "无色", "r": "红色", "g": "绿色", "b": "蓝色", "y": "黄色", "p": "紫色", "c": "蓝绿", "w": "白色"}

    # 遍历每组的代码
    for code_index, code_char in enumerate(object_codes):
        if code_index >= len(layer_names):
            break  # 最多支持4层，避免超过层次

        readable_line += f"{layer_names[code_index]}:"  # 追加层次名称

        # 检查这组代码是否为8位，形状和颜色应该成对
        if len(code_char) % 2 != 0:
            print(f"警告：第 {code_index + 1} 组的代码长度不正确，跳过处理。")
            continue

        # 假设每组代码长度固定为偶数，即形状和颜色的组合
        for bit_index in range(0, len(code_char), 2):
            shape = shape_map.get(code_char[bit_index], "未知形状")
            color = color_map.get(code_char[bit_index + 1], "无颜色")
            # 紧密连接形状和颜色描述，最后添加一个空格
            readable_line += f"{shape}{color} "

        readable_line = readable_line.strip() + " "  # 去除每组的末尾空格

    # 在所有层次翻译完成后，附加操作符
    if operation == "STACK":
        readable_line += "堆叠之前所有图形后生成前述图形"
    if operation == "RAW":
        readable_line += "放置前述图形"
    if operation == "ROTATE_1":
        readable_line += "顺时针将上一个图形旋转1象限，生成前述图形"
    if operation == "ROTATE_2":
        readable_line += "顺时针将上一个图形旋转2象限，生成前述图形"
    if operation == "ROTATE_3":
        readable_line += "顺时针将上一个图形旋转3象限，生成前述图形"

    print(readable_line)  # 打印出翻译后的结果


if __name__ == '__main__':
    file_handle("test.txt")
