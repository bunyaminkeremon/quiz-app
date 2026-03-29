const API_URL = 'https://opentdb.com/api.php';

const $ = id => document.getElementById(id);

const startScreen = $('startScreen');
const quizScreen = $('quizScreen');
const resultScreen = $('resultScreen');

let questions = [];
let current = 0;
let score = 0;
let timer = null;
let timeLeft = 30;

function showScreen(screen) {
    startScreen.classList.add('hidden');
    quizScreen.classList.add('hidden');
    resultScreen.classList.add('hidden');
    screen.classList.remove('hidden');
}

function decodeHTML(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent;
}

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

async function startQuiz() {
    const category = $('categorySelect').value;
    const difficulty = $('difficultySelect').value;

    $('startBtn').textContent = 'Loading...';
    $('startBtn').disabled = true;

    try {
        const res = await fetch(`${API_URL}?amount=10&category=${category}&difficulty=${difficulty}&type=multiple`);
        const data = await res.json();

        if (data.results.length === 0) {
            alert('No questions available for this selection. Try another category or difficulty.');
            $('startBtn').textContent = 'Start Quiz';
            $('startBtn').disabled = false;
            return;
        }

        questions = data.results;
        current = 0;
        score = 0;
        $('scoreDisplay').textContent = 'Score: 0';

        showScreen(quizScreen);
        loadQuestion();
    } catch (err) {
        alert('Could not load questions. Check your connection.');
        $('startBtn').textContent = 'Start Quiz';
        $('startBtn').disabled = false;
    }
}

function loadQuestion() {
    clearInterval(timer);
    timeLeft = 30;

    const q = questions[current];
    const questionText = decodeHTML(q.question);
    const correct = decodeHTML(q.correct_answer);
    const answers = shuffle([
        correct,
        ...q.incorrect_answers.map(a => decodeHTML(a))
    ]);

    $('questionCount').textContent = (current + 1) + ' / 10';
    $('progress').style.width = ((current + 1) / 10 * 100) + '%';
    $('question').textContent = questionText;
    $('timer').textContent = timeLeft;
    $('timer').classList.remove('warning');

    const optionsDiv = $('options');
    optionsDiv.innerHTML = '';

    answers.forEach(answer => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = answer;
        btn.onclick = () => selectAnswer(btn, answer, correct);
        optionsDiv.appendChild(btn);
    });

    timer = setInterval(() => {
        timeLeft--;
        $('timer').textContent = timeLeft;
        if (timeLeft <= 10) $('timer').classList.add('warning');
        if (timeLeft <= 0) {
            clearInterval(timer);
            timeUp(correct);
        }
    }, 1000);
}

function selectAnswer(btn, selected, correct) {
    clearInterval(timer);
    const buttons = document.querySelectorAll('.option-btn');
    buttons.forEach(b => b.classList.add('disabled'));

    if (selected === correct) {
        btn.classList.add('correct');
        score++;
        $('scoreDisplay').textContent = 'Score: ' + score;
    } else {
        btn.classList.add('wrong');
        buttons.forEach(b => {
            if (b.textContent === correct) b.classList.add('correct');
        });
    }

    setTimeout(nextQuestion, 1200);
}

function timeUp(correct) {
    const buttons = document.querySelectorAll('.option-btn');
    buttons.forEach(b => {
        b.classList.add('disabled');
        if (b.textContent === correct) b.classList.add('correct');
    });

    setTimeout(nextQuestion, 1200);
}

function nextQuestion() {
    current++;
    if (current >= questions.length) {
        showResults();
    } else {
        loadQuestion();
    }
}

function showResults() {
    showScreen(resultScreen);

    const percentage = score / 10;
    let title, circleClass;

    if (percentage >= 0.8) {
        title = 'Great job!';
        circleClass = 'great';
    } else if (percentage >= 0.5) {
        title = 'Not bad!';
        circleClass = 'ok';
    } else {
        title = 'Keep practicing!';
        circleClass = 'bad';
    }

    $('resultTitle').textContent = title;
    $('finalScore').textContent = score;
    $('scoreCircle').className = 'score-circle ' + circleClass;
    $('resultStats').innerHTML = `
        <div>Correct: <span>${score}</span></div>
        <div>Wrong: <span>${10 - score}</span></div>
        <div>Category: <span>${$('categorySelect').options[$('categorySelect').selectedIndex].text}</span></div>
    `;
}

$('startBtn').addEventListener('click', startQuiz);

$('retryBtn').addEventListener('click', () => {
    $('startBtn').textContent = 'Start Quiz';
    $('startBtn').disabled = false;
    startQuiz();
});

$('homeBtn').addEventListener('click', () => {
    $('startBtn').textContent = 'Start Quiz';
    $('startBtn').disabled = false;
    showScreen(startScreen);
});
