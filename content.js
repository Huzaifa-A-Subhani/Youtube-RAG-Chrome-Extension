
// content.js - injects a sidebar on YouTube and talks to your RAG backend
(function () {
  // avoid double injection
  if (window.__yt_rag_injected__) return;
  window.__yt_rag_injected__ = true;

  // Helpers
  function getVideoIdFromUrl(u = window.location.href) {
    try {
      const url = new URL(u);
      // watch?v=
      const vParam = url.searchParams.get("v");
      if (vParam) return vParam;
      // youtu.be/<id>
      if (url.hostname.includes("youtu.be")) {
        const parts = url.pathname.split("/").filter(Boolean);
        if (parts.length) return parts[0];
      }
      // embed/<id>
      if (url.pathname.includes("/embed/")) {
        const parts = url.pathname.split("/");
        const idx = parts.indexOf("embed");
        if (idx !== -1 && parts[idx + 1]) return parts[idx + 1];
      }
    } catch (e) {}
    return null;
  }

  function createSidebar() {
    if (document.getElementById("yt-rag-sidebar")) return;

    const c = document.createElement("div");
    c.id = "yt-rag-sidebar";
    c.innerHTML = `
      <div class="yt-rag-header">
        <span class="yt-rag-title">YouTube RAG Assistant</span>
        <button id="yt-rag-close" title="Close">×</button>
      </div>
      <div class="yt-rag-body">
        <div class="yt-rag-row">
          <label class="yt-rag-label">Question</label>
          <textarea id="yt-rag-input" placeholder="Ask about this video..."></textarea>
        </div>
        <div class="yt-rag-row">
          <button id="yt-rag-ask">Ask</button>
          <button id="yt-rag-summarize">Summarize</button>
        </div>
        <div id="yt-rag-status" class="yt-rag-status"></div>
        <div id="yt-rag-response" class="yt-rag-response"></div>
      </div>
      <div id="yt-rag-drag" class="yt-rag-drag"></div>
    `;
    document.body.appendChild(c);

    // draggable width
    const drag = document.getElementById("yt-rag-drag");
    let isDragging = false;
    drag.addEventListener("mousedown", () => { isDragging = true; document.body.classList.add("yt-rag-dragging"); });
    window.addEventListener("mouseup", () => { isDragging = false; document.body.classList.remove("yt-rag-dragging"); });
    window.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      const newWidth = window.innerWidth - e.clientX;
      const min = 260, max = Math.min(520, window.innerWidth * 0.6);
      const clamped = Math.max(min, Math.min(max, newWidth));
      c.style.width = clamped + "px";
    });

    document.getElementById("yt-rag-close").addEventListener("click", () => {
      c.remove();
      document.getElementById("yt-rag-toggle")?.classList.remove("active");
    });

    async function ask(question) {
      const status = document.getElementById("yt-rag-status");
      const respBox = document.getElementById("yt-rag-response");
      const videoId = getVideoIdFromUrl();
      if (!videoId) {
        status.textContent = "No video detected.";
        return;
      }
      status.textContent = "Thinking...";
      respBox.textContent = "";
      try {
        const backendUrl = await getBackendUrl();
        const r = await fetch(`${backendUrl.replace(/\/$/, "")}/query`, {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({ video_id: videoId, question })
        });
        const data = await r.json();
        respBox.textContent = data.answer ?? JSON.stringify(data);
        status.textContent = "";
      } catch (err) {
        status.textContent = "Error contacting backend. See console.";
        console.error(err);
      }
    }

    document.getElementById("yt-rag-ask").addEventListener("click", () => {
      const q = document.getElementById("yt-rag-input").value.trim();
      if (q) ask(q);
    });

    document.getElementById("yt-rag-summarize").addEventListener("click", () => {
      ask("Give me a concise summary of this video's main points.");
    });
  }

  function createToggleButton() {
    if (document.getElementById("yt-rag-toggle")) return;
    const btn = document.createElement("button");
    btn.id = "yt-rag-toggle";
    btn.textContent = "RAG";
    btn.title = "Toggle RAG Assistant";
    btn.addEventListener("click", () => {
      const panel = document.getElementById("yt-rag-sidebar");
      if (panel) {
        panel.remove();
        btn.classList.remove("active");
      } else {
        createSidebar();
        btn.classList.add("active");
      }
    });
    document.body.appendChild(btn);
  }

  function attachNavigationListeners() {
    // YouTube is SPA; listen to their navigation events
    window.addEventListener("yt-navigate-finish", () => {
      // clear previous response on new video
      document.getElementById("yt-rag-response")?.replaceChildren();
      document.getElementById("yt-rag-status")?.replaceChildren();
    });
    // fallback for history changes
    const pushState = history.pushState;
    history.pushState = function() {
      pushState.apply(this, arguments);
      window.dispatchEvent(new Event("yt-navigate-finish"));
    };
    window.addEventListener("popstate", () => {
      window.dispatchEvent(new Event("yt-navigate-finish"));
    });
  }

  async function getBackendUrl() {
    return new Promise((resolve) => {
      try {
        chrome.storage.sync.get({ backendUrl: "http://localhost:8000" }, (res) => {
          resolve(res.backendUrl || "http://localhost:8000");
        });
      } catch (e) {
        resolve("http://localhost:8000");
      }
    });
  }

  // init
  createToggleButton();
  attachNavigationListeners();
})();
