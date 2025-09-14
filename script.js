// ======== Динамичный фон ========
document.addEventListener("mousemove", e => {
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    const red = Math.floor(128 + 127 * x);
    const black = Math.floor(50 + 50 * (1 - y));
    document.body.style.background = `linear-gradient(135deg,rgb(${black},0,0),rgb(${red},0,0))`;
});

// ======== Модальное окно ========
const modal = document.getElementById("modal");
const modalText = document.getElementById("modal-text");
const closeModal = document.getElementById("close-modal");
closeModal.addEventListener("click", () => modal.style.display = "none");
window.addEventListener("click", e => { if (e.target === modal) modal.style.display = "none"; });
function showModal(msg) { modalText.textContent = msg; modal.style.display = "flex"; }

// ======== LocalStorage аккаунты ========
let accounts = JSON.parse(localStorage.getItem("betterClientAccounts")) || [];
if (accounts.length === 0) { // если пусто, создаем дефолтные аккаунты
    accounts = [
        { id: 1, username: "Owner", password: "owner123", rank: "Owner", date: new Date().toLocaleString() },
        { id: 2, username: "Mod", password: "mod123", rank: "Mod", date: new Date().toLocaleString() },
        { id: 3, username: "Coder", password: "code123", rank: "Coder", date: new Date().toLocaleString() }
    ];
    localStorage.setItem("betterClientAccounts", JSON.stringify(accounts));
}

// ======== Выдача прав через консоль ========
window.giveAdmin = (nick, rank) => {
    const user = accounts.find(a => a.username.toLowerCase() === nick.toLowerCase());
    if (!user) { console.warn("Пользователь не найден"); return; }
    user.rank = rank;
    localStorage.setItem("betterClientAccounts", JSON.stringify(accounts));
    console.log(`Пользователю ${nick} выдан ранг ${rank}`);
};

// ======== SPA вкладки ========
const tabButtons = document.querySelectorAll(".toolbar button");
const tabContents = document.querySelectorAll(".tab-content");
tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        tabButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const tab = btn.dataset.tab;
        tabContents.forEach(c => c.classList.add("hidden"));
        document.getElementById(tab).classList.remove("hidden");
    });
});

// ======== Аутентификация (локально) ========
const authArea = document.getElementById("auth-area");
let currentUser = JSON.parse(localStorage.getItem("betterClientAccount"));

// Проверка валидности ника
function isValidNick(nick) { return /^[A-Za-z]+$/.test(nick); }
function isUniqueNick(nick) { return !accounts.some(acc => acc.username.toLowerCase() === nick.toLowerCase()); }

// ======== Рендер аккаунта ========
function renderAuth() {
    if (!authArea) return;
    authArea.innerHTML = "";
    if (currentUser) {
        const rankClass = `rank-${currentUser.rank}`;
        authArea.innerHTML = `
            <p>Ник: <b>${currentUser.username}</b></p>
            <p>Ранг: <b class="${rankClass}">${currentUser.rank}</b></p>
            <p>Дата регистрации: ${currentUser.date}</p>
            <button id="logout-btn" class="auth-btn"><i class="fa-solid fa-right-from-bracket"></i> Выйти</button>
        `;
        document.getElementById("logout-btn").addEventListener("click", () => {
            currentUser = null;
            localStorage.removeItem("betterClientAccount");
            renderAuth();
            renderAdmin();
        });
    } else {
        authArea.innerHTML = `
            <button id="show-login" class="auth-btn">Вход</button>
            <button id="show-register" class="auth-btn">Регистрация</button>
            <div id="auth-form" style="margin-top:10px;"></div>
        `;
        document.getElementById("show-login").addEventListener("click", () => renderLogin());
        document.getElementById("show-register").addEventListener("click", () => renderRegister());
    }
}

// ======== Форма регистрации ========
function renderRegister() {
    const form = document.getElementById("auth-form");
    form.innerHTML = `
        <input id="reg-nick" placeholder="Ник (только английские)"/>
        <input id="reg-pass" type="password" placeholder="Пароль"/>
        <button id="reg-btn" class="auth-btn">Зарегистрироваться</button>
    `;
    document.getElementById("reg-btn").addEventListener("click", () => {
        const nick = document.getElementById("reg-nick").value.trim();
        const pass = document.getElementById("reg-pass").value.trim();
        if (!nick || !pass) { showModal("Введите ник и пароль!"); return; }
        if (!isValidNick(nick)) { showModal("Ник только на английском!"); return; }
        if (!isUniqueNick(nick)) { showModal("Ник уже занят!"); return; }
        const id = accounts.length ? accounts[accounts.length - 1].id + 1 : 1;
        const newAcc = { id, username: nick, password: pass, rank: "User", date: new Date().toLocaleString() };
        accounts.push(newAcc);
        localStorage.setItem("betterClientAccounts", JSON.stringify(accounts));
        currentUser = newAcc;
        localStorage.setItem("betterClientAccount", JSON.stringify(currentUser));
        renderAuth();
        renderAdmin();
    });
}

// ======== Форма входа ========
function renderLogin() {
    const form = document.getElementById("auth-form");
    form.innerHTML = `
        <input id="login-nick" placeholder="Ник"/>
        <input id="login-pass" type="password" placeholder="Пароль"/>
        <button id="login-btn" class="auth-btn">Войти</button>
    `;
    document.getElementById("login-btn").addEventListener("click", () => {
        const nick = document.getElementById("login-nick").value.trim();
        const pass = document.getElementById("login-pass").value.trim();
        const user = accounts.find(a => a.username.toLowerCase() === nick.toLowerCase() && a.password === pass);
        if (!user) { showModal("Неверный логин или пароль!"); return; }
        currentUser = user;
        localStorage.setItem("betterClientAccount", JSON.stringify(currentUser));
        renderAuth();
        renderAdmin();
    });
}

// ======== Админ-панель ========
const adminArea = document.getElementById("admin-area");
function renderAdmin() {
    if (!adminArea) return;
    if (!currentUser || !["Owner", "Admin", "Mod", "Coder"].includes(currentUser.rank)) {
        adminArea.innerHTML = "<p>Нет доступа</p>";
        return;
    }
    adminArea.innerHTML = `
        <input id="search-input" placeholder="Поиск по нику или ID"/>
        <button id="search-btn" class="auth-btn">Поиск</button>
        <div id="search-result" style="margin-top:10px;"></div>
    `;
    document.getElementById("search-btn").addEventListener("click", () => {
        const val = document.getElementById("search-input").value.trim().toLowerCase();
        const results = accounts.filter(a => a.username.toLowerCase().includes(val) || a.id.toString() === val);
        const resDiv = document.getElementById("search-result");
        if (!results.length) { resDiv.innerHTML = "<p>Ничего не найдено</p>"; return; }
        resDiv.innerHTML = results.map(r => `<p>ID:${r.id} | Ник: ${r.username} | Ранг: <b class="rank-${r.rank}">${r.rank}</b></p>`).join("");
    });
}

// ======== Инициализация ========
renderAuth();
renderAdmin();
