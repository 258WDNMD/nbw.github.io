import { uiState, setActiveTab, toggleRightPanel } from "./ui_state.js";
import { initializeGame, gameState, getCurrentNode, exportSnapshot, importSnapshot, listSaves, upsertSave, deleteSave } from "./game_state.js";
import { stepNext } from "./dialogue_engine.js";
import { renderAll, renderSceneHeader, renderSceneCharacters, renderDialogue, renderAffinityChart, renderBranchSummary, renderSystemLog } from "./renderer.js";
import { suggestContinuation } from "./api_client.js";

async function fetchJson(path) {
  const res = await fetch(path);
  return await res.json();
}

async function bootstrap() {
  const [dataScenes, dataCharacters] = await Promise.all([fetchJson("data_scenes.json"), fetchJson("data_characters.json")]);
  initializeGame(dataScenes, dataCharacters);
  bindEvents();
  renderAll();
}

function bindEvents() {
  const tabStory = document.getElementById("tab-story");
  const tabChars = document.getElementById("tab-characters");
  const btnToggleRight = document.getElementById("btn-toggle-right");
  const btnNext = document.getElementById("btn-next");
  const dialoguePanel = document.getElementById("dialogue-panel");
  const choiceContainer = document.getElementById("choice-container");
  const btnSave = document.getElementById("btn-save");
  const btnLoad = document.getElementById("btn-load");
  const btnCloseSave = document.getElementById("btn-close-save");
  const btnNewSave = document.getElementById("btn-new-save");
  const btnLog = document.getElementById("btn-log");
  const btnCloseLog = document.getElementById("btn-close-log");
  const btnAi = document.getElementById("btn-ai");

  if (tabStory) {
    tabStory.addEventListener("click", () => {
      setActiveTab("story");
      document.getElementById("tab-story").classList.add("header-tab-active");
      document.getElementById("tab-characters").classList.remove("header-tab-active");
      renderAll();
    });
  }
  if (tabChars) {
    tabChars.addEventListener("click", () => {
      setActiveTab("characters");
      document.getElementById("tab-story").classList.remove("header-tab-active");
      document.getElementById("tab-characters").classList.add("header-tab-active");
      renderAll();
    });
  }
  if (btnToggleRight) {
    btnToggleRight.addEventListener("click", () => {
      toggleRightPanel();
    });
  }
  if (btnNext) {
    btnNext.addEventListener("click", () => {
      handleStep();
    });
  }
  if (dialoguePanel) {
    dialoguePanel.addEventListener("click", e => {
      const target = e.target;
      if (target && target.id === "dialogue-text") {
        handleStep();
      }
    });
  }
  if (choiceContainer) {
    choiceContainer.addEventListener("click", e => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      const choiceId = target.dataset.choiceId;
      if (!choiceId) return;
      handleStep(choiceId);
    });
  }
  if (btnSave) {
    btnSave.addEventListener("click", () => openSaveModal());
  }
  if (btnLoad) {
    btnLoad.addEventListener("click", () => openSaveModal());
  }
  if (btnCloseSave) {
    btnCloseSave.addEventListener("click", () => closeSaveModal());
  }
  if (btnNewSave) {
    btnNewSave.addEventListener("click", () => createNewSave());
  }
  if (btnLog) {
    btnLog.addEventListener("click", () => openLogModal());
  }
  if (btnCloseLog) {
    btnCloseLog.addEventListener("click", () => closeLogModal());
  }
  if (btnAi) {
    btnAi.addEventListener("click", () => requestAiSuggestion());
  }
}

function handleStep(choiceId) {
  const res = stepNext(choiceId);
  if (res.type === "needChoice") {
    renderSystemLog("请选择一个选项继续剧情。");
    renderDialogue();
    return;
  }
  if (res.type === "sceneChanged") {
    renderSystemLog("已进入新场景。");
    renderSceneHeader();
    renderSceneCharacters();
    renderDialogue();
    renderAffinityChart();
    renderBranchSummary();
    return;
  }
  if (res.type === "sceneEnd") {
    renderDialogue();
    renderSystemLog("本章节已结束。");
    renderAffinityChart();
    renderBranchSummary();
    return;
  }
  renderSceneCharacters();
  renderDialogue();
  renderAffinityChart();
  renderBranchSummary();
}

function openSaveModal() {
  const modal = document.getElementById("save-modal");
  if (!modal) return;
  modal.classList.remove("hidden");
  renderSaveList();
}

function closeSaveModal() {
  const modal = document.getElementById("save-modal");
  if (!modal) return;
  modal.classList.add("hidden");
}

