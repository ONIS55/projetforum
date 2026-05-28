const http = require('http');
const router = require('./routes/router.js');
const { db } = require('./database.js');

const PORT = 3000;

// Serveur HTTP
const server = http.createServer((req, res) => {
  // Headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Déléguer toutes les routes au routeur
  router(req, res);
});

// Démarrer le serveur
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║    🚀 FORUM DÉMARRÉ                                        ║
║    📱 http://localhost:${PORT}                                  ║
║    🗄️  Base de données: Base.db                           ║
║    📂 Routes: routes/router.js                            ║
║    📄 Interface: public/interface-web.html                 ║
║    🖼️  Images: /uploads                                    ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});
});

// Fermer la base de données en sortant
process.on('SIGINT', () => {
  console.log('\n❌ Arrêt du serveur...');
  db.close((err) => {
    if (err) console.error('Erreur fermeture BDD:', err);
    console.log('✅ Base de données fermée');
    process.exit(0);
  });
});

module.exports = server;
