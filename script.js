/* ==========================================================================
   Happy Girlfriend's Day — main script
   Organized by story beat. main() wires everything up on load.
   ========================================================================== */

const SCREEN_ORDER = [
  "screen-splash",
  "screen-welcome",
  "screen-verify",
  "screen-dashboard",
  "screen-memories",
  "screen-game",
  "screen-reasons",
  "screen-letter",
  "screen-ending",
];

/**
 * Fades the current active screen out and the target screen in.
 * This is the single mechanism every "Continue" button relies on.
 */
function goToScreen(targetId) {
  const current = document.querySelector(".screen--active");
  const target = document.getElementById(targetId);
  if (!target || target === current) return;

  if (current) current.classList.remove("screen--active");
  target.classList.add("screen--active");

  const onEnter = SCREEN_ENTER_HANDLERS[targetId];
  if (onEnter && !target.dataset.entered) {
    target.dataset.entered = "true";
    onEnter();
  }
}

const LOADING_MESSAGES = [
  "Calculating hugs...",
  "Finding the prettiest girl...",
  "Loading memories...",
  "Downloading love...",
  "Checking boyfriend status...",
  "Preparing surprises...",
  "Charging boyfriend energy...",
  "Error 404: someone prettier not found.",
  "99% complete... emotionally.",
  "Loading... (pretend you're patient).",
];

/* One-off "meme buffer" shown on a single specific transition, instead of
   the usual random loading line — a small surprise, not a repeated bit. */
async function runBufferMeme() {
  const overlay = document.getElementById("loading-overlay");
  const textEl = document.getElementById("loading-text");

  overlay.classList.add("is-visible");
  textEl.textContent = "Buffering because you're too beautiful...";
  await pause(1400);
  textEl.textContent = "Okay continue 😂";
  await pause(900);
  overlay.classList.remove("is-visible");
}

/**
 * Shows a brief rotating-text loading overlay, then advances to the next
 * screen. Kept short (700ms) so it adds flavor without slowing things down.
 */
async function goToNextScreen(fromEl) {
  const currentScreen = fromEl.closest(".screen");
  const index = SCREEN_ORDER.indexOf(currentScreen.id);
  if (index < 0 || index >= SCREEN_ORDER.length - 1) return;

  if (currentScreen.id === "screen-dashboard") {
    await runBufferMeme();
    goToScreen(SCREEN_ORDER[index + 1]);
    return;
  }

  const overlay = document.getElementById("loading-overlay");
  const textEl = document.getElementById("loading-text");
  textEl.textContent = LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];
  overlay.classList.add("is-visible");

  await pause(700);
  goToScreen(SCREEN_ORDER[index + 1]);
  overlay.classList.remove("is-visible");
}

function pause(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ==========================================================================
   Toast system — shared by fake notifications and achievement popups
   ========================================================================== */
function showToast(html, duration = 2600) {
  const toast = document.getElementById("toast");
  toast.innerHTML = html;
  toast.classList.add("is-visible");
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => toast.classList.remove("is-visible"), duration);
}

/* ==========================================================================
   Background music — one <audio> element for the whole experience.
   Starts on the Start button, fades in, never restarts on screen change.
   ========================================================================== */
function setupMusic() {
  const audio = document.getElementById("bg-audio");
  const widget = document.getElementById("music-widget");
  const toggleBtn = document.getElementById("music-toggle");
  const songNote = document.getElementById("song-note");
  let started = false;

  function fadeIn(target = 0.8, durationMs = 2000) {
    audio.volume = 0;
    const steps = 20;
    const stepTime = durationMs / steps;
    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      audio.volume = Math.min(target, (target * i) / steps);
      if (i >= steps) clearInterval(timer);
    }, stepTime);
  }

  async function start() {
    if (started) return;
    started = true;
    try {
      await audio.play();
      fadeIn();
      widget.classList.add("is-visible");
      toggleBtn.textContent = "⏸";
      showToast("🔊 Volume up... trust me.", 2400);
      await pause(1500);
      songNote.classList.add("is-visible");
      await pause(4000);
      songNote.classList.remove("is-visible");
    } catch (err) {
      // Autoplay can still be blocked in some browsers; the toggle button
      // lets her start it manually if so.
      widget.classList.add("is-visible");
    }
  }

  toggleBtn.addEventListener("click", () => {
    if (audio.paused) {
      audio.play();
      toggleBtn.textContent = "⏸";
    } else {
      audio.pause();
      toggleBtn.textContent = "▶";
    }
  });

  return { start };
}

/* ==========================================================================
   Splash: heartbeat, two fade-in lines, then the Start button
   ========================================================================== */
