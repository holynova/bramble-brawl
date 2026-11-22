# 技能与命中特效

六枚实战特效共用同一张 1536 × 1024 RGBA 原图。由左到右、由上至下分别对应陨石、紫电、冰晶、旋风、护盾和种子弹。

原图位于 `source-images/exec-03a74bdc-118c-4691-a5cf-6a8e8de77945.png`，交付文件位于 `public/art/fx-0.webp` 至 `fx-5.webp`。

## 重建

以左上闭右下开坐标依次裁切 `(5,7,507,499)`、`(516,7,1013,501)`、`(1032,11,1524,496)`、`(10,515,495,1004)`、`(498,499,1013,1018)`、`(1025,625,1518,861)`。将 alpha 映射为 `clamp((alpha - 36) * 255 / 214, 0, 255)`，去除小于 5 像素的孤立连通域，紧裁透明边缘后等比例缩放至 400 × 400 以内，四周留 3 像素。以 WebP 质量 91 和方法 6 导出。

临时预览为 `/tmp/bramble-brawl-fx-preview.jpg`。将成品等比缩放至 270 × 270 以内，居中贴到 900 × 600 的深灰色画布，按两行三列排列，即可重新检查中心留空与边缘。

## 生成提示

A production sprite atlas for a premium stylized 3D fantasy western brawler's action VFX, 3 columns and 2 rows, exactly six DIFFERENT isolated, vibrant full effects on a true transparent canvas. 3:2 landscape canvas. Six equal square cells with substantial 12% transparent padding inside each one. Absolutely no text, frames, labels or backdrop; no characters. Very polished angular arcade game FX shapes, bloom contained within silhouette, original Brawl Stars style chunky low-poly / soft-toon studio lighting, high contrast, bright white-hot accents, vivid neon colours. Keep each subject entire, visually separated. TOP LEFT: orange and yellow hot meteor impact starburst with angular layered golden comic impact spikes, smaller ember splashes, juicy white-hot core, energetic asymmetry. TOP MIDDLE: intense purple-electric royal lightning burst with branching sharp blue-white arcs radiating from central amethyst flash. TOP RIGHT: icy cyan crystal nova, shards of faceted blue glass ice explosively radiating around snowy white center, sharp forms. BOTTOM LEFT: emerald and turquoise circular whirlwind viewed almost straight overhead, formed by three flowing chunky crescent ribbons spiraling around a fully EMPTY transparent center, green wind flecks. BOTTOM MIDDLE: luminous gold thorn protective shield, almost spherical when seen from front, tapered projecting golden thorns around rim, glitter facets on gold rim, transparent EMPTY middle large enough to overlay a character, light golden hexagonal translucent glass hints only at rim. BOTTOM RIGHT: chunky lime and gold seed projectile, small green pointed oval seed at the RIGHT and a short yellow-white angular energy wake trailing to the LEFT, strict horizontal rightward motion. All individual silhouettes are strong and legible at small phone scale.
