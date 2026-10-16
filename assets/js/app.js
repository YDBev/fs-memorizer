// USPA Formation Skydiving Memorizer - Application Logic

let currentDiscipline = 'FS 4-Way';
let currentView = 'flashcards';
let soundEnabled = true;

// Flashcards state
let fcFilter = 'all';
let fcMode = 'diagram-to-name';
let currentCardList = [];
let currentCardIdx = 0;
let isCardFlipped = false;

// Quiz state
let quizQuestions = [];
let quizCurrentIdx = 0;
let quizScore = 0;
let quizStreak = 0;
let quizAnswered = false;

// Draw state
let currentDrawList = [];
let dirtDiveStepIdx = 0;

// Type-in state
let typeInList = [];
let typeInIdx = 0;

// Explorer state
let explorerFilter = 'all';
let gridQuizMode = false;

// --- Web Audio Synthesizer ---
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) audioCtx = new AudioContext();
  }
}

function playSound(type) {
  if (!soundEnabled) return;
  try {
    initAudio();
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'flip') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(480, now + 0.08);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'correct') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'wrong') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(140, now + 0.18);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.18);
    } else if (type === 'step') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  } catch (e) {
    // Audio context may be restricted before user gesture
  }
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  document.getElementById('soundIcon').textContent = soundEnabled ? '🔊' : '🔇';
  if (soundEnabled) playSound('correct');
}

// --- Theme Management ---
function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  document.getElementById('themeIcon').textContent = next === 'dark' ? '☀️' : '🌙';
  localStorage.setItem('fs_theme', next);
}

function initTheme() {
  const saved = localStorage.getItem('fs_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  document.getElementById('themeIcon').textContent = saved === 'dark' ? '☀️' : '🌙';
}

// --- View Switching ---
function switchView(viewName) {
  currentView = viewName;
  document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));

  const targetSec = document.getElementById(`view-${viewName}`);
  if (targetSec) targetSec.classList.add('active');

  const targetTab = document.querySelector(`.nav-tab[data-view="${viewName}"]`);
  if (targetTab) targetTab.classList.add('active');

  if (viewName === 'flashcards') {
    initFlashcards();
  } else if (viewName === 'quiz') {
    startQuiz();
  } else if (viewName === 'draw') {
    generateCompetitionDraw();
  } else if (viewName === 'typein') {
    initTypeIn();
  } else if (viewName === 'explorer') {
    renderExplorerGrid();
  }
}

// --- Discipline Selection ---
function onDisciplineChange(disc) {
  currentDiscipline = disc;
  if (currentView === 'flashcards') initFlashcards();
  else if (currentView === 'quiz') startQuiz();
  else if (currentView === 'draw') generateCompetitionDraw();
  else if (currentView === 'typein') initTypeIn();
  else if (currentView === 'explorer') renderExplorerGrid();
}

function getFilteredFormations(discipline, filterType) {
  return FORMATIONS_DATA.filter(item => {
    const discMatch = (discipline === 'ALL') || (item.discipline === discipline);
    if (!discMatch) return false;
    if (filterType === 'all') return true;
    if (filterType === 'block') return item.type === 'block';
    if (filterType === 'random') return item.type === 'random';
    return true;
  });
}

// ==========================================
// 1. FLASHCARDS ENGINE
// ==========================================
function setFlashcardFilter(filter) {
  fcFilter = filter;
  document.querySelectorAll('[data-fc-filter]').forEach(b => b.classList.remove('active'));
  const btn = document.querySelector(`[data-fc-filter="${filter}"]`);
  if (btn) btn.classList.add('active');
  initFlashcards();
}

function setFlashcardTestMode(mode) {
  fcMode = mode;
  updateFlashcardUI();
}

function initFlashcards() {
  currentCardList = getFilteredFormations(currentDiscipline, fcFilter);
  if (currentCardList.length === 0) {
    currentCardList = FORMATIONS_DATA.filter(i => i.discipline === 'FS 4-Way');
  }
  currentCardIdx = 0;
  isCardFlipped = false;
  document.getElementById('flashcardScene').classList.remove('is-flipped');
  updateFlashcardUI();
}

