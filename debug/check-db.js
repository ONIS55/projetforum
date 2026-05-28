const sqlite3 = require('sqlite3');

const db = new sqlite3.Database('../Base.db', (err) => {
  if (err) {
    console.error('❌ Erreur connexion:', err);
    process.exit(1);
  }
  console.log('✅ Connecté à Base.db\n');
});

// Afficher les tables
db.all("SELECT name FROM sqlite_master WHERE type='table';", (err, tables) => {
  if (err) {
    console.error('❌ Erreur:', err);
  } else {
    console.log('📋 Tables dans la base de données:');
    if (tables.length === 0) {
      console.log('   ❌ Aucune table trouvée');
    } else {
      tables.forEach(t => console.log(`   ✅ ${t.name}`));
    }
  }
  
  // Afficher aussi le schéma de chaque table
  if (tables && tables.length > 0) {
    console.log('\n📐 Schéma des tables:');
    tables.forEach(table => {
      db.all(`PRAGMA table_info(${table.name});`, (err, cols) => {
        console.log(`\n🔹 ${table.name}:`);
        cols.forEach(col => {
          console.log(`   - ${col.name} (${col.type})`);
        });
      });
    });
  }
  
  setTimeout(() => db.close(), 1000);
});
