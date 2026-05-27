const http = require('http');
const sqlite3 = require('sqlite3').verbose();
const router = require('./routes/router.js');

const PORT = 3000;

// Connexion à la base de données SQLite
const db = new sqlite3.Database('./Base.db', (err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données:', err);
  } else {
    console.log('Connecté à la base de données SQLite');
    initializeDB();
  }
});

// Initialiser la base de données avec les tables
function initializeDB() {
  db.run(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titre TEXT NOT NULL,
      contenu TEXT NOT NULL,
      auteur TEXT NOT NULL,
      prenom TEXT NOT NULL,
      email TEXT NOT NULL,
      pseudo TEXT NOT NULL,
      date_creation DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('Erreur création table posts:', err);
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS commentaires (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      auteur TEXT NOT NULL,
      contenu TEXT NOT NULL,
      date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id)
    )
  `, (err) => {
    if (err) console.error('Erreur création table commentaires:', err);
  });
}

// Parser le body JSON/urlencoded
function parseBody(req, callback) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  req.on('end', () => {
    try {
      if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
        callback(JSON.parse(body));
      } else {
        callback(require('querystring').parse(body));
      }
    } catch (e) {
      callback({});
    }
  });
}

// Fonction helper pour répondre au client
function respond(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// Fonction helper pour requêtes database
function queryDB(sql, params, single, callback) {
  if (single) {
    db.get(sql, params, callback);
  } else {
    db.all(sql, params, callback);
  }
}

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
