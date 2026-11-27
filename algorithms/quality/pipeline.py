from PIL import Image, ImageFilter, ImageStat


def check_image_quality(candidates, config=None):
    """质量筛查：检测模糊与曝光异常，阈值保守。"""
    config = config or {}
    blur_threshold = config.get("blur_threshold", 3.0)
    ratio_threshold = config.get("ratio_threshold", 0.5)
    results = []
    for c in candidates:
        defects = []
        scores = {}
        try:
            with Image.open(c["image_path"]) as img:
                gray = img.convert("L")
                hist = gray.histogram()
                total = sum(hist)
                over = sum(hist[250:]) / total
                under = sum(hist[:5]) / total
                scores["overexposure"] = round(over, 4)
                scores["underexposure"] = round(under, 4)
                if over > ratio_threshold:
                    defects.append("overexposure")
                if under > ratio_threshold:
                    defects.append("underexposure")
                edges = gray.filter(ImageFilter.FIND_EDGES)
                edge_mean = ImageStat.Stat(edges).mean[0]
                scores["edge_mean"] = round(edge_mean, 4)
                if edge_mean < blur_threshold:
                    defects.append("severe_blur")
        except Exception:
            defects.append("unreadable")
        results.append({
            "candidate_id": c["candidate_id"],
            "is_valid": len(defects) == 0,
            "defects": defects,
            "quality_scores": scores,
        })
    return results
