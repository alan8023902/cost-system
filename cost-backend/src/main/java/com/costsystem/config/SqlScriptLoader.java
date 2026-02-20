package com.costsystem.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * SQL 脚本加载器
 * 在应用启动时执行 SQL 脚本
 */
//@Component  // 禁用自定义 SQL 加载器，使用 Spring 的 spring.sql.init
public class SqlScriptLoader implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(SqlScriptLoader.class);

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        logger.info("开始执行 SQL 初始化脚本...");

        try {
            // 1. 执行建表脚本
            executeScript("sql/schema.sql");

            // 2. 执行数据初始化脚本
            executeScript("sql/data.sql");

            logger.info("SQL 初始化脚本执行完成");
        } catch (Exception e) {
            logger.error("SQL 初始化脚本执行失败", e);
            throw e;
        }
    }

    private void executeScript(String scriptPath) throws Exception {
        logger.info("执行脚本: {}", scriptPath);

        ClassPathResource resource = new ClassPathResource(scriptPath);
        if (!resource.exists()) {
            logger.warn("脚本文件不存在: {}", scriptPath);
            return;
        }

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {

            List<String> statements = parseStatements(reader);

            for (String statement : statements) {
                if (statement.trim().isEmpty()) {
                    continue;
                }

                try {
                    jdbcTemplate.execute(statement);
                    logger.debug("执行 SQL: {}", statement.substring(0, Math.min(100, statement.length())));
                } catch (Exception e) {
                    // 忽略 "表已存在" 等错误
                    if (e.getMessage() != null &&
                        (e.getMessage().contains("already exists") ||
                         e.getMessage().contains("Duplicate"))) {
                        logger.debug("跳过已存在的对象: {}", e.getMessage());
                    } else {
                        logger.error("执行 SQL 失败: {}", statement, e);
                        throw e;
                    }
                }
            }

            logger.info("脚本执行完成: {}", scriptPath);
        }
    }

    /**
     * 解析 SQL 脚本,按分号分割语句
     * 支持多行语句和注释
     */
    private List<String> parseStatements(BufferedReader reader) throws Exception {
        List<String> statements = new ArrayList<>();
        StringBuilder currentStatement = new StringBuilder();
        String line;
        boolean inDelimiter = false;

        while ((line = reader.readLine()) != null) {
            line = line.trim();

            // 跳过空行和注释
            if (line.isEmpty() || line.startsWith("--")) {
                continue;
            }

            // 处理 DELIMITER 命令
            if (line.toUpperCase().startsWith("DELIMITER")) {
                inDelimiter = !inDelimiter;
                continue;
            }

            currentStatement.append(line).append("\n");

            // 检查语句结束
            if (!inDelimiter && line.endsWith(";")) {
                statements.add(currentStatement.toString());
                currentStatement = new StringBuilder();
            }
        }

        // 添加最后一个语句(如果有)
        if (currentStatement.length() > 0) {
            statements.add(currentStatement.toString());
        }

        return statements;
    }
}
