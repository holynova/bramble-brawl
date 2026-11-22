# 实战动作与进化插画

六个英雄、三种普通怪、巨像首领和炮芽各 16 帧。每张 WebP 为 768 × 768，4 列 4 行，单格 192 × 192。原画面向右，场内按朝向翻转。统一脚线 y=175。角色专用的伸展、腾空和倒地高度在重采样时保留。

| 格号 | 播放条件 |
| --- | --- |
| 0–3 | 待机呼吸，关闭动态特效时定格 |
| 4–7 | 走跑、飞行，或炮芽破土 |
| 8–11 | 攻击预备、蓄力、命中、收招，按实际出手前摇分段 |
| 12–13 | 受击两帧；冻结时保持僵直姿态 |
| 14–15 | 倒下和着地，或炮芽枯萎 |

分组目录含原图绝对路径、生成提示与处理程序。重建时将对应子目录里的文件复制到新的暂存目录，再用下面的命令处理。生成英雄、敌人的脚本依赖 Pillow、NumPy 和 SciPy。特殊单位及进化牌仅依赖 Pillow。

```sh
uv run --no-project --with pillow --with numpy --with scipy python normalize.py
uv run --no-project --with pillow python rebuild.py
```

将生成的 anim-0.webp 至 anim-7.webp、evo-0.webp 至 evo-8.webp 放入 public/art/。九张进化牌顺序为爆荚双刺、留雷信标、地脉断层、双生炮阵、雷印回响、群星坠落、碎冰连爆、荆棘引力井、金棘反击。

新增英雄的 anim-8 至 anim-10 由 [流派英雄美术](../builds/units/README.md) 中的原画和脚本重建，新增九张进化插画见 [流派卡面](../builds/cards/cards-art-log.md)。动作预览 GIF 直接读取运行时的十一张图集。可用 `uv run --no-project --with pillow python art/motion/preview.py /path/to/全员动作预览.gif` 导出。非 macOS 环境可用 `--font` 指定简体中文字体。

英雄第 4–7 帧使用独立步态原画。原图和提示词在 hero/run-source.json，合成时 normalize.py 调用 run_cycle.py。specialfx/rebuild.py 导出六个透明战场特效，依次为放电信标、分裂尖荚、地裂石脊、陨星、反击金刺与回响雷印。将 evo-fx-0.webp 至 evo-fx-5.webp 同样复制到 public/art/。
