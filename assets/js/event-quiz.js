// ============================================
// ЭЛЕМЕНТЫ
// ============================================
const modal = document.getElementById('modal');
const modalClose = document.getElementById('modal-close');
const stepForm = document.getElementById('step-form');
const stepSurvey = document.getElementById('step-survey');
const stepTimeout = document.getElementById('step-timeout');
const stepSurveyResult = document.getElementById('step-survey-result');
const stepSuccess = document.getElementById('step-success');

const btnOpenEvent = document.getElementById('btn-open-event');
const btnCloseSuccess = document.getElementById('btn-close-success');

const nickInput = document.getElementById('nick');
const nickError = document.getElementById('nick-error');
const nickShown = document.getElementById('nick-shown');
const btnStart = document.getElementById('btn-start');

const timerValue = document.getElementById('timer-value');
const questionCounter = document.getElementById('question-counter');
const questionText = document.getElementById('question-text');
const optionsBox = document.getElementById('options');
const feedbackBox = document.getElementById('feedback');
const progressFill = document.getElementById('progress-fill');
const btnNext = document.getElementById('btn-next');
const btnTimeoutRetry = document.getElementById('btn-timeout-retry');

const surveyResultBlock = document.getElementById('survey-result-block');
const surveyResultTitle = document.getElementById('survey-result-title');
const surveyScore = document.getElementById('survey-score');
const surveyScoreLabel = document.getElementById('survey-score-label');
const surveyResultText = document.getElementById('survey-result-text');
const surveyResultBtn = document.getElementById('survey-result-btn');

// ============================================
// КОНСТАНТЫ
// ============================================
const TOTAL_TIME = 40;
const PASS_SCORE = 6;

// ============================================
// БАЗА ВОПРОСОВ
// ============================================
const BASE_QUESTIONS = [
  {
    q: 'Кто убил брата ради второй жизни?',
    options: ['Азум', 'буК', 'Я', 'Астра'],
    correct: 0,
    explain: 'Азум убил своего брата, чтобы получить вторую жизнь.'
  },
  {
    q: 'Кто такой буК?',
    options: ['Главный злодей', 'Помощник героя', 'Оружие', 'Карта'],
    correct: 0,
    explain: 'буК — главный злодей Cubic Battle 4.'
  },
  {
    q: 'Кто такой CodeCracker?',
    options: ['Помощник буКа', 'Главный герой', 'Девушка Азума', 'Оружие'],
    correct: 0,
    explain: 'CodeCracker — верный помощник буКа.'
  },
  {
    q: 'Кто девушка Азума?',
    options: ['Астра (Настя)', 'буК', 'CodeCracker', 'Никто'],
    correct: 0,
    explain: 'Девушку Азума зовут Астра, её настоящее имя — Настя.'
  },
  {
    q: 'Зачем Азум убил брата?',
    options: ['Ради второй жизни', 'Из мести', 'Случайно', 'По приказу буКа'],
    correct: 0,
    explain: 'Азум пошёл на это ради второй жизни.'
  },
  {
    q: 'Как зовут главного злодея?',
    options: ['буК', 'Азум', 'CodeCracker', 'Астра'],
    correct: 0,
    explain: 'Главный злодей — буК.'
  },
  {
    q: 'Кто три самых главных разраба игры?',
    options: [
      'Дима, Дима Сараев, Настя',
      'Дима, Кирилл, Чипс'
    ],
    correct: 0,
    explain: 'Главные разработчики — Дима, Дима Сараев и Настя.'
  },
];

// ============================================
// ПЕРЕМЕШИВАНИЕ
// ============================================
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildShuffledQuestions() {
  const shuffledQuestions = shuffle(BASE_QUESTIONS);
  return shuffledQuestions.map(q => {
    const correctText = q.options[q.correct];
    const shuffledOptions = shuffle(q.options);
    const newCorrectIndex = shuffledOptions.indexOf(correctText);
    return {
      q: q.q,
      options: shuffledOptions,
      correct: newCorrectIndex,
      explain: q.explain,
    };
  });
}

// ============================================
// СОСТОЯНИЕ
// ============================================
let currentNick = '';
let currentQuestion = 0;
let answers = [];
let correctCount = 0;
let answeredCurrent = false;
let timerInterval = null;
let timeLeft = TOTAL_TIME;
let QUESTIONS = [];

