const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connexion à la base de données
const db = new sqlite3.Database('./Base.db', (err) => {
  if (err) {
    console.error(' Erreur de connexion:', err);
  } else {
    console.log(' Connecté à SQLite');
    initializeDB();
  }
});

// ==================== CRÉER LES TABLES ====================
function initializeDB() {
  // TABLE UTILISATEURS
  db.run(`
    CREATE TABLE IF NOT EXISTS utilisateurs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pseudo TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      mot_de_passe TEXT NOT NULL,
      prenom TEXT NOT NULL,
      nom TEXT NOT NULL,
      bio TEXT,
      date_inscription DATETIME DEFAULT CURRENT_TIMESTAMP,
      date_modification DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error(' Erreur table utilisateurs:', err);
    else console.log(' Table utilisateurs créée/vérifiée');
  });

  // TABLE CATÉGORIES
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      date_creation DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('❌ Erreur table categories:', err);
    else console.log('✅ Table categories créée/vérifiée');
  });

  // TABLE POSTS
  db.run(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      utilisateur_id INTEGER NOT NULL,
      categorie_id INTEGER,
      titre TEXT NOT NULL,
      contenu TEXT NOT NULL,
      nb_vues INTEGER DEFAULT 0,
      date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
      date_modification DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
      FOREIGN KEY (categorie_id) REFERENCES categories(id) ON DELETE SET NULL
    )
  `, (err) => {
    if (err) console.error(' Erreur table posts:', err);
    else console.log(' Table posts créée/vérifiée');
  });

  // TABLE COMMENTAIRES
  db.run(`
    CREATE TABLE IF NOT EXISTS commentaires (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      utilisateur_id INTEGER NOT NULL,
      contenu TEXT NOT NULL,
      date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
      date_modification DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) console.error(' Erreur table commentaires:', err);
    else console.log(' Table commentaires créée/vérifiée');
  });

  // TABLE LIKES_POSTS
  db.run(`
    CREATE TABLE IF NOT EXISTS likes_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      utilisateur_id INTEGER NOT NULL,
      post_id INTEGER NOT NULL,
      date_like DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(utilisateur_id, post_id),
      FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) console.error(' Erreur table likes_posts:', err);
    else console.log(' Table likes_posts créée/vérifiée');
  });

  // TABLE LIKES_COMMENTAIRES
  db.run(`
    CREATE TABLE IF NOT EXISTS likes_commentaires (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      utilisateur_id INTEGER NOT NULL,
      commentaire_id INTEGER NOT NULL,
      date_like DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(utilisateur_id, commentaire_id),
      FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
      FOREIGN KEY (commentaire_id) REFERENCES commentaires(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) console.error(' Erreur table likes_commentaires:', err);
    else console.log(' Table likes_commentaires créée/vérifiée');
  });

  // ==================== CRÉER LES INDEX (Performance) ====================
  
  // Index sur les colonnes les plus interrogées
  db.run(`CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(utilisateur_id)`, (err) => {
    if (err) console.error(' Erreur index posts_user_id:', err);
    else console.log(' Index idx_posts_user_id créé');
  });

  db.run(`CREATE INDEX IF NOT EXISTS idx_posts_categorie_id ON posts(categorie_id)`, (err) => {
    if (err) console.error(' Erreur index posts_categorie_id:', err);
    else console.log(' Index idx_posts_categorie_id créé');
  });

  db.run(`CREATE INDEX IF NOT EXISTS idx_commentaires_post_id ON commentaires(post_id)`, (err) => {
    if (err) console.error(' Erreur index commentaires_post_id:', err);
    else console.log(' Index idx_commentaires_post_id créé');
  });

  db.run(`CREATE INDEX IF NOT EXISTS idx_commentaires_user_id ON commentaires(utilisateur_id)`, (err) => {
    if (err) console.error(' Erreur index commentaires_user_id:', err);
    else console.log(' Index idx_commentaires_user_id créé');
  });

  db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_likes_posts_unique ON likes_posts(utilisateur_id, post_id)`, (err) => {
    if (err) console.error(' Erreur index likes_posts_unique:', err);
    else console.log(' Index idx_likes_posts_unique créé');
  });

  db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_likes_commentaires_unique ON likes_commentaires(utilisateur_id, commentaire_id)`, (err) => {
    if (err) console.error(' Erreur index likes_commentaires_unique:', err);
    else console.log(' Index idx_likes_commentaires_unique créé');
  });
}

// ==================== FONCTIONS INSERT ====================

// Insérer un nouvel utilisateur
function insererUtilisateur(pseudo, email, mot_de_passe, prenom, nom, bio = '') {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO utilisateurs (pseudo, email, mot_de_passe, prenom, nom, bio) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [pseudo, email, mot_de_passe, prenom, nom, bio],
      function(err) {
        if (err) {
          console.error(' Erreur insertion utilisateur:', err);
          reject(err);
        } else {
          console.log(' Utilisateur inséré avec l\'ID:', this.lastID);
          resolve(this.lastID);
        }
      }
    );
  });
}

// Insérer un nouveau post
function insererPost(utilisateur_id, titre, contenu) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO posts (utilisateur_id, titre, contenu) VALUES (?, ?, ?)`,
      [utilisateur_id, titre, contenu],
      function(err) {
        if (err) {
          console.error(' Erreur insertion post:', err);
          reject(err);
        } else {
          console.log(' Post inséré avec l\'ID:', this.lastID);
          resolve(this.lastID);
        }
      }
    );
  });
}

