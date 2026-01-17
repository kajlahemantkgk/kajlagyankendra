// --- 1. Variables और Selectors ---
const authModal = document.getElementById("authModal");
const mainContent = document.getElementById("main-content");
const openAuth = document.getElementById("open-auth");
let generatedOTP = null;

// EmailJS Configuration
const SERVICE_ID = 'service_mfwhnrm';
const TEMPLATE_ID = 'template_uupjne6';

// Quiz Variables
let questions = [];
let currentIdx = 0;
let score = 0;
let timeLeft = 60; 
let timerInterval;
const NEGATIVE_MARK = 0.25; 

// पेज लोड होते ही लॉगिन चेक करें
window.onload = function() {
    if (localStorage.getItem("isLoggedIn") === "true") {
        showHome();
    }
};

// --- 2. Authentication लॉजिक (Login/Register/OTP) ---

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
    } else {
        alert("कृपया वैध ईमेल और पासवर्ड डालें।");
    }
}

function handleRegister() {
    const name = document.getElementById("reg-name").value;
    const email = document.getElementById("reg-email").value;
    const pass = document.getElementById("reg-pass").value;
    if (name && email.includes("@") && pass.length >= 4) {
        generatedOTP = Math.floor(1000 + Math.random() * 9000);
        const templateParams = { to_email: email, name: name, otp_code: generatedOTP };
        emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams)
            .then(() => {
                alert("OTP ईमेल पर भेज दिया गया है।");
                document.getElementById("reg-section").style.display = "none";
                document.getElementById("otp-section").style.display = "block";
            }, (err) => { alert("ईमेल विफल! EmailJS चेक करें।"); });
    } else { alert("जानकारी सही भरें।"); }
}

function checkLogout() {
    if (localStorage.getItem("isLoggedIn") === "true") {
        if (confirm("क्या आप लॉगआउट करना चाहते हैं?")) {
            localStorage.removeItem("isLoggedIn");
            location.reload();
        }
    }
}

function switchTab(type) {
    const loginSec = document.getElementById("login-section"), regSec = document.getElementById("reg-section");
    const loginTab = document.getElementById("login-tab-btn"), regTab = document.getElementById("reg-tab-btn");
    if (type === 'login') {
        loginSec.style.display = "block"; regSec.style.display = "none";
        loginTab.classList.add("active"); regTab.classList.remove("active");
    } else {
        loginSec.style.display = "none"; regSec.style.display = "block";
        loginTab.classList.remove("active"); regTab.classList.add("active");
    }
}

function showForget() {
    document.getElementById("login-section").style.display = "none";
    document.getElementById("forget-section").style.display = "block";
}

function sendEmailOTP() {
    const email = document.getElementById("forget-email").value;
    if (!email.includes("@")) { alert("सही ईमेल डालें"); return; }
    generatedOTP = Math.floor(1000 + Math.random() * 9000);
    emailjs.send(SERVICE_ID, TEMPLATE_ID, { to_email: email, otp_code: generatedOTP })
        .then(() => {
            alert("OTP भेजा गया।");
            document.getElementById("forget-section").style.display = "none";
            document.getElementById("otp-section").style.display = "block";
        });
}

function verifyOTP() {
    if (document.getElementById("otp-input-field").value == generatedOTP) {
        alert("सफल! लॉगिन करें।"); location.reload();
    } else { alert("गलत OTP"); }
}

// --- 3. Advanced Quiz Engine (CSV से डेटा) ---

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
                exp: c[6] ? c[6] : "समाधान उपलब्ध नहीं है।" 
            };
        }).filter(q => q !== null);
        if(questions.length > 0) startQuiz();
    } catch (e) { console.error("Error:", e); }
}

function startQuiz() { currentIdx = 0; score = 0; showQuestion(); }

function showQuestion() {
    clearInterval(timerInterval);
    const q = questions[currentIdx];
    const qText = document.getElementById('q-text'), box = document.getElementById('options-box');
    const progressBar = document.getElementById('progress-bar');
    
    if(progressBar) progressBar.style.width = ((currentIdx) / questions.length) * 100 + "%";
    qText.innerText = `${currentIdx + 1}. ${q.q}`;
    box.innerHTML = "";
    startTimer();

    q.opts.forEach((opt, i) => {
        const b = document.createElement('button');
        b.innerText = opt; b.className = "option-btn";
        b.onclick = () => handleAnswer(i, b);
        box.appendChild(b);
    });
}

function handleAnswer(selectedIndex, btn) {
    clearInterval(timerInterval);
    const q = questions[currentIdx];
    const allBtns = document.querySelectorAll('.option-btn');
    allBtns.forEach(b => b.disabled = true);

    const expDiv = document.createElement('div');
    expDiv.className = "explanation-box";
    expDiv.innerHTML = `<strong>समाधान:</strong> ${q.exp}`;

    if(selectedIndex === q.a) { btn.classList.add('correct'); score++; }
    else { 
        if(btn) btn.classList.add('wrong'); 
        allBtns[q.a].classList.add('correct'); score -= NEGATIVE_MARK; 
    }
    document.getElementById('options-box').appendChild(expDiv);

    setTimeout(() => {
        currentIdx++;
        if(currentIdx < questions.length) showQuestion();
        else finishQuiz();
    }, 3000);
}

function startTimer() {
    timeLeft = 60;
    const timerDisplay = document.getElementById('timer');
    timerInterval = setInterval(() => {
        timeLeft--;
        if(timerDisplay) timerDisplay.innerText = timeLeft < 10 ? "0"+timeLeft : timeLeft;
        if(timeLeft <= 0) { clearInterval(timerInterval); handleAnswer(-1, null); }
    }, 1000);
}

function finishQuiz() {
    alert(`क्विज़ समाप्त! स्कोर: ${score.toFixed(2)} / ${questions.length}`);
    location.href = "index.html";
}
