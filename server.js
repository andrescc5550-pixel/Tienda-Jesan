const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// 🔥 CONEXIÓN MEJORADA PARA RAILWAY
const db = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: Number(process.env.MYSQLPORT) || 3306, // Convertimos a número por seguridad
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
// Probar conexión
db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Error al conectar a Railway:", err);
    return;
  }
  console.log("✅ Conectado a la base de datos de Railway");
  connection.release();
});

// Rutas (He simplificado la referencia a db usando .query directamente del pool)
app.get("/productos", (req, res) => {
  db.query("SELECT * FROM productos", (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

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

app.delete("/productos/:id", (req, res) => {
  db.query("DELETE FROM productos WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ mensaje: "Eliminado" });
  });
});

// El puerto debe ser dinámico para Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});
