const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// 🔥 CONEXIÓN PARA RAILWAY (Usa variables de entorno)
const db = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: Number(process.env.MYSQLPORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Error al conectar a Railway:", err);
    return;
  }
  console.log("✅ Conectado a la base de datos de Railway");
  connection.release();
});

// RUTAS CRUD
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

// 🔥 RUTA PARA COMPRAR (Resta stock)
app.put("/comprar/:id", (req, res) => {
  const { cantidad } = req.body;
  const { id } = req.params;
  db.query(
    "UPDATE productos SET cantidad = cantidad - ? WHERE id = ? AND cantidad >= ?",
    [cantidad, id, cantidad],
    (err, result) => {
      if (err) return res.status(500).json(err);
      if (result.affectedRows === 0) {
        return res.status(400).json({ mensaje: "No hay suficiente stock" });
      }
      res.json({ mensaje: "✅ Compra exitosa" });
    }
  );
});

app.delete("/productos/:id", (req, res) => {
  db.query("DELETE FROM productos WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ mensaje: "Eliminado" });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor en puerto ${PORT}`);
});
