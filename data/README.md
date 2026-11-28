# 数据集

A 管理 `raw/`、`processed/`、`candidates/`，B 管理 `annotations/`。大型数据集通过团队约定的渠道共享。

## 测试集 A 选片评估

在 `annotations/test_a.json` 中记录每个同场景组的 A 组候选、质量结果和人工首选原图 ID。以下 JSON 说明字段和相对路径。每个候选都需要一条对应的质量记录。

```json
{
  "groups": [
    {
      "group_id": "scene_001",
      "best_image_ids": ["img_001"],
      "candidates": [
        {
          "candidate_id": "img_001_crop_01",
          "source_image_id": "img_001",
          "image_path": "../candidates/scene_001/img_001_crop_01.jpg",
          "candidate_type": "crop"
        }
      ],
      "quality_results": [
        {"candidate_id": "img_001_crop_01", "is_valid": true, "defects": []}
      ]
    }
  ]
}
```

图片路径相对于 JSON 所在目录解析。若人工允许多个并列首选，将这些原图 ID 都填入 `best_image_ids`。只有人工明确判定无推荐时才使用空列表。裁剪候选按 `source_image_id` 与真值匹配。

安装好[模型依赖](../models/README.md)并下载权重后，在仓库根目录运行。

```powershell
.\.venv\Scripts\python.exe -m experiments.scripts.evaluate_selection data/annotations/test_a.json --output experiments/results/test_a.json
```

两种模式使用相同的质量筛查结果。纯美学模式按 B1 得分直接选片。混合模式执行 B2，并在低置信度时进入 B3。人工真值只用于核对选片结果和计算一致率，评估调用不传入测试集反馈。

报告包含逐组结果、按组计算的 Top-1 一致率、推荐照片的平均模型美学分、平均选片耗时以及偏好比较触发率。美学分来自 LAION。模型加载与预热单独计时，选片耗时包含质量记录匹配、评分以及相应的决策步骤。可用 `--confidence-threshold` 指定已在开发集上确定的阈值。

## Photo Triage 偏好模型试验

下载的数据目录应包含 `train_val/train_pairlist.txt`、`train_val/val_pairlist.txt` 和 `train_val/train_val_imgs/`。在已安装模型依赖的仓库根目录运行。

```powershell
.\.venv\Scripts\python.exe -m experiments.scripts.train_pairwise "E:/Ling/homework/机器视觉/archive"
```

默认按固定种子从官方训练集抽取 300 组训练、60 组选择置信度阈值，并在完整官方验证集上评估。可以用 `--train-groups` 和 `--development-groups` 调整数量。Photo Triage 的人工偏好比例作为训练目标，组内第 1 名作为 Top-1 评估真值。该实验使用原始候选，全部进入评分，耗时统计基于已提取的特征。

权重写入 `models/checkpoints/phototriage_pairwise.json`，报告写入 `experiments/results/phototriage_pairwise.json`。应用侧可用 `load_pairwise_predictor(checkpoint)` 为单次任务创建比较函数，作为 `run_selection()` 的 `config["pairwise_predict"]`，并将所选阈值传给 `config["confidence_threshold"]`。
