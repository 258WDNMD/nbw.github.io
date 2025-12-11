import { gameState, getCurrentScene, getCurrentNode } from "./game_state.js";
import { uiState } from "./ui_state.js";

let chart;

export function renderAll() {
  renderTabs();
  renderSceneHeader();
  renderSceneCharacters();
  renderDialogue();
  renderCharactersGrid();
  renderAffinityChart();
  renderBranchSummary();
  renderSystemLog("游戏已开始");
}

export function renderTabs() {
  const story = document.getElementById("dialogue-panel");
  const charsView = document.getElementById("tab-characters-view");
  const analytics = document.getElementById("right-panel");
  if (!story || !charsView || !analytics) return;
  if (uiState.activeTab === "story") {
    story.classList.remove("hidden");
    charsView.classList.add("hidden");
  } else if (uiState.activeTab === "characters") {
    story.classList.add("hidden");
    charsView.classList.remove("hidden");
  }
}

export function renderSceneHeader() {
  const scene = getCurrentScene();
  const titleEl = document.getElementById("scene-title");
  const subEl = document.getElementById("scene-subtitle");
  if (!scene || !titleEl || !subEl) return;
  titleEl.textContent = scene.title || "";
  subEl.textContent = scene.subtitle || "";
}

export function renderSceneCharacters() {
  const container = document.getElementById("scene-characters");
  if (!container) return;
  container.innerHTML = "";
  const mainSpeakerId = (getCurrentNode() || {}).speaker;
  const ids = gameState.characterOrder;
  ids.forEach(id => {
    const c = gameState.characters[id];
    if (!c) return;
    const outer = document.createElement("div");
    outer.className = "scene-character-card";
    if (id === mainSpeakerId) {
      outer.classList.add("scene-character-card-main", "scene-character-card-focus");
    } else {
      outer.classList.add("scene-character-card-muted");
    }
    const bg = document.createElement("div");
    bg.className = "scene-character-bg";
    const accent = document.createElement("div");
    accent.className = "scene-character-accent";
    accent.style.background =
      "radial-gradient(circle at 20% 0," +
      c.themeColor +
      "55, transparent 65%), radial-gradient(circle at 80% 0, rgba(148, 163, 184,0.7), transparent 70%)";
    const overlay = document.createElement("div");
    overlay.className = "scene-character-overlay";
    const silhouette = document.createElement("div");
    silhouette.className = "scene-character-silhouette";
    const meta = document.createElement("div");
    meta.className = "scene-character-meta";
    const name = document.createElement("div");
    name.className = "scene-character-name";
    name.textContent = c.name;
    const tagline = document.createElement("div");
    tagline.className = "scene-character-tagline";
    tagline.textContent = c.tagline;
    const line = document.createElement("div");
    line.className = "scene-character-accentline";
    line.style.background = "linear-gradient(to right," + c.themeColor + ", transparent)";
    meta.appendChild(name);
    meta.appendChild(tagline);
    meta.appendChild(line);
    outer.appendChild(bg);
    outer.appendChild(accent);
    outer.appendChild(overlay);
    outer.appendChild(silhouette);
    outer.appendChild(meta);
    container.appendChild(outer);
  });
}

export function renderDialogue() {
  const node = getCurrentNode();
  const scene = getCurrentScene();
  const speakerEl = document.getElementById("dialogue-speaker-name");
  const textEl = document.getElementById("dialogue-text");
  const labelEl = document.getElementById("dialogue-scene-label");
  const idxEl = document.getElementById("dialogue-line-index");
  const choiceContainer = document.getElementById("choice-container");
  if (!node || !speakerEl || !textEl || !labelEl || !idxEl || !choiceContainer || !scene) return;
  const speaker = gameState.characters[node.speaker];
  speakerEl.textContent = speaker ? speaker.name : "？？？";
  textEl.textContent = node.text || "";
  labelEl.textContent = (scene.title || "") + " / " + (scene.subtitle || "");
  const nodes = scene.nodes || [];
  const index = nodes.findIndex(n => n.id === node.id);
  idxEl.textContent = (index + 1).toString() + " / " + nodes.length.toString();
  const hasChoices = Array.isArray(node.choices) && node.choices.length > 0;
  choiceContainer.innerHTML = "";
  if (hasChoices) {
    choiceContainer.classList.remove("hidden");
    node.choices.forEach(choice => {
      const btn = document.createElement("button");
      btn.className = "choice-btn";
      btn.dataset.choiceId = choice.id;
      btn.textContent = choice.label;
      choiceContainer.appendChild(btn);
    });
  } else {
    choiceContainer.classList.add("hidden");
  }
}

