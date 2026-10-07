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
const captchaSection = document.getElementById('captcha-section');
const recaptchaWidget = document.getElementById('recaptcha-widget');
const captchaMessage = document.getElementById('captcha-message');

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
let recaptchaWidgetId = null;
let recaptchaLoadPromise = null;

function setCaptchaMessage(message, type = 'error') {
  captchaMessage.textContent = message;
  captchaMessage.classList.toggle('show', Boolean(message));
  captchaMessage.classList.toggle('info', type === 'info');
}

function loadRecaptchaApi() {
  if (window.grecaptcha && typeof window.grecaptcha.render === 'function') {
    return Promise.resolve(window.grecaptcha);
  }

  if (recaptchaLoadPromise) return recaptchaLoadPromise;

  recaptchaLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (!window.grecaptcha || typeof window.grecaptcha.render !== 'function') {
        reject(new Error('reCAPTCHA API did not initialize'));
        return;
      }
      resolve(window.grecaptcha);
    };
    script.onerror = () => reject(new Error('reCAPTCHA API failed to load'));
    document.head.appendChild(script);
  }).catch(error => {
    recaptchaLoadPromise = null;
    throw error;
  });

  return recaptchaLoadPromise;
}

async function renderRecaptchaWidget() {
  const api = await loadRecaptchaApi();

  // Render only after the modal and nickname form are visible.
  if (!modal.classList.contains('show') || stepForm.style.display === 'none' || captchaSection.style.display === 'none') return;
  if (recaptchaWidgetId !== null) return;

  const siteKey = recaptchaWidget.dataset.sitekey;
  if (!siteKey) throw new Error('reCAPTCHA site key is missing');

  recaptchaWidgetId = api.render(recaptchaWidget, {
    sitekey: siteKey,
    size: 'compact',
    tabindex: 0,
    callback: () => setCaptchaMessage(''),
    'expired-callback': () => setCaptchaMessage('Проверка reCAPTCHA истекла. Отметь её ещё раз.'),
    'error-callback': () => setCaptchaMessage('reCAPTCHA не загрузилась. Проверь соединение и попробуй ещё раз.'),
  });
}

function requestRecaptchaRender() {
  setCaptchaMessage('Загружаем reCAPTCHA…', 'info');
  renderRecaptchaWidget().then(() => {
    setCaptchaMessage('');
  }).catch(() => {
    setCaptchaMessage('Не удалось загрузить reCAPTCHA. Проверь соединение и попробуй ещё раз.');
  });
}

function resetRecaptchaWidget() {
  if (recaptchaWidgetId !== null && window.grecaptcha && typeof window.grecaptcha.reset === 'function') {
    window.grecaptcha.reset(recaptchaWidgetId);
  }
}

async function verifyRecaptchaToken(token) {
  const response = await fetch('/api/verify-recaptcha', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ token }),
  });

  const result = await response.json().catch(() => ({}));
  if (response.ok && result.verified === true) return;
  if (result.error === 'CAPTCHA_FAILED') throw new Error('captcha-failed');
  if (result.error === 'CAPTCHA_HOSTNAME_MISMATCH') throw new Error('hostname-mismatch');
  if (result.error === 'CAPTCHA_NOT_CONFIGURED') throw new Error('configuration-missing');
  throw new Error('verification-unavailable');
}

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

async function startSurveyAfterCaptcha() {
  if (btnStart.disabled) return;

  const nick = nickInput.value.trim();
  if (!nick) {
    nickError.classList.add('show');
    nickInput.focus();
    return;
  }

  nickError.classList.remove('show');

  if (recaptchaWidgetId === null) {
    requestRecaptchaRender();
    return;
  }

  if (!window.grecaptcha || typeof window.grecaptcha.getResponse !== 'function') {
    setCaptchaMessage('Проверка reCAPTCHA ещё загружается. Попробуй ещё раз через секунду.', 'info');
    return;
  }

  let token = '';
  try {
    token = window.grecaptcha.getResponse(recaptchaWidgetId);
  } catch (error) {
    setCaptchaMessage('Не удалось получить ответ reCAPTCHA. Обнови страницу и попробуй ещё раз.');
    return;
  }

  if (!token) {
    setCaptchaMessage('Подтверди reCAPTCHA, чтобы продолжить.');
    return;
  }

  const buttonText = btnStart.textContent;
  btnStart.disabled = true;
  btnStart.textContent = 'Проверка…';
  setCaptchaMessage('');

  try {
    await verifyRecaptchaToken(token);
    resetRecaptchaWidget();
    setCaptchaMessage('');
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
  } catch (error) {
    resetRecaptchaWidget();
    if (error.message === 'captcha-failed') {
      setCaptchaMessage('Проверка reCAPTCHA не пройдена. Отметь её и попробуй ещё раз.');
    } else if (error.message === 'hostname-mismatch') {
      setCaptchaMessage('Домен сайта не разрешён в настройках reCAPTCHA. Проверь список доменов ключа.');
    } else if (error.message === 'configuration-missing') {
      setCaptchaMessage('Серверная проверка reCAPTCHA не настроена. Обратись к администратору.');
    } else {
      setCaptchaMessage('Сервис проверки временно недоступен. Попробуй позже.');
    }
  } finally {
    btnStart.disabled = false;
    btnStart.textContent = buttonText;
  }
}

function restartSurvey() {
  hideCloseButton();
  resetSurveyState();
  setCaptchaMessage('');
  resetRecaptchaWidget();
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
  setCaptchaMessage('');
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
  setCaptchaMessage('');
  resetRecaptchaWidget();

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
  requestRecaptchaRender();
  setTimeout(() => nickInput.focus(), 150);
}

function closeModal() {
  stopTimer();
  resetSurveyState();
  hideCloseButton();
  setCaptchaMessage('');
  resetRecaptchaWidget();
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
btnStart.addEventListener('click', startSurveyAfterCaptcha);

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
