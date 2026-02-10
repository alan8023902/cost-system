package com.costsystem.modules.costform.dto;

import java.util.ArrayList;
import java.util.List;

/**
 * Excel导入结果
 * 严格遵循 cost-system-java 技能规则
 */
public class LineItemImportResult {

    private int successCount;
    private int errorCount;
    private List<ImportError> errors = new ArrayList<>();

    public int getSuccessCount() {
        return successCount;
    }

    public void setSuccessCount(int successCount) {
        this.successCount = successCount;
    }

    public int getErrorCount() {
        return errorCount;
    }

    public void setErrorCount(int errorCount) {
        this.errorCount = errorCount;
    }

    public List<ImportError> getErrors() {
        return errors;
    }

    public void setErrors(List<ImportError> errors) {
        this.errors = errors;
    }

    public void addError(int row, String message) {
        this.errors.add(new ImportError(row, message));
        this.errorCount = this.errors.size();
    }

    public static class ImportError {
        private int row;
        private String message;

        public ImportError() {}

        public ImportError(int row, String message) {
            this.row = row;
            this.message = message;
        }

        public int getRow() {
            return row;
        }

        public void setRow(int row) {
            this.row = row;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }
    }
}
