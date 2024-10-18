// @ts-nocheck
const METADATA = {
    id: "auto_build_modtesing",
    name: "Stage Killer",
    version: "1.0.6",
    author: "Waterbottle",
    description: "Automatically add building and solve the stage",
    minimumGameVersion: ">=1.5.0",
    doesNotAffectSavegame: true,
};

class ShapeGeneratorComponent extends shapez.Component {
    static getId() {
        return "ShapeGenerator";
    }
    constructor() {
        super();
        this.lastTime = 0;
        this.perSec = 1;
        this.key = "CuCuCuCu";
    }
    copyAdditionalStateTo(otherComponent) {
        otherComponent.key = this.key;
        otherComponent.perSec = this.perSec;
    }
    static getSchema() {
        return {
            key: shapez.types.string,
            perSec: shapez.types.int,
        };
    }
}
class ShapeGeneratorSystem extends shapez.GameSystemWithFilter {
    constructor(root) {
        super(root, [ShapeGeneratorComponent]);

        // this.root.signals.entityManuallyPlaced.add(entity => {
        //     const shapeGenComp = entity.components.ShapeGenerator;
        //     if(shapeGenComp){
        //         shapeGenComp.key = "CuCuCuCu";
        //         shapeGenComp.perSec = 10;
        //     }
        // });
    }

    isColor(str) {
        return str == "red" || str == "blue" || str == "yellow" || str == "green" || str == "cyan" || str == "white" || str == "purple";
    }

    update() {
        for (let i = 0; i < this.allEntities.length; ++i) {

            const entity = this.allEntities[i];
            const ejectComp = entity.components.ItemEjector;
            const shapeComp = entity.components.ShapeGenerator;
            if (this.root.time.now() - shapeComp.lastTime > (1 / shapeComp.perSec)) {

                if (shapez.ShapeDefinition.isValidShortKey(shapeComp.key)) {
                    shapeComp.lastTime = this.root.time.now()
                    let generatedItem = shapez.ShapeDefinition.fromShortKey(shapeComp.key)
                    ejectComp.tryEject(0, new shapez.ShapeItem(generatedItem))
                } else if (this.isColor(shapeComp.key)) {
                    shapeComp.lastTime = this.root.time.now()
                    ejectComp.tryEject(0, new shapez.ColorItem(shapeComp.key))
                }
                else {
                    console.log("I need help");
                }
            }
        }
    }

    drawChunk(parameters, chunk) {
        const contents = chunk.containedEntitiesByLayer.regular;
        for (let i = 0; i < contents.length; ++i) {
            const entity = contents[i];
            const shapeComp = entity.components.ShapeGenerator;
            if (!shapeComp) {
                continue;
            }

            const staticComp = entity.components.StaticMapEntity;
            const center = staticComp.getTileSpaceBounds().getCenter().toWorldSpace();

            // Culling for better performance
            if (parameters.visibleRect.containsCircle(center.x, center.y, 40)) {
                if (shapez.ShapeDefinition.isValidShortKey(shapeComp.key)) {
                    let item = new shapez.ShapeItem(shapez.ShapeDefinition.fromShortKey(shapeComp.key))
                    item.drawItemCenteredClipped(
                        center.x,
                        center.y,
                        parameters,
                        shapez.globalConfig.tileSize * 0.65
                    );
                }

            }
        }
    }

}

class MetaShapeGeneratorBuilding extends shapez.ModMetaBuilding {
    constructor() {
        super("shape_generator");
    }

    getIsUnlocked(root) {
        return true;
    }

    static getAllVariantCombinations() {
        return [
            {
                variant: shapez.defaultBuildingVariant,
                name: "Shape Generator",
                description: "Use this generate any shape. You can enter a shape key and the number of shape you want per second",

                regularImageBase64: RESOURCES["shapeGenerator.png"],
                blueprintImageBase64: RESOURCES["shapeGeneratorBlueprint.png"],
                tutorialImageBase64: RESOURCES["shapeGenerator.png"],
            },
        ];
    }



    setupEntityComponents(entity) {

        // add ejector
        entity.addComponent(
            new shapez.ItemEjectorComponent({
                slots: [{ pos: new shapez.Vector(0, 0), direction: shapez.enumDirection.top }]
            })
        );



        // set custom processor 
        entity.addComponent(new ShapeGeneratorComponent());

    }
}



class Out extends shapez.GameSystem {
    captureAndLogCachedHash() {
        try {
            const entities = shapez.MODS.app.stateMgr.currentState.core.root.entityMgr.entities;
            const cachedHashData = Array.from(entities).map((entity) => {
                if (entity.components && entity.components.WiredPins) {
                    return entity.components.WiredPins.slots
                        .map(slot => slot.value?.definition?.cachedHash)
                        .filter(cachedHash => cachedHash);
                }
                return null;
            }).flat().filter(cachedHash => cachedHash !== null);

            console.log("Captured cachedHash data:", cachedHashData);
            return cachedHashData;
        } catch (error) {
            console.error("Error capturing cachedHash data: ", error);
            return [];
        }
    }
}

class Layer {
    constructor(layer = null) {
        this._quadrants = ["--", "--", "--", "--"]
        if (layer) {
            this._quadrants = this.splitStringintoPairs(layer);
        }
    }
    // return the value of this quadrant
    getQuadrant(quadrant) {
        return this._quadrants[quadrant];
    }
    // setthe value of this quadrant
    setQuadrant(quadrant, newString) {
        this._quadrants[quadrant] = newString;
    }

    getQuadrants() {
        return this._quadrants;
    }
    // create a clone of this layer
    clone() {
        const clone = new Layer(this.toStr());
        return clone;
    }
    // convert the layer into a string 
    toStr() {
        return this._quadrants.join('');
    }
    // split the string into four components, indicate to four quadrants
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
    // 
    rotate(rotateOp) {
        if (rotateOp > 2 || rotateOp < 0)
            throw new Error("invalid rotation");
        for (let i = 0; i <= rotateOp; i++) {
            this._quadrants.unshift(this._quadrants.pop());
        }
    }
}
// a shape is used to represent the actual stage of , every shape have four shapes
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


    getLayer(layer) {
        return this.layers[layer];
    }
    //for testing

    clone() {
        const clone = new Shape();
        clone.layers = this.layers.map(layer => layer.clone());
        return clone;
    }
    toStr() {
        let s = "";
        for (let i = 0; i < 4; i++) {
            if (this.layers[i].toStr() != "--------") {
                if (i != 0) {
                    s += ":";
                }
                s += this.layers[i].toStr();
            }
        }
        return s;
    }

    //todo : update stack to handle multiple layers(meaning putting on top of each other, current version only put the next to each other),cut

    //check if two shape needs to be stack on top or just normal adding up
    needStackOnTop(otherShape) {
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (this.layers[i].getQuadrant(j) != "--" && otherShape.getLayer(i).getQuadrant(j) != "--") {
                    return true;
                }
            }
        }
        return false;
    }

    stack(otherShape) {

        if (!this.needStackOnTop(otherShape)) {
            for (let i = 0; i < 4; i++) {
                for (let j = 0; j < 4; j++) {
                    if (this.layers[i].getQuadrant(j) == "--") {
                        this.layers[i].setQuadrant(j, otherShape.getLayer(i).getQuadrant(j));
                    }
                }
            }
        }
        else {
            //console.log("stacking "+ this.toStr() + " and " + otherShape.toStr());
            // Find the lowest non-colliding layer of the other shape
            let otherShapeStartingLayer = 0;
            while (otherShapeStartingLayer < 4) {
                let foundLayer = true;
                for (let i = 0; i < 4 - otherShapeStartingLayer; i++) {
                    for (let j = 0; j < 4; j++) {
                        if (this.layers[i + otherShapeStartingLayer].getQuadrant(j) != "--" && otherShape.getLayer(i).getQuadrant(j) != "--") {
                            foundLayer = false;
                            break;
                        }
                    }
                    if (!foundLayer) {
                        break;
                    }
                }
                if (foundLayer) {
                    break;
                }
                otherShapeStartingLayer++;
            }
            // If other shape is unstackable, return the current shape unchanged
            if (otherShapeStartingLayer === 4) {
                return;
            }
            // Place the other shape
            for (let i = 0; i < 4 - otherShapeStartingLayer; i++) {
                for (let j = 0; j < 4; j++) {
                    let currentQuad = otherShape.getLayer(i).getQuadrant(j);
                    if (currentQuad != "--") {
                        this.layers[i + otherShapeStartingLayer].setQuadrant(j, currentQuad);
                    }
                }
            }
        }
    }


    rotate(rotateOp) {
        if (rotateOp > 2 || rotateOp < 0)
            throw new Error("invalid rotation");
        for (let i = 0; i < 4; i++) {
            this.layers[i].rotate(rotateOp);
        }
    }

    cut(side) {
        //0 is cut left and 2 is cut right
        for (let layer of this.layers) {
            layer.setQuadrant(0 + side, "--");
            layer.setQuadrant(1 + side, "--");
        }
    }

    //function to check if the shape is 1 layer
    getLayerLength() {
        let layerCount = 0;
        for (let layer of this.layers) {
            if (!layer.getQuadrants().every(quadrant => quadrant == "--")) {
                layerCount++;
            }
        }
        return layerCount;
    }

    getSide(side) {
        //0 is left side and 2 is right side
        let newShape = this.clone();
        for (let i = 0; i < 4; i++) {
            newShape.getLayer(i).setQuadrant(0 + side, "--");
            newShape.getLayer(i).setQuadrant(1 + side, "--");
        }
        return newShape;
    }
}
// 
class ActionNode {
    constructor(actionType, shape, leftChild = null, rightChild = null, cost = 1) {
        this._actionType = actionType;
        this._shape = shape.clone();
        this._cost = cost;
        this._children = [];
        let l_length = 1, r_length = 1;
        let l_level = 0, r_level = 0;
        if (leftChild) {
            this._children.push(leftChild);
            l_length += leftChild.getLength();
            l_level = leftChild.getLevel();
        }
        if (rightChild) {
            this._children.push(rightChild);
            r_length += rightChild.getLength();
            r_level = rightChild.getLevel();
        }
        for (let child of this._children) {
            this._cost += child.getCost();
        }
        this._length = Math.max(l_length, r_length);
        this._level = Math.max(l_level, r_level);
        if (this._children.length == 2) {
            this._level++;
        }
    }

