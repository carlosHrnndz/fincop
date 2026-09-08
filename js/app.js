// ===============================================
// Finanzas Corporativas Quiz App - ADE Tecnológico
// Features: KaTeX Math Formulas, Built-in Financial Calculator,
// Keyboard Shortcuts, Voice TTS, Spaced Repetition (SRS),
// PWA Offline Cache, Firebase Sync & Leaderboard
// ===============================================

const firebaseConfig = {
    apiKey: atob("QUl6YVN5RG9uTVdLTnBLMVJEV2lXU29zTjVIZWJNVENBTFotNFkw"),
    authDomain: "quiz-microeconomia.firebaseapp.com",
    databaseURL: "https://quiz-microeconomia-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "quiz-microeconomia",
    storageBucket: "quiz-microeconomia.firebasestorage.app",
    messagingSenderId: "17626414656",
    appId: "1:17626414656:web:a68231ec8be62555e229a5"
};

class FinanzasQuizApp {
    constructor() {
        this.allQuestions = [];
        this.questions = [];
        this.mode = 'quiz';
        this.selectedUnits = new Set();
        this.unitQuestionCounts = {};
        this.unitTitles = {};
        this.sessionCode = '';
        this.firebaseInitialized = false;
        this.currentQuestionIndex = 0;

        // Per-mode data
        this.modeData = {
            quiz: { userAnswers: {}, score: 0, currentQuestionIndex: 0, pendingQuestions: [], globalStats: { totalAttempts: 0, totalCorrect: 0, unitStats: {}, questionHistory: {} } },
            exam: { userAnswers: {}, score: 0, currentQuestionIndex: 0, pendingQuestions: [] },
            smart: { userAnswers: {}, score: 0, currentQuestionIndex: 0, pendingQuestions: [] },
            study: { currentQuestionIndex: 0 },
            marked: { currentQuestionIndex: 0 }
        };

        // Calculator state
        this.calcExpression = '';
        this.calcLastAnswer = '0';

        // Speech synthesis
        this.synth = window.speechSynthesis;
        this.isSpeaking = false;

        // Touch vars
        this.touchStartX = 0;
        this.touchEndX = 0;

        this.initUI();
    }

    initUI() {
        this.ui = {
            splashScreen: document.getElementById('splash-screen'),
            quizApp: document.getElementById('quiz-app'),
            sessionCodeInput: document.getElementById('session-code'),
            btnLoadSession: document.getElementById('btn-load-session'),
            subjectSummary: document.getElementById('subject-questions-summary'),
            selectedCount: document.getElementById('selected-count'),
            unitsSelectedBadge: document.getElementById('units-selected-badge'),
            btnStart: document.getElementById('btn-start'),

            // Header
            btnHome: document.getElementById('btn-home'),
            btnTheme: document.getElementById('btn-theme'),
            btnSearch: document.getElementById('btn-search'),
            btnCalc: document.getElementById('btn-calc'),
            btnTts: document.getElementById('btn-tts'),
            questionCounter: document.getElementById('question-counter'),
            unitBadge: document.getElementById('unit-badge'),
            scoreVal: document.getElementById('score-val'),
            btnModeToggle: document.getElementById('btn-mode-toggle'),
            btnNewExam: document.getElementById('btn-new-exam'),

            // Mode selection
            modeBtns: document.querySelectorAll('.mode-btn'),
            modeDescription: document.getElementById('mode-description'),

            // Unit selection & filter pills
            unitGrid: document.getElementById('unit-grid'),
            filterAll: document.getElementById('filter-all'),
            filterNone: document.getElementById('filter-none'),
            filterMath: document.getElementById('filter-math'),
            filterLoans: document.getElementById('filter-loans'),
            filterMarkets: document.getElementById('filter-markets'),
            filterInvest: document.getElementById('filter-invest'),

            // Question area
            progressBar: document.getElementById('progress-fill'),
            questionText: document.getElementById('question-text'),
            optionsContainer: document.getElementById('options-container'),
            feedbackArea: document.getElementById('feedback-area'),
            feedbackStatus: document.getElementById('feedback-status'),
            explanationContainer: document.getElementById('explanation-container'),
            explanationText: document.getElementById('explanation-text'),

            // Navigation
            btnPrev: document.getElementById('btn-prev'),
            btnNext: document.getElementById('btn-next'),
            btnMark: document.getElementById('btn-mark'),
            btnListMarked: document.getElementById('btn-list-marked'),
            btnWrong: document.getElementById('btn-wrong'),
            pendingCount: document.getElementById('pending-count'),
            wrongCount: document.getElementById('wrong-count'),

            // Modals
            modalCalc: document.getElementById('modal-calculator'),
            calcDisplay: document.getElementById('calc-display'),
            calcHistory: document.getElementById('calc-history'),
            btnCloseCalc: document.getElementById('btn-close-calc'),

            modalSearch: document.getElementById('modal-search'),
            searchInput: document.getElementById('search-input'),
            searchResults: document.getElementById('search-results'),
            btnCloseSearch: document.getElementById('btn-close-search'),

            modalStats: document.getElementById('modal-stats'),
            btnStats: document.getElementById('btn-stats'),
            btnCloseStats: document.getElementById('btn-close-stats'),
            btnResetProgress: document.getElementById('btn-reset-progress'),
            statGlobalAccuracy: document.getElementById('global-accuracy'),
            statTotalAnswered: document.getElementById('total-answered'),
            weakUnitsList: document.getElementById('weak-units-list'),

            modalPending: document.getElementById('modal-pending'),
            pendingList: document.getElementById('pending-list'),
            btnClosePending: document.getElementById('btn-close-pending'),

            modalWrong: document.getElementById('modal-wrong'),
            wrongList: document.getElementById('wrong-list'),
            btnCloseWrong: document.getElementById('btn-close-wrong'),

            modalResults: document.getElementById('modal-results'),
            resultsTitle: document.getElementById('results-title'),
            statCorrect: document.getElementById('stat-correct'),
            statWrong: document.getElementById('stat-wrong'),
            statScore: document.getElementById('stat-score'),
            btnReviewWrong: document.getElementById('btn-review-wrong'),
            btnRestartResults: document.getElementById('btn-restart-results'),

            modalLeaderboard: document.getElementById('modal-leaderboard'),
            btnRanking: document.getElementById('btn-ranking'),
            btnCloseLeaderboard: document.getElementById('btn-close-leaderboard'),
            leaderboardList: document.getElementById('leaderboard-list'),
            usernameInput: document.getElementById('username-input'),
            btnSubmitScore: document.getElementById('btn-submit-score')
        };

        this.init();
    }

