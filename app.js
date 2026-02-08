const QUESTION_COUNT = 10;
const QUESTION_TIME = 10;
const AUTO_ADVANCE_DELAY_MS = 1200;

const ANIMAL_BANK = [
  // Easy
  {
    animal: "Elephant",
    emoji: "🐘",
    difficulty: "easy",
    clue: "I am the largest land animal and I have a long trunk.",
  },
  { animal: "Giraffe", emoji: "🦒", difficulty: "easy", clue: "I have a very long neck and eat leaves from tall trees." },
  { animal: "Lion", emoji: "🦁", difficulty: "easy", clue: "I am called the king of the jungle and I roar loudly." },
  { animal: "Penguin", emoji: "🐧", difficulty: "easy", clue: "I cannot fly, but I waddle and swim in icy waters." },
  { animal: "Dolphin", emoji: "🐬", difficulty: "easy", clue: "I am a smart swimmer that loves to jump out of the ocean." },
  { animal: "Panda", emoji: "🐼", difficulty: "easy", clue: "I am black and white and I love bamboo." },
  { animal: "Kangaroo", emoji: "🦘", difficulty: "easy", clue: "I hop, and I carry my baby in a pouch." },
  { animal: "Zebra", emoji: "🦓", difficulty: "easy", clue: "I look like a horse with bold black-and-white stripes." },
  { animal: "Turtle", emoji: "🐢", difficulty: "easy", clue: "I move slowly and carry my shell on my back." },
  { animal: "Bear", emoji: "🐻", difficulty: "easy", clue: "I am big and furry and I love honey." },
  { animal: "Rabbit", emoji: "🐰", difficulty: "easy", clue: "I hop around and have long ears." },
  { animal: "Frog", emoji: "🐸", difficulty: "easy", clue: "I leap and live near ponds, and I say ribbit." },

  // Medium
  { animal: "Octopus", emoji: "🐙", difficulty: "medium", clue: "I have eight arms and can squirt ink." },
  { animal: "Rhinoceros", emoji: "🦏", difficulty: "medium", clue: "I am a strong animal with one or two horns on my nose." },
  { animal: "Hippopotamus", emoji: "🦛", difficulty: "medium", clue: "I am huge and spend lots of time in rivers." },
  { animal: "Flamingo", emoji: "🦩", difficulty: "medium", clue: "I stand on one leg and my feathers are pink." },
  { animal: "Owl", emoji: "🦉", difficulty: "medium", clue: "I am a night bird with big eyes and a silent flight." },
  { animal: "Chameleon", emoji: "🦎", difficulty: "medium", clue: "I can change my colors to blend in." },
  { animal: "Walrus", emoji: "🦭", difficulty: "medium", clue: "I am a large sea mammal with long tusks." },
  { animal: "Peacock", emoji: "🦚", difficulty: "medium", clue: "I show off a fan of colorful feathers." },
  { animal: "Cobra", emoji: "🐍", difficulty: "medium", clue: "I am a snake that spreads a hood when I hiss." },
  { animal: "Red Fox", emoji: "🦊", difficulty: "medium", clue: "I am clever with a bushy tail and orange fur." },
  { animal: "Goat", emoji: "🐐", difficulty: "medium", clue: "I climb rocky places and have curved horns." },
  { animal: "Moose", emoji: "🫎", difficulty: "medium", clue: "I am a large deer with wide antlers." },

  // Hard
  { animal: "Axolotl", emoji: "🦎", difficulty: "hard", clue: "I am a salamander that keeps my feathery gills." },
  { animal: "Narwhal", emoji: "🦄", difficulty: "hard", clue: "I am a whale with a long, spiral tusk." },
  { animal: "Okapi", emoji: "🦓", difficulty: "hard", clue: "I have zebra stripes on my legs and live in forests." },
  { animal: "Quokka", emoji: "🐿️", difficulty: "hard", clue: "I am a small marsupial known for my smile." },
  { animal: "Saiga", emoji: "🦌", difficulty: "hard", clue: "I have a big, unusual nose and live on the steppe." },
  { animal: "Tapir", emoji: "🐗", difficulty: "hard", clue: "I have a short, trunk-like snout and love to swim." },
  { animal: "Caracal", emoji: "🐱", difficulty: "hard", clue: "I am a wild cat with long black ear tufts." },
  { animal: "Aye-aye", emoji: "🦝", difficulty: "hard", clue: "I have a long finger for finding insects in trees." },
  { animal: "Binturong", emoji: "🦝", difficulty: "hard", clue: "I am also called a bearcat and smell like popcorn." },
  { animal: "Fennec Fox", emoji: "🦊", difficulty: "hard", clue: "I am a desert fox with enormous ears." },
  { animal: "Manatee", emoji: "🦭", difficulty: "hard", clue: "I am a gentle sea cow that grazes on plants." },
  { animal: "Wombat", emoji: "🦫", difficulty: "hard", clue: "I am a sturdy marsupial that digs burrows." },
];

