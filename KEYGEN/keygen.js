const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const VIGENERE_SECRET = "leonid";
const SIGNING_SECRET = "sec_lab3_private_sign_salt";
const PAYLOAD_LENGTH = 25;
const SIGNATURE_LENGTH = 10;

const CAPTCHA_DATABASE = [
  { text: "XS9KQ1" },
  { text: "SFKDOV" },
  { text: "D6HDS0" },
  { text: "HCY219" },
  { text: "8FD36X" },
  { text: "V810PS" },
  { text: "PN63MZ" },
  { text: "3H4J9K" },
  { text: "L9M2P4" },
  { text: "XB8F3V" },
  { text: "KS14FD" },
  { text: "YTNGGA" },
  { text: "B1T3H1" },
  { text: "E1FN48" },
  { text: "S4N1GD" },
  { text: "71RTAV" },
  { text: "DG98JB" },
  { text: "JINFNE" },
  { text: "MK415X" },
  { text: "XS9KQ1" }
];

const generateBtn = document.getElementById("generateBtn");
const copyBtn = document.getElementById("copyBtn");
const keyOutput = document.getElementById("keyOutput");
const info = document.getElementById("info");
const captchaCanvas = document.getElementById("captchaCanvas");
const captchaInput = document.getElementById("captchaInput");
const verifyCaptchaBtn = document.getElementById("verifyCaptchaBtn");
const refreshCaptchaBtn = document.getElementById("refreshCaptchaBtn");
const captchaStatus = document.getElementById("captchaStatus");
const keygenSection = document.getElementById("keygenSection");

let currentCaptchaAnswer = "";
let captchaVerified = false;

initCaptcha();
bindCaptchaEvents();
bindKeygenEvents();

function initCaptcha() {
  drawCaptcha();
}

function bindCaptchaEvents() {
  verifyCaptchaBtn.addEventListener("click", verifyCaptchaAnswer);
  refreshCaptchaBtn.addEventListener("click", drawCaptcha);
  captchaInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") verifyCaptchaAnswer();
  });
}

function bindKeygenEvents() {
  generateBtn.addEventListener("click", () => {
    const key = generateComplexLicenseKey();
    keyOutput.value = key;
    info.textContent = "Ключ згенеровано. Його можна вводити у веб-застосунок.";
  });

  copyBtn.addEventListener("click", async () => {
    if (!keyOutput.value) {
      info.textContent = "Спочатку згенеруйте ключ.";
      return;
    }
    await navigator.clipboard.writeText(keyOutput.value);
    info.textContent = "Ключ скопійовано.";
  });
}

function drawCaptcha() {
  const randomEntry = CAPTCHA_DATABASE[Math.floor(Math.random() * CAPTCHA_DATABASE.length)];
  currentCaptchaAnswer = randomEntry.text.toUpperCase();
  
  const ctx = captchaCanvas.getContext("2d");
  
  // Фон з градієнтом
  const gradient = ctx.createLinearGradient(0, 0, captchaCanvas.width, captchaCanvas.height);
  gradient.addColorStop(0, "#f0f0f0");
  gradient.addColorStop(1, "#e0e0e0");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, captchaCanvas.width, captchaCanvas.height);
  
  // Додавання шуму та перешкод
  addNoise(ctx);
  addLines(ctx);
  
  // Текст CAPTCHA з трансформаціями
  ctx.font = "bold 40px Arial";
  ctx.fillStyle = "#333";
  ctx.textBaseline = "middle";
  
  const charWidth = captchaCanvas.width / currentCaptchaAnswer.length;
  for (let i = 0; i < currentCaptchaAnswer.length; i++) {
    const char = currentCaptchaAnswer[i];
    const x = charWidth * (i + 0.5);
    const y = captchaCanvas.height / 2 + Math.sin(i) * 10;
    const angle = (Math.random() - 0.5) * 0.3;
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillText(char, 0, 0);
    ctx.restore();
  }
  
  // Обвід зображення
  ctx.strokeStyle = "#999";
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, captchaCanvas.width, captchaCanvas.height);
  
  captchaInput.value = "";
  captchaStatus.textContent = "";
  captchaStatus.className = "";
}

