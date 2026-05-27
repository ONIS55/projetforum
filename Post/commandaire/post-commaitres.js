/**
 * ============================================================
 * ROUTES POUR POSTS ET COMMENTAIRES
 * ============================================================
 * 
 * Module responsable de la gestion complète des routes API:
 * - GET /api/posts - Récupère tous les posts
 * - GET /api/posts/:id - Récupère un post avec ses commentaires
 * - POST /api/posts - Crée un nouveau post (avec image optionnelle)
 * - POST /api/posts/:id/commentaires - Ajoute un commentaire
 * 
 * Utilise:
 * - post-upload.js: parsePostWithImage() pour valider et sauvegarder les images
 * - global.db: instance de la base de données (fournie par server.js)
 * 
 * @exports {Function} handleApiRoutes(req, res) - Gestionnaire des routes API
 */

const url = require('url');
const { parsePostWithImage } = require('./post-upload');
const { obtenirPostsAvecFiltres } = require('./Authentification/filtres-port');

/**
 * Helper pour répondre au client
 */
function respond(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

/**
 * Helper pour parser le body JSON
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
        callback({});
      }
    } catch (e) {
      callback({});
    }
  });
}

/**
 * Gestionnaire principal des routes API /api/*
 * 
 * @param {Object} req - Requête HTTP
 * @param {Object} res - Réponse HTTP
 * @returns {boolean} true si une route a été gérée, false sinon
 * 
 * @example
 * // Dans router.js
 * const { handleApiRoutes } = require('./Post/commandaire/post-commaitres.js');
 * if (handleApiRoutes(req, res)) return;
 */
function handleApiRoutes(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // ============================================================
  // GET /api/posts - Récupère tous les posts avec filtres optionnels
  // Query params: ?filtre_mine=true&filtre_likes=true&categorie_id=2
  // ============================================================
  if (pathname === '/api/posts' && req.method === 'GET') {
    const query = parsedUrl.query;
    const user_id = query.user_id ? parseInt(query.user_id) : null;
    const filtre_mine = query.filtre_mine === 'true';
    const filtre_likes = query.filtre_likes === 'true';
    const categorie_id = query.categorie_id ? parseInt(query.categorie_id) : null;
    const limit = query.limit ? parseInt(query.limit) : 10;
    const offset = query.offset ? parseInt(query.offset) : 0;

    obtenirPostsAvecFiltres({
      user_id,
      filtre_mine,
      filtre_likes,
      categorie_id,
      limit,
      offset
    })
      .then(rows => {
        respond(res, 200, rows || []);
      })
      .catch(err => {
        respond(res, 500, { error: err.message });
      });
    return true;
  }

  // ============================================================
  // GET /api/posts/:id - Récupère un post avec ses commentaires
  // ============================================================
  if (pathname.startsWith('/api/posts/') && !pathname.includes('/commentaires') && req.method === 'GET') {
    const id = pathname.split('/')[3];
    
    global.db.get(
      `SELECT posts.*, utilisateurs.pseudo 
       FROM posts 
       JOIN utilisateurs ON posts.utilisateur_id = utilisateurs.id 
       WHERE posts.id = ?`,
      [id],
      (err, post) => {
        if (err || !post) {
          respond(res, 404, { error: 'Post non trouvé' });
          return;
        }
        
        global.db.all(
          `SELECT commentaires.*, utilisateurs.pseudo 
           FROM commentaires 
           JOIN utilisateurs ON commentaires.utilisateur_id = utilisateurs.id 
           WHERE commentaires.post_id = ? 
           ORDER BY commentaires.date_creation DESC`,
          [id],
          (err, commentaires) => {
            respond(res, 200, { ...post, commentaires: commentaires || [] });
          }
        );
      }
    );
    return true;
  }

  // ============================================================
  // POST /api/posts - Crée un nouveau post (avec upload image optionnel)
  // ============================================================
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
    return true;
  }

  // ============================================================
  // POST /api/posts/:id/commentaires - Ajoute un commentaire
  // ============================================================
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
    return true;
  }

  // Route non gérée par ce module
  return false;
}

module.exports = { handleApiRoutes };
