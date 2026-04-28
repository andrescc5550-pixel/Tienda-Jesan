
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot } 
from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "AIzaSyAVT33FH6GXyzbMCIC3F0rnpk4CJlveRuU",
  authDomain: "jesan-afd3b.firebaseapp.com",
  projectId: "jesan-afd3b",
  storageBucket: "jesan-afd3b.firebasestorage.app",
  messagingSenderId: "500372563479",
  appId: "1:500372563479:web:f2a80937e0ddb018481e52"
};
 

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ELEMENTOS DEL DOM
const form = document.getElementById("formulario");
const lista = document.getElementById("lista");
const modal = document.getElementById("modal");
const contenidoModal = document.getElementById("contenidoModal");


function crearMensaje(nombre, mensaje) {
  const nuevo = document.createElement("div");
  nuevo.classList.add("mensaje");

  nuevo.innerHTML = `<strong>${nombre}:</strong> ${mensaje}`;

  nuevo.addEventListener("click", () => {
    contenidoModal.innerHTML = `
      <h3>${nombre}</h3>
      <p>${mensaje}</p>
    `;
    modal.style.display = "flex";
  });

  lista.appendChild(nuevo);
}


onSnapshot(collection(db, "mensajes"), (snapshot) => {
  lista.innerHTML = "";

  snapshot.forEach((doc) => {
    const data = doc.data();
    crearMensaje(data.nombre, data.mensaje);
  });
});


form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nombre = document.getElementById("nombre").value.trim();
  const mensaje = document.getElementById("mensaje").value.trim();

  if (!nombre || !mensaje) {
    alert("Por favor completa todos los campos");
    return;
  }

  try {
    await addDoc(collection(db, "mensajes"), {
      nombre,
      mensaje,
      fecha: new Date()
    });

    form.reset();

  } catch (error) {
    console.error("Error:", error);
  }
});


modal.addEventListener("click", () => {
  modal.style.display = "none";
});