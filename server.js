const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require("socket.io")(http);


// 🔧 Anti-cache
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

// Statique (sert le HTML, CSS, JS)
app.use(express.static(__dirname));

// Page d'accueil
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
});
