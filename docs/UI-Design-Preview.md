# UI/UX 设计预览

## 色彩对比

### 之前 (Slate 系列)
```
背景: slate-50  (#f8fafc)
卡片: white + slate-200 边框
按钮: blue-600 (#2563eb)
文本: slate-900 (#0f172a)
```

### 现在 (Neutral + Brand 系列)
```
背景: 渐变 (neutral-50 → white → neutral-100)
卡片: white + neutral-200 边框 + 柔和阴影
按钮: brand-600 (#2563eb) + 品牌阴影
文本: neutral-900 (#171717)
```

## 组件对比

### 按钮
**之前**:
```tsx
<button className="bg-blue-600 text-white hover:bg-blue-700
                   rounded px-3 h-8 text-sm shadow-sm">
  确认
</button>
```

**现在**:
```tsx
<button className="ui-btn ui-btn-primary">
  确认
</button>

// 编译后:
// bg-brand-600 text-white hover:bg-brand-700
// rounded-lg px-4 h-9 text-sm shadow-soft hover:shadow-brand
// transition-all duration-200
```

### 卡片
**之前**:
```tsx
<div className="bg-white border border-slate-200 rounded-md shadow-sm">
  内容
</div>
```

**现在**:
```tsx
<div className="ui-card-hover">
  内容
</div>

// 编译后:
// bg-white border border-neutral-200 rounded-lg shadow-soft
// transition-all duration-300 hover:shadow-soft-lg hover:border-brand-300
```

### 表格
**之前**:
```tsx
<table className="ui-table">
  <thead>
    <tr>
      <th className="h-9 px-3 bg-slate-50 border-b border-slate-200
                     font-semibold text-slate-600">
        列标题
      </th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td className="h-9 px-3 border-b border-slate-100 text-slate-700">
        数据
      </td>
    </tr>
  </tbody>
</table>
```

**现在**:
```tsx
<table className="ui-table">
  <thead>
    <tr>
      <th className="h-10 px-4 bg-neutral-50 border-b border-neutral-200
                     font-semibold text-neutral-700 text-xs uppercase
                     tracking-wider">
        列标题
      </th>
    </tr>
  </thead>
  <tbody>
    <tr className="hover:bg-brand-50/30">
      <td className="h-11 px-4 border-b border-neutral-100 text-neutral-800
                     transition-colors duration-150">
        数据
      </td>
    </tr>
  </tbody>
</table>
```

## 新增组件

### StatCard (统计卡片)
```tsx
<StatCard
  label="项目总数"
  value={28}
  change={8.2}
  changeLabel="较上月"
  icon={FolderKanban}
  iconColor="blue"
  chartData={[
    { value: 12 },
    { value: 19 },
    { value: 15 },
    { value: 22 },
    { value: 18 },
    { value: 25 },
    { value: 28 }
  ]}
  chartType="area"
/>
```

**渲染效果**:
```
┌─────────────────────────────────┐
│ 项目总数              [图标]    │
│ 28                              │
│ +8.2% 较上月                    │
│ ─────────────────────────────── │
│     ╱╲    ╱╲                    │
│   ╱    ╲╱    ╲╱╲                │
│ ╱                ╲              │
└─────────────────────────────────┘
```

### MiniChart (迷你图表)
```tsx
<MiniChart
  data={[
    { value: 12 },
    { value: 19 },
    { value: 15 },
    { value: 22 }
  ]}
  type="area"
  color="blue"
  height={48}
  showTrend={true}
/>
```

**支持类型**:
- `line`: 折线图
- `bar`: 柱状图
- `area`: 面积图

## 页面布局对比

### SystemDashboard (系统总览)

**之前**:
```
┌─────────────────────────────────────┐
│ 关键指标                            │
├─────────────────────────────────────┤
│ 指标      │ 数值  │ 说明            │
│ 项目总数  │ 28    │ 系统内全部项目  │
│ 进行中    │ 15    │ 当前执行中      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 项目概览                            │
├─────────────────────────────────────┤
│ 项目名称 │ 编号 │ 负责人 │ 状态   │
│ 项目A    │ P001 │ 张三   │ 进行中 │
└─────────────────────────────────────┘
```