function updateFlashcardUI() {
  if (currentCardList.length === 0) return;
  const item = currentCardList[currentCardIdx];

  document.getElementById('fc-current-index').textContent = currentCardIdx + 1;
  document.getElementById('fc-total-count').textContent = currentCardList.length;

  const pct = Math.round(((currentCardIdx + 1) / currentCardList.length) * 100);
  document.getElementById('fc-progress-fill').style.width = `${pct}%`;

  // Mastery score
  const masteryCount = currentCardList.filter(i => (localStorage.getItem(`fs_m_${i.id}`) || '0') >= '3').length;
  const masteryPct = Math.round((masteryCount / currentCardList.length) * 100);
  document.getElementById('fc-mastery-percent').textContent = `${masteryPct}%`;

  // Pill badge
  const pill = document.getElementById('fc-discipline-pill');
  pill.textContent = item.discipline;
  pill.className = `badge badge-${item.type}`;

  const frontBadge = document.getElementById('fc-front-badge');
  frontBadge.textContent = item.type.toUpperCase();
  frontBadge.className = `badge badge-${item.type}`;
  document.getElementById('fc-front-discipline').textContent = item.discipline;

  const frontImgWrapper = document.getElementById('fc-front-img-wrapper');
  const frontPrompt = document.getElementById('fc-front-text-prompt');
  const frontImg = document.getElementById('fc-front-img');

  if (fcMode === 'diagram-to-name') {
    // Front shows masked image, user guesses name/code
    frontImgWrapper.style.display = 'flex';
    frontPrompt.style.display = 'none';
    frontImg.src = item.image_masked;
  } else if (fcMode === 'name-to-diagram') {
    // Front shows name/code, user visualizes diagram
    frontImgWrapper.style.display = 'none';
    frontPrompt.style.display = 'flex';
    document.getElementById('fc-front-name-title').textContent = `${item.code}: ${item.name}`;
  } else if (fcMode === 'inter-test') {
    // For blocks: test inter maneuver
    frontImgWrapper.style.display = 'flex';
    frontPrompt.style.display = 'none';
    frontImg.src = item.image_masked;
  }

  // Back setup
  document.getElementById('fc-back-badge').textContent = item.type.toUpperCase();
  document.getElementById('fc-back-badge').className = `badge badge-${item.type}`;
  document.getElementById('fc-back-points').textContent = `${item.points} Point${item.points > 1 ? 's' : ''}`;
  document.getElementById('fc-back-img').src = item.image_full;

  document.getElementById('fc-back-title').textContent = `${item.code}: ${item.name}`;

  const interRow = document.getElementById('fc-back-inter-row');
  if (item.inter && item.inter !== 'None (Random)' && item.inter !== 'None (Single Formation)') {
    interRow.style.display = 'flex';
    document.getElementById('fc-back-inter').textContent = item.inter;
  } else {
    interRow.style.display = 'none';
  }

  const f1Row = document.getElementById('fc-back-f1-row');
  const f2Row = document.getElementById('fc-back-f2-row');
  if (item.type === 'block') {
    f1Row.style.display = 'flex';
    f2Row.style.display = 'flex';
    document.getElementById('fc-back-f1').textContent = item.formation1;
    document.getElementById('fc-back-f2').textContent = item.formation2;
  } else {
    f1Row.style.display = 'none';
    f2Row.style.display = 'none';
  }

  const notesRow = document.getElementById('fc-back-notes-row');
  if (item.notes) {
    notesRow.style.display = 'flex';
    document.getElementById('fc-back-notes').textContent = item.notes;
  } else {
    notesRow.style.display = 'none';
  }
}

function flipFlashcard() {
  isCardFlipped = !isCardFlipped;
  const scene = document.getElementById('flashcardScene');
  if (isCardFlipped) {
    scene.classList.add('is-flipped');
    playSound('flip');
  } else {
    scene.classList.remove('is-flipped');
  }
}

function nextFlashcard() {
  if (currentCardList.length === 0) return;
  currentCardIdx = (currentCardIdx + 1) % currentCardList.length;
  isCardFlipped = false;
  document.getElementById('flashcardScene').classList.remove('is-flipped');
  updateFlashcardUI();
  playSound('step');
}

function prevFlashcard() {
  if (currentCardList.length === 0) return;
  currentCardIdx = (currentCardIdx - 1 + currentCardList.length) % currentCardList.length;
  isCardFlipped = false;
  document.getElementById('flashcardScene').classList.remove('is-flipped');
  updateFlashcardUI();
  playSound('step');
}

