// ===================config.js=========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ============================================================
// Configuración Firebase
// ============================================================
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

// ============================================================
// Helpers DOM
// ============================================================
const $ = s => document.querySelector(s);
const getStar = name => {
  const el = document.querySelector(`input[name="${name}"]:checked`);
  return el ? Number(el.value) : 0;
};

// ============================================================
// Variables ocultas desde hash #PLACA|IDENT|SECTOR
// ============================================================
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

// ============================================================
// UI helpers
// ============================================================
function disableAll() {
  document.querySelectorAll("input,button,textarea").forEach(e => e.disabled = true);
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
  disableAll();
}

// ============================================================
// Guardar datos en subcolección por fecha
// ============================================================
let sending = false;
async function guardar() {
  if (sending) return;

  const nombre = $("#nombreInput").value.trim();
  const comentario = $("#comentarioInput").value.trim();
  const r1 = getStar("r1");
  const r2 = getStar("r2");
  const r3 = getStar("r3");
  const r4 = getStar("r4");

  const errs = [];
  if (!nombre) errs.push("El nombre es obligatorio.");
  if (!r1 || !r3 || !r4) errs.push("Debe calificar la presentación, rapidez y solución.");
  if (errs.length) {
    alert(errs.join("\n"));
    return;
  }

  const tz = "America/Lima";
  const now = new Date();

  const dia = String(now.getDate()).padStart(2, "0");
  const mes = String(now.getMonth() + 1).padStart(2, "0");
  const anio = now.getFullYear();
  const fecha = `${dia}-${mes}-${anio}`;

  const hora = new Intl.DateTimeFormat("es-PE", {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: true, timeZone: tz
  }).format(now);

  const payload = {
    nombre_usuario: nombre,
    placa_dni: hiddenPlaca,
    identificador: hiddenIdent,
    sector_cargo: hiddenSector,
    calificaciones: {
      "1_presentacion_personal": r1,
      "2_limpieza_vehiculo": r2 ? r2 : "No aplica",
      "3_llego_rapido": r3,
      "4_soluciono_problema": r4
    },
    comentario: comentario || "Sin comentarios",
    fecha,
    hora,
    timestamp: serverTimestamp()
  };

  try {
    sending = true;
    $("#enviarBtn").disabled = true;
    showSending();

    const refDia = collection(db, "encuestas", fecha, "respuestas");
    await addDoc(refDia, payload);

    showThanksPermanent();
  } catch (e) {
    console.error(e);
    alert("No se pudo guardar. Intente nuevamente.");
    $("#overlay").classList.remove("show");
    $("#enviarBtn").disabled = false;
    sending = false;
  }
}

// ============================================================
// Eventos
// ============================================================
window.addEventListener("DOMContentLoaded", () => {
  captureHashHidden();
  $("#enviarBtn").addEventListener("click", guardar);
});
window.addEventListener("hashchange", captureHashHidden);
