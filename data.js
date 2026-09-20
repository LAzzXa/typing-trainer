const WORD_POOLS = {
  easy: [
    "the", "be", "to", "of", "and", "a", "in", "that", "have", "it",
    "for", "not", "on", "with", "he", "as", "you", "do", "at", "this",
    "but", "his", "by", "from", "they", "we", "say", "her", "she", "or",
    "an", "will", "my", "one", "all", "would", "there", "their", "what",
    "so", "up", "out", "if", "about", "who", "get", "which", "go", "me",
    "when", "make", "can", "like", "time", "no", "just", "him", "know",
    "take", "people", "into", "year", "your", "good", "some", "could",
    "them", "see", "other", "than", "then", "now", "look", "only", "come"
  ],
  medium: [
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
    "type", "fast", "word", "test", "practice", "speed", "learn", "focus",
    "every", "found", "still", "between", "while", "might", "again", "place",
    "story", "saw", "never", "next", "right", "below", "above", "along",
    "before", "without", "through", "another", "around", "together"
  ],
  hard: [
    "important", "different", "through", "together", "something", "everyone",
    "question", "understand", "experience", "necessary", "conversation",
    "knowledge", "immediately", "beautiful", "discover", "remember",
    "tomorrow", "yesterday", "anything", "everything", "sometimes",
    "especially", "committee", "government", "management", "opportunity",
    "professional", "probably", "question", "recognize", "recommend",
    "secretary", "temperature", "business", "develop", "computer",
    "programming", "keyboard", "practice", "accuracy", "rhythm",
    "challenge", "improvement", "technique", "confidence", "dedicated",
    "standing", "between", "although", "electric", "strength", "ordinary",
    "symbol", "partial", "quickly", "exactly", "breathe", "great", "level"
  ]
};

const LESSONS = [
  {
    id: "lesson1",
    title: "Level 1 — Common words",
    hint: "Short everyday words. Go slow and even.",
    texts: [
      "the and of to in a that you with for",
      "not be this on as at but his by from",
      "they we say her she or an will my one",
      "all would there their what so up out if",
      "about who get which go me when make can"
    ]
  },
  {
    id: "lesson2",
    title: "Level 2 — Medium words",
    hint: "Longer common words. Keep a steady rhythm.",
    texts: [
      "people into year your good some could them",
      "see other than then now look only come its",
      "over think also back after use two how our",
      "work first well way even new want because any",
      "these give day most us very great quick type",
      "every found still between while might again place"
    ]
  },
  {
    id: "lesson3",
    title: "Level 3 — Full sentences",
    hint: "Real sentences. Focus on reading ahead.",
    texts: [
      "The quick brown fox jumps over the lazy dog.",
      "Practice makes perfect when you type every day.",
      "Keep your eyes on the screen and feel the keys.",
      "A steady rhythm beats raw speed every single time.",
      "You learn to type faster one day at a time.",
      "Good posture and relaxed fingers help you last longer.",
      "Accuracy comes first and speed will always follow.",
      "Reading the next word while typing the current one is key."
    ]
  }
];

const KEYBOARD_LAYOUT = [
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m"]
];

const HOME_ROW = ["a", "s", "d", "f", "j", "k", "l"];

const FINGERS = {
  "1": "left 4", "2": "left 3", "3": "left 2", "4": "left 1", "5": "left 1",
  "6": "right 1", "7": "right 1", "8": "right 2", "9": "right 3", "0": "right 4",
  "q": "left 4", "w": "left 3", "e": "left 2", "r": "left 1", "t": "left 1",
  "y": "right 1", "u": "right 1", "i": "right 2", "o": "right 3", "p": "right 4",
  "a": "left 4", "s": "left 3", "d": "left 2", "f": "left 1",
  "j": "right 1", "k": "right 2", "l": "right 3",
  "z": "left 4", "x": "left 3", "c": "left 2", "v": "left 1", "b": "left 1",
  "n": "right 1", "m": "right 1"
};

const FINGER_KEY = {
  q: "l4", a: "l4", z: "l4", "1": "l4",
  w: "l3", s: "l3", x: "l3", "2": "l3",
  e: "l2", d: "l2", c: "l2", "3": "l2",
  r: "l1", f: "l1", v: "l1", t: "l1", g: "l1", b: "l1", "4": "l1", "5": "l1",
  y: "r1", h: "r1", n: "r1", u: "r1", j: "r1", m: "r1", "6": "r1", "7": "r1",
  i: "r2", k: "r2", "8": "r2", ",": "r2",
  o: "r3", l: "r3", "9": "r3", ".": "r3",
  p: "r4", ";": "r4", "0": "r4", "/": "r4", "-": "r4", "=": "r4", "[": "r4", "]": "r4", "'": "r4"
};

