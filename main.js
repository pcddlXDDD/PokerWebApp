import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref, set, update, onValue, push } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// 🔹 TU CONFIG DE FIREBASE (copiala desde Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyBymZKY15hibNUuNRU3STdv3N2lhqGoRng",
  authDomain: "pokerwebapp-1036a.firebaseapp.com",
  databaseURL: "https://pokerwebapp-1036a-default-rtdb.firebaseio.com",
  projectId: "pokerwebapp-1036a",
  storageBucket: "pokerwebapp-1036a.firebasestorage.app",
  messagingSenderId: "865014554890",
  appId: "1:865014554890:web:123eb4c3a51b1211afdaf3"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

let uid = null;
let roomId = null;
let isHost = false;
let playersJoined = {};

// 🔹 Login anónimo
signInAnonymously(auth).then(user => {
  uid = user.user.uid;
});

// Crear sala
document.getElementById("createBtn").addEventListener("click", () => {
  roomId = push(ref(db, "rooms")).key;
  isHost = true;
  set(ref(db, "rooms/" + roomId), {
    host: uid,
    players: { [uid]: true },
    game: { status: "Esperando" }
  });
  document.getElementById("roomInfo").innerText = "Sala: " + roomId;
  document.getElementById("dealBtn").style.display = "inline-block";
});

// Unirse a sala
document.getElementById("joinBtn").addEventListener("click", () => {
  const joinId = prompt("Ingresa el ID de la sala:");
  if (!joinId) return;
  roomId = joinId;
  update(ref(db, "rooms/" + roomId + "/players"), { [uid]: true });
  document.getElementById("roomInfo").innerText = "Sala: " + roomId;
});

// Escuchar cambios en la sala
function listenRoom(roomId) {
  onValue(ref(db, "rooms/" + roomId), snapshot => {
    const data = snapshot.val();
    if (!data) return;

    playersJoined = data.players || {};

    if (data.game && data.game.players) {
      renderGame(data.game);
    } else {
      document.getElementById("game").innerText = "Esperando cartas...";
    }
  });
}

setInterval(() => {
  if (roomId) listenRoom(roomId);
}, 1000);

// Repartir cartas
function dealCards(roomId) {
  const suits = ["♠", "♥", "♦", "♣"];
  const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

  let deck = [];
  suits.forEach(suit => ranks.forEach(rank => deck.push(rank + suit)));
  deck.sort(() => Math.random() - 0.5);

  let players = {};
  Object.keys(playersJoined).forEach(uid => {
    players[uid] = [deck.pop(), deck.pop()];
  });

  update(ref(db, "rooms/" + roomId + "/game"), {
    players: players,
    community: [deck.pop(), deck.pop(), deck.pop(), deck.pop(), deck.pop()],
    status: "Jugando"
  });
}

document.getElementById("dealBtn").addEventListener("click", () => {
  if (isHost && roomId) {
    dealCards(roomId);
  } else {
    alert("Solo el host puede repartir las cartas.");
  }
});

// Renderizar partida
function renderGame(game) {
  let html = "<h2>Cartas de la mesa:</h2>";
  html += `<div class="cards">${game.community.join(" ")}</div>`;
  html += "<h2>Jugadores:</h2>";

  Object.keys(game.players).forEach(pid => {
    if (pid === uid) {
      html += `<p><b>Tus cartas:</b> <span class="cards">${game.players[pid].join(" ")}</span></p>`;
    } else {
      html += `<p>Jugador ${pid.substring(0, 5)}: <span class="cards">[?? ??]</span></p>`;
    }
  });

  document.getElementById("game").innerHTML = html;
          }
