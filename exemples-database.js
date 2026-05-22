// =====================================
// EXEMPLES D'UTILISATION DE LA BASE DE DONNÉES
// =====================================

const {
  insererUtilisateur,
  insererPost,
  insererCommentaire,
  obtenirUtilisateurs,
  obtenirPosts,
  obtenirCommentairesParPost,
  obtenirUtilisateurParPseudo,
  obtenirPostParId,
  obtenirPostsAvecFiltres,
  mettreAJourPost,
  supprimerPost,
  supprimerCommentaire
} = require('./database');

// ==================== EXEMPLES INSERT ====================

async function exemplesInsert() {
  console.log('\n📝 === EXEMPLES INSERT ===\n');
  
  try {
    // Insérer des utilisateurs
    const user1 = await insererUtilisateur('alice', 'alice@example.com', 'password123', 'Alice', 'Dupont', 'Bienvenue sur mon profil');
    const user2 = await insererUtilisateur('bob', 'bob@example.com', 'password456', 'Bob', 'Martin', 'J\'aime coder');
    
    // Insérer des posts
    const post1 = await insererPost(user1, 'Mon premier post', 'Ceci est le contenu de mon premier post');
    const post2 = await insererPost(user2, 'Conseils JavaScript', 'Voici mes conseils pour apprendre JavaScript');
    
    // Insérer des commentaires
    const comment1 = await insererCommentaire(post1, user2, 'Super post Alice ! 😊');
    const comment2 = await insererCommentaire(post1, user2, 'Tu as d\'autres conseils ?');
    
    console.log('✅ Données d\'exemple insérées avec succès !');
    
  } catch (err) {
    console.error('❌ Erreur lors de l\'insertion:', err);
  }
}

// ==================== EXEMPLES SELECT ====================

async function exemplesSelect() {
  console.log('\n🔍 === EXEMPLES SELECT ===\n');
  
  try {
    // Récupérer tous les utilisateurs
    console.log('📋 Tous les utilisateurs:');
    const utilisateurs = await obtenirUtilisateurs();
    console.table(utilisateurs);
    
    // Récupérer tous les posts
    console.log('\n📋 Tous les posts:');
    const posts = await obtenirPosts();
    console.table(posts);
    
    // Récupérer les commentaires d'un post
    if (posts.length > 0) {
      console.log(`\n📋 Commentaires du post ${posts[0].id}:`);
      const commentaires = await obtenirCommentairesParPost(posts[0].id);
      console.table(commentaires);
    }
    
    // Récupérer un utilisateur par pseudo
    console.log('\n📋 Utilisateur "alice":');
    const alice = await obtenirUtilisateurParPseudo('alice');
    console.log(alice);
    
    // Récupérer un post par ID
    if (posts.length > 0) {
      console.log(`\n📋 Détails du post ${posts[0].id}:`);
      const post = await obtenirPostParId(posts[0].id);
      console.log(post);
    }
    
  } catch (err) {
    console.error('❌ Erreur lors de la lecture:', err);
  }
}

// ==================== EXEMPLES UPDATE ====================

async function exemplesUpdate() {
  console.log('\n✏️ === EXEMPLES UPDATE ===\n');
  
  try {
    const posts = await obtenirPosts();
    if (posts.length > 0) {
      const postId = posts[0].id;
      console.log(`Mise à jour du post ${postId}:`);
      await mettreAJourPost(postId, 'Post modifié', 'Voici le contenu modifié du post');
      
      const postModifie = await obtenirPostParId(postId);
      console.log(postModifie);
    }
  } catch (err) {
    console.error('❌ Erreur lors de la modification:', err);
  }
}

// ==================== EXEMPLES DELETE ====================

async function exemplesDelete() {
  console.log('\n🗑️ === EXEMPLES DELETE ===\n');
  
  try {
    const posts = await obtenirPosts();
    if (posts.length > 0) {
      const postId = posts[posts.length - 1].id;
      console.log(`Suppression du post ${postId}...`);
      await supprimerPost(postId);
      console.log('✅ Post supprimé (les commentaires associés aussi via CASCADE)');
    }
  } catch (err) {
    console.error('❌ Erreur lors de la suppression:', err);
  }
}

