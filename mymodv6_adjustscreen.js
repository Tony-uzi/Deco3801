const METADATA = {
  website: "https://tobspr.io",
  author: "Water Bottle",
  name: "Shape capture and solver",
  version: "1.6",
  id: "AI AGENT",
  description:
    "run atuo",
  minimumGameVersion: ">=1.5.0",
  doesNotAffectSavegame: true,
};

class Out extends shapez.GameSystem {
  captureAndLogCachedHash() {
    try {
      const entities =
        shapez.MODS.app.stateMgr.currentState.core.root.entityMgr.entities;

      const cachedHashData = Array.from(entities)
        .map((entity) => {
          if (entity.components && entity.components.WiredPins) {
            return entity.components.WiredPins.slots
              .map((slot) => slot.value?.definition?.cachedHash)
              .filter((cachedHash) => cachedHash);
          }
          return null;
        })
        .flat()
        .filter((cachedHash) => cachedHash !== null);

      console.log("Captured cachedHash data:", cachedHashData);

      main(cachedHashData);
    } catch (error) {
      console.error("Error capturing cachedHash data: ", error);
    }
  }
}

class Mod extends shapez.Mod {

  init() {
    console.log("State capture Mod has been loaded!");

    this.modInterface.registerGameSystem({
      id: "out_system",
      systemClass: Out,
      before: "belt",
    });

    document.addEventListener("keydown", (event) => {
      if (event.ctrlKey && event.key === "p") {
        event.preventDefault();
        console.log(
          "Ctrl + P pressed! Capturing cachedHash data and solving shape..."
        );

        const outSystem =
          shapez.MODS.app.stateMgr.currentState.core.root.systemMgr.systems[
            "out_system"
          ];

        if (outSystem) {
          outSystem.captureAndLogCachedHash();
        } else {
          console.error("out_system not found!");
        }
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key.toLowerCase() === "u") {
        event.preventDefault();
        this.toggleUIBox();
      }
    });

    // Add event listeners for state changes
    this.signals.stateEntered.add(this.handleStateChange.bind(this));

    // Register the CSS for the custom UI box
    this.modInterface.registerCss(`
      #custom-ui-box {
        position: absolute;
        top: calc(20px * var(--ui-scale));
        right: calc(20px * var(--ui-scale));
        padding: 20px;
        background-color: rgba(0, 0, 0, 0.7);
        color: #fff;
        font-size: 12px;
        border-radius: 5px;
        line-height: 1.2;
        z-index: 1000; /* Make sure the box is on top of other elements */
      }
    `);
  }

  handleStateChange(state) {
    // Show the custom UI box when entering the main menu or in-game state
    if (state.key === "MainMenuState" || state.key === "InGameState") {
      this.createUIBox(state.key);
    } else {
      this.removeUIBox(); // Remove the box if we leave the relevant states
    }
  }

  createUIBox(stateKey) {
    // Remove existing box if it already exists
    const existingBox = document.getElementById("custom-ui-box");
    if (existingBox) {
      existingBox.remove();
    }

    const uiContainer = document.createElement("div");
    uiContainer.id = "custom-ui-box";
    uiContainer.innerText = stateKey === "MainMenuState"
      ? "Welcome to the Main Menu! This is your custom message box!"
      : all_message;
    document.body.appendChild(uiContainer);
  }

  removeUIBox() {
    // Remove existing UI box when leaving the state
    const existingBox = document.getElementById("custom-ui-box");
    if (existingBox) {
      existingBox.remove();
    }
  }

  toggleUIBox() {
    const existingBox = document.getElementById("custom-ui-box");
    if (existingBox) {
      this.removeUIBox();
    } else {
      this.createUIBox("InGameState");
    }
  }
}

class Layer {
  constructor(layer = null) {
    this.quadrants = ["--", "--", "--", "--"];
    if (layer) {
      this.quadrants = this.splitStringintoPairs(layer);
    }
  }

  getQuadrant(quadrant) {
    return this.quadrants[quadrant];
  }

  setQuadrant(quadrant, newString) {
    this.quadrants[quadrant] = newString;
  }

  clone() {
    const clone = new Layer(this.toStr());
    return clone;
  }

  toStr() {
    return this.quadrants.join("");
  }

