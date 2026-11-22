/* ===================================================
   XUSNIYA UCHUN SEVGI MAKTUBI - INTERACTIVE JAVASCRIPT
   Aesthetic Romantic Pastel & Photo Experience
   =================================================== */

// Boshlang'ich ma'lumotlar ("Azizam" butunlay olib tashlangan!)
const DEFAULT_CONFIG = {
  recipient: "Xusniya",
  sender: "Sening Oshig'ing ❤️",
  startDate: "2024-01-01",
  caption: "Mening yagona go'zalim ✨",
  message: `Xusniya,

Sen hayotimga kirib kelgan kundan boshlab, dunyom butunlay boshqacha va yorqin ranglarga to'ldi.

Har bir mayin tabassuming qalbimga bitmas-tuganmas quvonch va xotirjamlik bag'ishlaydi. Sening o'sha sehrli ko'zlaringga boqqanimda, butun koinotning eng toza va beg'ubor go'zalligini ko'rgandek bo'laman.

Seni faqat quvonchli lahzalarda emas, har bir soniyada, har bir nafasda borligingcha sevaman. Sen mening eng chiroyli orzuimsan va eng qadrli baxtimsan.

Doimo yuzingda tabassum porlab tursin, chunki sen kulganingda butun olam go'zallashadi...`
};

// Ilova holati
let appState = {
  recipient: DEFAULT_CONFIG.recipient,
  sender: DEFAULT_CONFIG.sender,
  startDate: DEFAULT_CONFIG.startDate,
  caption: DEFAULT_CONFIG.caption,
  message: DEFAULT_CONFIG.message,
  photoBase64: null,
  isOpen: false,
  isTyping: false,
  typingTimer: null,
  dodgeCount: 0
};

// DOM Elementlari
const photoFileInput = document.getElementById('photoFileInput');
const uploadNavBtn = document.getElementById('uploadNavBtn');
const photoFrameArea = document.getElementById('photoFrameArea');
const girlPhotoDisplay = document.getElementById('girlPhotoDisplay');
const photoStarter = document.getElementById('photoStarter');
const captionDisplay = document.getElementById('captionDisplay');

// Mini vitrina
const miniGirlPhoto = document.getElementById('miniGirlPhoto');
const miniPlaceholder = document.getElementById('miniPlaceholder');
const miniCaption = document.getElementById('miniCaption');
const miniChangePhotoBtn = document.getElementById('miniChangePhotoBtn');

// Konvert & Sahnalar
const envelopeWrapper = document.getElementById('envelopeWrapper');
const envelopeBox = envelopeWrapper ? envelopeWrapper.querySelector('.envelope-body') : null;
const envelopeView = document.getElementById('envelopeView');
const letterView = document.getElementById('letterView');
const typedContent = document.getElementById('typedContent');
const typingCursor = document.getElementById('typingCursor');
const skipTypingBtn = document.getElementById('skipTypingBtn');
const reopenEnvelopeBtn = document.getElementById('reopenEnvelopeBtn');
const shareLoveBtn = document.getElementById('shareLoveBtn');
const musicToggleBtn = document.getElementById('musicToggleBtn');

// Timer
const daysCount = document.getElementById('daysCount');
const hoursCount = document.getElementById('hoursCount');
const minutesCount = document.getElementById('minutesCount');
const secondsCount = document.getElementById('secondsCount');

// Savol & Tugmalar
const yesBtn = document.getElementById('yesBtn');
const noBtn = document.getElementById('noBtn');
const answersContainer = document.getElementById('answersContainer');
const celebrationModal = document.getElementById('celebrationModal');
const closeCelebrationBtn = document.getElementById('closeCelebrationBtn');

// Tahrirlash modali
const editModalBtn = document.getElementById('editModalBtn');
const editModal = document.getElementById('editModal');
const editModalBackdrop = document.getElementById('editModalBackdrop');
const closeEditModalBtn = document.getElementById('closeEditModalBtn');
const customizeForm = document.getElementById('customizeForm');
const inputRecipient = document.getElementById('inputRecipient');
const inputSender = document.getElementById('inputSender');
const inputStartDate = document.getElementById('inputStartDate');
const inputCaption = document.getElementById('inputCaption');
const inputMessage = document.getElementById('inputMessage');
const resetDefaultsBtn = document.getElementById('resetDefaultsBtn');

// Toast
const toastNotification = document.getElementById('toastNotification');
const toastText = document.getElementById('toastText');

