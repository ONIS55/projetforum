# 📚 DOCUMENTATION - database.js

Ce document détaille toutes les fonctions du fichier `database.js`, qui gère la base de données SQLite du forum.

---

## 🔧 CONFIGURATION GÉNÉRALE

### Connexion à la Base de Données
```javascript
const db = new sqlite3.Database('./Base.db', (err) => {...})
```
- **Rôle** : Établit la connexion avec la base de données SQLite
- **Chemin** : `./Base.db`
- **Action à la connexion** : Appelle `initializeDB()` pour créer les tables si elles n'existent pas

---

## 📋 STRUCTURE DES TABLES

### 1️⃣ TABLE `utilisateurs`
- **Colonnes** :
  - `id` : ID unique (Clé primaire)
  - `pseudo` : Nom d'utilisateur unique
  - `email` : Email unique
  - `mot_de_passe` : Hash du mot de passe
  - `prenom` : Prénom
  - `nom` : Nom de famille
  - `bio` : Biographie (optionnel)
  - `date_inscription` : Timestamp de création
  - `date_modification` : Timestamp de dernière modification

### 2️⃣ TABLE `categories`
- **Colonnes** :
  - `id` : ID unique
  - `nom` : Nom de la catégorie unique
  - `slug` : URL-friendly name unique
  - `description` : Description
  - `date_creation` : Timestamp

### 3️⃣ TABLE `posts`
- **Colonnes** :
  - `id` : ID unique
  - `utilisateur_id` : FK vers utilisateurs
  - `categorie_id` : FK vers categories
  - `titre` : Titre du post
  - `contenu` : Contenu du post
  - `image_path` : Chemin de l'image (optionnel)
  - `nb_vues` : Nombre de vues (défaut: 0)
  - `date_creation` : Timestamp
  - `date_modification` : Timestamp

### 4️⃣ TABLE `commentaires`
- **Colonnes** :
  - `id` : ID unique
  - `post_id` : FK vers posts
  - `utilisateur_id` : FK vers utilisateurs
  - `contenu` : Texte du commentaire
  - `date_creation` : Timestamp
  - `date_modification` : Timestamp

### 5️⃣ TABLE `likes_posts`
- **Colonnes** :
  - `id` : ID unique
  - `utilisateur_id` : FK vers utilisateurs
  - `post_id` : FK vers posts
  - `date_like` : Timestamp du like
  - **Contrainte** : UNIQUE(utilisateur_id, post_id) - Un utilisateur ne peut liker un post qu'une fois

### 6️⃣ TABLE `likes_commentaires`
- **Colonnes** :
  - `id` : ID unique
  - `utilisateur_id` : FK vers utilisateurs
  - `commentaire_id` : FK vers commentaires
  - `date_like` : Timestamp du like
  - **Contrainte** : UNIQUE(utilisateur_id, commentaire_id)

---

## 🚀 FONCTIONS PRINCIPALES

### 🔨 FONCTION : `initializeDB()`

**Rôle** : Crée automatiquement toutes les tables et les index au démarrage

**Détails** :
- Crée les 6 tables (utilisateurs, categories, posts, commentaires, likes_posts, likes_commentaires)
- Crée les index de performance sur les colonnes les plus interrogées
- Insère un utilisateur par défaut avec ID=1 si aucun n'existe
- Affiche des messages de log pour chaque action

**Index créés** :
- `idx_posts_user_id` : Sur posts.utilisateur_id
- `idx_posts_categorie_id` : Sur posts.categorie_id
- `idx_commentaires_post_id` : Sur commentaires.post_id
- `idx_commentaires_user_id` : Sur commentaires.utilisateur_id
- `idx_likes_posts_unique` : UNIQUE sur likes_posts(utilisateur_id, post_id)
- `idx_likes_commentaires_unique` : UNIQUE sur likes_commentaires(utilisateur_id, commentaire_id)

---

## ➕ FONCTIONS INSERT

### 1️⃣ `insererUtilisateur(pseudo, email, mot_de_passe, prenom, nom, bio = '')`

