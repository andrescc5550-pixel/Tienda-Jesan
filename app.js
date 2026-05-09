const API = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000/productos"
    : "https://tienda-jesan.onrender.com/productos";

const rol = localStorage.getItem("auth"); // "admin" o "vendedor"
let editando = false;
let idEditar = null;

// INICIAR
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("rolLabel").innerText = rol === "admin" ? "Administrador" : "Vendedor";

  if (rol === "admin") {
    document.getElementById("formulario-section").style.display = "block";
    document.getElementById("vendedores-section").style.display = "block";
    cargarVendedores();
    document.getElementById("formulario").addEventListener("submit", guardarProducto);
  }

  cargarProductos();
});

// CERRAR SESIÓN
function cerrarSesion() {
  localStorage.removeItem("auth");
  window.location.href = "login.html";
}

// CARGAR PRODUCTOS — TABLA
async function cargarProductos() {
  try {
    const res = await fetch(API);
    const data = await res.json();
    const lista = document.getElementById("lista");
    lista.innerHTML = "";

    data.forEach(p => {
      const tr = document.createElement("tr");

      if (rol === "admin") {
        tr.innerHTML = `
          <td>${p.nombre}</td>
          <td>Q${p.precio}</td>
          <td>${p.cantidad}</td>
          <td>
            <button class="btn-editar">Editar</button>
            <button class="btn-eliminar" style="margin-left:5px;">Eliminar</button>
          </td>`;
        tr.querySelector(".btn-editar").addEventListener("click", () => cargarEditar(p));
        tr.querySelector(".btn-eliminar").addEventListener("click", () => eliminar(p.id));
      } else {
        // Vendedor: solo actualizar cantidad
        tr.innerHTML = `
          <td>${p.nombre}</td>
          <td>Q${p.precio}</td>
          <td>${p.cantidad}</td>
          <td style="display:flex; gap:6px; align-items:center;">
            <input type="number" placeholder="Nueva cant." min="0"
              style="width:100px; padding:6px; border-radius:4px; border:1px solid #ccc;">
            <button style="background:#28a745; color:white; border:none; padding:6px 10px; border-radius:4px; cursor:pointer;">Actualizar</button>
          </td>`;
        const input = tr.querySelector("input");
        tr.querySelector("button").addEventListener("click", () => actualizarCantidad(p, input.value));
      }

      lista.appendChild(tr);
    });
  } catch (error) {
    console.error("Error cargando productos:", error);
    document.getElementById("lista").innerHTML = `<tr><td colspan="4">Error al conectar con el servidor.</td></tr>`;
  }
}

// ACTUALIZAR CANTIDAD (vendedor)
async function actualizarCantidad(p, nuevaCantidad) {
  const cant = Number(nuevaCantidad);
  if (isNaN(cant) || cant < 0) { alert("Ingresa una cantidad válida"); return; }

  try {
    // Enviamos todos los campos para no borrar nada
    const res = await fetch(`${API}/${p.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: p.nombre,
        precio: p.precio,
        cantidad: cant,
        imagen: p.imagen || "",
        descripcion: p.descripcion || ""
      })
    });
    if (res.ok) { alert("Cantidad actualizada"); cargarProductos(); }
    else { alert("Error al actualizar"); }
  } catch (err) { alert("Error al conectar con el servidor"); }
}

// GUARDAR O ACTUALIZAR (admin)
async function guardarProducto(e) {
  e.preventDefault();
  const nombre = document.getElementById("nombre").value.trim();
  const precio = Number(document.getElementById("precio").value);
  const cantidad = Number(document.getElementById("cantidad").value);
  const imagen = document.getElementById("imagen").value.trim();
  const descripcion = document.getElementById("descripcion").value.trim();

  if (!nombre || !precio || isNaN(cantidad)) { alert("Completa los campos obligatorios"); return; }

  const datos = { nombre, precio, cantidad, imagen, descripcion };
  const url = editando ? `${API}/${idEditar}` : API;
  const metodo = editando ? "PUT" : "POST";

  try {
    const res = await fetch(url, {
      method: metodo,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos)
    });
    if (res.ok) {
      alert(editando ? "Producto actualizado" : "Producto agregado");
      cancelarEdicion();
      cargarProductos();
    } else { alert("Error en el servidor"); }
  } catch (error) { alert("Error al conectar con el servidor"); }
}

// CARGAR PARA EDITAR (admin)
function cargarEditar(p) {
  document.getElementById("nombre").value = p.nombre;
  document.getElementById("precio").value = p.precio;
  document.getElementById("cantidad").value = p.cantidad;
  document.getElementById("imagen").value = p.imagen || "";
  document.getElementById("descripcion").value = p.descripcion || "";
  editando = true;
  idEditar = p.id;
  document.getElementById("btn-guardar").innerText = "Actualizar Cambios";
  document.getElementById("btn-cancelar").style.display = "inline-block";
  document.getElementById("form-titulo").innerText = "Editando: " + p.nombre;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// CANCELAR EDICIÓN (admin)
function cancelarEdicion() {
  editando = false;
  idEditar = null;
  document.getElementById("formulario").reset();
  document.getElementById("btn-guardar").innerText = "Guardar";
  document.getElementById("btn-cancelar").style.display = "none";
  document.getElementById("form-titulo").innerText = "Agregar Producto";
}

// ELIMINAR (admin)
async function eliminar(id) {
  if (!confirm("¿Seguro que quieres eliminar este producto?")) return;
  try {
    const res = await fetch(`${API}/${id}`, { method: "DELETE" });
    if (res.ok) { alert("Producto eliminado"); cargarProductos(); }
  } catch (error) { alert("No se pudo eliminar"); }
}

// ===== GESTIÓN DE VENDEDORES (admin) =====
function cargarVendedores() {
  const vendedores = JSON.parse(localStorage.getItem("vendedores") || "[]");
  const lista = document.getElementById("lista-vendedores");
  lista.innerHTML = "";

  if (vendedores.length === 0) {
    lista.innerHTML = "<p style='color:#888; font-size:14px;'>No hay vendedores registrados.</p>";
    return;
  }

  vendedores.forEach((v, i) => {
    const div = document.createElement("div");
    div.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:10px; border-bottom:1px solid #eee;";
    div.innerHTML = `
      <span>👤 <strong>${v.usuario}</strong></span>
      <button onclick="eliminarVendedor(${i})"
        style="background:#dc3545; color:white; border:none; padding:5px 12px; border-radius:4px; cursor:pointer; font-size:13px;">
        Eliminar
      </button>`;
    lista.appendChild(div);
  });
}

function agregarVendedor() {
  const usuario = document.getElementById("v-usuario").value.trim();
  const password = document.getElementById("v-password").value.trim();

  if (!usuario || !password) { alert("Ingresa usuario y contraseña"); return; }

  const vendedores = JSON.parse(localStorage.getItem("vendedores") || "[]");
  if (vendedores.find(v => v.usuario === usuario)) { alert("Ese usuario ya existe"); return; }

  vendedores.push({ usuario, password });
  localStorage.setItem("vendedores", JSON.stringify(vendedores));
  document.getElementById("v-usuario").value = "";
  document.getElementById("v-password").value = "";
  alert(`Vendedor "${usuario}" creado exitosamente`);
  cargarVendedores();
}

function eliminarVendedor(index) {
  if (!confirm("¿Eliminar este vendedor?")) return;
  const vendedores = JSON.parse(localStorage.getItem("vendedores") || "[]");
  vendedores.splice(index, 1);
  localStorage.setItem("vendedores", JSON.stringify(vendedores));
  cargarVendedores();
}
