# 模型

## 美学评分模型

第一版使用 LAION Aesthetics Predictor V1 搭配 OpenAI CLIP ViT-B/32。推理使用 CLIP 的图像编码器，将 512 维图像特征做 L2 归一化，再交给 LAION 的线性层（512 个权重和 1 个偏置）。本项目直接使用预训练权重。[LAION Aesthetics Predictor](https://github.com/LAION-AI/aesthetic-predictor) · [OpenAI CLIP](https://github.com/openai/CLIP)

评分时使用的图像编码器有 87,849,216 个参数，加上线性层共 87,849,729 个参数。用于加载的完整 CLIP 权重包含文本编码器，共有 151,277,313 个参数。

模型只输出整体美学分 `overall`。接口将原始分除以 10 并限制在 0～1，作为 `total_score`。权重保存在 `models/checkpoints/`，运行时从本地加载。

## 本地运行

在仓库根目录执行以下 PowerShell 命令。使用 Python 3.11 或更新版本。这里安装 CPU 版 PyTorch。固定版本的 CLIP 源码安装时依赖 setuptools 的 `pkg_resources`。

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install --index-url https://download.pytorch.org/whl/cpu "torch>=2.6,<3" "torchvision<1"
.\.venv\Scripts\python.exe -m pip install "setuptools>=77,<81" wheel ftfy regex tqdm
.\.venv\Scripts\python.exe -m pip install --no-build-isolation "clip @ https://codeload.github.com/openai/CLIP/zip/a1d071733d7111c9c014f024669f959182114e33"

curl.exe --fail --location "https://openaipublic.azureedge.net/clip/models/40d365715913c9da98579312b702a82c18be219cc2a73407c4526f58eba950af/ViT-B-32.pt" --output models/checkpoints/ViT-B-32.pt
curl.exe --fail --location "https://raw.githubusercontent.com/LAION-AI/aesthetic-predictor/main/sa_0_4_vit_b_32_linear.pth" --output models/checkpoints/sa_0_4_vit_b_32_linear.pth

$env:OMP_NUM_THREADS = "4"
.\.venv\Scripts\python.exe -m experiments.scripts.score_images frontend/public/images/IMG_8102.jpg frontend/public/images/IMG_8103.jpg frontend/public/images/IMG_8105.jpg frontend/public/images/candidate_002_crop.jpg
```

运行结果包含模型加载耗时、这一批照片的评分耗时和按分数排序的候选清单。
