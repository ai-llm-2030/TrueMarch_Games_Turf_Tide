# Turf Tide

**Five ink isles, 30 stages, bosses at double speed. Loop to claim, cut trails to splat them.**

<p align="center">
  <img src="assets/screenshot-title.png" alt="Turf Tide — title screen" width="820">
</p>

<p align="center">
  <a href="https://ai-llm-2030.github.io/TrueMarch_Games_Turf_Tide/"><b>▶ Play Turf Tide in your browser</b></a>
</p>

## Gameplay

<p align="center">
  <img src="assets/screenshot-play.png" alt="Turf Tide — gameplay" width="820">
</p>

## More screenshots

<table>
<tr><td width="50%"><img src="assets/screenshot-map.png" alt="The ink isles"><br><sub>The ink isles</sub></td><td width="50%"><img src="assets/screenshot-stages.png" alt="Chalk Yard's stages"><br><sub>Chalk Yard's stages</sub></td></tr>
<tr><td width="50%"><img src="assets/screenshot-shop.png" alt="The Paint Shop"><br><sub>The Paint Shop</sub></td><td width="50%"><img src="assets/screenshot-results.png" alt="Splatted: a stage result"><br><sub>Splatted: a stage result</sub></td></tr>
</table>

## Controls

| Keys | Action |
|---|---|
| Mouse, ← ↑ ↓ → or W A S D | Steer |
| Space | Special |
| Esc / P | Pause |
| M | Sound on / off |

## Run it yourself

No install, no build step, no server code, no network. The game runs entirely in your browser and keeps your progress in the browser's local storage.

```bash
git clone https://github.com/ai-llm-2030/TrueMarch_Games_Turf_Tide.git
cd TrueMarch_Games_Turf_Tide
python3 -m http.server 8000
# open http://localhost:8000
```

Opening `index.html` directly works too in most browsers; a local server is the most reliable way.

## What's inside

```
TrueMarch_Games_Turf_Tide/
├── index.html        the whole game: one file, plain JavaScript and <canvas>
├── lib/
│   ├── arcade.js     shared helpers: crisp canvas, frame loop, input, theme
│   └── arcade.css    shared look
├── assets/           the pictures in this README
├── LICENSE
└── README.md
```

Written from scratch in vanilla JavaScript: every sprite, background and sound is drawn or synthesised in code (Canvas 2D and the Web Audio API). No libraries, no frameworks, no third-party assets.

## About

**Turf Tide** is one of the 120+ games made by **[TrueMarch](https://truemarch.com)**. This repository is the standalone single-player edition of the game.

## License

© 2026 TrueMarch. All rights reserved. The source is published so you can read it, learn from it and play the game; see [LICENSE](LICENSE).
