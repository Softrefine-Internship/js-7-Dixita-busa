let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let userAnswers = [];
let quizTimer;
let startTime;
let quizDuration = 0;
let categories = [];

const categoryIcons = {
  "General Knowledge": "fas fa-globe",
  "Entertainment: Books": "fas fa-book",
  "Entertainment: Film": "fas fa-film",
  "Entertainment: Music": "fas fa-music",
  "Entertainment: Musicals & Theatres": "fas fa-theater-masks",
  "Entertainment: Television": "fas fa-tv",
  "Entertainment: Video Games": "fas fa-gamepad",
  "Entertainment: Board Games": "fas fa-chess",
  "Science & Nature": "fas fa-microscope",
  "Science: Computers": "fas fa-laptop-code",
  "Science: Mathematics": "fas fa-calculator",
  Mythology: "fas fa-dragon",
  Sports: "fas fa-futbol",
  Geography: "fas fa-mountain",
  History: "fas fa-landmark",
  Politics: "fas fa-vote-yea",
  Art: "fas fa-palette",
  Celebrities: "fas fa-star",
  Animals: "fas fa-paw",
  Vehicles: "fas fa-car",
  "Entertainment: Comics": "fas fa-book-open",
  "Science: Gadgets": "fas fa-mobile-alt",
  "Entertainment: Japanese Anime & Manga": "fas fa-robot",
  "Entertainment: Cartoon & Animations": "fas fa-child",
};

const defaultCategoryIcon = "fas fa-question-circle";
const difficultyPoints = {
  easy: 1,
  medium: 1,
  hard: 1,
};
const screens = {
  options: document.getElementById("quiz-options"),
  questions: document.getElementById("quiz-questions"),
  results: document.getElementById("quiz-results"),
};

const elements = {
  // Options //
  categorySelect: document.getElementById("category"),
  numQuestionsInput: document.getElementById("num-questions"),
  difficultySelect: document.getElementById("difficulty"),
  typeSelect: document.getElementById("type"),
  startQuizBtn: document.getElementById("start-quiz"),

  // Questions //
  questionCounter: document.getElementById("question-counter"),
  scoreDisplay: document.getElementById("score-display"),
  timerDisplay: document.getElementById("timer-display"),
  questionText: document.getElementById("question-text"),
  optionsContainer: document.getElementById("options-container"),
  feedbackContainer: document.getElementById("feedback-container"),
  nextQuestionBtn: document.getElementById("next-question"),
  quitQuizBtn: document.getElementById("quit-quiz"),

  // Results //
  finalScore: document.getElementById("final-score"),
  totalQuestions: document.getElementById("total-questions"),
  correctAnswers: document.getElementById("correct-answers"),
  incorrectAnswers: document.getElementById("incorrect-answers"),
  accuracy: document.getElementById("accuracy"),
  timeTaken: document.getElementById("time-taken"),
  achievementBadge: document.getElementById("achievement-badge"),
  viewAnswersBtn: document.getElementById("view-answers"),
  newQuizBtn: document.getElementById("new-quiz"),
  answersReview: document.getElementById("answers-review"),

  // Loading and Error //
  loadingSpinner: document.getElementById("loading-spinner"),
  errorModal: document.getElementById("error-modal"),
  errorMessage: document.getElementById("error-message"),
  modalOkBtn: document.getElementById("modal-ok"),
  closeModalBtn: document.querySelector(".close-modal"),
};
document.addEventListener("DOMContentLoaded", initApp);

async function initApp() {
  elements.startQuizBtn.addEventListener("click", startQuiz);
  elements.nextQuestionBtn.addEventListener("click", loadNextQuestion);
  elements.quitQuizBtn.addEventListener("click", endQuiz);
  elements.newQuizBtn.addEventListener("click", resetQuiz);
  elements.viewAnswersBtn.addEventListener("click", toggleAnswersReview);
  elements.modalOkBtn.addEventListener("click", hideErrorModal);
  elements.closeModalBtn.addEventListener("click", hideErrorModal);

  try {
    const response = await fetch("https://opentdb.com/api_category.php");
    const data = await response.json();
    categories = data.trivia_categories;
    populateCategories();
  } catch (error) {
    showError(
      "Failed to load categories. Please check your internet connection and refresh the page."
    );
  }
}

