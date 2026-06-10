const http = require('http');
<<<<<<< HEAD
const router = require('./routes/router.js');
const { db } = require('./database.js');

const PORT = 3000;

// Serveur HTTP
const server = http.createServer((req, res) => {
  // Headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
=======
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const url = require('url');
const querystring = require('querystring');

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
      if (req.headers['content-type'].includes('application/json')) {
        callback(JSON.parse(body));
      } else {
        callback(querystring.parse(body));
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
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  // Headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
>>>>>>> 24e5554 (Forum)
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

<<<<<<< HEAD
  // Déléguer toutes les routes au routeur
  router(req, res);
=======
  // Route: GET /
  if (pathname === '/' && req.method === 'GET') {
    fs.readFile(path.join(__dirname, 'page.html'), (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Erreur: Fichier non trouvé');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
    return;
  }

  // Route: GET /api/posts
  if (pathname === '/api/posts' && req.method === 'GET') {
    queryDB('SELECT * FROM posts ORDER BY date_creation DESC', [], false, (err, rows) => {
      respond(res, err ? 500 : 200, err ? { error: err.message } : (rows || []));
    });
    return;
  }

  // Route: GET /api/posts/:id
  if (pathname.startsWith('/api/posts/') && req.method === 'GET') {
    const id = pathname.split('/')[3];
    
    queryDB('SELECT * FROM posts WHERE id = ?', [id], true, (err, post) => {
      if (err || !post) {
        respond(res, 404, { error: 'Post non trouvé' });
        return;
      }
      
      queryDB('SELECT * FROM commentaires WHERE post_id = ? ORDER BY date_creation DESC', [id], false, (err, commentaires) => {
        respond(res, 200, { ...post, commentaires: commentaires || [] });
      });
    });
    return;
  }

  // Route: POST /api/posts
  if (pathname === '/api/posts' && req.method === 'POST') {
    parseBody(req, (data) => {
      const { titre, contenu, auteur, prenom, email, pseudo } = data;
      
      if (!titre || !contenu || !auteur || !prenom || !email || !pseudo) {
        respond(res, 400, { error: 'Tous les champs sont requis' });
        return;
      }

      db.run(
        'INSERT INTO posts (titre, contenu, auteur, prenom, email, pseudo) VALUES (?, ?, ?, ?, ?, ?)',
        [titre, contenu, auteur, prenom, email, pseudo],
        function(err) {
          respond(res, err ? 500 : 201, err ? { error: err.message } : { id: this.lastID, titre, contenu, auteur, prenom, email, pseudo });
        }
      );
    });
    return;
  }

  // Route: POST /api/posts/:id/commentaires
  if (pathname.includes('/api/posts/') && pathname.includes('/commentaires') && req.method === 'POST') {
    const id = pathname.split('/')[3];
    
    parseBody(req, (data) => {
      const { auteur, contenu } = data;
      
      if (!auteur || !contenu) {
        respond(res, 400, { error: 'Auteur et contenu requis' });
        return;
      }

      db.run(
        'INSERT INTO commentaires (post_id, auteur, contenu) VALUES (?, ?, ?)',
        [id, auteur, contenu],
        function(err) {
          respond(res, err ? 500 : 201, err ? { error: err.message } : { id: this.lastID, post_id: id, auteur, contenu });
        }
      );
    });
    return;
  }

  // Route non trouvée
  respond(res, 404, { error: 'Route non trouvée' });
>>>>>>> 24e5554 (Forum)
});

// Démarrer le serveur
server.listen(PORT, () => {
<<<<<<< HEAD
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

server.on('error', (err) => {
  console.error('Erreur serveur:', err);
=======
  console.log(`🚀 Serveur du forum lancé sur http://localhost:${PORT}`);
});

// Fermer la base de données en sortant
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) console.error(err);
    console.log('Base de données fermée');
    process.exit(0);
  });
>>>>>>> 24e5554 (Forum)
});
