# 进化技能实战特效

六张紧边 RGBA WebP 按游戏坐标排序。塔和符印渲染时保持直立，绿色弹体、石脊和金刺的默认运动方向朝右。小陨石自带斜向上方的焰尾。

| 编号 | 画面 |
| --- | --- |
| 0 | 水晶留雷塔 |
| 1 | 绿金分裂弹 |
| 2 | 熔金地裂石脊 |
| 3 | 熔岩子陨石 |
| 4 | 反击金刺 |
| 5 | 紫电晶石符印 |

内置 ImageGen 以透明背景模式生成原画，绝对路径在同目录的 `rebuild.py` 中。脚本按实际轮廓微调分列位置、截去极淡外围色雾、按尺寸等比缩小，保持透明通道。使用安装 Pillow 并支持 WebP 的 Python 3 运行 `python3 rebuild.py` 可重建六张位图与 55、24、16 像素实战小样。

## 提示词

Use case: stylized-concept game effects sprite atlas. EXACTLY SIX separate game objects on transparent alpha (not card illustrations), arranged in an orderly landscape three columns by two rows 3x2 XY grid, 6 evenly spaced distinct assets, complete empty generous transparent gutters around each individual asset, every object fully inside its own patch. These are production-ready Brawl Stars / Clash Royale quality arena game sprites, read well at 16–55 screen pixels, bold chunky beveled cartoon 3D shapes, candy colored metallic sculpted surfaces, saturated specular highlight, strong inner and outer silhouette contrast, warm key light from upper left. Slight elevated 3/4 orthographic frontal brawler view. ZERO lettering, text, frames, panels, thick square backgrounds, colored backdrop, scenery, labels, cast shadows or extra floating sparkles. One cohesive purpose-built set for the Bramble Brawl desert fantasy kingdom. Exact arrangement:
Top left: a structurally unmistakable upright royal magic lightning tower miniature, tall purple crystal orb with bright white violet charge and two little blue lightning arcs on top of a thick violet-stone square tapering TOWER and massive brass legs, gold base, top-down 3/4 view; the tower must occupy a substantial vertical silhouette, supported on its own small integrated foot.
Top middle: a single aerodynamic shiny jade seedpod projectile, gold tip, bold tapered body, one tiny fin; longitudinal axis nearly perfectly horizontal, sharp tip clearly pointing RIGHT, tapered leaf fins at its LEFT tail; floating profile, no trail, reads at 16px.
Top right: a horizontally oriented ground-impact wave in the form of a short ridge of black scorched jagged rocks with glowing amber cracks, ending in an amber triangular prow pointing towards the RIGHT, like an advancing earth-shock spine, 3/4 side-overhead, NO ground platform, no cloud. The rock ridge is longer than tall.
Bottom left: upright tiny flaming meteor with a chunky black-red rocky core and glowing orange molten cracks, a cohesive short flame tail pointing diagonally up-left, nose lower right, readable fiery rock silhouette.
Bottom middle: one individual brilliant gold metal thorn dart from a spiky shield, a strong triangular needle cone sharp-tipped towards the RIGHT, wider gold bevel base at the LEFT, perfectly horizontal, no attached shaft or shield, clean profile.
Bottom right: an in-world round violet lightning ground sigil seen slightly obliquely from above, a thick broken violet glowing circular band with purple faceted crystalline shards around its circumference and a solid white-violet lightning bolt engraved inside. Flat on the ground, open transparent interior, no rocky plate or floor tile. Only these six subjects, wildly different characteristic silhouettes. Generous transparent margins.
