package com.costsystem.modules.costtemplate.repository;

import com.costsystem.modules.costtemplate.entity.Template;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 模板仓储
 * 严格遵循 cost-system-java 技能规则
 */
@Repository
public interface TemplateRepository extends JpaRepository<Template, Long> {

    Optional<Template> findTopByStatusOrderByIdAsc(Template.TemplateStatus status);

    List<Template> findByStatusOrderByUpdatedAtDesc(Template.TemplateStatus status);

    List<Template> findAllByOrderByUpdatedAtDesc();
}
