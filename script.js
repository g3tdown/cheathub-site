// ======== Куб динамика / фон ========
document.addEventListener("mousemove", e=>{
  const x = e.clientX/window.innerWidth;
  const y = e.clientY/window.innerHeight;
  const red = Math.floor(128+127*x);
  const black = Math.floor(50+50*(1-y));
  document.body.style.background = `linear-gradient(135deg, rgb(${black},0,0), rgb(${red},0,0))`;
});

// ======== Панель вкладок ========
const tabButtons = document.querySelectorAll(".toolbar button");
const tabContents = document.querySelectorAll(".tab-content");

tabButtons.forEach(btn=>{
  btn.addEventListener("click",()=>{
    tabButtons.forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");

    const tab = btn.dataset.tab;
    tabContents.forEach(c=>{
      c.classList.add("hidden");
      if(c.id===tab) c.classList.remove("hidden");
    });
  });
});

// ======== Модальное окно ========
const modal=document.getElementById("modal");
const modalText=document.getElementById("modal-text");
const closeModal=document.getElementById("close-modal");
closeModal.addEventListener("click",()=>modal.style.display="none");
window.addEventListener("click", e=>{if(e.target===modal) modal.style.display="none";});

// ======== Локальные аккаунты ========
let accounts=[
  {username:"Creator",password:"123",rank:"Creator"},
  {username:"Mod",password:"modpass",rank:"Moderator"}
]; // можно эмулировать fetch из JSON

const accountArea=document.getElementById("account-area");

function isValidNick(nick){
  return /^[A-Za-z]+$/.test(nick);
}

function isUniqueNick(nick){
  return !accounts.some(acc=>acc.username.toLowerCase()===nick.toLowerCase());
}

function renderAccountArea(){
  const acc=JSON.parse(localStorage.getItem("betterClientAccount"));
  if(acc){
    const rankClass = `rank-${acc.rank}`;
    accountArea.innerHTML=`
      <p>Ник: <b>${acc.username}</b></p>
      <p>Ранг: <b class="${rankClass}">${acc.rank}</b></p>
      <p>Дата регистрации: ${acc.date}</p>
      <button id="logout-btn"><i class="fa-solid fa-right-from-bracket"></i> Выйти</button>
    `;
    document.getElementById("logout-btn").addEventListener("click", ()=>{
      localStorage.removeItem("betterClientAccount");
      renderAccountArea();
    });
  } else {
    accountArea.innerHTML=`
      <p>Регистрация:</p>
      <input type="text" id="nick-input" placeholder="Ник (только английские буквы)">
      <input type="password" id="pass-input" placeholder="Пароль">
      <button id="register-btn"><i class="fa-solid fa-user-plus"></i> Зарегистрироваться</button>
    `;
    document.getElementById("register-btn").addEventListener("click", ()=>{
      const nick=document.getElementById("nick-input").value.trim();
      const pass=document.getElementById("pass-input").value.trim();
      if(!nick || !pass){showModal("Введите ник и пароль!"); return;}
      if(!isValidNick(nick)){showModal("Ник только на английском!"); return;}
      if(!isUniqueNick(nick)){showModal("Ник уже существует!"); return;}
      const date=new Date().toLocaleString();
      const newAcc={username:nick,password:pass,rank:"User",date};
      accounts.push(newAcc);
      localStorage.setItem("betterClientAccount",JSON.stringify(newAcc));
      renderAccountArea();
    });
  }
}

function showModal(msg){
  modalText.textContent=msg;
  modal.style.display="flex";
}

renderAccountArea();
