// === Переключение вкладок ===
const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

tabButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    tabButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const tabId = btn.dataset.tab;
    tabContents.forEach(c => {
      c.classList.add("hidden");
      if (c.id === tabId) c.classList.remove("hidden");
    });
  });
});

// === Модальное окно ===
const modal = document.getElementById("modal");
const modalText = document.getElementById("modal-text");
const closeModal = document.getElementById("close-modal");
const downloadBtn = document.getElementById("download-btn");

downloadBtn.addEventListener("click", () => {
  modalText.textContent = "Скоро релиз! 🚀";
  modal.style.display = "flex";
});

closeModal.addEventListener("click", () => {
  modal.style.display = "none";
});

window.addEventListener("click", (e) => {
  if (e.target === modal) modal.style.display = "none";
});

// === Ошибка кнопки (пример) ===
downloadBtn.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  downloadBtn.classList.add("shake");
  setTimeout(() => downloadBtn.classList.remove("shake"), 400);
});

// === Локальный аккаунт ===
const accountArea = document.getElementById("account-area");

function loadAccount() {
  const account = JSON.parse(localStorage.getItem("betterClientAccount"));
  if (account) {
    accountArea.innerHTML = `
      <p><i class="fa-solid fa-user"></i> Логин: <b>${account.username}</b></p>
      <p><i class="fa-solid fa-calendar"></i> Дата регистрации: ${account.date}</p>
      <button id="logout-btn"><i class="fa-solid fa-right-from-bracket"></i> Выйти</button>
    `;
    document.getElementById("logout-btn").addEventListener("click", () => {
      localStorage.removeItem("betterClientAccount");
      loadAccount();
    });
  } else {
    accountArea.innerHTML = `
      <p>Создайте аккаунт:</p>
      <input type="text" id="username-input" placeholder="Введите логин">
      <button id="register-btn"><i class="fa-solid fa-user-plus"></i> Зарегистрироваться</button>
    `;
    document.getElementById("register-btn").addEventListener("click", () => {
      const username = document.getElementById("username-input").value.trim();
      if (!username) {
        modalText.textContent = "Введите имя!";
        modal.style.display = "flex";
        return;
      }
      const date = new Date().toLocaleString();
      const newAccount = { username, date };
      localStorage.setItem("betterClientAccount", JSON.stringify(newAccount));
      loadAccount();
    });
  }
}

loadAccount();

// === Фон, реагирующий на курсор ===
document.addEventListener("mousemove", (e) => {
  const x = e.clientX / window.innerWidth;
  const y = e.clientY / window.innerHeight;
  const red = Math.floor(128 + 127 * x);
  const black = Math.floor(50 + 50 * (1 - y));

  document.body.style.background = `linear-gradient(135deg, rgb(${black},0,0), rgb(${red},0,0))`;
  if (document.body.style.backgroundImage.includes("bg.png")) {
    document.body.style.backgroundImage = `url("bg.png"), linear-gradient(135deg, rgb(${black},0,0), rgb(${red},0,0))`;
  }
});
