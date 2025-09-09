// === IMPORTS FIREBASE ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  onChildAdded,
  onDisconnect,
  set,
  remove,
  onValue,
  query,
  limitToLast
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";

import {
  getMessaging,
  getToken,
  onMessage
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-messaging.js";

// === CONFIGURATION FIREBASE ===
const firebaseConfig = {
  apiKey: "AIzaSyAeADkYdyw1Ha9uDGH0piafwfh4EJx-PZo",
  authDomain: "discord-like-52f23.firebaseapp.com",
  databaseURL: "https://discord-like-52f23-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "discord-like-52f23",
  storageBucket: "discord-like-52f23.appspot.com",
  messagingSenderId: "515179784311",
  appId: "1:515179784311:web:7a643986c284c01b37be72"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const messagesRef = ref(db, "messages");
const presenceRef = ref(db, "presence");
const messaging = getMessaging(app);

// === PERMISSION NOTIFS + SERVICE WORKER ===
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/firebase-messaging-sw.js')
    .then(reg => {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          getToken(messaging, {
            vapidKey: "BKfSe6g3ufMoN9FVk6ZpTVPDAfwA7-8GwT1gH2mUT7zHfL-Ws3I7LfvvmXRRG44FHH4k99MKFcM4I3TPh_V7YXA"
          }).then(token => console.log("FCM Token:", token));
        }
      });
    });
}

onMessage(messaging, (payload) => {
  new Notification(payload.notification.title, {
    body: payload.notification.body,
    icon: '/favicon.ico'
  });
});

// === RANKS ===
const ranks = {
  "JaidaCori27": { password: "goofymdp", role: "admin" },
  "Averaage236": { password: "password", role: "TNT" },
  "Penguin": { password: "Penguin", role: "penguin" }
};

// === VARIABLES ===
const socket = io();
const messages = document.getElementById('messages');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
let lastMessageDate = null;
let unreadCount = 0;
const originalTitle = document.title;

// === AUTOFILL LOGIN SI DISPONIBLE ===
const savedUsername = localStorage.getItem("chat-username");
const savedPassword = localStorage.getItem("chat-password");

if (savedUsername) usernameInput.value = savedUsername;
if (savedPassword) passwordInput.value = savedPassword;

// === UTIL FUNCTIONS ===
function escapeHTML(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function parseEmojis(text) {
  const emojiMap = {
    ":smile:": "😊", ":sad:": "😢", ":thumbsup:": "👍",
    ":heart:": "❤️", ":fire:": "🔥", ":skull:": "💀"
  };
  return text.replace(/:([a-zA-Z0-9_]+):/g, (m, p1) => emojiMap[":" + p1 + ":"] || m);
}

function parseMentions(text) {
  return text.replace(/@(\w+)/g, `<span class="mention">@$1</span>`);
}

function formatDate(str) {
  return new Date(str).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatTime(str) {
  return new Date(str).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

// === AJOUT D'UN MESSAGE ===
function addMessage(msg) {
  const date = new Date(msg.timestamp || Date.now());
  const dateStr = formatDate(date);
  const timeStr = formatTime(date);

  if (!lastMessageDate || formatDate(lastMessageDate) !== dateStr) {
    const separator = document.createElement('div');
    separator.className = 'date-separator';
    separator.textContent = dateStr;
    messages.appendChild(separator);
    lastMessageDate = date;
  }

  const div = document.createElement("div");
  div.className = "message";
  let color = "white", badge = "";

  if (msg.role === "admin") { color = "red"; badge = '<span class="badge" id="admin">ADMIN</span>'; }
  else if (msg.role === "TNT") { color = "green"; badge = '<span class="badge" id="tnt">TNT</span>'; }
  else if (msg.role === "penguin") { color = "#d1ffab"; badge = '<span class="badge" id="penguin">PENGUIN</span>'; }

  let content = escapeHTML(msg.text || "");
  content = parseMentions(parseEmojis(content));

  if (msg.image) {
    content += `<br><img src="${msg.image}" class="chat-image">`;
  }

  div.innerHTML = `<strong style="color: ${color};">${msg.username}</strong> ${badge}: ${content} <span class="time">(${timeStr})</span>`;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

// === CHARGEMENT DES 100 DERNIERS MESSAGES ===
const limitedMessagesQuery = query(messagesRef, limitToLast(100));
onChildAdded(limitedMessagesQuery, snap => {
  const msg = snap.val();
  addMessage(msg);
});

// === ENVOI D'UN MESSAGE ===
document.getElementById('chat-form').addEventListener('submit', e => {
  e.preventDefault();
  const username = usernameInput.value;
  const password = passwordInput.value;
  const text = document.getElementById('message-input').value;
  const imageFile = document.getElementById('image-input').files[0];

  if (text.trim() === "/clear") {
    remove(messagesRef);
    return;
  }

  let role = "user";
  if (ranks[username] && ranks[username].password === password) {
    role = ranks[username].role;
  }

  const msg = {
    username,
    text,
    role,
    timestamp: new Date().toISOString()
  };

  if (imageFile) {
    const reader = new FileReader();
    reader.onload = () => {
      msg.image = reader.result;
      push(messagesRef, msg);
    };
    reader.readAsDataURL(imageFile);
  } else {
    push(messagesRef, msg);
  }

  // Sauvegarder si "se souvenir de moi" coché
  const remember = document.getElementById("remember-me");
  if (remember && remember.checked) {
    localStorage.setItem("chat-username", username);
    localStorage.setItem("chat-password", password);
  }

  document.getElementById('message-input').value = '';
  document.getElementById('image-input').value = '';
});

// === DECONNEXION ===
window.logout = function () {
  localStorage.removeItem("chat-username");
  localStorage.removeItem("chat-password");
  location.reload();
}

// === ENREGISTREMENT UTILISATEUR ===
usernameInput.addEventListener("change", () => {
  const username = usernameInput.value;
  if (username) {
    const userRef = ref(db, `presence/${username}`);
    set(userRef, true);
    onDisconnect(userRef).remove();
  }
});

// === AFFICHAGE UTILISATEURS EN LIGNE ===
onValue(presenceRef, snap => {
  const list = document.getElementById("online-users-list");
  const users = snap.val() || {};
  list.innerHTML = Object.keys(users).map(u => `<li>${u}</li>`).join("");
});

// === FOCUS GESTION NOTIFS ===
window.addEventListener("focus", () => {
  unreadCount = 0;
  document.title = originalTitle;
});

// === TOGGLE UTILISATEURS ===
document.getElementById("toggle-users-btn").addEventListener("click", () => {
  document.getElementById("users-popup").classList.toggle("hidden");
});

// Système de lightbox (agrandir l'image au clic)
document.addEventListener("click", function (e) {
  if (e.target.tagName === "IMG" && e.target.closest(".message")) {
    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightbox-img");
    lightboxImg.src = e.target.src;
    lightbox.style.display = "flex";
  }
});

// Fermer la lightbox au clic
document.getElementById("lightbox").addEventListener("click", () => {
  document.getElementById("lightbox").style.display = "none";
});
