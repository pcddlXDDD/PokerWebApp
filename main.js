// 🔹 Reemplaza con tus datos de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBymZKY15hibNUuNRU3STdv3N2lhqGoRng",
  authDomain: "pokerwebapp-1036a.firebaseapp.com",
  databaseURL: "https://pokerwebapp-1036a-default-rtdb.firebaseio.com",
  projectId: "pokerwebapp-1036a",
  storageBucket: "pokerwebapp-1036a.firebasestorage.app",
  messagingSenderId: "865014554890",
  appId: "1:865014554890:web:123eb4c3a51b1211afdaf3"
};
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.database();
let currentRoom = null;
let isHost = false;

// Login anónimo
function loginAnon() {
  auth.signInAnonymously()
    .then(() => {
      document.getElementById("login").style.display = "none";
      document.getElementById("lobby").style.display = "block";
    });
}

// Crear / unirse a sala
function joinRoom() {
  const uid = auth.currentUser.uid;
  let rid = document.getElementById("roomId").value.trim();
  if(!rid) rid = db.ref("rooms").push().key;
  currentRoom = rid;
  document.getElementById("roomLabel").innerText = rid;

  const playerRef = db.ref(`rooms/${rid}/players/${uid}`);
  playerRef.set({uid: uid, joinedAt: Date.now()});
  playerRef.onDisconnect().remove();

  listenRoom(rid);

  // Si sos el primero en la sala, sos host
  db.ref(`rooms/${rid}/players`).once("value").then(snap=>{
    isHost = Object.keys(snap.val() || {}).length === 1;
  });

  document.getElementById("lobby").style.display="none";
  document.getElementById("game").style.display="block";
}

// Escuchar cambios en la sala
function listenRoom(rid){
  db.ref(`rooms/${rid}/players`).on("value", snap=>{
    const players = snap.val() || {};
    document.getElementById("players").innerText="Jugadores: "+Object.keys(players).length;
  });

  db.ref(`rooms/${rid}/hands/${auth.currentUser.uid}`).on("value", snap=>{
    const hand = snap.val();
    document.getElementById("hand").innerText = hand ? "Tu mano: "+hand.join(", ") : "Esperando cartas...";
  });

  db.ref(`rooms/${rid}/board`).on("value", snap=>{
    const board = snap.val();
    document.getElementById("board").innerText = board ?
      "Mesa: Flop: "+(board.flop||[]).join(",")+" | Turn: "+(board.turn||"")+" | River: "+(board.river||"")
      : "";
  });
}

// Repartir cartas (solo host)
function dealCards(){
  if(!isHost) return alert("Solo el host puede repartir");

  const roomRef = db.ref(`rooms/${currentRoom}`);
  const suits = ["♠","♥","♦","♣"];
  const ranks = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];
  let deck = [];
  suits.forEach(s=>ranks.forEach(r=>deck.push(r+s)));

  // Mezclar
  for(let i=deck.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [deck[i],deck[j]]=[deck[j],deck[i]];
  }

  // Repartir a jugadores
  roomRef.child("players").once("value").then(snap=>{
    const players = snap.val() || {};
    const updates = {};
    Object.keys(players).forEach(uid=>{
      updates[`hands/${uid}`] = [deck.pop(), deck.pop()];
    });

    // Cartas comunitarias
    updates["board"] = {
      flop: [deck.pop(), deck.pop(), deck.pop()],
      turn: deck.pop(),
      river: deck.pop()
    };

    roomRef.update(updates);
  });
}
