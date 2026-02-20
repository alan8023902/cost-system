import { expect, Locator, Page, test } from '@playwright/test';

const APP_BASE = '/#/';

async function login(page: Page) {
  await page.goto(`${APP_BASE}login`);
  await expect(page.getByRole('heading', { name: '账号登录' })).toBeVisible();

  await page.getByPlaceholder('用户名 / 手机号 / 邮箱').fill('admin');
  await page.getByPlaceholder('请输入密码').fill('password');
  await page.getByRole('button', { name: '登录' }).click();

  await expect(page).toHaveURL(/#\/projects/);
  await expect(page.getByRole('heading', { name: '项目总览' })).toBeVisible();
}

async function clickIfVisible(locator: Locator) {
  if (await locator.count()) {
    const first = locator.first();
    if (await first.isVisible()) {
      await first.click();
      return true;
    }
  }
  return false;
}

test('前端页面功能按钮模拟测试（核心路径）', async ({ page }) => {
  const dialogs: string[] = [];
  page.on('dialog', async (dialog) => {
    dialogs.push(`${dialog.type()}:${dialog.message()}`);
    await dialog.accept();
  });

  // 1) 登录页：错误登录 + 正确登录
  await page.goto(`${APP_BASE}login`);
  await page.getByPlaceholder('用户名 / 手机号 / 邮箱').fill('admin');
  await page.getByPlaceholder('请输入密码').fill('wrong-password');
  await page.getByRole('button', { name: '登录' }).click();
  await expect(page.getByText('用户名或密码错误')).toBeVisible();

  await login(page);

  // 2) 项目列表：搜索、刷新、新建项目、进入详情
  await page.getByPlaceholder('搜索项目名称或编号...').fill('NO_MATCH_KEYWORD');
  await expect(page.getByText('暂无项目')).toBeVisible();
  await page.getByPlaceholder('搜索项目名称或编号...').fill('');

  await page.getByRole('button', { name: '刷新' }).click();

  const ts = Date.now();
  const projectCode = `E2E-${ts}`;
  const projectName = `E2E自动化项目-${ts}`;

  await page.getByRole('button', { name: '新建项目' }).click();
  await expect(page.getByRole('heading', { name: '新建项目' })).toBeVisible();
  await page.getByPlaceholder('例如: P-2026-001').fill(projectCode);
  await page.getByPlaceholder('请输入项目名称').fill(projectName);
  await page.getByRole('button', { name: '确认创建' }).click();

  await expect(page.getByText(projectName)).toBeVisible();
  await page.getByRole('row', { name: new RegExp(projectName) }).click();

  // 3) 项目详情：版本/成员/文件/审计 tab 与按钮
  await expect(page).toHaveURL(/#\/projects\/\d+/);
  await expect(page.getByText('项目编号:', { exact: false })).toBeVisible();

  await page.locator('main').getByRole('button', { name: '成员管理' }).click();
  await expect(page.getByRole('button', { name: '添加成员' })).toBeVisible();

  await page.locator('main').getByRole('button', { name: '文件中心' }).click();
  await expect(page.getByRole('button', { name: '打开最新版本文件中心' })).toBeVisible();

  await page.locator('main').getByRole('button', { name: '审计日志' }).click();
  await expect(page.getByRole('table')).toBeVisible();

  await page.locator('main').getByRole('button', { name: '版本列表' }).click();
  await page.getByRole('button', { name: '新建版本' }).click();

  // 4) 版本工作台：模块切换、明细增删改、保存/重算/提交/撤回/导出
  await expect(page).toHaveURL(/#\/versions\/\d+\/workbench/);

  await expect(page.getByRole('button', { name: '新增行' })).toBeVisible();
  await page.getByRole('button', { name: '新增行' }).click();


  await page.getByRole('button', { name: /保存/ }).click();
  await page.getByRole('button', { name: /重算指标/ }).click();

  const workbenchTabs = page.locator('main').locator('div.flex.gap-1.bg-slate-100.p-1.rounded-lg').first();
  await workbenchTabs.getByRole('button', { name: '分包' }).click();
  await workbenchTabs.getByRole('button', { name: '费用' }).click();
  await workbenchTabs.getByRole('button', { name: '指标' }).click();
  await expect(page.getByText('指标键')).toBeVisible();

  await workbenchTabs.getByRole('button', { name: '审批' }).click();
  await expect(page.getByText('请前往“我的待办”执行审批操作。')).toBeVisible();

  await workbenchTabs.getByRole('button', { name: '物资' }).click();
  await page.locator('main').getByRole('button', { name: '导出', exact: true }).click();

  const submitButton = page.locator('main').getByRole('button', { name: '提交审批' });
  if (await submitButton.isVisible()) {
    await submitButton.click();
  }
  const withdrawButton = page.locator('main').getByRole('button', { name: '撤回审批' });
  if (await withdrawButton.isVisible()) {
    await withdrawButton.click();
  }

  // 5) 文件中心：刷新、筛选、签章记录、详情/预览按钮
  await page.getByRole('button', { name: '文件中心' }).first().click();
  await expect(page).toHaveURL(/#\/versions\/\d+\/files/);
  await expect(page.getByRole('heading', { name: '文件中心' })).toBeVisible();

  await page.getByRole('button', { name: '刷新' }).click();
  await page.getByRole('button', { name: '签章记录' }).click();
  await page.getByRole('button', { name: '文件列表' }).click();

  await page.getByPlaceholder('搜索文件名/创建人').fill('e2e');
  await page.getByPlaceholder('搜索文件名/创建人').fill('');

  if (await clickIfVisible(page.getByRole('button', { name: '预览' }))) {
    await expect(
      page.locator('iframe[title="file-preview"], text=当前格式不支持在线预览，请下载查看。')
    ).toBeVisible();
    await page.locator('div.absolute.inset-0').first().click({ force: true });
  }

  await page.getByRole('button', { name: '签章记录' }).click();
  if (await clickIfVisible(page.getByRole('button', { name: '详情' }))) {
    await expect(page.getByText('签章记录详情')).toBeVisible();
    await page.locator('div.flex-1').first().click({ force: true });
  }

  // 6) 我的待办 + 全局导航按钮
  await page.getByRole('button', { name: '我的待办' }).first().click();
  await expect(page).toHaveURL(/#\/my-tasks/);
  await expect(page.getByRole('heading', { name: '我的待办' })).toBeVisible();

  await page.getByRole('button', { name: /待审批/ }).click();
  await page.getByRole('button', { name: /已处理/ }).click();

  if (await clickIfVisible(page.getByRole('button', { name: /通过/ }))) {
    await expect(page.getByText('审批通过')).toBeVisible();
    await page.getByRole('button', { name: '取消' }).click();
  }
  if (await clickIfVisible(page.getByRole('button', { name: /驳回/ }))) {
    await expect(page.getByText('审批驳回')).toBeVisible();
    await page.getByRole('button', { name: '取消' }).click();
  }

  await page.getByRole('button', { name: '模板管理' }).click();
  await expect(page.getByText('功能开发中', { exact: false })).toBeVisible();

  await page.getByRole('button', { name: '系统管理' }).click();
  await expect(page.getByText('功能开发中', { exact: false })).toBeVisible();

  await page.getByRole('button', { name: '审计中心' }).click();
  await expect(page.getByRole('heading', { name: '数据分析' })).toBeVisible();
  await page.getByRole('button', { name: '查看详细追溯' }).first().click();

  // 7) 退出登录按钮
  await page.getByRole('button', { name: '退出登录' }).click();
  await expect(page).toHaveURL(/#\/login/);

  // 确认流程中确实触发了若干弹窗（alert/confirm）按钮路径
  expect(dialogs.length).toBeGreaterThan(0);
});








