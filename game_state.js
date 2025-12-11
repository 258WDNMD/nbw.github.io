import { loadSaves, saveSaves } from "./storage.js";

export const gameState = {
  scenes: {},
  characters: {},
  characterOrder: [],
  currentSceneId: null,
  currentNodeId: null,
  affinity: {},
  log: [],
  autoMode: false
};

export function initializeGame(dataScenes, dataCharacters) {
  gameState.scenes = dataScenes.scenes || {};
  const chars = {};
  const order = [];
  (dataCharacters.characters || []).forEach(c => {
    chars[c.id] = c;
    order.push(c.id);
  });
  gameState.characters = chars;
  gameState.characterOrder = order;
  const baseAffinity = {};
  order.forEach(id => {
    const c = chars[id];
    baseAffinity[id] = typeof c.affinity === "number" ? c.affinity : 0;
  });
  gameState.affinity = baseAffinity;
  gameState.currentSceneId = dataScenes.entryScene;
  const scene = gameState.scenes[gameState.currentSceneId];
  if (scene && scene.nodes && scene.nodes.length > 0) {
    gameState.currentNodeId = scene.nodes[0].id;
  }
  gameState.log = [];
}

export function getCurrentScene() {
  return gameState.scenes[gameState.currentSceneId] || null;
}

export function getCurrentNode() {
  const scene = getCurrentScene();
  if (!scene || !Array.isArray(scene.nodes)) return null;
  return scene.nodes.find(n => n.id === gameState.currentNodeId) || null;
}

export function applyAffinityChange(changeMap) {
  if (!changeMap) return;
  Object.keys(changeMap).forEach(id => {
    const v = changeMap[id];
    const current = typeof gameState.affinity[id] === "number" ? gameState.affinity[id] : 0;
    gameState.affinity[id] = current + v;
  });
}

export function appendLog(entry) {
  gameState.log.push({
    sceneId: gameState.currentSceneId,
    nodeId: gameState.currentNodeId,
    speaker: entry.speaker,
    speakerName: entry.speakerName,
    text: entry.text
  });
}

export function exportSnapshot() {
  return JSON.parse(JSON.stringify(gameState));
}

export function importSnapshot(snapshot) {
  if (!snapshot) return;
  gameState.scenes = snapshot.scenes || gameState.scenes;
  gameState.characters = snapshot.characters || gameState.characters;
  gameState.characterOrder = snapshot.characterOrder || gameState.characterOrder;
  gameState.currentSceneId = snapshot.currentSceneId || gameState.currentSceneId;
  gameState.currentNodeId = snapshot.currentNodeId || gameState.currentNodeId;
  gameState.affinity = snapshot.affinity || gameState.affinity;
  gameState.log = snapshot.log || gameState.log;
  gameState.autoMode = !!snapshot.autoMode;
}

export function listSaves() {
  return loadSaves();
}

export function upsertSave(snapshot, title) {
  const list = loadSaves();
  const item = {
    ...snapshot,
    id: snapshot.id || Date.now().toString(),
    title: title || "未命名存档",
    updatedAt: new Date().toISOString()
  };
  const idx = list.findIndex(s => s.id === item.id);
  if (idx >= 0) {
    list[idx] = item;
  } else {
    list.push(item);
  }
  saveSaves(list);
  return item;
}

export function deleteSave(id) {
  const list = loadSaves();
  const filtered = list.filter(s => s.id !== id);
  saveSaves(filtered);
}
