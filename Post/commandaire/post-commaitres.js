/**
 * ============================================================
 * ROUTES POUR POSTS ET COMMENTAIRES
 * ============================================================
 * 
 * Module responsable de la gestion complète des:
 * - Posts (création, lecture, affichage)
 * - Commentaires (création, lecture)
 * - Images d'upload (intégré avec post-upload.js)
 * 
 * Utilise:
 * - post-upload.js pour le traitement des images
 * - database.js pour les opérations SQL
 * 
 * @requires post-upload.js (parsePostWithImage, handleImageUpload)
 */

const { parsePostWithImage } = require('./post-upload');

/**
 * GET /api/posts
 * ============================================================
 * Récupère TOUS les posts publiés, triés par date décroissante
 * 
 * @method GET
 * @param {string} pathname '/api/posts'
 * @param {Object} req - Objet requête HTTP
 * @param {Object} res - Objet réponse HTTP
 * 
 * @returns {Array<Object>} Liste de tous les posts avec:
 *   - id (numéro unique du post)
 *   - utilisateur_id (ID de l'auteur)
 *   - pseudo (nom d'utilisateur - RÉCUPÉRÉ via JOIN)
 *   - titre (titre du post)
 *   - contenu (texte du post)
 *   - categorie_id (catégorie du post, peut être null)
 *   - image_path (chemin vers l'image, peut être null)
 *   - nb_vues (nombre de vues du post)
 *   - date_creation (quand le post a été créé)
 *   - date_modification (dernière modification)
 * 
 * @example
 * // Requête
 * GET /api/posts
 * 
 * // Réponse (200 OK)
 * [
 *   {
 *     "id": 1,
 *     "utilisateur_id": 5,
 *     "pseudo": "jdupont",
 *     "titre": "Mon premier post",
 *     "contenu": "Contenu du post...",
 *     "categorie_id": 2,
 *     "image_path": "uploads/1622548800000-xyz.jpg",
 *     "nb_vues": 42,
 *     "date_creation": "2026-05-28 10:30:00",
 *     "date_modification": "2026-05-28 10:30:00"
 *   },
 *   ...
 * ]
 * 
 * @note
 * - Les posts sont triés par date_creation DESC (plus récent d'abord)
 * - Le pseudo vient d'une JOIN avec la table utilisateurs
 * - Pas de filtre: tous les posts sont retournés
 * - Limite: aucune (attention si beaucoup de posts!)
 */
if (pathname === '/api/posts' && req.method === 'GET') {
  // JOIN: posts + utilisateurs pour récupérer le pseudo
  queryDB('SELECT posts.*, utilisateurs.pseudo FROM posts JOIN utilisateurs ON posts.utilisateur_id = utilisateurs.id ORDER BY posts.date_creation DESC', [], false, (err, rows) => {
    respond(res, err ? 500 : 200, err ? { error: err.message } : (rows || []));
  });
  return;
}

/**
 * GET /api/posts/:id
 * ============================================================
 * Récupère UN post spécifique ET tous ses commentaires
 * 
 * @method GET
 * @param {string} pathname '/api/posts/:id' (exemple: /api/posts/5)
 * @param {number} id - Identifiant unique du post
 * @param {Object} req - Objet requête HTTP
 * @param {Object} res - Objet réponse HTTP
 * 
 * @returns {Object} Post complet avec tous ses commentaires:
 *   - [post fields] (voir GET /api/posts)
 *   - commentaires: Array<Object> (liste vide si aucun commentaire)
 *     - id (ID du commentaire)
 *     - post_id (ID du post)
 *     - utilisateur_id (ID de l'auteur du commentaire)
 *     - pseudo (pseudo de l'auteur - RÉCUPÉRÉ via JOIN)
 *     - contenu (texte du commentaire)
 *     - date_creation (quand le commentaire a été créé)
 * 
 * @example
 * // Requête
 * GET /api/posts/5
 * 
 * // Réponse (200 OK)
 * {
 *   "id": 5,
 *   "utilisateur_id": 3,
 *   "pseudo": "mariesmith",
 *   "titre": "Discussion importante",
 *   "contenu": "Voici mon avis sur...",
 *   "categorie_id": 1,
 *   "image_path": null,
 *   "nb_vues": 120,
 *   "date_creation": "2026-05-27 14:30:00",
 *   "commentaires": [
 *     {
 *       "id": 1,
 *       "post_id": 5,
 *       "utilisateur_id": 7,
 *       "pseudo": "johnbrown",
 *       "contenu": "Je suis d'accord!",
 *       "date_creation": "2026-05-27 15:00:00"
 *     },
 *     {
 *       "id": 2,
 *       "post_id": 5,
 *       "utilisateur_id": 2,
 *       "pseudo": "alice_dev",
 *       "contenu": "Bonne observation!",
 *       "date_creation": "2026-05-27 15:30:00"
 *     }
 *   ]
 * }
 * 
 * @error 404 - Si le post n'existe pas
 * 
 * @note
 * - Les commentaires sont triés par date_creation DESC (plus récent d'abord)
 * - Les commentaires incluent le pseudo de l'auteur (JOIN)
 * - Si le post n'existe pas, retour 404 "Post non trouvé"
 * - Si le post existe mais n'a pas de commentaires, commentaires = []
 */
