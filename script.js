const WORDS = [
  "the", "be", "to", "of", "and", "a", "in", "that", "have", "it",
  "for", "not", "on", "with", "he", "as", "you", "do", "at", "this",
  "but", "his", "by", "from", "they", "we", "say", "her", "she", "or",
  "an", "will", "my", "one", "all", "would", "there", "their", "what",
  "so", "up", "out", "if", "about", "who", "get", "which", "go", "me",
  "when", "make", "can", "like", "time", "no", "just", "him", "know",
  "take", "people", "into", "year", "your", "good", "some", "could",
  "them", "see", "other", "than", "then", "now", "look", "only", "come",
  "its", "over", "think", "also", "back", "after", "use", "two", "how",
  "our", "work", "first", "well", "way", "even", "new", "want", "because",
  "any", "these", "give", "day", "most", "us", "very", "great", "quick",
  "type", "fast", "word", "test", "practice", "speed", "learn", "focus"
];

const WORD_COUNT = 30;
const TIME_LIMIT = 60;

const promptEl = document.getElementById("prompt");
const promptBox = document.getElementById("prompt-box");
const wpmLive = document.getElementById("wpm-live");
const accLive = document.getElementById("acc-live");
const timerLive = document.getElementById("timer-live");
const resultEl = document.getElementById("result");
const resWpm = document.getElementById("result-wpm");
const resAcc = document.getElementById("result-acc");
const resRaw = document.getElementById("result-raw");
const resChars = document.getElementById("result-chars");
const motivation = document.getElementById("motivation");
const chart = document.getElementById("chart");
const bestEl = document.getElementById("best");

let mode = "words";
let currentText = "";
let currentIdx = 0;
let startTime = null;
let timerId = null;
let timeRemaining = TIME_LIMIT;
let totalKeystrokes = 0;
let correctKeystrokes = 0;
let finished = false;

function buildText() {
  const n = mode === "words" ? WORD_COUNT : Math.max(40, Math.round(TIME_LIMIT));
  const words = [];
  for (let i = 0; i < n; i++) {
    words.push(WORDS[Math.floor(Math.random() * WORDS.length)]);
  }
  return words.join(" ");
}

function renderPrompt() {
  let html = "";
  for (let i = 0; i < currentText.length; i++) {
    let cls = "";
    if (i < currentIdx) {
      cls = currentText[i] === typedSoFar[i] ? "char-correct" : "char-wrong";
    } else if (i === currentIdx) {
      cls = "char-current";
    }
    html += `<span class="${cls}">${escapeHtml(currentText[i])}</span>`;
  }
  promptEl.innerHTML = html;
}

function typedSoFar() {
  return currentText.slice(0, currentIdx);
}

function escapeHtml(ch) {
  return ch === " " ? "&nbsp;" : ch === "<" ? "&lt;" : ch === ">" ? "&gt;" : ch;
}

function startTimer() {
  timeRemaining = TIME_LIMIT;
  startTime = Date.now();
  timerLive.textContent = mode === "time" ? timeRemaining : "--";
  timerId = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000;
    if (mode === "time") {
      timeRemaining = TIME_LIMIT - Math.floor(elapsed);
      timerLive.textContent = Math.max(0, timeRemaining);
      if (timeRemaining <= 0) finish();
    }
    updateLiveStats(elapsed);
  }, 250);
}

function updateLiveStats(elapsedSeconds) {
  const wordsTyped = currentText.slice(0, currentIdx).trim().split(/\s+/).filter(Boolean).length;
  if (elapsedSeconds > 0) {
    wpmLive.textContent = Math.round(wordsTyped / (elapsedSeconds / 60));
  } else {
    wpmLive.textContent = 0;
  }
  accLive.textContent = Math.round(accuracy());
}

function accuracy() {
  return totalKeystrokes === 0 ? 100 : (correctKeystrokes / totalKeystrokes) * 100;
}

function handleKey(e) {
  if (finished || !isValidKey(e)) return;

  if (currentIdx >= currentText.length) {
    finish();
    return;
  }

  if (startTime === null) {
    startTimer();
    promptBox.classList.add("running");
  }

  const expected = currentText[currentIdx];
  totalKeystrokes++;
  if (e.key === expected) {
    correctKeystrokes++;
    currentIdx++;
  } else if (e.key === "Backspace") {
    if (currentIdx > 0) currentIdx--;
    totalKeystrokes--;
  }

  renderPrompt();

  if (currentIdx >= currentText.length) {
    finish();
  }
}

function isValidKey(e) {
  if (e.ctrlKey || e.metaKey || e.altKey) return false;
  if (e.key === "Shift" || e.key === "CapsLock" || e.key === "Tab") return false;
  if (e.key === "Backspace") return true;
  return e.key.length === 1;
}

