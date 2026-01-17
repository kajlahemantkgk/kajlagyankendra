/**
 * KGK Online Education - Master Quiz & Auth Script
 * Features: OTP Email, Timer, Negative Marking, CSV Engine, Progress Bar
 */

// --- 1. Configurations & Selectors ---
const authModal = document.getElementById("authModal");
const homeSections = document.getElementById("home-sections"); // Main Landing Page
const quizWindow = document.getElementById("quiz-window");     // Quiz Screen Area
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

// --- 2. Initial Load Check ---
window.onload = function() {
    if (localStorage.getItem("isLoggedIn") === "true") {
        updateUIForLoggedInUser();
    }
};

function updateUIForLoggedInUser() {
    if(authModal) authModal.style.display = "none";
    if(openAuth) openAuth.innerText = "लॉगआउट";
}

// --- 3. Authentication & OTP Logic ---

function switchTab(type) {
    document.getElementById("login-section").style.display = type === 'login' ? "block" : "none";
    document.getElementById("reg-section").style.display = type === 'register' ? "block" : "none";
    document.getElementById("login-tab-btn")?.classList.toggle("active", type === 'login');
    document.getElementById("reg-tab-btn")?.classList.toggle("active", type === 'register');
}

function handleLogin() {
    const email = document.getElementById("login-email").value;
    const pass = document.getElementById("login-pass").value;
    
    // Simple validation (In production, replace with Backend check)
    if (email.includes("@") && pass.length >= 4) {
        localStorage.setItem("isLoggedIn", "true");
        location.reload();
    } else { 
        alert("कृपया सही ईमेल और पासवर्ड (min 4 char) डालें।"); 
    }
}

function handleRegister() {
    const name = document.getElementById("reg-name")?.value;
    const email = document.getElementById("reg-email").value;
    
    if (email && email.includes("@")) {
        generatedOTP = Math.floor(1000 + Math.random() * 9000);
        emailjs.send(SERVICE_ID, TEMPLATE_ID, { 
            to_email: email, 
            name: name || "Student", 
            otp_code: generatedOTP 
        })
        .then(() => {
            alert("OTP आपके ईमेल पर भेज दिया गया है।");
            document.getElementById("reg-section").style.display = "none";
            document.getElementById("otp-section").style.display = "block";
        })
        .catch(err => alert("EmailJS Error: " + err));
    } else {
        alert("कृपया वैध ईमेल डालें।");
    }
}

function verifyOTP() {
    const inputOTP = document.getElementById("otp-input-field").value;
    if (inputOTP == generatedOTP) {
        alert("सफल पंजीकरण!");
        localStorage.setItem("isLoggedIn", "true");
        location.reload();
    } else { 
        alert("गलत OTP, कृपया फिर से जांचें।"); 
    }
}

function checkLogout() {
    if (localStorage.getItem("isLoggedIn") === "true") {
        if(confirm("क्या आप लॉगआउट करना चाहते हैं?")) {
            localStorage.removeItem("isLoggedIn");
            location.reload();
        }
    } else {
        if(authModal) authModal.style.display = "flex";
    }
}

// --- 4. Advanced Quiz Engine (CSV Based) ---

async function loadAutoQuestions(url) {
    // Check Login First
    if (localStorage.getItem("isLoggedIn") !== "true") {
        alert("क्विज़ शुरू करने के लिए कृपया लॉगिन करें!");
        if(authModal) authModal.style.display = "flex";
        return;
    }

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("File not found");
        
        const text = await res.text();
        const rows = text.split('\n').slice(1); // Header को छोड़कर
        
        questions = rows.map(r => {
            const c = r.split(',');
            if(c.length < 6) return null;
            return { 
                q: c[0].trim(), 
                opts: [c[1], c[2], c[3], c[4]], 
                a: parseInt(c[5]), 
                exp: c[6] || "समाधान उपलब्ध नहीं है।" 
            };
        }).filter(q => q !== null);

        if(questions.length > 0) {
            startQuiz();
        } else {
            alert("CSV में कोई वैध सवाल नहीं मिले!");
        }
    } catch (e) { 
        console.error("Fetch Error:", e);
        alert("डेटा लोड करने में समस्या हुई। कृपया URL चेक करें।");
    }
}

function startQuiz() {
    if(homeSections) homeSections.style.display = "none";
    if(quizWindow) quizWindow.style.display = "block";
    currentIdx = 0; 
    score = 0;
    showQuestion();
}

function showQuestion() {
    clearInterval(timerInterval);
    const q = questions[currentIdx];
    
    // UI Selectors
    const qText = document.getElementById('q-text');
    const box = document.getElementById('options-box');
    const nextBtn = document.getElementById('next-btn');
    const progressBar = document.getElementById('progress-bar');

    // Reset UI
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
    
    // Disable all options after one click
    allBtns.forEach(b => b.disabled = true);

    // Right/Wrong Logic & Scoring
    if(selectedIndex === q.a) {
        if(btn) btn.classList.add('correct');
        score += 1;
    } else if (selectedIndex !== -1) {
        // User picked wrong answer
        if(btn) btn.classList.add('wrong');
        allBtns[q.a].classList.add('correct'); // Highlight correct answer
        score -= NEGATIVE_MARK;
    } else {
        // Time Out Case (selectedIndex is -1)
        allBtns[q.a].classList.add('correct');
    }

    // Show Explanation (समाधान)
    const expDiv = document.createElement('div');
    expDiv.className = "explanation-box";
    expDiv.innerHTML = `<strong>समाधान:</strong> ${q.exp}`;
    box.appendChild(expDiv);

    // Reveal Next Button
    if(nextBtn) {
        nextBtn.style.display = "block";
        nextBtn.onclick = () => {
            currentIdx++;
            if(currentIdx < questions.length) {
                showQuestion();
            } else {
                finishQuiz();
            }
        };
    }
}

function startTimer() {
    timeLeft = 60;
    const timerDisplay = document.getElementById('timer');
    if(timerDisplay) timerDisplay.innerText = timeLeft;

    timerInterval = setInterval(() => {
        timeLeft--;
        if(timerDisplay) timerDisplay.innerText = timeLeft;
        
        if(timeLeft <= 0) { 
            clearInterval(timerInterval); 
            handleAnswer(-1, null); // Time up: auto submit as wrong
        }
    }, 1000);
}

function finishQuiz() {
    const finalScore = score.toFixed(2);
    alert(`🎉 टेस्ट समाप्त!\nआपका कुल स्कोर: ${finalScore} / ${questions.length}`);
    location.reload(); // Go back to home
}