function resetSurveyState() {
  QUESTIONS = buildShuffledQuestions();
  currentQuestion = 0;
  answers = new Array(QUESTIONS.length).fill(null);
  correctCount = 0;
  answeredCurrent = false;
  timeLeft = TOTAL_TIME;
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function hideCloseButton() {
  modalClose.classList.remove('show');
}

function showCloseButton() {
  modalClose.classList.add('show');
}

// ============================================
// ТАЙМЕР
// ============================================
function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timeLeft = TOTAL_TIME;
  updateTimerUI();

  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerUI();

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      onTimeout();
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function updateTimerUI() {
  timerValue.textContent = timeLeft;
  if (timeLeft <= 10) {
    timerValue.classList.add('warning');
  } else {
    timerValue.classList.remove('warning');
  }
}

function onTimeout() {
  stopTimer();
  resetSurveyState();

  stepSurvey.style.display = 'none';
  stepSurveyResult.style.display = 'none';
  stepSuccess.classList.remove('show');

  showCloseButton();

  stepTimeout.style.display = 'block';
  stepTimeout.classList.add('show');
}

// ============================================
// ОТРИСОВКА ВОПРОСА
// ============================================
function renderQuestion() {
  const item = QUESTIONS[currentQuestion];
  questionCounter.textContent = 'Вопрос ' + (currentQuestion + 1) + ' из ' + QUESTIONS.length;
  questionText.textContent = item.q;

  progressFill.style.width = ((currentQuestion) / QUESTIONS.length * 100) + '%';

  optionsBox.innerHTML = '';
  feedbackBox.className = 'feedback';
  feedbackBox.textContent = '';

  const chosen = answers[currentQuestion];
  answeredCurrent = chosen !== null;

  item.options.forEach((opt, i) => {
    const el = document.createElement('div');
    el.className = 'option';

    if (answeredCurrent) {
      el.classList.add('disabled');
      if (i === item.correct) {
        el.classList.add('correct');
        el.innerHTML = '<span class="mark">✓</span><span>' + opt + '</span>';
      } else if (i === chosen) {
        el.classList.add('wrong');
        el.innerHTML = '<span class="mark">✕</span><span>' + opt + '</span>';
      } else {
        el.innerHTML = '<span class="mark"></span><span>' + opt + '</span>';
      }
    } else {
      el.innerHTML = '<span class="mark"></span><span>' + opt + '</span>';
      el.addEventListener('click', () => selectOption(i));
    }

    optionsBox.appendChild(el);
  });

  if (answeredCurrent) {
    const isCorrect = chosen === item.correct;
    feedbackBox.classList.add('show', isCorrect ? 'ok' : 'bad');
    feedbackBox.innerHTML = (isCorrect ? '✓ Верно. ' : '✕ Неверно. ') + item.explain;
  }

  btnNext.disabled = !answeredCurrent;
  btnNext.textContent = currentQuestion === QUESTIONS.length - 1 ? 'Завершить' : 'Далее';
}

function selectOption(i) {
  if (answeredCurrent) return;
  answers[currentQuestion] = i;
  renderQuestion();

  if (currentQuestion === QUESTIONS.length - 1) {
    stopTimer();
  }
}

btnNext.addEventListener('click', () => {
  if (answers[currentQuestion] === null) return;

  if (currentQuestion < QUESTIONS.length - 1) {
    currentQuestion++;
    renderQuestion();
  } else {
    stopTimer();
    finishSurvey();
  }
});

// ============================================
// ЗАВЕРШЕНИЕ
// ============================================
function finishSurvey() {
  stopTimer();

  correctCount = 0;
  QUESTIONS.forEach((q, i) => {
    if (answers[i] === q.correct) correctCount++;
  });

  progressFill.style.width = '100%';

  stepSurvey.style.display = 'none';
  stepSurveyResult.style.display = 'block';

  surveyScore.textContent = correctCount + '/' + QUESTIONS.length;
  surveyScoreLabel.textContent = 'правильных ответов';

  const passed = correctCount >= PASS_SCORE;

  if (passed) {
    hideCloseButton();

    surveyResultBlock.classList.remove('failed');
    surveyResultTitle.textContent = 'Отлично!';
    surveyResultText.textContent = 'Ты настоящий фанат Cubic Battle 4. Куб твой.';
    surveyResultBtn.textContent = 'Получить куба';
    surveyResultBtn.onclick = showSuccess;
  } else {
    showCloseButton();

    surveyResultBlock.classList.add('failed');
    surveyResultTitle.textContent = 'Почти получилось';
    surveyResultText.textContent = 'Нужно минимум 6 из ' + QUESTIONS.length + ' правильных. Попробуй ещё раз.';
    surveyResultBtn.textContent = 'Пройти заново';
    surveyResultBtn.onclick = restartSurvey;
  }
}

function restartSurvey() {
  hideCloseButton();
  resetSurveyState();
  stepSurveyResult.style.display = 'none';
  stepTimeout.style.display = 'none';
  stepTimeout.classList.remove('show');
  stepSuccess.classList.remove('show');
  stepSurvey.style.display = 'block';
  renderQuestion();
  startTimer();
}

function showSuccess() {
  stopTimer();
  hideCloseButton();
  stepSurveyResult.style.display = 'none';
  stepSuccess.classList.add('show');
  nickShown.textContent = currentNick;
}

// ============================================
// МОДАЛКА
// ============================================
function openModal() {
  hideCloseButton();
  resetSurveyState();
  stopTimer();

  stepForm.style.display = 'block';
  stepSurvey.style.display = 'none';
  stepTimeout.style.display = 'none';
  stepTimeout.classList.remove('show');
  stepSurveyResult.style.display = 'none';
  stepSuccess.classList.remove('show');

  nickInput.value = '';
  nickError.classList.remove('show');
  currentNick = '';

  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
  setTimeout(() => nickInput.focus(), 150);
}

function closeModal() {
  stopTimer();
  resetSurveyState();
  hideCloseButton();
  modal.classList.remove('show');
  document.body.style.overflow = '';
}

// ============================================
// КНОПКИ ОТКРЫТИЯ / ЗАКРЫТИЯ
// ============================================
btnOpenEvent.addEventListener('click', openModal);
modalClose.addEventListener('click', closeModal);
btnCloseSuccess.addEventListener('click', closeModal);

// ============================================
// КНОПКА ПРОДОЛЖИТЬ → ОПРОС
// ============================================
btnStart.addEventListener('click', function() {
  const nick = nickInput.value.trim();

  if (!nick) {
    nickError.classList.add('show');
    nickInput.focus();
    return;
  }

  nickError.classList.remove('show');
  currentNick = nick;

  hideCloseButton();

  stepForm.style.display = 'none';
  stepSurvey.style.display = 'block';
  stepTimeout.style.display = 'none';
  stepTimeout.classList.remove('show');
  stepSurveyResult.style.display = 'none';
  stepSuccess.classList.remove('show');

  resetSurveyState();
  renderQuestion();
  startTimer();
});

btnTimeoutRetry.addEventListener('click', function() {
  restartSurvey();
});

nickInput.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    btnStart.click();
  }
});

