ALTER TABLE `cost_user`
  ADD COLUMN `email` VARCHAR(128) NULL COMMENT '邮箱地址' AFTER `phone`;

CREATE UNIQUE INDEX `uk_cost_user_email` ON `cost_user` (`email`);

UPDATE `cost_user`
   SET `email` = CONCAT(`username`, '@cost-system.local')
 WHERE `email` IS NULL OR `email` = '';
