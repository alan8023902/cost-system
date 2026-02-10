package com.costsystem.modules.costseal.repository;

import com.costsystem.modules.costseal.entity.SealRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * 签章记录仓储
 * 严格遵循 cost-system-java 技能规则
 */
@Repository
public interface SealRecordRepository extends JpaRepository<SealRecord, Long> {
}
