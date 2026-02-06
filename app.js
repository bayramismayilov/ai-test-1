const QUESTION_COUNT = 20;

const FLAG_BANK = [
  // Easy (20)
  { country: "United States", slug: "united-states", difficulty: "easy" },
  { country: "Canada", slug: "canada", difficulty: "easy" },
  { country: "United Kingdom", slug: "united-kingdom", difficulty: "easy" },
  { country: "France", slug: "france", difficulty: "easy" },
  { country: "Germany", slug: "germany", difficulty: "easy" },
  { country: "Italy", slug: "italy", difficulty: "easy" },
  { country: "Spain", slug: "spain", difficulty: "easy" },
  { country: "Portugal", slug: "portugal", difficulty: "easy" },
  { country: "Brazil", slug: "brazil", difficulty: "easy" },
  { country: "Argentina", slug: "argentina", difficulty: "easy" },
  { country: "Mexico", slug: "mexico", difficulty: "easy" },
  { country: "Japan", slug: "japan", difficulty: "easy" },
  { country: "China", slug: "china", difficulty: "easy" },
  { country: "India", slug: "india", difficulty: "easy" },
  { country: "Australia", slug: "australia", difficulty: "easy" },
  { country: "New Zealand", slug: "new-zealand", difficulty: "easy" },
  { country: "South Korea", slug: "south-korea", difficulty: "easy" },
  { country: "Russia", slug: "russia", difficulty: "easy" },
  { country: "South Africa", slug: "south-africa", difficulty: "easy" },
  { country: "Turkey", slug: "turkey", difficulty: "easy" },

  // Medium (20)
  { country: "Poland", slug: "poland", difficulty: "medium" },
  { country: "Sweden", slug: "sweden", difficulty: "medium" },
  { country: "Norway", slug: "norway", difficulty: "medium" },
  { country: "Denmark", slug: "denmark", difficulty: "medium" },
  { country: "Finland", slug: "finland", difficulty: "medium" },
  { country: "Greece", slug: "greece", difficulty: "medium" },
  { country: "Netherlands", slug: "netherlands", difficulty: "medium" },
  { country: "Belgium", slug: "belgium", difficulty: "medium" },
  { country: "Switzerland", slug: "switzerland", difficulty: "medium" },
  { country: "Austria", slug: "austria", difficulty: "medium" },
  { country: "Ireland", slug: "ireland", difficulty: "medium" },
  { country: "Ukraine", slug: "ukraine", difficulty: "medium" },
  { country: "Romania", slug: "romania", difficulty: "medium" },
  { country: "Thailand", slug: "thailand", difficulty: "medium" },
  { country: "Vietnam", slug: "vietnam", difficulty: "medium" },
  { country: "Indonesia", slug: "indonesia", difficulty: "medium" },
  { country: "Saudi Arabia", slug: "saudi-arabia", difficulty: "medium" },
  { country: "Egypt", slug: "egypt", difficulty: "medium" },
  { country: "Nigeria", slug: "nigeria", difficulty: "medium" },
  { country: "Kenya", slug: "kenya", difficulty: "medium" },

  // Hard (20)
  { country: "Bhutan", slug: "bhutan", difficulty: "hard" },
  { country: "Brunei", slug: "brunei", difficulty: "hard" },
  { country: "Kyrgyzstan", slug: "kyrgyzstan", difficulty: "hard" },
  { country: "Tajikistan", slug: "tajikistan", difficulty: "hard" },
  { country: "Uzbekistan", slug: "uzbekistan", difficulty: "hard" },
  { country: "Turkmenistan", slug: "turkmenistan", difficulty: "hard" },
  { country: "Mongolia", slug: "mongolia", difficulty: "hard" },
  { country: "Laos", slug: "laos", difficulty: "hard" },
  { country: "Cambodia", slug: "cambodia", difficulty: "hard" },
  { country: "Myanmar", slug: "myanmar", difficulty: "hard" },
  { country: "Madagascar", slug: "madagascar", difficulty: "hard" },
  { country: "Mozambique", slug: "mozambique", difficulty: "hard" },
  { country: "Namibia", slug: "namibia", difficulty: "hard" },
  { country: "Botswana", slug: "botswana", difficulty: "hard" },
  { country: "Eswatini", slug: "eswatini", difficulty: "hard" },
  { country: "Liechtenstein", slug: "liechtenstein", difficulty: "hard" },
  { country: "Andorra", slug: "andorra", difficulty: "hard" },
  { country: "San Marino", slug: "san-marino", difficulty: "hard" },
  { country: "Dominica", slug: "dominica", difficulty: "hard" },
  { country: "Kiribati", slug: "kiribati", difficulty: "hard" },
];

