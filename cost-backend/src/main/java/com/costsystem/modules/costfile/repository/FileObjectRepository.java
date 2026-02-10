package com.costsystem.modules.costfile.repository;

import com.costsystem.modules.costfile.entity.FileObject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 文件对象仓储
 * 严格遵循 cost-system-java 技能规则
 */
@Repository
public interface FileObjectRepository extends JpaRepository<FileObject, Long> {

    List<FileObject> findByVersionIdOrderByCreatedAtDesc(Long versionId);

    Optional<FileObject> findTopByVersionIdAndFileTypeOrderByCreatedAtDesc(Long versionId, String fileType);
}
