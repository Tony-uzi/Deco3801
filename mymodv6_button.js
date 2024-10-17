// Metadata
const METADATA = {
  website: "https://tobspr.io",
  author: "Water Bottle",
  name: "Shape capture and solver",
  version: "1.6",
  id: "AI AGENT",
  description: "run auto",
  minimumGameVersion: ">=1.5.0",
  doesNotAffectSavegame: true,
};

// Out Class
class Out extends shapez.GameSystem {
  captureAndLogCachedHash() {
    try {
      const entities =
        // shapez.MODS.app.stateMgr.currentState.core.root.entityMgr.entities;
        shapez?.MODS?.app?.stateMgr?.currentState?.core?.root?.entityMgr?.entities;

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

// Mod Class
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
        font-size: 14px;
        border-radius: 5px;
        z-index: 1000;
        max-height: 300px;
      }
      #next-step-btn, #back-step-btn {
        margin: 5px;
        padding: 5px 10px;
        cursor: pointer;
        background-color: #4CAF50;
        color: white;
        border: none;
        border-radius: 3px;
      }
    `);
  }

  handleStateChange(state) {
    if (state.key === "MainMenuState" || state.key === "InGameState") {
      this.createUIBox(state.key);
    } else {
      this.removeUIBox();
    }
  }

  createUIBox(stateKey) {
    const existingBox = document.getElementById("custom-ui-box");
    if (existingBox) {
      existingBox.remove();
    }

    const uiContainer = document.createElement("div");
    uiContainer.id = "custom-ui-box";
    uiContainer.innerText =
      stateKey === "MainMenuState"
        ? "Welcome to the Main Menu! This is your custom message box!"
        : all_message;
    document.body.appendChild(uiContainer);

    // Add buttons to the UI box
    const backStepBtn = document.createElement("button");
    backStepBtn.id = "back-step-btn";
    backStepBtn.innerText = "Back Step";
    backStepBtn.addEventListener("click", () => this.handleBackStep());
    uiContainer.appendChild(backStepBtn);

    const nextStepBtn = document.createElement("button");
    nextStepBtn.id = "next-step-btn";
    nextStepBtn.innerText = "Next Step";
    nextStepBtn.addEventListener("click", () => this.handleNextStep());
    uiContainer.appendChild(nextStepBtn);
  }

  removeUIBox() {
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

  handleNextStep() {
    console.log("Next Step button clicked");
    // Implement the functionality for the next step here
  }

  handleBackStep() {
    console.log("Back Step button clicked");
    // Implement the functionality for the back step here
  }
}

// Layer Class
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
    return new Layer(this.toStr());
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

// Shape Class
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

// ActionNode Class
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

// ActionTree Class
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

// Solve Shape Function
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

// Process Action Tree Function
function processActionTree(actionTree) {
  console.log(
    "ALL SHAPES IN EACH LAYER ARE STARTING FROM 1st QUADRANT TO 2nd CLOCKWISE！！！\n"
  );
  let steps = 0;

  function processNode(node) {
    steps++;
    const line = `${node.shape.toStr()} ${node.actionType}`;
    translator(line.trim(), steps);

    node.children.forEach(processNode);
  }

  processNode(actionTree.root);
  console.log(all_message);

  const modInstance = shapez.MODS.mods.find(mod => mod instanceof Mod);
  if (modInstance) {
    modInstance.updateUIBox();
  }
}

// Translator Function
function translator(line, steps) {
  let readableLine = "";
  const lineParts = line.split(/\s+/);

  if (lineParts.length < 2) {
    console.log(line);
    console.log(`error: '${line}' do not have valid operation`);
    return;
  }

  const codes = lineParts[0];
  const operation = lineParts[1];

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

  const objectCodes = codes.split(":");

  const layerNames = [
    "\nFirst layer",
    "\nSecond layer",
    "\nThird layer",
    "\nFourth layer",
  ];

  const shapeMap = {
    "-": "Empty Quadrant ",
    C: "Circle ",
    R: "rectangle ",
    W: "Wind ",
    S: "Star ",
  };

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

  objectCodes.forEach((codeChar, codeIndex) => {
    if (codeIndex >= layerNames.length) {
      return;
    }

    readableLine += `${layerNames[codeIndex]}: `;

    if (codeChar.length % 2 !== 0) {
      console.log(
        `Warning: Code length in layer ${codeIndex + 1} is not correct`
      );
      return;
    }

    for (let bitIndex = 0; bitIndex < codeChar.length; bitIndex += 2) {
      const shape = shapeMap[codeChar[bitIndex]] || "Unknown shape";
      const color = colorMap[codeChar[bitIndex + 1]] || "No color";
      readableLine += `${shape}${color} `;
    }

    readableLine = readableLine.trim() + " ";
  });

  switch (operation) {
    case "STACK":
      readableLine +=
        "\nStack all the shapes we have built and form the shape above\n";
      break;
    case "RAW":
      readableLine +=
        "\nPlace the shape above (Use rotate, bin, or any helpful tools)\n";
      break;
    case "ROTATE_1":
      readableLine +=
        "\nRotate 1 quadrant clockwise for previous shape and form the shape above\n";
      break;
    case "ROTATE_2":
      readableLine +=
        "\nRotate 2 quadrants clockwise for previous shape and form the shape above\n";
      break;
    case "ROTATE_3":
      readableLine +=
        "\nRotate 3 quadrants clockwise for previous shape and form the shape above\n";
      break;
  }

  const finalMessage = "Step Number: " + steps + "\n" + readableLine;
  all_message += finalMessage + "\n";
}

// Main Function
function main(cachedHashData) {
  console.log("Solving shape for cachedHashData:", cachedHashData);

  if (Array.isArray(cachedHashData) && cachedHashData.length > 0) {
    let result = solveShape(cachedHashData[0]);
    console.log("Shape solving completed for:", cachedHashData[0]);

    processActionTree(result);
  } else {
    console.error("Invalid cachedHashData format:", cachedHashData);
  }
}