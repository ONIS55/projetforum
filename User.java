import java.time.LocalDateTime;

public class User {
    private String email;
    private String username;
    private String passwordHash;
    private String sessionId;
    private LocalDateTime sessionExpiry;

    public User(String email, String username, String passwordHash) {
        this.email = email;
        this.username = username;
        this.passwordHash = passwordHash;
    }

    public String getEmail() { return email; }
    public String getUsername() { return username; }
    public String getPasswordHash() { return passwordHash; }
    public String getSessionId() { return sessionId; }
    public LocalDateTime getSessionExpiry() { return sessionExpiry; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
    public void setSessionExpiry(LocalDateTime expiry) { this.sessionExpiry = expiry; }
}