  splitStringintoPairs(inputString) {
    if (inputString.length !== 8) {
      throw new Error("Not a valid layer");
    }

    let result = [];
    for (let i = 0; i < 8; i += 2) {
      result.push(inputString.substring(i, i + 2));
    }

    return result;
  }

  rotate(rotateOp) {
    if (rotateOp > 2 || rotateOp < 0) throw new Error("invalid rotation");
    for (let i = 0; i <= rotateOp; i++) {
      this.quadrants.unshift(this.quadrants.pop());
    }
  }
}

class Shape {
  constructor(shape = null) {
    this.layers = [new Layer(), new Layer(), new Layer(), new Layer()];
    if (shape) {
      let layerTexts = shape.split(":");
      for (let i = 0; i < layerTexts.length; i++) {
        if (i < layerTexts.length) {
          this.layers[i] = new Layer(layerTexts[i]);
        }
      }
    }
  }

  clone() {
    const clone = new Shape();
    clone.layers = this.layers.map((layer) => layer.clone());
    return clone;
  }

  toStr() {
    let s = "";
    for (let i = 0; i < 4; i++) {
      if (this.layers[i].toStr() != "--------") s += this.layers[i].toStr();
    }
    return s;
  }

  solve(target) {
    this.layers[0] = new Layer(target);
    console.log(this.layers[0].quadrants);
    this.rotate(0);
    console.log(this.layers[0].quadrants);
  }

  stack(otherShape) {
    for (let i = 0; i < 4; i++) {
      if (this.layers[0].quadrants[i] == "--")
        this.layers[0].setQuadrant(i, otherShape.layers[0].getQuadrant(i));
    }
  }

  rotate(rotateOp) {
    if (rotateOp > 2 || rotateOp < 0) throw new Error("invalid rotation");
    for (let i = 0; i < 4; i++) {
      this.layers[i].rotate(rotateOp);
    }
  }
}

class ActionNode {
  constructor(actionType, shape, leftChild = null, rightChild = null) {
    this.actionType = actionType;
    this.shape = shape.clone();
    this.children = [];
    if (leftChild) {
      this.children.push(leftChild);
    }
    if (rightChild) {
      this.children.push(rightChild);
    }
  }
}

class ActionTree {
  constructor(root) {
    this.root = root;
  }

  printTree(node = this.root, level = 0) {
    console.log(
      "  ".repeat(level) + `${node.shape.toStr()}: ${node.actionType}`
    );
    for (let child of node.children) {
      this.printTree(child, level + 1);
    }
  }
}

function solveShape(target) {
  if (Array.isArray(target)) {
    target = target[0];
  }

  let shape = new Shape(target);

  for (let i = 0; i < (target.length % 8) + 1; i++) {
    let quads = shape.layers[i];

    let shape1 = new Shape(quads.getQuadrant(0) + "------");
    let shape2 = new Shape(quads.getQuadrant(1) + "------");
    let shape3 = new Shape(quads.getQuadrant(2) + "------");
    let shape4 = new Shape(quads.getQuadrant(3) + "------");

    const a1 = new ActionNode("RAW", shape1);
    const a2 = new ActionNode("RAW", shape2);
    const a3 = new ActionNode("RAW", shape3);
    const a4 = new ActionNode("RAW", shape4);
    shape2.rotate(0);

    const r2 = new ActionNode("ROTATE_0", shape2, a2);
    shape1.stack(shape2);

    const s12 = new ActionNode("STACK", shape1, a1, r2);
    shape3.rotate(1);

    const r3 = new ActionNode("ROTATE_1", shape3, a3);
    shape4.rotate(2);

    const r4 = new ActionNode("ROTATE_2", shape4, a4);
    shape3.stack(shape4);

    const s34 = new ActionNode("STACK", shape3, r3, r4);
    shape1.stack(shape3);

    const root = new ActionNode("STACK", shape1, s12, s34);

    const actionTree = new ActionTree(root);
    console.log("Solved shape action tree:");
    actionTree.printTree();

    return actionTree;
  }
}

let all_message = "";