async function runSplash() {
  const line1 = document.getElementById("splash-line-1");
  const line2 = document.getElementById("splash-line-2");
  const startBtn = document.getElementById("btn-start");

  await pause(1200);
  line1.classList.add("is-visible");
  await pause(1400);
  line2.classList.add("is-visible");
  await pause(1400);
  startBtn.classList.add("is-visible");
}

/* ==========================================================================
   Verification
   ========================================================================== */
const VERIFY_STEPS = [
  { question: "Are you Joan?", options: ["Yes ❤️", "Absolutely ❤️"] },
  { question: "Do you promise to smile?", options: ["Yes 😊", "Of course 😊"] },
  { question: "Are you ready for your surprise?", options: ["YESSSS 💕"] },
];

function setupVerification() {
  let step = 0;
  const card = document.getElementById("verify-card");
  const questionEl = document.getElementById("verify-question");
  const optionsEl = document.getElementById("verify-options");

  function render() {
    const { question, options } = VERIFY_STEPS[step];
    questionEl.textContent = question;
    optionsEl.innerHTML = "";
    options.forEach((label) => {
      const btn = document.createElement("button");
      btn.className = "btn btn--soft btn--bounce";
      btn.textContent = label;
      btn.addEventListener("click", handleAnswer);
      optionsEl.appendChild(btn);
    });
  }

  async function handleAnswer() {
    step += 1;
    if (step >= VERIFY_STEPS.length) {
      goToScreen("screen-dashboard");
      return;
    }
    card.classList.add("is-swapping");
    await pause(250);
    render();
    card.classList.remove("is-swapping");
  }

  render();
}

/* ==========================================================================
   Memories — now with Like / Comment / Share, TikTok-post style.
   TODO(Brave): replace placeholder emoji/captions/hiddenMessage with real
   photos in assets/images/ and your own memories.
   ========================================================================== */
const MEMORIES = [
  {
    pov: "POV: You met the love of my life.",
    image: "assets/images/759348524_1358158525933742_8232979133421185192_n.jpg",
    caption: "That day felt like the start of forever ❤️",
    hiddenMessage: "You always make ordinary days feel like a movie scene.",
    likes: 0,
  },
  {
    pov: "Respectfully... hii ni wife material.",
    image: "assets/images/759279841_1704294850807104_7231136439180270986_n.jpg",
    caption: "Your smile still does things to my heart ✨",
    hiddenMessage: "I still think about that look you gave me and smile instantly.",
    likes: 0,
  },
  {
    pov: "Chat, she's smiling isn't she?",
    image: "assets/images/758657208_3925184467787423_4395169691714560399_n.jpg",
    caption: "Some memories stay soft, sweet, and impossible to forget 💕",
    hiddenMessage: "This is one of those moments I want to keep replaying forever.",
    likes: 0,
  },
  {
    pov: "Little moments, big feelings.",
    image: "assets/images/759348524_1358158525933742_8232979133421185192_n.jpg",
    caption: "The kind of picture that brings back a hundred little feelings ❤️",
    hiddenMessage: "You make even the smallest memories feel deeply meaningful.",
    likes: 0,
  },
  {
    pov: "How it started ➜ How it's going ❤️",
    image: "assets/images/759279841_1704294850807104_7231136439180270986_n.jpg",
    caption: "From a simple moment to a forever kind of favorite 🌹",
    hiddenMessage: "I hope we keep collecting more days exactly like this.",
    likes: 0,
  },
];

function setupMemories() {
  let index = 0;
  const povEl = document.getElementById("memory-pov");
  const photoEl = document.getElementById("memory-photo");
  const captionEl = document.getElementById("memory-caption");
  const counterEl = document.getElementById("memory-counter");
  const prevBtn = document.getElementById("memory-prev");
  const nextBtn = document.getElementById("memory-next");
  const likeBtn = document.getElementById("memory-like");
  const likeIcon = document.getElementById("memory-like-icon");
  const likeCount = document.getElementById("memory-like-count");
  const commentBtn = document.getElementById("memory-comment");
  const shareBtn = document.getElementById("memory-share");
  const hiddenMsgEl = document.getElementById("memory-hidden-message");

  function render() {
    const memory = MEMORIES[index];
    povEl.textContent = memory.pov || "";
    photoEl.innerHTML = memory.image
      ? `<img src="${memory.image}" alt="A favorite memory with you" class="memory-image">`
      : memory.emoji || "📸";
    captionEl.textContent = memory.caption;
    counterEl.textContent = `${index + 1} / ${MEMORIES.length}`;
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === MEMORIES.length - 1;
    likeIcon.textContent = memory.liked ? "❤️" : "🤍";
    likeCount.textContent = memory.likes;
    hiddenMsgEl.textContent = memory.hiddenMessage;
    hiddenMsgEl.classList.remove("is-visible");
  }

  prevBtn.addEventListener("click", () => { if (index > 0) { index -= 1; render(); } });
  nextBtn.addEventListener("click", () => { if (index < MEMORIES.length - 1) { index += 1; render(); } });

  likeBtn.addEventListener("click", (e) => {
    const memory = MEMORIES[index];
    memory.liked = !memory.liked;
    memory.likes += memory.liked ? 1 : -1;
    render();
    if (memory.liked) spawnLikeBurst(e.clientX, e.clientY);
  });

  commentBtn.addEventListener("click", () => hiddenMsgEl.classList.toggle("is-visible"));

  shareBtn.addEventListener("click", () => showToast("Already shared with my heart ❤️"));

  render();
}

