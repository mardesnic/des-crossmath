# Crossmath

A free math crossword puzzle for young kids that works offline. The grid is made of little sums that cross each other, like a crossword. Some numbers are missing, and the right pieces wait below the grid: put each one where it makes every sum true.

Made for ages 5 and up. There is no timer and no way to lose: a sum that adds up turns green, one that doesn't gives a little wobble, and any piece can be moved again.

## Demo

Check out the live demo at: https://mardesnic.github.io/des-crossmath/

On your phone, open it and choose **Add to Home Screen** (Safari) or **Install app** (Chrome). It then opens like an app and works offline.

## Features

- 5 levels: just + up to 10, + and − up to 10, + and − up to 20, then × up to 50, and all four operators up to 100 on a big grid where most missing numbers have to be worked out backwards
- A new puzzle every time, and every one has exactly one answer that can be worked out one line at a time
- Pick a tile, then the square it goes in (or the other way round); tap a filled square to take its tile back
- A finished line turns green when it adds up and orange with a little wobble when it doesn't
- Expert mode in Settings: type the numbers on a number pad instead of picking tiles
- Undo and Start over
- Confetti when the puzzle is done, and a count of solved puzzles per level
- Picks up where you left off after a reload
- Keeps the screen on while you play
- In English and Croatian, following the phone's language unless you pick one
- Light and dark mode
- No ads, accounts or tracking

## Development

```bash
npm install
npm run dev        # local dev server
npm test           # game and translation tests
npm run build      # production build in dist/
```

`npm run deploy` builds the app and publishes it to GitHub Pages.

The grid shapes are in `src/lib/layouts.ts`, the puzzle maker and level rules in `src/lib/puzzle.ts`, and the moves in `src/lib/game.ts`.
