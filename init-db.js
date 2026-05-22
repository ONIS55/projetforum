// Script pour initialiser la nouvelle BDD et la vérifier

const sqlite3 = require('sqlite3').verbose();

// 1. Créer la nouvelle base de données
console.log('🔄 Création de la nouvelle Base.db...\n');

const db = new sqlite3.Database('./Base.db', (err) => {
  if (err) {
    console.error('❌ Erreur connexion:', err);
    process.exit(1);
  }
  
  console.log('✅ Base.db créée\n');
  initializeDB();
});

// Créer les tables
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
    if (err) console.error('❌ Erreur table utilisateurs:', err);
    else console.log('✅ Table utilisateurs créée');
  });

  // TABLE POSTS
  db.run(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      utilisateur_id INTEGER NOT NULL,
      titre TEXT NOT NULL,
      contenu TEXT NOT NULL,
      nb_vues INTEGER DEFAULT 0,
      date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
      date_modification DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) console.error('❌ Erreur table posts:', err);
    else console.log('✅ Table posts créée');
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
    if (err) console.error('❌ Erreur table commentaires:', err);
    else console.log('✅ Table commentaires créée');
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
    if (err) console.error('❌ Erreur table likes_posts:', err);
    else console.log('✅ Table likes_posts créée');
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
    if (err) console.error('❌ Erreur table likes_commentaires:', err);
    else console.log('✅ Table likes_commentaires créée');
  });

  // Attendre et afficher les tables
  setTimeout(() => {
    console.log('\n📋 === VÉRIFICATION DES TABLES ===\n');
    
    db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;", (err, tables) => {
      if (err) {
        console.error('❌ Erreur:', err);
      } else {
        console.log('📊 Tables créées:');
        tables.forEach((t, i) => {
          if (t.name !== 'sqlite_sequence') {
            console.log(`   ${i}. ✅ ${t.name}`);
          }
        });
      }
      
      // Afficher le schéma
      console.log('\n📐 === SCHÉMA DES TABLES ===\n');
      
      const tableNames = ['utilisateurs', 'posts', 'commentaires', 'likes_posts', 'likes_commentaires'];
      let count = 0;
      
      tableNames.forEach(table => {
        db.all(`PRAGMA table_info(${table});`, (err, cols) => {
          console.log(`🔹 ${table}:`);
          cols.forEach(col => {
            const notNull = col.notnull ? '(NOT NULL)' : '';
            const pk = col.pk ? '[PRIMARY KEY]' : '';
            console.log(`   • ${col.name} : ${col.type} ${notNull} ${pk}`.trim());
          });
          console.log('');
          
          count++;
          if (count === tableNames.length) {
            console.log('✅ Base de données inictialisée avec succès!\n');
            db.close();
          }
        });
      });
    });
  }, 1500);
}