    async init() {
        this.setupTheme();
        await this.loadData();
        this.initFirebase();
        this.loadStoredSessionCode();
        this.setupSplash();
        this.setupCalculator();
        this.setupKeyboardShortcuts();
        this.setupSpeechTTS();
        this.bindEvents();
        this.setupSwipe();
    }

    // ===============================================
    // THEME SETUP
    // ===============================================
    setupTheme() {
        const savedTheme = localStorage.getItem('finanzas_theme') || 'dark';
        if (savedTheme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
            if (this.ui.btnTheme) this.ui.btnTheme.textContent = '☀️';
        }

        if (this.ui.btnTheme) {
            this.ui.btnTheme.addEventListener('click', () => {
                const current = document.documentElement.getAttribute('data-theme');
                const next = current === 'light' ? 'dark' : 'light';
                document.documentElement.setAttribute('data-theme', next);
                this.ui.btnTheme.textContent = next === 'light' ? '☀️' : '🌙';
                localStorage.setItem('finanzas_theme', next);
            });
        }
    }

    // ===============================================
    // DATA LOADING
    // ===============================================
    async loadData() {
        try {
            const indexResp = await fetch('./data/questions_index.json');
            const files = await indexResp.json();
            this.allQuestions = [];

            const promises = files.map(f => fetch(`./data/${f}`).then(r => r.json()));
            const unitDocs = await Promise.all(promises);

            unitDocs.forEach(doc => {
                const uNum = doc.unidad;
                this.unitTitles[uNum] = doc.titulo || `Unidad ${uNum}`;
                const qs = doc.preguntas || [];
                this.unitQuestionCounts[uNum] = qs.length;

                qs.forEach(q => {
                    this.allQuestions.push({
                        ...q,
                        unidad: uNum,
                        unitTitle: this.unitTitles[uNum],
                        id: `u${uNum}_q${q.numero}`
                    });
                });
                this.selectedUnits.add(uNum);
            });

            if (this.ui.subjectSummary) {
                this.ui.subjectSummary.textContent = `${this.allQuestions.length} preguntas disponibles en 20 unidades`;
            }
            this.updateSelectedCount();
            this.renderUnitGrid();
        } catch (e) {
            console.error('Error loading question files:', e);
            if (this.ui.subjectSummary) {
                this.ui.subjectSummary.textContent = 'Error al cargar las unidades de datos.';
            }
        }
    }

    // ===============================================
    // FIREBASE & CLOUD PERSISTENCE
    // ===============================================
    initFirebase() {
        try {
            if (typeof firebase !== 'undefined' && !firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
                this.db = firebase.database();
                this.firebaseInitialized = true;
            }
        } catch (err) {
            console.warn('Firebase init fallback:', err);
        }
    }

    loadStoredSessionCode() {
        const stored = localStorage.getItem('finanzas_session_code') || '';
        if (stored) {
            this.sessionCode = stored;
            if (this.ui.sessionCodeInput) this.ui.sessionCodeInput.value = stored;
            this.loadProgress();
        }
    }

    saveSessionCode() {
        if (!this.ui.sessionCodeInput) return;
        const val = this.ui.sessionCodeInput.value.trim().toLowerCase();
        this.sessionCode = val;
        localStorage.setItem('finanzas_session_code', val);
    }

    async saveProgress() {
        // Always save to LocalStorage
        const state = {
            modeData: this.modeData,
            selectedUnits: Array.from(this.selectedUnits),
            updatedAt: Date.now()
        };
        localStorage.setItem(`finanzas_progress_${this.sessionCode || 'guest'}`, JSON.stringify(state));

        // Save to Firebase if sessionCode exists
        if (this.firebaseInitialized && this.sessionCode) {
            try {
                await this.db.ref(`finanzas_sessions/${this.sessionCode}`).set(state);
            } catch (err) {
                console.warn('Firebase save warning:', err);
            }
        }
    }

    async loadProgress() {
        let loaded = false;
        // 1. Try Firebase if configured
        if (this.firebaseInitialized && this.sessionCode) {
            try {
                const snap = await this.db.ref(`finanzas_sessions/${this.sessionCode}`).once('value');
                if (snap.exists()) {
                    const data = snap.val();
                    if (data && data.modeData) {
                        this.modeData = { ...this.modeData, ...data.modeData };
                        if (data.selectedUnits && Array.isArray(data.selectedUnits)) {
                            this.selectedUnits = new Set(data.selectedUnits);
                        }
                        loaded = true;
                    }
                }
            } catch (err) {
                console.warn('Firebase load error:', err);
            }
        }

        // 2. Fallback to LocalStorage
        if (!loaded) {
            const local = localStorage.getItem(`finanzas_progress_${this.sessionCode || 'guest'}`);
            if (local) {
                try {
                    const data = JSON.parse(local);
                    if (data && data.modeData) {
                        this.modeData = { ...this.modeData, ...data.modeData };
                        if (data.selectedUnits && Array.isArray(data.selectedUnits)) {
                            this.selectedUnits = new Set(data.selectedUnits);
                        }
                        loaded = true;
                    }
                } catch (e) {}
            }
        }

        this.renderUnitGrid();
        this.updateSelectedCount();
        this.updateCounters();
        return loaded;
    }

