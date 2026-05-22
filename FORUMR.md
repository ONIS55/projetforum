# 📚 FORUMR - Guide pour construire votre Forum

Ce guide vous montre comment **construire vous-même** les fonctionnalités principales du forum.

---

## 📋 Étape 1 : Créer la Base de Données et les Tables

**Objectif** : Créer une base de données SQLite avec 2 tables : `posts` et `commentaires`

### À FAIRE :
1. Créez une fonction `initializeDB()` dans `server.js` qui crée les tables suivantes :

```sql
CREATE TABLE posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titre TEXT NOT NULL,
  contenu TEXT NOT NULL,
  auteur TEXT NOT NULL,
  date_creation DATETIME DEFAULT CURRENT_TIMESTAMP
)

CREATE TABLE commentaires (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  auteur TEXT NOT NULL,
  contenu TEXT NOT NULL,
  date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id)
)
```

**💡 Indice** : Utilisez `db.run()` pour exécuter les commandes SQL

---

## 🔧 Étape 2 : Créer les Routes API

**Objectif** : Créer des endpoints Express pour interagir avec la base de données

### À FAIRE :

#### A. Route GET `/api/posts` - Récupérer tous les posts
- Requête SQL : `SELECT * FROM posts ORDER BY date_creation DESC`
- Retourner un JSON avec tous les posts

#### B. Route GET `/api/posts/:id` - Récupérer un post avec ses commentaires
- Requête SQL 1 : `SELECT * FROM posts WHERE id = ?`
- Requête SQL 2 : `SELECT * FROM commentaires WHERE post_id = ?`
- Retourner le post + array de commentaires

#### C. Route POST `/api/posts` - Créer un nouveau post
- Récupérer : `titre`, `contenu`, `auteur` du body
- Insérer : `INSERT INTO posts (titre, contenu, auteur) VALUES (?, ?, ?)`
- Retourner le nouvel post avec son ID

#### D. Route POST `/api/posts/:id/commentaires` - Ajouter un commentaire
- Récupérer : `auteur`, `contenu` du body
- Insérer : `INSERT INTO commentaires (post_id, auteur, contenu) VALUES (?, ?, ?)`
- Retourner le nouveau commentaire

**💡 Indice** : 
- Utilisez `db.get()` pour UNE ligne
- Utilisez `db.all()` pour PLUSIEURS lignes
- Utilisez `db.run()` pour INSERT/UPDATE/DELETE

---

## 🎨 Étape 3 : Créer l'Interface Web (HTML/CSS/JavaScript)

**Objectif** : Créer une page pour afficher et créer des posts

### À FAIRE :

#### A. Créer le dossier `public/` et le fichier `public/index.html`

#### B. HTML Structure :
```html
<!DOCTYPE html>
<html>
<head>
  <title>Forum</title>
  <style>
    /* Vos styles CSS ici */
  </style>
</head>
<body>
  <h1>Mon Forum</h1>
  
  <!-- Formulaire pour créer un post -->
  <form id="postForm">
    <input type="text" placeholder="Votre nom" id="auteur" required>
    <input type="text" placeholder="Titre" id="titre" required>
    <textarea placeholder="Contenu" id="contenu" required></textarea>
    <button type="submit">Publier</button>
  </form>
  
  <!-- Liste des posts -->
  <div id="postsList"></div>
  
  <!-- Modal pour détails du post -->
  <div id="postModal" style="display:none;">
    <div id="postDetail"></div>
  </div>

  <script>
    // Vos scripts JavaScript ici
  </script>
</body>
</html>
```

#### C. JavaScript - Charger les posts :
```javascript
async function loadPosts() {
  const response = await fetch('/api/posts');
  const posts = await response.json();
  
  const postsList = document.getElementById('postsList');
  postsList.innerHTML = posts.map(post => `
    <div onclick="showPost(${post.id})">
      <h3>${post.titre}</h3>
      <p>Par ${post.auteur} - ${new Date(post.date_creation).toLocaleDateString()}</p>
      <p>${post.contenu.substring(0, 100)}...</p>
    </div>
  `).join('');
}

loadPosts();
```

#### D. JavaScript - Créer un post :
```javascript
document.getElementById('postForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const auteur = document.getElementById('auteur').value;
  const titre = document.getElementById('titre').value;
  const contenu = document.getElementById('contenu').value;
  
  const response = await fetch('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ titre, contenu, auteur })
  });
  
  if (response.ok) {
    loadPosts(); // Recharger la liste
    document.getElementById('postForm').reset();
  }
});
```

#### E. JavaScript - Afficher détails d'un post :
```javascript
async function showPost(postId) {
  const response = await fetch(`/api/posts/${postId}`);
  const post = await response.json();
  
  const modal = document.getElementById('postModal');
  const detail = document.getElementById('postDetail');
  
  detail.innerHTML = `
    <h2>${post.titre}</h2>
    <p>Par ${post.auteur}</p>
    <p>${post.contenu}</p>
    
    <h3>Commentaires (${post.commentaires.length})</h3>
    ${post.commentaires.map(c => `
      <div>
        <strong>${c.auteur}</strong>: ${c.contenu}
      </div>
    `).join('')}
  `;
  
  modal.style.display = 'block';
}
```

#### F. JavaScript - Ajouter un commentaire :
```javascript
async function addComment(postId, auteur, contenu) {
  const response = await fetch(`/api/posts/${postId}/commentaires`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ auteur, contenu })
  });
  
  if (response.ok) {
    showPost(postId); // Recharger les détails
  }
}
```

---

## 📚 Ressources Utiles

**Express** : https://expressjs.com/
**SQLite3 npm** : https://www.npmjs.com/package/sqlite3
**JavaScript Fetch** : https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
**SQL Basics** : https://www.w3schools.com/sql/

---

## ✅ Checklist de Complétude

- [ ] Base de données créée avec 2 tables
- [ ] Route GET `/api/posts` fonctionnelle
- [ ] Route GET `/api/posts/:id` fonctionnelle
- [ ] Route POST `/api/posts` fonctionnelle
- [ ] Route POST `/api/posts/:id/commentaires` fonctionnelle
- [ ] Page HTML créée dans `public/index.html`
- [ ] Fonction `loadPosts()` affiche la liste
- [ ] Formulaire crée un post avec fetch POST
- [ ] Click sur post affiche les détails
- [ ] Commentaires s'affichent dans le modal

---

**Bonne chance! 🚀 Demandez-moi de l'aide si vous êtes bloqué sur une étape.**
