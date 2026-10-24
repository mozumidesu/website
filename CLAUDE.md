# zolatau.com

Two sites in one repository: **zolatau.com**, a personal page, and
**translate.zolatau.com**, the page for AI Translate, a Discord plugin that
lives in its own repository.

Plain HTML and CSS in 16 languages. No framework, no bundler, no package
manager. Cloudflare Workers serves it, and a push to this repository puts it
online again within a minute or two.

## The one thing that is easy to get wrong

**`public/assets/css/site.css` is generated. Never edit it directly.**

It is the four files in `src/css/` joined in the order of their names:
`10-base.css` + `20-home.css` + `30-translate.css` + `40-extra.css`, byte for
byte, with nothing added. Edit a source file without rebuilding and the site
keeps showing the old styling; edit `site.css` directly and the sources
silently fall behind.

`tools css` in the plugin repository does the joining, and `--check` says when
it has been forgotten:

```
tools css --root /path/to/website            # write site.css
tools css --root /path/to/website --check    # fails if it is out of date
```

`--check` names the source file, line and column where the built file and its
sources part, so it says which of the two happened. Run it after every change
to a source file. The joining itself is still the only thing that makes
`site.css`, so it is never edited by hand.

`public/assets/css/fonts.css` and everything in `public/assets/fonts/` are
generated too, by `src/fonts.py`, which also subsets the Japanese fonts down to
the characters the site actually uses. Re-run it after adding Japanese text, or
the new characters fall back to a system font.

## What each file does

| Path | Responsible for |
|---|---|
| `public/index.html` | zolatau.com |
| `public/translate/index.html` | translate.zolatau.com |
| `public/404.html` | Not-found page for both domains. Always dark, whatever the saved theme |
| `public/_headers` | Cache and security headers |
| `public/robots.txt` | Crawling |
| `public/assets/i18n/*.js` | Interface text in 16 languages, one file each; `en.js` is the reference |
| `public/assets/js/site.js` | Shared behaviour: language, theme, the loading screen |
| `public/assets/js/home.js` | Only the personal page |
| `public/assets/js/translate.js` | Only the plugin page |
| `public/assets/css/site.css` | **Generated** from `src/css/` |
| `public/assets/css/fonts.css` | **Generated** by `src/fonts.py` |
| `public/assets/fonts/` | The web fonts and `LICENSES.txt`. Generated |
| `public/assets/img/` | Photo, the 茂住 seal, icons, link-preview images |
| `src/css/` | The real stylesheet sources, in four files by number |
| `src/fonts.py` | Copies and subsets the fonts, writes `fonts.css` |
| `worker.js` | Which domain serves what, and the redirects |
| `wrangler.jsonc` | Cloudflare settings: the routes for both domains |
| `README.md`, `docs/README.<code>.md` | Description in 16 languages |
| `LICENSE` | AGPL-3.0, for the site's code |
| `local/` | Personal: publishing scripts, addresses, notes. Gitignored, so a cloud session cannot see it at all |

## Text and languages

English text sits **directly in the HTML**, so a page still reads with
JavaScript switched off, and **also** in `public/assets/i18n/en.js`, which is
what the language switcher uses. Changing an English phrase means changing it
in both places. The other fifteen files are translated from `en.js`.

The chosen language and the light or dark theme are remembered across both
domains. The default language comes from the browser; anything outside the
sixteen falls back to English.

The README is in 16 languages as well: `README.md` in English plus
`docs/README.<code>.md`. The header is a row of sixteen links where the current
language is `<b>` rather than a link, and the paths differ by depth — from
`docs/` the English one is `../README.md`. Editing the README means editing all
sixteen and keeping their structure identical.

## Hosting

`tools preview --root .` serves `public/` on `localhost:8787` for a look at a
change before it goes up. It is not the Worker: the redirects below and the
rules in `public/_headers` are not reproduced, and nothing is cached. The
personal page is at `/` and the plugin's page at `/translate/`.

Cloudflare Workers, built from this repository on every push. `wrangler.jsonc`
lists the routes; DNS records and certificates are created by Cloudflare itself
on the first publish.

`www.zolatau.com` and `zolatau.com/translate/` redirect to the right addresses.
`/builds/` on both domains redirects to `builds.zolatau.com`, a separate Worker
that hands out the plugin's builds — this site has no control over it and
cannot break it.

## Style

- Comments are short.
- No em dashes in the site's text; they make it read as machine-written.
- Wording on the pages is reviewed word by word. Keep agreed phrasing exactly
  as it is unless asked to change it.