    getActionType() {
        return this._actionType;
    }

    getShape() {
        return this._shape;
    }

    getChildren() {
        return this._children;
    }

    getLeftChild() {
        return this._children[0] || null;
    }

    getRightChild() {
        return this._children[1] || null;
    }
    getCost() {
        return this._cost;
    }
    getLength() {
        return this._length;
    }
    getBalance() {
        if (this._children.length == 2) {
            return Math.abs(this._children[0].getLength() - this._children[1].getLength());
        }
        else if (this._children.length == 1) {
            return this._children[0].getLength();
        }
        else {
            return 0;
        }
    }
    getLevel() {
        return this._level;
    }
    clone() {
        const clone = new ActionNode(this._actionType, this._shape, this.getLeftChild(), this.getRightChild());
        return clone;
    }
}

class ActionTree {
    constructor(root) {
        this.root = root;
    }

    printTree(node = this.root, level = 0, recepit = "") {
        recepit += "  ".repeat(level) + `${node.getShape().toStr()} ${node.getActionType()}\n`;
        for (let child of node.getChildren()) {
            recepit = this.printTree(child, level + 1, recepit);
        }
        //console.log(recepit);

        return recepit;
    }

    outputActionTree() {
        const output = [];

        function toFullShape (shapeStr){
            const quad = shapeStr.substr(0,2);
            let ans = "";
            for(let i = 0 ; i < 4 ; i++){   
                ans +=quad;
            }
            return ans;
        }
        function traverseTree(node, level, x, y) {
            let buildId = node.getActionType();
            if (buildId == "CUT_LEFT") {
                const trash = {
                    id: "trash",
                    position: new shapez.Vector(x + 1, y - 1),
                    rotation: "top"
                }
                output.push(trash);
            }
            if (buildId == "CUT_RIGHT") {
                const trash = {
                    id: "trash",
                    position: new shapez.Vector(x, y - 1),
                    rotation: "top"
                }
                output.push(trash);
            }
            if (buildId == "RAW") {
                const topB = {
                    id: "belt",
                    position: new shapez.Vector(x, y),
                    rotation: "top"
                }
                output.push(topB);
                const trash1 = {
                    id: "trash",
                    position: new shapez.Vector(x - 1, y),
                    rotation: "top"
                }
                output.push(trash1);
                const cutl = {
                    id: "cutter",
                    position: new shapez.Vector(x - 1, y + 1),
                    rotation: "top"
                }
                output.push(cutl);
                for (let i = 2; i < 3; i++) {
                    const topBelt = {
                        id: "belt",
                        position: new shapez.Vector(x - 1, y + i),
                        rotation: "top"
                    }
                    output.push(topBelt);
                }
                const rot = {
                    id: "rotater",
                    position: new shapez.Vector(x - 1, y + 3),
                    rotation: "top"
                }
                output.push(rot);
                for (let i = 4; i < 6; i++) {
                    const topBelt = {
                        id: "belt",
                        position: new shapez.Vector(x - 1, y + i),
                        rotation: "top"
                    }
                    output.push(topBelt);
                }
                const cut = {
                    id: "cutter",
                    position: new shapez.Vector(x - 1, y + 6),
                    rotation: "top"
                }
                output.push(cut);
                const trash2 = {
                    id: "trash",
                    position: new shapez.Vector(x, y + 5),
                    rotation: "top"
                }
                output.push(trash2);
                for (let i = 7; i < 8; i++) {
                    const topBelt = {
                        id: "belt",
                        position: new shapez.Vector(x - 1, y + i),
                        rotation: "top"
                    }
                    output.push(topBelt);
                }
                console.log(toFullShape(node.getShape().toStr()));
                const sg = {
                    id: "shape_generator",
                    position: new shapez.Vector(x - 1, y + 8),
                    rotation: "top",
                    shape: toFullShape(node.getShape().toStr())
                }
                output.push(sg);
            }
            let variant = null;
            switch (buildId) {
                case "STACK":
                    buildId = "stacker";
                    break;
                case "RAW":
                    return;
                case "CUT_LEFT":
                case "CUT_RIGHT":
                    buildId = "cutter";
                    break;
                case "ROTATE_0":
                    buildId = "rotater";
                    break;
                case "ROTATE_1":
                    variant = "rotate180";
                    buildId = "rotater";
                    break;
                case "ROTATE_2":
                    variant = "ccw";
                    buildId = "rotater";
                    break;
            }

            const children = node.getChildren();
            // Add this node to the output
            const nodeData = {
                id: buildId,
                position: new shapez.Vector(x, y),
                rotation: "top",
                variant: variant
            };
            output.push(nodeData);
            if (children.length === 0) {

            } else if (children.length === 1) {
                traverseTree(children[0], level, x, y + 3);
                for (let i = 1; i < 3; i++) {
                    const topBelt = {
                        id: "belt",
                        position: new shapez.Vector(x, y + i),
                        rotation: "top"
                    }
                    output.push(topBelt);
                }

            } else {
                traverseTree(children[0], level - 1, x - Math.pow(2, level), y + 4);
                traverseTree(children[1], level - 1, x + Math.pow(2, level), y + 4);
                let leftOffset = 0, rightOffset = 0;
                if (children[0].getActionType == "CUT_LEFT") {
                    leftOffset = -1;
                }
                if (children[1].getActionType == "CUT_LEFT") {
                    rightOffset = 1;
                }
                const p2 = Math.pow(2, level);
                const topBelt1 = {
                    id: "belt",
                    position: new shapez.Vector(x + p2, y + 3),
                    rotation: "top"
                }
                output.push(topBelt1);
                const topBelt11 = {
                    id: "belt",
                    position: new shapez.Vector(x + p2, y + 2),
                    rotation: "top"
                }
                output.push(topBelt11);
                const topBelt2 = {
                    id: "belt",
                    position: new shapez.Vector(x - p2, y + 3),
                    rotation: "top"
                }
                output.push(topBelt2);

                const topBelt21 = {
                    id: "belt",
                    position: new shapez.Vector(x - p2, y + 2),
                    rotation: "top"
                }
                output.push(topBelt21);

                for (let i = p2 + rightOffset - 1; i >= 1; i--) {
                    const leftBelt = {
                        id: "belt",
                        position: new shapez.Vector(x + i, y + 2),
                        rotation: "left"
                    }
                    output.push(leftBelt);
                }

                for (let i = p2 + leftOffset - 1; i >= 0; i--) {
                    const rightBelt = {
                        id: "belt",
                        position: new shapez.Vector(x - i, y + 2),
                        rotation: "right"
                    }
                    output.push(rightBelt);
                }

                const topBelt3 = {
                    id: "belt",
                    position: new shapez.Vector(x, y + 1),
                    rotation: "top"
                }
                output.push(topBelt3);
                const topBelt4 = {
                    id: "belt",
                    position: new shapez.Vector(x + 1, y + 1),
                    rotation: "top"
                }
                output.push(topBelt4);

            }
        }
        console.log("level: " + this.root.getLevel());
        traverseTree(this.root, this.root.getLevel(), 0, 4);
        for (let i = 2; i < 4; i++) {
            const topBelt = {
                id: "belt",
                position: new shapez.Vector(0, i),
                rotation: "top"
            }
            output.push(topBelt);
        }

        console.log("done traversing");
        return output;
    }
}

