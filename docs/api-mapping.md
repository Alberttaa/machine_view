# 前后端接口对接说明

本文档对应设计文档《智能选片系统前端设计文档》第六章「前后端接口设计」，说明**前端每个 service 方法对应哪个接口、传什么、期望返回什么**。

- 全部接口以 `/api` 为前缀（`VITE_API_BASE`），本地开发由 `vite.config.ts` 代理到 `http://127.0.0.1:8000`
- 字段命名统一 **snake_case**，与 `src/types/*` 完全一致，后端返回结构直接落到页面，前端不做二次计算
- 切换方式：`.env` 中 `VITE_USE_MOCK=false` → `src/services/request.ts` 从 Mock 分发切到 axios 真实请求，**页面代码零改动**

## 1. 接口总览

| # | 方法 | 路径 | 前端方法 | Mock | 用途 |
|---|---|---|---|---|---|
| 一 | POST | `/api/tasks` | `services/task.ts → createTask` | ✅ | 创建选片任务（含图片上传与参数） |
| 二 | GET | `/api/tasks/{task_id}` | `services/task.ts → getTaskStatus` | ✅ | 查询任务状态（前端 800ms 轮询） |
| 三 | GET | `/api/tasks/{task_id}/results` | `services/result.ts → getTaskResults` | ✅ | 获取选片结果 |
| 四 | GET | `/api/tasks/{task_id}/candidates/{candidate_id}` | `services/result.ts → getCandidateDetail` | ✅ | 候选照片详情 |
| 五 | POST | `/api/tasks/{task_id}/feedback` | `services/feedback.ts → submitFeedback` | ✅ | 提交用户反馈 |
| 六 | GET | `/api/history` | `services/task.ts → getHistory` | ✅ | 历史任务列表 |
| 七 | GET | `/api/preferences` | `services/feedback.ts → getPreferences` | ✅ | 用户偏好与反馈记录 |
| 八 | GET | `/api/evaluation` | `services/evaluation.ts → getEvaluation` | ✅ | 模型评估指标 |

## 2. 关键接口字段

### 2.1 创建任务 `POST /api/tasks`

请求：`multipart/form-data`

| 字段 | 类型 | 说明 |
|---|---|---|
| `images` | file[] | 原始照片（多张） |
| `scene_type` | string | `auto` / `portrait` / `landscape` / `other` |
| `enable_crop` | string bool | 是否生成裁剪候选 |
| `enable_preference` | string bool | 是否启用个性化偏好 |
| `display_mode` | string | `full` / `best_only` |

响应：`{ "task_id": "task_001", "status": "pending", "message": "任务创建成功" }`

### 2.2 查询状态 `GET /api/tasks/{task_id}`

```json
{
  "task_id": "task_001",
  "status": "scoring",
  "progress": 62,
  "current_stage": "美学评分：候选图片打分与排序",
  "processed_count": 5,
  "total_count": 8,
  "preference_triggered": true,
  "message": "…",
  "error": "仅失败时返回"
}
```

`status` 取值与前端步骤条映射：

| status | 前端展示 | 步骤条 |
|---|---|---|
| `pending` | 等待处理 | 未开始 |
| `cropping` | 候选图片生成中 | 第 1 步 process |
| `preprocessing` | 图片预处理中 | 第 2 步 |
| `quality` | 图片质量筛查中 | 第 3 步 |
| `scoring` | 美学评分中 | 第 4 步 |
| `confidence` | 置信度评估中 | 第 5 步 |
| `preference` | 偏好比较中 | 第 6 步（`preference_triggered=false` 时显示"已跳过"） |
| `explaining` | 生成推荐理由中 | 第 7 步 |
| `completed` | 处理完成 | 全部完成，前端跳转结果页 |
| `all_poor` | 照片质量不理想 | 质量筛查步标红 + 提示，不跳转结果页 |
| `failed` | 处理失败 | 当前阶段标红 + `error` 文案 |