function spawnLikeBurst(x, y) {
  const heart = document.createElement("span");
  heart.className = "like-burst";
  heart.textContent = "❤️";
  heart.style.left = `${x - 10}px`;
  heart.style.top = `${y - 10}px`;
  document.body.appendChild(heart);
  setTimeout(() => heart.remove(), 900);
}

/* ==========================================================================
   Mini game — catch falling hearts. Collecting 10 unlocks Continue and
   fires an Achievement Unlocked toast.
   ========================================================================== */
const HEART_WORDS = ["Beautiful", "Cute", "Smart", "Mine 😂", "Amazing", "Kind", "Funny"];
const GOAL = 10;

function setupGame() {
  const field = document.getElementById("game-field");
  const scoreEl = document.getElementById("game-score");
  const continueBtn = document.getElementById("btn-game-continue");
  let score = 0;
  let spawnTimer = null;

  function spawnHeart() {
    if (score >= GOAL) return;
    const heart = document.createElement("button");
    heart.className = "falling-heart";
    heart.textContent = "❤️";
    heart.style.left = `${Math.random() * 85}%`;
    heart.style.animationDuration = `${3 + Math.random() * 2}s`;
    heart.title = HEART_WORDS[Math.floor(Math.random() * HEART_WORDS.length)];

    heart.addEventListener("click", () => {
      score += 1;
      scoreEl.textContent = score;
      heart.remove();
      if (score >= GOAL) {
        continueBtn.disabled = false;
        clearInterval(spawnTimer);
        playAchievementSound();
        showToast("🏆 Achievement Unlocked<br><strong>Best Girlfriend Ever</strong>", 3200);
      }
    });

    heart.addEventListener("animationend", () => heart.remove());
    field.appendChild(heart);
  }

  spawnTimer = setInterval(spawnHeart, 700);
}

/**
 * Plays a short two-note "ding" for the achievement popup, synthesized
 * directly so we don't need an extra sound-effect file.
 */
function playAchievementSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + i * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.12 + 0.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.32);
    });
  } catch (err) {
    // Silently skip if Web Audio isn't available — the visual toast still shows.
  }
}

/* ==========================================================================
   Reasons generator
   TODO(Brave): rewrite these with your own real reasons.
   ========================================================================== */
const REASONS = [
  "You make ordinary days feel special.",
  "I still smile when your name pops up.",
  "You're my favourite person.",
  "You make bad days better.",
  "You make distance feel smaller.",
  "Your laugh is my favourite sound.",
  "Chat... she's actually beautiful.",
  "Error 404: someone prettier not found.",
  "Sii unajua body is teaaa !!.",
];

async function showReasonsNotification() {
  await pause(1800);
  showToast("📩 Daily reward claimed<br><strong>1 boyfriend 🎁</strong>", 2800);
}

