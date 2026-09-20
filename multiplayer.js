const Multiplayer = {
  peer: null,
  conn: null,
  code: "",
  roomCode: "",
  isHost: false,
  useLocal: false,
  started: false,
  finished: false,
  oppIdx: 0,
  oppWpm: 0,
  oppDone: false,
  myWpm: 0,
  myAcc: 0,
  sendTimer: null,
  pollTimer: null,
  el: {},

  init() {
    this.el.status = document.getElementById("multi-status");
    this.el.code = document.getElementById("multi-code");
    this.el.joinCode = document.getElementById("join-code");
    this.el.oppBar = document.getElementById("opp-bar");
    this.el.oppWpm = document.getElementById("opp-wpm");
    this.el.oppName = document.getElementById("opp-name");
    this.el.hostBox = document.getElementById("host-box");
    this.el.joinBox = document.getElementById("join-box");
    this.el.leaveBtn = document.getElementById("multi-leave");
    this.el.outcome = document.getElementById("multi-outcome");

    document.getElementById("multi-create").addEventListener("click", () => this.create());
    document.getElementById("multi-join").addEventListener("click", () => {
      const c = this.el.joinCode.value.trim().toLowerCase();
      if (c) this.join(c);
    });
    this.el.leaveBtn.addEventListener("click", () => this.leave());

    document.getElementById("prompt-box").addEventListener("keydown", (e) => this.onKey(e));
    window.addEventListener("storage", (e) => this.onStorage(e));
  },

  show() {
    this.el.outcome.textContent = "";
    if (!this.conn && !this.peer && !this.activeLocal()) {
      this.el.hostBox.hidden = false;
      this.el.joinBox.hidden = false;
      this.el.leaveBtn.hidden = true;
      this.el.status.textContent = "Create a room and share the code, or join with your friend's code.";
      this.resetOpponent();
    } else {
      this.el.hostBox.hidden = true;
      this.el.joinBox.hidden = true;
      this.el.leaveBtn.hidden = false;
      if (this.isHost && !this.connected()) {
        this.el.status.textContent = "Waiting for an opponent to join…";
      }
    }
  },

  ctrlKey(code) {
    return "stmp:" + code + ":c";
  },
  hostKey(code) {
    return "stmp:" + code + ":h";
  },
  guestKey(code) {
    return "stmp:" + code + ":g";
  },
  activeLocal() {
    return this.useLocal && this.code;
  },

  connected() {
    return (this.conn && this.conn.open) || this.activeLocal();
  },

  makeCode() {
    let out = "";
    const chars = "abcdefghijkmnpqrstuvwxyz23456789";
    for (let i = 0; i < 5; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  },

  buildText() {
    const pool = WORD_POOLS.medium;
    const out = [];
    for (let i = 0; i < 30; i++) out.push(pool[Math.floor(Math.random() * pool.length)]);
    return out.join(" ");
  },

  create() {
    this.cleanup();
    this.isHost = true;
    this.code = this.makeCode();
    this.useLocal = true;
    while (localStorage.getItem(this.ctrlKey(this.code))) {
      this.code = this.makeCode();
    }
    this.el.hostBox.hidden = true;
    this.el.joinBox.hidden = true;
    this.el.leaveBtn.hidden = false;
    this.el.code.textContent = this.code;
    this.el.status.textContent = "Room created. Share this code — it works on any device connected to this site.";

    this.setupEngine();
    this.resetOpponent();

    localStorage.setItem(this.ctrlKey(this.code), JSON.stringify({ t: "host" }));

    if (typeof window.Peer !== "undefined") {
      try {
        this.peer = new Peer("stype-" + this.code);
        this.peer.on("open", () => {});
        this.peer.on("error", () => {});
        this.peer.on("connection", (conn) => {
          this.conn = conn;
          this.bindPeerConn(conn, true);
        });
      } catch (err) {}
    }

    this.watchdog = setTimeout(() => {
      if (!this.connected() && !this.started) {
        this.el.status.textContent =
          "No opponent yet. It works instantly between two tabs/windows on this device. For another device, both must reach the internet — some networks block online rooms.";
      }
    }, 15000);
  },

  join(code) {
    this.cleanup();
    this.isHost = false;
    this.code = "";
    this.el.hostBox.hidden = true;
    this.el.joinBox.hidden = true;
    this.el.leaveBtn.hidden = false;
    this.el.status.textContent = "Joining room…";

    const ctrl = this.readLocal(code, "c");
    if (ctrl && ctrl.t === "host") {
      this.useLocal = true;
      this.code = code;
      this.roomCode = code;
      this.el.code.textContent = code;
      this.writeLocal(this.guestKey(code), { t: "guest", i: Date.now() });
      this.el.status.textContent = "Opponent found! Starting…";
      this.pollStart();
      return;
    }

    if (typeof window.Peer === "undefined") {
      this.el.status.textContent = "Online library failed to load — refresh the page and try again.";
      return;
    }
    this.peer = new Peer();
    this.peer.on("open", () => {
      this.conn = this.peer.connect("stype-" + code, { reliable: true });
      this.bindPeerConn(this.conn, false);
    });
    this.peer.on("error", (err) => {
      if (err.type === "peer-unavailable" || err.type === "unavailable-id") {
        this.el.status.textContent = "Room not found. Check the code and try again.";
      } else if (!this.started) {
        this.el.status.textContent = "Could not reach the matchmaking server. Check your internet or try another network.";
      }
    });
  },

  readLocal(code, kind) {
    const keyFn = { c: "ctrlKey", h: "hostKey", g: "guestKey" }[kind];
    try {
      const raw = localStorage.getItem(this[keyFn](code));
      return raw ? this.parse(raw) : null;
    } catch (err) {
      return null;
    }
  },

  parse(raw) {
    try {
      return JSON.parse(raw);
    } catch (err) {
      return null;
    }
  },

  bindPeerConn(conn, hostSide) {
    conn.on("open", () => {
      this.el.oppName.textContent = "vs your friend";
      if (hostSide) {
        this.el.status.textContent = "Opponent joined! Starting…";
        const go = Date.now() + 3000;
        this.sendToOpponent({ t: "start", text: Engine.text, go, code: this.code });
        this.beginRace(3000);
      }
    });
    conn.on("data", (data) => {
      if (data && typeof data === "object") this.handleMessage(data);
    });
    conn.on("close", () => {
      if (this.started && !this.finished) {
        this.el.status.textContent = "Your opponent left the race.";
      }
    });
  },

  onStorage(e) {
    if (!this.code) return;
    if (e.key === this.hostKey(this.code) && !this.isHost) {
      const msg = this.parse(e.newValue);
      if (msg) this.handleMessage(msg);
    } else if (e.key === this.guestKey(this.code) && this.isHost) {
      const msg = this.parse(e.newValue);
      if (msg && msg.t === "guest") {
        this.el.status.textContent = "Opponent joined! Starting…";
        const go = Date.now() + 3000;
        this.writeLocal(this.hostKey(this.code), { t: "start", text: Engine.text, go, code: this.code });
        this.beginRace(3000);
      } else if (msg && msg.t) {
        this.handleMessage(msg);
      }
    }
  },

  handleMessage(data) {
    if (data.t === "start") {
      if (!this.started) {
        this.el.status.textContent = "Opponent found! Starting…";
        Engine.settings.mode = "words";
        Engine.reset(data.text);
        Engine.onFinish = (r) => this.ownFinish(r);
        this.beginRace(Math.max(500, data.go - Date.now()));
      }
    } else if (data.t === "p") {
      this.oppIdx = data.idx;
      this.oppWpm = data.wpm;
      this.drawOpponent();
    } else if (data.t === "done") {
      this.oppDone = true;
      this.oppWpm = Math.max(this.oppWpm, data.wpm || 0);
      this.el.status.textContent = "Opponent finished with " + (data.wpm || 0) + " WPM";
      this.checkFinal();
    }
  },

  pollStart() {
    const startedAt = Date.now();
    this.pollTimer = setInterval(() => {
      if (this.started || !this.useLocal) {
        clearInterval(this.pollTimer);
        this.pollTimer = null;
        return;
      }
      const msg = this.readLocal(this.code, "h");
      if (msg && msg.t === "start") {
        clearInterval(this.pollTimer);
        this.pollTimer = null;
        this.handleMessage(msg);
      } else if (Date.now() - startedAt > 15000) {
        clearInterval(this.pollTimer);
        this.pollTimer = null;
        if (!this.started) this.el.status.textContent = "Room timed out. Create a new room.";
      }
    }, 300);
  },

  sendToOpponent(msg) {
    if (this.useLocal && this.code) {
      const key = this.isHost ? this.hostKey(this.code) : this.guestKey(this.code);
      this.writeLocal(key, msg);
    } else if (this.conn && this.conn.open) {
      this.conn.send(msg);
    }
  },

  writeLocal(key, msg) {
    if (!msg || msg.t === "start") {
      localStorage.setItem(key, JSON.stringify(msg));
      return;
    }
    localStorage.setItem(key, JSON.stringify(Object.assign({}, msg, { i: Date.now() })));
  },

  beginRace(msUntilGo) {
    this.started = true;
    this.finished = false;
    Engine.finished = false;
    Engine.setCountdownStart(msUntilGo);
    this.el.status.textContent = "Get ready…";
    this.sendTimer = setInterval(() => this.sendProgress(), 250);
    setTimeout(() => {
      if (!this.finished) {
        this.el.status.textContent = "Go!";
        this.el.code.textContent = "";
      }
    }, Math.max(100, msUntilGo));
  },

  setupEngine() {
    Engine.settings.mode = "words";
    Engine.settings.difficulty = "medium";
    Engine.reset(this.buildText());
    Engine.onFinish = (r) => this.ownFinish(r);
  },

  resetOpponent() {
    this.oppIdx = 0;
    this.oppWpm = 0;
    this.oppDone = false;
    this.el.oppName.textContent = "Opponent";
    this.el.oppWpm.textContent = "";
    this.drawOpponent();
  },

  drawOpponent() {
    const total = Engine.text.length;
    this.el.oppBar.style.width = total ? Math.min(100, (this.oppIdx / total) * 100) + "%" : "0%";
    if (this.oppWpm) this.el.oppWpm.textContent = this.oppWpm + " WPM";
  },

  sendProgress() {
    if (!this.connected() || this.finished) return;
    this.sendToOpponent({ t: "p", idx: Engine.idx, wpm: Engine.started ? Engine.wpmNow() : 0 });
  },

  ownFinish(result) {
    if (this.finished) return;
    this.finished = true;
    clearInterval(this.sendTimer);
    this.myWpm = result.wpm;
    this.myAcc = result.acc;
    if (this.connected()) {
      this.sendToOpponent({ t: "done", wpm: result.wpm, acc: result.acc });
    }
    this.el.status.textContent = "You finished with " + result.wpm + " WPM";
    this.checkFinal();
  },

  checkFinal() {
    if (!this.finished || !this.oppDone) return;
    let msg;
    if (this.myWpm > this.oppWpm) msg = "You won! " + this.myWpm + " WPM vs " + this.oppWpm + " WPM";
    else if (this.oppWpm > this.myWpm) msg = "You lost. " + this.myWpm + " WPM vs " + this.oppWpm + " WPM";
    else msg = "It's a draw! " + this.myWpm + " WPM each";
    this.el.outcome.textContent = msg;
    this.el.status.textContent = "Rematch? One of you creates a new room.";
  },

  onKey(e) {
    if (!this.started || this.finished) return;
    Engine.key(e);
    this.sendProgress();
    if (Engine.finished) this.ownFinish(Engine.result());
  },

  cleanup() {
    if (this.conn) {
      try {
        this.conn.close();
      } catch (err) {}
      this.conn = null;
    }
    if (this.peer) {
      try {
        this.peer.destroy();
      } catch (err) {}
      this.peer = null;
    }
    if (this.sendTimer) {
      clearInterval(this.sendTimer);
      this.sendTimer = null;
    }
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    if (this.watchdog) {
      clearTimeout(this.watchdog);
      this.watchdog = null;
    }
    if (this.code) {
      try {
        localStorage.removeItem(this.ctrlKey(this.code));
        localStorage.removeItem(this.hostKey(this.code));
        localStorage.removeItem(this.guestKey(this.code));
      } catch (err) {}
    }
    this.useLocal = false;
    this.conn = null;
    this.peer = null;
  },

  leave() {
    this.cleanup();
    this.started = false;
    this.finished = false;
    Engine.finished = true;
    this.isHost = false;
    this.code = "";
    this.roomCode = "";
    this.el.code.textContent = "";
    this.el.outcome.textContent = "";
    this.el.hostBox.hidden = false;
    this.el.joinBox.hidden = false;
    this.el.leaveBtn.hidden = true;
    this.el.status.textContent = "Left the room. Create a new room to play again.";
    this.resetOpponent();
  }
};