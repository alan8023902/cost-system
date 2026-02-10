package com.costsystem.modules.costform.repository;

import com.costsystem.modules.costform.entity.LineItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 明细行仓储
 * 严格遵循 cost-system-java 技能规则
 */
@Repository
public interface LineItemRepository extends JpaRepository<LineItem, Long> {

    List<LineItem> findByVersionIdAndModuleCodeOrderBySortNoAsc(Long versionId, String moduleCode);

    List<LineItem> findByVersionIdAndModuleCodeAndCategoryCodeOrderBySortNoAsc(
            Long versionId, String moduleCode, String categoryCode);

    List<LineItem> findByVersionId(Long versionId);
}
