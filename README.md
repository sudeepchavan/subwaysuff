# 🛹 Subway Surfers 2D - Arcade Web Edition

A high-fidelity 2D/2.5D remake of the legendary endless runner **Subway Surfers**, crafted completely in vanilla HTML5, Canvas 2D, Web Audio API, and CSS3. 

Runs 100% offline with zero dependencies or installations required—just open `index.html` in any modern web browser!

---

## 🎮 How to Play

### Launching the Game
Simply double-click **`index.html`** or right-click and open with your preferred browser (Google Chrome, Microsoft Edge, Mozilla Firefox, Apple Safari, etc.).

### Controls

| Action | Keyboard | Touch / Mobile | Mouse / Buttons |
| :--- | :--- | :--- | :--- |
| **Move Left** | `←` Left Arrow or `A` | Swipe Left | Click `◀` Button |
| **Move Right** | `→` Right Arrow or `D` | Swipe Right | Click `▶` Button |
| **Jump** | `↑` Up Arrow or `W` | Swipe Up | Click `▲` Button |
| **Slide / Roll** | `↓` Down Arrow or `S` | Swipe Down | Click `▼` Button |
| **Fast Drop** | `↓` Down Arrow (Mid-air) | Swipe Down (Mid-air) | Click `▼` Button |
| **Hoverboard** | `Spacebar` | Double Tap Screen | Click 🛹 Board Button |
| **Pause Game** | `P` or `Escape` | — | Click `⏸️` Button |
| **Toggle Sound** | `M` | — | Click `🔊` Button |

---

## ✨ Features

### 1. 2.5D Perspective Track Engine
- Dynamic 3-lane railroad perspective with continuous forward velocity.
- Procedural track chunk generation with moving trains, stationary trains, and overhead bridges.
- Real-time parallax city skyline, moving clouds, and warm sunset atmosphere.
- Wooden sleepers and polished steel rails streaming smoothly under the runner.

### 2. Full Subway Surfers Mechanics
- **Train Surfing**: Slanted ramps allow you to run straight up onto train roofs to collect high-altitude coin cascades!
- **Hurdles & Barriers**:
  - **Low Hurdles**: Jump over with crisp timing.
  - **High Warning Bars**: Slide and roll underneath to avoid impact.
- **The Grumpy Inspector & Pitbull**:
  - The inspector and his barking bulldog chase you down the tracks.
  - Clip an obstacle or stumble, and they surge right to your heels! Run cleanly to escape, or get busted!

### 3. Iconic Power-Ups
- 🧲 **Coin Magnet**: Sucks in all golden coins across all lanes within magnetic reach.
- 🚀 **Super Jetpack**: Blasts you sky-high into the stratosphere to surf endless rows of golden clouds.
- 👟 **Super Sneakers**: Grants massive bouncy leaps to clear entire trains in a single bound.
- ⭐ **2x Multiplier**: Doubles score accumulation rate for the duration.
- 🛹 **Hoverboard**: Grants high-speed surfing and shields you against 1 fatal crash!

### 4. Shop & Customization
- **Characters**: Unlock and play as **Jake**, **Tricky**, **Fresh**, or **Ninja Spike**, each with unique outfits, colors, and running animations.
- **Hoverboards**: Choose from **Classic Cruiser**, **Miami Vice**, **Cyber Wave**, or **Golden Chariot**.
- **Upgrades**: Invest earned coins into upgrading the duration of your Magnets, Jetpacks, Sneakers, and Multipliers.
- **Missions**: Dynamic goals (collecting coins, jumps, train-roof running) awarding coins on completion.
- **Local Persistence**: All high scores, coins, unlocked items, and upgrades are automatically saved in `localStorage`.

### 5. Synthesized Web Audio Engine
- Built entirely on the Web Audio API with **zero external MP3/WAV files**:
  - 126 BPM dynamic subway street beat with kick drums, snares, hi-hats, funk basslines, and melodic leads.
  - Pentatonic coin collection chimes that play harmonic tunes as you collect coin streaks.
  - Jump whooshes, slide swooshes, board shield explosions, jetpack flame roars, and inspector whistles.

---

## 🛠️ Technology Stack
- **HTML5 Canvas 2D**: Custom perspective projection pipeline & multi-layer sprite animations.
- **Pure JavaScript (ES6+)**: Modular entity architecture (`Player`, `Track`, `Inspector`, `Particles`, `Shop`, `Renderer`).
- **Web Audio API**: Real-time sound synthesis & adaptive sequencer.
- **CSS3**: Street graffiti arcade UI, glowing neon badges, and responsive overlays.
