# Design notes: "Horizon"

The direction agreed with the owner for the whole site, the future
zolatau.com/discord and zolatau.com/telegram pages included. Since phase 1b the
palette is "Sumi" (ink and vermilion): warm ink black, the vermilion of the
茂住 seal, a little gold, and washi paper for the light theme. Dela Gothic One
for display, Zen Kaku Gothic New for text, Martian Mono for small labels,
tategaki section labels, the seal and the cat. The site feels alive and
borderless: text drifts, rails run sideways off the edge of the screen, the
footer never ends.

The owner chose the palette, the hero line, the menu and the footer in the
Artifact "zolatau.com redesign choices"; the earlier directions are in
"Редизайн zolatau.com".

## Rules

- **Dark is the main theme.** Light is a full second theme, never an inversion.
- **The theme and the language are remembered on every page**, the 404 too:
  cookie `zl-theme` / `zl-lang` on `.zolatau.com`, plus `localStorage`. The
  inline head script applies them before the first paint.
- **No em dashes** in the site's text.
- **Unofficial**: no Discord or Telegram logo as the site's own branding. Their
  icons appear only beside a link to that service.
- **Complete at rest**: everything meant to be read is visible without
  scrolling to it or waiting for an animation. Motion only decorates.
- **Performance**: animate `transform` and `opacity` only. Marquees pause when
  off screen or when the tab is hidden. No library, no framework.

## Tokens

Defined once in `src/css/10-base.css`. Components use tokens, never literals
that read in one theme only.

| Token | Dark | Light | Use |
|---|---|---|---|
| `--bg` | `#14110F` | `#F4EFE6` | page (also `theme-color`) |
| `--bg-deep` | `#0C0A09` | `#EAE3D6` | loader, command blocks |
| `--surface` / `--surface-2` | `#201B17` / `#2A231E` | `#FFFDF8` / `#FAF6EF` | cards |
| `--ink` | `#F3EDE3` | `#1B1612` | text |
| `--ink-2` | `#C9BFB1` | `#4A4038` | secondary text |
| `--ink-3` | `#A09485` | `#6A5E53` | labels; 4.5:1 or better on `--bg` and `--surface` in both themes |
| `--acc` / `--acc-hi` / `--acc-lo` | `#D93D23` / `#F2603F` / `#A82A16` | `#C3321B` / `#DB4A2E` / `#9C2512` | the one accent, vermilion; white text on `--acc` is 4.5:1 or better |
| `--acc-press` | `#B8301A` | `#9C2512` | hover fill of accent buttons, so white text keeps its contrast |
| `--acc-text` | `#FF8E70` | `#A82912` | accent as text |
| `--kin` / `--kin-soft` | `#E2B24F` | `#7E5A0C` | second colour, gold: live dot, translations |
| `--shu` / `--on-shu` | `#D93D23` / `#FFF6EC` | `#C3321B` / `#FFF6EC` | the seal in the bar and the footer |
| `--hanko` / `--hanko-ink` | `#2A1F19` / `#F3EDE3` | `#1B1612` / `#F4EFE6` | the seal on the portrait, ink so it reads on the vermilion disc |
| `--ground` | `--ink-2` | `--ink` | the horizon line the footer cat walks on |
| `--word` / `--word-line` | soft fill / outline | ink / ink | the footer wordmark band |
| `--cat-fur` | `#F3EDE3` | `#FFFFFF` | the cat is white in both themes |
| `--cat-outline` | `none` | ink outline | so the white cat keeps its shape on light |

The favicons and the apple-touch icons use the same vermilion gradient.

Radii: 10, 16, 26, pill. Gutter `--pad`: 18 to 64 px. Content width 1320 px.

## Motion

- Easing `--ease` `cubic-bezier(.16, 1, .3, 1)` for entrances and hovers,
  `--ease-io` for the loader's split and the theme circle.
