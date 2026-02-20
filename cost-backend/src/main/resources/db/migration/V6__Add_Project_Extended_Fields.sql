-- 为 cost_project 表添加新字段
ALTER TABLE cost_project
ADD COLUMN IF NOT EXISTS description VARCHAR(1000) COMMENT '项目描述',
ADD COLUMN IF NOT EXISTS tag_color VARCHAR(20) DEFAULT 'blue' COMMENT '标签颜色',
ADD COLUMN IF NOT EXISTS cover_url VARCHAR(500) COMMENT '封面图片URL';
