# 建材成本管理系统 - UI 设计系统

## 设计理念

### 商务简洁风格
- **信息密度适中**: 平衡数据展示与视觉舒适度
- **图谱可视化**: 使用图表和数据可视化增强信息传达
- **细微动效**: 精致的过渡动画提升交互体验
- **高级灰与品牌蓝**: 专业的配色方案

## 色彩系统

### 品牌色 (Brand Blue)
```
brand-50:  #eff6ff  // 浅背景
brand-100: #dbeafe  // 悬停背景
brand-200: #bfdbfe  // 边框
brand-300: #93c5fd  // 辅助
brand-400: #60a5fa  // 次要
brand-500: #3b82f6  // 主要
brand-600: #2563eb  // 主按钮
brand-700: #1d4ed8  // 深色
brand-800: #1e40af  // 更深
brand-900: #1e3a8a  // 最深
```

### 中性灰 (Neutral Gray)
```
neutral-50:  #fafafa  // 页面背景
neutral-100: #f5f5f5  // 卡片背景
neutral-200: #e5e5e5  // 边框
neutral-300: #d4d4d4  // 分隔线
neutral-400: #a3a3a3  // 禁用文本
neutral-500: #737373  // 次要文本
neutral-600: #525252  // 标签文本
neutral-700: #404040  // 正文
neutral-800: #262626  // 标题
neutral-900: #171717  // 主标题
```

### 语义色
- **成功**: emerald-50 ~ emerald-700
- **警告**: amber-50 ~ amber-700
- **错误**: red-50 ~ red-700
- **信息**: brand-50 ~ brand-700

## 排版系统

### 字体家族
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI',
             'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei',
             'Helvetica Neue', Arial, sans-serif;
```

### 字号规范
- **大标题**: text-2xl (24px) - 页面主标题
- **标题**: text-lg (18px) - 区块标题
- **正文**: text-sm (14px) - 主要内容
- **辅助**: text-xs (12px) - 标签、说明

### 字重
- **Bold (700)**: 主标题、数据值
- **Semibold (600)**: 次级标题、标签
- **Medium (500)**: 强调文本
- **Regular (400)**: 正文

## 组件规范

### 卡片 (Card)
```tsx
// 基础卡片
<div className="ui-card">
  {/* 内容 */}
</div>

// 可交互卡片
<div className="ui-card-hover">
  {/* 内容 */}
</div>
```

**特性**:
- 白色背景
- 1px 中性灰边框
- 8px 圆角
- 柔和阴影
- 悬停时边框变为品牌色

### 按钮 (Button)
```tsx
// 主按钮
<button className="ui-btn ui-btn-primary">
  确认
</button>

// 次要按钮
<button className="ui-btn ui-btn-default">
  取消
</button>

// 幽灵按钮
<button className="ui-btn ui-btn-ghost">
  更多
</button>

// 危险按钮
<button className="ui-btn ui-btn-danger">
  删除
</button>
```

**规格**:
- 高度: 36px (h-9)
- 内边距: 16px (px-4)
- 圆角: 8px (rounded-lg)
- 过渡: 200ms

### 表单元素

#### 输入框
```tsx
<div>
  <label className="ui-label">标签</label>
  <input className="ui-input" placeholder="请输入" />
</div>
```

#### 选择框
```tsx
<select className="ui-select">
  <option>选项1</option>
</select>
```

#### 文本域
```tsx
<textarea className="ui-textarea" rows={4} />
```

### 表格 (Table)
```tsx
<div className="ui-table-container">
  <table className="ui-table">
    <thead>
      <tr>
        <th>列标题</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>单元格</td>
      </tr>
    </tbody>
  </table>
</div>
```

**特性**:
- 表头: 中性灰背景 + 大写字母 + 加粗
- 行高: 44px (h-11)
- 悬停: 品牌色浅背景
- 边框: 细线分隔

### 徽章 (Badge)
```tsx
<span className="ui-badge ui-badge-blue">进行中</span>
<span className="ui-badge ui-badge-green">已完成</span>
<span className="ui-badge ui-badge-amber">待审批</span>
<span className="ui-badge ui-badge-red">已拒绝</span>
<span className="ui-badge ui-badge-gray">已归档</span>
```

### 统计卡片 (Stat Card)
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
    { value: 22 }
  ]}
  chartType="area"
/>
```