function setupReasons() {
  showReasonsNotification();
  const textEl = document.getElementById("reason-text");
  const numberEl = document.getElementById("reason-number");
  const btn = document.getElementById("btn-another-reason");
  let shown = 0;
  let pool = shuffle([...REASONS]);

  function showNext() {
    if (pool.length === 0) pool = shuffle([...REASONS]);
    shown += 1;
    numberEl.textContent = `#${shown}`;
    textEl.textContent = pool.pop();
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  btn.addEventListener("click", showNext);
  showNext();
}

/* ==========================================================================
   Letter — slow typing effect, no jokes, everything quiet.
   TODO(Brave): replace LETTER_TEXT with what you actually want to say.
   ========================================================================== */
const LETTER_TEXT = `Dear Joan,

My beautiful Joan ❤️,

Thank you for being the kind of person who makes life softer, sweeter, and brighter.

You make ordinary days feel special, and honestly, being your person is one of my favorite things in the world.

I love you for your smile, your heart, your kindness, and the way you always make me feel seen.

So here’s my promise: I’ll keep choosing you, loving you, and making room for us in every future I imagine.

I love you, Joan. 🫶🏽

Love,
Brave`;

async function runLetter() {
  const textEl = document.getElementById("letter-text");
  const continueBtn = document.getElementById("btn-letter-continue");

  textEl.textContent = "";
  continueBtn.classList.remove("is-visible");

  for (const char of LETTER_TEXT) {
    textEl.textContent += char;
    await pause(char === "\n" ? 180 : 18);
  }

  await pause(300);
  continueBtn.classList.add("is-visible");
}

/* ==========================================================================
   Ending — Wrapped-style summary + confetti + tab title change
   ========================================================================== */
function runEndingConfetti() {
  const canvas = document.getElementById("confetti-canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ["#FF6FAE", "#FFDCEB", "#FF8CB8", "#FFFFFF"];
  const pieces = Array.from({ length: 120 }, () => ({
    x: Math.random() * canvas.width,
    y: -20 - Math.random() * canvas.height,
    size: 4 + Math.random() * 6,
    speed: 1 + Math.random() * 3,
    drift: (Math.random() - 0.5) * 1.5,
    color: colors[Math.floor(Math.random() * colors.length)],
    rotation: Math.random() * 360,
  }));

  let frame = 0;
  const maxFrames = 420;

  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach((p) => {
      p.y += p.speed;
      p.x += p.drift;
      if (p.y > canvas.height) p.y = -20;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    });
    frame += 1;
    if (frame < maxFrames) requestAnimationFrame(tick);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  tick();
}

/** Checks off the Mission Objectives list one item at a time. */
async function animateMissionChecklist() {
  const items = document.querySelectorAll("#mission-list li");
  for (const item of items) {
    await pause(450);
    item.classList.add("is-checked");
  }
}

function populateWrappedStats() {
  const el = document.getElementById("wrapped-memory-count");
  if (el) el.textContent = `${MEMORIES.length} beautiful memories`;
}

function updateTabTitleForEnding() {
  document.title = "I love you, Joan ❤️";
}

/* ==========================================================================
   Ambient floating hearts + Instagram-style notes
   ========================================================================== */
const AMBIENT_NOTES = ["thinking about u", "wife loading...", "can't stop smiling", "my favourite person ❤️"];

function startAmbientHearts() {
  const container = document.getElementById("ambient-hearts");
  let tick = 0;

  setInterval(() => {
    tick += 1;
    const isNote = tick % 4 === 0; // roughly 1 in 4 spawns is a text note instead of a heart

    const el = document.createElement(isNote ? "span" : "span");
    el.className = isNote ? "ambient-note" : "ambient-heart";
    el.textContent = isNote
      ? AMBIENT_NOTES[Math.floor(Math.random() * AMBIENT_NOTES.length)]
      : "❤️";
    el.style.left = `${Math.random() * 100}%`;
    el.style.setProperty("--drift", `${(Math.random() - 0.5) * 80}px`);
    el.style.animationDuration = `${8 + Math.random() * 6}s`;
    container.appendChild(el);
    setTimeout(() => el.remove(), 15000);
  }, 2200);
}

/* ==========================================================================
   Tilt cards — subtle 3D hover tilt that follows the cursor
   ========================================================================== */
function attachTilt() {
  const MAX_TILT = 6; // degrees

  document.body.addEventListener("mousemove", (e) => {
    const card = e.target.closest(".tilt-card");
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(600px) rotateX(${-py * MAX_TILT}deg) rotateY(${px * MAX_TILT}deg)`;
  });

  document.body.addEventListener(
    "mouseleave",
    (e) => {
      const card = e.target.closest && e.target.closest(".tilt-card");
      if (card) card.style.transform = "";
    },
    true
  );
}

/* ==========================================================================
   Fake "New Message" notification — a small social-app-style touch,
   shown once, shortly after she reaches the Welcome screen.
   ========================================================================== */
async function showWelcomeNotification() {
  await pause(2500);
  showToast("📩 New Message<br><strong>\"I love you.\"</strong>", 2800);
}

/* ==========================================================================
   Wiring
   ========================================================================== */
const SCREEN_ENTER_HANDLERS = {
  "screen-welcome": showWelcomeNotification,
  "screen-verify": setupVerification,
  "screen-memories": setupMemories,
  "screen-game": setupGame,
  "screen-reasons": setupReasons,
  "screen-letter": runLetter,
  "screen-ending": () => { runEndingConfetti(); populateWrappedStats(); updateTabTitleForEnding(); animateMissionChecklist(); },
};

function main() {
  startAmbientHearts();
  attachTilt();
  runSplash();

  const music = setupMusic();

  document.querySelectorAll("[data-next]").forEach((el) => {
    el.addEventListener("click", () => goToNextScreen(el));
  });

  document.getElementById("btn-start").addEventListener("click", () => {
    goToScreen("screen-welcome");
    music.start();
  });
}

document.addEventListener("DOMContentLoaded", main);