function finish() {
  finished = true;
  clearInterval(timerId);
  const elapsed = (Date.now() - startTime) / 1000;
  const typed = currentText.slice(0, currentIdx);
  const wordsTyped = typed.trim().split(/\s+/).filter(Boolean).length;
  const wpm = elapsed > 10 ? Math.round(wordsTyped / (elapsed / 60)) : 0;
  const rawWpm = elapsed > 10 ? Math.round((totalKeystrokes / 5) / (elapsed / 60)) : 0;
  const acc = Math.round(accuracy());

  resWpm.textContent = wpm;
  resRaw.textContent = rawWpm;
  resAcc.textContent = acc;
  resChars.textContent = `${typed.length} / ${currentText.length}`;

  const base = mode === "words" ? WORD_COUNT : TIME_LIMIT;
  if (elapsed >= 10) {
    if (acc >= 95 && wpm >= 60) motivation.textContent = "Smooth! You're a fast typist now.";
    else if (acc >= 95) motivation.textContent = "Great accuracy! Now push the speed up.";
    else if (acc >= 85) motivation.textContent = "Good work. Slow down a little to fix those slips.";
    else motivation.textContent = "Relax — accuracy comes first. Slower and steadier wins.";
  } else {
    motivation.textContent = "Keep going — finish a full test for a real score.";
  }

  const label = mode === "words" ? `words-${WORD_COUNT}` : `time-${TIME_LIMIT}`;
  saveResult({ date: Date.now(), wpm, acc, label });

  resultEl.hidden = false;
  promptBox.classList.remove("running");
  promptBox.blur();
  updateChart();
}

function saveResult(entry) {
  let history = JSON.parse(localStorage.getItem("speedtype-history") || "[]");
  history.push(entry);
  if (history.length > 100) history = history.slice(-100);
  localStorage.setItem("speedtype-history", JSON.stringify(history));
}

function updateChart() {
  const ctx = chart.getContext("2d");
  ctx.clearRect(0, 0, chart.width, chart.height);
  const colors = getComputedStyle(chart);
  const history = JSON.parse(localStorage.getItem("speedtype-history") || "[]");
  const recent = history.map((h) => h.wpm);

  const pad = { top: 20, right: 20, bottom: 30, left: 50 };
  const w = chart.width - pad.left - pad.right;
  const h = chart.height - pad.top - pad.bottom;
  const max = Math.max(40, ...recent, 10);

  ctx.font = "12px Segoe UI, sans-serif";

  ctx.strokeStyle = "#334155";
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (h / 4) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(chart.width - pad.right, y);
    ctx.stroke();
    ctx.fillStyle = "#94a3b8";
    ctx.fillText(Math.round(max - (max / 4) * i), 10, y + 4);
  }

  if (recent.length > 1) {
    const step = w / (recent.length - 1);
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    recent.forEach((val, i) => {
      const x = pad.left + i * step;
      const y = pad.top + h - (val / max) * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  ctx.fillStyle = "#38bdf8";
  recent.forEach((val, i) => {
    const x = pad.left + (recent.length > 1 ? i * (w / (recent.length - 1)) : w / 2);
    const y = pad.top + h - (val / max) * h;
    ctx.beginPath();
    ctx.arc(x, y, 3.5, 0, Math.PI * 2);
    ctx.fill();
  });

  if (recent.length === 0) {
    ctx.fillStyle = "#94a3b8";
    ctx.textAlign = "center";
    ctx.fillText("Complete a test to see your progress graph", chart.width / 2, chart.height / 2);
  }

  const best = recent.length ? Math.max(...recent) : 0;
  bestEl.textContent = best > 0
    ? `Best WPM: ${best} (${new Date(history[recent.indexOf(best)].date).toLocaleDateString()})`
    : "";
}

function loadMode(m) {
  mode = m;
  resetTest();
  document.querySelectorAll(".mode-btn").forEach((b) => b.classList.toggle("active", b.dataset.mode === m));
}

function resetTest() {
  clearInterval(timerId);
  currentText = buildText();
  currentIdx = 0;
  startTime = null;
  totalKeystrokes = 0;
  correctKeystrokes = 0;
  finished = false;
  wpmLive.textContent = "0";
  accLive.textContent = "100";
  timerLive.textContent = mode === "time" ? TIME_LIMIT : "--";
  resultEl.hidden = true;
  promptBox.classList.remove("running");
  renderPrompt();
  promptBox.focus();
}

promptBox.addEventListener("keydown", handleKey);
document.querySelectorAll(".mode-btn").forEach((b) => b.addEventListener("click", () => loadMode(b.dataset.mode)));
document.getElementById("restart").addEventListener("click", resetTest);

resetTest();
updateChart();
window.addEventListener("resize", () => updateChart());