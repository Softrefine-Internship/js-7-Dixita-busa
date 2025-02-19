let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let userAnswers = [];
let quizTimer;
let startTime;
let quizDuration = 0;
let categories = [];

const screens = {
    options: document.getElementById('quiz-options'),
    questions: document.getElementById('quiz-questions'),
    results: document.getElementById('quiz-results')
};

const elements = {
    // Options //
    categorySelect: document.getElementById('category'),
    numQuestionsInput: document.getElementById('num-questions'),
    difficultySelect: document.getElementById('difficulty'),
    typeSelect: document.getElementById('type'),
    startQuizBtn: document.getElementById('start-quiz'),
    
    // Questions //
    questionCounter: document.getElementById('question-counter'),
    scoreDisplay: document.getElementById('score-display'),
    timerDisplay: document.getElementById('timer-display'),
    questionText: document.getElementById('question-text'),
    optionsContainer: document.getElementById('options-container'),
    feedbackContainer: document.getElementById('feedback-container'),
    nextQuestionBtn: document.getElementById('next-question'),
    quitQuizBtn: document.getElementById('quit-quiz'),
    
    // Results //
    finalScore: document.getElementById('final-score'),
    totalQuestions: document.getElementById('total-questions'),
    correctAnswers: document.getElementById('correct-answers'),
    incorrectAnswers: document.getElementById('incorrect-answers'),
    accuracy: document.getElementById('accuracy'),
    timeTaken: document.getElementById('time-taken'),
    achievementBadge: document.getElementById('achievement-badge'),
    viewAnswersBtn: document.getElementById('view-answers'),
    newQuizBtn: document.getElementById('new-quiz'),
    answersReview: document.getElementById('answers-review'),
    
    // Loading and Error //
    loadingSpinner: document.getElementById('loading-spinner'),
    errorModal: document.getElementById('error-modal'),
    errorMessage: document.getElementById('error-message'),
    modalOkBtn: document.getElementById('modal-ok'),
    closeModalBtn: document.querySelector('.close-modal')
};

async function initApp() {
    elements.startQuizBtn.addEventListener('click', startQuiz);
    elements.nextQuestionBtn.addEventListener('click', loadNextQuestion);
    elements.quitQuizBtn.addEventListener('click', endQuiz);
    elements.newQuizBtn.addEventListener('click', resetQuiz);
    elements.viewAnswersBtn.addEventListener('click', toggleAnswersReview);
    elements.modalOkBtn.addEventListener('click', hideErrorModal);
    elements.closeModalBtn.addEventListener('click', hideErrorModal);
    
    try {
        const response = await fetch('https://opentdb.com/api_category.php');
        const data = await response.json();
        categories = data.trivia_categories;
        populateCategories();
    } catch (error) {
        showError('Failed to load categories. Please check your internet connection and refresh the page.');
    }
}

