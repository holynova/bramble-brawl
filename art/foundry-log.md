# 矮人金炉竞技场

内置 ImageGen 根据以下提示词生成了 1:1 背景。竞技场中央留出走位与战斗区域，外圈以铁炉、熔液槽、矿道及齿轮标示四周方位。

原画位于 `source-images/exec-6b9d9c49-1005-4ce2-bb85-933ae3b0e285.png`。游戏使用 `public/art/foundry.webp`。

## 提示词

Use case: stylized-concept. Asset for actual mobile game play: one master background of an entire square 1:1 arena, edge to edge, charming premium Brawl Stars / Clash Royale stylized 3D, original dwarven red-rock frontier foundry. It must read like the camera above the middle of a real game level pointing straight down, orthographic, no horizon and no border; the camera sees rooftops and the ground; a slight bevel on 3D cliffs can show the front wall. The map is a WALKABLE FLOOR with a very large completely clear central area covering 75 percent of the whole square. Main ground color light tan mushroom sandstone gray, softly lit and fairly neutral, interesting game art route design: zones of slightly different gray-chestnut sand and peach flagstone; rows of large polygonal pavers with copper seam inlay that form graceful simple branching roadbands and a faint inset stylized golden anvil emblem flush with ground near one junction; two short flush mine rails. A few mint-colored mineral dust deposits, sparse gold flecks and warm red light across parts of the floor. Ground design is subtle and precise; leave strong contrast for action and characters that will be composited later. All attractive detailed scenery pushed to extreme outside edges only: small upper left massive bronze dwarven furnace with visible round glowing fire mouth in red mesa cliff alcove; a narrow glowing amber molten-metal channel high along upper edge; upper right specimen pile of chunky brass gears and old gold conveyor; rightmost edge contains a small compact 3D blue steel smithy anvil and crucible; bottom left red sandstone and short sacrificial gold ore track; bottom right jagged red mesa buttes, an upright gold-tube boiler, sparse chunky succulents. Cozy volcanic forge at golden hour, sculpted toy-like forms, directional soft light from top left, crisp silhouettes, sophisticated hand-painted material highlights and high-quality cinematic animated-game rendering, cohesive realistic-contact shadows with colorful deep browns. NO people, creatures, loot pickups or weapons; no text, UI, grids, hex grids, guide lines, vignette, frames, isometric floating island, perspective vanishing, central abyss or lava in the play area. The viewer sees the walkable terrain exactly underfoot and a legible square playable level, not landscape concept art.

## 从原画重建

```sh
cwebp -quiet -m 6 -q 88 source-images/exec-6b9d9c49-1005-4ce2-bb85-933ae3b0e285.png -o public/art/foundry.webp
```