function renderSaveList() {
  const listEl = document.getElementById("save-list");
  if (!listEl) return;
  listEl.innerHTML = "";
  const saves = listSaves();
  if (!saves.length) {
    const empty = document.createElement("div");
    empty.className = "text-xs text-slate-500";
    empty.textContent = "暂无存档。点击下方“新建存档”创建你的第一个分支。";
    listEl.appendChild(empty);
    return;
  }
  saves
    .slice()
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .forEach(save => {
      const item = document.createElement("div");
      item.className = "save-item";
      const main = document.createElement("div");
      main.className = "save-item-main";
      const title = document.createElement("div");
      title.className = "save-item-title";
      title.textContent = save.title || "未命名存档";
      const meta = document.createElement("div");
      meta.className = "save-item-meta";
      meta.textContent = formatSaveMeta(save);
      main.appendChild(title);
      main.appendChild(meta);
      const actions = document.createElement("div");
      actions.className = "save-item-actions";
      const loadBtn = document.createElement("button");
      loadBtn.className = "save-item-btn";
      loadBtn.textContent = "读档";
      loadBtn.addEventListener("click", () => {
        importSnapshot(save);
        renderAll();
        renderSystemLog("已从存档恢复进度。");
        closeSaveModal();
      });
      const delBtn = document.createElement("button");
      delBtn.className = "save-item-btn";
      delBtn.textContent = "删除";
      delBtn.addEventListener("click", () => {
        deleteSave(save.id);
        renderSaveList();
        renderSystemLog("已删除一个存档。");
      });
      actions.appendChild(loadBtn);
      actions.appendChild(delBtn);
      item.appendChild(main);
      item.appendChild(actions);
      listEl.appendChild(item);
    });
}

function formatSaveMeta(save) {
  const sceneId = save.currentSceneId;
  const nodeId = save.currentNodeId;
  let sceneLabel = sceneId || "未知场景";
  if (save.scenes && save.scenes[sceneId] && save.scenes[sceneId].title) {
    sceneLabel = save.scenes[sceneId].title;
  }
  const time = save.updatedAt ? new Date(save.updatedAt) : new Date();
  const h = time.getHours().toString().padStart(2, "0");
  const m = time.getMinutes().toString().padStart(2, "0");
  return sceneLabel + " / 节点 " + (nodeId || "?") + " · " + h + ":" + m;
}

function createNewSave() {
  const title = prompt("为这个存档起个名字吧（可留空）：") || "未命名存档";
  const snapshot = exportSnapshot();
  snapshot.title = title;
  snapshot.id = undefined;
  upsertSave(snapshot, title);
  renderSaveList();
  renderSystemLog("已创建新存档：“" + title + "”。");
}

function openLogModal() {
  const modal = document.getElementById("log-modal");
  const content = document.getElementById("log-content");
  if (!modal || !content) return;
  modal.classList.remove("hidden");
  content.innerHTML = "";
  if (!gameState.log.length) {
    const empty = document.createElement("div");
    empty.className = "text-xs text-slate-500";
    empty.textContent = "暂无记录。推进剧情后，这里会显示你走过的每一句对白。";
    content.appendChild(empty);
    return;
  }
  gameState.log.forEach(line => {
    const entry = document.createElement("div");
    entry.className = "log-entry";
    const head = document.createElement("div");
    head.className = "log-entry-speaker";
    head.textContent = line.speakerName || "？？？";
    const body = document.createElement("div");
    body.className = "log-entry-text";
    body.textContent = line.text;
    entry.appendChild(head);
    entry.appendChild(body);
    content.appendChild(entry);
  });
}

function closeLogModal() {
  const modal = document.getElementById("log-modal");
  if (!modal) return;
  modal.classList.add("hidden");
}

async function requestAiSuggestion() {
  const aiBox = document.getElementById("dialogue-ai-suggestion") || document.getElementById("dialogue-ai");
  let target = aiBox;
  if (!aiBox) {
    const parent = document.getElementById("dialogue-panel");
    if (!parent) return;
    const el = document.createElement("div");
    el.id = "dialogue-ai-suggestion";
    el.className = "dialogue-ai";
    parent.insertBefore(el, parent.lastElementChild);
    target = el;
  }
  const el = target;
  el.classList.remove("hidden");
  el.textContent = "联机思考中……";
  const ctx = gameState.log.slice(-8);
  const suggestion = await suggestContinuation(ctx);
  if (!suggestion) {
    el.textContent = "暂时无法联机续写，请稍后再试。";
    return;
  }
  el.textContent = suggestion;
  renderSystemLog("已生成一条联机续写建议。");
}

bootstrap();
