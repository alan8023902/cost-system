package com.costsystem.modules.costproject.dto;

import com.costsystem.modules.costform.dto.LineItemImportResult;
import com.costsystem.modules.costform.dto.VersionInfo;

/**
 * Excel导入创建项目结果
 */
public class ProjectImportResult {

    private ProjectInfo project;
    private VersionInfo version;
    private LineItemImportResult importResult;

    public ProjectImportResult() {
    }

    public ProjectImportResult(ProjectInfo project, VersionInfo version, LineItemImportResult importResult) {
        this.project = project;
        this.version = version;
        this.importResult = importResult;
    }

    public ProjectInfo getProject() {
        return project;
    }

    public void setProject(ProjectInfo project) {
        this.project = project;
    }

    public VersionInfo getVersion() {
        return version;
    }

    public void setVersion(VersionInfo version) {
        this.version = version;
    }

    public LineItemImportResult getImportResult() {
        return importResult;
    }

    public void setImportResult(LineItemImportResult importResult) {
        this.importResult = importResult;
    }
}