// 全局变量
let all_message = "";
let messageArray = [];

// 将原来的 fileHandle 改为 handleString，直接处理字符串输入
async function handleString(inputString) {
    try {
        const lines = inputString.split('\n'); // 读取所有行
        lines.pop();
        let steps = 0;
        console.log("ALL SHAPES IN EACH LAYER ARE STARTING FROM 1st QUADRANT TO 2th CLOCKWISE！！！\n");
        lines.reverse().forEach(line => {  // 反转所有行
            steps += 1;
            translator(line.trim(), steps);  // 删除行首和行尾的空格
        });

        // 输出最终的累积消息
        console.log(all_message);
    } catch (err) {
        console.error(`Error processing input string: ${err}`);
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
    const validOperations = new Set(["STACK", "RAW", "ROTATE_0", "ROTATE_1", "ROTATE_2", "CUT_RIGHT", "CUT_LEFT"]);
    if (!validOperations.has(operation)) {
        console.log(`Invalid operation '${operation}'。`);
        return;
    }

    const objectCodes = codes.split(":");  // 按 ':' 拆分不同层次的代码

    // 层次名称
    const layerNames = ["\nFirst layer", "\nSecond layer", "\nThird layer", "\nFourth layer"];
    // 形状映射
    const shapeMap = {
        "-": "Empty Quadrant",
        "C": "Circle",
        "R": "Rectangle",
        "W": "Wind",
        "S": "Star"
    };
    // 颜色映射
    const colorMap = {
        "u": "Transparent",
        "r": "Red",
        "g": "Green",
        "b": "Blue",
        "y": "Yellow",
        "p": "Purple",
        "c": "Blue-Green",
        "w": "White"
    };

    // 遍历每组的代码
    objectCodes.forEach((codeChar, codeIndex) => {
        if (codeIndex >= layerNames.length) {
            return;  // 最多支持 4 层
        }

        readableLine += `${layerNames[codeIndex]}: `;  // 添加层次名称

        // 检查这组代码是否为偶数，形状和颜色应该成对
        if (codeChar.length % 2 !== 0) {
            console.log(`Warning: Code length in layer ${codeIndex + 1} is not correct`);
            return;
        }

        // 假设每组代码长度固定为偶数，即形状和颜色的组合
        for (let bitIndex = 0; bitIndex < codeChar.length; bitIndex += 2) {
            const shape = shapeMap[codeChar[bitIndex]] || "Unknown shape";
            const color = colorMap[codeChar[bitIndex + 1]] || "Transparent";
            // 拼接格式：[形状 颜色]
            readableLine += `[${shape} ${color}] `;
        }

        readableLine = readableLine.trim() + " ";  // 去除每组的末尾空格
    });

    // 翻译操作符
    switch (operation) {
        case "STACK":
            readableLine += "\nStack all the shapes we have built and form the shape above\n";
            break;
        case "RAW":
            readableLine += "\nPlace the shape above (Use rotate, bin or any helpful tools)\n";
            break;
        case "ROTATE_0":
            readableLine += "\nRotate 1 quadrant clockwise for the previous shape and form the shape above\n";
            break;
        case "ROTATE_1":
            readableLine += "\nRotate 2 quadrants clockwise for the previous shape and form the shape above\n";
            break;
        case "ROTATE_2":
            readableLine += "\nRotate 3 quadrants clockwise for the previous shape and form the shape above\n";
            break;
        case "CUT_LEFT":
            readableLine += "\nCut the left side of the previous shape and form the shape above\n";
            break;
        case "CUT_RIGHT":
            readableLine += "\nCut the right side of the previous shape and form the shape above\n";
            break;
    }

    const finalMessage = "Step Number: " + steps + "\n" + readableLine;
    all_message += finalMessage + "\n";
    //console.log(all_message);
    //messageArray.push(finalMessage);
}

function isQuadEmpty(quad) {
    return (quad == "--");
}
function solveLayer(layer) {
    let quads = [];
    for (let i = 0; i < 8; i += 2) {
        quads.push(layer.substring(i, i + 2));
    }
    let shape1, shape2, shape3, shape4;
    let a1, a2, a3, a4;
    let r2, r3, r4;
    if (!isQuadEmpty(quads[0])) {
        shape1 = new Shape(quads[0] + "------");
        a1 = new ActionNode("RAW", shape1);
    }
    if (!isQuadEmpty(quads[1])) {
        shape2 = new Shape(quads[1] + "------");
        a2 = new ActionNode("RAW", shape2);
        shape2.rotate(0);
        // ROTATE_0 90 degrees clockwise
        r2 = new ActionNode("ROTATE_0", shape2, a2);
    }
    if (!isQuadEmpty(quads[2])) {
        shape3 = new Shape(quads[2] + "------");
        a3 = new ActionNode("RAW", shape3);
        // ROTATE_1 180 degrees clockwise
        shape3.rotate(1);
        r3 = new ActionNode("ROTATE_1", shape3, a3);
    }
    if (!isQuadEmpty(quads[3])) {
        shape4 = new Shape(quads[3] + "------");
        a4 = new ActionNode("RAW", shape4);
        // ROTATE_2 270 degrees clockwise
        shape4.rotate(2);
        r4 = new ActionNode("ROTATE_2", shape4, a4);
    }


    let s12, s34;
    //need stacking of quad 0 and 1
    if (!isQuadEmpty(quads[0]) && !isQuadEmpty(quads[1])) {
        shape1.stack(shape2);
        s12 = new ActionNode("STACK", shape1, a1, r2);
    }

    //need stacking of quad 2 and 3
    if (!isQuadEmpty(quads[2]) && !isQuadEmpty(quads[3])) {
        shape3.stack(shape4);
        s34 = new ActionNode("STACK", shape3, r3, r4);
    }

    if (!isQuadEmpty(quads[0]) && !isQuadEmpty(quads[1]) && !isQuadEmpty(quads[2]) && !isQuadEmpty(quads[3])) {
        shape1.stack(shape3);
        return new ActionNode("STACK", shape1, s12, s34);
    }
    else if (!isQuadEmpty(quads[0]) && !isQuadEmpty(quads[1]) && !isQuadEmpty(quads[2]) && isQuadEmpty(quads[3])) {
        shape1.stack(shape3);
        return new ActionNode("STACK", shape1, s12, r3);
    }
    else if (!isQuadEmpty(quads[0]) && !isQuadEmpty(quads[1]) && isQuadEmpty(quads[2]) && !isQuadEmpty(quads[3])) {
        shape1.stack(shape4);
        return new ActionNode("STACK", shape1, s12, r4);
    }
    else if (!isQuadEmpty(quads[0]) && !isQuadEmpty(quads[1]) && isQuadEmpty(quads[2]) && isQuadEmpty(quads[3])) {
        return s12;
    }
    else if (!isQuadEmpty(quads[0]) && isQuadEmpty(quads[1]) && !isQuadEmpty(quads[2]) && !isQuadEmpty(quads[3])) {
        shape1.stack(shape3);
        return new ActionNode("STACK", shape1, a1, s34);
    }
    else if (!isQuadEmpty(quads[0]) && isQuadEmpty(quads[1]) && !isQuadEmpty(quads[2]) && isQuadEmpty(quads[3])) {
        shape1.stack(shape3);
        return new ActionNode("STACK", shape1, a1, r3);
    }
    else if (!isQuadEmpty(quads[0]) && isQuadEmpty(quads[1]) && isQuadEmpty(quads[2]) && !isQuadEmpty(quads[3])) {
        shape1.stack(shape4);
        return new ActionNode("STACK", shape1, a1, r4);
    }
    else if (!isQuadEmpty(quads[0]) && isQuadEmpty(quads[1]) && isQuadEmpty(quads[2]) && isQuadEmpty(quads[3])) {
        return a1;
    }
    else if (isQuadEmpty(quads[0]) && !isQuadEmpty(quads[1]) && !isQuadEmpty(quads[2]) && !isQuadEmpty(quads[3])) {
        shape2.stack(shape3);
        return new ActionNode("STACK", shape2, r2, s34);
    }
    else if (isQuadEmpty(quads[0]) && !isQuadEmpty(quads[1]) && !isQuadEmpty(quads[2]) && isQuadEmpty(quads[3])) {
        shape2.stack(shape3);
        return new ActionNode("STACK", shape2, r2, r3);
    }
    else if (isQuadEmpty(quads[0]) && !isQuadEmpty(quads[1]) && isQuadEmpty(quads[2]) && !isQuadEmpty(quads[3])) {
        shape2.stack(shape4);
        return new ActionNode("STACK", shape2, r2, r4);
    }
    else if (isQuadEmpty(quads[0]) && !isQuadEmpty(quads[1]) && isQuadEmpty(quads[2]) && isQuadEmpty(quads[3])) {
        return r2;
    }
    else if (isQuadEmpty(quads[0]) && isQuadEmpty(quads[1]) && !isQuadEmpty(quads[2]) && !isQuadEmpty(quads[3])) {
        return s34;
    }
    else if (isQuadEmpty(quads[0]) && isQuadEmpty(quads[1]) && !isQuadEmpty(quads[2]) && isQuadEmpty(quads[3])) {
        return r3;
    }
    else if (isQuadEmpty(quads[0]) && isQuadEmpty(quads[1]) && isQuadEmpty(quads[2]) && !isQuadEmpty(quads[3])) {
        return r4;
    }
    else {
        throw new Error("Not a valid layer");
    }
}



//check if a shape can be form from cutting
function canFormCut(shape, side) {
    //if not 2 layer 
    if (shape.getLayerLength() != 2) {
        return false;
    }
    //side = 0 means check for right cut and side = 2 is for left cut
    for (let i = 0; i < 2; i++) {
        if (shape.getLayer(i).getQuadrant(3 - (0 + side)) != "--") {
            return false;
        }
        if (shape.getLayer(i).getQuadrant(3 - (1 + side)) != "--") {
            return false;
        }
    }
    let q00 = shape.getLayer(0).getQuadrant(0 + side);
    let q01 = shape.getLayer(0).getQuadrant(1 + side);
    let q10 = shape.getLayer(1).getQuadrant(0 + side);
    let q11 = shape.getLayer(1).getQuadrant(1 + side);
    if ((q00 != "--" && q11 != "--" && q10 == "--" && q01 == "--") || (q00 == "--" && q11 == "--" && q10 != "--" && q01 != "--")) {
        return true;
    }
    return false;
}

function canRotate(shape) {
    return true;
}
function canStack() {
    return true;
}

// //convert the left part of the string splitted to a valid shape 
// function fillRight(shapeStr) {
//     let layers = shapeStr.split(":");
//     while (layers[layers.length - 1].length < 8) {
//         layers[layers.length - 1] += "--";
//     }
//     let res = layers.filter(layer => layer !== "--------");
//     return res.join(':');
// }

// //similar to fillRight but for right part
// function fillLeft(shapeStr) {
//     let layers = shapeStr.split(":");
//     while (layers[0].length < 8) {
//         layers[0] = "--" + layers[0];
//     }
//     let res = layers.filter(layer => layer !== "--------");
//     return res.join(':');
// }
function solveRightCut(shape) {
    //stack 2 layer on each other and cut
    let fakeSide0 = new Shape("Cu------");
    let fakeA0 = new ActionNode("RAW", fakeSide0);
    fakeSide0.rotate(1);
    fakeA0 = new ActionNode("ROTATE_1", fakeSide0, fakeA0.clone());
    let fakeSide1 = new Shape("Cu------");
    let fakeA1 = new ActionNode("RAW", fakeSide1);
    fakeSide1.rotate(1);
    fakeA1 = new ActionNode("ROTATE_1", fakeSide1, fakeA1.clone());
    let quad00 = new Shape(shape.getLayer(0).getQuadrant(0) + "------");
    let quad01 = new Shape(shape.getLayer(0).getQuadrant(1) + "------");
    let quad10 = new Shape(shape.getLayer(1).getQuadrant(0) + "------");
    let quad11 = new Shape(shape.getLayer(1).getQuadrant(1) + "------");
    let a00, a01, a11, a10, l0, l1;
    if (!isQuadEmpty(shape.getLayer(0).getQuadrant(0))) {
        a00 = new ActionNode("RAW", quad00);
        fakeSide0.stack(quad00);
        l0 = new ActionNode("STACK", fakeSide0, fakeA0, a00);
    }
    if (!isQuadEmpty(shape.getLayer(0).getQuadrant(1))) {
        a01 = new ActionNode("RAW", quad01);
        quad01.rotate(0);
        a01 = new ActionNode("ROTATE_0", quad01, a01.clone());
        fakeSide0.stack(quad01);
        l0 = new ActionNode("STACK", fakeSide0, fakeA0, a01);
    }
    if (!isQuadEmpty(shape.getLayer(1).getQuadrant(0))) {
        a10 = new ActionNode("RAW", quad10);
        fakeSide1.stack(quad10);
        l1 = new ActionNode("STACK", fakeSide1, fakeA1, a10);
    }
    if (!isQuadEmpty(shape.getLayer(1).getQuadrant(1))) {
        a11 = new ActionNode("RAW", quad11);
        quad11.rotate(0);
        a11 = new ActionNode("ROTATE_0", quad11, a11.clone());
        fakeSide1.stack(quad11);
        l1 = new ActionNode("STACK", fakeSide1, fakeA1, a11);
    }
    resShape = l0.getShape().clone();
    resShape.stack(l1.getShape());
    res = new ActionNode("STACK", resShape, l0, l1);
    resShape.cut(2);
    res = new ActionNode("CUT_RIGHT", resShape, res.clone());
    return res;
}

function processRaw(raw) {
    let res = "";
    for (let i = 0; i < raw.length; i++) {
        if (i != 0 && i % 8 == 0 && i != raw.length) {
            res += ":";
        }
        res += raw[i];
    }
    let layers = res.split(":");
    while (layers[0] == "--------") {
        layers.shift();
    }
    if (layers.length == 0) {
        return null;
    }
    while (layers[layers.length - 1] == "--------") {
        layers.pop();
    }
    if (layers.length == 0) {
        return null;
    }
    for (let i = 0; i < layers.length; i++) {
        if (layers[i] == "--------") {
            return null;
        }
    }
    return layers.join(':');
}
function checkCorrectStack(target, left, right) {
    // if (left == "Sr------" && right == "--Cr----:CwCwCwCw") {
    //     console.log("here");
    // }
    if (left == "" || right == "")
        return false;
    let l = new Shape(left);
    let r = new Shape(right);
    l.stack(r);
    if (l.toStr() != target) {
        return false;
    }

    return true;
}

function generateShapePairs(target) {
    let shape = new Shape(target);
    let shapeRaw = target.split(":").join("");
    let layers = shape.getLayerLength();
    if (layers == 2) {
        let bitMaskSize = Math.pow(2, layers * 4);
        const iterations = new Map();
        for (let i = 0; i < bitMaskSize; i++) {
            let bitmask = i.toString(2).padStart(layers * 4, '0');
            let leftIteration = "";
            let rightIteration = "";
            for (let j = 0; j < layers * 4; j++) {
                const quad = shapeRaw.substr(j * 2, 2);
                if (bitmask[j] == '0') {
                    leftIteration += "--";
                    rightIteration += quad;
                }
                else {
                    leftIteration += quad;
                    rightIteration += "--";
                }
            }
            leftIteration = processRaw(leftIteration);
            rightIteration = processRaw(rightIteration);
            if (leftIteration != null && rightIteration != null) {
                iterations.set(leftIteration, rightIteration);
            }
        }
        return iterations;
    }
    let bitMaskSize = Math.pow(2, (layers - 2) * 4);
    const iterations = new Map();
    for (let i = 0; i < bitMaskSize; i++) {
        let bitmask = i.toString(2).padStart((layers - 2) * 4, '0');
        let leftIteration = "";
        let rightIteration = "";
        for (let j = 0; j < (layers - 2) * 4; j++) {
            const quad = shapeRaw.substr(8 + j * 2, 2);
            if (bitmask[j] == '0') {
                leftIteration += "--";
                rightIteration += quad;
            }
            else {
                leftIteration += quad;
                rightIteration += "--";
            }
        }
        leftIteration = shapeRaw.substr(0, 8) + leftIteration;
        leftIteration = processRaw(leftIteration);
        rightIteration += shapeRaw.substr((layers - 1) * 8);
        rightIteration = processRaw(rightIteration);
        if (leftIteration != null && rightIteration != null) {
            iterations.set(leftIteration, rightIteration);
        }
    }
    return iterations;
}

function solveLeftCut(shape) {
    //stack 2 layer on each other and cut
    let fakeSide0 = new Shape("Cu------");
    let fakeA0 = new ActionNode("RAW", fakeSide0);
    let fakeSide1 = new Shape("Cu------");
    let fakeA1 = new ActionNode("RAW", fakeSide1);
    let quad00 = new Shape(shape.getLayer(0).getQuadrant(2) + "------");
    let quad01 = new Shape(shape.getLayer(0).getQuadrant(3) + "------");
    let quad10 = new Shape(shape.getLayer(1).getQuadrant(2) + "------");
    let quad11 = new Shape(shape.getLayer(1).getQuadrant(3) + "------");
    let a00, a01, a11, a10, l0, l1;
    if (!isQuadEmpty(shape.getLayer(0).getQuadrant(2))) {
        a00 = new ActionNode("RAW", quad00);
        quad00.rotate(1);
        a00 = new ActionNode("ROTATE_1", quad00, a00.clone());
        fakeSide0.stack(quad00);
        l0 = new ActionNode("STACK", fakeSide0, fakeA0, a00);
    }
    if (!isQuadEmpty(shape.getLayer(0).getQuadrant(3))) {
        a01 = new ActionNode("RAW", quad01);
        quad01.rotate(2);
        a01 = new ActionNode("ROTATE_2", quad01, a01.clone());
        fakeSide0.stack(quad01);
        l0 = new ActionNode("STACK", fakeSide0, fakeA0, a01);
    }
    if (!isQuadEmpty(shape.getLayer(1).getQuadrant(2))) {
        a10 = new ActionNode("RAW", quad10);
        quad10.rotate(1);
        a10 = new ActionNode("ROTATE_1", quad00, a10.clone());
        fakeSide1.stack(quad10);
        l1 = new ActionNode("STACK", fakeSide1, fakeA1, a10);
    }
    if (!isQuadEmpty(shape.getLayer(1).getQuadrant(3))) {
        a11 = new ActionNode("RAW", quad11);
        quad11.rotate(2);
        a11 = new ActionNode("ROTATE_2", quad11, a11.clone());
        fakeSide1.stack(quad11);
        l1 = new ActionNode("STACK", fakeSide1, fakeA1, a11);
    }
    resShape = l0.getShape().clone();
    resShape.stack(l1.getShape());
    res = new ActionNode("STACK", resShape, l0, l1);
    resShape.cut(0);
    res = new ActionNode("CUT_LEFT", resShape, res.clone());
    return res;
}

const shapeSolutions = new Map();
function solveSearchShape(target, hasRotated = false) {
    if (shapeSolutions.has(target)) {
        return shapeSolutions.get(target);
    }
    let shape = new Shape(target);
    if (shape.getLayerLength() == 1) {
        let res = solveLayer(shape.toStr());
        shapeSolutions.set(target, res);
        return res;
    }
    if (canFormCut(shape, 0)) {
        let res = solveRightCut(shape);
        shapeSolutions.set(target, res);
        return res;
    }
    if (canFormCut(shape, 2)) {
        let res = solveLeftCut(shape);
        shapeSolutions.set(target, res);
        return res;
    }
    let actionsNode = [];
    if (canRotate() && !hasRotated) {
        let tmpNode;
        let rotate0 = shape.clone();
        rotate0.rotate(0);
        tmpNode = solveSearchShape(rotate0.toStr(), true);
        if (tmpNode != null) {
            actionsNode.push(new ActionNode("ROTATE_2", shape.clone(), tmpNode.clone()));
        }
        let rotate1 = shape.clone();
        rotate1.rotate(1);
        tmpNode = solveSearchShape(rotate1.toStr(), true);
        if (tmpNode != null) {
            actionsNode.push(new ActionNode("ROTATE_1", shape.clone(), tmpNode.clone()));
        }

        let rotate2 = shape.clone();
        rotate2.rotate(2);
        tmpNode = solveSearchShape(rotate2.toStr(), true);
        if (tmpNode != null) {
            actionsNode.push(new ActionNode("ROTATE_0", shape.clone(), tmpNode.clone()));
        }
    }
    if (canStack()) {
        let stackPairs = generateShapePairs(target);
        for (let [left, right] of stackPairs) {
            if (!checkCorrectStack(target, left, right)) {
                continue;
            }
            let leftNode = solveSearchShape(left);
            let rightNode = solveSearchShape(right);
            if (leftNode != null && rightNode != null) {
                actionsNode.push(new ActionNode("STACK", shape.clone(), leftNode, rightNode));
            }
        }
    }
    if (actionsNode.length == 0) {
        if (!hasRotated) {
            //console.log("shape not possible: " + target);
            shapeSolutions.set(target, null);
        }
        return null;
    }
    let resNode = actionsNode[0];
    for (let node of actionsNode) {
        if (resNode.getCost() > node.getCost() || (resNode.getCost() == node.getCost() && resNode.getBalance() > node.getBalance())) {
            resNode = node;
        }
    }
    shapeSolutions.set(target, resNode);
    return resNode;
}


function searchFor(target) {
    let root = solveSearchShape(target);
    if (root == null) {
        console.log("shape is impossible");
        return null;
    }
    else {
        aMap = new ActionTree(root);
        const recepit = aMap.printTree();
        console.log(recepit);
        handleString(recepit);
        let obj = aMap.outputActionTree();
        return obj;
    }
}

function main(cachedHashData) {
    let target = cachedHashData[0] || "CbCuCbCu:Sr------:--CrSrCr:CwCwCwCw"; // Fallback to default if no data
    return searchFor(target);
}

class Mod extends shapez.Mod {
    init() {
        const mod = this;
        this.modInterface.registerComponent(ShapeGeneratorComponent);
        // Register the new building
        this.modInterface.registerNewBuilding({
            metaClass: MetaShapeGeneratorBuilding,
            buildingIconBase64: RESOURCES["shapeGenerator.png"],
        });

        //Add it to the regular toolbar
        // this.modInterface.addNewBuildingToToolbar({
        //     toolbar: "regular",
        //     location: "primary",
        //     metaClass: MetaShapeGeneratorBuilding,
        // });

        this.modInterface.registerGameSystem({
            id: "shapeGenerator",
            systemClass: ShapeGeneratorSystem,
            before: "constantSignal",
            drawHooks: ["staticAfter"],
        });
        // Register the Out system
        this.modInterface.registerGameSystem({
            id: "out_system",
            systemClass: Out,
            before: "belt",
        });

        // close the windows
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
                z-index: 1000;
                line-height: 1.1;
            }
        `);

        this.signals.gameInitialized.add(function () {
            document.addEventListener("keydown", function (event) {
                if (event.key === "v" || event.key === "V") {
                    event.preventDefault();

                    const root = shapez.MODS.app.stateMgr.currentState.core.root;

                    if (!root || !root.logic) {
                        console.error("Game not initialized yet.");
                        return;
                    }

                    // Capture the shape data
                    const outSystem = root.systemMgr.systems["out_system"];
                    const cachedHashData = outSystem.captureAndLogCachedHash();

                    // Generate and place buildings
                    root.logic.performBulkOperation(() => {
                        mod.placeBuildings(root, cachedHashData);
                    });
                }
            });
        });
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
        uiContainer.innerText = stateKey === "MainMenuState"
            ? "Welcome to the Main Menu! This is your custom message box!"
            : all_message;
        document.body.appendChild(uiContainer);
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


    placeBuildings(root, cachedHashData) {
        console.log(root.entityMgr.entities);
        const gameLogic = root.logic;

        const buildingsToPlace = main(cachedHashData);

        if (!buildingsToPlace) {
            console.log("No valid shape captured or impossible to build.");
            return;
        }

        // const test = {
        //     id: "cutter",
        //     position: new shapez.Vector(3, 3),
        //     rotation: "top",
        // };
        //buildingsToPlace.push(test);

        const rotationMap = {
            top: 0,
            right: 90,
            bottom: 180,
            left: 270,
        };

        buildingsToPlace.forEach((buildingInfo) => {
            console.log("checking" + JSON.stringify(buildingInfo, null, 2));
            const buildingMeta = shapez.gMetaBuildingRegistry.findById(buildingInfo.id);
            if (!buildingMeta) {
                console.error(`Cannot find building ID: ${buildingInfo.id}`);
                return;
            }

            let variant = "default";
            if (buildingInfo.variant != null) {
                variant = buildingInfo.variant;
            }
            const rotationString = buildingInfo.rotation;
            const rotationDegree = rotationMap[rotationString];

            if (rotationDegree === undefined) {
                console.error(
                    `Invalid rotation '${rotationString}' for building ID: ${buildingInfo.id}. Valid rotations are: ${Object.keys(rotationMap).join(", ")}`
                );
                return;
            }

            // Generate the building code
            const code = shapez.getCodeFromBuildingData(buildingMeta, variant, 0);

            // Create the entity
            const entity = new shapez.Entity(root);
            entity.addComponent(
                new shapez.StaticMapEntityComponent({
                    origin: buildingInfo.position,
                    rotation: rotationDegree,
                    originalRotation: rotationDegree,
                    code: code,
                })
            );

            // Add other components as required by the building
            buildingMeta.setupEntityComponents(entity, root);


            if (Object.hasOwn(buildingInfo, "shape")) {
                console.log("has shape");
                const shapeGenComp = entity.components.ShapeGenerator;
                if (shapeGenComp) {
                    console.log("should change");
                    shapeGenComp.key = buildingInfo.shape;
                }
            }


            // Now, we can check if the entity can be placed
            const canPlace = gameLogic.checkCanPlaceEntity(entity, {});
            if (canPlace) {
                gameLogic.freeEntityAreaBeforeBuild(entity);
                root.map.placeStaticEntity(entity);
                root.entityMgr.registerEntity(entity);
                console.log(
                    `Successfully placed building: ${buildingInfo.id} at position (${buildingInfo.position.x}, ${buildingInfo.position.y})`
                );
            } else {
                console.log(
                    `Cannot place building: ${buildingInfo.id} at position (${buildingInfo.position.x}, ${buildingInfo.position.y})`
                );
            }
        });
    }
}

const RESOURCES = {
    "shapeGenerator.png":
        " data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAYAAABS3GwHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAM8GlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczpwaG90b3Nob3A9Imh0dHA6Ly9ucy5hZG9iZS5jb20vcGhvdG9zaG9wLzEuMC8iIHhtbG5zOnRpZmY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vdGlmZi8xLjAvIiB4bWxuczpleGlmPSJodHRwOi8vbnMuYWRvYmUuY29tL2V4aWYvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIwLTA0LTE3VDA5OjQ4OjU5KzAyOjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDIwLTA5LTI5VDEwOjM5OjEwKzAyOjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMC0wOS0yOVQxMDozOToxMCswMjowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6ODkzMjEwMWItMTM1Yy0xMTQ4LWI1OGYtOTEwMzQwNDM1NWIxIiB4bXBNTTpEb2N1bWVudElEPSJhZG9iZTpkb2NpZDpwaG90b3Nob3A6NjllZDIwM2EtYzY4YS0zYjQwLTg2ZWItNGQ3OWFkZjgxNDAzIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6NGQwZTY5MmYtOTRlNy00MDQyLWFjY2ItNmU3OGEzMGU1N2ZjIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiB0aWZmOk9yaWVudGF0aW9uPSIxIiB0aWZmOlhSZXNvbHV0aW9uPSI3MjAwMDAvMTAwMDAiIHRpZmY6WVJlc29sdXRpb249IjcyMDAwMC8xMDAwMCIgdGlmZjpSZXNvbHV0aW9uVW5pdD0iMiIgZXhpZjpDb2xvclNwYWNlPSI2NTUzNSIgZXhpZjpQaXhlbFhEaW1lbnNpb249IjE5MiIgZXhpZjpQaXhlbFlEaW1lbnNpb249IjE5MiI+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNyZWF0ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6NGQwZTY5MmYtOTRlNy00MDQyLWFjY2ItNmU3OGEzMGU1N2ZjIiBzdEV2dDp3aGVuPSIyMDIwLTA0LTE3VDA5OjQ4OjU5KzAyOjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOmU5YjQ3NzBkLWIzZWItZDU0My1iYzJiLWVjODk2MDYxN2NkZSIgc3RFdnQ6d2hlbj0iMjAyMC0wNC0xN1QwOTo0OTo1NCswMjowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTkgKFdpbmRvd3MpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDpiZTE5MDY3ZS01NDI4LTU0NDUtYTZhMS05NjBkODIwZTk1NGYiIHN0RXZ0OndoZW49IjIwMjAtMDktMjlUMTA6Mzk6MTArMDI6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE5IChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY29udmVydGVkIiBzdEV2dDpwYXJhbWV0ZXJzPSJmcm9tIGFwcGxpY2F0aW9uL3ZuZC5hZG9iZS5waG90b3Nob3AgdG8gaW1hZ2UvcG5nIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJkZXJpdmVkIiBzdEV2dDpwYXJhbWV0ZXJzPSJjb252ZXJ0ZWQgZnJvbSBhcHBsaWNhdGlvbi92bmQuYWRvYmUucGhvdG9zaG9wIHRvIGltYWdlL3BuZyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6ODkzMjEwMWItMTM1Yy0xMTQ4LWI1OGYtOTEwMzQwNDM1NWIxIiBzdEV2dDp3aGVuPSIyMDIwLTA5LTI5VDEwOjM5OjEwKzAyOjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOmJlMTkwNjdlLTU0MjgtNTQ0NS1hNmExLTk2MGQ4MjBlOTU0ZiIgc3RSZWY6ZG9jdW1lbnRJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOjk3MDYxZWYyLTY2ZGMtZjI0Zi1iZTMyLTVhNTdhOWI3YTQzNCIgc3RSZWY6b3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjRkMGU2OTJmLTk0ZTctNDA0Mi1hY2NiLTZlNzhhMzBlNTdmYyIvPiA8cGhvdG9zaG9wOlRleHRMYXllcnM+IDxyZGY6QmFnPiA8cmRmOmxpIHBob3Rvc2hvcDpMYXllck5hbWU9IjUsMyIgcGhvdG9zaG9wOkxheWVyVGV4dD0iNSwzIi8+IDxyZGY6bGkgcGhvdG9zaG9wOkxheWVyTmFtZT0iJmFtcDsiIHBob3Rvc2hvcDpMYXllclRleHQ9IiZhbXA7Ii8+IDxyZGY6bGkgcGhvdG9zaG9wOkxheWVyTmFtZT0iKyIgcGhvdG9zaG9wOkxheWVyVGV4dD0iKyIvPiA8cmRmOmxpIHBob3Rvc2hvcDpMYXllck5hbWU9IiEiIHBob3Rvc2hvcDpMYXllclRleHQ9IiEiLz4gPC9yZGY6QmFnPiA8L3Bob3Rvc2hvcDpUZXh0TGF5ZXJzPiA8cGhvdG9zaG9wOkRvY3VtZW50QW5jZXN0b3JzPiA8cmRmOkJhZz4gPHJkZjpsaT5hZG9iZTpkb2NpZDpwaG90b3Nob3A6MDgyZTM5ZWMtYjBiYS03YzRlLTg1NTgtZDc3MzdjYjlkZWRjPC9yZGY6bGk+IDxyZGY6bGk+YWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOjdiYTk3NDI4LTEyZDktZjY0MC1hMDdkLWExMTJkZWQ0M2NkYzwvcmRmOmxpPiA8cmRmOmxpPmFkb2JlOmRvY2lkOnBob3Rvc2hvcDo4Zjc5NDE2Zi03NzllLWM1NGQtYTI2Ni0wNjliOGZkYmVlNDk8L3JkZjpsaT4gPC9yZGY6QmFnPiA8L3Bob3Rvc2hvcDpEb2N1bWVudEFuY2VzdG9ycz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz5k8b2FAAARbklEQVR42u2daWxc1RXHj5fYHjtex9vYHu+JTZx4y8oSKJSKpOFDoWrVAlUlmqYCJKRKFaj93PZD+w0KSBA2QaLSAgEhSFLaT0ElCbHjJM6G7XiNx/Fuj9eZsd17rmeC67w3+/re/ycdEd68Gc/ce/73nHvefe/GHTz0PAGgV+LRBEDPJKIJIkKysPuE7RWWIuyUsK+ETaFpIAAtkyTsNWFPrzv+ovO/R4U9I2waTYUUSIvOf0HB+dfyhPOcMjQXBKBF56/14txy57k/R7NBAHpzfheZwt4T9hSaDwLQm/O7SHCK4JdoRm1OguN04Pxt7pw/v6CQ4uPiaGjI4u5z3hG2QdibGm+vFS0LoJ6+K/ttF1YizKDnkYedv0CYDMMJCTR4c8Dd6W84TcvMC+NGaKHvysIXY1kAO4Q9KexxYaUItsrOzxiNuZQgRDDQ30crKyt6bRYeEDc57WfOY33CPhZ2RNi5UPzRhObtu4P9mVzF+L2wd4XtcU7ogIrzu0hJMVCKwUDTU7gWtq4YwD50SFiqsE5hk9E8CXbVsV9A33nv/C4yMjKpvKKS4uNRm1DgBadvPRGtAnjWGaoy0Fe+O7+LjRvTqaKySqZE4M4xwuljz0abAPgLvYL+Ccz5XaSmplFlVTUlJmKligqvBEsEwWjhJz05P3dkTU0tVW/aRCaTidLT02nDhg0x3wtLS0t0+I3XaWxsLGjOv3ZOUFm1ibpvdJHdblM9r7GxiX544EDMt6Xdbier1UoWi4U6Ozro+vVr5HA4PIlgyhkR/CYuwPsBKpx5Wbrih8fFUVNzM+3dez+lpaVpaggKpfP/n2PYbNTd3UWLi4uq52zZUkc/euwxTbXv7OwsfXXqFLW2trirjFmFNQjr9vfvBFoF+oOwB5VeMBgM9JOf/pR27NhJSUlJcH5/O0jMBTKzsmlGjI5qI+LIyAhZhixUV7dVM23MPlNdXU1mcyl1dnao/XZeVs7h8ctICIDr/O+oOf+TT/2CiotLNJd8htP5b0/U4uMpS4iAR0VOFZQYHx+n3t4eqm9o0FR7Z2VlUZWYD129ekVNBPcK+1zYYLgnwU+ppT2PPf445efnw/mDCEcCrg5xlUiNvr4+OnxYexeM2ZfYp9i3fPHFUAvgR0oHOecvL6/QZOnhxPHjEXH+tZGArxPw9QI1hm/dohMnjmuu7dmnmpu3q728L9wC4DhbplTt4QmvFuHR/8KFtog5/9oIW1pWLlMiNVpbWjTZB/ft3atWGq4h/1bc+i2A+xS/RU2N5qo9Lvr7+yLu/GtFYC4tk2uI1L9vv+b6gH2rqqrKJ58MlQD2Kh3ctHkzaZX+vv6ocP61FBWXUF5+gc+CjWU2b67xySc94e+FsGalg4WFJs0KwFxqVsm5h6T5wrb6RtXXLl1sC873NWtzAW5xiWpl8Z5wRgDFb8FXeDUrgBhzKLPZrMl+cONjxeESANeiFG9m0cLyBjW4DNnQ0BgT37V5+3bN9oMbHzOQH3cZYt2tD+zbv19MPI1R/R3zCwpo37796CwIIDRR4OCvD0VtJGhqaqaDB3+NjgrDJFjXIjjw6KNUU1srKy0D/f0RLTny6lppRUVUXl5OSw4HJeh0GXVry5m45u27VyCAMMALtdjc8ec//TFof+/Z557zeA6vmpyZnZH18sTEDbrrk8vtFzYKAfj0WEmkQBpDimBmxu09BFpleXl5w+HXX0qGAIBz5ahNjz/dIEQQBwEAKQKbTXciYJ/eAAEAydzcrNu7yTSK1wLAJDgGcbcSFPjm14gAQKtpEAQAdAsmwQBAAABAAABAAABAAABAAABAAACsgivBIYTvy1W6V8DXG995vT9ABIg5SoJ0YzoEAAHEaAQIzpMk+G4vAAHEHHzH2D333BvQZ/ATHsrKytCYEEBs8r0HH/RbBOz8e/bsQSNiEhz7IiiRE2LPN9HzxJnPzcnJwcgPAWgrHfJ0E/1aJicn0GhIgQCAAACAAACAAADAJFgf4MZ3RAAAIAAAIAAAIAAAMAnWDLwswrXzJG/Ap9VN7SAAcJvuGzfoUvslar90SfH1rdu20bat26iishKNBQFoh67OTjp79gx1d3e7PY+FwVZRUUG7du2mKh/WDgEIIKqw2+3UKRz/66//S0MWi2+RQgiFrdBkorvvvkcuotPyDpwQgIaYmpqi1pYWunr1asArOlk4xz7+SF4Uu+uuu+T9AZmZmWhkCCD6GB0dpQsX2qjt/PmgP4+fhcSRpLW1hRqbmuQulbm5uWh0CCDyDA4O0uXL7XTum2/k/lzewilNVnbOqoNPjMuUyRMsrDOnT9PZM2dox86dVFe3lYpwvzAEEAl6e3vpyuXLdP58q0/vS05Ooby8fOH82RQXt/oU74KCQiGCCRoZGRZOvuDxM1ho35w9K433Bt5SV4e7xyCA8MClzLa28zLH94XU1FTh+AWUoZDDsxCyc3KkTYs5xMjILZqbm/Pqc1mAbDxHaGxsQgkVAggN3pYy15OeniFH/LSNG706nwXCNjszIyOC1erdtrcsSDaUUCGAoOFvKZNH9MzMLMrLz6eUFINff5sFw7awME8jw8M0NTXp1RwDJVQIIGD8LWXGx8dTtpjY5ooRPykpKSjfhQVkLi2jApuJRkVEmBAT5uXlZY/vQwkVAvAZf0uZCQkJZDTmkjE3jxITQ9OkLKii4hLKFxPmsdERGhsbpaWlJY/vQwkVAvBIIKXMXOH0OcL5efQPS4cJgRUUmkR6VUDjQgSjQgwooUIAfsMO8e9/f+nTe5RKmeGGBcepFkcdf0uoDz/8A9q1ezcEoFdOnjxBLefOeX2+u1JmpAikhMrCnxAp0iOP7IMA9AanPN46v6+lzEjhTwmV26CkpESmRBCAjuAqj6eRNdBSZqTwtYTKbaFXAejylsh//euk6gNqObfmis7mmrtk+THWnH8trhIq/xajm4k6twW3CSKADnjrrTdVL2qlpaVRaVlFyEqZkWJtCbWvt5tmZ2fvOIcrYAMDA/T0079CBNDyyO/uii7X1W1BXsocTfBvc3ftgNtGb5FANxGAlzTwKOeOhYUF6urqoBSDgXJFypCZlR22+n6o4KvGU5MTNDo2Sgvz8x7P5zaqrKzy6VHuEEAMwE9h8BZ2lIGBfrJYBik7xyjz52AtbQjbaG+zyavFE+NjXl0xXt9WEIDGGFCZ9PLFpPm5OZEXzyimRLz+hi09I0MKgUui0QyXPtnxrdPuS6BpaRvJkJoqf5u3bQUBxHQEUO5Uk6nodvozNjYir6oqLTZjh2JLSkomY26uXPTGa4CiARYqL5IbGx0VI7/6HIbTOb56bTTmUUpKijymJIB+CEB/sEMUF5upsLBIOhOvs1FaEMcOZhm8SbeGLHKlJYshUqVSrvOz0/OCN3crRJOTk+V6pWgSLQQQpbCD8AI3NqvVKqOCUjrBDjcu8ms2Tic4PeKrsKFeG8QXtHjJA6c5SmnbWlbTtjyRtqWjYyEA32HHYfM0oWRHZOPVoTli0pxjNFJiYnBvQnE47CIqrQrO3epPFnCsTtwhgCiFHYnnCnzz+tTkpIwK8wolRXbMW7eGaHj4llxGwU6YmpYW0N+em52V4vO0nMFgMMjRPjMrK+ZLtxBAlCLv+HKuvJybm5X5t5Jj8v9zXs7mzzUFb2v3rvVKPA9JTU1DB0EA4YMdLrU0jUyOYjlhVktNfLmm4G3t/rtUK1dzyzYggFhrQOGAvMaG79Canp6SUcHXawq+1O55tM/IyIzYjTgQAHCbjrB5f00h6fbI7y7tWl+7BxBAVOP9NQV1x0ftHgKIeby9prCWaKrdLzkc5BCpG4sRAgABsfaaAs8DOOdfC88Jgvk8oUDheYlrIq5lAaBgHGZcN6esh49F04UrX1eQQgAAQAAAQAAAQAAAQAAAQAAAQAAAQAAAQAAAQAAAQAAAQAAAQAAAQAAAQAAAQAAAQAAAQAAAQAAAQAAAQAABYDabFY/PWK267Xy1324ymSAArVGiIoDe3m4aGrK4fUiV1uDfyr+Zf7veBaCb5wKZzaX0Nf33juP86MKR4VvSNqankzEnVz6cSmvP3uQnVvNDucbGRz1GPVNREQSgNSorK8loNNLY2JjblICNN7fIkY9BN8b8JhM82k/InWzG5SYbnsjOzlZNF5ECxfIPjY+nfft/6NW57Ci8ycX1a1eou7tLbknkbnOKaBzt+Tvzd+ffwL/FG+dn7n/gAV1tsKGrRyOWlZXRgQOP0vHjX7jdVC5Wo4Kvo/36AeIB4fzFxcW6KgTo7tmgDY2NVFxSIndEb21t8fp9rqgwHGVzBV9yezXqtm6l+vp6mf7oDV0+HDc3N1ekQ/tpx86ddPHiBerp5krQkNfvj4aoEMhoz+Tl5cnKWG1NjdzySa/o+unQLISHHvq+/PeNG1105fIVKYhojQrBGO1ra2upetMmKi0tJYDHo9+msrJK2p677466qIDRHgLQXVTAaA8BRE1UaGhsoPb2dhro76eRkZGQRoVoG+15R0oIQOeUlJiFY+UL51yknp4e6uzooGvXrvkdFQyG1DvO4aUJ8/NzUTPac1k0KSlZ07vDQABewukLb3zHtmXLFqquqqampia6dv2631FhPbwUIxpy+6QNSZSUnCSjFlIgcGeDCcdgKyuvIFNRsd9RIRBCNdpzeqanq8AQQIBOE6yo4A2FhYVykRpGewhAV1Ghvr6BttRtkZPxyckJjPYQgPajgiu337lzlyzLYrSHADQRFbjEOTg4KIVQZDLdXndvEccGLRbp+EXiWGLiardkZWUHLEiM9hBA1EQFLoemGlLvmLyyEIJ5EwpGewggqqNCyrJBRgOOCt4uy8ZoDwFoNirYFoUY7P7dk4zRHgLQXVTAaA8BaD4qOBxLd5yTkmIQYknAaA8B6CMq3CmAFDROsAceNAGAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAACAAADQiABWhM0rvWC329GiIKQ4HA61lxbtdttKuCLAgNJBq5/7WwHgLdPT08qj8srKYDhToFalg7zRGwCh5OaA4thLS0uOs+EUwCmlgx3fdqCHQEj59tvrisdtNtvX4RTAV0oHr1+/RrOzs+glEBLYt7q6uhRfmxgfOx1OAfDW6X1KE5SvTp1CT4GQwL6lNAkW+X/n8S8+6QinAJhjipOD1hbq6elGb4GgwpsOsm8p4XDY/+Pv5wYigPdVZuP0ybFjNDw8jF4DQYF96ZNjH0vfUmJyYuIfkRDAOWF/VXphbm6Ojrz/HvX29qD3QECwD7EvsU8pYbfZXv70kw/aIiEA5jVhisX/+fl5OnrkCJ08eQITY+DXhJd9h32IfUmFmYGbfW8H8ncC3SCDk/1n3KVDLefO0YW2NqqtraWq6k1UVGSi9PSM21uBArCaxzvIap2mwUELdXWubjDu5qrvqvfPWH/3ny+/6I2kAJgjwnhD25fd/bj29nZpAAQDERVe/PvRt/+p8vJKOAXA/E0Y7+z2CroGhNz55+ZeOPL+4TfdnOL13rPBXA36qrAnhU2ji0CIsIq05zcenF8mHZEQAHNUWIOwv6CvQDCx22wvdd/ouF+kPR96c3q4U6C19Ah7URh/0SeE/ViYGV0IfGVlZeWmw27/bHJq4sNPj31w3su3LUdaAC6+cdpvhdULu0/YXmE7hRULw56fYC2LvKR5aWnpvBjtTwunP/35Zx9d9meKcPDQ8yvRIIC1XHTaq64D7737esby8jJ2fAarOYsfN7MofYxw/kVf3hCxYvzi4gJfQMsQloDuB0FgSdiMr2+K2D3BzjA17Uu+BoCbSe+0L6mPizjxpoh/+8Ovv5TinBPgJn3gCzzhXRA+vODvB0SFwzl/wJQzhNmc4WwF/QvWseL0DZvTV6YCcf6oiQAARAqkHAACAAACAAACAEBf/A/I68EiONrGVAAAAABJRU5ErkJggg==",

    "shapeGeneratorBlueprint.png":
        " data:image/png;base64,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",
};