const BACKEND_URL = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  ? "http://localhost:3000"
  : window.location.origin;

const API = `${BACKEND_URL}/productos`;

let editando = false;
let idEditar = null;

// Verificar rol al cargar
const rol = localStorage.getItem("auth");
if (!rol || rol === "false") {
  window.location.href = "login.html";
} else {
  document.getElementById("rolLabel").textContent = rol === "admin" ? "Administrador" : "Vendedor";
  if (rol === "admin") {
    document.getElementById("formulario-section").style.display = "block";
    document.getElementById("vendedores-section").style.display = "block";
  }
  cargarProductos();
  cargarVendedores();
}

// Cerrar sesión
function cerrarSesion() {
  localStorage.removeItem("auth");
  window.location.href = "login.html";
}

// Cargar productos
async function cargarProductos() {
  try {
    const res = await fetch(API);
    const data = await res.json();
    const lista = document.getElementById("lista");
    lista.innerHTML = "";

    data.forEach(p => {
      const tr = document.createElement("tr");
      const rol = localStorage.getItem("auth");

      tr.innerHTML = `
        <td>${p.nombre}</td>
        <td>Q${p.precio}</td>
        <td>${p.cantidad}</td>
        <td>
          ${rol === "admin" ? `
            <button class="btn-editar" onclick="cargarEditar(${JSON.stringify(p).replace(/"/g, '&quot;')})">Editar</button>
            <button class="btn-eliminar" onclick="eliminar(${p.id})">Eliminar</button>
          ` : `
            <button class="btn-editar" onclick="restarStock(${p.id})">Vender</button>
          `}
        </td>
      `;
      lista.appendChild(tr);
    });
  } catch (error) {
    console.error("Error cargando productos:", error);
  }
}

// Formulario guardar/editar
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
      await fetch(`${API}/${idEditar}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, precio, cantidad, imagen, descripcion })
      });
      alert("Producto actualizado");
      cancelarEdicion();
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

// Cargar datos para editar
function cargarEditar(p) {
  document.getElementById("nombre").value = p.nombre;
  document.getElementById("precio").value = p.precio;
  document.getElementById("cantidad").value = p.cantidad;
  document.getElementById("imagen").value = p.imagen || "";
  document.getElementById("descripcion").value = p.descripcion || "";
  document.getElementById("form-titulo").textContent = "Editar Producto";
  document.getElementById("btn-guardar").textContent = "Actualizar";
  document.getElementById("btn-cancelar").style.display = "inline-block";
  editando = true;
  idEditar = p.id;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function cancelarEdicion() {
  editando = false;
  idEditar = null;
  document.getElementById("formulario").reset();
  document.getElementById("form-titulo").textContent = "Agregar Producto";
  document.getElementById("btn-guardar").textContent = "Guardar";
  document.getElementById("btn-cancelar").style.display = "none";
}

// Eliminar producto
async function eliminar(id) {
  if (!confirm("¿Eliminar producto?")) return;
  try {
    await fetch(`${API}/${id}`, { method: "DELETE" });
    alert("Producto eliminado");
    cargarProductos();
  } catch (error) {
    console.error("Error eliminando:", error);
  }
}

// Vender (restar stock) para vendedores
async function restarStock(id) {
  const cantidad = Number(prompt("¿Cuántas unidades vendiste?"));
  if (!cantidad || cantidad <= 0) return;
  try {
    const res = await fetch(`${BACKEND_URL}/comprar/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cantidad })
    });
    const data = await res.json();
    alert(data.mensaje);
    cargarProductos();
  } catch (error) {
    console.error("Error vendiendo:", error);
  }
}

function cargarVendedores() {
  if (localStorage.getItem("auth") !== "admin") return;
  const vendedores = JSON.parse(localStorage.getItem("vendedores") || "[]");
  const lista = document.getElementById("lista-vendedores");
  if (!lista) return;
  lista.innerHTML = vendedores.length === 0
    ? "<p style='color:#aaa'>No hay vendedores registrados</p>"
    : vendedores.map((v, i) => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; border-bottom:1px solid #eee; flex-wrap:wrap; gap:8px;">
          <div style="display:flex; flex-direction:column; gap:4px;">
            <span style="color:white; font-size:14px;">👤 <strong>${v.usuario}</strong></span>
            <div style="display:flex; align-items:center; gap:6px;">
              <span style="color:#ccc; font-size:13px;" id="pass-${i}">••••••••</span>
              <button onclick="togglePass(${i})" id="btn-pass-${i}"
                style="background:none; border:none; cursor:pointer; color:#aaa; font-size:16px; padding:0;">
                👁
              </button>
            </div>
          </div>
          <button onclick="eliminarVendedor(${i})"
            style="background:#dc3545; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">
            Eliminar
          </button>
        </div>
      `).join("");
}

function togglePass(index) {
  const vendedores = JSON.parse(localStorage.getItem("vendedores") || "[]");
  const span = document.getElementById(`pass-${index}`);
  const btn = document.getElementById(`btn-pass-${index}`);
  if (span.textContent === "••••••••") {
    span.textContent = vendedores[index].password;
    btn.textContent = "🙈";
  } else {
    span.textContent = "••••••••";
    btn.textContent = "👁";
  }
}

function agregarVendedor() {
  const usuario = document.getElementById("v-usuario").value.trim();
  const password = document.getElementById("v-password").value.trim();
  if (!usuario || !password) { alert("Completa usuario y contraseña"); return; }

  const vendedores = JSON.parse(localStorage.getItem("vendedores") || "[]");
  if (vendedores.find(v => v.usuario === usuario)) { alert("Ese usuario ya existe"); return; }

  vendedores.push({ usuario, password });
  localStorage.setItem("vendedores", JSON.stringify(vendedores));
  document.getElementById("v-usuario").value = "";
  document.getElementById("v-password").value = "";
  alert("Vendedor agregado");
  cargarVendedores();
}

function eliminarVendedor(index) {
  if (!confirm("¿Eliminar este vendedor?")) return;
  const vendedores = JSON.parse(localStorage.getItem("vendedores") || "[]");
  vendedores.splice(index, 1);
  localStorage.setItem("vendedores", JSON.stringify(vendedores));
  cargarVendedores();
}
