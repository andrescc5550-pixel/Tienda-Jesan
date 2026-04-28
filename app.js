// etectar automáticamente la API
// Si estás en tu PC usa localhost, si no, usa la URL real de Render
const API = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000/productos"
    : "https://tienda-jesan.onrender.com/productos"; 

let editando = false;
let idEditar = null;

// CARGAR PRODUCTOS
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
                <div style="padding: 10px; border-bottom: 1px solid #eee; margin-bottom: 10px;">
                    <span>
                        <strong>${p.nombre}</strong> - Q${p.precio} - Stock: ${p.cantidad}<br>
                        <small>${p.descripcion || "Sin descripción"}</small><br>
                        <small style="color: gray; font-size: 10px;">Imagen: ${p.imagen ? "URL presente" : "Sin imagen"}</small>
                    </span>
                    <div class="botones" style="margin-top: 10px;">
                        <button class="btn-editar" style="background: orange; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 4px;">Editar</button>
                        <button class="btn-eliminar" style="background: red; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 4px; margin-left: 5px;">Eliminar</button>
                    </div>
                </div>
            `;

            // 🔥 Eventos seguros
            div.querySelector(".btn-editar").addEventListener("click", () => cargarEditar(p));
            div.querySelector(".btn-eliminar").addEventListener("click", () => eliminar(p.id));

            lista.appendChild(div);
        });

    } catch (error) {
        console.error("Error cargando productos:", error);
        document.getElementById("lista").innerHTML = "Error al conectar con el servidor.";
    }
}

// 🔹 FORMULARIO (GUARDAR O ACTUALIZAR)
document.getElementById("formulario").addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value.trim();
    const precio = Number(document.getElementById("precio").value);
    const cantidad = Number(document.getElementById("cantidad").value);
    const imagen = document.getElementById("imagen").value.trim();
    const descripcion = document.getElementById("descripcion").value.trim();

    if (!nombre || !precio || isNaN(cantidad)) {
        alert("Completa los campos obligatorios");
        return;
    }

    const datos = { nombre, precio, cantidad, imagen, descripcion };

    try {
        let url = API;
        let metodo = "POST";

        if (editando) {
            url = `${API}/${idEditar}`;
            metodo = "PUT";
        }

        const res = await fetch(url, {
            method: metodo,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos)
        });

        if (res.ok) {
            alert(editando ? "Producto actualizado" : "Producto agregado");
            editando = false;
            idEditar = null;
            document.querySelector(".btn-agregar").innerText = "Guardar"; // Restaurar texto del botón
            document.getElementById("formulario").reset();
            cargarProductos();
        } else {
            alert("Error en la respuesta del servidor");
        }

    } catch (error) {
        console.error("Error guardando producto:", error);
        alert("Error al conectar con el servidor");
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
    
    // Cambiar el texto del botón para que el usuario sepa que está editando
    document.querySelector(".btn-agregar").innerText = "Actualizar Cambios";
    
    // Hacer scroll hacia arriba para ver el formulario
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 🔹 ELIMINAR
async function eliminar(id) {
    if (!confirm("¿Seguro que quieres eliminar este producto?")) return;

    try {
        const res = await fetch(`${API}/${id}`, { method: "DELETE" });
        if (res.ok) {
            alert("Producto eliminado");
            cargarProductos();
        }
    } catch (error) {
        console.error("Error eliminando:", error);
        alert("No se pudo eliminar");
    }
}

// INICIAL
cargarProductos();
