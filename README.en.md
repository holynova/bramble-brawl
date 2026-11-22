# Bramble Brawl

[简体中文](README.md) · [Play on mobile](https://bramble-brawl.xiaosang.cc/) · [GitHub](https://github.com/holynova/bramble-brawl)

Pick a hero and three passive skills, then drag to dodge through the crystal mine. Your weapon aims automatically. When a wave closes in, trigger Shockwave to push enemies back. It recharges in 18 seconds.

<img src="assets/screenshot.png" width="320" alt="The final skill form in a mobile run">

## Survive a contract

Collect green crystals to level up. Choose one of six recommendations at each level. Weapons and passive skills start at rank one, reach rank five and can evolve after rank three. The three contracts bring out the crystal giant at four, six and eight minutes. Defeat it to unlock the next contract. Gold buys permanent camp upgrades. Progress stays in this browser.

Drag anywhere to move or use WASD and arrow keys. Space triggers Shockwave, and Escape pauses. Hiding the tab also pauses the fight. Open camp settings to adjust music and effects.

## Build a loadout

Choose among six heroes and eighteen passives. The camp guide previews six specializations, their recommended upgrade order and how to move in battle. Mark enemies for a scythe harvest, lead them across a fire trail, or stand still to deploy a turret. Save up to four custom loadouts on this device. Earlier saves keep their heroes, gold and equipment.

Start with three passives and study additional ones in the shared pool, up to five at a time. Each of the six weapons and eighteen passives has two upgrade routes. Choose a branch at rank three, preview its final form, then track it to prioritize the next required upgrade. Across the arsenal, 48 routes share twelve final forms.

## Run and publish

Use Node.js 22.18 or newer. Run `npm ci`, `npm test` and `npm run dev`. The production command is `npm run build`. Cloudflare Pages builds `main` after `git push origin main` and serves `dist/`. Run `npm run standalone` for a single-file edition.

<a href="https://bramble-brawl.xiaosang.cc/"><img src="assets/qr.png" width="112" alt="Scan to play"></a>