function populateCategories() {
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = category.name;
    elements.categorySelect.appendChild(option);
  });
}

async function startQuiz() {
  const numQuestions = elements.numQuestionsInput.value;
  const category = elements.categorySelect.value;
  const difficulty = elements.difficultySelect.value;
  const type = elements.typeSelect.value;

  if (numQuestions < 1 || numQuestions > 50) {
    showError("Please select between 1 and 50 questions.");
    return;
  }

  elements.loadingSpinner.style.display = "flex";

  try {
    const url = constructApiUrl(numQuestions, category, difficulty, type);
    const response = await fetch(url);
    const data = await response.json();

    if (data.response_code === 0 && data.results.length > 0) {
      questions = data.results.map(processQuestion);
      currentQuestionIndex = 0;
      score = 0;
      userAnswers = new Array(questions.length).fill(null);
      switchScreen("questions");
      startTime = new Date();
      startTimer();
      loadQuestion();
    } else {
      showError(
        "Could not find enough questions with the selected criteria. Please try different options."
      );
    }
  } catch (error) {
    showError(
      "Failed to load questions. Please check your internet connection and try again."
    );
  } finally {
    elements.loadingSpinner.style.display = "none";
  }
}

function constructApiUrl(numQuestions, category, difficulty, type) {
  let url = `https://opentdb.com/api.php?amount=${numQuestions}`;

  if (category) url += `&category=${category}`;
  if (difficulty) url += `&difficulty=${difficulty}`;
  if (type) url += `&type=${type}`;

  return url;
}

function processQuestion(questionData) {
  const answers = [
    ...questionData.incorrect_answers,
    questionData.correct_answer,
  ];
  return {
    question: decodeHTML(questionData.question),
    answers: shuffleArray(answers.map((answer) => decodeHTML(answer))),
    correctAnswer: decodeHTML(questionData.correct_answer),
    category: decodeHTML(questionData.category),
    difficulty: questionData.difficulty,
  };
}

function loadQuestion() {
  const currentQuestion = questions[currentQuestionIndex];
  elements.questionCounter.textContent = `Question ${currentQuestionIndex + 1}/${questions.length}`;
  elements.scoreDisplay.textContent = `Score: ${score}`;
  
  const categoryIcon = categoryIcons[currentQuestion.category] || defaultCategoryIcon;
  const difficultyClass = `difficulty-${currentQuestion.difficulty}`;

  elements.questionText.innerHTML = `
    <div class="question-category">
      <i class="${categoryIcon} category-icon"></i>
      ${currentQuestion.category}
      <span class="difficulty-badge ${difficultyClass}">
        ${capitalizeFirstLetter(currentQuestion.difficulty)}
      </span>
    </div>
    ${currentQuestion.question}
  `;

  elements.optionsContainer.className = 'quiz-options-container';  
  elements.optionsContainer.innerHTML = '';

  currentQuestion.answers.forEach((answer, index) => {
    const optionElement = document.createElement('div');
    optionElement.classList.add('quiz-option');  // Updated class name
    optionElement.textContent = answer;
    optionElement.dataset.answer = answer;
    optionElement.addEventListener('click', () => selectOption(optionElement, answer));
    elements.optionsContainer.appendChild(optionElement);
  });

  elements.feedbackContainer.innerHTML = '';
  elements.feedbackContainer.className = 'feedback-container';
  elements.nextQuestionBtn.disabled = true;
}

