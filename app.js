// Detectar automáticamente si estamos en Render o en Local
const API = window.location.hostname === "localhost" 
    ? "http://localhost:3000/productos" 
    : "/productos"; // En Render, se usa la ruta relativa

let editando = false;
let idEditar = null;

// El resto de tu función cargarProductos(), eliminar(), etc., se queda IGUAL
// solo asegúrate de que usen la variable 'API' que definimos arriba.

// 🔹 CARGAR PRODUCTOS
async function cargarProductos() {
  try {
    const res = await fetch(API);
    const data = await res.json();

    const lista = document.getElementById("lista");
    lista.innerHTML = "";

    data.forEach(p => {
      const div = document.createElement("div");
      div.className = "producto";

      div.innerHTML = `
        <span>
          <strong>${p.nombre}</strong> - Q${p.precio} - Stock: ${p.cantidad}<br>
          <small>${p.descripcion || "Sin descripción"}</small><br>
          <small>Imagen: ${p.imagen || "No asignada"}</small>
        </span>
        <div class="botones">
          <button class="btn-editar">Editar</button>
          <button class="btn-eliminar">Eliminar</button>
        </div>
      `;

      // 🔥 eventos seguros (sin romper HTML)
      div.querySelector(".btn-editar").addEventListener("click", () => cargarEditar(p));
      div.querySelector(".btn-eliminar").addEventListener("click", () => eliminar(p.id));

      lista.appendChild(div);
    });

  } catch (error) {
    console.error("Error cargando productos:", error);
  }
}

// 🔹 FORMULARIO
document.getElementById("formulario").addEventListener("submit", async (e) => {
  e.preventDefault();

  const nombre = document.getElementById("nombre").value.trim();
  const precio = Number(document.getElementById("precio").value);
  const cantidad = Number(document.getElementById("cantidad").value);
  const imagen = document.getElementById("imagen").value.trim();
  const descripcion = document.getElementById("descripcion").value.trim();

  if (!nombre || !precio || !cantidad) {
    alert("Completa los campos obligatorios");
    return;
  }

  try {
    if (editando) {
      await fetch(API + "/" + idEditar, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, precio, cantidad, imagen, descripcion })
      });

      alert("Producto actualizado");

      editando = false;
      idEditar = null;

    } else {
      await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, precio, cantidad, imagen, descripcion })
      });

      alert("Producto agregado");
    }

    document.getElementById("formulario").reset();
    cargarProductos();

  } catch (error) {
    console.error("Error guardando producto:", error);
    alert("Error al guardar");
  }
});

// 🔹 CARGAR DATOS PARA EDITAR
function cargarEditar(p) {
  document.getElementById("nombre").value = p.nombre;
  document.getElementById("precio").value = p.precio;
  document.getElementById("cantidad").value = p.cantidad;
  document.getElementById("imagen").value = p.imagen || "";
  document.getElementById("descripcion").value = p.descripcion || "";

  editando = true;
  idEditar = p.id;
}

// 🔹 ELIMINAR
async function eliminar(id) {
  if (!confirm("¿Eliminar producto?")) return;

  try {
    await fetch(API + "/" + id, { method: "DELETE" });
    alert("Producto eliminado");
    cargarProductos();
  } catch (error) {
    console.error("Error eliminando:", error);
  }
}

// 🔹 INICIAL
cargarProductos();
