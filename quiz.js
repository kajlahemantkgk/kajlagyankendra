// --- 1. वेरिएबल्स और स्टेट मैनेजमेंट ---
const authModal = document.getElementById("authModal");
const openAuth = document.getElementById("open-auth");
const mainContent = document.getElementById("main-content");
let generatedOTP = null;

// आपकी EmailJS IDs (जो आपने दी हैं)
const EMAILJS_SERVICE_ID = 'service_mfwhnrm'; 
const EMAILJS_TEMPLATE_ID = 'template_uupjne6'; 

// पेज लोड होते ही लॉगिन स्टेटस चेक करें
window.onload = function() {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (isLoggedIn === "true") {
        showHome();
    }
};

// --- 2. ऑथेंटिकेशन (Login/Logout/Register) लॉजिक ---

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

// --- 3. ईमेल OTP (Forget Password) लॉजिक ---

function showForget() {
    document.getElementById("login-section").style.display = "none";
    document.getElementById("reg-section").style.display = "none";
    document.getElementById("otp-section").style.display = "none";
    document.getElementById("forget-section").style.display = "block";
    
    const tabs = document.querySelectorAll(".tab-btn");
    tabs.forEach(tab => tab.classList.remove("active"));
}

function sendEmailOTP() {
    const email = document.getElementById("forget-email").value;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
        alert("कृपया एक सही ईमेल आईडी डालें।");
        return;
    }

    // 4 अंकों का रैंडम कोड
    generatedOTP = Math.floor(1000 + Math.random() * 9000);

    const templateParams = {
        to_email: email,
        otp_code: generatedOTP
    };

    // EmailJS के जरिए ईमेल भेजना
    emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
        .then(function() {
            alert("सफलता! रिकवरी कोड आपकी ईमेल पर भेज दिया गया है।");
            document.getElementById("forget-section").style.display = "none";
            document.getElementById("otp-section").style.display = "block";
        }, function(error) {
            alert("ईमेल भेजने में विफल! कृपया अपनी Public Key चेक करें।");
            console.log("FAILED...", error);
        });
}

function verifyOTP() {
    const userInput = document.getElementById("otp-input-field").value;
    
    if (userInput == generatedOTP) {
        alert("वेरिफिकेशन सफल! अब आप लॉगिन कर सकते हैं।");
        document.getElementById("otp-input-field").value = "";
        switchTab('login');
    } else {
        alert("गलत कोड! कृपया अपनी ईमेल दोबारा चेक करें।");
    }
}

// टैब स्विच करने का फंक्शन
function switchTab(type) {
    const loginSec = document.getElementById("login-section");
    const regSec = document.getElementById("reg-section");
    const tabs = document.querySelectorAll(".tab-btn");

    document.getElementById("forget-section").style.display = "none";
    document.getElementById("otp-section").style.display = "none";

    if (type === 'login') {
        loginSec.style.display = "block";
        regSec.style.display = "none";
        tabs[0].classList.add("active");
        tabs[1].classList.remove("active");
    } else {
        loginSec.style.display = "none";
        regSec.style.display = "block";
        tabs[0].classList.remove("active");
        tabs[1].classList.add("active");
    }
}

// --- 4. मोबाइल मेनू ---
const mobileBtn = document.getElementById('mobile-toggle');
const navList = document.getElementById('nav-list');
if(mobileBtn && navList) {
    mobileBtn.onclick = () => navList.classList.toggle('active');
}

// --- 5. क्विज़ का लॉजिक ---
let currentIdx = 0;
let score = 0;
let questions = [];

function startQuiz(data) {
    questions = data;
    currentIdx = 0;
    score = 0;
    
    // क्विज़ शुरू होने पर बॉक्स दिखाएँ
    document.getElementById('q-text').style.display = "block";
    document.getElementById('options-box').style.display = "block";
    if(document.getElementById('result-box')) document.getElementById('result-box').style.display = "none";
    
    showQuestion();
}

function showQuestion() {
    const q = questions[currentIdx];
    const qText = document.getElementById('q-text');
    const box = document.getElementById('options-box');

    if(qText) qText.innerText = q.q;
    if(box) {
        box.innerHTML = "";
        q.opts.forEach((opt, i) => {
            const btn = document.createElement('button');
            btn.innerText = opt;
            btn.className = "option-btn";
            btn.onclick = () => selectAnswer(i, btn);
            box.appendChild(btn);
        });
    }
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
    const nextBtn = document.getElementById('next-btn');
    if(nextBtn) nextBtn.style.display = "block";
}

const nextBtnElement = document.getElementById('next-btn');
if(nextBtnElement) {
    nextBtnElement.onclick = () => {
        currentIdx++;
        if(currentIdx < questions.length) {
            nextBtnElement.style.display = "none";
            showQuestion();
        } else {
            showFinalResult();
        }
    };
}

function showFinalResult() {
    document.getElementById('q-text').style.display = "none";
    document.getElementById('options-box').style.display = "none";
    if(nextBtnElement) nextBtnElement.style.display = "none";
    const resultBox = document.getElementById('result-box');
    if(resultBox) {
        resultBox.style.display = "block";
        const scoreVal = document.getElementById('score-val');
        if(scoreVal) scoreVal.innerText = score;
    }
}
