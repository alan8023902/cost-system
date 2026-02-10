package com.costsystem.modules.costform.repository;

import com.costsystem.modules.costform.entity.FormVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 表单版本仓储接口
 */
@Repository
public interface FormVersionRepository extends JpaRepository<FormVersion, Long> {
    
    List<FormVersion> findByProjectId(Long projectId);
    
    List<FormVersion> findByProjectIdOrderByVersionNoDesc(Long projectId);

    FormVersion findTopByProjectIdOrderByVersionNoDesc(Long projectId);
}