if (pathname.startsWith('/api/posts/') && req.method === 'GET') {
  const id = pathname.split('/')[3];
  
  // Première requête: récupérer le post avec le pseudo de l'auteur
  queryDB('SELECT posts.*, utilisateurs.pseudo FROM posts JOIN utilisateurs ON posts.utilisateur_id = utilisateurs.id WHERE posts.id = ?', [id], true, (err, post) => {
    if (err || !post) {
      respond(res, 404, { error: 'Post non trouvé' });
      return;
    }
    
    // Deuxième requête: récupérer tous les commentaires du post avec le pseudo de chaque auteur
    queryDB('SELECT commentaires.*, utilisateurs.pseudo FROM commentaires JOIN utilisateurs ON commentaires.utilisateur_id = utilisateurs.id WHERE commentaires.post_id = ? ORDER BY commentaires.date_creation DESC', [id], false, (err, commentaires) => {
      respond(res, 200, { ...post, commentaires: commentaires || [] });
    });
  });
  return;
}

/**
 * POST /api/posts
 * ============================================================
 * Crée un NOUVEAU post avec support d'image optionnel
 * 
 * @method POST
 * @param {string} pathname '/api/posts'
 * @param {Object} req - Objet requête HTTP
 * @param {Object} res - Objet réponse HTTP
 * 
 * @body {Object} Données multipart/form-data (pas JSON):
 *   - titre {string} REQUIS - Titre du post (texte court)
 *   - contenu {string} REQUIS - Contenu complet du post
 *   - utilisateur_id {number} REQUIS - ID de l'auteur (doit être connecté)
 *   - categorie_id {number} OPTIONNEL - ID de la catégorie (null = sans catégorie)
 *   - image {File} OPTIONNEL - Fichier image (JPEG, PNG, GIF, WebP, BMP)
 *     - Sera validé par file-type (vérification MIME)
 *     - Sera sauvegardé en /uploads avec nom unique (timestamp-random.ext)
 *     - Chemin retourné dans image_path
 * 
 * @returns {Object} Post créé (201 CREATED):
 *   - id (ID du post nouvellement créé)
 *   - titre (titre du post)
 *   - contenu (contenu du post)
 *   - image_path (chemin vers l'image ou null)
 *   - categorie_id (ID de la catégorie ou null)
 * 
 * @example
 * // Requête avec FormData (JavaScript)
 * const formData = new FormData();
 * formData.append('titre', 'Mon nouveau post');
 * formData.append('contenu', 'Voici le contenu de mon post...');
 * formData.append('utilisateur_id', 5);
 * formData.append('categorie_id', 2);
 * formData.append('image', fileInput.files[0]);
 * 
 * fetch('/api/posts', {
 *   method: 'POST',
 *   body: formData
 * })
 * 
 * // Réponse (201 CREATED)
 * {
 *   "id": 42,
 *   "titre": "Mon nouveau post",
 *   "contenu": "Voici le contenu de mon post...",
 *   "image_path": "uploads/1622548800000-abc123.jpg",
 *   "categorie_id": 2
 * }
 * 
 * @error 400 - Si titre, contenu ou utilisateur_id est manquant
 * @error 400 - Si le fichier image n'est pas un type MIME accepté
 * @error 500 - Erreur interne serveur
 * 
 * @note
 * - parsePostWithImage() gère multipart/form-data ET validation d'image
 * - Les fichiers images sont sauvegardés en /uploads
 * - Les noms de fichier sont générés automatiquement (timestamp-random)
 * - image_path peut être null si aucune image n'est uploadée
 * - categorie_id peut être null
 * - date_creation et date_modification sont définis automatiquement en BDD
 */
