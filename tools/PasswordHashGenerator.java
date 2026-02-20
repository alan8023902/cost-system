import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordHashGenerator {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String password = "admin123";
        String hash = encoder.encode(password);
        System.out.println("Password: " + password);
        System.out.println("Hash: " + hash);
        
        // 验证
        boolean matches = encoder.matches(password, hash);
        System.out.println("Matches: " + matches);
        
        // 测试已有的hash
        String existingHash = "$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iKXgwkOBbYfCXfvtK9nMvPjKgJAa";
        boolean existingMatches = encoder.matches(password, existingHash);
        System.out.println("Existing Hash Matches: " + existingMatches);
    }
}
