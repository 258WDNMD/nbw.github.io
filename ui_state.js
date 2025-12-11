export const uiState = {
  activeTab: "story",
  rightPanelVisible: true
};

export function setActiveTab(tab) {
  uiState.activeTab = tab;
}

export function toggleRightPanel() {
  uiState.rightPanelVisible = !uiState.rightPanelVisible;
  const rightPanel = document.getElementById("right-panel");
  if (!rightPanel) return;
  if (uiState.rightPanelVisible) {
    rightPanel.classList.remove("collapsed");
  } else {
    rightPanel.classList.add("collapsed");
  }
}