export function renderCharactersGrid() {
  const grid = document.getElementById("characters-grid");
  if (!grid) return;
  grid.innerHTML = "";
  gameState.characterOrder.forEach(id => {
    const c = gameState.characters[id];
    if (!c) return;
    const card = document.createElement("div");
    card.className = "character-card";
    const header = document.createElement("div");
    header.className = "character-header";
    const avatar = document.createElement("div");
    avatar.className = "character-avatar";
    const avatarInner = document.createElement("div");
    avatarInner.className = "character-avatar-inner";
    avatar.appendChild(avatarInner);
    const names = document.createElement("div");
    const name = document.createElement("div");
    name.className = "character-name";
    name.textContent = c.name;
    const role = document.createElement("div");
    role.className = "character-role";
    role.textContent = c.role;
    names.appendChild(name);
    names.appendChild(role);
    header.appendChild(avatar);
    header.appendChild(names);
    const tagline = document.createElement("div");
    tagline.className = "character-tagline";
    tagline.textContent = c.tagline;
    const meta = document.createElement("div");
    meta.className = "character-meta";
    const affinity = document.createElement("div");
    affinity.className = "character-affinity-pill";
    const score = gameState.affinity[id] || 0;
    affinity.textContent = "好感度：" + score.toString();
    const alias = document.createElement("div");
    alias.textContent = "称呼：" + (c.alias || "未设定");
    meta.appendChild(affinity);
    meta.appendChild(alias);
    const actions = document.createElement("div");
    actions.className = "character-actions";
    const focusBtn = document.createElement("button");
    focusBtn.className = "character-action-btn";
    focusBtn.textContent = "在剧情中关注";
    focusBtn.disabled = true;
    actions.appendChild(focusBtn);
    card.appendChild(header);
    card.appendChild(tagline);
    card.appendChild(meta);
    card.appendChild(actions);
    grid.appendChild(card);
  });
}

export function renderAffinityChart() {
  const ctx = document.getElementById("affinity-chart");
  if (!ctx || typeof Chart === "undefined") return;
  const labels = [];
  const data = [];
  gameState.characterOrder.forEach(id => {
    const c = gameState.characters[id];
    if (!c) return;
    labels.push(c.alias || c.name);
    data.push(gameState.affinity[id] || 0);
  });
  const dataset = {
    labels,
    datasets: [
      {
        label: "好感度",
        data,
        borderWidth: 1.5,
        borderRadius: 6,
        backgroundColor: labels.map(() => "rgba(56, 189, 248, 0.4)"),
        borderColor: labels.map(() => "rgba(56, 189, 248, 0.9)")
      }
    ]
  };
  if (!chart) {
    chart = new Chart(ctx, {
      type: "bar",
      data: dataset,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (context) {
                return " 好感度：" + context.parsed.y.toString();
              }
            }
          }
        },
        scales: {
          x: {
            ticks: {
              color: "#9ca3af",
              font: { size: 10 }
            },
            grid: { display: false }
          },
          y: {
            ticks: {
              color: "#6b7280",
              font: { size: 9 }
            },
            grid: { color: "rgba(31, 41, 55, 0.6)" }
          }
        }
      }
    });
  } else {
    chart.data = dataset;
    chart.update();
  }
}

export function renderBranchSummary() {
  const el = document.getElementById("branch-summary");
  const scene = getCurrentScene();
  const node = getCurrentNode();
  if (!el || !scene || !node) return;
  let branch = "当前章节：" + (scene.title || "未知章节") + "\n";
  branch += "小节说明：" + (scene.subtitle || "——") + "\n\n";
  const hasChoices = Array.isArray(node.choices) && node.choices.length > 0;
  if (hasChoices) {
    branch += "即将出现的关键选择：\n";
    node.choices.forEach((c, idx) => {
      branch += "  · 选项 " + (idx + 1).toString() + "：" + c.label + "\n";
    });
  } else {
    branch += "此处暂无分支，你正在沿直线剧情前进。";
  }
  el.textContent = branch;
}

export function renderSystemLog(message) {
  const container = document.getElementById("system-log");
  if (!container) return;
  const row = document.createElement("div");
  row.className = "system-log-entry";
  const msg = document.createElement("span");
  msg.textContent = message;
  const time = document.createElement("span");
  const now = new Date();
  const h = now.getHours().toString().padStart(2, "0");
  const m = now.getMinutes().toString().padStart(2, "0");
  time.textContent = h + ":" + m;
  row.appendChild(msg);
  row.appendChild(time);
  container.prepend(row);
}