// Insérer un commentaire
function insererCommentaire(post_id, utilisateur_id, contenu) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO commentaires (post_id, utilisateur_id, contenu) VALUES (?, ?, ?)`,
      [post_id, utilisateur_id, contenu],
      function(err) {
        if (err) {
          console.error(' Erreur insertion commentaire:', err);
          reject(err);
        } else {
          console.log(' Commentaire inséré avec l\'ID:', this.lastID);
          resolve(this.lastID);
        }
      }
    );
  });
}

// Insérer une catégorie
function insererCategorie(nom, slug, description = '') {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO categories (nom, slug, description) VALUES (?, ?, ?)`,
      [nom, slug, description],
      function(err) {
        if (err) {
          console.error('❌ Erreur insertion catégorie:', err);
          reject(err);
        } else {
          console.log('✅ Catégorie insérée avec l\'ID:', this.lastID);
          resolve(this.lastID);
        }
      }
    );
  });
}

// ==================== FONCTIONS SELECT ====================

// Récupérer tous les utilisateurs
function obtenirUtilisateurs() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM utilisateurs`, (err, rows) => {
      if (err) {
        console.error(' Erreur SELECT utilisateurs:', err);
        reject(err);
      } else {
        console.log(' Utilisateurs récupérés:', rows.length);
        resolve(rows);
      }
    });
  });
}

// Récupérer toutes les catégories
function obtenirCategories() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM categories ORDER BY nom`, (err, rows) => {
      if (err) {
        console.error('❌ Erreur SELECT catégories:', err);
        reject(err);
      } else {
        console.log('✅ Catégories récupérées:', rows.length);
        resolve(rows);
      }
    });
  });
}

// Récupérer tous les posts avec l'auteur
function obtenirPosts() {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT p.*, u.pseudo, u.email 
       FROM posts p 
       LEFT JOIN utilisateurs u ON p.utilisateur_id = u.id 
       ORDER BY p.date_creation DESC`,
      (err, rows) => {
        if (err) {
          console.error(' Erreur SELECT posts:', err);
          reject(err);
        } else {
          console.log(' Posts récupérés:', rows.length);
          resolve(rows);
        }
      }
    );
  });
}

// Récupérer les commentaires d'un post
function obtenirCommentairesParPost(post_id) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT c.*, u.pseudo 
       FROM commentaires c 
       LEFT JOIN utilisateurs u ON c.utilisateur_id = u.id 
       WHERE c.post_id = ? 
       ORDER BY c.date_creation ASC`,
      [post_id],
      (err, rows) => {
        if (err) {
          console.error(' Erreur SELECT commentaires:', err);
          reject(err);
        } else {
          console.log(' Commentaires récupérés:', rows.length);
          resolve(rows);
        }
      }
    );
  });
}

// Récupérer un utilisateur par pseudo
function obtenirUtilisateurParPseudo(pseudo) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM utilisateurs WHERE pseudo = ?`,
      [pseudo],
      (err, row) => {
        if (err) {
          console.error(' Erreur SELECT utilisateur:', err);
          reject(err);
        } else {
          resolve(row);
        }
      }
    );
  });
}

// Récupérer un post par ID
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
          console.error(' Erreur SELECT post:', err);
          reject(err);
        } else {
          resolve(row);
        }
      }
    );
  });
}

// Filtrage combinable (mes posts, posts aimés, pagination)
function obtenirPostsAvecFiltres(options = {}) {
  const {
    user_id = null,
    filtre_mine = false,        // true = afficher seulement mes posts
    filtre_likes = false,       // true = afficher seulement les posts que j'ai aimés
    categorie_id = null,        // ID de la catégorie
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
        console.error(' Erreur filtrage posts:', err);
        reject(err);
      } else {
        console.log(' Posts filtrés récupérés:', rows.length);
        resolve(rows);
      }
    });
  });
}

// ==================== FONCTIONS UPDATE ====================

// Mettre à jour un post
function mettreAJourPost(post_id, titre, contenu) {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE posts SET titre = ?, contenu = ?, date_modification = CURRENT_TIMESTAMP WHERE id = ?`,
      [titre, contenu, post_id],
      function(err) {
        if (err) {
          console.error('❌ Erreur UPDATE post:', err);
          reject(err);
        } else {
          console.log('✅ Post modifié');
          resolve();
        }
      }
    );
  });
}

// ==================== FONCTIONS DELETE ====================

// Supprimer un post (et ses commentaires via CASCADE)
function supprimerPost(post_id) {
  return new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM posts WHERE id = ?`,
      [post_id],
      function(err) {
        if (err) {
          console.error(' Erreur DELETE post:', err);
          reject(err);
        } else {
          console.log(' Post supprimé');
          resolve();
        }
      }
    );
  });
}

// Supprimer un commentaire
function supprimerCommentaire(commentaire_id) {
  return new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM commentaires WHERE id = ?`,
      [commentaire_id],
      function(err) {
        if (err) {
          console.error(' Erreur DELETE commentaire:', err);
          reject(err);
        } else {
          console.log(' Commentaire supprimé');
          resolve();
        }
      }
    );
  });
}

// ==================== EXPORTER LES FONCTIONS ====================
module.exports = {
  db,
  
  // INSERT
  insererUtilisateur,
  insererPost,
  insererCommentaire,
  insererCategorie,
  
  // SELECT
  obtenirUtilisateurs,
  obtenirCategories,
  obtenirPosts,
  obtenirCommentairesParPost,
  obtenirUtilisateurParPseudo,
  obtenirPostParId,
  obtenirPostsAvecFiltres,
  
  // UPDATE
  mettreAJourPost,
  
  // DELETE
  supprimerPost,
  supprimerCommentaire
};
