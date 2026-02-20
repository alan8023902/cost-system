package com.costsystem.integration;

import com.costsystem.CostSystemApplication;
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.config.YamlPropertiesFactoryBean;
import org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.core.type.filter.AnnotationTypeFilter;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Properties;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertTrue;



class ConfigurationManagementConsistencyTest {

    @Test
    void configurationClassesShouldBeCentralizedOrModuleSpecific() {
        ClassPathScanningCandidateComponentProvider scanner = new ClassPathScanningCandidateComponentProvider(false);
        scanner.addIncludeFilter(new AnnotationTypeFilter(Configuration.class));

        List<String> invalidConfigs = new ArrayList<>();
        scanner.findCandidateComponents("com.costsystem").forEach(definition -> {
            String className = definition.getBeanClassName();
            if (className == null) {
                return;
            }
            if ("com.costsystem.CostSystemApplication".equals(className)) {
                return;
            }
            boolean centralized = className.startsWith("com.costsystem.config.");
            boolean moduleSpecific = className.matches("com\\.costsystem\\.modules\\.[^.]+\\.config\\..+");
            if (!centralized && !moduleSpecific) {
                invalidConfigs.add(className);
            }

        });

        assertTrue(invalidConfigs.isEmpty(), "配置类应集中在com.costsystem.config或模块config包，发现: " + invalidConfigs);
    }

    @Test
    void environmentSpecificConfigurationsShouldExist() {
        PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
        Resource baseConfig = resolver.getResource("classpath:application.yml");
        Resource devConfig = resolver.getResource("classpath:application-dev.yml");

        assertTrue(baseConfig.exists(), "application.yml 应存在于资源目录");
        assertTrue(devConfig.exists(), "application-dev.yml 应存在于资源目录");

        assertTrue(hasApplicationName(baseConfig), "application.yml 必须包含 spring.application.name");
        assertTrue(hasApplicationName(devConfig), "application-dev.yml 必须包含 spring.application.name");
    }

    @Test
    void deploymentArtifactsShouldRemainConsistent() throws IOException {
        Path pomPath = Paths.get("pom.xml");
        assertTrue(Files.exists(pomPath), "pom.xml 应存在于后端模块根目录");
        String pomContent = Files.readString(pomPath);
        assertTrue(pomContent.contains("spring-boot-maven-plugin"), "pom.xml 必须保留 spring-boot-maven-plugin");
        assertTrue(pomContent.contains("flyway-maven-plugin"), "pom.xml 必须保留 flyway-maven-plugin");
    }

    @Test
    void springBootStartupEntryShouldExist() {
        assertDoesNotThrow(() -> CostSystemApplication.class.getDeclaredMethod("main", String[].class),
                "CostSystemApplication 必须保留 main 方法用于启动");
    }

    private boolean hasApplicationName(Resource resource) {
        YamlPropertiesFactoryBean factoryBean = new YamlPropertiesFactoryBean();
        factoryBean.setResources(resource);
        Properties properties = factoryBean.getObject();
        if (properties == null) {
            return false;
        }
        return Objects.nonNull(properties.getProperty("spring.application.name"));
    }
}