function populateCategories() {
    categories.forEach(category => {
        const option = document.createElement('option');
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
        showError('Please select between 1 and 50 questions.');
        return;
    }
    
    elements.loadingSpinner.style.display = 'flex';
    
    try {
        const url = constructApiUrl(numQuestions, category, difficulty, type);
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.response_code === 0 && data.results.length > 0) {
            questions = data.results.map(processQuestion);
            currentQuestionIndex = 0;
            score = 0;
            userAnswers = new Array(questions.length).fill(null);
            switchScreen('questions');
            
            startTime = new Date();
            startTimer();
            
            loadQuestion();
        } else {
            showError('Could not find enough questions with the selected criteria. Please try different options.');
        }
    } catch (error) {
        showError('Failed to load questions. Please check your internet connection and try again.');
    } finally {
        elements.loadingSpinner.style.display = 'none';
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
    const answers = [...questionData.incorrect_answers, questionData.correct_answer];
    
    return {
        question: decodeHTML(questionData.question),
        answers: shuffleArray(answers.map(answer => decodeHTML(answer))),
        correctAnswer: decodeHTML(questionData.correct_answer),
        category: decodeHTML(questionData.category),
        difficulty: questionData.difficulty
    };
}

function loadQuestion() {
    const currentQuestion = questions[currentQuestionIndex];
    
    elements.questionCounter.textContent = `Question ${currentQuestionIndex + 1}/${questions.length}`;   
    elements.scoreDisplay.textContent = `Score: ${score}`; 
    elements.questionText.textContent = currentQuestion.question;   
    elements.optionsContainer.innerHTML = '';
    
    currentQuestion.answers.forEach((answer, index) => {
        const optionElement = document.createElement('div');
        optionElement.classList.add('option');
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
    userAnswers[currentQuestionIndex] = {
        question: currentQuestion.question,
        userAnswer: answer,
        correctAnswer: currentQuestion.correctAnswer,
        isCorrect: isCorrect
    };
    
    const options = elements.optionsContainer.querySelectorAll('.option'); 
    options.forEach(option => {
        const optionAnswer = option.dataset.answer;
        
        if (optionAnswer === currentQuestion.correctAnswer) {
            option.classList.add('correct');
        } else if (option === optionElement) {
            option.classList.add('wrong');
        }
        
        option.classList.add('disabled');
    });
    
    if (isCorrect) {
        score++;
        elements.scoreDisplay.textContent = `Score: ${score}`;
        elements.feedbackContainer.classList.add('correct');
        elements.feedbackContainer.textContent = '✓ Correct! Well done!';
    } else {
        elements.feedbackContainer.classList.add('wrong');
        elements.feedbackContainer.textContent = `✗ Incorrect. The correct answer is: ${currentQuestion.correctAnswer}`;
    }
    
    elements.nextQuestionBtn.disabled = false;
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
    const totalQuestions = questions.length;
    const correctCount = userAnswers.filter(answer => answer && answer.isCorrect).length;
    const incorrectCount = userAnswers.filter(answer => answer && !answer.isCorrect).length;
    const unansweredCount = userAnswers.filter(answer => answer === null).length;
    const accuracyValue = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
    
    elements.finalScore.textContent = score;
    elements.totalQuestions.textContent = `/${totalQuestions}`;
    elements.correctAnswers.textContent = correctCount;
    elements.incorrectAnswers.textContent = incorrectCount + unansweredCount;
    elements.accuracy.textContent = `${accuracyValue.toFixed(1)}%`;
    elements.timeTaken.textContent = formatTime(quizDuration);
    
    setAchievementBadge(accuracyValue);
    
    prepareAnswersReview();
    
    switchScreen('results');
}

function setAchievementBadge(accuracy) {
    let icon, title;
    
    if (accuracy >= 90) {
        icon = 'trophy';
        title = 'Expert';
    } else if (accuracy >= 70) {
        icon = 'star';
        title = 'Great';
    } else if (accuracy >= 50) {
        icon = 'thumbs-up';
        title = 'Good';
    } else {
        icon = 'book';
        title = 'Try Again';
    }
    
    elements.achievementBadge.innerHTML = `<i class="fas fa-${icon}" title="${title}"></i>`;
}

function prepareAnswersReview() {
    if (!elements.answersReview) return; 
    elements.answersReview.innerHTML = '';

    userAnswers.forEach((answer, index) => {
        if (!answer || !answer.question) return;

        const reviewItem = document.createElement('div');
        reviewItem.classList.add('review-item');

        const questionNumber = document.createElement('h4');
        questionNumber.textContent = `Question ${index + 1}`;

        const questionText = document.createElement('p');
        questionText.textContent = answer.question;

        const userAnswerElement = document.createElement('p');
        userAnswerElement.innerHTML = `Your answer: <span class="${answer.isCorrect ? 'review-correct' : 'review-wrong'}">${answer.userAnswer || 'No answer'}</span>`;

        reviewItem.appendChild(questionNumber);
        reviewItem.appendChild(questionText);
        reviewItem.appendChild(userAnswerElement);

        elements.answersReview.appendChild(reviewItem); 
    });
}