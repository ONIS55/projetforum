/**
 * ========================================
 * FILTRAGE COMBINABLE DES POSTS
 * ========================================
 * 
 * Cette fonction permet de filtrer les posts avec des options combinables :
 * - Filtrer par utilisateur (mes posts)
 * - Filtrer par likes (posts que j'ai aimés)
 * - Pagination (limit + offset)
 * - Combinaison de tous les filtres
 */

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./Base.db');

// Fonction de filtrage combinable (EXTRAITE DE database.js)
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
        console.error('❌ Erreur filtrage posts:', err);
        reject(err);
      } else {
        console.log(' Posts filtrés récupérés:', rows.length);
        resolve(rows);
      }
    });
  });
}

// ========================================
// EXEMPLES D'UTILISATION
// ========================================

// Exemple 1 : Tous les posts (pagination simple)
// const tousLesPosts = await obtenirPostsAvecFiltres({
//   limit: 10,
//   offset: 0
// });
// console.log('Tous les posts:', tousLesPosts);

// Exemple 2 : Mes posts
// const mesPosts = await obtenirPostsAvecFiltres({
//   user_id: 1,
//   filtre_mine: true,
//   limit: 10
// });
// console.log('Mes posts:', mesPosts);

// Exemple 3 : Posts que j'ai aimés
// const postsAimes = await obtenirPostsAvecFiltres({
//   user_id: 1,
//   filtre_likes: true,
//   limit: 10
// });
// console.log('Posts que j\'ai aimés:', postsAimes);

// Exemple 4 : Combinaison (mes posts favoris)
// const mesPostsAimes = await obtenirPostsAvecFiltres({
//   user_id: 1,
//   filtre_mine: true,
//   filtre_likes: true,
//   limit: 10,
//   offset: 0
// });
// console.log('Mes posts favoris:', mesPostsAimes);

// Exemple 5 : Filtrer par catégorie
// const postsJavaScript = await obtenirPostsAvecFiltres({
//   categorie_id: 1,  // ex: catégorie JavaScript
//   limit: 10
// });
// console.log('Posts JavaScript:', postsJavaScript);

// Exemple 6 : Mes posts dans une catégorie
// const mesPostsJS = await obtenirPostsAvecFiltres({
//   user_id: 1,
//   filtre_mine: true,
//   categorie_id: 1,
//   limit: 10
// });
// console.log('Mes posts JavaScript:', mesPostsJS);

// Résultat attendu :
// [
//   {
//     id: 1,
//     utilisateur_id: 1,
//     titre: "Mon premier post",
//     contenu: "Voici le contenu...",
//     nb_vues: 42,
//     date_creation: "2026-05-22T10:30:00",
//     date_modification: "2026-05-22T10:30:00",
//     auteur: "alice",
//     nb_commentaires: 3,
//     nb_likes: 5
//   },
//   // ... autres posts
// ]

module.exports = {
  obtenirPostsAvecFiltres
};
