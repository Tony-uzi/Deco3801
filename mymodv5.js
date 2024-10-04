const METADATA = {
    website: "https://tobspr.io",
    author: "RuiqiZhai",
    name: "Shape capture and solver",
    version: "1.5",
    id: "state_capture",
    description: "Get the real-time state of the game and print cachedHash in the console",
    minimumGameVersion: ">=1.5.0",
    doesNotAffectSavegame: true,
};

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
                console.log("Ctrl + P pressed! Capturing cachedHash data and solving shape...");

                const outSystem = shapez.MODS.app.stateMgr.currentState.core.root.systemMgr.systems["out_system"];
                
                if (outSystem) {
                    outSystem.captureAndLogCachedHash();
                } else {
                    console.error("out_system not found!");
                }
            }
        });
    }
}

class Layer {
    constructor(layer = null) {
        this.quadrants = ["--","--","--","--"];
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
        return this.quadrants.join('');
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
        if (rotateOp > 2 || rotateOp < 0)
            throw new Error("invalid rotation");
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
        clone.layers = this.layers.map(layer => layer.clone());
        return clone;
    }

    toStr() {
        let s = "";
        for (let i = 0; i < 4; i++) {
            if (this.layers[i].toStr() != "--------")
                s += this.layers[i].toStr();
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
        if (rotateOp > 2 || rotateOp < 0)
            throw new Error("invalid rotation");
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
        console.log("  ".repeat(level) + `${node.shape.toStr()}: ${node.actionType}`);
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
       
    for (let i = 0; i < target.length % 8 + 1; i++) {
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

function main(cachedHashData) {
    console.log("Solving shape for cachedHashData:", cachedHashData);
    
    if (Array.isArray(cachedHashData) && cachedHashData.length > 0) {
        let result = solveShape(cachedHashData[0]);
        console.log("Shape solving completed for:", cachedHashData[0]);
    } else {
        console.error("Invalid cachedHashData format:", cachedHashData);
    }
}