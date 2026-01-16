// --- 1. Variables और Selectors ---
const authModal = document.getElementById("authModal");
const mainContent = document.getElementById("main-content");
const openAuth = document.getElementById("open-auth");
let generatedOTP = null;

// EmailJS Configuration (अपनी IDs यहाँ रखें)
const SERVICE_ID = 'service_mfwhnrm';
const TEMPLATE_ID = 'template_uupjne6';

// पेज लोड होते ही लॉगिन चेक करें
window.onload = function() {
    if (localStorage.getItem("isLoggedIn") === "true") {
        showHome();
    }
};

// --- 2. Authentication लॉजिक ---

// होम स्क्रीन दिखाने के लिए (Center Alignment सुनिश्चित करता है)
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

function checkLogout() {
    if (localStorage.getItem("isLoggedIn") === "true") {
        if (confirm("क्या आप लॉगआउट करना चाहते हैं?")) {
            localStorage.removeItem("isLoggedIn");
            location.reload();
        }
    }
}

// टैब स्विच करने का सही तरीका
function switchTab(type) {
    const loginSec = document.getElementById("login-section");
    const regSec = document.getElementById("reg-section");
    const loginTab = document.getElementById("login-tab-btn");
    const regTab = document.getElementById("reg-tab-btn");

    if (type === 'login') {
        if(loginSec) loginSec.style.display = "block";
        if(regSec) regSec.style.display = "none";
        if(loginTab) loginTab.classList.add("active");
        if(regTab) regTab.classList.remove("active");
    } else {
        if(loginSec) loginSec.style.display = "none";
        if(regSec) regSec.style.display = "block";
        if(loginTab) loginTab.classList.remove("active");
        if(regTab) regTab.classList.add("active");
    }
}

// --- 3. OTP और पासवर्ड भूल गए लॉजिक ---
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
            alert("OTP आपके ईमेल पर भेजा गया।");
            document.getElementById("forget-section").style.display = "none";
            document.getElementById("otp-section").style.display = "block";
        }, (err) => {
            alert("ईमेल भेजने में विफल!");
        });
}

function verifyOTP() {
    const val = document.getElementById("otp-input-field").value;
    if (val == generatedOTP) {
        alert("सफल! अब आप लॉगिन कर सकते हैं।");
        location.reload();
    } else { 
        alert("गलत OTP, कृपया फिर से प्रयास करें।"); 
    }
}

// --- 4. Quiz Engine (Google Sheets CSV) ---
let questions = [];
let currentIdx = 0;
let score = 0;

async function loadAutoQuestions(url) {
    try {
        const res = await fetch(url);
        const text = await res.text();
        const rows = text.split('\n').slice(1);
        
        questions = rows.map(r => {
            const c = r.split(',');
            if(c.length < 6) return null;
            return { q: c[0], opts: [c[1], c[2], c[3], c[4]], a: parseInt(c[5]) };
        }).filter(q => q !== null);

        if(questions.length > 0) startQuiz();
    } catch (e) {
        console.error("Quiz Load Error:", e);
    }
}

function startQuiz() {
    currentIdx = 0; 
    score = 0;
    showQuestion();
}

function showQuestion() {
    const q = questions[currentIdx];
    const qText = document.getElementById('q-text');
    const box = document.getElementById('options-box');
    
    if(!qText || !box) return;

    qText.innerText = q.q;
    box.innerHTML = "";
    
    q.opts.forEach((opt, i) => {
        const b = document.createElement('button');
        b.innerText = opt;
        b.className = "option-btn";
        b.onclick = () => {
            const allBtns = document.querySelectorAll('.option-btn');
            allBtns.forEach(btn => btn.disabled = true); // दोबारा क्लिक रोकने के लिए

            if(i === q.a) { 
                b.classList.add('correct'); 
                score++; 
            } else { 
                b.classList.add('wrong'); 
                allBtns[q.a].classList.add('correct'); // सही जवाब दिखाना
            }
            
            setTimeout(() => {
                currentIdx++;
                if(currentIdx < questions.length) {
                    showQuestion();
                } else {
                    alert("क्विज़ समाप्त! आपका स्कोर: " + score + "/" + questions.length);
                    location.reload(); // या स्कोरबोर्ड दिखाएँ
                }
            }, 1500);
        };
        box.appendChild(b);
    });
}
function handleRegister() {
    const name = document.getElementById("reg-name").value;
    const email = document.getElementById("reg-email").value;
    const pass = document.getElementById("reg-pass").value;

    if (name && email.includes("@") && pass.length >= 4) {
        generatedOTP = Math.floor(1000 + Math.random() * 9000);
        
        const templateParams = {
            to_email: email,    // यह टेम्पलेट के 'To Email' {{to_email}} बॉक्स में जाएगा
            name: name,         // यह {{name}} की जगह दिखेगा
            otp_code: generatedOTP // यह {{otp_code}} की जगह दिखेगा
        };

        emailjs.send('service_mfwhnrm', 'template_uupjne6', templateParams)
            .then(() => {
                alert("OTP आपके ईमेल " + email + " पर भेज दिया गया है।");
                document.getElementById("reg-section").style.display = "none";
                document.getElementById("otp-section").style.display = "block";
            }, (err) => {
                alert("ईमेल भेजने में विफल! सेटिंग्स चेक करें।");
            });
    } else {
        alert("कृपया जानकारी सही से भरें।");
    }
}