// ==================== FILTRAGE COMBINABLE ====================

async function exempleFiltrageCombinables() {
  console.log('\n🔎 === FILTRAGE COMBINABLE ===\n');
  
  try {
    const user_id = 1; // ID de l'utilisateur connecté
    
    // 1. Tous les posts (pagination)
    console.log('📋 Tous les posts (page 1, 10 par page):');
    const tousLesPosts = await obtenirPostsAvecFiltres({
      limit: 10,
      offset: 0
    });
    console.table(tousLesPosts);
    
    // 2. Seulement mes posts
    console.log('\n📋 Mes posts:');
    const mesPosts = await obtenirPostsAvecFiltres({
      user_id: user_id,
      filtre_mine: true,
      limit: 10,
      offset: 0
    });
    console.table(mesPosts);
    
    // 3. Seulement les posts que j'ai aimés
    console.log('\n📋 Posts que j\'ai aimés:');
    const postsAimes = await obtenirPostsAvecFiltres({
      user_id: user_id,
      filtre_likes: true,
      limit: 10,
      offset: 0
    });
    console.table(postsAimes);
    
    // 4. Combinaison : Mes posts que j'ai aimés
    console.log('\n📋 Mes posts que j\'ai aussi aimés:');
    const mesPostsAimes = await obtenirPostsAvecFiltres({
      user_id: user_id,
      filtre_mine: true,
      filtre_likes: true,
      limit: 10,
      offset: 0
    });
    console.table(mesPostsAimes);
    
  } catch (err) {
    console.error('❌ Erreur lors du filtrage:', err);
  }
}

// ==================== REQUÊTES SQL AVANCÉES ====================

async function requetesSQLAvancees() {
  console.log('\n🚀 === REQUÊTES SQL AVANCÉES ===\n');
  
  const { db } = require('./database');
  
  // 1. Récupérer les posts avec le nombre de commentaires
  db.all(
    `SELECT p.id, p.titre, u.pseudo, COUNT(c.id) as nb_commentaires
     FROM posts p
     LEFT JOIN utilisateurs u ON p.utilisateur_id = u.id
     LEFT JOIN commentaires c ON p.id = c.post_id
     GROUP BY p.id
     ORDER BY nb_commentaires DESC`,
    (err, rows) => {
      if (!err) {
        console.log('📊 Posts avec nombre de commentaires:');
        console.table(rows);
      }
    }
  );
  
  // 2. Récupérer les utilisateurs les plus actifs
  db.all(
    `SELECT u.pseudo, COUNT(p.id) as nb_posts
     FROM utilisateurs u
     LEFT JOIN posts p ON u.id = p.utilisateur_id
     GROUP BY u.id
     ORDER BY nb_posts DESC`,
    (err, rows) => {
      if (!err) {
        console.log('\n👥 Utilisateurs les plus actifs:');
        console.table(rows);
      }
    }
  );
  
  // 3. Récupérer les posts récents (dernière semaine)
  db.all(
    `SELECT p.id, p.titre, u.pseudo, p.date_creation
     FROM posts p
     LEFT JOIN utilisateurs u ON p.utilisateur_id = u.id
     WHERE p.date_creation >= datetime('now', '-7 days')
     ORDER BY p.date_creation DESC`,
    (err, rows) => {
      if (!err) {
        console.log('\n⏰ Posts récents (dernière semaine):');
        console.table(rows);
      }
    }
  );
}

// ==================== LANCER LES EXEMPLES ====================

// Décommenter pour tester :
// exemplesInsert().then(() => exemplesSelect());
// exemplesUpdate();
// exemplesDelete();
// exempleFiltrageCombinables();
// requetesSQLAvancees();

module.exports = {
  exemplesInsert,
  exemplesSelect,
  exemplesUpdate,
  exemplesDelete,
  exempleFiltrageCombinables,
  requetesSQLAvancees
};
