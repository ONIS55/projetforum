const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('../Base.db');

console.log('📊 CONTENU DE Base.db:\n');

// Tables
db.all(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`, (err, tables) => {
  if (err) {
    console.error('Erreur:', err);
    db.close();
    return;
  }

  console.log('📋 TABLES:');
  tables.forEach(t => {
    console.log(`  - ${t.name}`);
  });

  console.log('\n📊 DONNÉES PAR TABLE:\n');

  tables.forEach((table, index) => {
    db.all(`SELECT COUNT(*) as count FROM ${table.name}`, (err, result) => {
      if (!err) {
        console.log(`${table.name}: ${result[0].count} lignes`);
      }

      // Afficher les colonnes
      db.all(`PRAGMA table_info(${table.name})`, (err, columns) => {
        if (!err) {
          console.log(`  Colonnes: ${columns.map(c => c.name).join(', ')}`);
        }

        // Dernière table?
        if (index === tables.length - 1) {
          setTimeout(() => {
            console.log('\n✅ Inspection terminée');
            db.close();
          }, 500);
        }
      });
    });
  });
});