const state = {
  difficulty: null,
  questions: [],
  index: 0,
  score: 0,
  questionStates: [],
  timeLeft: QUESTION_TIME,
  timerId: null,
  autoAdvanceId: null,
};

const startScreen = document.getElementById("start-screen");
const quizScreen = document.getElementById("quiz-screen");
const resultScreen = document.getElementById("result-screen");
const progressEl = document.getElementById("progress");
const scoreEl = document.getElementById("score");
const timerEl = document.getElementById("timer");
const clueEmoji = document.getElementById("clue-emoji");
const clueText = document.getElementById("clue-text");
const optionsEl = document.getElementById("options");
const statusMessage = document.getElementById("status-message");
const showAnswerBtn = document.getElementById("show-answer-btn");
const nextBtn = document.getElementById("next-btn");
const finalScore = document.getElementById("final-score");
const restartBtn = document.getElementById("restart-btn");

document.querySelectorAll(".difficulty-btn").forEach((btn) => {
  btn.addEventListener("click", () => startQuiz(btn.dataset.difficulty));
});
showAnswerBtn.addEventListener("click", revealAnswer);
nextBtn.addEventListener("click", goNext);
restartBtn.addEventListener("click", resetToStart);

function startQuiz(difficulty) {
  const pool = ANIMAL_BANK.filter((item) => item.difficulty === difficulty);
  if (pool.length < QUESTION_COUNT) {
    alert(`Not enough ${difficulty} questions in local bank.`);
    return;
  }

  state.difficulty = difficulty;
  state.index = 0;
  state.score = 0;
  state.questions = shuffle([...pool]).slice(0, QUESTION_COUNT).map((q) => ({
    ...q,
    options: buildOptions(q, pool),
  }));
  state.questionStates = Array.from({ length: QUESTION_COUNT }, () => ({
    selected: null,
    locked: false,
    revealed: false,
    isCorrect: false,
    timedOut: false,
    status: "",
  }));

  startScreen.classList.add("hidden");
  resultScreen.classList.add("hidden");
  quizScreen.classList.remove("hidden");
  state.timeLeft = QUESTION_TIME;
  clearTimers();
  renderQuestion();
  startTimer();
}

function buildOptions(question, pool) {
  const wrong = shuffle(pool.filter((item) => item.animal !== question.animal)).slice(0, 3);
  return shuffle([question.animal, ...wrong.map((w) => w.animal)]);
}