**Rôle** : Ajoute un nouvel utilisateur dans la base de données

**Paramètres** :
| Nom | Type | Requis | Description |
|-----|------|--------|-------------|
| `pseudo` | string | ✅ | Nom d'utilisateur (UNIQUE) |
| `email` | string | ✅ | Email utilisateur (UNIQUE) |
| `mot_de_passe` | string | ✅ | Hash du mot de passe |
| `prenom` | string | ✅ | Prénom |
| `nom` | string | ✅ | Nom de famille |
| `bio` | string | ❌ | Biographie (défaut: '') |

**Retour** : Promise
- ✅ **Succès** : ID de l'utilisateur créé
- ❌ **Erreur** : Message d'erreur

**Exemple** :
```javascript
const userId = await insererUtilisateur('john_doe', 'john@example.com', 'hashedpass123', 'John', 'Doe', 'Je suis développeur');
```

---

### 2️⃣ `insererPost(utilisateur_id, titre, contenu, categorie_id = null, image_path = null)`

**Rôle** : Crée un nouveau post dans le forum

**Paramètres** :
| Nom | Type | Requis | Description |
|-----|------|--------|-------------|
| `utilisateur_id` | integer | ✅ | ID de l'auteur |
| `titre` | string | ✅ | Titre du post |
| `contenu` | string | ✅ | Contenu du post |
| `categorie_id` | integer | ❌ | ID de la catégorie (défaut: null) |
| `image_path` | string | ❌ | Chemin de l'image (défaut: null) |

**Retour** : Promise
- ✅ **Succès** : ID du post créé
- ❌ **Erreur** : Message d'erreur

**Exemple** :
```javascript
const postId = await insererPost(1, 'Mon premier post', 'Contenu du post', 3, '/uploads/image.jpg');
```

---

### 3️⃣ `insererCommentaire(post_id, utilisateur_id, contenu)`

**Rôle** : Ajoute un commentaire à un post

**Paramètres** :
| Nom | Type | Requis | Description |
|-----|------|--------|-------------|
| `post_id` | integer | ✅ | ID du post |
| `utilisateur_id` | integer | ✅ | ID de l'auteur du commentaire |
| `contenu` | string | ✅ | Texte du commentaire |

**Retour** : Promise
- ✅ **Succès** : ID du commentaire créé
- ❌ **Erreur** : Message d'erreur

**Exemple** :
```javascript
const commentId = await insererCommentaire(5, 2, 'Super article !');
```

---

### 4️⃣ `insererCategorie(nom, slug, description = '')`

**Rôle** : Ajoute une nouvelle catégorie de forum

**Paramètres** :
| Nom | Type | Requis | Description |
|-----|------|--------|-------------|
| `nom` | string | ✅ | Nom de la catégorie (UNIQUE) |
| `slug` | string | ✅ | URL-friendly slug (UNIQUE) |
| `description` | string | ❌ | Description (défaut: '') |

**Retour** : Promise
- ✅ **Succès** : ID de la catégorie créée
- ❌ **Erreur** : Message d'erreur

**Exemple** :
```javascript
const catId = await insererCategorie('JavaScript', 'javascript', 'Discussions sur JavaScript');
```

---

## 🔍 FONCTIONS SELECT (Lectures)

### 1️⃣ `obtenirUtilisateurs()`

**Rôle** : Récupère tous les utilisateurs de la base de données

**Paramètres** : Aucun

**Retour** : Promise
- ✅ **Succès** : Tableau d'objets utilisateurs
- ❌ **Erreur** : Message d'erreur

**Exemple** :
```javascript
const users = await obtenirUtilisateurs();
// Retourne : [{id: 1, pseudo: 'user1', email: '...', ...}, ...]
```

---

### 2️⃣ `obtenirCategories()`

**Rôle** : Récupère toutes les catégories triées par nom

**Paramètres** : Aucun

**Retour** : Promise
- ✅ **Succès** : Tableau des catégories (triées alphabétiquement)
- ❌ **Erreur** : Message d'erreur

