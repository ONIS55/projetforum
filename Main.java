public class Main {
    public static void main(String[] args) {
        AuthService auth = new AuthService();

        try {
            // Inscription utilisateur 1
            System.out.println("=== Inscription user1 ===");
            String session1 = auth.register("alice@mail.com", "Alice", "motdepasse123");
            String cookie1 = CookieManager.createSessionCookie(session1, 24);
            System.out.println("Cookie : " + cookie1);
            System.out.println("Session valide : " + auth.isSessionValid(session1));

            // Inscription utilisateur 2
            System.out.println("\n=== Inscription user2 ===");
            String session2 = auth.register("bob@mail.com", "Bob", "supersecret99");
            System.out.println("Cookie : " + CookieManager.createSessionCookie(session2, 24));

            // Email déjà pris
            System.out.println("\n=== Email déjà pris ===");
            auth.register("alice@mail.com", "Alice2", "autremdp123");

        } catch (Exception e) {
            System.out.println("Erreur : " + e.getMessage());
        }
    }
}