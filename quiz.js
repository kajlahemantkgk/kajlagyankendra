// --- 1. वेरिएबल्स और स्टेट मैनेजमेंट ---
const authModal = document.getElementById("authModal");
const openAuth = document.getElementById("open-auth");
const mainContent = document.getElementById("main-content");
let generatedOTP = null;

// आपकी EmailJS IDs
const EMAILJS_SERVICE_ID = 'service_mfwhnrm'; 
const EMAILJS_TEMPLATE_ID = 'template_uupjne6'; 

// पेज लोड होते ही लॉगिन स्टेटस चेक करें
window.onload = function() {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (isLoggedIn === "true") {
        showHome();
    }
};

// --- 2. ऑथेंटिकेशन लॉजिक ---
function handleLogin() {
    const email = document.getElementById("login-email").value;
    const pass = document.getElementById("login-pass").value;

    if (email.includes("@") && pass.length >= 4) {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userEmail", email);
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
        alert("पंजीकरण सफल! अब आप लॉगिन कर सकते हैं।");
        switchTab('login');
    } else {
        alert("कृपया सभी जानकारी सही से भरें।");
    }
}

function showHome() {
    if(mainContent) mainContent.style.display = "block";
    if(authModal) authModal.style.display = "none";
    if(openAuth) openAuth.innerText = "लॉगआउट";
}

function checkLogout() {
    if (localStorage.getItem("isLoggedIn") === "true") {
        if (confirm("क्या आप लॉगआउट करना चाहते हैं?")) {
            localStorage.removeItem("isLoggedIn");
            location.reload();
        }
    }
}

// --- 3. ईमेल OTP लॉजिक ---
function showForget() {
    document.getElementById("login-section").style.display = "none";
    document.getElementById("reg-section").style.display = "none";
    document.getElementById("otp-section").style.display = "none";
    document.getElementById("forget-section").style.display = "block";
}

function sendEmailOTP() {
    const email = document.getElementById("forget-email").value;
    if (!email.includes("@")) { alert("सही ईमेल डालें"); return; }

    generatedOTP = Math.floor(1000 + Math.random() * 9000);
    const templateParams = { to_email: email, otp_code: generatedOTP };

    emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
        .then(function() {
            alert("कोड ईमेल पर भेज दिया गया है।");
            document.getElementById("forget-section").style.display = "none";
            document.getElementById("otp-section").style.display = "block";
        }, function(error) {
            alert("ईमेल भेजने में विफल!");
        });
}

function verifyOTP() {
    const userInput = document.getElementById("otp-input-field").value;
    if (userInput == generatedOTP) {
        alert("सफल! अब लॉगिन करें।");
        switchTab('login');
    } else {
        alert("गलत कोड!");
    }
}

function switchTab(type) {
    const loginSec = document.getElementById("login-section");
    const regSec = document.getElementById("reg-section");
    if (type === 'login') {
        loginSec.style.display = "block";
        regSec.style.display = "none";
    } else {
        loginSec.style.display = "none";
        regSec.style.display = "block";
    }
}

// --- 4. Google Sheets और क्विज़ लॉजिक ---
let currentIdx = 0;
let score = 0;
let questions = [];

async function loadAutoQuestions(csvURL) {
    try {
        const response = await fetch(csvURL);
        const data = await response.text();
        const rows = data.split('\n').slice(1); 
        
        questions = rows.map(row => {
            const cols = row.split(',');
            if(cols.length < 6) return null; 
            return { 
                q: cols[0].trim(), 
                opts: [cols[1].trim(), cols[2].trim(), cols[3].trim(), cols[4].trim()], 
                a: parseInt(cols[5].trim()) 
            };
        }).filter(q => q !== null);
        
        if(questions.length > 0) {
            startQuiz(questions);
        } else {
            document.getElementById('q-text').innerText = "शीट में सवाल नहीं मिले!";
        }
    } catch (error) {
        document.getElementById('q-text').innerText = "लोडिंग एरर!";
    }
}

function startQuiz(data) {
    questions = data;
    currentIdx = 0;
    score = 0;
    showQuestion();
}

function showQuestion() {
    const q = questions[currentIdx];
    document.getElementById('q-text').innerText = q.q;
    const box = document.getElementById('options-box');
    box.innerHTML = "";
    q.opts.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.innerText = opt;
        btn.className = "option-btn";
        btn.onclick = () => selectAnswer(i, btn);
        box.appendChild(btn);
    });
}

function selectAnswer(selectedIndex, btn) {
    const correct = questions[currentIdx].a;
    const allBtns = document.querySelectorAll('.option-btn');
    allBtns.forEach(b => b.disabled = true);

    if(selectedIndex === correct) {
        btn.classList.add('correct');
        score++;
    } else {
        btn.classList.add('wrong');
        allBtns[correct].classList.add('correct');
    }
    document.getElementById('next-btn').style.display = "block";
}

document.getElementById('next-btn').onclick = () => {
    currentIdx++;
    if(currentIdx < questions.length) {
        document.getElementById('next-btn').style.display = "none";
        showQuestion();
    } else {
        showFinalResult();
    }
};

function showFinalResult() {
    document.getElementById('q-text').style.display = "none";
    document.getElementById('options-box').style.display = "none";
    document.getElementById('next-btn').style.display = "none";
    document.getElementById('result-box').style.display = "block";
    document.getElementById('score-val').innerText = score + " / " + questions.length;
}