**Exemple** :
```javascript
const categories = await obtenirCategories();
// Retourne : [{id: 1, nom: 'CSS', slug: 'css', ...}, ...]
```

---

### 3️⃣ `obtenirPosts()`

**Rôle** : Récupère tous les posts avec le pseudo et email de l'auteur, triés du plus récent

**Retour** : Promise
- ✅ **Succès** : Tableau des posts avec informations sur l'auteur
- ❌ **Erreur** : Message d'erreur

**Données retournées** :
```javascript
{
  id, 
  utilisateur_id, 
  categorie_id, 
  titre, 
  contenu, 
  image_path,
  nb_vues,
  date_creation,
  date_modification,
  pseudo,           // ← Ajouté (LEFT JOIN)
  email             // ← Ajouté (LEFT JOIN)
}
```

**Exemple** :
```javascript
const posts = await obtenirPosts();
```

---

### 4️⃣ `obtenirCommentairesParPost(post_id)`

**Rôle** : Récupère tous les commentaires d'un post avec le pseudo de l'auteur

**Paramètres** :
| Nom | Type | Requis | Description |
|-----|------|--------|-------------|
| `post_id` | integer | ✅ | ID du post |

**Retour** : Promise
- ✅ **Succès** : Tableau des commentaires (triés par date croissante)
- ❌ **Erreur** : Message d'erreur

**Données retournées** :
```javascript
{
  id,
  post_id,
  utilisateur_id,
  contenu,
  date_creation,
  date_modification,
  pseudo    // ← Ajouté (LEFT JOIN)
}
```

**Exemple** :
```javascript
const comments = await obtenirCommentairesParPost(7);
```

---

### 5️⃣ `obtenirUtilisateurParPseudo(pseudo)`

**Rôle** : Récupère les informations complètes d'un utilisateur par son pseudo

**Paramètres** :
| Nom | Type | Requis | Description |
|-----|------|--------|-------------|
| `pseudo` | string | ✅ | Pseudo de l'utilisateur |

**Retour** : Promise
- ✅ **Succès** : Objet utilisateur complet
- ❌ **Erreur** : Message d'erreur (retourne undefined si pas trouvé)

**Exemple** :
```javascript
const user = await obtenirUtilisateurParPseudo('john_doe');
// Retourne : {id: 1, pseudo: 'john_doe', email: 'john@example.com', ...}
```

---

### 6️⃣ `obtenirPostParId(post_id)`

**Rôle** : Récupère un post spécifique avec le pseudo de l'auteur

**Paramètres** :
| Nom | Type | Requis | Description |
|-----|------|--------|-------------|
| `post_id` | integer | ✅ | ID du post |

**Retour** : Promise
- ✅ **Succès** : Objet post complet
- ❌ **Erreur** : Message d'erreur (retourne undefined si pas trouvé)

**Données retournées** :
```javascript
{
  id,
  utilisateur_id,
  categorie_id,
  titre,
  contenu,
  image_path,
  nb_vues,
  date_creation,
  date_modification,
  pseudo    // ← Ajouté
}
```

**Exemple** :
```javascript
const post = await obtenirPostParId(42);
```

---

### 7️⃣ `obtenirPostsAvecFiltres(options = {})`

**Rôle** : Récupère les posts avec plusieurs filtres combinables (pagination, catégorie, mes posts, posts aimés)

**Paramètres** :
| Nom | Type | Requis | Description |
|-----|------|--------|-------------|
| `user_id` | integer | ❌ | ID de l'utilisateur pour les filtres personnalisés |
| `filtre_mine` | boolean | ❌ | true = affiche SEULEMENT les posts de l'utilisateur (défaut: false) |
| `filtre_likes` | boolean | ❌ | true = affiche SEULEMENT les posts que l'utilisateur a aimés (défaut: false) |
| `categorie_id` | integer | ❌ | Filtre par catégorie spécifique (défaut: null) |
| `limit` | integer | ❌ | Nombre de posts par page (défaut: 10) |
| `offset` | integer | ❌ | Position de départ (pagination) (défaut: 0) |