const state = {
  difficulty: null,
  questions: [],
  index: 0,
  score: 0,
  questionStates: [],
};

const startScreen = document.getElementById("start-screen");
const quizScreen = document.getElementById("quiz-screen");
const resultScreen = document.getElementById("result-screen");
const progressEl = document.getElementById("progress");
const scoreEl = document.getElementById("score");
const flagImage = document.getElementById("flag-image");
const optionsEl = document.getElementById("options");
const statusMessage = document.getElementById("status-message");
const showAnswerBtn = document.getElementById("show-answer-btn");
const nextBtn = document.getElementById("next-btn");
const finalScore = document.getElementById("final-score");
const restartBtn = document.getElementById("restart-btn");
const fileList = document.getElementById("flag-file-list");

document.querySelectorAll(".difficulty-btn").forEach((btn) => {
  btn.addEventListener("click", () => startQuiz(btn.dataset.difficulty));
});
showAnswerBtn.addEventListener("click", revealAnswer);
nextBtn.addEventListener("click", goNext);
restartBtn.addEventListener("click", resetToStart);

populateFlagFileList();

function startQuiz(difficulty) {
  const pool = FLAG_BANK.filter((item) => item.difficulty === difficulty);
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
  }));

  startScreen.classList.add("hidden");
  resultScreen.classList.add("hidden");
  quizScreen.classList.remove("hidden");
  renderQuestion();
}

function buildOptions(question, pool) {
  const wrong = shuffle(pool.filter((item) => item.country !== question.country)).slice(0, 3);
  return shuffle([question.country, ...wrong.map((w) => w.country)]);
}

function renderQuestion() {
  const question = state.questions[state.index];
  const qState = state.questionStates[state.index];

  progressEl.textContent = `Question ${state.index + 1} / ${QUESTION_COUNT}`;
  scoreEl.textContent = `Score: ${state.score} / ${QUESTION_COUNT}`;
  statusMessage.textContent = "";

  flagImage.alt = `Flag of ${question.country}`;
  loadFlagImage(question);

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
      const correct = question.country;
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
  qState.isCorrect = option === question.country;

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
  statusMessage.textContent = "Answer revealed for this question.";
  renderQuestion();
  statusMessage.textContent = "Answer revealed for this question.";
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
  renderQuestion();
}

function showResults() {
  quizScreen.classList.add("hidden");
  resultScreen.classList.remove("hidden");
  finalScore.textContent = `You got ${state.score}/${QUESTION_COUNT}`;
}

function resetToStart() {
  state.difficulty = null;
  state.questions = [];
  state.index = 0;
  state.score = 0;
  state.questionStates = [];
  quizScreen.classList.add("hidden");
  resultScreen.classList.add("hidden");
  startScreen.classList.remove("hidden");
}

function loadFlagImage(question) {
  const sources = [
    `assets/flags/${question.slug}.png`,
    `https://flagcdn.com/w640/${getIsoCode(question.slug)}.png`,
  ];

  let sourceIndex = 0;
  flagImage.src = sources[sourceIndex];
  flagImage.onerror = () => {
    sourceIndex += 1;
    if (sourceIndex < sources.length && !sources[sourceIndex].includes("undefined")) {
      flagImage.src = sources[sourceIndex];
      return;
    }
    flagImage.onerror = null;
    flagImage.src = createPlaceholder(question.country);
  };
}

