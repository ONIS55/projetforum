<<<<<<< HEAD
# 📚 FORUMR - Guide d'utilisation de la Base de Données

Ce guide explique comment **utiliser** la structure de base de données complète qui a été créée.

---

## ✅ État du Projet

✅ **Base de données SQLite créée** (`Base.db`)  
✅ **5 tables créées** (utilisateurs, posts, commentaires, likes_posts, likes_commentaires)  
✅ **5 index créés** pour optimiser les performances  
✅ **Fonctions complètes** (INSERT, SELECT, UPDATE, DELETE)  
✅ **Filtrage combinable** pour les requêtes avancées  
✅ **Pas de framework** - Utilisation avec Node.js http module seulement  

---

## 📂 Fichiers Principaux

| Fichier | Rôle |
|---------|------|
| **database.js** | Gère toutes les opérations de la BDD |
| **init-db.js** | Initialise la BDD avec les tables et index |
| **check-db.js** | Vérifie la structure de la BDD |
| **check-indexes.js** | Vérifie les index créés |
| **exemples-database.js** | Exemples d'utilisation |
| **schema.md** | Documentation complète du schéma |
| **Base.db** | Fichier SQLite (la vraie BDD) |

---

## 🎯 Étape 1 : Les 5 Tables Créées

### 1️⃣ **utilisateurs**
```sql
utilisateurs(id, pseudo, email, mot_de_passe, prenom, nom, bio, date_inscription, date_modification)
```

### 2️⃣ **posts**
```sql
posts(id, utilisateur_id, titre, contenu, nb_vues, date_creation, date_modification)
```

### 3️⃣ **commentaires**
```sql
commentaires(id, post_id, utilisateur_id, contenu, date_creation, date_modification)
```

### 4️⃣ **likes_posts**
```sql
likes_posts(id, utilisateur_id, post_id, date_like)
```

### 5️⃣ **likes_commentaires**
```sql
likes_commentaires(id, utilisateur_id, commentaire_id, date_like)
```

---

## 🚀 Étape 2 : Utiliser les Fonctions Database

### Importer les fonctions :
```javascript
const {
  insererUtilisateur,
  insererPost,
  insererCommentaire,
  obtenirUtilisateurs,
  obtenirPosts,
  obtenirCommentairesParPost,
  obtenirPostsAvecFiltres,
  mettreAJourPost,
  supprimerPost,
  supprimerCommentaire
} = require('./database');
```

### A. Ajouter un utilisateur :
```javascript
const userId = await insererUtilisateur(
  'alice',                    // pseudo
  'alice@example.com',        // email
  'password123',              // mot_de_passe
  'Alice',                    // prenom
  'Dupont',                   // nom
  'Ma biographie'             // bio
);
console.log('Utilisateur créé avec ID:', userId);
```

### B. Ajouter un post :
```javascript
const postId = await insererPost(
  userId,                     // utilisateur_id
  'Mon titre',                // titre
  'Contenu du post'           // contenu
);
console.log('Post créé avec ID:', postId);
```

### C. Ajouter un commentaire :
```javascript
const commentId = await insererCommentaire(
  postId,                     // post_id
  userId,                     // utilisateur_id
  'Super post!'               // contenu
);
console.log('Commentaire créé avec ID:', commentId);
```

### D. Récupérer tous les posts :
```javascript
const posts = await obtenirPosts();
console.log(posts);
// Résultat: [{id, titre, contenu, pseudo, nb_commentaires, nb_likes, ...}, ...]
```

### E. Récupérer les commentaires d'un post :
```javascript
const commentaires = await obtenirCommentairesParPost(postId);
console.log(commentaires);
// Résultat: [{id, contenu, pseudo, date_creation, ...}, ...]
```

### F. Mettre à jour un post :
```javascript
await mettreAJourPost(
  postId,                     // post_id
  'Nouveau titre',            // titre
  'Nouveau contenu'           // contenu
);
console.log('Post mis à jour');
```

### G. Supprimer un post :
```javascript
await supprimerPost(postId);
console.log('Post supprimé (commentaires aussi supprimés en cascade)');
```

### H. Supprimer un commentaire :
```javascript
await supprimerCommentaire(commentId);
console.log('Commentaire supprimé');
```

---

## 🔎 Étape 3 : Filtrage Combinable

