package com.costsystem.integration;

import com.costsystem.CostSystemApplication;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.core.type.filter.AnnotationTypeFilter;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

import java.lang.annotation.Annotation;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class MigrationSystemContinuityTest {

    private static final List<String> MODULES = List.of(
            "costauth",
            "costproject",
            "costtemplate",
            "costform",
            "costcalc",
            "costworkflow",
            "costfile",
            "costseal",
            "costaudit"
    );

    @Test
    void coreApplicationAnnotationsShouldRemain() {
        SpringBootApplication appAnnotation = CostSystemApplication.class.getAnnotation(SpringBootApplication.class);
        assertNotNull(appAnnotation, "CostSystemApplication 必须保留 @SpringBootApplication");
        assertTrue(Arrays.asList(appAnnotation.scanBasePackages()).contains("com.costsystem"),
                "SpringBootApplication 应扫描 com.costsystem 包");

        EnableJpaAuditing auditing = CostSystemApplication.class.getAnnotation(EnableJpaAuditing.class);
        assertNotNull(auditing, "CostSystemApplication 必须启用 @EnableJpaAuditing");
    }

    @Test
    void eachModuleShouldExposeControllersAndServices() {
        Map<String, Set<String>> controllerModules = scanModulesFor(RestController.class);
        Map<String, Set<String>> serviceModules = scanModulesFor(Service.class);

        for (String module : MODULES) {
            assertTrue(controllerModules.containsKey(module), "模块缺少 Controller: " + module);
            assertTrue(serviceModules.containsKey(module), "模块缺少 Service: " + module);
        }
    }

    @Test
    void coreConfigClassesShouldRemainAvailable() throws ClassNotFoundException {
        assertNotNull(Class.forName("com.costsystem.config.SecurityConfig"));
        assertNotNull(Class.forName("com.costsystem.config.DatabaseConfig"));
        assertNotNull(Class.forName("com.costsystem.config.SwaggerConfig"));
        assertNotNull(Class.forName("com.costsystem.config.WebMvcConfig"));
    }

    @Test
    void legacyCostControlPackageShouldNotExist() throws Exception {
        PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
        Resource[] legacy = resolver.getResources("classpath*:com/costcontrol/**/*.class");
        assertTrue(legacy.length == 0, "不应存在遗留 com.costcontrol 包类");
    }

    private Map<String, Set<String>> scanModulesFor(Class<? extends Annotation> annotation) {
        ClassPathScanningCandidateComponentProvider scanner = new ClassPathScanningCandidateComponentProvider(false);
        scanner.addIncludeFilter(new AnnotationTypeFilter(annotation));

        Map<String, Set<String>> modules = new HashMap<>();
        scanner.findCandidateComponents("com.costsystem.modules").forEach(definition -> {
            String className = definition.getBeanClassName();
            if (className == null) {
                return;
            }
            String module = extractModuleName(className);
            if (module == null) {
                return;
            }
            modules.computeIfAbsent(module, key -> new HashSet<>()).add(className);
        });

        return modules;
    }

    private String extractModuleName(String className) {
        String prefix = "com.costsystem.modules.";
        if (!className.startsWith(prefix)) {
            return null;
        }
        String remainder = className.substring(prefix.length());
        int dotIndex = remainder.indexOf('.');
        if (dotIndex < 0) {
            return null;
        }
        return remainder.substring(0, dotIndex);
    }
}
