const loginSection = document.getElementById("login");
const quizSection = document.getElementById("quiz");
const resultsSection = document.getElementById("results");

const loginForm = document.getElementById("loginForm");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const nameError = document.getElementById("nameError");
const emailError = document.getElementById("emailError");
const loginError = document.getElementById("loginError");

const welcomeEl = document.getElementById("welcome");
const questionEl = document.getElementById("question");
const questionWrap = document.getElementById("questionWrap");
const choicesEl = document.getElementById("choices");
const feedbackEl = document.getElementById("feedback");
const nextBtn = document.getElementById("nextBtn");
const nextLabel = document.getElementById("nextLabel");
const progressEl = document.getElementById("progress");
const progressFill = document.getElementById("progressFill");
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

// ── Helpers ──────────────────────────────────────────────

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
  loginSection.classList.toggle("hidden", which !== "login");
  quizSection.classList.toggle("hidden", which !== "quiz");
  resultsSection.classList.toggle("hidden", which !== "results");
}

function getResultMessage(s, total) {
  const pct = s / total;
  if (pct === 1)   return "Perfect score! You're a Hotel Co 51 expert. 🌟";
  if (pct >= 0.8)  return "Excellent work — you clearly know your brands!";
  if (pct >= 0.6)  return "Good effort! A little more time with the portfolio and you'll nail it.";
  if (pct >= 0.4)  return "A decent start — revisit the Hotel Co 51 brand guide to sharpen up.";
  return "Worth another look at the brand portfolio before your next booking.";
}

function getResultEmoji(s, total) {
  const pct = s / total;
  if (pct === 1)  return "🏆";
  if (pct >= 0.8) return "🎉";
  if (pct >= 0.5) return "👍";
  return "💡";
}

// ── Progress ─────────────────────────────────────────────

function updateProgress() {
  const pct = (currentIndex / quiz.length) * 100;
  progressFill.style.width = `${Math.max(pct, 5)}%`;
  progressEl.textContent = `Question ${currentIndex + 1} of ${quiz.length}`;
  scoreEl.textContent = `Score: ${score}`;
}

function popScore() {
  scoreEl.classList.remove("pop");
  void scoreEl.offsetWidth;
  scoreEl.classList.add("pop");
  setTimeout(() => scoreEl.classList.remove("pop"), 300);
}

// ── Question rendering ────────────────────────────────────

function renderQuestion() {
  answeredThisQuestion = false;
  feedbackEl.textContent = "";
  feedbackEl.classList.remove("visible");
  nextBtn.disabled = true;
  nextLabel.textContent = currentIndex === quiz.length - 1 ? "Finish Quiz" : "Next Question";

  updateProgress();

  activeQuestion = shuffleAnswers(quiz[currentIndex]);
  questionEl.textContent = activeQuestion.question;
  choicesEl.innerHTML = "";

  questionWrap.style.animation = "none";
  void questionWrap.offsetWidth;
  questionWrap.style.animation = "";

  activeQuestion.choices.forEach((text, i) => {
    const btn = document.createElement("button");
    btn.className = "choice";
    btn.type = "button";
    btn.textContent = text;
    btn.style.animationDelay = `${i * 0.06}s`;
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
    popScore();
  } else {
    buttons[selectedIndex].classList.add("wrong");
    feedbackEl.textContent = `❌ Correct answer: ${activeQuestion.choices[activeQuestion.correctIndex]}`;
  }

  scoreEl.textContent = `Score: ${score}`;
  feedbackEl.classList.add("visible");
  nextBtn.disabled = false;
}

// ── Results & Save ────────────────────────────────────────

async function saveResultToAWS() {
  const payload = {
    name: user.name,
    email: user.email,
    score,
    quizVersion: QUIZ_VERSION,
  };
  const res = await fetch(SAVE_RESULTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (res.status === 409) return { status: "already_submitted" };
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Save failed (${res.status}). ${text}`);
  }
  const data = await res.json().catch(() => ({}));
  if (!data.success) throw new Error("Save failed (success=false).");
  return { status: "saved" };
}

async function showResults() {
  document.getElementById("resultsIcon").textContent = getResultEmoji(score, quiz.length);
  document.getElementById("resultsTitle").textContent = "Quiz Complete!";
  document.getElementById("resultsSubtitle").textContent = `Well done, ${user.name}!`;
  document.getElementById("resultsScoreNum").textContent = score;
  document.getElementById("resultsScoreDenom").textContent = `/ ${quiz.length}`;
  document.getElementById("resultsMsg").textContent = getResultMessage(score, quiz.length);

  progressFill.style.width = "100%";

  setScreen("results");

  const saveStatus = document.getElementById("saveStatus");
  const learnMoreBtn = document.getElementById("learnMoreBtn");

  saveStatus.textContent = "Saving your result…";

  try {
    const result = await saveResultToAWS();
    if (result.status === "already_submitted") {
      saveStatus.textContent = "ℹ️ Our records show you've already submitted this quiz.";
    } else {
      saveStatus.textContent = "✅ Your result has been saved.";
    }
  } catch (err) {
    saveStatus.textContent = `⚠️ Couldn't save automatically — please let the organiser know. (${err.message})`;
  }

  learnMoreBtn.style.display = "flex";
  learnMoreBtn.addEventListener("click", () => window.open("https://hotelco51.com/", "_blank"));
}

// ── Login ────────────────────────────────────────────────

function validateField(input, errorEl, test, msg) {
  if (!test) {
    input.classList.add("input-error");
    errorEl.textContent = msg;
    return false;
  }
  input.classList.remove("input-error");
  errorEl.textContent = "";
  return true;
}

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  loginError.textContent = "";

  const name = nameInput.value.trim();
  const email = emailInput.value.trim().toLowerCase();

  const nameOk  = validateField(nameInput,  nameError,  name.length >= 2,    "Please enter your full name.");
  const emailOk = validateField(emailInput, emailError, isValidEmail(email), "Please enter a valid email address.");

  if (!nameOk || !emailOk) return;

  user = { name, email };
  sessionStorage.setItem("quizUser", JSON.stringify(user));
  startQuiz();
});

