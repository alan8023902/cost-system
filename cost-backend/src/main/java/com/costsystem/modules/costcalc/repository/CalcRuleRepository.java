package com.costsystem.modules.costcalc.repository;

import com.costsystem.modules.costcalc.entity.CalcRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 计算规则仓储
 * 严格遵循 cost-system-java 技能规则
 */
@Repository
public interface CalcRuleRepository extends JpaRepository<CalcRule, Long> {

    List<CalcRule> findByTemplateIdAndEnabledOrderByOrderNoAscIdAsc(Long templateId, Boolean enabled);
}