> 设计文档允许"具体状态名称根据后端实际实现调整"。若后端没有 `confidence` 阶段，前端把该状态去掉即可（`TaskStatus` 与 `STATUS_INDEX`、`TASK_STATUS_TEXT` 三处）。

### 2.3 获取结果 `GET /api/tasks/{task_id}/results`

```json
{
  "task_id": "task_001",
  "status": "completed",
  "best_candidate_id": "candidate_002",
  "explanation": "该照片与第二名评分接近（89.1），经偏好比较后确定为最优结果…",
  "explanation_points": ["综合评分 89.1，位列第一", "构图更集中…"],
  "confidence": 0.42,
  "preference_skipped": false,
  "candidates": [
    {
      "candidate_id": "candidate_002",
      "source_image_id": "image_001",
      "image_url": "/static/task_001/candidate_002.jpg",
      "candidate_type": "crop",
      "crop_box": [96, 38, 768, 563],
      "quality_status": "passed",
      "aesthetic_scores": { "构图": 0.92, "色彩": 0.88, "光影": 0.90, "清晰度": 0.87, "主体": 0.88 },
      "total_score": 0.891,
      "rank": 1
    }
  ]
}
```

前端约定：

- `total_score` 与 `aesthetic_scores` 统一 **0–1**，页面按 0–100 展示（`formatScore`）
- `aesthetic_scores` 的 **key 即维度名**，前端按后端返回的 key 动态渲染，不写死"构图/色彩/光影"
- `quality_status = rejected` 的候选不进候选网格，折叠进「已筛除照片」，原因取 `quality_info.reason`
- `explanation` 为 `null` 时，结果页显示"后端未返回推荐理由"，**前端不编造理由**
- `best_candidate_id = null` 或 `status = all_poor` → 结果页走"未生成推荐"分支

### 2.4 候选详情 `GET /api/tasks/{task_id}/candidates/{candidate_id}`

在 2.3 的候选字段基础上，额外返回：

```json
{
  "source_image": { "image_id": "image_001", "file_name": "IMG_8102.jpg", "image_url": "…", "width": 960, "height": 640, "file_size": 42969 },
  "source_image_url": "…",
  "in_preference": true
}
```

`candidate_type = crop` 时，详情页展示「原图 / 裁剪图」并排对比。

### 2.5 提交反馈 `POST /api/tasks/{task_id}/feedback`

```json
{
  "recommended_id": "candidate_002",
  "selected_id": "candidate_004",
  "feedback_type": "override",
  "reason": "光线和色彩更好"
}
```

- `feedback_type`：`accept`（接受推荐）/ `override`（更换推荐）/ `manual_select`（手动指定）
- `reason` 取自结果页下拉选项，可选
- 前端只提交，不本地修改偏好记忆库

## 3. 前端依赖但设计文档未明确的两处

| 需求 | 前端处理 | 建议后端补充 |
|---|---|---|
| 结果页「已跳过偏好比较」的说明 | 用 `preference_skipped` + `confidence` 展示 | 状态接口已返回 `preference_triggered`，结果接口补 `preference_skipped` 即可 |
| 任务异常重试 | 失败态只提供「返回重新创建任务」 | 若支持重跑，补 `POST /api/tasks/{id}/retry` |

## 4. 联调检查清单

- [ ] `POST /api/tasks` 返回的 `task_id` 与后续所有接口一致
- [ ] 状态接口的 `progress` 为 0–100 整数，且单调不减
- [ ] 完成时 `status=completed`，同时结果接口可访问
- [ ] `all_poor` 与 `failed` 时 `best_candidate_id` 为 `null`，前端据此走异常分支
- [ ] 评分字段为 0–1 浮点；维度 key 使用中文名或后端自定义名，前端不做映射
- [ ] 图片 `image_url` 可直接被 `<img>` 访问（或经静态服务代理）
- [ ] `rejected` 候选带 `quality_info.reason`，用于展示筛除原因
