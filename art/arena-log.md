# 沙棘乱斗 · 战场资产

竞技场原图是 1254 × 1254 PNG。八个单位来自同一张 1774 × 887 RGBA 图集。

## 原图与重建

- 竞技场原图 `source-images/exec-0d22e050-7627-4f24-9feb-ad2dd6069be5.png`
- 单位图集 `source-images/exec-58abee49-9fb1-4bb8-8a6d-953ec5742403.png`
- 可重建的深色背景查验图 `/tmp/bramble-brawl-units-preview.jpg`。将八张交付的 WebP 等比缩放至 235 × 232 像素，再按两行四列贴到深色背景，即可复查透明边缘。

用 cwebp 的质量 89、方法 6 输出竞技场。八张精灵的裁切矩形使用左上闭、右下开坐标，依次为 `(15,40,446,438)`、`(486,4,883,449)`、`(900,11,1382,446)`、`(1389,72,1755,432)`、`(0,501,445,812)`、`(445,465,881,867)`、`(881,451,1397,877)`、`(1409,459,1751,875)`。原图背景带有生成器残留的半透明色，将 alpha 重映射为 `clamp((alpha - 215) * 255 / 25, 0, 255)`，去除小于 9 像素的孤立连通域。紧裁透明边缘、四周留 2 像素，再按 WebP 质量 92 和方法 6 输出至 `public/art/unit-0.webp` 至 `unit-7.webp`。

## 生成提示

### 竞技场

Square master environment texture for a top-down western canyon mobile action arena, viewed directly overhead with chunky prop sides slightly visible as in Brawl Stars. Premium original Supercell-like 3D game art, large appealing shapes, flat saturated colour fields, bevels and clear sculpted cast shadows with warm sun upper left. Entire frame is the arena floor, no floating island, no horizon. In the central 82% of the composition a continuous broad golden-apricot dusty sand flat with subtle broad terrain shapes, occasional tiny flecks, sparsely scattered small pebbles, absolutely no large obstacles in the middle. The very outer 8–10% edges form a varied asymmetrical environment with attractive blocky coral red stratified bluffs, teal saguaro and agave, a tiny section of disused mine rails and little crates in upper left, one barrel lower right, some cool shadow in the canyon corners. A few tracks should stop at the outer rim; never cross the middle. Crisp stylized graphics, no painterly noise, no photography. Rendered high-detail but extremely readable, game map art that can be dynamically cropped by a moving camera. No characters, no text, no UI, no logos, no placeable markers, no framing, no grid.

### 战斗单位

Professional transparent straight-cut sprite atlas for a premium western fantasy mobile top-down action game, 4 COLUMNS × 2 ROWS regular grid, exactly 8 FULL-BODY DIFFERENT isolated characters. Wide 2:1 canvas. Transparent true alpha, NO background, no ground shadow or podium, NO labels, no lines, no sparkles outside individual silhouette. Each individual has generous transparent margins all around, each sprite entirely inside its identical cell. Every unit in same 3/4 frontal view very slightly from above, facing toward viewer slight left. Top row left to right: (1) round teal saguaro cactus outlaw, little dark brown cowboy hat, orange bandana and two brass seed pistols, tiny feet, grinning eyebrows; (2) female storm sorcerer, royal violet hood with pale lilac lightning insignia, white hair, deep purple robe, small hand-held lilac spark; (3) redbearded royal hammer dwarf tank with gold-and-steel blocky armor and giant chunky forge hammer; (4) small lime goblin bandit with red kerchief and short knife. Bottom row left to right: (5) violet bat monster with big pointy ears, pink inner wings, wide wings spread, angry fangs; (6) thick red-orange armored goblin bruiser in maroon plate with spiked single pauldron; (7) giant ore golem made of chunky golden mine armor, dark stone fists and a bright amethyst core in its chest, very imposing blocky silhouette; (8) cute small green seed pod cannon turret growing from a squat terra-cotta flower pot, broad leaves, powerful round snout. Stylized premium original Supercell game production quality 3D toon characters, bold chunky proportions, oversize heads and hands, crisp simplified planar bevels, rich saturated colours, high contrast rim lighting and clean unified silhouette on all eight, vibrant key light upper left. Avoid photorealism, overdetailing and text. Easy to recognize at 48px. All 8 fully visible, visual separation and transparent margins between all silhouettes.
