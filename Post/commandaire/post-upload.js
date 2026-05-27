/**
 * ========================================
 * GESTION DE L'UPLOAD D'IMAGES POUR LES POSTS
 * ========================================
 * 
 * Utilise busboy pour parser les données multipart/form-data
 * Utilise file-type pour valider les types d'images
 * Sauvegarde les images dans le dossier /uploads
 */

const busboy = require('busboy');
const FileType = require('file-type');
const fs = require('fs');
const path = require('path');

// Dossier de destination pour les uploads
const uploadsDir = path.join(__dirname, '../../uploads');

/**
 * Valide et sauvegarde une image uploadée
 * @param {Stream} file - Stream du fichier
 * @param {string} filename - Nom original du fichier
 * @returns {Promise<string>} Chemin relatif du fichier sauvegardé
 */
async function handleImageUpload(file, filename) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    
    file.on('data', chunk => {
      chunks.push(chunk);
    });
    
    file.on('end', async () => {
      try {
        const buffer = Buffer.concat(chunks);
        
        // Vérifier le type MIME avec file-type
        const ft = await FileType.fromBuffer(buffer);
        
        if (!ft || !/^image\/(jpeg|png|gif|webp|bmp)$/.test(ft.mime)) {
          reject(new Error('Type de fichier non valide. Acceptés: JPEG, PNG, GIF, WebP, BMP'));
          return;
        }
        
        // Générer un nom de fichier sécurisé
        const timestamp = Date.now();
        const random = Math.random().toString(36).slice(2);
        const ext = '.' + ft.ext;
        const safeName = `${timestamp}-${random}${ext}`;
        const savePath = path.join(uploadsDir, safeName);
        
        // Sauvegarder le fichier
        fs.writeFile(savePath, buffer, (err) => {
          if (err) {
            reject(new Error(`Erreur sauvegarde: ${err.message}`));
            return;
          }
          resolve(`/uploads/${safeName}`);
        });
      } catch (err) {
        reject(new Error(`Erreur traitement image: ${err.message}`));
      }
    });
    
    file.on('error', err => {
      reject(new Error(`Erreur stream: ${err.message}`));
    });
  });
}

/**
 * Parse une requête multipart/form-data avec image
 * @param {http.IncomingMessage} req - Requête HTTP
 * @returns {Promise<object>} Objet avec titre, contenu, image_path, etc.
 */
async function parsePostWithImage(req) {
  return new Promise((resolve, reject) => {
    const bb = busboy({ headers: req.headers });
    const fields = {};
    let imagePath = null;
    const errors = [];
    
    bb.on('file', async (fieldname, file, info) => {
      if (fieldname === 'image') {
        try {
          imagePath = await handleImageUpload(file, info.filename);
        } catch (err) {
          errors.push(err.message);
          file.resume(); // Consommer le stream même en cas d'erreur
        }
      } else {
        file.resume(); // Ignorer les autres fichiers
      }
    });
    
    bb.on('field', (fieldname, value) => {
      fields[fieldname] = value;
    });
    
    bb.on('close', () => {
      if (errors.length > 0) {
        reject(new Error(errors.join(', ')));
        return;
      }
      resolve({
        ...fields,
        image_path: imagePath
      });
    });
    
    bb.on('error', err => {
      reject(new Error(`Erreur parsing: ${err.message}`));
    });
    
    req.pipe(bb);
  });
}

module.exports = {
  handleImageUpload,
  parsePostWithImage
};