const FINGER_COLOR = {
  l1: "#f87171", l2: "#fbbf24", l3: "#f472b6", l4: "#38bdf8",
  r1: "#34d399", r2: "#a78bfa", r3: "#fb923c", r4: "#f43f5e"
};

const QUOTES = [
  "The quick brown fox jumps over the lazy dog.",
  "To be or not to be, that is the question.",
  "All that glitters is not gold.",
  "A journey of a thousand miles begins with a single step.",
  "The only way to do great work is to love what you do.",
  "I think, therefore I am.",
  "Simplicity is the ultimate sophistication.",
  "Two roads diverged in a wood, and I took the one less traveled.",
  "It does not matter how slowly you go as long as you do not stop.",
  "Whether you think you can or you think you can't, you're right.",
  "Success is not final, failure is not fatal: it is the courage to continue that counts.",
  "The best way to predict the future is to invent it.",
  "Do or do not. There is no try.",
  "Stay hungry, stay foolish.",
  "Imagination is more important than knowledge.",
  "Happiness depends upon ourselves.",
  "Believe you can and you're halfway there.",
  "The future belongs to those who believe in the beauty of their dreams.",
  "What we think, we become.",
  "It always seems impossible until it is done.",
  "Little by little, one travels far.",
  "A goal without a plan is just a wish.",
  "The secret of getting ahead is getting started.",
  "Well done is better than well said.",
  "The only impossible journey is the one you never begin.",
  "Good things come to those who wait.",
  "Practice makes perfect.",
  "Actions speak louder than words.",
  "Knowledge is power.",
  "Time waits for no one."
];

const FINGER_LESSONS = [
  {
    id: "finger-l1",
    title: "Left index finger — r t f g v b",
    hint: "Reach up and down from f with your LEFT index finger.",
    texts: [
      "star tab bag art tar far",
      "fat sat rad grab vast drag",
      "stab raft tag dad add sag",
      "art star tab grab far vast"
    ]
  },
  {
    id: "finger-l2",
    title: "Left middle finger — e d c",
    hint: "Reach from d with your LEFT middle finger.",
    texts: [
      "face case fade safe deaf",
      "aced deaf fade case sad add",
      "dad add sad decaf face fade",
      "case fade aced safe deaf dad"
    ]
  },
  {
    id: "finger-l3",
    title: "Left ring finger — w s x",
    hint: "Reach from s with your LEFT ring finger.",
    texts: [
      "was saw wax sax ads as",
      "saw was wax ads sax was",
      "wax sax was saw ads sax"
    ]
  },
  {
    id: "finger-l4",
    title: "Left pinky — q a z",
    hint: "Reach from a with your LEFT pinky finger.",
    texts: [
      "sad fad ads add as ads",
      "dads sad fad add ads sad",
      "fad ads add sad dads sad"
    ]
  },
  {
    id: "finger-r1",
    title: "Right index finger — y u h j n m",
    hint: "Reach up, down and sideways from j with your RIGHT index finger.",
    texts: [
      "hull null lull july my hymn",
      "mum nun hull lull july null",
      "lull july null hull my mum",
      "hymn lull july mum hull null"
    ]
  },
  {
    id: "finger-r2",
    title: "Right middle finger — i k",
    hint: "Reach from k with your RIGHT middle finger.",
    texts: [
      "ilk kill ill ilk kill ill",
      "ill ik kill ilk kill ill",
      "kill ilk ill kill ik kill"
    ]
  },
  {
    id: "finger-r3",
    title: "Right ring finger — o l",
    hint: "Reach from l with your RIGHT ring finger.",
    texts: [
      "look loll kook look kool loll",
      "kool loll look kook look loll",
      "loll kook look kool loll look"
    ]
  },
  {
    id: "finger-r4",
    title: "Right pinky — p ; / .",
    hint: "Reach from ; with your RIGHT pinky finger.",
    texts: [
      "pop lop plop pop polo lop",
      "polo plop pop lop poll plop",
      "lop polo plop poll pop lop"
    ]
  }
];

const ALL_LESSONS = LESSONS.concat(FINGER_LESSONS);