// ===================================================
// 1. HOLATNI YUKLASH (LOCALSTORAGE & PARAMS)
// ===================================================
function initData() {
  const urlParams = new URLSearchParams(window.location.search);
  const paramTo = urlParams.get('to');
  const paramFrom = urlParams.get('from');
  const paramDate = urlParams.get('date');
  const paramMsg = urlParams.get('msg');

  // Saqlangan matnlar
  const savedData = localStorage.getItem('xusniya_love_store');
  let parsed = {};
  if (savedData) {
    try {
      parsed = JSON.parse(savedData);
    } catch (e) {
      console.error(e);
    }
  }

  // Saqlangan rasm
  const savedPhoto = localStorage.getItem('xusniya_love_photo');
  if (savedPhoto) {
    appState.photoBase64 = savedPhoto;
  }

  appState.recipient = paramTo || parsed.recipient || DEFAULT_CONFIG.recipient;
  appState.sender = paramFrom || parsed.sender || DEFAULT_CONFIG.sender;
  appState.startDate = paramDate || parsed.startDate || DEFAULT_CONFIG.startDate;
  appState.caption = parsed.caption || DEFAULT_CONFIG.caption;
  appState.message = paramMsg ? decodeURIComponent(paramMsg) : (parsed.message || DEFAULT_CONFIG.message);

  renderState();
}

function renderState() {
  document.querySelectorAll('.name-display').forEach(el => {
    el.textContent = appState.recipient;
  });
  document.querySelectorAll('.sender-display').forEach(el => {
    el.textContent = appState.sender;
  });

  if (captionDisplay) captionDisplay.textContent = appState.caption;
  if (miniCaption) miniCaption.textContent = appState.caption;
  if (inputCaption) inputCaption.value = appState.caption;
  if (inputRecipient) inputRecipient.value = appState.recipient;
  if (inputSender) inputSender.value = appState.sender;
  if (inputStartDate) inputStartDate.value = appState.startDate;
  if (inputMessage) inputMessage.value = appState.message;

  // Rasm mavjud bo'lsa ko'rsatish
  if (appState.photoBase64) {
    if (girlPhotoDisplay) {
      girlPhotoDisplay.src = appState.photoBase64;
      girlPhotoDisplay.classList.remove('hidden');
    }
    if (photoStarter) {
      photoStarter.classList.add('hidden');
    }
    if (miniGirlPhoto) {
      miniGirlPhoto.src = appState.photoBase64;
      miniGirlPhoto.classList.remove('hidden');
    }
    if (miniPlaceholder) {
      miniPlaceholder.classList.add('hidden');
    }
  }

  document.title = `${appState.recipient} uchun Sevgi Maktubi 💌`;
}

// ===================================================
// 2. RASM YUKLASH (PHOTO UPLOAD SYSTEM)
// ===================================================
function triggerPhotoPicker() {
  if (photoFileInput) {
    photoFileInput.click();
  }
}

function handlePhotoUpload(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    triggerToast("Iltimos, rasm faylini tanlang (jpg, png, webp)!");
    return;
  }

  const reader = new FileReader();
  reader.onload = function(evt) {
    const base64 = evt.target.result;
    appState.photoBase64 = base64;

    // Asosiy polaroidga o'rnatish
    if (girlPhotoDisplay && photoStarter) {
      girlPhotoDisplay.src = base64;
      girlPhotoDisplay.classList.remove('hidden');
      photoStarter.classList.add('hidden');
    }

    // Mini vitrinaga o'rnatish
    if (miniGirlPhoto && miniPlaceholder) {
      miniGirlPhoto.src = base64;
      miniGirlPhoto.classList.remove('hidden');
      miniPlaceholder.classList.add('hidden');
    }

    // Saqlash
    try {
      localStorage.setItem('xusniya_love_photo', base64);
    } catch (err) {
      console.warn("Storage limiti:", err);
    }

    triggerToast("Xusniyaning rasmi muvaffaqiyatli qo'yildi! 📸✨");
    if (window.romanticAudio) {
      window.romanticAudio.playSparkleHarp();
    }
  };
  reader.readAsDataURL(file);
}

