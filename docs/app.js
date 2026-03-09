const loginSection = document.getElementById("login");
const quizSection = document.getElementById("quiz");

const loginForm = document.getElementById("loginForm");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const loginError = document.getElementById("loginError");

const welcomeEl = document.getElementById("welcome");
const questionEl = document.getElementById("question");
const choicesEl = document.getElementById("choices");
const feedbackEl = document.getElementById("feedback");
const nextBtn = document.getElementById("nextBtn");
const progressEl = document.getElementById("progress");
const scoreEl = document.getElementById("score");

const API_BASE_URL = "https://zp13fu2v8g.execute-api.eu-west-2.amazonaws.com";
const SAVE_RESULTS_URL = `${API_BASE_URL}/results`;
const QUIZ_VERSION = "accessbookings_v1";

const quiz = [
  {
    question: "Which Marriott brand is known for bold, playful and social hotel spaces?",
    choices: ["Moxy Hotels", "AC Hotels", "Residence Inn", "Element"],
    correctIndex: 0,
  },
  {
    question: "Which brand focuses on refined, design-led hospitality inspired by European style?",
    choices: ["Courtyard", "AC Hotels", "Moxy Hotels", "Element"],
    correctIndex: 1,
  },
  {
    question: "Which Marriott brand is designed primarily for longer stays with kitchen facilities?",
    choices: ["Residence Inn", "Moxy Hotels", "AC Hotels", "Courtyard"],
    correctIndex: 0,
  },
  {
    question: "Which brand emphasises wellbeing, sustainability and longer-stay comfort?",
    choices: ["Element by Westin", "Moxy Hotels", "Courtyard", "AC Hotels"],
    correctIndex: 0,
  },
  {
    question: "Hotel Co 51 operates multiple Marriott brands across Europe.",
    choices: ["True", "False"],
    correctIndex: 0,
  },
  {
    question: "What is the AC Hotel Inverness on-site restaurant called, offering dishes made with locally sourced ingredients?",
    choices: ["Beira", "The Highlands Kitchen", "River Ness Grill", "The Caledonian Table"],
    correctIndex: 0,
  },
  {
    question: "Which Moxy hotel would be best suited for a group attending an event at the Copper Box Arena in London?",
    choices: ["Moxy London Stratford", "Moxy London Excel", "Moxy London Heathrow", "Moxy London Earls Court"],
    correctIndex: 0,
  },
  {
    question: "Which Moxy would you recommend for someone attending an event in Edinburgh city centre?",
    choices: ["Moxy Edinburgh Fountainbridge", "Moxy Edinburgh Airport", "Moxy Glasgow SEC", "Moxy York"],
    correctIndex: 0,
  },
  {
    question: "True or False: Business travellers choose Moxy Hotels because they love that we're simple, affordable, and casual.",
    choices: ["True", "False"],
    correctIndex: 0,
  },
  {
    question: "Which is the oldest Moxy Hotel in the UK?",
    choices: ["Moxy Aberdeen Airport", "Moxy London Stratford", "Moxy York", "Moxy Glasgow SEC"],
    correctIndex: 0,
  },
];

let user = null;
let currentIndex = 0;
let score = 0;
let activeQuestion = null;
let answeredThisQuestion = false;

