public class CookieManager {

    // Simule la création d'un cookie HTTP
    public static String createSessionCookie(String sessionId, int expiryHours) {
        long expirySeconds = expiryHours * 3600L;
        return "session_id=" + sessionId
                + "; Max-Age=" + expirySeconds
                + "; HttpOnly"
                + "; SameSite=Strict"
                + "; Path=/";
    }

    // Simule la suppression d'un cookie
    public static String deleteSessionCookie() {
        return "session_id=; Max-Age=0; HttpOnly; Path=/";
    }
}