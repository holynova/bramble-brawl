# 沙棘乱斗 · 十二项终阶锻造

发布素材是本目录的 `hammer-0.webp` 到 `hammer-11.webp`。每张为独立的 192 × 192 满幅 RGB WebP。按行查看 `preview-64.png` 可检查它们在小尺寸按钮中的辨识度。编号与中文分支名称逐项列在 `cards.json`。

两套未裁切的内置 ImageGen 原画位于 `source/atlas-0.png` 和 `source/atlas-1.png`，每套 1536 × 1024，以三列两行排列。生成时参照项目中的 `evo-9.webp`。完整提示词和原件路径保存在 `sources.json`。

复制整个目录后，在任意位置运行 `uv run --with pillow python rebuild.py` 即可重建全部 WebP、缩略预览和索引。若已安装 Pillow，可以直接运行 `python3 rebuild.py`。
