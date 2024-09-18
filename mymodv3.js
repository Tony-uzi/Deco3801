// @ts-nocheck
const METADATA = {
  website: "https://tobspr.io",
  author: "RuiqiZhai",
  name: "State capture",
  version: "1",
  id: "state_capture",
  description: "Get the real-time state of the game and send cachedHash via WebSocket",
  minimumGameVersion: ">=1.5.0",

  doesNotAffectSavegame: true,

  settings: {
    timesLaunched: 0,
  },
};

class Out extends shapez.GameSystem {
  // A method to gather entity data and send cachedHash via WebSocket
  sendCachedHashData() {
    try {
      // Access the current entity manager's entities
      const entities =
        shapez.MODS.app.stateMgr.currentState.core.root.entityMgr.entities;

      // Filter and extract only cachedHash from each entity's components
      const cachedHashData = Array.from(entities).map((entity) => {
        if (entity.components && entity.components.WiredPins) {
          return entity.components.WiredPins.slots
            .map(slot => slot.value?.definition?.cachedHash)
            .filter(cachedHash => cachedHash); // Filter out undefined values
        }
        return null;
      }).flat().filter(cachedHash => cachedHash !== null);

      // WebSocket connection setup
      const ws = new WebSocket("ws://localhost:8765");

      ws.onopen = () => {
        console.log("WebSocket connection established!");

        // Convert the data to a JSON string
        const jsonStr = JSON.stringify(cachedHashData);
        ws.send(jsonStr); // Send the cachedHash data
        console.log("cachedHash data sent to WebSocket server:", jsonStr);
      };

      ws.onerror = (error) => {
        console.error("WebSocket error: ", error);
      };

      ws.onclose = () => {
        console.log("WebSocket connection closed");
      };

    } catch (error) {
      console.error("Error sending cachedHash data: ", error);
    }
  }
}

class Mod extends shapez.Mod {
  init() {
    // Confirm mod loaded
    console.log("My Test Mod has been loaded!");

    // Increment the setting every time we launch the mod
    this.settings.timesLaunched++;
    this.saveSettings();

    // Register custom game system for capturing data
    this.modInterface.registerGameSystem({
      id: "out_system",
      systemClass: Out,
      before: "belt",
    });

    // Listen for keypress events for Ctrl + P
    document.addEventListener("keydown", (event) => {
      if (event.ctrlKey && event.key === "p") {
        // Prevent the default print dialog from opening
        event.preventDefault();

        console.log("Ctrl + P pressed! Capturing and sending cachedHash data...");
        const outSystem = shapez.MODS.app.stateMgr.currentState.core.root.systemMgr.systems["out_system"];
        if (outSystem) {
          outSystem.sendCachedHashData(); // Calls the method to send cachedHash data via WebSocket
        } else {
          console.error("out_system not found!");
        }
      }
    });
  }
}