**Retour** : Promise
- ✅ **Succès** : Tableau des posts filtrés avec statistiques
- ❌ **Erreur** : Message d'erreur

**Données retournées** :
```javascript
{
  id,
  utilisateur_id,
  categorie_id,
  titre,
  contenu,
  image_path,
  nb_vues,
  date_creation,
  date_modification,
  auteur,              // ← pseudo de l'auteur
  categorie_nom,       // ← nom de la catégorie
  nb_commentaires,     // ← nombre total de commentaires
  nb_likes             // ← nombre total de likes
}
```

**Exemples** :

```javascript
// 1. Tous les posts, page 1
await obtenirPostsAvecFiltres({ limit: 10, offset: 0 });

// 2. Tous les posts d'un utilisateur
await obtenirPostsAvecFiltres({ user_id: 3, filtre_mine: true, limit: 20 });

// 3. Posts d'une catégorie spécifique
await obtenirPostsAvecFiltres({ categorie_id: 2, limit: 15 });

// 4. Posts aimés par l'utilisateur
await obtenirPostsAvecFiltres({ user_id: 5, filtre_likes: true });

// 5. Combinaison : mes posts dans la catégorie JavaScript, page 2
await obtenirPostsAvecFiltres({
  user_id: 1,
  filtre_mine: true,
  categorie_id: 1,
  limit: 10,
  offset: 10  // Page 2
});
```

---

## ✏️ FONCTIONS UPDATE (Modifications)

### 1️⃣ `mettreAJourPost(post_id, titre, contenu)`

**Rôle** : Modifie le titre et le contenu d'un post existant

**Paramètres** :
| Nom | Type | Requis | Description |
|-----|------|--------|-------------|
| `post_id` | integer | ✅ | ID du post à modifier |
| `titre` | string | ✅ | Nouveau titre |
| `contenu` | string | ✅ | Nouveau contenu |

**Retour** : Promise
- ✅ **Succès** : undefined (pas de valeur de retour)
- ❌ **Erreur** : Message d'erreur

**Notes** :
- La colonne `date_modification` est automatiquement mise à jour (CURRENT_TIMESTAMP)
- Les autres colonnes (nb_vues, categorie_id, image_path) ne sont pas modifiées

**Exemple** :
```javascript
await mettreAJourPost(12, 'Nouveau titre', 'Nouveau contenu du post');
```

---

## 🗑️ FONCTIONS DELETE (Suppressions)

### 1️⃣ `supprimerPost(post_id)`

**Rôle** : Supprime un post et tous ses commentaires associés (CASCADE)

**Paramètres** :
| Nom | Type | Requis | Description |
|-----|------|--------|-------------|
| `post_id` | integer | ✅ | ID du post à supprimer |

**Retour** : Promise
- ✅ **Succès** : undefined
- ❌ **Erreur** : Message d'erreur

**Cascade** :
- Tous les commentaires du post sont supprimés
- Tous les likes des commentaires supprimés sont supprimés
- Tous les likes du post sont supprimés

**Exemple** :
```javascript
await supprimerPost(25);
```

---

### 2️⃣ `supprimerCommentaire(commentaire_id)`

**Rôle** : Supprime un commentaire spécifique

**Paramètres** :
| Nom | Type | Requis | Description |
|-----|------|--------|-------------|
| `commentaire_id` | integer | ✅ | ID du commentaire à supprimer |

**Retour** : Promise
- ✅ **Succès** : undefined
- ❌ **Erreur** : Message d'erreur

**Cascade** :
- Tous les likes de ce commentaire sont aussi supprimés

**Exemple** :
```javascript
await supprimerCommentaire(99);
```

---

## 📤 EXPORTS

Le fichier exporte les objets et fonctions suivants :

```javascript
module.exports = {
  db,                              // ← Objet de connexion SQLite
  
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
```

---

## 🔗 RELATIONS DE CLÉS ÉTRANGÈRES

