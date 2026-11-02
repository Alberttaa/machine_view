# 智能选片系统 · 前端

机器视觉课程项目「智能选片系统（Smart Photo Selector）」的前端实现，按《智能选片系统前端设计文档 V1.0》落地。

**核心链路**：上传同场景多张照片 → 配置任务参数 → 后端异步处理（候选生成 / 预处理 / 质量筛查 / 美学评分 / 置信度评估 / 条件偏好比较 / 结果解释）→ 展示最佳照片与推荐理由 → 用户反馈（接受 / 更换 / 手动指定）。

> 当前默认使用 **Mock 数据**（`VITE_USE_MOCK=true`），无需后端即可完整演示全流程；页面右上角始终显示「演示数据」标识，避免把模拟数据当成算法结果。

## 快速开始

```bash
npm install
npm run dev      # http://localhost:5174
```

```bash
npm run build        # 类型检查 + 生产构建，产物在 dist/
npm run preview      # 本地预览构建产物
npm run type-check   # 仅类型检查
```

## 演示路径（约 1 分钟）

1. **开始选片**：点「载入示例照片组」（8 张同场景照片）→ 观察参数区（场景 / 裁剪 / 偏好 / 结果展示）→ 点「开始智能选片」
2. **任务处理**：进度环 + 7 阶段步骤条，注意「偏好比较」标注了条件执行
3. **选片结果**：最佳照片大图、推荐理由、维度评分、候选网格、已筛除折叠区
4. **反馈**：点任意候选卡片切换选择 → 选原因 → 提交；成功后可去「我的偏好」看到新记录
5. **异常演示**：回到开始选片，把「演示场景」切到「全部照片不理想」或「任务执行失败」

## 技术栈

React 18 + TypeScript + Vite 5 + React Router 6 + Ant Design 5 + Zustand + ECharts + Axios
路由使用 hash 模式，构建产物可直接双击打开或部署到任意静态子路径。

## 目录结构

```
smart-selector/
├─ public/images/                 示例照片（8 张原图 + 1 张裁剪候选）
├─ docs/
│  ├─ api-mapping.md              前后端接口对接说明（逐接口字段）
│  ├─ test-record.md              主要功能测试记录
│  └─ screenshots/                核心页面截图
├─ src/
│  ├─ components/
│  │  ├─ AppHeader/               顶部状态栏（页面名 / 数据模式 / 用户）
│  │  ├─ AppSidebar/              左侧导航
│  │  ├─ ImageUploader/           拖拽上传 + 缩略图列表 + 校验
│  │  ├─ ImageCard/               候选项卡片（排名 / 评分 / 类型 / 状态）
│  │  ├─ ImagePreview/            大图预览（比例保持 / 失败占位 / 点击放大）
│  │  ├─ ProcessStepper/          7 阶段步骤条（含跳过态）
│  │  ├─ ProgressPanel/           进度环 + 统计 + 异常提示
│  │  ├─ ScorePanel/              维度评分（只渲染后端返回维度）
│  │  ├─ FeedbackPanel/           接受 / 更换 / 手动指定 + 原因
│  │  └─ Chart/                   ECharts 封装
│  ├─ layouts/MainLayout.tsx      侧栏 + 顶栏 + 内容区
│  ├─ pages/
│  │  ├─ Upload/                  开始选片（P0）
│  │  ├─ Processing/              任务处理（P0）
│  │  ├─ Result/                  选片结果（P0，核心页面）
│  │  ├─ CandidateDetail/         候选照片详情（P1）
│  │  ├─ History/                 历史任务（P1）
│  │  ├─ Preferences/             我的偏好（P1）
│  │  ├─ Evaluation/              模型评估（P2）
│  │  └─ Settings/                系统设置（P2）
│  ├─ router/index.tsx            路由表（页面懒加载）
│  ├─ services/
│  │  ├─ request.ts               axios 实例 + Mock/真实切换
│  │  ├─ task.ts                  创建任务 / 查询状态 / 历史
│  │  ├─ result.ts                结果 / 候选详情
│  │  ├─ feedback.ts              提交反馈 / 偏好
│  │  ├─ evaluation.ts            评估指标
│  │  └─ mock/                    本地 Mock 服务（任务队列 + 进度模拟）
│  ├─ stores/taskStore.ts         当前任务与选择状态
│  ├─ stores/userStore.ts         历史 / 偏好 / 评估
│  ├─ types/                      与后端共享的数据结构（snake_case）
│  └─ utils/                      图片校验、格式化、状态文案
├─ .env.example
└─ vite.config.ts
```

## 接入真实后端

1. 后端按 `docs/api-mapping.md` 实现 `/api/tasks` 等 8 个接口
2. 复制 `.env.example` 为 `.env`，设置 `VITE_USE_MOCK=false`，必要时改 `VITE_API_BASE`
3. 本地开发时 `vite.config.ts` 已把 `/api` 代理到 `http://127.0.0.1:8000`
4. 若后端字段不同，**只改 `src/services/*` 与 `src/types/*`**，页面无需改动

## 设计约定（与设计文档保持一致）

- **前端不代替算法**：不计算评分、置信度、偏好结果，只渲染后端返回值；维度名也不预设
- **原图与裁剪图关联**：`candidate_type` + `source_image_id` + `crop_box`，详情页支持并排对比
- **条件模块**：`preference_triggered=false` 时步骤条显示"已跳过"，不伪装成必然执行
- **异常不造假**：`all_poor` / `failed` 不输出推荐，给出明确提示与重试入口
- **数据诚实**：Mock 模式全程标注「演示数据」；模型评估页无实测数据时不画虚构曲线

## 验收对照

| 设计文档验收项 | 实现位置 |
|---|---|
| 1 图片上传 | `Upload` + `ImageUploader` |
| 2 图片管理（删除 / 重选） | `ImageUploader`（单张删除、清空全部） |
| 3 任务创建 | `taskStore.startTask` → `POST /api/tasks` |
| 4 任务处理展示 | `Processing` + `ProgressPanel` + `ProcessStepper` |
| 5 条件流程 | 步骤条跳过态 + 结果页「偏好比较环节」 |
| 6 结果与理由 | `Result` 最佳照片区 + 推荐理由区 |
| 7 候选浏览 | `Result` 候选网格 + `CandidateDetail` |
| 8 用户反馈 | `FeedbackPanel`（accept / override / manual_select） |
| 9 异常处理 | all_poor、failed、图片加载失败占位、上传校验 |
| 10 页面适配 | `object-fit: contain` + 响应式断点（1080 / 760） |