**现在**:
```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ 项目总数 │ │ 进行中   │ │ 待审批   │ │ 累计预算 │
│   28     │ │   15     │ │    3     │ │  ¥125万  │
│ +8.2% ↑  │ │ +12.5% ↑ │ │ -5.3% ↓  │ │ +15.8% ↑ │
│ ╱╲  ╱╲   │ │  ╱╲ ╱╲   │ │  ▂▃▅▃▂   │ │  ╱╲  ╱╲  │
└──────────┘ └──────────┘ └──────────┘ └──────────┘

┌─────────────────────────────────────────────────┐
│ 项目状态分布                                    │
├─────────────────────────────────────────────────┤
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐       │
│  │  15  │  │  8   │  │  5   │  │  12  │       │
│  │进行中│  │已完成│  │已归档│  │可用模板│     │
│  └──────┘  └──────┘  └──────┘  └──────┘       │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 最近项目                                        │
├─────────────────────────────────────────────────┤
│ 项目名称 │ 编号 │ 负责人 │ 日期 │ 状态 │ 预算 │
│ 项目A    │ P001 │ 张三   │ 1/15 │ 进行中│ ¥50万│
└─────────────────────────────────────────────────┘

┌──────────┐ ┌──────────┐ ┌──────────┐
│ [图标]   │ │ [图标]   │ │ [图标]   │
│ 项目管理 │ │ 模板管理 │ │ 审批待办 │
│ 查看和管理│ │ 维护模板 │ │ 处理审批 │
│ 所有项目 │ │ 与标准   │ │ 任务流程 │
└──────────┘ └──────────┘ └──────────┘
```

## 动画效果

### 页面加载
```
淡入上移 (animate-fade-in-up)
- 持续时间: 400ms
- 缓动: ease-out
- 效果: 内容从下方 10px 淡入
```

### 卡片悬停
```
边框颜色: neutral-200 → brand-300
阴影: shadow-soft → shadow-soft-lg
过渡: 300ms ease-out
```

### 按钮点击
```
背景: brand-600 → brand-700
阴影: shadow-soft → shadow-brand
过渡: 200ms ease-out
```

### 通知图标
```
脉冲动画 (animate-pulse-subtle)
- 持续时间: 2s
- 循环: 无限
- 效果: 透明度 1 → 0.8 → 1
```

## 响应式布局

### 移动端 (< 640px)
```
统计卡片: 1 列
快捷入口: 1 列
表格: 横向滚动
侧边栏: 抽屉式
```

### 平板 (640px - 1024px)
```
统计卡片: 2 列
快捷入口: 2 列
表格: 完整显示
侧边栏: 固定显示
```

### 桌面 (> 1024px)
```
统计卡片: 4 列
快捷入口: 3 列
表格: 完整显示
侧边栏: 固定显示
最大宽度: 1280px (max-w-7xl)
```

## 可访问性改进

### 颜色对比度
- 文本/背景: 4.5:1 (WCAG AA)
- 大文本/背景: 3:1 (WCAG AA)
- 品牌蓝/白色: 4.8:1 ✓

### 键盘导航
- Tab 键顺序合理
- 焦点状态清晰 (ring-2)
- 跳过链接支持

### 屏幕阅读器
- 语义化 HTML
- ARIA 标签
- 替代文本

## 性能指标

### 首次内容绘制 (FCP)
- 目标: < 1.8s
- 优化: CSS 按需加载

### 最大内容绘制 (LCP)
- 目标: < 2.5s
- 优化: 图片懒加载

### 累积布局偏移 (CLS)
- 目标: < 0.1
- 优化: 固定尺寸容器

### 首次输入延迟 (FID)
- 目标: < 100ms
- 优化: 代码分割

## 浏览器支持

✅ Chrome 90+
✅ Firefox 88+
✅ Safari 14+
✅ Edge 90+
⚠️ IE 11 (不支持)

## 总结

通过这次 UI/UX 优化,我们实现了:

1. **更专业的视觉风格**: 高级灰 + 品牌蓝配色
2. **更好的信息层次**: 统计卡片 + 数据可视化
3. **更流畅的交互体验**: 细微动效 + 过渡动画
4. **更强的数据展示**: 迷你图表 + 趋势指示
5. **更完善的响应式**: 移动端优先设计
6. **更规范的组件系统**: 40+ 预定义 UI 类

整体提升了系统的专业度和用户体验。