function shuffleAnswers(question) {
  const answers = question.choices.map((text, index) => ({
    text,
    isCorrect: index === question.correctIndex,
  }));

  for (let i = answers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [answers[i], answers[j]] = [answers[j], answers[i]];
  }

  return {
    ...question,
    choices: answers.map((a) => a.text),
    correctIndex: answers.findIndex((a) => a.isCorrect),
  };
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function setScreen(which) {
  if (which === "login") {
    loginSection.classList.remove("hidden");
    quizSection.classList.add("hidden");
  } else {
    loginSection.classList.add("hidden");
    quizSection.classList.remove("hidden");
  }
}

function updateMeta() {
  progressEl.textContent = `Question ${currentIndex + 1} of ${quiz.length}`;
  scoreEl.textContent = `Score: ${score}`;
}

function renderQuestion() {
  answeredThisQuestion = false;
  feedbackEl.textContent = "";
  nextBtn.disabled = true;
  nextBtn.textContent = currentIndex === quiz.length - 1 ? "Finish" : "Next";

  updateMeta();

  activeQuestion = shuffleAnswers(quiz[currentIndex]);

  questionEl.textContent = activeQuestion.question;
  choicesEl.innerHTML = "";

  activeQuestion.choices.forEach((text, i) => {
    const btn = document.createElement("button");
    btn.className = "choice";
    btn.type = "button";
    btn.textContent = text;
    btn.addEventListener("click", () => handleChoice(i));
    choicesEl.appendChild(btn);
  });
}

function handleChoice(selectedIndex) {
  if (answeredThisQuestion) return;
  answeredThisQuestion = true;

  const buttons = Array.from(choicesEl.querySelectorAll("button"));

  buttons.forEach((b, i) => {
    b.disabled = true;
    if (i === activeQuestion.correctIndex) b.classList.add("correct");
  });

  if (selectedIndex === activeQuestion.correctIndex) {
    score += 1;
    feedbackEl.textContent = "✅ Correct!";
  } else {
    buttons[selectedIndex].classList.add("wrong");
    feedbackEl.textContent = `❌ Correct answer: ${activeQuestion.choices[activeQuestion.correctIndex]}`;
  }

  updateMeta();
  nextBtn.disabled = false;
}

async function saveResultToAWS() {
  const payload = {
    name: user.name,
    email: user.email,
    score,
    quizVersion: QUIZ_VERSION,
  };

  const res = await fetch(SAVE_RESULTS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (res.status === 409) {
    return { status: "already_submitted" };
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Save failed (${res.status}). ${text}`);
  }

  const data = await res.json().catch(() => ({}));
  if (!data.success) {
    throw new Error("Save failed (success=false).");
  }

  return { status: "saved" };
}

async function renderResultsAndSave() {
  progressEl.textContent = "Complete";
  scoreEl.textContent = `Final score: ${score}/${quiz.length}`;
  questionEl.textContent = "Quiz complete ✅";
  choicesEl.innerHTML = "";
  feedbackEl.textContent = `Thanks ${user.name}. Saving your result…`;

  nextBtn.textContent = "Saving...";
  nextBtn.disabled = true;

  try {
    const result = await saveResultToAWS();

    if (result.status === "already_submitted") {
      feedbackEl.textContent = `Thanks ${user.name}. Our system shows you’ve already submitted this quiz. ✅`;
    } else {
      feedbackEl.textContent = `Thanks ${user.name}. Your result has been saved. ✅`;
    }

    nextBtn.textContent = "Learn more";
    nextBtn.disabled = false;
    nextBtn.onclick = () => window.open("https://hotelco51.com/", "_blank");
  } catch (err) {
    feedbackEl.textContent = `We couldn’t save your result automatically. Please tell the organiser. (${err.message})`;
    nextBtn.textContent = "Learn more";
    nextBtn.disabled = false;
    nextBtn.onclick = () => window.open("https://hotelco51.com/", "_blank");
  }
}

function startQuiz() {
  currentIndex = 0;
  score = 0;
  activeQuestion = null;
  answeredThisQuestion = false;
  welcomeEl.textContent = `Welcome, ${user.name}`;
  setScreen("quiz");
  renderQuestion();
}

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  loginError.textContent = "";

  const name = nameInput.value.trim();
  const email = emailInput.value.trim().toLowerCase();

  if (name.length < 2) {
    loginError.textContent = "Please enter your full name.";
    return;
  }

  if (!isValidEmail(email)) {
    loginError.textContent = "Please enter a valid email address.";
    return;
  }

  user = { name, email };
  sessionStorage.setItem("quizUser", JSON.stringify(user));
  startQuiz();
});

nextBtn.addEventListener("click", () => {
  if (nextBtn.disabled) return;

  if (currentIndex === quiz.length - 1) {
    renderResultsAndSave();
    return;
  }

  currentIndex += 1;
  renderQuestion();
});

setScreen("login");