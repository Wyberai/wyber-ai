# Email meme GIFs

Drop the GIFs listed in `src/lib/email/memes.ts` into this folder with the
exact filenames from the manifest (e.g. `wonka-nothing.gif`), then flip that
slug's `live: true`. Emails render the GIF from
`https://wyberai.com/email-memes/<file>` — until the flag flips, they send
with the funny copy and no image slot, so a missing file can never break an
email.

Keep files under ~2 MB — bigger GIFs get clipped or slow-load in Gmail.