### 迷你图表 (Mini Chart)
```tsx
<MiniChart
  data={chartData}
  type="line" // 'line' | 'bar' | 'area'
  color="blue" // 'blue' | 'green' | 'amber' | 'red' | 'gray'
  height={48}
  showTrend={true}
/>
```

## 动画系统

### 淡入动画
```css
animate-fade-in      // 300ms 淡入
animate-fade-in-up   // 400ms 淡入上移
```

### 滑入动画
```css
animate-slide-in-right  // 300ms 从右滑入
```

### 缩放动画
```css
animate-scale-in     // 200ms 缩放淡入
```

### 脉冲动画
```css
animate-pulse-subtle // 2s 循环脉冲
```

## 阴影系统

```css
shadow-soft      // 0 2px 8px rgba(0,0,0,0.04)
shadow-soft-lg   // 0 4px 16px rgba(0,0,0,0.06)
shadow-brand     // 0 4px 12px rgba(37,99,235,0.15)
```

## 间距规范

### 组件间距
- **紧凑**: gap-2 (8px)
- **标准**: gap-4 (16px)
- **宽松**: gap-6 (24px)

### 内边距
- **小**: p-4 (16px)
- **中**: p-5 (20px)
- **大**: p-6 (24px)
- **特大**: p-8 (32px)

## 响应式设计

### 断点
```
sm:  640px   // 小屏幕
md:  768px   // 中等屏幕
lg:  1024px  // 大屏幕
xl:  1280px  // 超大屏幕
```

### 网格系统
```tsx
// 响应式网格
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* 卡片 */}
</div>
```

## 交互规范

### 悬停效果
- **卡片**: 边框变色 + 阴影加深
- **按钮**: 背景加深 + 阴影增强
- **表格行**: 浅色背景高亮
- **链接**: 颜色加深

### 过渡时长
- **快速**: 150ms - 小元素、颜色变化
- **标准**: 200ms - 按钮、输入框
- **缓慢**: 300ms - 卡片、模态框

### 缓动函数
- **ease-out**: 淡入、滑入动画
- **ease-in-out**: 悬停、状态切换

## 图标系统

使用 **lucide-react** 图标库

### 常用图标
- **导航**: Home, FolderKanban, ClipboardList, Bell
- **操作**: Plus, Edit, Trash2, Download, Upload
- **状态**: CheckCircle2, XCircle, AlertCircle, Info
- **箭头**: ChevronRight, ChevronDown, ArrowLeft, ArrowRight
- **趋势**: TrendingUp, TrendingDown

### 尺寸规范
- **小**: 14px - 表格、徽章
- **标准**: 16px - 按钮、输入框
- **中**: 18px - 标题
- **大**: 20px - 通知、头像
- **特大**: 24px - 卡片图标

## 最佳实践

### 1. 保持一致性
- 使用预定义的 UI 类名
- 遵循色彩和间距规范
- 统一动画时长和缓动

### 2. 注重性能
- 避免过度动画
- 使用 CSS 过渡而非 JS 动画
- 优化图表渲染

### 3. 可访问性
- 保持足够的颜色对比度
- 提供键盘导航支持
- 使用语义化 HTML

### 4. 响应式优先
- 移动端优先设计
- 使用弹性布局
- 测试多种屏幕尺寸

## 示例页面

### 仪表盘
- 统计卡片网格
- 数据可视化图表
- 快捷入口卡片
- 最近项目列表

### 列表页
- 搜索和筛选栏
- 数据表格
- 分页控件
- 批量操作

### 详情页
- 面包屑导航
- 标签页切换
- 信息卡片
- 操作按钮组

### 表单页
- 分组表单
- 验证提示
- 提交按钮
- 取消/返回链接