nameInput.addEventListener("blur", () => {
  if (nameInput.value.trim()) {
    validateField(nameInput, nameError, nameInput.value.trim().length >= 2, "Please enter your full name.");
  }
});

emailInput.addEventListener("blur", () => {
  if (emailInput.value.trim()) {
    validateField(emailInput, emailError, isValidEmail(emailInput.value.trim()), "Please enter a valid email address.");
  }
});

// ── Next / Finish ────────────────────────────────────────

nextBtn.addEventListener("click", () => {
  if (nextBtn.disabled) return;
  if (currentIndex === quiz.length - 1) {
    showResults();
    return;
  }
  currentIndex += 1;
  renderQuestion();
});

// ── Start ────────────────────────────────────────────────

function startQuiz() {
  currentIndex = 0;
  score = 0;
  activeQuestion = null;
  answeredThisQuestion = false;
  welcomeEl.textContent = `Hi, ${user.name} 👋`;
  setScreen("quiz");
  renderQuestion();
}

setScreen("login");

// ── Floating image physics ────────────────────────────────

(function initFloatingPhysics() {

  const configs = [
    { selector: ".blue",  renderSize: 220, shape: "circle", rotates: false },
    { selector: ".green", renderSize: 200, shape: "circle", rotates: false },
    { selector: ".dots",  renderSize: 155, shape: "box",    rotates: false },
    { selector: ".slash", renderSize: 460, shape: "box",    rotates: true  },
  ];

  const floats = configs.map(c => ({
    ...c,
    el: document.querySelector(c.selector),
    x: 0, y: 0,
    dx: 0, dy: 0,
    w: 0, h: 0,
    radius: 0,
    angle: 0,
    dAngle: 0,
  }));

  function init() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    floats.forEach((f, i) => {
      const rect = f.el.getBoundingClientRect();
      f.w = rect.width  || f.renderSize;
      f.h = rect.height || f.renderSize;
      f.radius = Math.min(f.w, f.h) / 2;

      f.x = (vw * 0.15) + (i / floats.length) * (vw * 0.7);
      f.y = (vh * 0.1)  + Math.random() * (vh * 0.7);

      const speed = 0.45 + Math.random() * 0.45;
      const angle = (Math.PI * 2 / floats.length) * i + Math.random() * 0.8;
      f.dx = Math.cos(angle) * speed;
      f.dy = Math.sin(angle) * speed;

      f.angle  = Math.random() * 360;
      f.dAngle = f.rotates ? (0.06 + Math.random() * 0.06) : 0;
    });
  }

  function resolveCircleCircle(a, b) {
    const ax = a.x + a.w / 2;
    const ay = a.y + a.h / 2;
    const bx = b.x + b.w / 2;
    const by = b.y + b.h / 2;

    const distX = bx - ax;
    const distY = by - ay;
    const dist  = Math.sqrt(distX * distX + distY * distY);
    const minDist = a.radius + b.radius;

    if (dist < minDist && dist > 0) {
      const nx = distX / dist;
      const ny = distY / dist;
      const dvx = a.dx - b.dx;
      const dvy = a.dy - b.dy;
      const dot = dvx * nx + dvy * ny;

      if (dot > 0) {
        a.dx -= dot * nx;
        a.dy -= dot * ny;
        b.dx += dot * nx;
        b.dy += dot * ny;
      }

      const overlap = (minDist - dist) / 2 + 0.5;
      a.x -= nx * overlap;
      a.y -= ny * overlap;
      b.x += nx * overlap;
      b.y += ny * overlap;
    }
  }

  function resolveBoxBox(a, b) {
    const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
    const overlapY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);

    if (overlapX > 0 && overlapY > 0) {
      if (overlapX < overlapY) {
        const temp = a.dx; a.dx = b.dx; b.dx = temp;
        const nudge = overlapX / 2 + 1;
        if (a.x < b.x) { a.x -= nudge; b.x += nudge; }
        else            { a.x += nudge; b.x -= nudge; }
      } else {
        const temp = a.dy; a.dy = b.dy; b.dy = temp;
        const nudge = overlapY / 2 + 1;
        if (a.y < b.y) { a.y -= nudge; b.y += nudge; }
        else            { a.y += nudge; b.y -= nudge; }
      }
    }
  }

  function resolveCircleBox(circle, box) {
    const cx = circle.x + circle.w / 2;
    const cy = circle.y + circle.h / 2;
    const closestX = Math.max(box.x, Math.min(cx, box.x + box.w));
    const closestY = Math.max(box.y, Math.min(cy, box.y + box.h));

    const distX = cx - closestX;
    const distY = cy - closestY;
    const dist  = Math.sqrt(distX * distX + distY * distY);

    if (dist < circle.radius && dist > 0) {
      const nx = distX / dist;
      const ny = distY / dist;
      const dvx = circle.dx - box.dx;
      const dvy = circle.dy - box.dy;
      const dot = dvx * nx + dvy * ny;

      if (dot > 0) {
        circle.dx -= dot * nx;
        circle.dy -= dot * ny;
        box.dx    += dot * nx;
        box.dy    += dot * ny;
      }

      const overlap = (circle.radius - dist) / 2 + 0.5;
      circle.x -= nx * overlap;
      circle.y -= ny * overlap;
      box.x    += nx * overlap;
      box.y    += ny * overlap;
    }
  }

  function resolveCollision(a, b) {
    if (a.shape === "circle" && b.shape === "circle") {
      resolveCircleCircle(a, b);
    } else if (a.shape === "box" && b.shape === "box") {
      resolveBoxBox(a, b);
    } else {
      const circle = a.shape === "circle" ? a : b;
      const box    = a.shape === "circle" ? b : a;
      resolveCircleBox(circle, box);
    }
  }

  function tick() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    floats.forEach(f => {
      f.x += f.dx;
      f.y += f.dy;
      f.angle += f.dAngle;

      if (f.x <= 0)        { f.x = 0;        f.dx =  Math.abs(f.dx); }
      if (f.x + f.w >= vw) { f.x = vw - f.w; f.dx = -Math.abs(f.dx); }
      if (f.y <= 0)        { f.y = 0;        f.dy =  Math.abs(f.dy); }
      if (f.y + f.h >= vh) { f.y = vh - f.h; f.dy = -Math.abs(f.dy); }
    });

    for (let i = 0; i < floats.length; i++) {
      for (let j = i + 1; j < floats.length; j++) {
        resolveCollision(floats[i], floats[j]);
      }
    }

    floats.forEach(f => {
      f.el.style.left      = `${f.x}px`;
      f.el.style.top       = `${f.y}px`;
      f.el.style.right     = "auto";
      f.el.style.bottom    = "auto";
      f.el.style.transform = f.rotates ? `rotate(${f.angle}deg)` : "none";
    });

    requestAnimationFrame(tick);
  }

  setTimeout(() => {
    init();
    requestAnimationFrame(tick);
  }, 150);

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(init, 200);
  });

})();