// --- 1. Variables & Selectors ---
const authModal = document.getElementById("authModal");
const mainContent = document.getElementById("main-content");
const openAuth = document.getElementById("open-auth");
let generatedOTP = null;

// EmailJS Config
const SERVICE_ID = 'service_mfwhnrm';
const TEMPLATE_ID = 'template_uupjne6';

// Quiz State
let questions = [];
let currentIdx = 0;
let score = 0;
let timeLeft = 60; 
let timerInterval;
const NEGATIVE_MARK = 0.25; 

// पेज लोड चेक
window.onload = function() {
    if (localStorage.getItem("isLoggedIn") === "true") {
        showHome();
    }
};

// --- 2. Authentication Logic ---

function showHome() {
    if(mainContent) mainContent.style.display = "block";
    if(authModal) authModal.style.display = "none";
    if(openAuth) openAuth.innerText = "लॉगआउट";
}

function handleLogin() {
    const email = document.getElementById("login-email").value;
    const pass = document.getElementById("login-pass").value;
    if (email.includes("@") && pass.length >= 4) {
        localStorage.setItem("isLoggedIn", "true");
        showHome();
    } else { alert("वैध ईमेल और पासवर्ड डालें।"); }
}

function handleRegister() {
    const name = document.getElementById("reg-name").value;
    const email = document.getElementById("reg-email").value;
    if (name && email.includes("@")) {
        generatedOTP = Math.floor(1000 + Math.random() * 9000);
        emailjs.send(SERVICE_ID, TEMPLATE_ID, { to_email: email, name: name, otp_code: generatedOTP })
            .then(() => {
                alert("OTP भेजा गया!");
                document.getElementById("reg-section").style.display = "none";
                document.getElementById("otp-section").style.display = "block";
            });
    } else { alert("जानकारी सही भरें।"); }
}

function verifyOTP() {
    const val = document.getElementById("otp-input-field").value;
    if (val == generatedOTP) { 
        alert("सफल!"); 
        localStorage.setItem("isLoggedIn", "true");
        location.reload(); 
    } else { alert("गलत OTP"); }
}

function checkLogout() {
    if (localStorage.getItem("isLoggedIn") === "true") {
        if(confirm("लॉगआउट करना चाहते हैं?")) {
            localStorage.removeItem("isLoggedIn");
            location.reload();
        }
    }
}

function switchTab(type) {
    document.getElementById("login-section").style.display = type === 'login' ? "block" : "none";
    document.getElementById("reg-section").style.display = type === 'register' ? "block" : "none";
    document.getElementById("login-tab-btn")?.classList.toggle("active", type === 'login');
    document.getElementById("reg-tab-btn")?.classList.toggle("active", type === 'register');
}

// --- 3. Quiz Engine ---

async function loadAutoQuestions(url) {
    try {
        const res = await fetch(url);
        const text = await res.text();
        const rows = text.split('\n').slice(1);
        questions = rows.map(r => {
            const c = r.split(',');
            if(c.length < 6) return null;
            return { 
                q: c[0].trim(), opts: [c[1], c[2], c[3], c[4]], a: parseInt(c[5]), 
                exp: c[6] || "समाधान उपलब्ध नहीं है।" 
            };
        }).filter(q => q !== null);
        if(questions.length > 0) startQuiz();
    } catch (e) { console.error("CSV Load Error"); }
}

function startQuiz() {
    currentIdx = 0; score = 0;
    showQuestion();
}

function showQuestion() {
    clearInterval(timerInterval);
    const q = questions[currentIdx];
    const qText = document.getElementById('q-text');
    const box = document.getElementById('options-box');
    const nextBtn = document.getElementById('next-btn');
    const progressBar = document.getElementById('progress-bar');

    if(nextBtn) nextBtn.style.display = "none"; 
    if(progressBar) progressBar.style.width = ((currentIdx / questions.length) * 100) + "%";

    qText.innerText = `${currentIdx + 1}. ${q.q}`;
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
    const nextBtn = document.getElementById('next-btn');
    const allBtns = document.querySelectorAll('.option-btn');
    
    allBtns.forEach(b => b.disabled = true);

    // Score Calculation
    if(selectedIndex === q.a) {
        btn.classList.add('correct');
        score += 1;
    } else if (selectedIndex !== -1) {
        if(btn) btn.classList.add('wrong');
        allBtns[q.a].classList.add('correct');
        score -= NEGATIVE_MARK;
    } else {
        // Time Out Case
        allBtns[q.a].classList.add('correct');
    }

    // Show Explanation
    const expDiv = document.createElement('div');
    expDiv.className = "explanation-box";
    expDiv.innerHTML = `<strong>समाधान:</strong> ${q.exp}`;
    box.appendChild(expDiv);

    // Show Next Button
    if(nextBtn) {
        nextBtn.style.display = "block";
        nextBtn.onclick = () => {
            currentIdx++;
            if(currentIdx < questions.length) showQuestion();
            else finishQuiz();
        };
    }
}

function startTimer() {
    timeLeft = 60;
    const timerDisplay = document.getElementById('timer');
    timerInterval = setInterval(() => {
        timeLeft--;
        if(timerDisplay) timerDisplay.innerText = timeLeft < 10 ? "0"+timeLeft : timeLeft;
        if(timeLeft <= 0) { 
            clearInterval(timerInterval); 
            handleAnswer(-1, null); // समय खत्म होने पर ऑटो-सबमिट
        }
    }, 1000);
}

function finishQuiz() {
    alert(`क्विज़ समाप्त!\nआपका कुल स्कोर: ${score.toFixed(2)} / ${questions.length}`);
    location.href = "index.html";
}