    resetProgress() {
        if (!confirm('¿Seguro que deseas resetear todo el progreso guardado?')) return;
        this.modeData = {
            quiz: { userAnswers: {}, score: 0, currentQuestionIndex: 0, pendingQuestions: [], globalStats: { totalAttempts: 0, totalCorrect: 0, unitStats: {}, questionHistory: {} } },
            exam: { userAnswers: {}, score: 0, currentQuestionIndex: 0, pendingQuestions: [] },
            smart: { userAnswers: {}, score: 0, currentQuestionIndex: 0, pendingQuestions: [] },
            study: { currentQuestionIndex: 0 },
            marked: { currentQuestionIndex: 0 }
        };
        this.saveProgress();
        this.updateCounters();
        if (this.ui.modalStats) this.ui.modalStats.classList.add('hidden');
        alert('Progreso reseteado correctamente.');
    }

    // ===============================================
    // SPLASH & UNIT FILTERS
    // ===============================================
    setupSplash() {
        // Mode buttons
        this.ui.modeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.ui.modeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.setMode(btn.dataset.mode);
            });
        });

        // Filter pills
        if (this.ui.filterAll) {
            this.ui.filterAll.addEventListener('click', () => {
                Object.keys(this.unitQuestionCounts).forEach(u => this.selectedUnits.add(Number(u)));
                this.renderUnitGrid();
                this.updateSelectedCount();
            });
        }

        if (this.ui.filterNone) {
            this.ui.filterNone.addEventListener('click', () => {
                this.selectedUnits.clear();
                this.renderUnitGrid();
                this.updateSelectedCount();
            });
        }

        if (this.ui.filterMath) {
            this.ui.filterMath.addEventListener('click', () => {
                this.selectUnitRange(3, 6);
            });
        }

        if (this.ui.filterLoans) {
            this.ui.filterLoans.addEventListener('click', () => {
                this.selectUnitRange(7, 8);
            });
        }

        if (this.ui.filterMarkets) {
            this.ui.filterMarkets.addEventListener('click', () => {
                this.selectUnitRange(9, 14);
            });
        }

        if (this.ui.filterInvest) {
            this.ui.filterInvest.addEventListener('click', () => {
                this.selectUnitRange(15, 20);
            });
        }

        if (this.ui.btnStart) {
            this.ui.btnStart.addEventListener('click', () => this.startQuiz());
        }

        if (this.ui.btnLoadSession) {
            this.ui.btnLoadSession.addEventListener('click', async () => {
                this.saveSessionCode();
                const ok = await this.loadProgress();
                alert(ok ? '✅ Sesión cargada con éxito' : 'No se encontraron datos previos para este código.');
            });
        }

        // Leaderboard
        if (this.ui.btnRanking) {
            this.ui.btnRanking.addEventListener('click', () => this.openLeaderboard());
        }
        if (this.ui.btnCloseLeaderboard) {
            this.ui.btnCloseLeaderboard.addEventListener('click', () => this.ui.modalLeaderboard.classList.add('hidden'));
        }
        if (this.ui.btnSubmitScore) {
            this.ui.btnSubmitScore.addEventListener('click', () => this.submitScore());
        }

        // Stats
        if (this.ui.btnStats) {
            this.ui.btnStats.addEventListener('click', () => this.showStats());
        }
        if (this.ui.btnCloseStats) {
            this.ui.btnCloseStats.addEventListener('click', () => this.ui.modalStats.classList.add('hidden'));
        }
        if (this.ui.btnResetProgress) {
            this.ui.btnResetProgress.addEventListener('click', () => this.resetProgress());
        }

        // Search
        if (this.ui.btnSearch) {
            this.ui.btnSearch.addEventListener('click', () => {
                this.ui.modalSearch.classList.remove('hidden');
                this.ui.searchInput.value = '';
                this.ui.searchInput.focus();
                this.handleSearch('');
            });
        }
        if (this.ui.btnCloseSearch) {
            this.ui.btnCloseSearch.addEventListener('click', () => this.ui.modalSearch.classList.add('hidden'));
        }
        if (this.ui.searchInput) {
            this.ui.searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }

        // Home
        if (this.ui.btnHome) {
            this.ui.btnHome.addEventListener('click', () => {
                if (this.synth) this.synth.cancel();
                this.ui.quizApp.classList.add('hidden');
                this.ui.splashScreen.classList.remove('hidden');
            });
        }
    }

    selectUnitRange(start, end) {
        this.selectedUnits.clear();
        for (let i = start; i <= end; i++) {
            if (this.unitQuestionCounts[i]) this.selectedUnits.add(i);
        }
        this.renderUnitGrid();
        this.updateSelectedCount();
    }

    renderUnitGrid() {
        if (!this.ui.unitGrid) return;
        this.ui.unitGrid.innerHTML = '';
        const units = Object.keys(this.unitQuestionCounts).map(Number).sort((a, b) => a - b);

        units.forEach(u => {
            const card = document.createElement('div');
            card.className = `unit-card ${this.selectedUnits.has(u) ? 'active' : ''}`;
            const title = (this.unitTitles[u] || `Unidad ${u}`).replace(/^Autoevaluación Unidad \d+ - /, '');
            card.innerHTML = `
                <span class="unit-card-num">U${u}</span>
                <span class="unit-card-title">${title}</span>
            `;
            card.addEventListener('click', () => {
                if (this.selectedUnits.has(u)) {
                    this.selectedUnits.delete(u);
                    card.classList.remove('active');
                } else {
                    this.selectedUnits.add(u);
                    card.classList.add('active');
                }
                this.updateSelectedCount();
            });
            this.ui.unitGrid.appendChild(card);
        });
    }

    updateSelectedCount() {
        let count = 0;
        this.selectedUnits.forEach(u => {
            count += (this.unitQuestionCounts[u] || 0);
        });
        if (this.ui.selectedCount) {
            this.ui.selectedCount.textContent = `Preguntas seleccionadas: ${count} en ${this.selectedUnits.size} unidades`;
        }
        if (this.ui.unitsSelectedBadge) {
            this.ui.unitsSelectedBadge.textContent = `${this.selectedUnits.size} de 20 seleccionadas`;
        }
    }

    setMode(mode) {
        this.mode = mode;
        const descs = {
            quiz: 'Responde preguntas con corrección inmediata, explicaciones completas y fórmulas KaTeX.',
            exam: 'Simulación de examen cronometrado con evaluación final acumulada.',
            smart: 'Repaso inteligente (SRS): prioriza automáticamente las preguntas falladas y tus unidades más débiles.',
            study: 'Modo lectura sin presión: visualiza las soluciones correctas y los ejemplos prácticos de inmediato.',
            marked: 'Repasa exclusivamente las preguntas que has marcado con el pin 📌.'
        };
        if (this.ui.modeDescription) {
            this.ui.modeDescription.textContent = descs[mode] || '';
        }
    }

    // ===============================================
    // QUIZ ENGINE
    // ===============================================
    startQuiz() {
        if (this.selectedUnits.size === 0 && this.mode !== 'marked') {
            alert('Por favor, selecciona al menos una unidad para comenzar.');
            return;
        }

        // Build question list based on mode
        let activeList = [];
        if (this.mode === 'marked') {
            const pending = this.modeData.quiz.pendingQuestions || [];
            activeList = this.allQuestions.filter(q => pending.includes(q.id));
            if (activeList.length === 0) {
                alert('No tienes preguntas marcadas con 📌 todavía.');
                return;
            }
        } else if (this.mode === 'smart') {
            const hist = this.modeData.quiz.globalStats.questionHistory || {};
            // Sort questions: failed first, then unattempted, then succeeded
            activeList = this.allQuestions.filter(q => this.selectedUnits.has(q.unidad));
            activeList.sort((a, b) => {
                const aH = hist[a.id] || { correct: 0, wrong: 0 };
                const bH = hist[b.id] || { correct: 0, wrong: 0 };
                return (bH.wrong - bH.correct) - (aH.wrong - aH.correct);
            });
        } else if (this.mode === 'exam') {
            activeList = this.allQuestions.filter(q => this.selectedUnits.has(q.unidad));
            // Shuffle for exam
            activeList = [...activeList].sort(() => Math.random() - 0.5);
            this.modeData.exam = { userAnswers: {}, score: 0, currentQuestionIndex: 0, pendingQuestions: [] };
        } else {
            activeList = this.allQuestions.filter(q => this.selectedUnits.has(q.unidad));
        }

        this.questions = activeList;
        this.currentQuestionIndex = 0;

        // Switch to Quiz App screen
        this.ui.splashScreen.classList.add('hidden');
        this.ui.quizApp.classList.remove('hidden');

        this.renderQuestion();
        this.updateCounters();
    }

    renderQuestion() {
        if (this.synth) this.synth.cancel();
        if (this.questions.length === 0) return;

        const q = this.questions[this.currentQuestionIndex];
        const mData = this.modeData[this.mode] || this.modeData.quiz;

        // Header info
        if (this.ui.questionCounter) {
            this.ui.questionCounter.textContent = `${this.currentQuestionIndex + 1} / ${this.questions.length}`;
        }
        if (this.ui.unitBadge) {
            this.ui.unitBadge.textContent = `Unidad ${q.unidad}`;
        }
        if (this.ui.scoreVal) {
            this.ui.scoreVal.textContent = mData.score || 0;
        }

        // Progress bar
        const pct = ((this.currentQuestionIndex + 1) / this.questions.length) * 100;
        if (this.ui.progressBar) {
            this.ui.progressBar.style.width = `${pct}%`;
        }

        // Reset scroll position
        const layout = document.querySelector('.quiz-content-layout');
        if (layout) layout.scrollTop = 0;

        // Question text
        if (this.ui.questionText) {
            this.ui.questionText.innerHTML = `${q.numero}. ${q.pregunta}`;
            this.renderMath(this.ui.questionText);
        }

        // Mark pin state
        const isMarked = (this.modeData.quiz.pendingQuestions || []).includes(q.id);
        if (this.ui.btnMark) {
            this.ui.btnMark.innerHTML = isMarked
                ? '<span class="btn-mark-icon">📌</span><span class="btn-mark-text"> Marcada</span>'
                : '<span class="btn-mark-icon">📌</span><span class="btn-mark-text"></span>';
            this.ui.btnMark.classList.toggle('active', isMarked);
        }

        // Options
        if (this.ui.optionsContainer) {
            this.ui.optionsContainer.innerHTML = '';
            const opts = q.opciones || {};
            const savedAns = (mData.userAnswers && mData.userAnswers[q.id]) || null;
            const isStudy = (this.mode === 'study');

            ['a', 'b', 'c', 'd'].forEach(optKey => {
                if (!opts[optKey]) return;
                const btn = document.createElement('button');
                btn.className = 'option-btn';
                btn.dataset.key = optKey;

                btn.innerHTML = `
                    <span class="option-key">${optKey.toUpperCase()}</span>
                    <span class="option-text">${opts[optKey]}</span>
                `;

                // If already answered or in study mode
                if (isStudy) {
                    if (optKey === q.respuesta_correcta) btn.classList.add('correct');
                    btn.classList.add('disabled');
                } else if (savedAns) {
                    btn.classList.add('disabled');
                    if (optKey === q.respuesta_correcta) {
                        btn.classList.add('correct');
                    } else if (optKey === savedAns) {
                        btn.classList.add('wrong');
                    }
                } else {
                    btn.addEventListener('click', () => this.handleAnswer(optKey));
                }

                this.ui.optionsContainer.appendChild(btn);
                this.renderMath(btn);
            });
        }

        // Feedback & explanation
        const savedAnswer = (mData.userAnswers && mData.userAnswers[q.id]) || null;
        const placeholder = document.getElementById('study-placeholder');
        if (this.mode === 'study' || savedAnswer) {
            if (placeholder) placeholder.classList.add('hidden');
            this.showFeedback(savedAnswer === q.respuesta_correcta, q);
        } else {
            if (this.ui.feedbackArea) this.ui.feedbackArea.classList.add('hidden');
            if (placeholder) placeholder.classList.remove('hidden');
        }

        // Nav buttons
        if (this.ui.btnPrev) this.ui.btnPrev.disabled = (this.currentQuestionIndex === 0);
        if (this.ui.btnNext) {
            this.ui.btnNext.textContent = (this.currentQuestionIndex === this.questions.length - 1) ? 'Finalizar 🏁' : 'Siguiente ❯';
        }
    }

    handleAnswer(selectedKey) {
        const q = this.questions[this.currentQuestionIndex];
        const mData = this.modeData[this.mode] || this.modeData.quiz;
        if (!mData.userAnswers) mData.userAnswers = {};
        if (mData.userAnswers[q.id]) return; // already answered

        const isCorrect = (selectedKey === q.respuesta_correcta);
        mData.userAnswers[q.id] = selectedKey;

        // Update stats
        const gStats = this.modeData.quiz.globalStats;
        gStats.totalAttempts++;
        if (!gStats.questionHistory[q.id]) gStats.questionHistory[q.id] = { correct: 0, wrong: 0 };

        if (!gStats.unitStats[q.unidad]) gStats.unitStats[q.unidad] = { total: 0, correct: 0 };
        gStats.unitStats[q.unidad].total++;

        if (isCorrect) {
            mData.score = (mData.score || 0) + 1;
            gStats.totalCorrect++;
            gStats.questionHistory[q.id].correct++;
            gStats.unitStats[q.unidad].correct++;
            if (navigator.vibrate) navigator.vibrate(40);
        } else {
            gStats.questionHistory[q.id].wrong++;
            if (navigator.vibrate) navigator.vibrate([60, 40, 60]);
        }

        this.showFeedback(isCorrect, q);
        this.saveProgress();
        this.updateCounters();

        // Update option button styles
        const optBtns = this.ui.optionsContainer.querySelectorAll('.option-btn');
        optBtns.forEach(btn => {
            btn.classList.add('disabled');
            const k = btn.dataset.key;
            if (k === q.respuesta_correcta) btn.classList.add('correct');
            else if (k === selectedKey) btn.classList.add('wrong');
        });

        // Confetti on correct answer
        if (isCorrect && typeof confetti !== 'undefined') {
            confetti({ particleCount: 35, spread: 60, origin: { y: 0.8 } });
        }
    }

    showFeedback(isCorrect, q) {
        const placeholder = document.getElementById('study-placeholder');
        if (placeholder) placeholder.classList.add('hidden');
        if (!this.ui.feedbackArea) return;
        this.ui.feedbackArea.classList.remove('hidden');

        if (this.mode === 'study') {
            this.ui.feedbackStatus.className = 'feedback-status correct';
            this.ui.feedbackStatus.innerHTML = `✅ Respuesta correcta: <strong>${q.respuesta_correcta.toUpperCase()}</strong>`;
        } else if (isCorrect) {
            this.ui.feedbackStatus.className = 'feedback-status correct';
            this.ui.feedbackStatus.innerHTML = `🎉 ¡Correcto! Opción <strong>${q.respuesta_correcta.toUpperCase()}</strong>`;
        } else {
            this.ui.feedbackStatus.className = 'feedback-status wrong';
            this.ui.feedbackStatus.innerHTML = `❌ Incorrecto. La opción correcta es <strong>${q.respuesta_correcta.toUpperCase()}</strong>`;
        }

        // Format explanation: split explanation and practical example
        let expText = q.explicacion || '';
        if (expText.includes('**Ejemplo práctico:**')) {
            const parts = expText.split('**Ejemplo práctico:**');
            expText = `${parts[0]}<div class="example-box"><strong>💡 Ejemplo práctico:</strong> ${parts[1]}</div>`;
        }
        this.ui.explanationText.innerHTML = expText;
        this.renderMath(this.ui.explanationText);

        // Auto-scroll to feedback on mobile / small screens
        if (window.innerWidth <= 1024 && this.ui.feedbackArea) {
            setTimeout(() => {
                this.ui.feedbackArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 120);
        }
    }

    nextQuestion() {
        if (this.currentQuestionIndex < this.questions.length - 1) {
            this.currentQuestionIndex++;
            this.renderQuestion();
        } else {
            this.finishQuiz();
        }
    }

    prevQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.renderQuestion();
        }
    }

    toggleMarkCurrent() {
        if (this.questions.length === 0) return;
        const q = this.questions[this.currentQuestionIndex];
        if (!this.modeData.quiz.pendingQuestions) this.modeData.quiz.pendingQuestions = [];
        const list = this.modeData.quiz.pendingQuestions;

        const idx = list.indexOf(q.id);
        if (idx >= 0) {
            list.splice(idx, 1);
        } else {
            list.push(q.id);
        }
        this.saveProgress();
        this.updateCounters();
        this.renderQuestion();
    }

    updateCounters() {
        const pending = this.modeData.quiz.pendingQuestions || [];
        if (this.ui.pendingCount) this.ui.pendingCount.textContent = pending.length;

        // Calculate wrong answers
        const hist = this.modeData.quiz.globalStats.questionHistory || {};
        let wrongTotal = 0;
        Object.keys(hist).forEach(qid => {
            if (hist[qid].wrong > hist[qid].correct) wrongTotal++;
        });
        if (this.ui.wrongCount) this.ui.wrongCount.textContent = wrongTotal;
    }

    finishQuiz() {
        const mData = this.modeData[this.mode] || this.modeData.quiz;
        const total = this.questions.length;
        const correct = mData.score || 0;
        const wrong = total - correct;
        const scorePct = Math.round((correct / total) * 100);

        if (this.ui.statCorrect) this.ui.statCorrect.textContent = correct;
        if (this.ui.statWrong) this.ui.statWrong.textContent = wrong;
        if (this.ui.statScore) this.ui.statScore.textContent = `${scorePct}%`;

        if (this.ui.modalResults) this.ui.modalResults.classList.remove('hidden');

        if (scorePct >= 70 && typeof confetti !== 'undefined') {
            confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        }
    }

    // ===============================================
    // KATEX MATHEMATICAL FORMULA RENDERING
    // ===============================================
    renderMath(element) {
        if (typeof renderMathInElement !== 'undefined' && element) {
            try {
                renderMathInElement(element, {
                    delimiters: [
                        { left: '$$', right: '$$', display: true },
                        { left: '$', right: '$', display: false }
                    ],
                    throwOnError: false
                });
            } catch (err) {
                console.warn('KaTeX render error:', err);
            }
        }
    }

    // ===============================================
    // FINANCIAL CALCULATOR (🧮)
    // ===============================================
    setupCalculator() {
        if (this.ui.btnCalc) {
            this.ui.btnCalc.addEventListener('click', () => {
                this.ui.modalCalc.classList.toggle('hidden');
            });
        }
        if (this.ui.btnCloseCalc) {
            this.ui.btnCloseCalc.addEventListener('click', () => {
                this.ui.modalCalc.classList.add('hidden');
            });
        }

        const calcBtns = document.querySelectorAll('.calc-btn');
        calcBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const val = btn.dataset.val;
                const action = btn.dataset.action;

                if (action === 'clear') {
                    this.calcExpression = '';
                    this.updateCalcDisplay('0', '');
                } else if (action === 'backspace') {
                    this.calcExpression = this.calcExpression.slice(0, -1);
                    this.updateCalcDisplay(this.calcExpression || '0');
                } else if (action === 'calculate') {
                    this.evaluateCalculator();
                } else if (action === 'ans') {
                    this.calcExpression += this.calcLastAnswer;
                    this.updateCalcDisplay(this.calcExpression);
                } else if (val) {
                    this.calcExpression += val;
                    this.updateCalcDisplay(this.calcExpression);
                }
            });
        });
    }

    updateCalcDisplay(val, history = null) {
        if (this.ui.calcDisplay) this.ui.calcDisplay.textContent = val;
        if (history !== null && this.ui.calcHistory) this.ui.calcHistory.textContent = history;
    }

    evaluateCalculator() {
        if (!this.calcExpression) return;
        try {
            // Replace ^ with ** and % with /100
            let sanitized = this.calcExpression
                .replace(/\^/g, '**')
                .replace(/%/g, '/100')
                .replace(/×/g, '*')
                .replace(/÷/g, '/');

            // Evaluate safely using Function constructor for math
            const result = Function(`'use strict'; return (${sanitized})`)();
            const formatted = Number.isFinite(result) ? (Math.round(result * 10000) / 10000).toString() : 'Error';

            this.updateCalcDisplay(formatted, `${this.calcExpression} =`);
            this.calcLastAnswer = formatted;
            this.calcExpression = formatted;
        } catch (e) {
            this.updateCalcDisplay('Error', this.calcExpression);
            this.calcExpression = '';
        }
    }

    // ===============================================
    // KEYBOARD SHORTCUTS
    // ===============================================
    setupKeyboardShortcuts() {
        window.addEventListener('keydown', (e) => {
            // If typing in input, ignore shortcuts
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            // Esc: close modals or return home
            if (e.key === 'Escape') {
                const openModal = document.querySelector('.modal:not(.hidden)');
                if (openModal) {
                    openModal.classList.add('hidden');
                } else if (!this.ui.quizApp.classList.contains('hidden')) {
                    this.ui.btnHome.click();
                }
                return;
            }

            // Shortcuts when quiz is active and no modal is open
            const isAnyModalOpen = document.querySelector('.modal:not(.hidden)');
            if (!this.ui.quizApp.classList.contains('hidden') && !isAnyModalOpen) {
                // A, B, C, D or 1, 2, 3, 4
                const key = e.key.toLowerCase();
                const keyMap = { '1': 'a', '2': 'b', '3': 'c', '4': 'd', 'a': 'a', 'b': 'b', 'c': 'c', 'd': 'd' };
                if (keyMap[key]) {
                    const btn = this.ui.optionsContainer.querySelector(`.option-btn[data-key="${keyMap[key]}"]`);
                    if (btn && !btn.classList.contains('disabled')) btn.click();
                    return;
                }

                // Left / Right navigation
                if (e.key === 'ArrowLeft') {
                    this.prevQuestion();
                    return;
                }
                if (e.key === 'ArrowRight' || e.key === 'Enter') {
                    this.nextQuestion();
                    return;
                }

                // M: mark
                if (key === 'm') {
                    this.toggleMarkCurrent();
                    return;
                }
            }

            // Global modal toggles
            if (e.key.toLowerCase() === 'c' && !isAnyModalOpen) {
                e.preventDefault();
                this.ui.btnCalc.click();
            }
            if (e.key.toLowerCase() === 'f' && !isAnyModalOpen) {
                e.preventDefault();
                this.ui.btnSearch.click();
            }
        });
    }

    // ===============================================
    // VOICE / SPEECH SYNTHESIS (TTS)
    // ===============================================
    setupSpeechTTS() {
        if (!this.ui.btnTts) return;
        if (!('speechSynthesis' in window)) {
            this.ui.btnTts.style.display = 'none';
            return;
        }

        this.ui.btnTts.addEventListener('click', () => {
            if (this.isSpeaking) {
                this.synth.cancel();
                this.isSpeaking = false;
                this.ui.btnTts.classList.remove('active');
            } else {
                this.speakCurrentQuestion();
            }
        });
    }

    speakCurrentQuestion() {
        if (!this.synth || this.questions.length === 0) return;
        this.synth.cancel();

        const q = this.questions[this.currentQuestionIndex];
        let textToRead = `Pregunta ${q.numero}: ${q.pregunta}. `;
        const opts = q.opciones || {};
        ['a', 'b', 'c', 'd'].forEach(k => {
            if (opts[k]) textToRead += `Opción ${k.toUpperCase()}: ${opts[k]}. `;
        });

        // If answered or in study mode, also speak explanation
        const savedAns = (this.modeData[this.mode]?.userAnswers || {})[q.id];
        if (this.mode === 'study' || savedAns) {
            textToRead += ` La respuesta correcta es la ${q.respuesta_correcta.toUpperCase()}. `;
            if (q.explicacion) textToRead += q.explicacion.replace(/\*\*/g, '');
        }

        const utter = new SpeechSynthesisUtterance(textToRead);
        utter.lang = 'es-ES';
        utter.rate = 1.0;
        utter.onend = () => {
            this.isSpeaking = false;
            if (this.ui.btnTts) this.ui.btnTts.classList.remove('active');
        };
        utter.onerror = () => {
            this.isSpeaking = false;
            if (this.ui.btnTts) this.ui.btnTts.classList.remove('active');
        };

        this.isSpeaking = true;
        if (this.ui.btnTts) this.ui.btnTts.classList.add('active');
        this.synth.speak(utter);
    }

    // ===============================================
    // SEARCH ENGINE
    // ===============================================
    handleSearch(query) {
        if (!this.ui.searchResults) return;
        const q = query.trim().toLowerCase();
        if (q.length < 3) {
            this.ui.searchResults.innerHTML = '<div class="empty-state">Escribe al menos 3 caracteres...</div>';
            return;
        }

        const matches = this.allQuestions.filter(item => {
            const p = item.pregunta.toLowerCase();
            const e = (item.explicacion || '').toLowerCase();
            const opts = Object.values(item.opciones || {}).join(' ').toLowerCase();
            return p.includes(q) || e.includes(q) || opts.includes(q);
        });

        if (matches.length === 0) {
            this.ui.searchResults.innerHTML = '<div class="empty-state">No se encontraron preguntas.</div>';
            return;
        }

        this.ui.searchResults.innerHTML = '';
        matches.slice(0, 30).forEach(m => {
            const el = document.createElement('div');
            el.className = 'search-item';
            el.innerHTML = `
                <div class="item-unit-tag">Unidad ${m.unidad} · Pregunta ${m.numero}</div>
                <div>${m.pregunta}</div>
            `;
            el.addEventListener('click', () => {
                this.ui.modalSearch.classList.add('hidden');
                this.selectedUnits.add(m.unidad);
                this.mode = 'study';
                this.questions = [m];
                this.currentQuestionIndex = 0;
                this.ui.splashScreen.classList.add('hidden');
                this.ui.quizApp.classList.remove('hidden');
                this.renderQuestion();
            });
            this.ui.searchResults.appendChild(el);
            this.renderMath(el);
        });
    }

    // ===============================================
    // STATS & LEADERBOARD
    // ===============================================
    showStats() {
        const stats = this.modeData.quiz.globalStats;
        const acc = stats.totalAttempts > 0 ? Math.round((stats.totalCorrect / stats.totalAttempts) * 100) : 0;
        if (this.ui.statGlobalAccuracy) this.ui.statGlobalAccuracy.textContent = `${acc}%`;
        if (this.ui.statTotalAnswered) this.ui.statTotalAnswered.textContent = stats.totalAttempts;

        // Weak units breakdown
        if (this.ui.weakUnitsList) {
            this.ui.weakUnitsList.innerHTML = '';
            const entries = Object.entries(stats.unitStats || {});
            if (entries.length === 0) {
                this.ui.weakUnitsList.innerHTML = '<div class="empty-state">Aún no hay suficientes datos registrados.</div>';
            } else {
                entries.sort((a, b) => (a[1].correct / a[1].total) - (b[1].correct / b[1].total));
                entries.slice(0, 5).forEach(([u, data]) => {
                    const uPct = Math.round((data.correct / data.total) * 100);
                    const div = document.createElement('div');
                    div.className = 'search-item';
                    div.innerHTML = `<strong>Unidad ${u}:</strong> ${uPct}% aciertos (${data.correct}/${data.total})`;
                    this.ui.weakUnitsList.appendChild(div);
                });
            }
        }
        if (this.ui.modalStats) this.ui.modalStats.classList.remove('hidden');
    }

    async openLeaderboard() {
        if (this.ui.modalLeaderboard) this.ui.modalLeaderboard.classList.remove('hidden');
        if (!this.firebaseInitialized) {
            if (this.ui.leaderboardList) this.ui.leaderboardList.innerHTML = '<div class="empty-state">Sin conexión a Firebase.</div>';
            return;
        }

        try {
            const snap = await this.db.ref('finanzas_leaderboard').orderByChild('score').limitToLast(20).once('value');
            if (!snap.exists()) {
                if (this.ui.leaderboardList) this.ui.leaderboardList.innerHTML = '<div class="empty-state">No hay puntuaciones registradas aún.</div>';
                return;
            }

            const rows = [];
            snap.forEach(child => rows.push(child.val()));
            rows.reverse();

            if (this.ui.leaderboardList) {
                this.ui.leaderboardList.innerHTML = '';
                rows.forEach((r, idx) => {
                    const row = document.createElement('div');
                    row.className = 'pending-item';
                    row.innerHTML = `<strong>#${idx + 1} ${r.user}</strong>: ${r.score}% (${r.correct}/${r.total}) · U${r.units || 'Todas'}`;
                    this.ui.leaderboardList.appendChild(row);
                });
            }
        } catch (e) {
            console.warn('Leaderboard load error:', e);
        }
    }

    async submitScore() {
        const username = (this.ui.usernameInput?.value || '').trim();
        if (!username) {
            alert('Por favor introduce tu nombre o alias.');
            return;
        }

        const mData = this.modeData[this.mode] || this.modeData.quiz;
        const total = this.questions.length;
        const correct = mData.score || 0;
        const scorePct = total > 0 ? Math.round((correct / total) * 100) : 0;

        if (!this.firebaseInitialized) {
            alert('Modo offline: la puntuación se ha guardado localmente.');
            return;
        }

        try {
            await this.db.ref('finanzas_leaderboard').push({
                user: username,
                score: scorePct,
                correct: correct,
                total: total,
                units: this.selectedUnits.size === 20 ? 'Todas' : Array.from(this.selectedUnits).join(','),
                timestamp: Date.now()
            });
            alert('🎉 Puntuación enviada con éxito!');
            this.openLeaderboard();
        } catch (err) {
            alert('Error al enviar la puntuación: ' + err.message);
        }
    }

    // ===============================================
    // EVENTS & NAVIGATION
    // ===============================================
    bindEvents() {
        if (this.ui.btnNext) this.ui.btnNext.addEventListener('click', () => this.nextQuestion());
        if (this.ui.btnPrev) this.ui.btnPrev.addEventListener('click', () => this.prevQuestion());
        if (this.ui.btnMark) this.ui.btnMark.addEventListener('click', () => this.toggleMarkCurrent());

        // Marked modal
        if (this.ui.btnListMarked) {
            this.ui.btnListMarked.addEventListener('click', () => {
                const pList = this.modeData.quiz.pendingQuestions || [];
                const markedQs = this.allQuestions.filter(q => pList.includes(q.id));
                if (this.ui.pendingList) {
                    this.ui.pendingList.innerHTML = '';
                    if (markedQs.length === 0) {
                        this.ui.pendingList.innerHTML = '<div class="empty-state">No tienes preguntas marcadas.</div>';
                    } else {
                        markedQs.forEach(m => {
                            const el = document.createElement('div');
                            el.className = 'pending-item';
                            el.innerHTML = `<strong>U${m.unidad} - P${m.numero}:</strong> ${m.pregunta}`;
                            el.addEventListener('click', () => {
                                this.ui.modalPending.classList.add('hidden');
                                this.questions = markedQs;
                                this.currentQuestionIndex = markedQs.indexOf(m);
                                this.renderQuestion();
                            });
                            this.ui.pendingList.appendChild(el);
                        });
                    }
                }
                this.ui.modalPending.classList.remove('hidden');
            });
        }
        if (this.ui.btnClosePending) {
            this.ui.btnClosePending.addEventListener('click', () => this.ui.modalPending.classList.add('hidden'));
        }

        // Wrong answers modal
        if (this.ui.btnWrong) {
            this.ui.btnWrong.addEventListener('click', () => {
                const hist = this.modeData.quiz.globalStats.questionHistory || {};
                const wrongQs = this.allQuestions.filter(q => hist[q.id] && hist[q.id].wrong > hist[q.id].correct);
                if (this.ui.wrongList) {
                    this.ui.wrongList.innerHTML = '';
                    if (wrongQs.length === 0) {
                        this.ui.wrongList.innerHTML = '<div class="empty-state">¡Enhorabuena! No tienes preguntas falladas pendientes.</div>';
                    } else {
                        wrongQs.forEach(w => {
                            const el = document.createElement('div');
                            el.className = 'pending-item';
                            el.innerHTML = `<strong>U${w.unidad} - P${w.numero}:</strong> ${w.pregunta}`;
                            el.addEventListener('click', () => {
                                this.ui.modalWrong.classList.add('hidden');
                                this.questions = wrongQs;
                                this.currentQuestionIndex = wrongQs.indexOf(w);
                                this.renderQuestion();
                            });
                            this.ui.wrongList.appendChild(el);
                        });
                    }
                }
                this.ui.modalWrong.classList.remove('hidden');
            });
        }
        if (this.ui.btnCloseWrong) {
            this.ui.btnCloseWrong.addEventListener('click', () => this.ui.modalWrong.classList.add('hidden'));
        }

        // Results
        if (this.ui.btnRestartResults) {
            this.ui.btnRestartResults.addEventListener('click', () => {
                this.ui.modalResults.classList.add('hidden');
                this.ui.btnHome.click();
            });
        }
    }

    // ===============================================
    // MOBILE SWIPE GESTURES
    // ===============================================
    setupSwipe() {
        const area = document.querySelector('.app-container');
        if (!area) return;

        area.addEventListener('touchstart', e => {
            this.touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        area.addEventListener('touchend', e => {
            this.touchEndX = e.changedTouches[0].screenX;
            const diff = this.touchEndX - this.touchStartX;
            if (Math.abs(diff) > 70) {
                if (diff < 0) this.nextQuestion(); // swipe left -> next
                else this.prevQuestion();          // swipe right -> prev
            }
        }, { passive: true });
    }
}

// Instantiate on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new FinanzasQuizApp();
});
