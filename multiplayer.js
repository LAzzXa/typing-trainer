const Multiplayer = {
  peer: null,
  conn: null,
  code: "",
  roomCode: "",
  isHost: false,
  started: false,
  finished: false,
  oppIdx: 0,
  oppWpm: 0,
  oppDone: false,
  myWpm: 0,
  myAcc: 0,
  sendTimer: null,
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
  },

  show() {
    this.el.outcome.textContent = "";
    if (!this.conn && !this.peer) {
      this.el.hostBox.hidden = false;
      this.el.joinBox.hidden = false;
      this.el.leaveBtn.hidden = true;
      this.el.status.textContent = "Create a room and share the code, or join with a friend's code.";
      this.resetOpponent();
    } else {
      this.el.hostBox.hidden = true;
      this.el.joinBox.hidden = true;
      this.el.leaveBtn.hidden = false;
      if (this.isHost && !this.conn) {
        this.el.status.textContent = "Waiting for a friend to join…";
      }
    }
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
    this.code = this.makeCode();
    this.isHost = true;
    this.cleanup();
    this.peer = new Peer("stype-" + this.code);
    Engine.settings.mode = "words";
    Engine.settings.difficulty = "medium";
    Engine.reset(this.buildText());
    Engine.onFinish = (r) => this.ownFinish(r);
    this.resetOpponent();

    this.peer.on("open", () => {
      this.el.hostBox.hidden = true;
      this.el.joinBox.hidden = true;
      this.el.leaveBtn.hidden = false;
      this.el.code.textContent = this.code;
      this.el.status.textContent = "Room created. Share this code with a friend, then wait…";
    });
    this.peer.on("error", (err) => {
      this.el.status.textContent =
        err.type === "unavailable-id" ? "That code is busy. Create a new room." : "Connection problem. Try again.";
    });
    this.peer.on("connection", (conn) => {
      this.conn = conn;
      this.el.oppName.textContent = "vs your friend";
      this.el.status.textContent = "Opponent joined! Starting…";
      this.bindConn(conn, () => {
        if (this.conn && this.conn.open) {
          this.conn.send({ t: "ready", text: Engine.text, go: Date.now() + 3000, code: this.code });
        }
        this.beginRace(3000);
      });
    });
  },

  join(code) {
    this.isHost = false;
    this.code = "";
    this.cleanup();
    this.peer = new Peer();
    this.el.hostBox.hidden = true;
    this.el.joinBox.hidden = true;
    this.el.leaveBtn.hidden = false;
    this.el.status.textContent = "Joining room…";
    this.peer.on("open", () => {
      this.conn = this.peer.connect("stype-" + code, { reliable: true });
      this.bindConn(this.conn, null);
    });
    this.peer.on("error", () => {
      this.el.status.textContent = "Could not connect. Check the room code with your friend.";
    });
  },

  bindConn(conn, onOpen) {
    conn.on("open", () => {
      this.el.oppName.textContent = "vs your friend";
      if (onOpen) onOpen();
    });
    conn.on("data", (data) => this.onData(data));
    conn.on("close", () => {
      if (this.started && !this.finished) {
        this.el.status.textContent = "Your opponent left the race.";
      }
    });
  },

  onData(data) {
    if (data.t === "ready" && !this.isHost) {
      this.roomCode = data.code;
      this.resetOpponent();
      this.el.code.textContent = data.code;
      this.el.status.textContent = "Opponent found! Starting…";
      Engine.settings.mode = "words";
      Engine.reset(data.text);
      Engine.onFinish = (r) => this.ownFinish(r);
      this.beginRace(Math.max(500, data.go - Date.now()));
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
    if (!this.conn || !this.conn.open || this.finished) return;
    this.conn.send({ t: "p", idx: Engine.idx, wpm: Engine.started ? Engine.wpmNow() : 0 });
  },

  ownFinish(result) {
    if (this.finished) return;
    this.finished = true;
    clearInterval(this.sendTimer);
    this.myWpm = result.wpm;
    this.myAcc = result.acc;
    if (this.conn && this.conn.open) {
      this.conn.send({ t: "done", wpm: result.wpm, acc: result.acc });
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
    this.el.status.textContent = "Left the room.";
    this.resetOpponent();
  }
};