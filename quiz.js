
/**
 * KGK Online Education - Logic Engine
 * Features: Auth System, EmailJS Integration, CSV Quiz Loader
 */

// --- 1. Global Variables & Selectors ---
const UI = {
    authModal: document.getElementById("authModal"),
    mainContent: document.getElementById("main-content"),
    authTrigger: document.getElementById("open-auth"),
    sections: {
        login: document.getElementById("login-section"),
        register: document.getElementById("reg-section"),
        forget: document.getElementById("forget-section"),
        otp: document.getElementById("otp-section")
    },
    tabs: {
        login: document.getElementById("login-tab-btn"),
        register: document.getElementById("reg-tab-btn")
    }
};

let generatedOTP = null;
let quizState = {
    questions: [],
    currentIdx: 0,
    score: 0
};

// EmailJS Config
const EMAIL_CONFIG = {
    SERVICE_ID: 'service_mfwhnrm',
    TEMPLATE_ID: 'template_uupjne6'
};

// --- 2. Initialization & UI Control ---

window.onload = () => {
    checkLoginStatus();
};

function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (isLoggedIn) {
        showAuthenticatedUI();
    }
}

function showAuthenticatedUI() {
    if (UI.mainContent) UI.mainContent.style.display = "block";
    if (UI.authModal) UI.authModal.style.display = "none";
    if (UI.authTrigger) {
        UI.authTrigger.innerText = "लॉगआउट";
        UI.authTrigger.onclick = handleLogout;
    }
}

function toggleModal(show) {
    if (UI.authModal) UI.authModal.style.display = show ? 'flex' : 'none';
}

// --- 3. Authentication Logic ---

function switchTab(type) {
    const isLogin = type === 'login';
    
    // Toggle Sections
    UI.sections.login.style.display = isLogin ? "block" : "none";
    UI.sections.register.style.display = isLogin ? "none" : "block";
    UI.sections.forget.style.display = "none";
    UI.sections.otp.style.display = "none";

    // Toggle Tab Active Class
    UI.tabs.login.classList.toggle("active", isLogin);
    UI.tabs.register.classList.toggle("active", !isLogin);
}

function handleLogin() {
    const email = document.getElementById("login-email").value;
    const pass = document.getElementById("login-pass").value;

    if (email.includes("@") && pass.length >= 4) {
        localStorage.setItem("isLoggedIn", "true");
        alert("सफलतापूर्वक लॉगिन हुआ!");
        location.reload();
    } else {
        alert("कृपया सही ईमेल और पासवर्ड (मिनिमम 4 अक्षर) डालें।");
    }
}

function handleRegister() {
    const name = document.getElementById("reg-name").value;
    const email = document.getElementById("reg-email").value;
    const pass = document.getElementById("reg-pass").value;

    if (name && email.includes("@") && pass.length >= 4) {
        sendOTP(email, name);
    } else {
        alert("सभी फ़ील्ड सही से भरें।");
    }
}

function handleLogout() {
    if (confirm("क्या आप लॉगआउट करना चाहते हैं?")) {
        localStorage.removeItem("isLoggedIn");
        location.reload();
    }
}

// --- 4. OTP & EmailJS Logic ---

function showForgetSection() {
    UI.sections.login.style.display = "none";
    UI.sections.forget.style.display = "block";
}

function sendOTP(email, name = "User") {
    generatedOTP = Math.floor(1000 + Math.random() * 9000);
    
    const params = {
        to_email: email,
        name: name,
        otp_code: generatedOTP
    };

    emailjs.send(EMAIL_CONFIG.SERVICE_ID, EMAIL_CONFIG.TEMPLATE_ID, params)
        .then(() => {
            alert("OTP आपके ईमेल पर भेज दिया गया है।");
            // Hide current sections and show OTP input
            Object.values(UI.sections).forEach(s => s.style.display = "none");
            UI.sections.otp.style.display = "block";
        })
        .catch(err => {
            console.error("EmailJS Error:", err);
            alert("OTP भेजने में विफलता। इंटरनेट चेक करें।");
        });
}

function verifyOTP() {
    const inputOTP = document.getElementById("otp-input-field").value;
    if (inputOTP == generatedOTP) {
        alert("वेरिफिकेशन सफल! अब आप लॉगिन कर सकते हैं।");
        location.reload();
    } else {
        alert("गलत OTP, कृपया फिर से प्रयास करें।");
    }
}

// --- 5. Professional Quiz Engine ---

async function loadAutoQuestions(url) {
    // अगर यूजर लॉगिन नहीं है तो क्विज़ नहीं चलेगा (Security)
    if (localStorage.getItem("isLoggedIn") !== "true") {
        alert("क्विज़ शुरू करने के लिए पहले लॉगिन करें।");
        toggleModal(true);
        return;
    }

    try {
        const response = await fetch(url);
        const data = await response.text();
        const rows = data.split('\n').slice(1); // Header हटाना
        
        quizState.questions = rows
            .filter(row => row.trim() !== "")
            .map(row => {
                const cols = row.split(',');
                return {
                    q: cols[0],
                    opts: [cols[1], cols[2], cols[3], cols[4]],
                    a: parseInt(cols[5])
                };
            });

        if (quizState.questions.length > 0) {
            startQuiz();
        } else {
            throw new Error("No questions found");
        }
    } catch (error) {
        console.error("Quiz Error:", error);
        alert("क्विज़ लोड करने में समस्या आई।");
    }
}

function startQuiz() {
    quizState.currentIdx = 0;
    quizState.score = 0;
    renderQuestion();
}

function renderQuestion() {
    const question = quizState.questions[quizState.currentIdx];
    const qTextElement = document.getElementById('q-text');
    const optionsBox = document.getElementById('options-box');

    if (!qTextElement || !optionsBox) return;

    qTextElement.innerText = `सवाल ${quizState.currentIdx + 1}: ${question.q}`;
    optionsBox.innerHTML = "";

    question.opts.forEach((option, index) => {
        const btn = document.createElement('button');
        btn.innerText = option;
        btn.className = "option-btn";
        
        btn.onclick = () => handleAnswer(index, btn);
        optionsBox.appendChild(btn);
    });
}

function handleAnswer(selectedIndex, selectedBtn) {
    const correctIndex = quizState.questions[quizState.currentIdx].a;
    const allBtns = document.querySelectorAll('.option-btn');

    // Disable all buttons after click
    allBtns.forEach(btn => btn.disabled = true);

    if (selectedIndex === correctIndex) {
        selectedBtn.classList.add('correct');
        quizState.score++;
    } else {
        selectedBtn.classList.add('wrong');
        allBtns[correctIndex].classList.add('correct'); // सही जवाब दिखाएं
    }

    // Delay for next question
    setTimeout(() => {
        quizState.currentIdx++;
        if (quizState.currentIdx < quizState.questions.length) {
            renderQuestion();
        } else {
            finishQuiz();
        }
    }, 1500);
}

function finishQuiz() {
    const total = quizState.questions.length;
    const percentage = (quizState.score / total) * 100;
    
    alert(`क्विज़ समाप्त!\nआपका स्कोर: ${quizState.score} / ${total}\nप्रतिशत: ${percentage.toFixed(2)}%`);
    
    // वापस होम पेज पर ले जाएं
    window.location.href = "index.html";
}
