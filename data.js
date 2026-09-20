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