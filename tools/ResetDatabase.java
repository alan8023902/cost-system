import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class ResetDatabase {
    public static void main(String[] args) {
        String url = "jdbc:mysql://localhost:3306/?useSSL=false&serverTimezone=Asia/Shanghai";
        String user = "root";
        String password = "liurongai";

        try (Connection conn = DriverManager.getConnection(url, user, password);
             Statement stmt = conn.createStatement()) {

            System.out.println("连接数据库成功");

            // 删除数据库
            stmt.execute("DROP DATABASE IF EXISTS cost_system");
            System.out.println("✓ 删除旧数据库");

            // 创建数据库
            stmt.execute("CREATE DATABASE cost_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            System.out.println("✓ 创建新数据库");

            System.out.println("\n数据库重置完成！请重启后端服务。");

        } catch (Exception e) {
            System.err.println("错误: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
