// Vérifier les index créés

const sqlite3 = require('sqlite3');

const db = new sqlite3.Database('../Base.db', (err) => {
  if (err) {
    console.error('❌ Erreur connexion:', err);
    process.exit(1);
  }
  
  console.log('✅ Connecté à Base.db\n');
});

// Afficher les index
db.all(`SELECT * FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'`, (err, indexes) => {
  if (err) {
    console.error('❌ Erreur:', err);
  } else {
    console.log('📊 === VÉRIFICATION DES INDEX ===\n');
    
    if (indexes.length === 0) {
      console.log('❌ Aucun index trouvé');
    } else {
      console.log(`✅ ${indexes.length} index créés:\n`);
      indexes.forEach((idx, i) => {
        console.log(`${i + 1}. 📇 ${idx.name}`);
        console.log(`   SQL: ${idx.sql}`);
        console.log('');
      });
    }
  }
  
  db.close();
});
