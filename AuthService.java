import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

public class AuthService {
    private Map<String, User> users = new HashMap<>();
    private Map<String, String> sessions = new HashMap<>();

    public String hashPassword(String password) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(password.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Erreur de hashage", e);
        }
    }

    public String register(String email, String username, String password)
            throws Exception {
        // Vérification email unique
        if (users.containsKey(email)) {
            throw new Exception("Email déjà utilisé : " + email);
        }

        // Vérification champs vides
        if (email == null || email.isBlank())
            throw new Exception("Email obligatoire");
        if (username == null || username.isBlank())
            throw new Exception("Nom d'utilisateur obligatoire");
        if (password == null || password.length() < 8)
            throw new Exception("Mot de passe trop court (8 car. min)");

        // Hash du mot de passe
        String passwordHash = hashPassword(password);

        // Création de l'utilisateur
        User user = new User(email, username, passwordHash);
        users.put(email, user);

        // Création de la session
        String sessionId = createSession(email);

        System.out.println("Utilisateur créé : " + username);
        System.out.println("Hash du mot de passe : " + passwordHash);
        System.out.println("Session ID : " + sessionId);
        System.out.println("Expire le : " + user.getSessionExpiry());

        return sessionId;
    }

    private String createSession(String email) {
        User user = users.get(email);

        // Supprimer l'ancienne session si elle existe
        if (user.getSessionId() != null) {
            sessions.remove(user.getSessionId());
            System.out.println("Ancienne session supprimée.");
        }

        // Nouvelle session
        String sessionId = UUID.randomUUID().toString();
        LocalDateTime expiry = LocalDateTime.now().plusHours(24);

        user.setSessionId(sessionId);
        user.setSessionExpiry(expiry);
        sessions.put(sessionId, email);

        return sessionId;
    }

    public boolean isSessionValid(String sessionId) {
        if (!sessions.containsKey(sessionId)) return false;
        String email = sessions.get(sessionId);
        User user = users.get(email);
        return user.getSessionExpiry().isAfter(LocalDateTime.now());
    }

    public User getUserBySession(String sessionId) {
        String email = sessions.get(sessionId);
        return email != null ? users.get(email) : null;
    }
}