La fonction `obtenirPostsAvecFiltres()` permet de filtrer les posts avec des options combinables :

### Tous les posts (pagination) :
```javascript
const posts = await obtenirPostsAvecFiltres({
  limit: 10,
  offset: 0
});
```

### Seulement mes posts :
```javascript
const mesPosts = await obtenirPostsAvecFiltres({
  user_id: 1,
  filtre_mine: true,
  limit: 10
});
```

### Posts que j'ai aimés :
```javascript
const postsAimes = await obtenirPostsAvecFiltres({
  user_id: 1,
  filtre_likes: true,
  limit: 10
});
```

### Combinaison (mes posts favoris) :
```javascript
const mesPostsAimes = await obtenirPostsAvecFiltres({
  user_id: 1,
  filtre_mine: true,
  filtre_likes: true,
  limit: 10,
  offset: 0
});
```

**Structure du résultat** :
```javascript
[
  {
    id: 1,
    titre: "Mon post",
    contenu: "...",
    pseudo: "alice",
    utilisateur_id: 1,
    nb_commentaires: 3,
    nb_likes: 5,
    date_creation: "2026-05-22T10:30:00"
  },
  // ... autres posts
]
```

---

## ⚡ Étape 4 : Index (Performance)

5 index ont été créés pour optimiser les requêtes :

| Index | Table | Colonnes | Rôle | Impact |
|-------|-------|----------|------|--------|
| `idx_posts_user_id` | posts | utilisateur_id | Trouver posts d'un user | ⚡ 10-100x |
| `idx_commentaires_post_id` | commentaires | post_id | Trouver commentaires d'un post | ⚡ 10-100x |
| `idx_commentaires_user_id` | commentaires | utilisateur_id | Trouver commentaires d'un user | ⚡ 10-100x |
| `idx_likes_posts_unique` | likes_posts | utilisateur_id, post_id | UNIQUE - empêche doublons | ⚡ Pas de duplicate |
| `idx_likes_commentaires_unique` | likes_commentaires | utilisateur_id, commentaire_id | UNIQUE - empêche doublons | ⚡ Pas de duplicate |

**Vérifier les index :**
```bash
node check-indexes.js
```

**Résultat attendu :**
```
✅ 5 index créés:
1. idx_posts_user_id
2. idx_commentaires_post_id
3. idx_commentaires_user_id
4. idx_likes_posts_unique
5. idx_likes_commentaires_unique
```

---

## � Étape 5 : Utiliser avec Node.js (http module)

Exemple simple pour utiliser la base de données dans votre serveur Node.js :

```javascript
const http = require('http');
const { obtenirPosts, insererPost } = require('./database');

const server = http.createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  
  // GET /api/posts
  if (req.url === '/api/posts' && req.method === 'GET') {
    try {
      const posts = await obtenirPosts();
      res.end(JSON.stringify(posts));
    } catch (err) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: err.message }));
    }
  }
  // POST /api/posts
  else if (req.url === '/api/posts' && req.method === 'POST') {
    let data = '';
    req.on('data', chunk => data += chunk);
    req.on('end', async () => {
      try {
        const { utilisateur_id, titre, contenu } = JSON.parse(data);
        const postId = await insererPost(utilisateur_id, titre, contenu);
        res.end(JSON.stringify({ id: postId, message: 'Post créé' }));
      } catch (err) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: err.message }));
      }
    });
  }
  else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Route non trouvée' }));
  }
});

server.listen(3000, () => console.log('🚀 Serveur sur port 3000'));
```

---

## 📚 Ressources

| Ressource | Lien |
|-----------|------|
| **Node.js http** | https://nodejs.org/api/http.html |
| **SQLite3 npm** | https://www.npmjs.com/package/sqlite3 |
| **SQL Basics** | https://www.w3schools.com/sql/ |
| **Schema Documentation** | Voir `schema.md` |

---

## ✅ Checklist - Ce qui a été créé

### Base de Données
- ✅ 5 tables créées (utilisateurs, posts, commentaires, likes_posts, likes_commentaires)
- ✅ 5 index créés pour optimiser les performances
- ✅ Relations et intégrité référentielle en place
- ✅ CASCADE DELETE configuré

### Fonctions Database
- ✅ INSERT (utilisateurs, posts, commentaires)
- ✅ SELECT (simple et avancé)
- ✅ UPDATE (posts)
- ✅ DELETE (posts, commentaires)
- ✅ Filtrage combinable (mes posts, posts aimés, pagination)