// ============================================
// СБРОС ПРИ УХОДЕ СО ВКЛАДКИ
// ============================================
document.addEventListener('visibilitychange', function() {
  if (document.hidden) {
    if (modal.classList.contains('show') && stepSurvey.style.display === 'block') {
      stopTimer();
      resetSurveyState();
      hideCloseButton();
      modal.classList.remove('show');
      document.body.style.overflow = '';

      stepForm.style.display = 'block';
      stepSurvey.style.display = 'none';
      stepTimeout.style.display = 'none';
      stepTimeout.classList.remove('show');
      stepSurveyResult.style.display = 'none';
      stepSuccess.classList.remove('show');
      nickInput.value = '';
      currentNick = '';
    }
  }
});

window.addEventListener('blur', function() {
  if (modal.classList.contains('show') && stepSurvey.style.display === 'block') {
    stopTimer();
  }
});

window.addEventListener('focus', function() {
  if (modal.classList.contains('show') && stepSurvey.style.display === 'block') {
    stopTimer();
    resetSurveyState();
    hideCloseButton();
    modal.classList.remove('show');
    document.body.style.overflow = '';

    stepForm.style.display = 'block';
    stepSurvey.style.display = 'none';
    stepTimeout.style.display = 'none';
    stepTimeout.classList.remove('show');
    stepSurveyResult.style.display = 'none';
    stepSuccess.classList.remove('show');
    nickInput.value = '';
    currentNick = '';
  }
});
