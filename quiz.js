/**
 * KGK Education - Professional Quiz Engine
 * Features: CSV Loading, Negative Marking, Timer, Solution Box
 */

// --- 1. State Management ---
let questions = [];
let currentIdx = 0;
let score = 0;
let timeLeft = 60; // हर सवाल के लिए 60 सेकंड
let timerInterval;
const NEGATIVE_MARK = 0.25;

// Selectors
const homeView = document.getElementById("home-view");
const quizView = document.getElementById("quiz-view");
const authModal = document.getElementById("authModal");
const openAuth = document.getElementById("open-auth");

// --- 2. Auth & UI Initial Load ---
window.onload = function() {
    if (localStorage.getItem("isLoggedIn") === "true") {
        if(openAuth) openAuth.innerText = "लॉगआउट";
    }
};

function checkLogout() {
    if (localStorage.getItem("isLoggedIn") === "true") {
        if (confirm("क्या आप लॉगआउट करना चाहते हैं?")) {
            localStorage.removeItem("isLoggedIn");
            location.reload();
        }
    } else {
        // अगर modal खाली है, तो यहाँ alert या redirect दिखाएँ
        alert("कृपया लॉगिन करें!");
        if(authModal) authModal.style.display = "flex";
    }
}

// --- 3. Quiz Engine (CSV Loader) ---
async function loadQuiz(url) {
    // लॉगिन चेक
    if (localStorage.getItem("isLoggedIn") !== "true") {
        alert("क्विज़ शुरू करने के लिए कृपया लॉगिन करें!");
        return;
    }

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("File not found");
        
        const text = await res.text();
        const rows = text.split('\n').slice(1); // Header छोड़कर
        
        questions = rows.map(r => {
            const c = r.split(',');
            if(c.length < 6) return null;
            return { 
                q: c[0].trim(), 
                opts: [c[1].trim(), c[2].trim(), c[3].trim(), c[4].trim()], 
                a: parseInt(c[5].trim()), 
                exp: c[6] ? c[6].trim() : "समाधान उपलब्ध नहीं है।" 
            };
        }).filter(q => q !== null);

        if(questions.length > 0) {
            startQuiz();
        } else {
            alert("इस विषय में अभी सवाल उपलब्ध नहीं हैं।");
        }
    } catch (e) { 
        console.error("Load Error:", e);
        alert("डेटा लोड करने में समस्या हुई। कृपया इंटरनेट चेक करें।");
    }
}

function startQuiz() {
    homeView.style.display = "none";
    quizView.style.display = "block";
    currentIdx = 0; 
    score = 0;
    showQuestion();
}

// --- 4. Question Display & Logic ---
function showQuestion() {
    clearInterval(timerInterval);
    const q = questions[currentIdx];
    
    // UI Elements
    const qCounter = document.getElementById('q-counter');
    const qText = document.getElementById('q-text');
    const box = document.getElementById('options-box');
    const solutionBox = document.getElementById('solution-box');

    // Reset UI
    solutionBox.style.display = "none";
    qCounter.innerText = `सवाल ${currentIdx + 1} / ${questions.length}`;
    qText.innerText = q.q;
    box.innerHTML = "";
    
    startTimer();

    q.opts.forEach((opt, i) => {
        const b = document.createElement('button');
        b.innerText = opt;
        b.className = "option-btn";
        b.onclick = () => handleAnswer(i, b);
        box.appendChild(b);
    });
}

function handleAnswer(selectedIndex, btn) {
    clearInterval(timerInterval);
    const q = questions[currentIdx];
    const box = document.getElementById('options-box');
    const solutionBox = document.getElementById('solution-box');
    const solText = document.getElementById('solution-text');
    const allBtns = document.querySelectorAll('.option-btn');
    
    // सभी बटन्स डिसेबल करें
    allBtns.forEach(b => b.disabled = true);

    // सही/गलत लॉजिक
    if(selectedIndex === q.a) {
        if(btn) btn.classList.add('correct');
        score += 1;
    } else if (selectedIndex !== -1) {
        if(btn) btn.classList.add('wrong');
        allBtns[q.a].classList.add('correct'); // सही उत्तर को हाईलाइट करें
        score -= NEGATIVE_MARK;
    } else {
        // समय खत्म होने पर
        allBtns[q.a].classList.add('correct');
    }

    // समाधान दिखाएं
    solText.innerText = q.exp;
    solutionBox.style.display = "block";
}

function nextQuestion() {
    currentIdx++;
    if(currentIdx < questions.length) {
        showQuestion();
    } else {
        finishQuiz();
    }
}

// --- 5. Timer & Completion ---
function startTimer() {
    timeLeft = 60;
    const timerDisplay = document.getElementById('timer');
    timerDisplay.innerText = `समय: 00:${timeLeft < 10 ? '0'+timeLeft : timeLeft}`;

    timerInterval = setInterval(() => {
        timeLeft--;
        timerDisplay.innerText = `समय: 00:${timeLeft < 10 ? '0'+timeLeft : timeLeft}`;
        
        if(timeLeft <= 0) { 
            clearInterval(timerInterval); 
            handleAnswer(-1, null); // समय समाप्त
        }
    }, 1000);
}

function finishQuiz() {
    const finalScore = score.toFixed(2);
    alert(`🎉 टेस्ट समाप्त!\nआपका कुल स्कोर: ${finalScore} / ${questions.length}`);
    location.reload(); // होम पर वापस जाने के लिए
}
