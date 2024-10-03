const fs = require('fs');

function fileHandle(filename) {
    fs.readFile(filename, 'utf8', (err, data) => {
        if (err) {
            console.error(`Error reading file: ${err}`);
            return;
        }
        const lines = data.split('\n');  // 读取所有行
        lines.reverse().forEach(line => {  // 反转行的顺序
            translator(line.trim());  // 去除行末尾的空白字符，并处理
        });
    });
}

function translator(line) {
    let readableLine = "";
    const lineParts = line.split(/\s+/);  // 按空格拆分成代码部分和操作部分

    // 确保有操作符存在，并验证其有效性
    if (lineParts.length < 2) {
        console.log(`error: '${line}' do not have valid operation`);
        return;
    }

    const codes = lineParts[0];  // 8-bit 代码部分
    const operation = lineParts[1];  // 操作部分

    // 验证操作符是否有效
    const validOperations = new Set(["STACK", "RAW", "ROTATE_1", "ROTATE_2", "ROTATE_3"]);
    if (!validOperations.has(operation)) {
        console.log(`Invalid operation '${operation}'。`);
        return;
    }

    const objectCodes = codes.split(":");  // 按冒号拆分为多组 8-bit 代码

    // 层次名称
    const layerNames = ["First layer", "Second layer", "Third layer", "Fourth layer"];
    // 形状映射
    const shapeMap = {
        "-": "Empty Quadrant ",
        "C": "Circle ",
        "R": "rectangle ",
        "W": "Wind ",
        "S": "Star "
    };
    // 颜色映射
    const colorMap = {
        "u": "no color ",
        "r": "red ",
        "g": "green ",
        "b": "blue ",
        "y": "yellow ",
        "p": "purple ",
        "c": "blue-green ",
        "w": "white"
    };

    // 遍历每组的代码
    objectCodes.forEach((codeChar, codeIndex) => {
        if (codeIndex >= layerNames.length) {
            return;  // 最多支持4层，避免超过层次
        }

        readableLine += `${layerNames[codeIndex]}: `;  // 追加层次名称

        // 检查这组代码是否为8位，形状和颜色应该成对
        if (codeChar.length % 2 !== 0) {
            console.log(`Warning: Code length in layer ${codeIndex + 1} is not correct`);
            return;
        }

        // 假设每组代码长度固定为偶数，即形状和颜色的组合
        for (let bitIndex = 0; bitIndex < codeChar.length; bitIndex += 2) {
            const shape = shapeMap[codeChar[bitIndex]] || "Unknown shape";
            const color = colorMap[codeChar[bitIndex + 1]] || "No color";
            readableLine += `${shape}${color} `;
        }

        readableLine = readableLine.trim() + " ";  // 去除每组的末尾空格
    });

    // 在所有层次翻译完成后，附加操作符
    switch (operation) {
        case "STACK":
            readableLine += "\nStack all the shapes we have build and form the shape above\n";
            break;
        case "RAW":
            readableLine += "\nPlace the shape above(Use rotate, bin or any helpful tools)\n";
            break;
        case "ROTATE_1":
            readableLine += "\nRotate 1 quadrant clockwise and form the shape above\n";
            break;
        case "ROTATE_2":
            readableLine += "\nRotate 2 quadrant clockwise and form the shape above\n";
            break;
        case "ROTATE_3":
            readableLine += "\nRotate 3 quadrant clockwise and form the shape above\n";
            break;
    }

    const finalMessage = "ALL SHAPES IN EACH LAYER ARE STARTING FROM 1st QUADRANT TO 2th CLOCKWISE!!!\n" + readableLine;

    console.log(finalMessage);  // 打印出翻译后的结果
}

// 运行程序
fileHandle("test.txt");
