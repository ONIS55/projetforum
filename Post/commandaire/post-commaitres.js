// Routes pour POST et COMMENTAIRE

const { parsePostWithImage } = require('./post-upload');

// Route: GET /api/posts
if (pathname === '/api/posts' && req.method === 'GET') {
  queryDB('SELECT * FROM posts ORDER BY date_creation DESC', [], false, (err, rows) => {
    respond(res, err ? 500 : 200, err ? { error: err.message } : (rows || []));
  });
  return;
}

// Route: GET /api/posts/:id
if (pathname.startsWith('/api/posts/') && req.method === 'GET') {
  const id = pathname.split('/')[3];
  
  queryDB('SELECT * FROM posts WHERE id = ?', [id], true, (err, post) => {
    if (err || !post) {
      respond(res, 404, { error: 'Post non trouvé' });
      return;
    }
    
    queryDB('SELECT * FROM commentaires WHERE post_id = ? ORDER BY date_creation DESC', [id], false, (err, commentaires) => {
      respond(res, 200, { ...post, commentaires: commentaires || [] });
    });
  });
  return;
}

// Route: POST /api/posts (avec upload d'image)
if (pathname === '/api/posts' && req.method === 'POST') {
  parsePostWithImage(req)
    .then(data => {
      const { titre, contenu, utilisateur_id, categorie_id, image_path } = data;
      
      if (!titre || !contenu || !utilisateur_id) {
        respond(res, 400, { error: 'Titre, contenu et utilisateur_id requis' });
        return;
      }

      db.run(
        'INSERT INTO posts (utilisateur_id, titre, contenu, categorie_id, image_path) VALUES (?, ?, ?, ?, ?)',
        [utilisateur_id, titre, contenu, categorie_id || null, image_path || null],
        function(err) {
          respond(res, err ? 500 : 201, err ? { error: err.message } : { 
            id: this.lastID, 
            titre, 
            contenu, 
            image_path,
            categorie_id 
          });
        }
      );
    })
    .catch(err => {
      respond(res, 400, { error: err.message });
    });
  return;
}

// Route: POST /api/posts/:id/commentaires
if (pathname.includes('/api/posts/') && pathname.includes('/commentaires') && req.method === 'POST') {
  const id = pathname.split('/')[3];
  
  parseBody(req, (data) => {
    const { utilisateur_id, contenu } = data;
    
    if (!utilisateur_id || !contenu) {
      respond(res, 400, { error: 'Utilisateur ID et contenu requis' });
      return;
    }

    db.run(
      'INSERT INTO commentaires (post_id, utilisateur_id, contenu) VALUES (?, ?, ?)',
      [id, utilisateur_id, contenu],
      function(err) {
        respond(res, err ? 500 : 201, err ? { error: err.message } : { 
          id: this.lastID, 
          post_id: id, 
          utilisateur_id, 
          contenu 
        });
      }
    );
  });
  return;
}