function processActionTree(actionTree) {
  console.log(
    "ALL SHAPES IN EACH LAYER ARE STARTING FROM 1st QUADRANT TO 2th CLOCKWISE！！！\n"
  );
  let steps = 0;

  function processNode(node) {
    steps++;
    // 将 node 的信息转换为字符串，模仿文件中的每一行
    const line = `${node.shape.toStr()} ${node.actionType}`;
    translator(line.trim(), steps);

    node.children.forEach(processNode);
  }

  processNode(actionTree.root);

  // 输出最终的累积消息
  console.log(all_message);
  const uiBox = document.getElementById("custom-ui-box");
  if (uiBox) {
    uiBox.innerText = all_message;
  }
}

function translator(line, steps) {
  let readableLine = "";
  const lineParts = line.split(/\s+/);

  // 确保操作符存在
  if (lineParts.length < 2) {
    console.log(line);
    console.log(`error: '${line}' do not have valid operation`);
    return;
  }

  const codes = lineParts[0]; // 8-bit 代码部分
  const operation = lineParts[1]; // 操作部分

  // 检查操作符是否有效
  const validOperations = new Set([
    "STACK",
    "RAW",
    "ROTATE_1",
    "ROTATE_2",
    "ROTATE_3",
  ]);
  if (!validOperations.has(operation)) {
    console.log(`Invalid operation '${operation}'。`);
    return;
  }

  const objectCodes = codes.split(":"); // 按 ':' 拆分不同层次的代码

  // 层次名称
  const layerNames = [
    "\nFirst layer",
    "\nSecond layer",
    "\nThird layer",
    "\nFourth layer",
  ];
  // 形状映射
  const shapeMap = {
    "-": "Empty Quadrant ",
    C: "Circle ",
    R: "rectangle ",
    W: "Wind ",
    S: "Star ",
  };
  // 颜色映射
  const colorMap = {
    u: "No Color ",
    r: "Red ",
    g: "Green ",
    b: "Blue ",
    y: "Yellow ",
    p: "Purple ",
    c: "Blue-Green ",
    w: "White",
  };

  // 遍历每组的代码
  objectCodes.forEach((codeChar, codeIndex) => {
    if (codeIndex >= layerNames.length) {
      return; // 最多支持 4 层
    }

    readableLine += `${layerNames[codeIndex]}: `; // 添加层次名称

    // 检查这组代码是否为8位，形状和颜色应该成对
    if (codeChar.length % 2 !== 0) {
      console.log(
        `Warning: Code length in layer ${codeIndex + 1} is not correct`
      );
      return;
    }

    // 假设每组代码长度固定为偶数，即形状和颜色的组合
    for (let bitIndex = 0; bitIndex < codeChar.length; bitIndex += 2) {
      const shape = shapeMap[codeChar[bitIndex]] || "Unknown shape";
      const color = colorMap[codeChar[bitIndex + 1]] || "No color";
      readableLine += `${shape}${color} `;
    }

    readableLine = readableLine.trim() + " "; // 去除每组的末尾空格
  });

  // 翻译操作符
  switch (operation) {
    case "STACK":
      readableLine +=
        "\nStack all the shapes we have build and form the shape above\n";
      break;
    case "RAW":
      readableLine +=
        "\nPlace the shape above(Use rotate, bin or any helpful tools)\n";
      break;
    case "ROTATE_1":
      readableLine +=
        "\nRotate 1 quadrant clockwise for previous shape and form the shape above\n";
      break;
    case "ROTATE_2":
      readableLine +=
        "\nRotate 2 quadrant clockwise for previous shape and form the shape above\n";
      break;
    case "ROTATE_3":
      readableLine +=
        "\nRotate 3 quadrant clockwise for previous shape and form the shape above\n";
      break;
  }

  const finalMessage = "Step Number: " + steps + "\n" + readableLine;
  all_message += finalMessage + "\n";
}

function main(cachedHashData) {
  console.log("Solving shape for cachedHashData:", cachedHashData);

  if (Array.isArray(cachedHashData) && cachedHashData.length > 0) {
    let result = solveShape(cachedHashData[0]);
    console.log("Shape solving completed for:", cachedHashData[0]);

    // 使用新函数处理 actionTree
    processActionTree(result);
  } else {
    console.error("Invalid cachedHashData format:", cachedHashData);
  }
}
