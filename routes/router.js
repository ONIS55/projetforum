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

// Importer les modules des routes API
const { handleApiRoutes } = require('../Post/commandaire/post-commaitres.js');

/**
 * Parser le body JSON/urlencoded
 * @param {Object} req - Requête HTTP
 * @param {Function} callback - Callback(data)
 */
/**
 * Parser le body JSON/urlencoded (pas utilisé ici, voir post-commaitres-api.js)
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
  // ROUTES API - POSTS & COMMENTAIRES
  // ============================================================
  // Déléguer à post-commaitres-api.js
  if (pathname.startsWith('/api/')) {
    if (handleApiRoutes(req, res)) return;
  }

  // ============================================================
  // Route 404 - Non trouvée
  // ============================================================
  respond(res, 404, { error: 'Route non trouvée', path: pathname });
}

module.exports = router;
