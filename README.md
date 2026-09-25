# Minesweeper Premium

Classic Minesweeper for the browser, written in plain HTML, CSS and JavaScript ES modules. It has no dependencies and no build step.

**Play it:** https://adilkananarbekov.github.io/mine-sweeper/

## Features

- **Safe first click.** Mines are placed only after the first reveal, and never in the 3×3 area around that tile, so the game always opens with an empty area.
- **Flood fill.** Opening a tile with no neighbouring mines also opens the tiles around it.
- **Chord reveal.** Clicking an opened number whose flag count already matches opens all its other hidden neighbours.
- **Four difficulties:**

  | Level  | Board   | Mines |
  | ------ | ------- | ----- |
  | Easy   | 9 × 9   | 10    |
  | Medium | 16 × 16 | 40    |
  | Hard   | 16 × 30 | 99    |
  | Custom | your rows × columns | your count |

- **Score breakdown at the end of a game.** Every opened safe tile is worth 10 points. A win adds a mine bonus of 50 points per mine and a time bonus of `(1000 − seconds) × 2`. All parts are multiplied by 1, 2 or 3 depending on mine density.
- **Best score per difficulty.** When a win sets a new best for that difficulty, the score is saved in `localStorage` and a "NEW BEST!" badge shows.
- **Light and dark themes.** The choice is saved in `localStorage`.
- **Sound effects** are generated with the Web Audio API (oscillator tones, no audio files).
- **Confetti on a win**, drawn on a full-screen `<canvas>`.
- **Reveal wave.** Opened tiles animate outwards from the clicked tile.
- **Main menu, timer, mine counter** and a smiley restart button that changes face on a win or loss.

## Controls

| Action | Mouse | Touch |
| ------ | ----- | ----- |
| Reveal a tile | Left click | Tap |
| Place / remove a flag | Right click | Long press (0.5 s, vibrates where supported) |
| Chord reveal | Left click on an opened number | Tap on an opened number |
| Restart | 🙂 button in the top bar | same |
| Open the main menu | ☰ button | same |
| Switch theme | 🌗 button or "Toggle Theme" in the menu | same |
| Change difficulty | Difficulty dropdown in the top bar or the main menu | same |

Flags can be placed only after the first tile has been opened. There are no keyboard controls yet.

## Tech stack

- HTML5 and CSS (custom properties for the light and dark themes)
- Vanilla JavaScript, ES modules
- Web Audio API for sound
- Canvas 2D for the confetti
- `localStorage` for the theme and best scores
- Nunito font from Google Fonts
- Hosted on GitHub Pages

## Run locally

The scripts are ES modules, so browsers will not load them from `file://`. Serve the folder over HTTP instead:

```bash
git clone https://github.com/adilkananarbekov/mine-sweeper.git
cd mine-sweeper

# any static server works, for example:
npx serve .
# or
python -m http.server 8000
```

Then open the address the server prints (for the Python server, http://localhost:8000).

## Project structure

```
index.html        page layout, top bar, menus and modals
css/style.css     themes, board and animations
js/main.js        app entry: menus, input, timer, end-of-game screen
js/game.js        game rules: board, mine placement, reveal, chord, score
js/renderer.js    draws the board and updates the top bar
js/audio.js       Web Audio sound effects
js/particles.js   canvas confetti
```

## Maintainer

Adilkan Anarbekov, web and Flutter developer from Bishkek, Kyrgyzstan.

- Website: https://adilkan.com
- GitHub: https://github.com/adilkananarbekov
- Telegram: [@Adilkan_07](https://t.me/Adilkan_07)
- Email: adilkananarbekov751@gmail.com
