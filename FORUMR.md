# 📚 FORUMR - Guide d'utilisation de la Base de Données

Ce guide explique comment **utiliser** la structure de base de données complète qui a été créée.

---

## ✅ État du Projet

✅ **Base de données SQLite créée** (`Base.db`)  
✅ **5 tables créées** (utilisateurs, posts, commentaires, likes_posts, likes_commentaires)  
✅ **5 index créés** pour optimiser les performances  
✅ **Fonctions complètes** (INSERT, SELECT, UPDATE, DELETE)  
✅ **Filtrage combinable** pour les requêtes avancées  

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
  obtenirPostsAvecFiltres
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
```

### B. Ajouter un post :
```javascript
const postId = await insererPost(
  userId,                     // utilisateur_id
  'Mon titre',                // titre
  'Contenu du post'           // contenu
);
```

### C. Ajouter un commentaire :
```javascript
const commentId = await insererCommentaire(
  postId,                     // post_id
  userId,                     // utilisateur_id
  'Super post!'               // contenu
);
```

### D. Récupérer tous les posts :
```javascript
const posts = await obtenirPosts();
```

### E. Récupérer les commentaires d'un post :
```javascript
const commentaires = await obtenirCommentairesParPost(postId);
```

---

## 🔎 Étape 3 : Filtrage Combinable

La fonction `obtenirPostsAvecFiltres()` permet de filtrer les posts :

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
  limit: 10
});
```

**Résultat** : Array de posts avec `nb_commentaires` et `nb_likes`

---

## ⚡ Étape 4 : Index (Performance)

5 index ont été créés pour optimiser les requêtes :

| Index | Rôle | Impact |
|-------|------|--------|
| `idx_posts_user_id` | Trouver posts d'un user | ⚡ 10-100x plus rapide |
| `idx_commentaires_post_id` | Trouver commentaires d'un post | ⚡ 10-100x plus rapide |
| `idx_commentaires_user_id` | Trouver commentaires d'un user | ⚡ 10-100x plus rapide |
| `idx_likes_posts_unique` | Empêcher doublons + perf | ⚡ Pas de duplicate |
| `idx_likes_commentaires_unique` | Empêcher doublons + perf | ⚡ Pas de duplicate |

**Vérifier les index :**
```bash
node check-indexes.js
```

---

## 🔧 Étape 5 : Créer les Routes API

Pour utiliser la base de données dans Express, créez les routes :

```javascript
const express = require('express');
const { obtenirPosts, insererPost } = require('./database');

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

app.listen(3000, () => console.log('Server sur port 3000'));
```

---

## 🎨 Étape 6 : Intégrer avec l'Interface Web

Utiliser les routes API dans votre HTML/JavaScript :

```javascript
// Récupérer les posts
async function chargerPosts() {
  const response = await fetch('/api/posts');
  const posts = await response.json();
  
  console.log(posts);
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

```html
<!DOCTYPE html>
<html>
<head>
  <title>Forum</title>
  <style>
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
  </form>
  
  <!-- Liste des posts -->
  <div id="postsList"></div>
  
  <!-- Modal pour détails du post -->
  <div id="postModal" style="display:none; border: 1px solid #ddd; padding: 20px;">
    <button onclick="closeModal()">❌ Fermer</button>
    <div id="postDetail"></div>
  </div>

  <script>
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
  </script>
</body>
</html>
```

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