// Route: POST /api/posts (avec upload d'image)
if (pathname === '/api/posts' && req.method === 'POST') {
  // parsePostWithImage() depuis post-upload.js gère:
  // - Parsing multipart/form-data
  // - Validation du MIME type
  // - Sauvegarde du fichier en /uploads
  parsePostWithImage(req)
    .then(data => {
      const { titre, contenu, utilisateur_id, categorie_id, image_path } = data;
      
      // Validation des champs obligatoires
      if (!titre || !contenu || !utilisateur_id) {
        respond(res, 400, { error: 'Titre, contenu et utilisateur_id requis' });
        return;
      }

      // Insertion du post en base de données
      db.run(
        'INSERT INTO posts (utilisateur_id, titre, contenu, categorie_id, image_path) VALUES (?, ?, ?, ?, ?)',
        [utilisateur_id, titre, contenu, categorie_id || null, image_path || null],
        function(err) {
          respond(res, err ? 500 : 201, err ? { error: err.message } : { 
            id: this.lastID,  // ID auto-généré par SQLite
            titre, 
            contenu, 
            image_path,
            categorie_id 
          });
        }
      );
    })
    .catch(err => {
      // Erreurs de parsing d'image ou multipart
      respond(res, 400, { error: err.message });
    });
  return;
}

/**
 * POST /api/posts/:id/commentaires
 * ============================================================
 * Crée un NOUVEAU commentaire sur un post existant
 * 
 * @method POST
 * @param {string} pathname '/api/posts/:id/commentaires' (exemple: /api/posts/5/commentaires)
 * @param {number} id - Identifiant du post auquel ajouter le commentaire
 * @param {Object} req - Objet requête HTTP
 * @param {Object} res - Objet réponse HTTP
 * 
 * @body {Object} Données JSON:
 *   - utilisateur_id {number} REQUIS - ID de l'auteur du commentaire
 *   - contenu {string} REQUIS - Texte du commentaire
 * 
 * @returns {Object} Commentaire créé (201 CREATED):
 *   - id (ID du commentaire)
 *   - post_id (ID du post)
 *   - utilisateur_id (ID de l'auteur)
 *   - contenu (texte du commentaire)
 * 
 * @example
 * // Requête
 * POST /api/posts/5/commentaires
 * Content-Type: application/json
 * 
 * {
 *   "utilisateur_id": 7,
 *   "contenu": "Excellente analyse!"
 * }
 * 
 * // Réponse (201 CREATED)
 * {
 *   "id": 15,
 *   "post_id": 5,
 *   "utilisateur_id": 7,
 *   "contenu": "Excellente analyse!"
 * }
 * 
 * @error 400 - Si utilisateur_id ou contenu est manquant
 * @error 500 - Erreur interne serveur (ex: post n'existe pas)
 * 
 * @note
 * - date_creation est défini automatiquement en BDD
 * - Pas de vérification que le post existe (à ajouter en cas d'erreur 500)
 * - parseBody() est utilisé pour parser le JSON
 */
// Route: POST /api/posts/:id/commentaires
if (pathname.includes('/api/posts/') && pathname.includes('/commentaires') && req.method === 'POST') {
  const id = pathname.split('/')[3];
  
  // Parse le corps de la requête (JSON)
  parseBody(req, (data) => {
    const { utilisateur_id, contenu } = data;
    
    // Validation des champs obligatoires
    if (!utilisateur_id || !contenu) {
      respond(res, 400, { error: 'Utilisateur ID et contenu requis' });
      return;
    }

    // Insertion du commentaire en base de données
    db.run(
      'INSERT INTO commentaires (post_id, utilisateur_id, contenu) VALUES (?, ?, ?)',
      [id, utilisateur_id, contenu],
      function(err) {
        respond(res, err ? 500 : 201, err ? { error: err.message } : { 
          id: this.lastID,  // ID auto-généré par SQLite
          post_id: id, 
          utilisateur_id, 
          contenu 
        });
      }
    );
  });
  return;
}

/**
 * ============================================================
 * FIN DES ROUTES
 * ============================================================
 * 
 * Résumé des opérations supportées:
 * 
 * 1. GET /api/posts
 *    → Récupère tous les posts (triés par date)
 * 
 * 2. GET /api/posts/:id
 *    → Récupère un post + tous ses commentaires
 * 
 * 3. POST /api/posts
 *    → Crée un nouveau post (optionnellement avec image)
 * 
 * 4. POST /api/posts/:id/commentaires
 *    → Ajoute un commentaire à un post
 * 
 * TODO: Routes manquantes
 * - DELETE /api/posts/:id (supprimer un post)
 * - PUT /api/posts/:id (modifier un post)
 * - DELETE /api/posts/:id/commentaires/:commentId (supprimer commentaire)
 * - POST /api/posts/:id/like (aimer un post)
 * - POST /api/posts/:id/unlike (ne plus aimer)
 */
