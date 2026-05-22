# 📊 Schéma de Base de Données - Forum

## Vue d'ensemble

Ce projet utilise **SQLite** pour stocker toutes les données du forum. Voici la structure complète de la base de données.

---

## 📋 Tables

### 1️⃣ **UTILISATEURS** (Users)
Table contenant tous les utilisateurs du forum.

```sql
CREATE TABLE utilisateurs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pseudo TEXT UNIQUE NOT NULL,           -- Nom d'utilisateur unique
  email TEXT UNIQUE NOT NULL,            -- Email unique
  mot_de_passe TEXT NOT NULL,            -- Mot de passe hashé (à implémenter)
  prenom TEXT NOT NULL,
  nom TEXT NOT NULL,
  bio TEXT,                              -- Biographie courte
  date_inscription DATETIME DEFAULT CURRENT_TIMESTAMP,
  date_modification DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

**Exemple:**
```
id | pseudo | email              | prenom | nom    | bio
1  | alice  | alice@example.com  | Alice  | Dupont | "Bienvenue sur mon profil"
2  | bob    | bob@example.com    | Bob    | Martin | "J'aime coder"
```

---

### 2️⃣ **POSTS** (Articles du forum)
Table contenant tous les posts/articles créés par les utilisateurs.

```sql
CREATE TABLE posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  utilisateur_id INTEGER NOT NULL,       -- Qui a créé le post (FK)
  titre TEXT NOT NULL,
  contenu TEXT NOT NULL,
  nb_vues INTEGER DEFAULT 0,             -- Nombre de fois consulté
  date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
  date_modification DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
)
```

**Exemple:**
```
id | utilisateur_id | titre                 | contenu                      | nb_vues
1  | 1              | "Mon premier post"    | "Ceci est le contenu..."     | 42
2  | 2              | "Conseils JavaScript" | "Voici mes conseils..."      | 128
```

**Relation:** Un utilisateur (1) ---> Plusieurs posts (N)

---

### 3️⃣ **COMMENTAIRES** (Réponses aux posts)
Table contenant les commentaires sur les posts.

```sql
CREATE TABLE commentaires (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,              -- À quel post appartient le commentaire (FK)
  utilisateur_id INTEGER NOT NULL,       -- Qui a écrit le commentaire (FK)
  contenu TEXT NOT NULL,
  date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
  date_modification DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
)
```

**Exemple:**
```
id | post_id | utilisateur_id | contenu                  | date_creation
1  | 1       | 2              | "Super post Alice ! 😊" | 2024-05-22 10:30:00
2  | 1       | 2              | "Tu as d'autres conseils ?" | 2024-05-22 11:45:00
```

**Relations:**
- Un utilisateur (1) ---> Plusieurs commentaires (N)
- Un post (1) ---> Plusieurs commentaires (N)

---

### 4️⃣ **LIKES_POSTS** (J'aime sur les posts)
Table pour gérer les "j'aime" sur les posts.

```sql
CREATE TABLE likes_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  utilisateur_id INTEGER NOT NULL,       -- Qui a aimé
  post_id INTEGER NOT NULL,              -- Quel post
  date_like DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(utilisateur_id, post_id),       -- Pas de doublon (1 like par utilisateur par post)
  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
)
```

---

### 5️⃣ **LIKES_COMMENTAIRES** (J'aime sur les commentaires)
Table pour gérer les "j'aime" sur les commentaires.

```sql
CREATE TABLE likes_commentaires (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  utilisateur_id INTEGER NOT NULL,
  commentaire_id INTEGER NOT NULL,
  date_like DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(utilisateur_id, commentaire_id),
  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
  FOREIGN KEY (commentaire_id) REFERENCES commentaires(id) ON DELETE CASCADE
)
```

---

## 📝 Requêtes SQL principales

### ✅ CREATE - Créer une table
```sql
-- Déjà gérée par database.js dans initializeDB()
CREATE TABLE utilisateurs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pseudo TEXT UNIQUE NOT NULL,
  ...
);
```

### ✅ INSERT - Insérer des données
```sql
-- Insérer un utilisateur
INSERT INTO utilisateurs (pseudo, email, mot_de_passe, prenom, nom, bio) 
VALUES ('alice', 'alice@example.com', 'hashedPassword123', 'Alice', 'Dupont', 'Mon bio');

-- Insérer un post
INSERT INTO posts (utilisateur_id, titre, contenu) 
VALUES (1, 'Mon premier post', 'Contenu du post');

