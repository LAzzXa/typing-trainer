(function () {
  const promptEl = document.getElementById("prompt");
  const boxEl = document.getElementById("prompt-box");
  const wpmLive = document.getElementById("wpm-live");
  const accLive = document.getElementById("acc-live");
  const timerLive = document.getElementById("timer-live");
  const fingerHint = document.getElementById("finger-hint");
  const resultEl = document.getElementById("result");
  const resWpm = document.getElementById("result-wpm");
  const resAcc = document.getElementById("result-acc");
  const resRaw = document.getElementById("result-raw");
  const resChars = document.getElementById("result-chars");
  const motivation = document.getElementById("motivation");
  const scoreTable = document.getElementById("scoreboard");
  const chartEl = document.getElementById("chart");
  const bestEl = document.getElementById("best");
  const lessonPanel = document.getElementById("lesson-panel");
  const lessonList = document.getElementById("lesson-list");
  const difficultySel = document.getElementById("difficulty");
  const modeRow = document.getElementById("mode-row");
  const gameArea = document.getElementById("game-area");
  const multiPanel = document.getElementById("multi-panel");

  let currentLessonIdx = 0;
  let currentLessonOffset = 0;
  let mode = localStorage.getItem("st-mode") || "words";

  Engine.init(promptEl, boxEl);
  Engine.onFinish = (result) => showResult(result, true);

  function setMode(m) {
    mode = m;
    localStorage.setItem("st-mode", m);
    document.querySelectorAll(".mode-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.mode === m);
    });
    difficultySel.hidden = m === "lessons" || m === "online" || m === "quotes";
    lessonPanel.hidden = m !== "lessons";
    multiPanel.hidden = m !== "online";
    if (m === "online") {
      Multiplayer.show(multiPanel);
    } else if (m === "lessons") {
      gameArea.hidden = false;
      startLesson();
    } else {
      gameArea.hidden = false;
      startSolo();
    }
  }

  function startSolo() {
    Engine.settings.mode = mode;
    Engine.settings.difficulty = difficultySel.value || "medium";
    Engine.onFinish = (result) => showResult(result, true);
    Engine.startAt = null;
    let text;
    if (mode === "quotes") {
      text = QUOTES[Math.floor(Math.random() * QUOTES.length)];
      Engine.reset(text);
    } else {
      Engine.reset();
    }
    timerLive.textContent = mode === "time" ? Engine.settings.timeLimit : "--";
    wpmLive.textContent = "0";
    accLive.textContent = "100";
    fingerHint.textContent = "Type to start";
    resultEl.hidden = true;
    boxEl.classList.remove("running");
    promptEl.parentElement.focus();
    highlightKey(null);
  }

  function startLesson() {
    const lesson = ALL_LESSONS[currentLessonIdx];
    const texts = lesson.texts;
    currentLessonOffset = (currentLessonOffset + 1) % texts.length;
    Engine.settings.mode = "words";
    Engine.onFinish = (result) => showResult(result, true, lesson);
    Engine.startAt = null;
    Engine.reset(texts[currentLessonOffset]);
    timerLive.textContent = "--";
    wpmLive.textContent = "0";
    accLive.textContent = "100";
    fingerHint.textContent = lesson.hint;
    resultEl.hidden = true;
    boxEl.classList.remove("running");
    promptEl.parentElement.focus();
    highlightKey(null);
  }

  function renderLessonList() {
    const marks = JSON.parse(localStorage.getItem("st-lessons") || "{}");
    lessonList.innerHTML = "";
    ALL_LESSONS.forEach((lesson, i) => {
      const btn = document.createElement("button");
      btn.className = "lesson-btn" + (i === currentLessonIdx ? " active" : "");
      btn.innerHTML =
        lesson.title + (marks[lesson.id] ? ` <span class="lesson-best">best: ${marks[lesson.id]} WPM</span>` : "");
      btn.addEventListener("click", () => {
        currentLessonIdx = i;
        renderLessonList();
        startLesson();
      });
      lessonList.appendChild(btn);
    });
  }

  function showResult(result, save, lesson) {
    if (save) recordResult(result, lesson);
    resWpm.textContent = result.wpm;
    resRaw.textContent = result.raw;
    resAcc.textContent = result.acc;
    resChars.textContent = `${result.chars} / ${result.totalChars}`;
    if (result.acc >= 95) motivation.textContent = "Smooth! You are getting fast now.";
    else if (result.acc >= 85) motivation.textContent = "Great accuracy. Now gently push the speed up.";
    else if (result.acc >= 70) motivation.textContent = "Good work. Slow down a little to fix the slips.";
    else motivation.textContent = "Take it easy — accuracy first, speed follows.";
    resultEl.hidden = false;
    boxEl.classList.remove("running");
    renderScoreboard();
    renderChart();
  }

  function recordResult(result, lesson) {
    const history = JSON.parse(localStorage.getItem("st-history") || "[]");
    history.push({
      date: Date.now(),
      wpm: result.wpm,
      acc: result.acc,
      mode: lesson ? "lesson" : mode
    });
    if (history.length > 200) history.shift();
    localStorage.setItem("st-history", JSON.stringify(history));

    if (lesson) {
      const marks = JSON.parse(localStorage.getItem("st-lessons") || "{}");
      if (!marks[lesson.id] || result.wpm > marks[lesson.id]) marks[lesson.id] = result.wpm;
      localStorage.setItem("st-lessons", JSON.stringify(marks));
    }
  }

  function renderScoreboard() {
    const history = JSON.parse(localStorage.getItem("st-history") || "[]");
    const sorted = history.slice().sort((a, b) => b.wpm - a.wpm).slice(0, 5);
    scoreTable.innerHTML = "";
    if (!sorted.length) {
      scoreTable.innerHTML = "<p class='muted'>No scores yet. Finish a test to appear here.</p>";
      return;
    }
    sorted.forEach((r, i) => {
      const row = document.createElement("div");
      row.className = "score-row";
      row.innerHTML = `<span class="score-rank">${i + 1}</span><span class="score-wpm">${r.wpm} WPM</span><span class="score-acc">${r.acc}%</span><span class="score-mode">${r.mode}</span><span class="score-date">${new Date(r.date).toLocaleDateString()}</span>`;
      scoreTable.appendChild(row);
    });
  }

  function renderChart() {
    const history = JSON.parse(localStorage.getItem("st-history") || "[]").map((h) => h.wpm);
    const ctx = chartEl.getContext("2d");
    ctx.clearRect(0, 0, chartEl.width, chartEl.height);
    const pad = { top: 20, right: 20, bottom: 30, left: 50 };
    const w = chartEl.width - pad.left - pad.right;
    const h = chartEl.height - pad.top - pad.bottom;
    const max = Math.max(40, ...history, 10);
    ctx.font = "12px Segoe UI, sans-serif";
    const grid = getComputedStyle(chartEl);

    ctx.strokeStyle = "#334155";
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (h / 4) * i;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(chartEl.width - pad.right, y);
      ctx.stroke();
      ctx.fillStyle = "#94a3b8";
      ctx.fillText(Math.round(max - (max / 4) * i), 10, y + 4);
    }

    if (history.length > 1) {
      const step = w / (history.length - 1);
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      history.forEach((val, i) => {
        const x = pad.left + i * step;
        const y = pad.top + h - (val / max) * h;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    ctx.fillStyle = "#38bdf8";
    history.forEach((val, i) => {
      const x = pad.left + (history.length > 1 ? i * (w / (history.length - 1)) : w / 2);
      const y = pad.top + h - (val / max) * h;
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    });

    if (!history.length) {
      ctx.fillStyle = "#94a3b8";
      ctx.textAlign = "center";
      ctx.fillText("Finish a test to see your progress graph", chartEl.width / 2, chartEl.height / 2);
    }

    const best = history.length ? Math.max(...history) : 0;
    bestEl.textContent = best ? `Best WPM: ${best}` : "";
  }

function buildKeyboard() {
    const kb = document.getElementById("keyboard");
    let html = "";
    KEYBOARD_LAYOUT.forEach((row, ri) => {
      html += `<div class="kb-row">`;
      if (ri === 0) html += `<span class="kb-gap"></span>`;
      row.forEach((k) => {
        const finger = FINGER_KEY[k];
        const color = FINGER_COLOR[finger];
        html += `<button type="button" class="kb-key${HOME_ROW.includes(k) ? " home" : ""} finger-${finger}" data-key="${k}" title="${finger ? finger.toUpperCase() : ""}">${k.toUpperCase()}<span class="dot"${color ? ` style="background:${color}"` : ""}></span></button>`;
      });
      if (ri === KEYBOARD_LAYOUT.length - 1) html += `<span class="kb-gap"></span>`;
      html += `</div>`;
    });
    html += `<div class="kb-row"><button type="button" class="kb-key kb-space" data-key=" ">SPACE</button></div>`;
    kb.innerHTML = html;
    document.querySelectorAll(".kb-key").forEach((k) => {
      k.addEventListener("mousedown", (e) => e.preventDefault());
    });
  }

  function highlightKey(ch) {
    document.querySelectorAll(".kb-key").forEach((k) => {
      k.classList.remove("press", "target");
      if (k.dataset.key === ch) k.classList.add("target");
    });
  }

  function flashKey(ch) {
    document.querySelectorAll(".kb-key").forEach((k) => {
      if (k.dataset.key === ch) {
        k.classList.remove("press");
        void k.offsetWidth;
        k.classList.add("press");
      }
    });
  }

  Engine.onTick = function () {
    if (performance.now() < Engine.startAt) {
      const left = Math.max(0, Math.ceil((Engine.startAt - performance.now()) / 1000));
      timerLive.textContent = left;
      return;
    }
    wpmLive.textContent = Engine.started ? Engine.wpmNow() : "0";
    accLive.textContent = Math.round(Engine.accuracy());
    if (Engine.settings.mode === "time" && Engine.started) {
      timerLive.textContent = Math.max(0, Engine.settings.timeLimit - Math.floor(Engine.elapsed()));
    }
    highlightKey(Engine.text[Engine.idx] || null);
  };

  document.getElementById("restart").addEventListener("click", () => {
    if (mode === "lessons") startLesson();
    else startSolo();
  });

  document.getElementById("next-lesson").addEventListener("click", () => {
    currentLessonIdx = (currentLessonIdx + 1) % ALL_LESSONS.length;
    currentLessonOffset = 0;
    renderLessonList();
    startLesson();
  });

  document.querySelectorAll(".mode-btn").forEach((b) =>
    b.addEventListener("click", () => setMode(b.dataset.mode))
  );

  difficultySel.addEventListener("change", () => {
    if (mode !== "online") startSolo();
  });

  const themeBtn = document.getElementById("theme-btn");
  function applyTheme(t) {
    document.documentElement.dataset.theme = t;
    themeBtn.textContent = t === "dark" ? "Theme: Light" : "Theme: Dark";
    localStorage.setItem("st-theme", t);
  }
  themeBtn.addEventListener("click", () => {
    applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  });
  applyTheme(localStorage.getItem("st-theme") || "dark");

  boxEl.addEventListener("keydown", (e) => {
    if (mode === "online") return;
    if (Engine.finished) return;
    const ch = e.key.length === 1 ? e.key : null;
    if (ch) flashKey(ch.toLowerCase());
    if (!Engine.started && Engine.startAt === null) {
      highlightKey(Engine.text[0]);
    }
    Engine.key(e);
    if (e.key.length === 1) {
      const finger = FINGERS[e.key.toLowerCase()];
      fingerHint.textContent = finger ? `Use ${finger} finger` : "";
    }
    if (e.key === "Backspace") {
      const prev = Engine.text[Engine.idx];
      highlightKey(prev || null);
    }
  });

  boxEl.addEventListener("click", () => boxEl.focus());

  function start() {
    buildKeyboard();
    setMode(mode);
    renderLessonList();
    renderScoreboard();
    renderChart();
    if (typeof Multiplayer !== "undefined") Multiplayer.init();
  }

  start();
})();