```
utilisateurs (1) ─→ (∞) posts
utilisateurs (1) ─→ (∞) commentaires
utilisateurs (1) ─→ (∞) likes_posts
utilisateurs (1) ─→ (∞) likes_commentaires

categories (1) ─→ (∞) posts

posts (1) ─→ (∞) commentaires
posts (1) ─→ (∞) likes_posts

commentaires (1) ─→ (∞) likes_commentaires
```

**Comportement CASCADE ON DELETE** :
- Supprimer un utilisateur → Supprime ses posts, commentaires, likes
- Supprimer un post → Supprime ses commentaires et likes
- Supprimer un commentaire → Supprime ses likes

---

## ⚡ PERFORMANCES

Les index créés optimisent les requêtes les plus fréquentes :

| Index | colone | ça sert |
|-------|--------|---------|
| `idx_posts_user_id` | posts.utilisateur_id | Affichage des posts d'un utilisateur |
| `idx_posts_categorie_id` | posts.categorie_id | Filtrage par catégorie |
| `idx_commentaires_post_id` | commentaires.post_id | Affichage des commentaires d'un post |
| `idx_commentaires_user_id` | commentaires.utilisateur_id | Affichage des commentaires d'un utilisateur |
| `idx_likes_posts_unique` | likes_posts (2 colonnes) | Éviter les likes en doublon |
| `idx_likes_commentaires_unique` | likes_commentaires (2 colonnes) | Éviter les likes en doublon |

---

## 🎯 CAS D'USAGE COURANTS

### Afficher la page d'accueil du forum
```javascript
const posts = await obtenirPostsAvecFiltres({ limit: 20, offset: 0 });
```

### Afficher les posts d'une catégorie
```javascript
const posts = await obtenirPostsAvecFiltres({ categorie_id: 2, limit: 15 });
```

### Afficher mon profil (mes posts)
```javascript
const myPosts = await obtenirPostsAvecFiltres({
  user_id: userId,
  filtre_mine: true,
  limit: 10
});
```

### Afficher mes posts favoris
```javascript
const favorites = await obtenirPostsAvecFiltres({
  user_id: userId,
  filtre_likes: true,
  limit: 10
});
```

### Créer un nouveau post
```javascript
const postId = await insererPost(userId, 'Titre', 'Contenu', categoryId);
```

### Ajouter un commentaire
```javascript
const commentId = await insererCommentaire(postId, userId, 'Mon avis');
```

### Récupérer les commentaires d'un post
```javascript
const comments = await obtenirCommentairesParPost(postId);
```

---

## ✅ RÉSUMÉ DES FONCTIONS

| Fonction          | Type | Retour | Utilité |
|----------|------|--------|---------|
| `initializeDB()`= À quoi ça sert : Préparer la base de données au démarrage du serveur | Setup | void | Crée les tables et index |
| `insererUtilisateur()` | INSERT | Promise(id) | Ajouter un utilisateur |
| `insererPost()` | INSERT | Promise(id) | Créer un post |
| `insererCommentaire()` | INSERT | Promise(id) | Ajouter un commentaire |
| `insererCategorie()` | INSERT | Promise(id) | Créer une catégorie |
| `obtenirUtilisateurs()` | SELECT | Promise(array) | Lister tous les utilisateurs |
| `obtenirCategories()` | SELECT | Promise(array) | Lister les catégories |
| `obtenirPosts()` | SELECT | Promise(array) | Lister tous les posts |
| `obtenirCommentairesParPost()` | SELECT | Promise(array) | Lister les commentaires |
| `obtenirUtilisateurParPseudo()` | SELECT | Promise(object) | Trouver un utilisateur |
| `obtenirPostParId()` | SELECT | Promise(object) | Trouver un post |
| `obtenirPostsAvecFiltres()` | SELECT | Promise(array) | Lister avec filtres |
| `mettreAJourPost()` | UPDATE | Promise(void) | Modifier un post |
| `supprimerPost()` | DELETE | Promise(void) | Supprimer un post |
| `supprimerCommentaire()` | DELETE | Promise(void) | Supprimer un commentaire |

---

**Fin de la documentation** ✨