function getIsoCode(slug) {
  const isoBySlug = {
    "united-states": "us",
    canada: "ca",
    "united-kingdom": "gb",
    france: "fr",
    germany: "de",
    italy: "it",
    spain: "es",
    portugal: "pt",
    brazil: "br",
    argentina: "ar",
    mexico: "mx",
    japan: "jp",
    china: "cn",
    india: "in",
    australia: "au",
    "new-zealand": "nz",
    russia: "ru",
    "south-africa": "za",
    egypt: "eg",
    nigeria: "ng",
    sweden: "se",
    norway: "no",
    finland: "fi",
    denmark: "dk",
    netherlands: "nl",
    belgium: "be",
    switzerland: "ch",
    austria: "at",
    greece: "gr",
    turkey: "tr",
    thailand: "th",
    vietnam: "vn",
    indonesia: "id",
    philippines: "ph",
    malaysia: "my",
    singapore: "sg",
    "south-korea": "kr",
    pakistan: "pk",
    "saudi-arabia": "sa",
    "united-arab-emirates": "ae",
    iran: "ir",
    iraq: "iq",
    ukraine: "ua",
    poland: "pl",
    "czech-republic": "cz",
    hungary: "hu",
    romania: "ro",
    bulgaria: "bg",
    croatia: "hr",
    serbia: "rs",
    slovenia: "si",
    slovakia: "sk",
    ireland: "ie",
    iceland: "is",
    luxembourg: "lu",
    estonia: "ee",
    latvia: "lv",
    lithuania: "lt",
    morocco: "ma",
    algeria: "dz",
    tunisia: "tn",
    kenya: "ke",
    ethiopia: "et",
    ghana: "gh",
    "ivory-coast": "ci",
    senegal: "sn",
    chile: "cl",
    colombia: "co",
    peru: "pe",
    venezuela: "ve",
    uruguay: "uy",
    paraguay: "py",
    bolivia: "bo",
    ecuador: "ec",
    panama: "pa",
    "costa-rica": "cr",
    cuba: "cu",
    "dominican-republic": "do",
    jamaica: "jm",
    "trinidad-and-tobago": "tt",
    qatar: "qa",
    kuwait: "kw",
    jordan: "jo",
    lebanon: "lb",
    syria: "sy",
    afghanistan: "af",
    bangladesh: "bd",
    "sri-lanka": "lk",
    nepal: "np",
    myanmar: "mm",
    cambodia: "kh",
    mongolia: "mn",
    kazakhstan: "kz",
    uzbekistan: "uz",
    georgia: "ge",
    armenia: "am",
    azerbaijan: "az",
    belarus: "by",
    moldova: "md",
    macedonia: "mk",
    albania: "al",
    "bosnia-and-herzegovina": "ba",
    malta: "mt",
    cyprus: "cy",
    andorra: "ad",
    liechtenstein: "li",
    monaco: "mc",
    "san-marino": "sm",
    dominica: "dm",
    kiribati: "ki",
    bhutan: "bt",
    botswana: "bw",
    brunei: "bn",
    eswatini: "sz",
    kyrgyzstan: "kg",
    laos: "la",
    madagascar: "mg",
    mozambique: "mz",
    namibia: "na",
    tajikistan: "tj",
    turkmenistan: "tm",
  };

  return isoBySlug[slug];
}

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function createPlaceholder(country) {
  const hue = Math.abs(
    [...country].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 360
  );
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='500'>
    <defs>
      <linearGradient id='g' x1='0' x2='1'>
        <stop offset='0%' stop-color='hsl(${hue},70%,45%)'/>
        <stop offset='100%' stop-color='hsl(${(hue + 60) % 360},75%,55%)'/>
      </linearGradient>
    </defs>
    <rect width='100%' height='100%' fill='url(#g)'/>
    <rect x='30' y='30' width='740' height='440' rx='24' fill='rgba(255,255,255,0.2)'/>
    <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='48' fill='white' font-family='Arial, sans-serif'>${country}</text>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function populateFlagFileList() {
  const unique = [...FLAG_BANK].sort((a, b) => a.slug.localeCompare(b.slug));
  unique.forEach((entry) => {
    const li = document.createElement("li");
    li.textContent = `${entry.slug}.png -> ${entry.country}`;
    fileList.appendChild(li);
  });
}
