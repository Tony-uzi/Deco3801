const fs = require('fs').promises;  // 使用 fs.promises 版本
const { performance } = require('perf_hooks');
const { exec } = require('child_process');


// 全局变量
let all_message = "";

async function fileHandle(filename) {
    try {
        const data = await fs.readFile(filename, 'utf8');  // 使用 await 读取文件
        const lines = data.split('\n');  // 读取所有行
        let steps = 0;
        console.log("ALL SHAPES IN EACH LAYER ARE STARTING FROM 1st QUADRANT TO 2th CLOCKWISE！！！\n");
        lines.reverse().forEach(line => {  // 反转所有行
            steps += 1;
            translator(line.trim(), steps);  // 删除行首和行尾的空格
        });

        // 输出最终的累积消息
        console.log(all_message);
    } catch (err) {
        console.error(`Error reading file: ${err}`);
    }
}

function translator(line, steps) {
    let readableLine = "";
    const lineParts = line.split(/\s+/);  // 按空格拆分成代码部分和操作部分

    // 确保操作符存在
    if (lineParts.length < 2) {
        console.log(line);
        console.log(`error: '${line}' do not have valid operation`);
        return;
    }

    const codes = lineParts[0];  // 8-bit 代码部分
    const operation = lineParts[1];  // 操作部分

    // 检查操作符是否有效
    const validOperations = new Set(["STACK", "RAW", "ROTATE_1", "ROTATE_2", "ROTATE_3"]);
    if (!validOperations.has(operation)) {
        console.log(`Invalid operation '${operation}'。`);
        return;
    }

    const objectCodes = codes.split(":");  // 按 ':' 拆分不同层次的代码

    // 层次名称
    const layerNames = ["\nFirst layer", "\nSecond layer", "\nThird layer", "\nFourth layer"];
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
        "u": "No Color ",
        "r": "Red ",
        "g": "Green ",
        "b": "Blue ",
        "y": "Yellow ",
        "p": "Purple ",
        "c": "Blue-Green ",
        "w": "White"
    };

    // 遍历每组的代码
    objectCodes.forEach((codeChar, codeIndex) => {
        if (codeIndex >= layerNames.length) {
            return;  // 最多支持 4 层
        }

        readableLine += `${layerNames[codeIndex]}: `;  // 添加层次名称

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

    // 翻译操作符
    switch (operation) {
        case "STACK":
            readableLine += "\nStack all the shapes we have build and form the shape above\n";
            break;
        case "RAW":
            readableLine += "\nPlace the shape above(Use rotate, bin or any helpful tools)\n";
            break;
        case "ROTATE_1":
            readableLine += "\nRotate 1 quadrant clockwise for previous shape and form the shape above\n";
            break;
        case "ROTATE_2":
            readableLine += "\nRotate 2 quadrant clockwise for previous shape and form the shape above\n";
            break;
        case "ROTATE_3":
            readableLine += "\nRotate 3 quadrant clockwise for previous shape and form the shape above\n";
            break;
    }

    const finalMessage = "Step Number: " + steps + "\n" + readableLine;
    all_message += finalMessage + "\n";
}

// 创建异步主函数
async function main() {
    // 记录开始时间
    const start = performance.now();

    // 执行异步文件处理函数
    await fileHandle("test.txt");

    // 记录结束时间
    const end = performance.now();

    // 计算并输出运行时间
    const runningTime = end - start;
    console.log(`Execution Time: ${runningTime} ms`);

    // 获取并显示内存使用情况
    const usedMemory = process.memoryUsage();
    console.log(`Memory Usage (in MB):`);
    console.log(`- RSS (Resident Set Size): ${(usedMemory.rss / 1024 / 1024).toFixed(2)} MB`);
    console.log(`- Heap Total: ${(usedMemory.heapTotal / 1024 / 1024).toFixed(2)} MB`);
    console.log(`- Heap Used: ${(usedMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`- External: ${(usedMemory.external / 1024 / 1024).toFixed(2)} MB`);

    // 调用 Python 脚本, 使用子进程打开GUI，确保本地terminal的默认python有pyqt5库
    exec('python pyqt.py', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return;
        }

        if (stderr) {
            console.error(`Standard Error: ${stderr}`);
            return;
        }

        // 输出 Python 脚本的标准输出
        console.log(`Python Output: ${stdout}`);
});

}

// 执行主函数
main();



