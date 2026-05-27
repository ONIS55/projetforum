/**
 * ============================================================
 * ROUTEUR CENTRAL - Gère toutes les routes du forum
 * ============================================================
 * 
 * Responsabilités:
 * - Dispatcher les requêtes vers le bon gestionnaire
 * - Servir les fichiers statiques (/ , /public/*, /uploads/*)
 * - Router les requêtes API (/api/posts, /api/commentaires)
 * 
 * Appelé par: server.js
 * Utilise: post-upload.js, database.js, post-commaitres.js
 */

const fs = require('fs');
const path = require('path');
const url = require('url');
const querystring = require('querystring');

// Importer les modules
const { parsePostWithImage } = require('../Post/commandaire/post-upload.js');

/**
 * Parser le body JSON/urlencoded
 * @param {Object} req - Requête HTTP
 * @param {Function} callback - Callback(data)
 */
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
        callback(querystring.parse(body));
      }
    } catch (e) {
      callback({});
    }
  });
}

/**
 * Helper pour répondre au client
 * @param {Object} res - Réponse HTTP
 * @param {number} statusCode - Code HTTP
 * @param {Object} data - Données JSON
 */
function respond(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

/**
 * Helper pour les requêtes database
 * @param {string} sql - Requête SQL
 * @param {Array} params - Paramètres
 * @param {boolean} single - true = db.get(), false = db.all()
 * @param {Function} callback - Callback(err, result)
 */
function queryDB(sql, params, single, callback) {
  if (single) {
    global.db.get(sql, params, callback);
  } else {
    global.db.all(sql, params, callback);
  }
}

/**
 * Routeur principal
 * @param {Object} req - Requête HTTP
 * @param {Object} res - Réponse HTTP
 */
function router(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  // ============================================================
  // ROUTES STATIQUES
  // ============================================================

  /**
   * GET /
   * Servir l'interface du forum
   */
  if ((pathname === '/' || pathname === '/index.html') && req.method === 'GET') {
    fs.readFile(path.join(__dirname, '../public/interface-web.html'), (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('Erreur 404: Interface non trouvée');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
    });
    return;
  }

  /**
   * GET /public/*
   * Servir les fichiers statiques (CSS, JS, images)
   */
  if (pathname.startsWith('/public/')) {
    const filePath = path.join(__dirname, '../' + pathname);
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Fichier non trouvé');
        return;
      }
      
      // Déterminer le Content-Type
      const ext = path.extname(filePath);
      const contentTypes = {
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.html': 'text/html',
        '.jpg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml'
      };
      
      const contentType = contentTypes[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
    return;
  }

  /**
   * GET /uploads/*
   * Servir les images uploadées
   */
  if (pathname.startsWith('/uploads/')) {
    const filePath = path.join(__dirname, '../' + pathname);
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Image non trouvée');
        return;
      }
      const ext = path.extname(filePath);
      const contentTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.bmp': 'image/bmp'
      };
      const contentType = contentTypes[ext] || 'image/jpeg';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
    return;
  }

  // ============================================================
  // ROUTES API - POSTS
  // ============================================================

  /**
   * GET /api/posts
   * Récupère tous les posts (avec pseudo de l'auteur)
   */
  if (pathname === '/api/posts' && req.method === 'GET') {
    queryDB(
      `SELECT posts.*, utilisateurs.pseudo 
       FROM posts 
       JOIN utilisateurs ON posts.utilisateur_id = utilisateurs.id 
       ORDER BY posts.date_creation DESC`,
      [],
      false,
      (err, rows) => {
        respond(res, err ? 500 : 200, err ? { error: err.message } : (rows || []));
      }
    );
    return;
  }

  /**
   * GET /api/posts/:id
   * Récupère un post spécifique avec ses commentaires
   */
  if (pathname.startsWith('/api/posts/') && !pathname.includes('/commentaires') && req.method === 'GET') {
    const id = pathname.split('/')[3];
    
    queryDB(
      `SELECT posts.*, utilisateurs.pseudo 
       FROM posts 
       JOIN utilisateurs ON posts.utilisateur_id = utilisateurs.id 
       WHERE posts.id = ?`,
      [id],
      true,
      (err, post) => {
        if (err || !post) {
          respond(res, 404, { error: 'Post non trouvé' });
          return;
        }
        
        queryDB(
          `SELECT commentaires.*, utilisateurs.pseudo 
           FROM commentaires 
           JOIN utilisateurs ON commentaires.utilisateur_id = utilisateurs.id 
           WHERE commentaires.post_id = ? 
           ORDER BY commentaires.date_creation DESC`,
          [id],
          false,
          (err, commentaires) => {
            respond(res, 200, { ...post, commentaires: commentaires || [] });
          }
        );
      }
    );
    return;
  }

  /**
   * POST /api/posts
   * Crée un nouveau post (optionnellement avec image)
   */
  if (pathname === '/api/posts' && req.method === 'POST') {
    parsePostWithImage(req)
      .then(data => {
        const { titre, contenu, utilisateur_id, categorie_id, image_path } = data;
        
        if (!titre || !contenu || !utilisateur_id) {
          respond(res, 400, { error: 'Titre, contenu et utilisateur_id requis' });
          return;
        }

        global.db.run(
          'INSERT INTO posts (utilisateur_id, titre, contenu, categorie_id, image_path) VALUES (?, ?, ?, ?, ?)',
          [utilisateur_id, titre, contenu, categorie_id || null, image_path || null],
          function(err) {
            respond(res, err ? 500 : 201, err ? { error: err.message } : { 
              id: this.lastID, 
              titre, 
              contenu, 
              image_path,
              categorie_id 
            });
          }
        );
      })
      .catch(err => {
        respond(res, 400, { error: err.message });
      });
    return;
  }

  // ============================================================
  // ROUTES API - COMMENTAIRES
  // ============================================================

  /**
   * POST /api/posts/:id/commentaires
   * Ajoute un commentaire à un post
   */
  if (pathname.includes('/api/posts/') && pathname.includes('/commentaires') && req.method === 'POST') {
    const id = pathname.split('/')[3];
    
    parseBody(req, (data) => {
      const { utilisateur_id, contenu } = data;
      
      if (!utilisateur_id || !contenu) {
        respond(res, 400, { error: 'Utilisateur ID et contenu requis' });
        return;
      }

      global.db.run(
        'INSERT INTO commentaires (post_id, utilisateur_id, contenu) VALUES (?, ?, ?)',
        [id, utilisateur_id, contenu],
        function(err) {
          respond(res, err ? 500 : 201, err ? { error: err.message } : { 
            id: this.lastID, 
            post_id: id, 
            utilisateur_id, 
            contenu 
          });
        }
      );
    });
    return;
  }

  // ============================================================
  // Route 404 - Non trouvée
  // ============================================================
  respond(res, 404, { error: 'Route non trouvée', path: pathname });
}

module.exports = router;
