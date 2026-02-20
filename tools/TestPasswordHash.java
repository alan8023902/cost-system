import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordHashGenerator {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        
        String password = "admin123";
        String hash = encoder.encode(password);
        
        System.out.println("=================================");
        System.out.println("密码: " + password);
        System.out.println("Hash: " + hash);
        System.out.println("=================================");
        
        // 验证
        boolean matches = encoder.matches(password, hash);
        System.out.println("验证结果: " + matches);
        
        // 测试现有hash
        String existingHash = "$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iKXgwkOBbYfCXfvtK9nMvPjKgJAa";
        boolean matchesExisting = encoder.matches(password, existingHash);
        System.out.println("现有Hash验证: " + matchesExisting);
    }
}
