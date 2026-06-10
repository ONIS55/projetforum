// Routes pour POST et COMMENTAIRE

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

// Route: POST /api/posts
if (pathname === '/api/posts' && req.method === 'POST') {
  parseBody(req, (data) => {
    const { titre, contenu, auteur, prenom, email, pseudo } = data;
    
    if (!titre || !contenu || !auteur || !prenom || !email || !pseudo) {
      respond(res, 400, { error: 'Tous les champs sont requis' });
      return;
    }

    db.run(
      'INSERT INTO posts (titre, contenu, auteur, prenom, email, pseudo) VALUES (?, ?, ?, ?, ?, ?)',
      [titre, contenu, auteur, prenom, email, pseudo],
      function(err) {
        respond(res, err ? 500 : 201, err ? { error: err.message } : { id: this.lastID, titre, contenu, auteur, prenom, email, pseudo });
      }
    );
  });
  return;
}

// Route: POST /api/posts/:id/commentaires
if (pathname.includes('/api/posts/') && pathname.includes('/commentaires') && req.method === 'POST') {
  const id = pathname.split('/')[3];
  
  parseBody(req, (data) => {
    const { auteur, contenu } = data;
    
    if (!auteur || !contenu) {
      respond(res, 400, { error: 'Auteur et contenu requis' });
      return;
    }

    db.run(
      'INSERT INTO commentaires (post_id, auteur, contenu) VALUES (?, ?, ?)',
      [id, auteur, contenu],
      function(err) {
        respond(res, err ? 500 : 201, err ? { error: err.message } : { id: this.lastID, post_id: id, auteur, contenu });
      }
    );
  });
  return;
}
