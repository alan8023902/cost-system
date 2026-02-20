-- =====================================================
-- Flyway Migration V4: Workflow Definition
-- 工程成本计划与税务计控系统 - 审批流定义
-- =====================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `cost_workflow_definition` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '流程定义ID',
  `scope` ENUM('SYSTEM','PROJECT') NOT NULL COMMENT '流程范围',
  `project_id` BIGINT NULL COMMENT '项目ID（项目级流程）',
  `name` VARCHAR(200) NOT NULL COMMENT '流程名称',
  `definition_json` TEXT NOT NULL COMMENT '流程节点定义JSON',
  `enabled` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  INDEX `idx_cost_workflow_definition_scope` (`scope`),
  INDEX `idx_cost_workflow_definition_project` (`project_id`),
  INDEX `idx_cost_workflow_definition_enabled` (`enabled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工作流定义表';
