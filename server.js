const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

// Servir archivos estáticos
app.use(express.static(path.join(__dirname)));

// Rutas de páginas
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});
app.get("/inventario", (req, res) => {
  res.sendFile(path.join(__dirname, "inventario.html"));
});
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "login.html"));
});
app.get("/mensajes", (req, res) => {
  res.sendFile(path.join(__dirname, "mensajes.html"));
});
app.get("/producto", (req, res) => {
  res.sendFile(path.join(__dirname, "producto.html"));
});

// Conexión a base de datos
const dbUrl = process.env.DATABASE_URL;

const db = dbUrl
  ? mysql.createConnection(dbUrl + "?ssl-mode=REQUIRED")
  : mysql.createConnection({
      host: process.env.MYSQLHOST || "localhost",
      user: process.env.MYSQLUSER || "root",
      password: process.env.MYSQLPASSWORD || "",
      database: process.env.MYSQLDATABASE || "test",
      port: process.env.MYSQLPORT || 3306
    });

db.connect(err => {
  if (err) {
    console.error("❌ Error al conectar a la base de datos:", err);
    return;
  }
  console.log("✅ Conectado exitosamente a la base de datos");

  db.query(`
    CREATE TABLE IF NOT EXISTS productos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(255) NOT NULL,
      precio DECIMAL(10,2) NOT NULL,
      cantidad INT NOT NULL DEFAULT 0,
      imagen TEXT,
      descripcion TEXT
    )
  `, err => { if (err) console.error("Error tabla productos:", err); });

  db.query(`
    CREATE TABLE IF NOT EXISTS mensajes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(255),
      mensaje TEXT,
      fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `, err => { if (err) console.error("Error tabla mensajes:", err); });
});

// GET - Todos los productos
app.get("/productos", (req, res) => {
  db.query("SELECT * FROM productos", (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// GET - Un producto por ID
app.get("/productos/:id", (req, res) => {
  db.query("SELECT * FROM productos WHERE id = ?", [req.params.id], (err, results) => {
    if (err) return res.status(500).json(err);
    if (!results.length) return res.status(404).json({ mensaje: "No encontrado" });
    res.json(results[0]);
  });
});

// POST - Crear producto
app.post("/productos", (req, res) => {
  const { nombre, precio, cantidad, imagen, descripcion } = req.body;
  db.query(
    "INSERT INTO productos (nombre, precio, cantidad, imagen, descripcion) VALUES (?, ?, ?, ?, ?)",
    [nombre, precio, cantidad, imagen, descripcion],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ id: result.insertId });
    }
  );
});

// PUT - Actualizar producto
app.put("/productos/:id", (req, res) => {
  const { nombre, precio, cantidad, imagen, descripcion } = req.body;
  db.query(
    "UPDATE productos SET nombre=?, precio=?, cantidad=?, imagen=?, descripcion=? WHERE id=?",
    [nombre, precio, cantidad, imagen, descripcion, req.params.id],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ mensaje: "Actualizado" });
    }
  );
});

// DELETE - Eliminar producto
app.delete("/productos/:id", (req, res) => {
  db.query("DELETE FROM productos WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ mensaje: "Eliminado" });
  });
});

// PUT - Comprar (restar stock)
app.put("/comprar/:id", (req, res) => {
  const { cantidad } = req.body;
  db.query("SELECT cantidad FROM productos WHERE id = ?", [req.params.id], (err, result) => {
    if (err) return res.status(500).json(err);
    if (!result || result.length === 0) return res.json({ mensaje: "Producto no encontrado" });

    const stock = result[0].cantidad;
    if (cantidad > stock) return res.json({ mensaje: "No hay suficiente stock" });

    db.query("UPDATE productos SET cantidad = ? WHERE id = ?", [stock - cantidad, req.params.id], (err2) => {
      if (err2) return res.status(500).json(err2);
      res.json({ mensaje: "Compra realizada correctamente" });
    });
  });
});

// GET - Obtener mensajes
app.get("/mensajes-data", (req, res) => {
  db.query("SELECT * FROM mensajes ORDER BY fecha DESC", (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// POST - Enviar mensaje
app.post("/mensajes-data", (req, res) => {
  const { nombre, mensaje } = req.body;
  db.query("INSERT INTO mensajes (nombre, mensaje) VALUES (?, ?)", [nombre, mensaje], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ id: result.insertId });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});
