
// popup.js - store backend URL in chrome.storage
(function () {
  const input = document.getElementById("backendUrl");
  const saveBtn = document.getElementById("save");

  chrome.storage.sync.get({ backendUrl: "http://localhost:8000" }, (res) => {
    input.value = res.backendUrl || "http://localhost:8000";
  });

  saveBtn.addEventListener("click", () => {
    const url = input.value.trim();
    chrome.storage.sync.set({ backendUrl: url }, () => {
      saveBtn.textContent = "Saved ✓";
      setTimeout(() => (saveBtn.textContent = "Save"), 1200);
    });
  });
})();
