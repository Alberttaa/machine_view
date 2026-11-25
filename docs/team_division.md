# 仓库目录与责任分工

下图是团队约定的目标结构，括号内标明主要负责人。现有 React 前端位于 `frontend/`，组件和页面保留现有子目录组织。尚未开发的文件由各模块负责人按需添加。

```text
SmartPhotoSelection
│
├── README.md                         # 项目说明、运行方法（C）
├── requirements.txt                  # Python依赖（C维护，AB补充）
├── environment.yml                   # Conda环境配置（C维护）
├── .gitignore                        # Git忽略文件（C）
├── .env.example                       # 环境变量示例（C）
│
├── frontend                         # 前端 GUI（C）
│   ├── public
│   │   └── logo.png                  # 项目图标（C）
│   │
│   ├── src
│   │   ├── assets                   # 静态资源（C）
│   │   ├── components               # 通用组件（C）
│   │   │   ├── ImageUploader.tsx     # 图片上传组件
│   │   │   ├── ImageCard.tsx         # 图片卡片
│   │   │   ├── ProgressBar.tsx       # 进度条
│   │   │   └── ScorePanel.tsx        # 评分展示
│   │   │
│   │   ├── pages                   # 页面（C）
│   │   │   ├── UploadPage.tsx        # 上传页面
│   │   │   ├── ProcessingPage.tsx    # 处理中页面
│   │   │   ├── ResultPage.tsx        # 结果页面
│   │   │   ├── HistoryPage.tsx       # 历史记录
│   │   │   └── PreferencePage.tsx    # 偏好管理
│   │   │
│   │   ├── services
│   │   │   └── api.ts               # 统一 API 请求封装
│   │   │
│   │   ├── types
│   │   │   ├── image.ts             # 图片数据类型
│   │   │   ├── task.ts              # 任务数据类型
│   │   │   └── result.ts            # 结果数据类型
│   │   │
│   │   ├── utils
│   │   │   └── format.ts            # 格式化工具
│   │   │
│   │   ├── App.tsx                  # 应用入口（C）
│   │   └── main.tsx                 # React入口（C）
│   │
│   ├── package.json                 # 前端依赖（C）
│   └── vite.config.ts               # Vite配置（C）
│
├── backend                          # 后端服务（C）
│   └── app
│       ├── main.py                   # FastAPI入口
│       │
│       ├── api                      # API接口（C）
│       │   ├── tasks.py              # 创建任务、查询状态
│       │   ├── results.py            # 获取选片结果
│       │   ├── candidates.py         # 获取候选图片
│       │   ├── feedback.py           # 提交反馈
│       │   ├── history.py            # 历史任务
│       │   └── preferences.py        # 用户偏好
│       │
│       ├── schemas                  # 请求与响应结构（C）
│       │   ├── image.py              # 图片数据结构
│       │   ├── task.py               # 任务数据结构
│       │   ├── result.py             # 结果数据结构
│       │   └── feedback.py           # 反馈数据结构
│       │
│       ├── services                 # 业务逻辑（C）
│       │   ├── task_service.py       # 任务管理
│       │   ├── selection_service.py  # 调用算法流程
│       │   ├── result_service.py     # 结果封装
│       │   └── feedback_service.py   # 反馈保存
│       │
│       ├── database
│       │   ├── database.py           # 数据库连接
│       │   └── models.py             # 数据库模型
│       │
│       ├── core
│       │   ├── config.py             # 系统配置
│       │   └── exceptions.py         # 错误处理
│       │
│       └── utils
│           └── file_utils.py         # 文件保存与读取
│
├── algorithms                       # 核心算法
│   │
│   ├── __init__.py                   # 算法包入口（C维护）
│   ├── image_pipeline.py             # A的统一图像处理入口（A）
│   ├── selection.py                  # B的统一选片决策入口（B）
│   │
│   ├── preprocessing                # 图片预处理（A）
│   │   ├── __init__.py
│   │   └── pipeline.py               # preprocess_images()
│   │
│   ├── cropping                     # 智能裁剪（A）
│   │   ├── __init__.py
│   │   ├── pipeline.py               # generate_candidates()
│   │   └── crop_utils.py             # 裁剪工具
│   │
│   ├── quality                      # 图片质量筛查（A）
│   │   ├── __init__.py
│   │   └── pipeline.py               # check_image_quality()
│   │
│   ├── aesthetics                   # 美学评价（B）
│   │   ├── __init__.py
│   │   ├── scorer.py                 # score_candidates()
│   │   └── model_loader.py           # 美学模型加载
│   │
│   ├── confidence                   # 置信度评估（B）
│   │   ├── __init__.py
│   │   └── evaluator.py              # evaluate_confidence()
│   │
│   └── preference                   # 偏好比较（B）
│       ├── __init__.py
│       ├── comparator.py             # compare_candidates()
│       └── preference_utils.py       # 偏好比较辅助工具
│
├── data                             # 数据集（A、B）
│   ├── raw                          # 原始数据集（A）
│   ├── processed                    # 预处理数据（A）
│   ├── candidates                   # 裁剪候选数据（A）
│   ├── annotations                  # 标注与真值（B）
│   └── README.md                     # 数据说明（A、B）
│
├── models                           # 模型管理（B）
│   ├── configs                      # 模型配置
│   ├── checkpoints                  # 模型权重（不提交普通Git）
│   └── README.md                     # 模型来源、参数量、下载方法
│
├── experiments                      # 实验管理（B主责，A协助）
│   ├── scripts                      # 实验运行脚本
│   ├── configs                      # 实验配置
│   ├── notebooks                    # 分析笔记本
│   ├── evaluation                   # 评价指标与评估代码
│   └── results                      # 实验结果
│
├── storage                          # 运行时文件（C）
│   ├── uploads                      # 用户上传图片
│   ├── candidates                   # 运行生成的候选图
│   ├── outputs                      # 最终结果
│   └── thumbnails                   # 缩略图
│
├── tests                            # 测试（共同负责）
│   ├── test_preprocessing.py         # A
│   ├── test_cropping.py              # A
│   ├── test_quality.py               # A
│   ├── test_aesthetics.py            # B
│   ├── test_confidence.py            # B
│   ├── test_selection.py             # B
│   ├── test_api.py                   # C
│   └── test_integration.py           # C主责，AB协助
│
├── docs                             # 项目文档（共同负责）
│   ├── architecture.md               # 系统架构（C）
│   ├── interface_spec.md             # 本接口文档（C维护）
│   ├── data_format.md                # 数据结构（A、B、C共同确认）
│   ├── experiment_plan.md            # 实验方案（B）
│   ├── team_division.md              # 分工说明（C整理）
│   └── screenshots                  # 系统截图（C）
│
└── deployment                       # 部署打包（C）
    ├── Dockerfile
    ├── docker-compose.yml
    └── build                        # 最终打包产物
```

## 维护约定
1.  algorithms 中 A、B 各自负责的目录原则上由对应成员维护。
2.  backend 和 frontend 由 C 维护。
3.  data、models、experiments 需要根据真实使用情况逐步创建，不必一开始就填满。
4.  storage、models/checkpoints、大型数据集和实验结果不应直接提交到普通 Git 仓库。
5.  tests 由各模块负责人编写对应单元测试，C 负责整合测试。