- Hover: the pointer-origin fill grows in .45 s on a small button and up to
  .9 s on a full-width row (`--pb-in`, set by `site.js` from the width), with
  an easing that keeps the growth visible; it leaves in .42 s. Other hovers
  .3 to .5 s. Entrances: under 1.1 s. Marquees: 60 to 120 s a loop.
- `prefers-reduced-motion: reduce`: no marquee, no scramble, no hop; fills
  appear at once; content is in its final state.
- The name changes script every 3.6 s while it is on screen.

## Components

**Pointer-origin hover (`.pb`).** `site.js` sets `--x`, `--y` (where the
pointer entered or left, in px) and `--r` (distance to the farthest corner)
on the element; `::before` is a circle of radius `--r` centred on the pointer,
scaled from 0 to 1. Keyboard focus fills from the centre. Fill colour comes
from `--pb-fill`. Used on buttons, nav links, footer links, contact rows, rail
cards and rail buttons.

**Nav pill.** Floating glass pill, centred. On the left the seal: a small
vermilion stamp that shows the tategaki label of the section in view (茂住 at
the top of the home page, 翻訳, 自己紹介, 連絡; on the AI Translate page 翻訳,
機能, 鍵, 導入, 電報, 質問) and stamps itself again on every change. The
current link sits in a drop of accent that stretches from link to link: the
edge in front runs ahead, the one behind catches up. Link labels roll up on
hover, the round buttons lean a little toward the pointer. No progress line.
Hides on scroll down, returns on scroll up. Phone: seal, theme, language,
menu; the menu is full screen with the same links, each with its kanji, and
buttons for theme and language. No clock in the menu.

**Rail (`[data-rail]`).** Native horizontal scroller: `overflow-x: auto`,
`scroll-snap-type: x mandatory`, `overscroll-behavior-x: contain`, scroll
padding equal to the page gutter so the first card lines up with the text,
cards run off the far edge. It never handles the wheel, so a vertical wheel
always scrolls the page. Sideways by touch, trackpad, Shift and wheel, the
arrow buttons, the arrow keys, Home and End on the focused track, and mouse
drag (snaps to the nearest card on release, a drag never counts as a click).
Real ends: the buttons disable at each end, a counter and a progress bar say
where you are. Works right to left.

**River.** Lines of greetings and of the owner's name in many scripts, outlined
in `--line`, drifting in opposite directions behind the hero. Decorative,
`aria-hidden`.

**Footer.** Every page except the 404. An endless band of the name in several
scripts (ZOLATAU, ИВАН, イヴァン, IVAN, 이반) under a ruled horizon line: a solid
line with ticks every 24 px and taller ones every 240 px, moving with the band.
The cat walks on that line, so it always has ground under its feet: hover
pauses band and cat, a click makes the cat hop and meow. Below it four
columns: "Write to me", Contact (Discord, Telegram, GitHub), Projects (a card
for AI Translate that opens the platform chooser, and the source code), Site
(theme, language, back to top). Then a line with the copyright and a small
seal. The Minsk clock lives only at the bottom of the home hero.

**Platform chooser.** One `<dialog>` per page, opened by every `[data-pick]`
button (Install in the AI Translate section, the AI Translate card in the
footer). Two options, Discord and Telegram, going to zolatau.com/discord and
zolatau.com/telegram. Focus moves to the first option and back to the button
on close; Tab goes round inside; Escape, the close button and a click on the
dimmed page outside close it. Works by touch and right to left.

**Cat.** The walking cat of the loader and the footer, the sitting cat of the
404. White fur in both themes; in light it gets an ink outline through
`--cat-outline`. Eyes follow the pointer where it sits.

**Loader.** Only on the first visit in a tab. The cat walks the progress line,
then the screen splits along it. About 2 s to a ready page.

## For /discord and /telegram (phase 2)

Same foundation, nav and footer. Each page has its own leading rail and its
own tint inside the Sumi palette (vermilion and gold), never the services' own
brand colours or logos as the page's identity. Until those pages exist,
`worker.js` answers both paths with temporary redirects to translate.zolatau.com.
