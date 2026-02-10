package com.costsystem.modules.costcalc.repository;

import com.costsystem.modules.costcalc.entity.IndicatorValue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 指标值仓储
 * 严格遵循 cost-system-java 技能规则
 */
@Repository
public interface IndicatorValueRepository extends JpaRepository<IndicatorValue, Long> {

    List<IndicatorValue> findByVersionIdOrderByIndicatorKeyAsc(Long versionId);

    Optional<IndicatorValue> findByVersionIdAndIndicatorKey(Long versionId, String indicatorKey);

    void deleteByVersionIdAndIndicatorKeyNotIn(Long versionId, List<String> indicatorKeys);
}