function shuffleFlashcards() {
  for (let i = currentCardList.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [currentCardList[i], currentCardList[j]] = [currentCardList[j], currentCardList[i]];
  }
  currentCardIdx = 0;
  isCardFlipped = false;
  document.getElementById('flashcardScene').classList.remove('is-flipped');
  updateFlashcardUI();
  playSound('flip');
}

function rateFlashcard(score) {
  if (currentCardList.length === 0) return;
  const item = currentCardList[currentCardIdx];
  const key = `fs_m_${item.id}`;
  let currentScore = parseInt(localStorage.getItem(key) || '0', 10);

  if (score === 1) currentScore = Math.max(0, currentScore - 1);
  else if (score === 2) currentScore = Math.max(1, currentScore);
  else if (score === 3) currentScore += 1;
  else if (score === 4) currentScore += 2;

  localStorage.setItem(key, currentScore.toString());

  if (score >= 3) playSound('correct');
  else playSound('wrong');

  nextFlashcard();
}

function resetDisciplineProgress() {
  if (confirm(`Reset mastery tracking for all formations in ${currentDiscipline}?`)) {
    currentCardList.forEach(item => {
      localStorage.removeItem(`fs_m_${item.id}`);
    });
    updateFlashcardUI();
    playSound('step');
  }
}

// ==========================================
// 2. SPEED QUIZ ENGINE
// ==========================================
function startQuiz() {
  let pool = getFilteredFormations(currentDiscipline, 'all');
  if (pool.length < 4) pool = FORMATIONS_DATA;

  // Shuffle pool to pick 10 questions
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  quizQuestions = shuffled.slice(0, Math.min(10, shuffled.length));
  quizCurrentIdx = 0;
  quizScore = 0;
  quizStreak = 0;
  quizAnswered = false;

  document.getElementById('quiz-score').textContent = '0';
  document.getElementById('quiz-streak').textContent = '0';
  document.getElementById('quiz-disc-badge').textContent = currentDiscipline;

  loadQuizQuestion();
}

function restartQuiz() {
  startQuiz();
}

function loadQuizQuestion() {
  quizAnswered = false;
  document.getElementById('quiz-feedback').style.display = 'none';

  const q = quizQuestions[quizCurrentIdx];
  document.getElementById('quiz-progress-text').textContent = `Question ${quizCurrentIdx + 1} of ${quizQuestions.length}`;
  document.getElementById('quiz-q-img').src = q.image_masked;

  // Pick 3 distractors from same discipline (or all formations)
  let distractors = FORMATIONS_DATA.filter(item => item.id !== q.id && (item.discipline === q.discipline || currentDiscipline === 'ALL'));
  if (distractors.length < 3) distractors = FORMATIONS_DATA.filter(item => item.id !== q.id);

  distractors = [...distractors].sort(() => 0.5 - Math.random()).slice(0, 3);
  const options = [...distractors, q].sort(() => 0.5 - Math.random());

  const container = document.getElementById('quiz-options-container');
  container.innerHTML = '';

  options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-opt-btn';
    btn.innerHTML = `<span><strong>${idx + 1}.</strong> ${opt.code}: ${opt.name}</span>`;
    btn.onclick = () => handleQuizAnswer(opt, btn, q);
    container.appendChild(btn);
  });
}

function handleQuizAnswer(selectedOpt, btn, question) {
  if (quizAnswered) return;
  quizAnswered = true;

  const isCorrect = selectedOpt.id === question.id;
  const feedback = document.getElementById('quiz-feedback');
  const title = document.getElementById('quiz-feedback-title');
  const body = document.getElementById('quiz-feedback-body');

  document.querySelectorAll('.quiz-opt-btn').forEach(b => {
    b.disabled = true;
    if (b.textContent.includes(`${question.code}: ${question.name}`)) {
      b.classList.add('correct');
    }
  });

  if (isCorrect) {
    btn.classList.add('correct');
    quizScore += 100 + (quizStreak * 20);
    quizStreak += 1;
    title.textContent = '🎉 Correct!';
    title.style.color = 'var(--accent-green)';
    body.textContent = `${question.code}: ${question.name} ${question.inter && question.inter !== 'None (Random)' ? `• Inter: ${question.inter}` : ''}`;
    playSound('correct');
  } else {
    btn.classList.add('wrong');
    quizStreak = 0;
    title.textContent = '❌ Incorrect';
    title.style.color = 'var(--accent-red)';
    body.textContent = `The correct answer is: ${question.code}: ${question.name} ${question.inter ? `(${question.inter})` : ''}`;
    playSound('wrong');
  }

  document.getElementById('quiz-score').textContent = quizScore;
  document.getElementById('quiz-streak').textContent = quizStreak;
  feedback.style.display = 'block';
}