function selectOption(optionElement, answer) {
  const currentQuestion = questions[currentQuestionIndex];
  const isCorrect = answer === currentQuestion.correctAnswer;

  if (elements.nextQuestionBtn.disabled === false) return;
  if (isCorrect) {
    score += difficultyPoints[currentQuestion.difficulty];
    elements.scoreDisplay.textContent = `Score: ${score}`;
  }

  userAnswers[currentQuestionIndex] = {
    question: currentQuestion.question,
    userAnswer: answer,
    correctAnswer: currentQuestion.correctAnswer,
    isCorrect: isCorrect,
    category: currentQuestion.category,
    difficulty: currentQuestion.difficulty,
  };

  Array.from(elements.optionsContainer.children).forEach((option) => {
    const optionAnswer = option.dataset.answer;
    option.classList.add('disabled');

    if (optionAnswer === currentQuestion.correctAnswer) {
      option.classList.add('correct');
    } else if (option === optionElement && !isCorrect) {
      option.classList.add('wrong');
    }
  });

  elements.feedbackContainer.innerHTML = isCorrect
    ? `<i class="fas fa-check-circle"></i> Correct!`
    : `<i class="fas fa-times-circle"></i> Incorrect. The correct answer is: ${currentQuestion.correctAnswer}`;

  elements.feedbackContainer.classList.add(isCorrect ? 'correct' : 'wrong');
  elements.nextQuestionBtn.disabled = false;
}

function showPointsAnimation(element, points) {
  const rect = element.getBoundingClientRect();
  const pointsIndicator = document.createElement("div");
  pointsIndicator.classList.add("points-indicator");
  pointsIndicator.textContent = `+${points}`;
  pointsIndicator.style.left = `${rect.left + rect.width / 2}px`;
  pointsIndicator.style.top = `${rect.top}px`;

  document.body.appendChild(pointsIndicator);

  setTimeout(() => {
    document.body.removeChild(pointsIndicator);
  }, 1500);
}

function loadNextQuestion() {
  currentQuestionIndex++;

  if (currentQuestionIndex < questions.length) {
    loadQuestion();
  } else {
    endQuiz();
  }
}

function endQuiz() {
  clearInterval(quizTimer);
  quizDuration = Math.floor((new Date() - startTime) / 1000);

  console.log("Quiz ended. User answers:", userAnswers);

  const correctCount = userAnswers.filter(
    (answer) => answer && answer.isCorrect
  ).length;
  const incorrectCount = userAnswers.filter(
    (answer) => answer && !answer.isCorrect
  ).length;
  const accuracyPercentage =
    questions.length > 0
      ? Math.round((correctCount / questions.length) * 100)
      : 0;

  elements.finalScore.textContent = score;
  elements.totalQuestions.textContent = `/${questions.length}`;
  elements.correctAnswers.textContent = correctCount;
  elements.incorrectAnswers.textContent = incorrectCount;
  elements.accuracy.textContent = `${accuracyPercentage}%`;
  elements.timeTaken.textContent = formatTime(quizDuration);
  setAchievementBadge(accuracyPercentage);

  elements.answersReview.style.display = "none";
  elements.viewAnswersBtn.innerHTML =
    '<i class="fas fa-search"></i> Review Answers';

  switchScreen("results");
}

function setAchievementBadge(accuracy) {
  let badgeIcon, badgeTitle;

  if (accuracy >= 90) {
    badgeIcon = "fas fa-trophy";
    badgeTitle = "Master";
  } else if (accuracy >= 70) {
    badgeIcon = "fas fa-medal";
    badgeTitle = "Expert";
  } else if (accuracy >= 50) {
    badgeIcon = "fas fa-award";
    badgeTitle = "Achiever";
  } else {
    badgeIcon = "fas fa-star";
    badgeTitle = "Participant";
  }

  elements.achievementBadge.innerHTML = `<i class="${badgeIcon}" title="${badgeTitle}"></i>`;
  elements.achievementBadge.setAttribute("data-title", badgeTitle);
}

function resetQuiz() {
  questions = [];
  currentQuestionIndex = 0;
  score = 0;
  userAnswers = [];

  clearInterval(quizTimer);

  elements.answersReview.style.display = "none";
  elements.answersReview.innerHTML = "";

  switchScreen("options");
}

function toggleAnswersReview() {
  if (
    elements.answersReview.style.display === "none" ||
    elements.answersReview.style.display === ""
  ) {
    generateAnswersReview();
    elements.answersReview.style.display = "block";
    elements.viewAnswersBtn.innerHTML =
      '<i class="fas fa-eye-slash"></i> Hide Review';
  } else {
    elements.answersReview.style.display = "none";
    elements.viewAnswersBtn.innerHTML =
      '<i class="fas fa-search"></i> Review Answers';
  }
}

