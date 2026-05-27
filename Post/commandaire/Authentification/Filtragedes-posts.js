const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./Base.db');

// ========================================
// FILTRAGE COMBINABLE DES POSTS & COMMENTAIRES
// ========================================
// 
// Filtrage	Statut
// 👤 Posts de l'utilisateur	✅ filtre_mine: true
// ❤️ Posts aimés	✅ filtre_likes: true
// 📂 Catégories/Thèmes	✅ categorie_id
//
// ========================================

// ==================== CATÉGORIES ====================

/**
 * Crée la table catégories si elle n'existe pas
 */
function creerTableCategories() {
  return new Promise((resolve, reject) => {
    db.run(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom TEXT UNIQUE NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT,
        date_creation DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Erreur création table catégories:', err);
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Insère une nouvelle catégorie
 * @param {string} nom - Nom de la catégorie (unique)
 * @param {string} slug - URL slug (unique)
 * @param {string} description - Description optionnelle
 */
function insererCategorie(nom, slug, description = '') {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO categories (nom, slug, description) VALUES (?, ?, ?)`,
      [nom, slug, description],
      function(err) {
        if (err) {
          console.error('Erreur insertion catégorie:', err);
          reject(err);
        } else {
          resolve(this.lastID);
        }
      }
    );
  });
}

/**
 * Récupère toutes les catégories triées par nom
 */
function obtenirCategories() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM categories ORDER BY nom`, (err, rows) => {
      if (err) {
        console.error('Erreur SELECT catégories:', err);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// ==================== POSTS ====================

/**
 * Récupère tous les posts avec auteur
 */
function obtenirPosts() {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT p.*, u.pseudo, u.email 
       FROM posts p 
       LEFT JOIN utilisateurs u ON p.utilisateur_id = u.id 
       ORDER BY p.date_creation DESC`,
      (err, rows) => {
        if (err) {
          console.error('Erreur SELECT posts:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      }
    );
  });
}

/**
 * Récupère un post par ID avec auteur
 * @param {number} post_id - ID du post
 */
function obtenirPostParId(post_id) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT p.*, u.pseudo 
       FROM posts p 
       LEFT JOIN utilisateurs u ON p.utilisateur_id = u.id 
       WHERE p.id = ?`,
      [post_id],
      (err, row) => {
        if (err) {
          console.error('Erreur SELECT post:', err);
          reject(err);
        } else {
          resolve(row);
        }
      }
    );
  });
}

// ==================== COMMENTAIRES ====================

/**
 * Récupère les commentaires d'un post avec likes
 * @param {number} post_id - ID du post
 */
function obtenirCommentairesParPost(post_id) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT c.*, u.pseudo,
              COUNT(DISTINCT lc.id) as nb_likes
       FROM commentaires c
       LEFT JOIN utilisateurs u ON c.utilisateur_id = u.id
       LEFT JOIN likes_commentaires lc ON c.id = lc.commentaire_id
       WHERE c.post_id = ?
       GROUP BY c.id
       ORDER BY c.date_creation ASC`,
      [post_id],
      (err, rows) => {
        if (err) {
          console.error('Erreur SELECT commentaires:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      }
    );
  });
}

/**
 * Récupère les commentaires aimés par un utilisateur
 * @param {number} user_id - ID de l'utilisateur
 */
function obtenirCommentairesAimesParUtilisateur(user_id) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT c.*, u.pseudo, p.titre as post_titre,
              COUNT(DISTINCT lc.id) as nb_likes
       FROM commentaires c
       LEFT JOIN utilisateurs u ON c.utilisateur_id = u.id
       LEFT JOIN posts p ON c.post_id = p.id
       LEFT JOIN likes_commentaires lc ON c.id = lc.commentaire_id
       WHERE EXISTS (
         SELECT 1 FROM likes_commentaires l
         WHERE l.commentaire_id = c.id AND l.utilisateur_id = ?
       )
       GROUP BY c.id
       ORDER BY c.date_creation DESC`,
      [user_id],
      (err, rows) => {
        if (err) {
          console.error('Erreur SELECT commentaires aimés:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      }
    );
  });
}

// ==================== FILTRAGE COMBINABLE ====================

/**
 * Récupère les posts avec filtrage combinable
 * @param {object} options - Options de filtrage
 * @param {number} options.user_id - ID utilisateur (pour filtre_mine et filtre_likes)
 * @param {boolean} options.filtre_mine - true = afficher seulement mes posts
 * @param {boolean} options.filtre_likes - true = afficher seulement les posts que j'ai aimés
 * @param {number} options.categorie_id - ID de la catégorie (optionnel)
 * @param {number} options.limit - Nombre de résultats (défaut: 10)
 * @param {number} options.offset - Décalage pour pagination (défaut: 0)
 * 
 * @example
 * // Tous les posts
 * obtenirPostsAvecFiltres({ limit: 10 })
 * 
 * // Mes posts
 * obtenirPostsAvecFiltres({ user_id: 1, filtre_mine: true })
 * 
 * // Posts que j'ai aimés
 * obtenirPostsAvecFiltres({ user_id: 1, filtre_likes: true })
 * 
 * // Posts d'une catégorie
 * obtenirPostsAvecFiltres({ categorie_id: 2 })
 * 
 * // Mes posts aimés dans une catégorie
 * obtenirPostsAvecFiltres({ user_id: 1, filtre_mine: true, filtre_likes: true, categorie_id: 2 })
 */
function obtenirPostsAvecFiltres(options = {}) {
  const {
    user_id = null,
    filtre_mine = false,
    filtre_likes = false,
    categorie_id = null,
    limit = 10,
    offset = 0
  } = options;

  return new Promise((resolve, reject) => {
    let query = `
      SELECT p.*,
             u.pseudo as auteur,
             c.nom as categorie_nom,
             COUNT(DISTINCT co.id) as nb_commentaires,
             COUNT(DISTINCT lp.id) as nb_likes
      FROM posts p
      LEFT JOIN utilisateurs u ON p.utilisateur_id = u.id
      LEFT JOIN categories c ON p.categorie_id = c.id
      LEFT JOIN commentaires co ON p.id = co.post_id
      LEFT JOIN likes_posts lp ON p.id = lp.post_id
      WHERE 1=1
    `;

    const params = [];

    // Filtre "Mes posts"
    if (filtre_mine && user_id) {
      query += ` AND p.utilisateur_id = ?`;
      params.push(user_id);
    }

    // Filtre "Posts aimés"
    if (filtre_likes && user_id) {
      query += ` AND EXISTS (
        SELECT 1 FROM likes_posts l 
        WHERE l.post_id = p.id AND l.utilisateur_id = ?
      )`;
      params.push(user_id);
    }

    // Filtre "Catégorie"
    if (categorie_id) {
      query += ` AND p.categorie_id = ?`;
      params.push(categorie_id);
    }

    // Grouper et trier
    query += ` GROUP BY p.id ORDER BY p.date_creation DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('Erreur filtrage posts:', err);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// ==================== EXEMPLES D'UTILISATION ====================

/*
// Catégories
await insererCategorie('JavaScript', 'javascript', 'Discussions sur JavaScript');
const categories = await obtenirCategories();

// Posts
const tousLesPosts = await obtenirPosts();
const unPost = await obtenirPostParId(1);

// Filtrage posts
const mesPosts = await obtenirPostsAvecFiltres({ 
  user_id: 1, 
  filtre_mine: true 
});

const postsAimes = await obtenirPostsAvecFiltres({ 
  user_id: 1, 
  filtre_likes: true 
});

const postsCategorie = await obtenirPostsAvecFiltres({ 
  categorie_id: 1 
});

// Commentaires
const commentaires = await obtenirCommentairesParPost(1);
const commentairesAimes = await obtenirCommentairesAimesParUtilisateur(1);
*/

module.exports = {
  creerTableCategories,
  insererCategorie,
  obtenirCategories,
  obtenirPosts,
  obtenirPostParId,
  obtenirCommentairesParPost,
  obtenirCommentairesAimesParUtilisateur,
  obtenirPostsAvecFiltres
};
