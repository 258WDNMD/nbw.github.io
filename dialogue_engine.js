import { gameState, getCurrentScene, getCurrentNode, applyAffinityChange, appendLog } from "./game_state.js";

function findNextNodeId(scene, node, choiceId) {
  if (!scene || !node) return null;
  if (choiceId) {
    const choice = (node.choices || []).find(c => c.id === choiceId);
    if (!choice) return null;
    if (choice.next) return choice.next;
    return null;
  }
  const nodes = scene.nodes || [];
  const idx = nodes.findIndex(n => n.id === node.id);
  if (idx < 0) return null;
  if (idx + 1 < nodes.length) {
    return nodes[idx + 1].id;
  }
  return null;
}

export function stepNext(choiceId) {
  const scene = getCurrentScene();
  const node = getCurrentNode();
  if (!scene || !node) return { type: "end" };
  if (!choiceId && Array.isArray(node.choices) && node.choices.length > 0) {
    return { type: "needChoice" };
  }
  const choice = choiceId ? (node.choices || []).find(c => c.id === choiceId) : null;
  if (choice && choice.affinityChange) {
    applyAffinityChange(choice.affinityChange);
  }
  const speakerId = node.speaker;
  const speaker = gameState.characters[speakerId];
  appendLog({
    speaker: speakerId,
    speakerName: speaker ? speaker.name : "？？？",
    text: node.text
  });
  if (choice && choice.nextScene) {
    gameState.currentSceneId = choice.nextScene;
    const newScene = getCurrentScene();
    if (!newScene || !Array.isArray(newScene.nodes) || newScene.nodes.length === 0) {
      return { type: "end" };
    }
    gameState.currentNodeId = newScene.nodes[0].id;
    return { type: "sceneChanged" };
  }
  const nextId = findNextNodeId(scene, node, choiceId);
  if (!nextId) {
    return { type: "sceneEnd" };
  }
  gameState.currentNodeId = nextId;
  return { type: "continued" };
}