-- Insérer un commentaire
INSERT INTO commentaires (post_id, utilisateur_id, contenu) 
VALUES (1, 2, 'Excellent post !');
```

### ✅ SELECT - Récupérer des données
```sql
-- Récupérer tous les posts avec l'auteur
SELECT p.*, u.pseudo, u.email 
FROM posts p 
LEFT JOIN utilisateurs u ON p.utilisateur_id = u.id 
ORDER BY p.date_creation DESC;

-- Récupérer les commentaires d'un post avec l'auteur
SELECT c.*, u.pseudo 
FROM commentaires c 
LEFT JOIN utilisateurs u ON c.utilisateur_id = u.id 
WHERE c.post_id = 1 
ORDER BY c.date_creation ASC;

-- Récupérer les posts avec le nombre de commentaires
SELECT p.id, p.titre, u.pseudo, COUNT(c.id) as nb_commentaires
FROM posts p
LEFT JOIN utilisateurs u ON p.utilisateur_id = u.id
LEFT JOIN commentaires c ON p.id = c.post_id
GROUP BY p.id;

-- Récupérer les utilisateurs les plus actifs
SELECT u.pseudo, COUNT(p.id) as nb_posts
FROM utilisateurs u
LEFT JOIN posts p ON u.id = p.utilisateur_id
GROUP BY u.id
ORDER BY nb_posts DESC;
```

### ✅ UPDATE - Modifier des données
```sql
-- Modifier un post
UPDATE posts 
SET titre = 'Nouveau titre', contenu = 'Nouveau contenu', date_modification = CURRENT_TIMESTAMP 
WHERE id = 1;
```

### ✅ DELETE - Supprimer des données
```sql
-- Supprimer un post (les commentaires seront aussi supprimés via CASCADE)
DELETE FROM posts WHERE id = 1;

-- Supprimer un commentaire
DELETE FROM commentaires WHERE id = 1;

-- Supprimer un utilisateur (tous ses posts et commentaires seront supprimés via CASCADE)
DELETE FROM utilisateurs WHERE id = 1;
```

---

## 🔗 Relations et Intégrité Référentielle

```
UTILISATEURS
    ├─ (1) ──────────── (N) ──→ POSTS
    ├─ (1) ──────────── (N) ──→ COMMENTAIRES
    ├─ (1) ──────────── (N) ──→ LIKES_POSTS
    └─ (1) ──────────── (N) ──→ LIKES_COMMENTAIRES

POSTS
    ├─ (1) ──────────── (N) ──→ COMMENTAIRES
    └─ (1) ──────────── (N) ──→ LIKES_POSTS

COMMENTAIRES
    └─ (1) ──────────── (N) ──→ LIKES_COMMENTAIRES
```

**Cascade Delete:** Si un utilisateur est supprimé, tous ses posts et commentaires le seront aussi.

---

## 📂 Fichiers du projet

- **database.js** - Fonctions pour gérer la base de données (INSERT, SELECT, UPDATE, DELETE)
- **exemples-database.js** - Exemples d'utilisation et requêtes avancées
- **schema.md** - Cette documentation (schéma de la BDD)
- **Base.db** - Fichier SQLite (créé automatiquement)

---

## 🚀 Utilisation

### Importer les fonctions
```javascript
const {
  insererUtilisateur,
  insererPost,
  insererCommentaire,
  obtenirUtilisateurs,
  obtenirPosts,
  obtenirCommentairesParPost
} = require('./database');
```

### Ajouter un utilisateur
```javascript
const userId = await insererUtilisateur('alice', 'alice@example.com', 'password123', 'Alice', 'Dupont');
```

### Ajouter un post
```javascript
const postId = await insererPost(userId, 'Mon premier post', 'Contenu du post');
```

### Récupérer les posts
```javascript
const posts = await obtenirPosts();
console.log(posts);
```

---

## 🔐 À faire (Sécurité)

- [ ] Hasher les mots de passe (bcrypt)
- [ ] Valider les emails
- [ ] Ajouter une gestion des permissions (admin, modérateur, utilisateur)
- [ ] Implémenter la pagination pour les posts
- [ ] Ajouter des indexes sur les colonnes fréquemment interrogées

---

## ✅ Respect des exigences

✅ **Requête SELECT** - Récupération des posts, commentaires, utilisateurs  
✅ **Requête CREATE** - Création de 5 tables  
✅ **Requête INSERT** - Insertion d'utilisateurs, posts, commentaires  
✅ **Schéma entité-relation** - Diagramme ER fourni  
✅ **Intégrité référentielle** - FOREIGN KEY et CASCADE DELETE  