// ===================================================
// 3. KONVERT OCHILISHI VA ANIMATSIYALAR
// ===================================================
function openEnvelope() {
  if (appState.isOpen) return;
  appState.isOpen = true;

  // Tovushlar va musiqa
  if (window.romanticAudio) {
    window.romanticAudio.init();
    window.romanticAudio.playSealBreak();
    setTimeout(() => {
      window.romanticAudio.playPaperRustle();
    }, 180);
    setTimeout(() => {
      window.romanticAudio.playSparkleHarp();
      window.romanticAudio.startMusic();
      updateMusicBtn(true);
    }, 550);
  }

  // Yuraklar portlashi
  spawnHeartBurst(window.innerWidth / 2, window.innerHeight * 0.45, 35);

  if (envelopeBox) {
    envelopeBox.parentElement.classList.add('opening');
  }

  setTimeout(() => {
    envelopeView.classList.add('hidden');
    letterView.classList.remove('hidden');
    runTypewriter(appState.message);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, 950);
}

function foldEnvelope() {
  if (appState.typingTimer) {
    clearTimeout(appState.typingTimer);
    appState.isTyping = false;
  }
  appState.isOpen = false;

  letterView.classList.add('hidden');
  envelopeView.classList.remove('hidden');
  if (envelopeBox) {
    envelopeBox.parentElement.classList.remove('opening');
  }

  if (window.romanticAudio) {
    window.romanticAudio.playPaperRustle();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===================================================
// 4. MATNNI YOZISH (TYPEWRITER)
// ===================================================
function runTypewriter(text) {
  if (appState.typingTimer) {
    clearTimeout(appState.typingTimer);
  }

  typedContent.textContent = '';
  typingCursor.style.display = 'inline-block';
  appState.isTyping = true;
  skipTypingBtn.style.display = 'inline-block';

  let i = 0;
  const speed = 24;

  function nextChar() {
    if (i < text.length) {
      typedContent.textContent += text.charAt(i);
      i++;

      if (i % 30 === 0 && window.romanticAudio) {
        window.romanticAudio.playChime(700 + Math.random() * 300, 0.3, 0.025);
      }

      appState.typingTimer = setTimeout(nextChar, speed);
    } else {
      appState.isTyping = false;
      typingCursor.style.display = 'none';
      skipTypingBtn.style.display = 'none';
    }
  }

  nextChar();
}

function skipTyping() {
  if (appState.typingTimer) {
    clearTimeout(appState.typingTimer);
  }
  typedContent.textContent = appState.message;
  appState.isTyping = false;
  typingCursor.style.display = 'none';
  skipTypingBtn.style.display = 'none';
}

// ===================================================
// 5. SEVGI HISOBLAGICHI (TIMER)
// ===================================================
function refreshLoveCounter() {
  if (!appState.startDate) return;

  const start = new Date(appState.startDate).getTime();
  const now = new Date().getTime();
  const diff = now - start;

  if (diff > 0) {
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);

    if (daysCount) daysCount.textContent = d;
    if (hoursCount) hoursCount.textContent = String(h).padStart(2, '0');
    if (minutesCount) minutesCount.textContent = String(m).padStart(2, '0');
    if (secondsCount) secondsCount.textContent = String(s).padStart(2, '0');
  } else {
    if (daysCount) daysCount.textContent = '0';
    if (hoursCount) hoursCount.textContent = '00';
    if (minutesCount) minutesCount.textContent = '00';
    if (secondsCount) secondsCount.textContent = '00';
  }
}
setInterval(refreshLoveCounter, 1000);

// ===================================================
// 6. QOCHADIGAN "YO'Q" TUGMASI (PLAYFUL DODGING)
// ===================================================
const playfulWords = [
  "Ulgurmadingiz! 😜",
  "Rostdanmi? 🥺",
  "Qochdim! 🏃‍♀️",
  "Iloji yo'q! ❤️",
  "Mendan qochib qutulolmaysan! 🥰",
  "Faqat «Ha» deya olasan! 💕"
];

function escapeButton(e) {
  if (!answersContainer || !noBtn) return;
  
  appState.dodgeCount++;
  const moveX = (Math.random() - 0.5) * 220;
  const moveY = (Math.random() - 0.5) * 110;

  noBtn.style.transform = `translate(${moveX}px, ${moveY}px)`;
  
  const nextWord = playfulWords[appState.dodgeCount % playfulWords.length];
  noBtn.querySelector('span').textContent = nextWord;

  if (window.romanticAudio) {
    window.romanticAudio.playChime(600 + Math.random() * 400, 0.25, 0.04);
  }
}

// ===================================================
// 7. «HA, ALBATTA!» TABRIGI
// ===================================================
function triggerCelebration() {
  if (window.romanticAudio) {
    window.romanticAudio.playCelebration();
  }

  spawnHeartBurst(window.innerWidth * 0.3, window.innerHeight * 0.5, 45);
  spawnHeartBurst(window.innerWidth * 0.7, window.innerHeight * 0.5, 45);
  setTimeout(() => {
    spawnHeartBurst(window.innerWidth * 0.5, window.innerHeight * 0.3, 60);
  }, 280);

  if (celebrationModal) {
    celebrationModal.classList.remove('hidden');
  }
}

// ===================================================
// 8. MUSIQA TUGMASI
// ===================================================
function updateMusicBtn(isPlaying) {
  if (!musicToggleBtn) return;
  const lbl = musicToggleBtn.querySelector('.lbl');
  const icon = musicToggleBtn.querySelector('.icon');
  if (isPlaying) {
    if (lbl) lbl.textContent = "Musiqa: Yoqilgan";
    if (icon) icon.textContent = "🎵";
    musicToggleBtn.style.borderColor = "var(--primary-pink)";
  } else {
    if (lbl) lbl.textContent = "Musiqa: O'chiq";
    if (icon) icon.textContent = "🔇";
    musicToggleBtn.style.borderColor = "var(--card-border)";
  }
}

// ===================================================
// 9. TAHRIRLASH VA ULASHISH
// ===================================================
function showEditModal() {
  if (editModal) editModal.classList.remove('hidden');
}

function hideEditModal() {
  if (editModal) editModal.classList.add('hidden');
}

function submitCustomization(e) {
  e.preventDefault();
  appState.recipient = inputRecipient.value.trim() || DEFAULT_CONFIG.recipient;
  appState.sender = inputSender.value.trim() || DEFAULT_CONFIG.sender;
  appState.startDate = inputStartDate.value || DEFAULT_CONFIG.startDate;
  appState.caption = inputCaption.value.trim() || DEFAULT_CONFIG.caption;
  appState.message = inputMessage.value.trim() || DEFAULT_CONFIG.message;

  localStorage.setItem('xusniya_love_store', JSON.stringify({
    recipient: appState.recipient,
    sender: appState.sender,
    startDate: appState.startDate,
    caption: appState.caption,
    message: appState.message
  }));

  renderState();
  refreshLoveCounter();

  if (appState.isOpen) {
    typedContent.textContent = appState.message;
  }

  hideEditModal();
  triggerToast("O'zgarishlar muvaffaqiyatli saqlandi! ✨");
}

function resetSettings() {
  appState.recipient = DEFAULT_CONFIG.recipient;
  appState.sender = DEFAULT_CONFIG.sender;
  appState.startDate = DEFAULT_CONFIG.startDate;
  appState.caption = DEFAULT_CONFIG.caption;
  appState.message = DEFAULT_CONFIG.message;

  localStorage.removeItem('xusniya_love_store');
  renderState();
  refreshLoveCounter();
  hideEditModal();
  triggerToast("Standart holatga qaytarildi ✨");
}

function copyLoveLink() {
  const url = new URL(window.location.href.split('?')[0]);
  url.searchParams.set('to', appState.recipient);
  url.searchParams.set('from', appState.sender);
  url.searchParams.set('date', appState.startDate);

  navigator.clipboard.writeText(url.toString()).then(() => {
    triggerToast("Maxsus havola nusxalandi! Xusniyaga yuborishingiz mumkin 💌");
  }).catch(() => {
    triggerToast("Havolani nusxalashda xatolik");
  });
}

function triggerToast(msg) {
  if (!toastNotification || !toastText) return;
  toastText.textContent = msg;
  toastNotification.classList.remove('hidden');

  setTimeout(() => {
    toastNotification.classList.add('hidden');
  }, 3500);
}

// ===================================================
// 10. ORQA FON ZARRALARI (PARTICLES CANVAS)
// ===================================================
const canvas = document.getElementById('ambientCanvas');
let ctx = canvas ? canvas.getContext('2d') : null;
let particles = [];

function adjustCanvas() {
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', adjustCanvas);
adjustCanvas();

class GentleHeart {
  constructor(x, y, isBurst = false) {
    this.x = x ?? Math.random() * canvas.width;
    this.y = y ?? canvas.height + 20;
    this.size = Math.random() * 14 + 8;
    this.opacity = Math.random() * 0.5 + 0.2;
    this.speedY = isBurst ? (Math.random() - 0.5) * 11 : Math.random() * 1.2 + 0.5;
    this.speedX = isBurst ? (Math.random() - 0.5) * 11 : Math.sin(Math.random() * Math.PI) * 0.6;
    this.isBurst = isBurst;
    this.gravity = isBurst ? 0.2 : 0;
    this.decay = isBurst ? Math.random() * 0.015 + 0.01 : 0;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 0.04;
    
    const colors = ['#ff4d79', '#ff758f', '#ff8fa3', '#e0245e', '#ffb3c6'];
    this.color = colors[Math.floor(Math.random() * colors.length)];
  }

  update() {
    this.y -= this.speedY;
    this.x += this.speedX;
    this.rotation += this.rotSpeed;

    if (this.isBurst) {
      this.speedY -= this.gravity;
      this.opacity -= this.decay;
    } else {
      if (this.y < -30) {
        this.y = canvas.height + 20;
        this.x = Math.random() * canvas.width;
      }
    }
  }

  draw() {
    if (this.opacity <= 0) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.globalAlpha = Math.max(0, this.opacity);
    ctx.fillStyle = this.color;

    const topCurve = this.size * 0.3;
    ctx.beginPath();
    ctx.moveTo(0, topCurve);
    ctx.bezierCurveTo(-this.size / 2, -topCurve, -this.size, topCurve / 3, 0, this.size);
    ctx.bezierCurveTo(this.size, topCurve / 3, this.size / 2, -topCurve, 0, topCurve);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}

for (let i = 0; i < 26; i++) {
  particles.push(new GentleHeart(Math.random() * window.innerWidth, Math.random() * window.innerHeight));
}

function spawnHeartBurst(x, y, count = 35) {
  if (!canvas) return;
  for (let i = 0; i < count; i++) {
    particles.push(new GentleHeart(x, y, true));
  }
}

function loopParticles() {
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.update();
    p.draw();

    if (p.isBurst && p.opacity <= 0) {
      particles.splice(i, 1);
    }
  }

  requestAnimationFrame(loopParticles);
}
loopParticles();

// Sichqoncha harakatida mayin uchqunlar
window.addEventListener('mousemove', (e) => {
  if (Math.random() < 0.1 && particles.length < 75) {
    const h = new GentleHeart(e.clientX, e.clientY, true);
    h.speedY = (Math.random() - 0.5) * 1.5;
    h.speedX = (Math.random() - 0.5) * 1.5;
    h.size = Math.random() * 8 + 6;
    h.decay = 0.02;
    particles.push(h);
  }
});

// ===================================================
// 11. HODISALARNI BIRIKTIRISH
// ===================================================
document.addEventListener('DOMContentLoaded', () => {
  initData();
  refreshLoveCounter();

  // Konvert hodisasi
  if (envelopeWrapper) envelopeWrapper.addEventListener('click', openEnvelope);
  if (skipTypingBtn) skipTypingBtn.addEventListener('click', skipTyping);
  if (reopenEnvelopeBtn) reopenEnvelopeBtn.addEventListener('click', foldEnvelope);
  if (shareLoveBtn) shareLoveBtn.addEventListener('click', copyLoveLink);

  // Rasm tanlash
  if (uploadNavBtn) uploadNavBtn.addEventListener('click', triggerPhotoPicker);
  if (photoFrameArea) photoFrameArea.addEventListener('click', triggerPhotoPicker);
  if (miniChangePhotoBtn) miniChangePhotoBtn.addEventListener('click', triggerPhotoPicker);
  if (photoFileInput) photoFileInput.addEventListener('change', handlePhotoUpload);

  // Musiqa
  if (musicToggleBtn) {
    musicToggleBtn.addEventListener('click', () => {
      if (window.romanticAudio) {
        const isPlaying = window.romanticAudio.toggleMusic();
        updateMusicBtn(isPlaying);
      }
    });
  }

  // Sabablar
  document.querySelectorAll('.reason-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      if (window.romanticAudio) {
        window.romanticAudio.playChime(950 + Math.random() * 200, 0.35, 0.04);
      }
    });
  });

  // Dodging "Yo'q"
  if (noBtn) {
    noBtn.addEventListener('mouseenter', escapeButton);
    noBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      escapeButton(e);
    });
    noBtn.addEventListener('click', (e) => {
      e.preventDefault();
      escapeButton(e);
    });
  }

  // "Ha, albatta!"
  if (yesBtn) yesBtn.addEventListener('click', triggerCelebration);
  if (closeCelebrationBtn) {
    closeCelebrationBtn.addEventListener('click', () => {
      celebrationModal.classList.add('hidden');
    });
  }

  // Tahrirlash
  if (editModalBtn) editModalBtn.addEventListener('click', showEditModal);
  if (closeEditModalBtn) closeEditModalBtn.addEventListener('click', hideEditModal);
  if (editModalBackdrop) editModalBackdrop.addEventListener('click', hideEditModal);
  if (customizeForm) customizeForm.addEventListener('submit', submitCustomization);
  if (resetDefaultsBtn) resetDefaultsBtn.addEventListener('click', resetSettings);
});