function renderQuestion() {
  const question = state.questions[state.index];
  const qState = state.questionStates[state.index];

  progressEl.textContent = `Question ${state.index + 1} / ${QUESTION_COUNT}`;
  scoreEl.textContent = `Score: ${state.score} / ${QUESTION_COUNT}`;
  timerEl.textContent = `Time: ${state.timeLeft}`;
  statusMessage.textContent = qState.status || "";

  clueEmoji.textContent = question.emoji;
  clueText.textContent = question.clue;

  optionsEl.innerHTML = "";
  question.options.forEach((option) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "option-btn";
    btn.textContent = option;
    btn.disabled = qState.locked;
    btn.addEventListener("click", () => chooseOption(option));

    if (qState.selected === option) {
      btn.classList.add("selected");
    }

    if (qState.locked) {
      const correct = question.animal;
      if (option === correct) {
        btn.classList.add("correct");
      } else if (qState.selected === option && !qState.isCorrect) {
        btn.classList.add("incorrect");
      }
    }

    optionsEl.appendChild(btn);
  });

  showAnswerBtn.disabled = qState.locked;
}

function chooseOption(option) {
  const question = state.questions[state.index];
  const qState = state.questionStates[state.index];
  if (qState.locked) return;

  qState.selected = option;
  qState.locked = true;
  qState.isCorrect = option === question.animal;
  qState.status = qState.isCorrect ? "Correct!" : `Incorrect. It was ${question.animal}.`;

  clearQuestionTimer();

  if (qState.isCorrect) {
    state.score += 1;
  }

  renderQuestion();
}

function revealAnswer() {
  const qState = state.questionStates[state.index];
  if (qState.locked) return;

  qState.revealed = true;
  qState.locked = true;
  qState.status = `Answer revealed: ${state.questions[state.index].animal}.`;
  clearQuestionTimer();
  renderQuestion();
}

function goNext() {
  const qState = state.questionStates[state.index];
  if (!qState.locked) {
    statusMessage.textContent = "Pick an answer or reveal the answer first.";
    return;
  }

  if (state.index === QUESTION_COUNT - 1) {
    showResults();
    return;
  }

  state.index += 1;
  state.timeLeft = QUESTION_TIME;
  clearTimers();
  renderQuestion();
  startTimer();
}

function showResults() {
  quizScreen.classList.add("hidden");
  resultScreen.classList.remove("hidden");
  clearTimers();
  finalScore.textContent = `Great job! You guessed ${state.score} out of ${QUESTION_COUNT} animals.`;
}

function resetToStart() {
  state.difficulty = null;
  state.questions = [];
  state.index = 0;
  state.score = 0;
  state.questionStates = [];
  state.timeLeft = QUESTION_TIME;
  clearTimers();
  timerEl.textContent = `Time: ${QUESTION_TIME}`;
  quizScreen.classList.add("hidden");
  resultScreen.classList.add("hidden");
  startScreen.classList.remove("hidden");
}


function startTimer() {
  clearQuestionTimer();
  state.timerId = setInterval(() => {
    const qState = state.questionStates[state.index];
    if (!qState || qState.locked) {
      clearQuestionTimer();
      return;
    }

    state.timeLeft = Math.max(0, state.timeLeft - 1);
    timerEl.textContent = `Time: ${state.timeLeft}`;

    if (state.timeLeft === 0) {
      handleTimeout();
    }
  }, 1000);
}

function handleTimeout() {
  const qState = state.questionStates[state.index];
  if (!qState || qState.locked) return;

  qState.locked = true;
  qState.isCorrect = false;
  qState.timedOut = true;
  qState.status = `Time is up! It was ${state.questions[state.index].animal}.`;
  clearQuestionTimer();
  renderQuestion();

  clearAutoAdvance();
  state.autoAdvanceId = setTimeout(() => {
    goNext();
  }, AUTO_ADVANCE_DELAY_MS);
}

function clearQuestionTimer() {
  if (state.timerId) {
    clearInterval(state.timerId);
    state.timerId = null;
  }
}

function clearAutoAdvance() {
  if (state.autoAdvanceId) {
    clearTimeout(state.autoAdvanceId);
    state.autoAdvanceId = null;
  }
}

function clearTimers() {
  clearQuestionTimer();
  clearAutoAdvance();
}


function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