function generateAnswersReview() {
  elements.answersReview.innerHTML = "";

  if (!userAnswers || userAnswers.length === 0) {
    elements.answersReview.innerHTML = "<p>No answers to review.</p>";
    return;
  }

  userAnswers.forEach((answer, index) => {
    if (!answer) return;

    const reviewItem = document.createElement("div");
    reviewItem.classList.add("review-item");

    const categoryIcon =
      categoryIcons[answer.category] || "fas fa-question-circle";
    const difficultyClass = `difficulty-${answer.difficulty}`;

    reviewItem.innerHTML = `
            <div class="question-category">
                <i class="${categoryIcon} category-icon"></i>
                ${answer.category}
                <span class="difficulty-badge ${difficultyClass}">
                    ${capitalizeFirstLetter(answer.difficulty)}
                </span>
            </div>
            <h4 class="review-question">${index + 1}. ${answer.question}</h4>
            <div class="review-answer ${
              answer.isCorrect ? "review-correct" : "review-wrong"
            }">
                <span>Your answer: ${answer.userAnswer}</span>
                <i class="fas fa-${answer.isCorrect ? "check" : "times"}"></i>
            </div>
            ${
              !answer.isCorrect
                ? `<div class="review-correct-answer">
                    Correct answer: ${answer.correctAnswer}
                </div>`
                : ""
            }
        `;

    elements.answersReview.appendChild(reviewItem);
  });
}