### Scripts Utilitaires
- ✅ `init-db.js` - Initialise la BDD
- ✅ `check-db.js` - Vérifie les tables
- ✅ `check-indexes.js` - Vérifie les index
- ✅ `exemples-database.js` - Exemples d'utilisation

### Documentation
- ✅ `schema.md` - Schéma complet (ER diagram)
- ✅ `FORUMR.md` - Ce guide

---

**Bon développement! 🚀 Bonne chance avec votre projet forum!**
  // Afficher les posts dans le DOM
}

// Créer un post
async function creerPost(titre, contenu, userId) {
  const response = await fetch('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ utilisateur_id: userId, titre, contenu })
  });
  
  const data = await response.json();
  console.log('Post créé :', data);
}

chargerPosts();
```

---

## � Étape 5bis : Créer les Routes Express (Quand vous êtes prêt)

Vous pourrez créer ces routes dans `server.js` plus tard :

```javascript
const express = require('express');
const { obtenirPosts, insererPost, obtenirCommentairesParPost, insererCommentaire } = require('./database');

const app = express();
app.use(express.json());

// GET tous les posts
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await obtenirPosts();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET post avec ses commentaires
app.get('/api/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const post = await obtenirPostParId(id);
    const commentaires = await obtenirCommentairesParPost(id);
    res.json({ ...post, commentaires });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST créer un post
app.post('/api/posts', async (req, res) => {
  try {
    const { utilisateur_id, titre, contenu } = req.body;
    const postId = await insererPost(utilisateur_id, titre, contenu);
    res.json({ id: postId, message: 'Post créé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST ajouter commentaire
app.post('/api/posts/:id/commentaires', async (req, res) => {
  try {
    const { id } = req.params;
    const { utilisateur_id, contenu } = req.body;
    const commentId = await insererCommentaire(id, utilisateur_id, contenu);
    res.json({ id: commentId, message: 'Commentaire créé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log('🚀 Server sur port 3000'));
```

---

## 🎨 Étape 6bis : Créer l'Interface Web (Quand vous êtes prêt)

Créer un fichier `public/index.html` :

=======
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
>>>>>>> 24e5554 (Forum)
```html
<!DOCTYPE html>
<html>
<head>
  <title>Forum</title>
  <style>
<<<<<<< HEAD
    body { font-family: Arial; margin: 20px; }
    .post { border: 1px solid #ddd; padding: 10px; margin: 10px 0; cursor: pointer; }
    .post:hover { background: #f5f5f5; }
    form { background: #f9f9f9; padding: 15px; margin: 20px 0; }
    input, textarea { width: 100%; padding: 8px; margin: 5px 0; }
    button { background: #007bff; color: white; padding: 10px; cursor: pointer; }
  </style>
</head>
<body>
  <h1>📚 Mon Forum</h1>
  
  <!-- Formulaire pour créer un post -->
  <form id="postForm">
    <input type="number" placeholder="Votre ID utilisateur" id="userId" required>
    <input type="text" placeholder="Titre" id="titre" required>
    <textarea placeholder="Contenu" id="contenu" required></textarea>
    <button type="submit">📤 Publier</button>
=======
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
>>>>>>> 24e5554 (Forum)
  </form>
  
  <!-- Liste des posts -->
  <div id="postsList"></div>
  
  <!-- Modal pour détails du post -->
<<<<<<< HEAD
  <div id="postModal" style="display:none; border: 1px solid #ddd; padding: 20px;">
    <button onclick="closeModal()">❌ Fermer</button>
=======
  <div id="postModal" style="display:none;">
>>>>>>> 24e5554 (Forum)
    <div id="postDetail"></div>
  </div>

  <script>
<<<<<<< HEAD
    // Charger les posts
    async function loadPosts() {
      const response = await fetch('/api/posts');
      const posts = await response.json();
      
      const postsList = document.getElementById('postsList');
      postsList.innerHTML = posts.map(post => `
        <div class="post" onclick="showPost(${post.id})">
          <h3>${post.titre}</h3>
          <p>Par ${post.pseudo} - ${new Date(post.date_creation).toLocaleDateString()}</p>
          <p>${post.contenu.substring(0, 100)}...</p>
          <small>💬 ${post.nb_commentaires} commentaires | ❤️ ${post.nb_likes} likes</small>
        </div>
      `).join('');
    }

    // Créer un post
    document.getElementById('postForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const userId = document.getElementById('userId').value;
      const titre = document.getElementById('titre').value;
      const contenu = document.getElementById('contenu').value;
      
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ utilisateur_id: userId, titre, contenu })
      });
      
      if (response.ok) {
        loadPosts();
        document.getElementById('postForm').reset();
        alert('✅ Post créé!');
      }
    });

    // Afficher détails d'un post
    async function showPost(postId) {
      const response = await fetch(`/api/posts/${postId}`);
      const post = await response.json();
      
      const modal = document.getElementById('postModal');
      const detail = document.getElementById('postDetail');
      
      detail.innerHTML = `
        <h2>${post.titre}</h2>
        <p><strong>Par:</strong> ${post.pseudo}</p>
        <p><strong>Contenu:</strong> ${post.contenu}</p>
        
        <h3>💬 Commentaires (${post.commentaires.length})</h3>
        <div>
          ${post.commentaires.map(c => `
            <div style="border-left: 2px solid #ddd; padding-left: 10px; margin: 10px 0;">
              <strong>${c.pseudo}</strong>: ${c.contenu}
            </div>
          `).join('')}
        </div>
        
        <textarea id="newComment" placeholder="Ajouter un commentaire..." style="width: 100%; height: 80px;"></textarea>
        <button onclick="addComment(${postId})">Publier commentaire</button>
      `;
      
      modal.style.display = 'block';
    }

    // Ajouter un commentaire
    async function addComment(postId) {
      const contenu = document.getElementById('newComment').value;
      const userId = document.getElementById('userId').value;
      
      if (!contenu) {
        alert('❌ Veuillez écrire un commentaire');
        return;
      }
      
      const response = await fetch(`/api/posts/${postId}/commentaires`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ utilisateur_id: userId, contenu })
      });
      
      if (response.ok) {
        showPost(postId);
        alert('✅ Commentaire ajouté!');
      }
    }

    // Fermer le modal
    function closeModal() {
      document.getElementById('postModal').style.display = 'none';
    }

    // Charger les posts au démarrage
    loadPosts();
=======
    // Vos scripts JavaScript ici
>>>>>>> 24e5554 (Forum)
  </script>
</body>
</html>
```

<<<<<<< HEAD
---

## �📚 Ressources

| Ressource | Lien |
|-----------|------|
| **Express** | https://expressjs.com/ |
| **SQLite3 npm** | https://www.npmjs.com/package/sqlite3 |
| **JavaScript Fetch** | https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API |
| **SQL Basics** | https://www.w3schools.com/sql/ |
| **Schema Documentation** | Voir `schema.md` |

---

## ✅ Checklist - Ce qui a été créé

### Base de Données
- ✅ 5 tables créées (utilisateurs, posts, commentaires, likes_posts, likes_commentaires)
- ✅ 5 index créés pour optimiser les performances
- ✅ Relations et intégrité référentielle en place
- ✅ CASCADE DELETE configuré

### Fonctions Database
- ✅ INSERT (utilisateurs, posts, commentaires)
- ✅ SELECT (simple et avancé)
- ✅ UPDATE (posts)
- ✅ DELETE (posts, commentaires)
- ✅ Filtrage combinable (mes posts, posts aimés, pagination)

### Scripts Utilitaires
- ✅ `init-db.js` - Initialise la BDD
- ✅ `check-db.js` - Vérifie les tables
- ✅ `check-indexes.js` - Vérifie les index
- ✅ `exemples-database.js` - Exemples d'utilisation

### Documentation
- ✅ `schema.md` - Schéma complet (ER diagram)
- ✅ `FORUMR.md` - Ce guide

---

## 🎯 À Faire Ensuite

- [ ] Créer les routes Express dans `server.js`
- [ ] Créer l'interface Web (HTML/CSS) dans `public/`
- [ ] Ajouter la validation des données
- [ ] Ajouter l'authentification (login/register)
- [ ] Hashér les mots de passe (bcrypt)
- [ ] Tester les routes API avec Postman ou Insomnia

---

**Bon développement! 🚀 Bonne chance avec votre projet forum!**
=======
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
>>>>>>> 24e5554 (Forum)
