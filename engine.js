const Engine = {
  settings: { mode: "words", difficulty: "medium", timeLimit: 60 },
  text: "",
  idx: 0,
  keyTotal: 0,
  keyCorrect: 0,
  startAt: null,
  timer: null,
  promptEl: null,
  boxEl: null,
  onFinish: null,
  onTick: null,
  countdownMs: 0,
  started: false,
  finished: true,

  init(promptEl, boxEl) {
    this.promptEl = promptEl;
    this.boxEl = boxEl;
  },

  buildText() {
    const n = this.settings.mode === "words" ? 30 : 40;
    const pool = WORD_POOLS[this.settings.difficulty] || WORD_POOLS.medium;
    const out = [];
    for (let i = 0; i < n; i++) {
      out.push(pool[Math.floor(Math.random() * pool.length)]);
    }
    return out.join(" ");
  },

  setCountdownStart(msFromNow) {
    this.countdownMs = msFromNow;
    this.startAt = performance.now() + msFromNow;
  },

  reset(text) {
    if (this.timer) clearInterval(this.timer);
    this.text = text !== undefined ? text : this.buildText();
    this.idx = 0;
    this.keyTotal = 0;
    this.keyCorrect = 0;
    this.marks = new Array(this.text.length).fill(null);
    this.started = false;
    this.finished = false;
    this.startAt = null;
    this.render();
  },

  start() {
    if (performance.now() < this.startAt) return;
    this.started = true;
    this.startAt = performance.now();
    this.timer = setInterval(() => this.tick(), 250);
    if (this.settings.mode === "time" && this.onFinish) {
      setTimeout(() => {
        if (!this.finished) this.finish();
      }, this.settings.timeLimit * 1000);
    }
  },

  elapsed() {
    if (!this.startAt) return 0;
    return (performance.now() - this.startAt) / 1000;
  },

  wordsTyped() {
    return this.text.slice(0, this.idx).trim().split(/\s+/).filter(Boolean).length;
  },

  wpmNow() {
    const t = this.elapsed();
    if (t <= 3) return 0;
    return Math.round(this.wordsTyped() / (t / 60));
  },

  accuracy() {
    return this.keyTotal === 0 ? 100 : (this.keyCorrect / this.keyTotal) * 100;
  },

  key(e) {
    if (this.finished || !this.isValid(e)) return;

    if (!this.started) this.start();
    if (!this.started) return;

    if (e.key === "Backspace") {
      if (this.idx > 0) {
        this.idx--;
        this.marks[this.idx] = null;
      }
      this.keyTotal = Math.max(0, this.keyTotal - 1);
      this.render();
      return;
    }

    const expected = this.text[this.idx];
    this.keyTotal++;
    if (e.key === expected) {
      this.keyCorrect++;
      this.marks[this.idx] = "ok";
      this.idx++;
    } else {
      this.marks[this.idx] = "bad";
    }
    this.render();

    if (this.idx >= this.text.length) this.finish();
  },

  isValid(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return false;
    if (["Shift", "CapsLock", "Tab", "Escape"].includes(e.key)) return false;
    if (e.key === "Backspace" || e.key === " ") return true;
    return e.key.length === 1;
  },

  render() {
    if (!this.promptEl) return;
    let html = "";
    for (let i = 0; i < this.text.length; i++) {
      let cls = "";
      if (i < this.idx) {
        cls = this.marks[i] === "ok" ? "char-correct" : "char-wrong";
      } else if (i === this.idx) {
        cls = "char-current";
      }
      html += `<span class="${cls}">${this.esc(this.text[i])}</span>`;
    }
    this.promptEl.innerHTML = html;
  },

  esc(ch) {
    if (ch === " ") return "&nbsp;";
    if (ch === "<") return "&lt;";
    if (ch === ">") return "&gt;";
    if (ch === "&") return "&amp;";
    return ch;
  },

  tick() {
    if (this.onTick) this.onTick();
  },

  countdownLeft() {
    if (!this.startAt || performance.now() < this.startAt) {
      if (this.startAt) return Math.ceil((this.startAt - performance.now()) / 1000);
      return null;
    }
    return null;
  },

  result() {
    const t = this.elapsed();
    const typedWords = this.wordsTyped();
    const wpm = t > 3 ? Math.round(typedWords / (t / 60)) : 0;
    const raw = t > 3 ? Math.round((this.keyTotal / 5) / (t / 60)) : 0;
    return {
      wpm,
      raw,
      acc: Math.round(this.accuracy()),
      chars: this.idx,
      totalChars: this.text.length,
      words: typedWords,
      elapsed: Math.round(t)
    };
  },

  finish() {
    if (this.finished) return;
    this.finished = true;
    if (this.timer) clearInterval(this.timer);
    if (this.onFinish) this.onFinish(this.result());
  }
};