// === Плавное появление блоков ===
document.addEventListener("DOMContentLoaded", () => {
  const sections = document.querySelectorAll(".fade-in");

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  sections.forEach(sec => observer.observe(sec));
});

// === Модальное окно ===
const modal = document.getElementById("modal");
const modalText = document.getElementById("modal-text");
const closeModal = document.getElementById("close-modal");
const downloadBtn = document.getElementById("download-btn");

downloadBtn.addEventListener("click", () => {
  // Вместо alert открываем модальное окно
  modalText.textContent = "Скоро релиз! Ожидайте 🚀";
  modal.style.display = "flex";
});

closeModal.addEventListener("click", () => {
  modal.style.display = "none";
});

window.addEventListener("click", (e) => {
  if (e.target === modal) modal.style.display = "none";
});

// === Ошибка кнопки (демо) ===
// Если клик правой кнопкой мыши на кнопку, она покачается
downloadBtn.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  downloadBtn.classList.add("shake");
  setTimeout(() => downloadBtn.classList.remove("shake"), 400);
});

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
