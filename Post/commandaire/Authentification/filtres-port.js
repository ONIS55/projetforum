// Utilise global.db fourni par server.js
// Ne pas créer une nouvelle connexion ici

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
             u.pseudo,
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

    // Utilise global.db fourni par server.js
    if (!global.db) {
      return reject(new Error('Database not initialized'));
    }

    global.db.all(query, params, (err, rows) => {
      if (err) {
        console.error('Erreur filtrage posts:', err);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

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