function nextQuizQuestion() {
  quizCurrentIdx += 1;
  if (quizCurrentIdx < quizQuestions.length) {
    loadQuizQuestion();
  } else {
    // Quiz finished
    showQuizResults();
  }
}

function showQuizResults() {
  const container = document.getElementById('quiz-options-container');
  container.innerHTML = '';
  document.getElementById('quiz-q-img').src = 'assets/images/rule_scoring_body.png';
  document.getElementById('quiz-feedback').style.display = 'none';

  const card = document.querySelector('#view-quiz .quiz-card');
  const maxScore = quizQuestions.length * 100;
  const accuracy = Math.round((quizScore / (maxScore || 1)) * 100);

  container.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 20px;">
      <h3 style="font-size: 1.8rem; margin-bottom: 8px;">🏆 Quiz Completed!</h3>
      <p style="font-size: 1.1rem; color: var(--text-secondary); margin-bottom: 16px;">Final Score: <strong>${quizScore}</strong> | Accuracy: <strong>${accuracy}%</strong></p>
      <button class="btn-primary" style="margin: auto;" onclick="startQuiz()">Play Again 🔄</button>
    </div>
  `;
}

// ==========================================
// 3. DIRT-DIVE & DRAW GENERATOR
// ==========================================
function generateCompetitionDraw() {
  let disc = currentDiscipline;
  if (disc === 'ALL' || disc === 'Rules & Symbols') disc = 'FS 4-Way';

  const blocks = FORMATIONS_DATA.filter(i => i.discipline === disc && i.type === 'block');
  const randoms = FORMATIONS_DATA.filter(i => i.discipline === disc && i.type === 'random');

  if (blocks.length === 0 && randoms.length === 0) {
    // fallback for 10-way
    const forms = FORMATIONS_DATA.filter(i => i.discipline === disc);
    currentDrawList = [...forms].sort(() => 0.5 - Math.random()).slice(0, 4);
  } else {
    // USPA Formation Skydiving Draw Rule:
    // A round is drawn with 5 to 6 points total
    // Blocks = 2 points, Randoms = 1 point
    const drawn = [];
    const usedBlocks = new Set();
    const usedRandoms = new Set();
    let totalPoints = 0;

    // Draw mix of blocks and randoms
    while (totalPoints < 5) {
      const pickBlock = Math.random() < 0.6 && blocks.length > 0;
      if (pickBlock) {
        const available = blocks.filter(b => !usedBlocks.has(b.code));
        if (available.length > 0) {
          const item = available[Math.floor(Math.random() * available.length)];
          drawn.push(item);
          usedBlocks.add(item.code);
          totalPoints += 2;
        }
      } else {
        const available = randoms.filter(r => !usedRandoms.has(r.code));
        if (available.length > 0) {
          const item = available[Math.floor(Math.random() * available.length)];
          drawn.push(item);
          usedRandoms.add(item.code);
          totalPoints += 1;
        }
      }
    }
    currentDrawList = drawn;
  }

  dirtDiveStepIdx = 0;
  renderDrawBoard();
  playSound('step');
}

function renderDrawBoard() {
  const board = document.getElementById('drawDisplayBoard');
  board.innerHTML = '';

  const seqCodes = currentDrawList.map(i => i.code).join(' - ');
  const totalPts = currentDrawList.reduce((acc, i) => acc + (i.points || 1), 0);

  document.getElementById('draw-sequence-str').textContent = seqCodes;
  document.getElementById('draw-total-points').textContent = totalPts;
  document.getElementById('dirt-dive-total').textContent = currentDrawList.length;

  currentDrawList.forEach((item, idx) => {
    const card = document.createElement('div');
    card.className = `draw-card-item ${idx === dirtDiveStepIdx ? 'active-step' : ''}`;
    card.id = `draw-card-${idx}`;
    card.onclick = () => {
      dirtDiveStepIdx = idx;
      updateDirtDiveStep();
    };

    card.innerHTML = `
      <div class="draw-card-header">
        <span class="draw-card-code">${item.code}</span>
        <span class="badge badge-${item.type}">${item.type}</span>
      </div>
      <div class="draw-card-img">
        <img src="${item.image_full}" alt="${item.name}">
      </div>
      <div class="draw-card-name" title="${item.name}">${item.name}</div>
      ${item.inter && item.inter !== 'None (Random)' ? `<div style="font-size: 0.75rem; color: var(--accent-yellow); margin-top: 4px;">🔄 ${item.inter}</div>` : ''}
    `;
    board.appendChild(card);
  });

  updateDirtDiveStep();
}

function stepDirtDive(delta) {
  if (currentDrawList.length === 0) return;
  dirtDiveStepIdx = (dirtDiveStepIdx + delta + currentDrawList.length) % currentDrawList.length;
  updateDirtDiveStep();
  playSound('step');
}

function updateDirtDiveStep() {
  document.querySelectorAll('.draw-card-item').forEach((c, idx) => {
    if (idx === dirtDiveStepIdx) c.classList.add('active-step');
    else c.classList.remove('active-step');
  });

  const activeCard = document.getElementById(`draw-card-${dirtDiveStepIdx}`);
  if (activeCard) {
    activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }

  const cur = currentDrawList[dirtDiveStepIdx];
  if (cur) {
    document.getElementById('dirt-dive-step').textContent = dirtDiveStepIdx + 1;
    document.getElementById('dirt-dive-name').textContent = `${cur.code}: ${cur.name} ${cur.inter && cur.inter !== 'None (Random)' ? `(${cur.inter})` : ''}`;
  }
}

// ==========================================
// 4. TYPE-IN DRILL
// ==========================================
function initTypeIn() {
  typeInList = getFilteredFormations(currentDiscipline, 'all');
  if (typeInList.length === 0) typeInList = FORMATIONS_DATA;
  typeInList = [...typeInList].sort(() => 0.5 - Math.random());
  typeInIdx = 0;
  loadTypeInQuestion();
}

function loadTypeInQuestion() {
  if (typeInList.length === 0) return;
  const item = typeInList[typeInIdx];
  document.getElementById('typein-disc-badge').textContent = item.discipline;
  document.getElementById('typein-q-img').src = item.image_masked;
  document.getElementById('typein-input').value = '';
  document.getElementById('typein-input').disabled = false;
  document.getElementById('typein-feedback').style.display = 'none';
  document.getElementById('typein-input').focus();
}

function checkTypeInAnswer() {
  const item = typeInList[typeInIdx];
  const userVal = document.getElementById('typein-input').value.trim().toLowerCase();
  if (!userVal) return;

  const codeMatch = userVal === item.code.toLowerCase();
  const cleanName = item.name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanUser = userVal.replace(/[^a-z0-9]/g, '');
  const nameMatch = cleanUser.length >= 3 && cleanName.includes(cleanUser);

  const fb = document.getElementById('typein-feedback');
  const title = document.getElementById('typein-feedback-title');
  const body = document.getElementById('typein-feedback-body');

  if (codeMatch || nameMatch) {
    title.textContent = '🎉 Correct!';
    title.style.color = 'var(--accent-green)';
    body.textContent = `${item.code}: ${item.name} ${item.inter && item.inter !== 'None (Random)' ? `• Inter: ${item.inter}` : ''}`;
    playSound('correct');
  } else {
    title.textContent = '❌ Not quite!';
    title.style.color = 'var(--accent-red)';
    body.textContent = `Answer was: ${item.code}: ${item.name}`;
    playSound('wrong');
  }

  document.getElementById('typein-input').disabled = true;
  fb.style.display = 'block';
}

function skipTypeIn() {
  const item = typeInList[typeInIdx];
  const fb = document.getElementById('typein-feedback');
  const title = document.getElementById('typein-feedback-title');
  const body = document.getElementById('typein-feedback-body');

  title.textContent = '💡 Answer Revealed';
  title.style.color = 'var(--accent-blue)';
  body.textContent = `${item.code}: ${item.name} ${item.inter && item.inter !== 'None (Random)' ? `• Inter: ${item.inter}` : ''}`;
  document.getElementById('typein-input').disabled = true;
  fb.style.display = 'block';
  playSound('step');
}

function nextTypeIn() {
  typeInIdx = (typeInIdx + 1) % typeInList.length;
  loadTypeInQuestion();
}

function handleTypeInKey(e) {
  if (e.key === 'Enter') {
    if (document.getElementById('typein-feedback').style.display === 'block') {
      nextTypeIn();
    } else {
      checkTypeInAnswer();
    }
  }
}

// ==========================================
// 5. POOL EXPLORER & GRID
// ==========================================
function setExplorerFilter(filter) {
  explorerFilter = filter;
  document.querySelectorAll('[data-exp-filter]').forEach(b => b.classList.remove('active'));
  const btn = document.querySelector(`[data-exp-filter="${filter}"]`);
  if (btn) btn.classList.add('active');
  renderExplorerGrid();
}

function toggleGridQuizMode() {
  gridQuizMode = !gridQuizMode;
  const btn = document.getElementById('btn-toggle-grid-mask');
  btn.classList.toggle('active', gridQuizMode);
  btn.textContent = gridQuizMode ? '👁️ Revealing Labels' : '👁️ Mask Labels (Self-Test Mode)';
  renderExplorerGrid();
  playSound('flip');
}

function renderExplorerGrid() {
  const query = (document.getElementById('explorerSearchInput').value || '').trim().toLowerCase();
  const container = document.getElementById('formationsGrid');
  container.innerHTML = '';

  const list = FORMATIONS_DATA.filter(item => {
    const discMatch = (currentDiscipline === 'ALL') || (item.discipline === currentDiscipline);
    if (!discMatch) return false;

    if (explorerFilter === 'block' && item.type !== 'block') return false;
    if (explorerFilter === 'random' && item.type !== 'random') return false;

    if (query) {
      const matchName = item.name.toLowerCase().includes(query);
      const matchCode = item.code.toLowerCase() === query;
      const matchInter = item.inter && item.inter.toLowerCase().includes(query);
      if (!matchName && !matchCode && !matchInter) return false;
    }

    return true;
  });

  if (list.length === 0) {
    container.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">No formations found matching criteria.</div>`;
    return;
  }

  list.forEach(item => {
    const card = document.createElement('div');
    card.className = 'grid-card';
    card.onclick = () => openModal(item);

    const imgSrc = gridQuizMode ? item.image_masked : item.image_full;

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-weight: 800; font-size: 1.1rem; color: var(--accent-blue);">${gridQuizMode ? '?' : item.code}</span>
        <span class="badge badge-${item.type}">${item.type}</span>
      </div>
      <div class="grid-card-img">
        <img src="${imgSrc}" alt="${item.name}">
      </div>
      <div class="grid-card-title">${gridQuizMode ? 'Click to reveal' : item.name}</div>
      ${!gridQuizMode && item.inter && item.inter !== 'None (Random)' ? `<div class="grid-card-inter">🔄 ${item.inter}</div>` : ''}
    `;

    container.appendChild(card);
  });
}

function filterExplorerGrid() {
  renderExplorerGrid();
}

// ==========================================
// 6. DETAIL MODAL
// ==========================================
function openModal(item) {
  const body = document.getElementById('modal-body');
  body.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <span class="badge badge-${item.type}">${item.discipline} &bull; ${item.type}</span>
      <span class="badge" style="background: rgba(251, 191, 36, 0.2); color: var(--accent-yellow);">${item.points} Point${item.points > 1 ? 's' : ''}</span>
    </div>
    <div style="text-align: center; margin-bottom: 16px; background: white; padding: 12px; border-radius: var(--radius-md);">
      <img src="${item.image_full}" alt="${item.name}" style="max-height: 440px; max-width: 100%; object-fit: contain;">
    </div>
    <h2 style="font-size: 1.5rem; font-weight: 800; color: var(--accent-blue); margin-bottom: 10px;">${item.code}: ${item.name}</h2>
    ${item.inter && item.inter !== 'None (Random)' ? `
      <div style="margin: 8px 0; font-size: 0.95rem;">
        <strong>Intermediate Move:</strong> <span class="inter-pill">${item.inter}</span>
      </div>
    ` : ''}
    ${item.type === 'block' ? `
      <div style="margin: 6px 0; font-size: 0.95rem;"><strong>First Formation:</strong> ${item.formation1}</div>
      <div style="margin: 6px 0; font-size: 0.95rem;"><strong>Second Formation:</strong> ${item.formation2}</div>
    ` : ''}
    ${item.notes ? `
      <div style="margin-top: 12px; padding: 10px 14px; background: var(--bg-card); border-left: 3px solid var(--accent-blue); border-radius: 4px; font-size: 0.9rem;">
        <strong>Notes:</strong> ${item.notes}
      </div>
    ` : ''}
  `;
  document.getElementById('detailModal').classList.add('active');
  playSound('step');
}

function closeModal(e) {
  if (!e || e.target.classList.contains('modal-overlay') || e.target.classList.contains('modal-close-btn')) {
    document.getElementById('detailModal').classList.remove('active');
  }
}

// ==========================================
// 7. KEYBOARD NAVIGATION
// ==========================================
document.addEventListener('keydown', (e) => {
  // If typing in input, don't trigger global shortcuts
  if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
    return;
  }

  if (currentView === 'flashcards') {
    if (e.code === 'Space') {
      e.preventDefault();
      flipFlashcard();
    } else if (e.key === '1' || e.key === 'ArrowLeft') {
      e.preventDefault();
      rateFlashcard(1);
    } else if (e.key === '2' || e.key === 'ArrowDown') {
      e.preventDefault();
      rateFlashcard(2);
    } else if (e.key === '3' || e.key === 'ArrowUp') {
      e.preventDefault();
      rateFlashcard(3);
    } else if (e.key === '4' || e.key === 'ArrowRight') {
      e.preventDefault();
      rateFlashcard(4);
    }
  } else if (currentView === 'quiz') {
    if (['1', '2', '3', '4'].includes(e.key)) {
      const idx = parseInt(e.key, 10) - 1;
      const btns = document.querySelectorAll('.quiz-opt-btn');
      if (btns[idx] && !btns[idx].disabled) btns[idx].click();
    } else if (e.key === 'Enter') {
      if (document.getElementById('quiz-feedback').style.display === 'block') {
        nextQuizQuestion();
      }
    }
  } else if (currentView === 'draw') {
    if (e.code === 'Space' || e.key === 'ArrowRight') {
      e.preventDefault();
      stepDirtDive(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      stepDirtDive(-1);
    }
  }
});

// ==========================================
// 8. IPHONE APP & MOBILE GESTURES
// ==========================================
function openIPhoneModal() {
  document.getElementById('iphoneModal').classList.add('active');
  playSound('step');
}

function closeIPhoneModal(e) {
  if (!e || e.target.id === 'iphoneModal' || e.target.classList.contains('modal-close-btn')) {
    document.getElementById('iphoneModal').classList.remove('active');
  }
}

// Touch swipe gestures for iPhone flashcards
function initTouchGestures() {
  const scene = document.getElementById('flashcardScene');
  if (!scene) return;

  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;

  scene.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
    touchStartTime = Date.now();
  }, { passive: true });

  scene.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].screenX;
    const touchEndY = e.changedTouches[0].screenY;
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;
    const duration = Date.now() - touchStartTime;

    // Check if horizontal swipe
    if (Math.abs(diffX) > 60 && Math.abs(diffY) < 50 && duration < 500) {
      if (navigator.vibrate) navigator.vibrate(25);
      if (diffX < 0) {
        // Swipe Left -> Rate Again / Hard
        rateFlashcard(1);
      } else {
        // Swipe Right -> Rate Easy / Good
        rateFlashcard(4);
      }
    }
  }, { passive: true });
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
  const sel = document.getElementById('disciplineSelect');
  if (sel) currentDiscipline = sel.value;
  initTheme();
  initFlashcards();
  initTouchGestures();

  // Register Service Worker for 100% offline iPhone PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('[PWA] Service Worker registered:', reg.scope))
      .catch(err => console.log('[PWA] Service Worker registration failed:', err));
  }
});

