const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

// 🔥 SERVIR ARCHIVOS
app.use(express.static(__dirname));

// 🔥 RUTA PRINCIPAL
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});
// 🔥 CONEXIÓN CORREGIDA
const db = mysql.createConnection({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT
});

db.connect(err => {
  if (err) {
    console.error("❌ Error al conectar:", err);
    return;
  }
  console.log("✅ Conectado a MySQL");
});

// 🔹 GET
app.get("/productos", (req, res) => {
  db.query("SELECT * FROM productos", (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json(err);
    }
    res.json(results);
  });
});

// 🔹 POST
app.post("/productos", (req, res) => {
  const { nombre, precio, cantidad, imagen, descripcion } = req.body;

  db.query(
    "INSERT INTO productos (nombre, precio, cantidad, imagen, descripcion) VALUES (?, ?, ?, ?, ?)",
    [nombre, precio, cantidad, imagen, descripcion],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json(err);
      }
      res.json({ id: result.insertId });
    }
  );
});

// 🔹 PUT
app.put("/productos/:id", (req, res) => {
  const { nombre, precio, cantidad, imagen, descripcion } = req.body;

  db.query(
    "UPDATE productos SET nombre=?, precio=?, cantidad=?, imagen=?, descripcion=? WHERE id=?",
    [nombre, precio, cantidad, imagen, descripcion, req.params.id],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json(err);
      }
      res.json({ mensaje: "Actualizado" });
    }
  );
});

// 🔹 DELETE
app.delete("/productos/:id", (req, res) => {
  db.query(
    "DELETE FROM productos WHERE id=?",
    [req.params.id],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json(err);
      }
      res.json({ mensaje: "Eliminado" });
    }
  );
});

// 🛒 COMPRAR
app.put("/comprar/:id", (req, res) => {
  const { cantidad } = req.body;

  db.query(
    "SELECT cantidad FROM productos WHERE id = ?",
    [req.params.id],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json(err);
      }

      if (!result || result.length === 0) {
        return res.json({ mensaje: "Producto no encontrado" });
      }

      const stock = result[0].cantidad;

      if (cantidad > stock) {
        return res.json({ mensaje: "No hay suficiente stock" });
      }

      const nuevoStock = stock - cantidad;

      db.query(
        "UPDATE productos SET cantidad = ? WHERE id = ?",
        [nuevoStock, req.params.id],
        (err2) => {
          if (err2) {
            console.error(err2);
            return res.status(500).json(err2);
          }

          res.json({ mensaje: "Compra realizada correctamente" });
        }
      );
    }
  );
});

// 🔹 SERVIDOR
app.listen(3000, () => {
  console.log("🚀 Servidor corriendo en http://localhost:3000");
});
