# Design notes: "Horizon"

The direction agreed with the owner for the whole site, the future
zolatau.com/discord and zolatau.com/telegram pages included. It is the current
identity carried through: deep indigo night, one violet accent, Dela Gothic One
for display, Zen Kaku Gothic New for text, Martian Mono for small labels,
tategaki section labels, the 茂住 seal and the cat. What changes is that the
site feels alive and borderless: text drifts, rails run sideways off the edge
of the screen, the footer never ends.

The mockups the owner approved are in the Artifact "Редизайн zolatau.com"
(direction A).

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
| `--bg` | `#0D1038` | `#F6F4FC` | page |
| `--bg-deep` | `#08092A` | `#ECE8F8` | loader, deep bands |
| `--surface` / `--surface-2` | `#1A1B55` / `#242463` | `#FFFFFF` / `#F9F8FE` | cards |
| `--ink` | `#EEEAF8` | `#15103A` | text |
| `--ink-2` | `#B7ADDC` | `#3F3570` | secondary text |
| `--ink-3` | `#8F86BE` | `#5E5490` | labels; 4.5:1 or better on `--bg` in both themes |
| `--acc` / `--acc-hi` | `#8B2BFF` / `#B274FF` | `#6E12DB` / `#8B3BF0` | the one accent |
| `--acc-text` | `#C6A3FF` | `#5A0BB8` | accent as text |
| `--asagi` | `#4CCAD2` | `#00727B` | second colour: live dot, translations, Telegram |
| `--word` / `--word-line` | soft fill / outline | ink / ink | the footer wordmark band |
| `--cat-fur` | `#EEEAF8` | `#FFFFFF` | the cat is white in both themes |
| `--cat-outline` | `none` | ink outline | so the white cat keeps its shape on light |

Radii: 10, 16, 26, pill. Gutter `--pad`: 18 to 64 px. Content width 1320 px.

## Motion

- Easing `--ease` `cubic-bezier(.16, 1, .3, 1)` for entrances and hovers,
  `--ease-io` for the loader's split and the theme circle.
- Hover: 0.3 to 0.45 s. Entrances: under 1.1 s. Marquees: 60 to 120 s a loop.
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

**Nav pill.** Floating glass pill, centred. A blob follows the pointer and
rests on the section in view; a 2 px line along the bottom of the pill shows
how far down the page you are. Hides on scroll down, returns on scroll up.
Phone: mark, theme, language, menu; the menu is full screen with the same
links, the Minsk clock, theme and language.

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
scripts (ZOLATAU, ИВАН, イヴァン, IVAN, 이반) with the walking cat on top: hover
pauses band and cat, a click makes the cat hop and meow. Below it four
columns: "Write to me", contact links, AI Translate links, site controls
(theme, language, back to top); then a line with the copyright and the Minsk
clock.

**Cat.** The walking cat of the loader and the footer, the sitting cat of the
404. White fur in both themes; in light it gets an ink outline through
`--cat-outline`. Eyes follow the pointer where it sits.

**Loader.** Only on the first visit in a tab. The cat walks the progress line,
then the screen splits along it. About 2 s to a ready page.

## For /discord and /telegram (phase 2)

Same foundation, nav and footer. Each page has its own leading rail and its
own tint inside the palette: violet for Discord, asagi for Telegram, never
the services' own brand colours or logos as the page's identity.