function startTimer() {
  let seconds = 0;
  quizTimer = setInterval(() => {
    seconds++;
    elements.timerDisplay.textContent = formatTime(seconds);
  }, 1000);
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

function switchScreen(screenName) {
  Object.values(screens).forEach((screen) => {
    screen.classList.remove("active");
  });
  screens[screenName].classList.add("active");
}

function showError(message) {
  elements.errorMessage.textContent = message;
  elements.errorModal.style.display = "flex";
}

function hideErrorModal() {
  elements.errorModal.style.display = "none";
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function decodeHTML(html) {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function createCustomDropdown() {
  const selects = document.querySelectorAll("select");

  selects.forEach((select) => {
    const customDropdown = document.createElement("div");
    customDropdown.className = "custom-dropdown";

    const selectedOption = document.createElement("div");
    selectedOption.className = "selected-option";
    selectedOption.innerHTML = `
      <span>${select.options[select.selectedIndex].text}</span>
      <i class="fas fa-chevron-down"></i>
    `;

    const optionsContainer = document.createElement("div");
    optionsContainer.className = "dropdown-options-container";

    Array.from(select.options).forEach((option) => {
      const customOption = document.createElement("div");
      customOption.className = "option";
      customOption.dataset.value = option.value;
      customOption.textContent = option.text;

      customOption.addEventListener("click", () => {
        select.value = option.value;
        const event = new Event("change");
        select.dispatchEvent(event);
        selectedOption.querySelector("span").textContent = option.text;
        optionsContainer.classList.remove("show");
      });

      optionsContainer.appendChild(customOption);
    });

    selectedOption.addEventListener("click", () => {
      optionsContainer.classList.toggle("show");
    });

    document.addEventListener("click", (e) => {
      if (!customDropdown.contains(e.target)) {
        optionsContainer.classList.remove("show");
      }
    });

    customDropdown.appendChild(selectedOption);
    customDropdown.appendChild(optionsContainer);
    select.style.display = "none";
    select.parentNode.insertBefore(customDropdown, select.nextSibling);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initApp();
  createCustomDropdown();
});

function formatCategories() {
  return [
    { id: 9, name: "General Knowledge" },
    { id: 10, name: "Entertainment: Books" },
    { id: 11, name: "Entertainment: Film" },
    { id: 12, name: "Entertainment: Music" },
    { id: 13, name: "Entertainment: Musicals & Theatres" },
    { id: 14, name: "Entertainment: Television" },
    { id: 15, name: "Entertainment: Video Games" },
    { id: 16, name: "Entertainment: Board Games" },
    { id: 17, name: "Science & Nature" },
    { id: 18, name: "Science: Computers" },
    { id: 19, name: "Science: Mathematics" },
    { id: 20, name: "Mythology" },
    { id: 21, name: "Sports" },
    { id: 22, name: "Geography" },
    { id: 23, name: "History" },
    { id: 24, name: "Politics" },
    { id: 25, name: "Art" },
    { id: 26, name: "Celebrities" },
    { id: 27, name: "Animals" },
    { id: 28, name: "Vehicles" },
    { id: 29, name: "Entertainment: Comics" },
    { id: 30, name: "Science: Gadgets" },
    { id: 31, name: "Entertainment: Japanese Anime & Manga" },
    { id: 32, name: "Entertainment: Cartoon & Animations" },
  ];
}

function createCustomDropdown() {
  const selects = document.querySelectorAll("select");

  selects.forEach((select) => {
    const customDropdown = document.createElement("div");
    customDropdown.className = "custom-dropdown";
    const selectedOption = document.createElement("div");
    selectedOption.className = "selected-option";
    selectedOption.innerHTML = `
      <span>${select.options[select.selectedIndex].text}</span>
      <i class="fas fa-chevron-down"></i>
    `;
    const optionsContainer = document.createElement("div");
    optionsContainer.className = "options-container";
    const addedValues = new Set();

    Array.from(select.options).forEach((option) => {
      if (addedValues.has(option.value)) {
        return;
      }
      addedValues.add(option.value);
      const customOption = document.createElement("div");
      customOption.className = "option";
      customOption.dataset.value = option.value;
      customOption.textContent = option.text;

      customOption.addEventListener("click", () => {
        select.value = option.value;
        const event = new Event("change");
        select.dispatchEvent(event);
        selectedOption.querySelector("span").textContent = option.text;
        optionsContainer.classList.remove("show");
      });

      optionsContainer.appendChild(customOption);
    });

    selectedOption.addEventListener("click", (e) => {
      e.stopPropagation();
      document
        .querySelectorAll(".options-container.show")
        .forEach((container) => {
          if (container !== optionsContainer) {
            container.classList.remove("show");
          }
        });

      optionsContainer.classList.toggle("show");
    });

    document.addEventListener("click", () => {
      optionsContainer.classList.remove("show");
    });

    customDropdown.appendChild(selectedOption);
    customDropdown.appendChild(optionsContainer);
    select.style.display = "none";
    const existingDropdown = select.nextElementSibling;
    if (
      existingDropdown &&
      existingDropdown.classList.contains("custom-dropdown")
    ) {
      existingDropdown.remove();
    }

    select.parentNode.insertBefore(customDropdown, select.nextSibling);
    select.addEventListener("change", () => {
      selectedOption.querySelector("span").textContent =
        select.options[select.selectedIndex].text;
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  elements.startQuizBtn.addEventListener("click", startQuiz);
  elements.nextQuestionBtn.addEventListener("click", loadNextQuestion);
  elements.quitQuizBtn.addEventListener("click", endQuiz);
  elements.newQuizBtn.addEventListener("click", resetQuiz);
  elements.viewAnswersBtn.addEventListener("click", toggleAnswersReview);
  elements.modalOkBtn.addEventListener("click", hideErrorModal);
  elements.closeModalBtn.addEventListener("click", hideErrorModal);

  try {
    categories = formatCategories();
    populateCategories();
    createCustomDropdown();
  } catch (error) {
    showError(
      "Failed to load categories. Please check your internet connection and refresh the page."
    );
  }
});

async function initApp() {
  elements.startQuizBtn.addEventListener("click", startQuiz);
  elements.nextQuestionBtn.addEventListener("click", loadNextQuestion);
  elements.quitQuizBtn.addEventListener("click", endQuiz);
  elements.newQuizBtn.addEventListener("click", resetQuiz);
  elements.viewAnswersBtn.addEventListener("click", toggleAnswersReview);
  elements.modalOkBtn.addEventListener("click", hideErrorModal);
  elements.closeModalBtn.addEventListener("click", hideErrorModal);

  try {
    categories = formatCategories();
    populateCategories();
  } catch (error) {
    showError(
      "Failed to load categories. Please check your internet connection and refresh the page."
    );
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initApp();

  setTimeout(() => {
    createCustomDropdown();
  }, 100);
});
