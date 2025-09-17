// Firebase + Firestore (Módulos)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Configuración de tu proyecto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCkNbamNjoe4HjTnu9XyiWojDFzO7KSNUA",
  authDomain: "municipalidad-msi.firebaseapp.com",
  projectId: "municipalidad-msi",
  storageBucket: "municipalidad-msi.firebasestorage.app",
  messagingSenderId: "200816039529",
  appId: "1:200816039529:web:657f6eae3cc2800458b4f8",
  measurementId: "G-VML2YK1TGF"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
try { getAnalytics(app); } catch (_) {}
const db = getFirestore(app);

// Helpers DOM
const $ = s => document.querySelector(s);
const getStar = name => {
  const el = document.querySelector(`input[name="${name}"]:checked`);
  return el ? Number(el.value) : 0;
};

// Variables ocultas (se llenan desde el hash #PLACA|IDENT|SECTOR o comas)
let hiddenPlaca = "";
let hiddenIdent = "";
let hiddenSector = "";

function captureHashHidden() {
  const i = location.href.indexOf("#");
  if (i < 0) return;
  let f = decodeURIComponent(location.href.slice(i + 1)).trim();
  let p = f.split("|");
  if (p.length < 3) p = f.split(",");
  const [placa = "", ident = "", sector = ""] = p.map(s => s.trim());
  hiddenPlaca = placa || "";
  hiddenIdent = ident || "";
  hiddenSector = sector || "";
}

function disableAll() {
  document.querySelectorAll("input,button").forEach(e => e.disabled = true);
}

function showSending() {
  $("#spinner").style.display = "inline-block";
  $("#overlayMsg").textContent = "Se está enviando su respuesta…";
  $("#overlayBox").classList.remove("success");
  $("#overlay").classList.add("show");
}

function showThanksPermanent() {
  $("#spinner").style.display = "none";
  $("#overlayMsg").textContent = "¡Gracias por su calificación!";
  $("#overlayBox").classList.add("success");
  disableAll(); // queda en pantalla
}

let sending = false;
async function guardar() {
  if (sending) return;

  const nombre = $("#nombreInput").value.trim();
  const r1 = getStar("r1"), r2 = getStar("r2"), r3 = getStar("r3"), r4 = getStar("r4");

  const errs = [];
  if (!nombre) errs.push("El nombre es obligatorio.");
  if (!r1 || !r2 || !r3 || !r4) errs.push("Seleccione las 4 calificaciones.");
  if (errs.length) { alert(errs.join("\n")); return; }

  const tz = "America/Lima", now = new Date();
  const fecha = new Intl.DateTimeFormat("es-PE", {
    year: "numeric", month: "2-digit", day: "2-digit", timeZone: tz
  }).format(now);
  const hora = new Intl.DateTimeFormat("es-PE", {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true, timeZone: tz
  }).format(now);

  const payload = {
    nombre_usuario: nombre,
    placa_dni: hiddenPlaca,      // ocultos: vienen del fragmento si existe
    identificador: hiddenIdent,
    sector_cargo: hiddenSector,
    calificaciones: { presentacion: r1, limpieza: r2, rapidez: r3, solucion: r4 },
    fecha, hora,
    timestamp: serverTimestamp(),
  };

  try {
    sending = true;
    $("#enviarBtn").disabled = true;
    showSending();
    await addDoc(collection(db, "encuestas"), payload);
    showThanksPermanent();
  } catch (e) {
    console.error(e);
    alert("No se pudo guardar. Intente nuevamente.");
    $("#overlay").classList.remove("show");
    $("#enviarBtn").disabled = false;
    sending = false;
  }
}

// Listeners
window.addEventListener("DOMContentLoaded", () => {
  captureHashHidden(); // toma los datos ocultos si vienen en la URL
  $("#enviarBtn").addEventListener("click", guardar);
});
window.addEventListener("hashchange", captureHashHidden);