function addNoise(ctx) {
  const imageData = ctx.getImageData(0, 0, captchaCanvas.width, captchaCanvas.height);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    if (Math.random() > 0.95) {
      const noise = Math.random() > 0.5 ? 100 : -100;
      data[i] += noise; // R
      data[i + 1] += noise; // G
      data[i + 2] += noise; // B
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
}

function addLines(ctx) {
  ctx.strokeStyle = "rgba(100, 100, 100, 0.3)";
  ctx.lineWidth = 1;
  
  for (let i = 0; i < 5; i++) {
    const x1 = Math.random() * captchaCanvas.width;
    const y1 = Math.random() * captchaCanvas.height;
    const x2 = Math.random() * captchaCanvas.width;
    const y2 = Math.random() * captchaCanvas.height;
    
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
}

function verifyCaptchaAnswer() {
  const userAnswer = captchaInput.value.toUpperCase().trim();
  
  if (userAnswer === currentCaptchaAnswer) {
    captchaVerified = true;
    captchaStatus.textContent = "✓ Перевірка пройдена! Можна генерувати ключі.";
    captchaStatus.className = "success";
    keygenSection.style.display = "block";
  } else {
    captchaVerified = false;
    captchaStatus.textContent = "✗ Неправильно. Спробуйте ще раз.";
    captchaStatus.className = "error";
    drawCaptcha();
  }
}

function generateComplexLicenseKey() {
  if (!captchaVerified) {
    info.textContent = "Спочатку пройдіть перевірку CAPTCHA.";
    return;
  }
  
  const version = "a";
  const issuedAtBase36 = Date.now().toString(36).slice(-8).padStart(8, "0");
  const nonce = randomFromAlphabet(16);
  const payload = `${version}${issuedAtBase36}${nonce}`;
  if (payload.length !== PAYLOAD_LENGTH) {
    throw new Error("Invalid payload size.");
  }

  const encryptedPayload = vigenereEncrypt(payload, VIGENERE_SECRET);
  const signature = createSignature(encryptedPayload);
  const rawKey = `${encryptedPayload}${signature}`;
  return splitByFive(rawKey).toUpperCase();
}

function randomFromAlphabet(length) {
  let result = "";
  for (let i = 0; i < length; i += 1) {
    const idx = Math.floor(Math.random() * ALPHABET.length);
    result += ALPHABET[idx];
  }
  return result;
}

function splitByFive(value) {
  const chunks = [];
  for (let i = 0; i < value.length; i += 5) {
    chunks.push(value.slice(i, i + 5));
  }
  return chunks.join("-");
}

function vigenereEncrypt(source, key) {
  const cleanKey = key.toLowerCase();
  let result = "";
  let keyPos = 0;

  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i].toLowerCase();
    const srcIndex = ALPHABET.indexOf(ch);
    if (srcIndex === -1) {
      result += ch;
      continue;
    }

    const keyChar = cleanKey[keyPos % cleanKey.length];
    const keyIndex = ALPHABET.indexOf(keyChar);
    const encryptedIndex = (srcIndex + keyIndex) % ALPHABET.length;
    result += ALPHABET[encryptedIndex];
    keyPos += 1;
  }

  return result;
}

function createSignature(encryptedPayload) {
  const source = `${encryptedPayload}|${SIGNING_SECRET}`;
  let hash = 0x811c9dc5;

  for (let i = 0; i < source.length; i += 1) {
    hash ^= source.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }

  let signature = "";
  let value = hash;
  for (let i = 0; i < SIGNATURE_LENGTH; i += 1) {
    signature += ALPHABET[value % ALPHABET.length];
    value = Math.floor(value / ALPHABET.length) ^ (value >>> 3);
  }

  return signature;
}
