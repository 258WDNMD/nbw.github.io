const STORAGE_KEY = "neon_crossroads_saves_v1";

export function loadSaves() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (e) {
    return [];
  }
}

export function saveSaves(list) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
  }
}

export function createSaveSnapshot(gameState) {
  return {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    sceneId: gameState.currentSceneId,
    nodeId: gameState.currentNodeId,
    affinity: gameState.affinity,
    log: gameState.log.slice(-10)
  };
}
