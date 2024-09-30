// 模组元数据
const METADATA = {
    website: "https://tobspr.io",
    author: "RuiqiZhai",
    name: "Shape capture",
    version: "1.4",
    id: "state_capture",
    description: "Get the real-time state of the game and print cachedHash in the console",
    minimumGameVersion: ">=1.5.0",
    doesNotAffectSavegame: true,
  };
  
  // Out 类，用于捕捉和打印数据
  class Out extends shapez.GameSystem {
    captureAndLogCachedHash() {
      try {
        // 获取当前游戏状态下的所有实体
        const entities = shapez.MODS.app.stateMgr.currentState.core.root.entityMgr.entities;
  
        // 提取并过滤 `cachedHash` 数据
        const cachedHashData = Array.from(entities).map((entity) => {
          if (entity.components && entity.components.WiredPins) {
            return entity.components.WiredPins.slots
              .map(slot => slot.value?.definition?.cachedHash)
              .filter(cachedHash => cachedHash); // 过滤未定义的值
          }
          return null;
        }).flat().filter(cachedHash => cachedHash !== null);
  
        // 在控制台打印提取的 `cachedHash` 数据
        console.log("Captured cachedHash data:", cachedHashData);
      } catch (error) {
        console.error("Error capturing cachedHash data: ", error);
      }
    }
  }
  
  // 模组初始化和注册
  class Mod extends shapez.Mod {
    init() {
      // 模组加载提示
      console.log("State capture Mod has been loaded!");
  
      // 注册自定义游戏系统 `Out`
      this.modInterface.registerGameSystem({
        id: "out_system",
        systemClass: Out,
        before: "belt",
      });
  
      // 监听 Ctrl + P 键盘事件
      document.addEventListener("keydown", (event) => {
        if (event.ctrlKey && event.key === "p") {
          // 阻止默认打印行为
          event.preventDefault();
          console.log("Ctrl + P pressed! Capturing cachedHash data...");
          
          // 获取自定义 `out_system` 系统
          const outSystem = shapez.MODS.app.stateMgr.currentState.core.root.systemMgr.systems["out_system"];
          
          if (outSystem) {
            // 按下 Ctrl + P 时捕捉并打印 `cachedHash` 数据
            outSystem.captureAndLogCachedHash();
          } else {
            console.error("out_system not found!");
          }
        }
      });
    }
  }
  