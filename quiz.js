const authModal = document.getElementById("authModal");
const mainContent = document.getElementById("main-content");
const openAuth = document.getElementById("open-auth");
let generatedOTP = null;

// EmailJS Configuration
const SERVICE_ID = 'service_mfwhnrm';
const TEMPLATE_ID = 'template_uupjne6';

window.onload = function() {
    if (localStorage.getItem("isLoggedIn") === "true") {
        showHome();
    }
};

function handleLogin() {
    const email = document.getElementById("login-email").value;
    const pass = document.getElementById("login-pass").value;
    if (email.includes("@") && pass.length >= 4) {
        localStorage.setItem("isLoggedIn", "true");
        showHome();
    } else {
        alert("वैध जानकारी डालें।");
    }
}

function showHome() {
    if(mainContent) mainContent.style.display = "block";
    if(authModal) authModal.style.display = "none";
    if(openAuth) openAuth.innerText = "लॉगआउट";
}

function checkLogout() {
    if (localStorage.getItem("isLoggedIn") === "true") {
        localStorage.removeItem("isLoggedIn");
        location.reload();
    }
}

function switchTab(type) {
    document.getElementById("login-section").style.display = (type === 'login') ? "block" : "none";
    document.getElementById("reg-section").style.display = (type === 'register') ? "block" : "none";
    document.getElementById("login-tab-btn").classList.toggle("active", type === 'login');
    document.getElementById("reg-tab-btn").classList.toggle("active", type === 'register');
}

function showForget() {
    document.getElementById("login-section").style.display = "none";
    document.getElementById("forget-section").style.display = "block";
}

function sendEmailOTP() {
    const email = document.getElementById("forget-email").value;
    generatedOTP = Math.floor(1000 + Math.random() * 9000);
    emailjs.send(SERVICE_ID, TEMPLATE_ID, { to_email: email, otp_code: generatedOTP })
        .then(() => {
            alert("OTP भेजा गया।");
            document.getElementById("forget-section").style.display = "none";
            document.getElementById("otp-section").style.display = "block";
        });
}

function verifyOTP() {
    const val = document.getElementById("otp-input-field").value;
    if (val == generatedOTP) {
        alert("सफल! अब लॉगिन करें।");
        location.reload();
    } else { alert("गलत OTP"); }
}

// --- Quiz Engine ---
let questions = [];
let currentIdx = 0;
let score = 0;

async function loadAutoQuestions(url) {
    const res = await fetch(url);
    const text = await res.text();
    const rows = text.split('\n').slice(1);
    questions = rows.map(r => {
        const c = r.split(',');
        return { q: c[0], opts: [c[1], c[2], c[3], c[4]], a: parseInt(c[5]) };
    });
    startQuiz();
}

function startQuiz() {
    currentIdx = 0; score = 0;
    showQuestion();
}

function showQuestion() {
    const q = questions[currentIdx];
    document.getElementById('q-text').innerText = q.q;
    const box = document.getElementById('options-box');
    box.innerHTML = "";
    q.opts.forEach((opt, i) => {
        const b = document.createElement('button');
        b.innerText = opt;
        b.className = "option-btn";
        b.onclick = () => {
            if(i === q.a) { b.classList.add('correct'); score++; }
            else { b.classList.add('wrong'); }
            setTimeout(() => {
                currentIdx++;
                if(currentIdx < questions.length) showQuestion();
                else alert("स्कोर: " + score);
            }, 1000);
        };
        box.appendChild(b);
    });
}

