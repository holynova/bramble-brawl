# Bramble Brawl

[简体中文](README.md) · [Play on mobile](https://bramble-brawl.xiaosang.cc/) · [GitHub](https://github.com/holynova/bramble-brawl)

Pick a hero with three starting passives, then drag to dodge through the crystal mine. Your weapon aims automatically. When a wave closes in, trigger Shockwave to push enemies back. It recharges in 18 seconds.

<img src="assets/screenshot.png" width="320" alt="Three upgrade cards showing two different weapon branches">

## Survive a contract

Collect green crystals to level up. Each level deals exactly three cards. A single tap applies a card and resumes the fight. Weapons and passives gain their first modification at rank two, branch at rank three, and reach their final form at rank five. The three contracts bring out the crystal giant at four, six and eight minutes. Defeat it to unlock the next contract. Gold buys permanent camp upgrades. Progress stays in this browser.

The first bat raid starts at 15 seconds. At 28 seconds, a glowing fissure locks onto your heading. Step sideways before it strikes. Later waves flank you from both sides. On the last two contracts the boss also summons bats every third stomp.

Drag anywhere to move or use WASD and arrow keys. Space triggers Shockwave, and Escape pauses. Hiding the tab also pauses the fight. Open camp settings to adjust music and effects.

## Build a loadout

The six heroes each have a distinct pool of nine passives, drawn from eighteen in total. The camp guide previews six specializations, their recommended upgrade order and how to move in battle. Mark enemies for a scythe harvest, lead them across a fire trail, or stand still to deploy a turret. Switching heroes equips their three starting passives automatically. Earlier saves retain hero selection, gold, equipment and campaign progress.

Learn up to two of your hero’s six reserve passives during a run. Each of the six weapons and eighteen passives has two upgrade routes. Use the route guide in the pause menu to track a final form and bring its next step into the next deal. Tapping a rank-three branch card locks in that route. Across the arsenal, 48 routes share twelve final forms.

The camp prepares the engine, selected map, character animation sheets and effects in the background. You can start immediately and carry the loading progress into the arena. Changing hero or contract reuses shared assets.

## Run and publish

Use Node.js 22.18 or newer. Run `npm ci`, `npm test` and `npm run dev`. The production command is `npm run build`. Cloudflare Pages builds `main` after `git push origin main` and serves `dist/`. Run `npm run standalone` for a single-file edition.

<a href="https://bramble-brawl.xiaosang.cc/"><img src="assets/qr.png" width="112" alt="Scan to play"></a>
