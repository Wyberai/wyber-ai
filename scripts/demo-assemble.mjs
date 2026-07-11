// WyberAi — assemble demo cuts from the raw screencast + wrap frames.
//   node scripts/demo-assemble.mjs <demo-raw.webm> [--speed-from S] [--speed X]
// Produces in OneDrive\Desktop\Wyber Ai\campaign-jul11\demo-video\:
//   wyberai-demo-16x9.mp4   intro + (footage: normal until S, then X× faster) + endcard
//   wyberai-demo-reel-9x16.mp4   footage inset into reel shell
//   wyberai-demo-feed-4x5.mp4    footage inset into feed shell
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const RAW = path.resolve(process.argv[2] || '')
if (!fs.existsSync(RAW)) { console.error('raw footage not found:', RAW); process.exit(1) }
// segments: "start:end:speed" (seconds in the raw, playback speed). Anything
// not covered by a segment is dropped.
const SEGS = process.argv.slice(3).map(s => s.split(':').map(Number))
if (!SEGS.length) { console.error('pass at least one segment start:end:speed'); process.exit(1) }

const OUT = path.join(os.homedir(), 'OneDrive', 'Desktop', 'Wyber Ai', 'campaign-jul11', 'demo-video')
const FR = path.join(OUT, 'frames')
const ff = (a) => { console.log('ffmpeg', a.slice(0, 6).join(' '), '…'); execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...a], { stdio: 'inherit' }) }
const probe = (f) => parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString())

console.log('segments:', SEGS.map(([a, b, x]) => `${a}-${b}s @${x}x → ${((b - a) / x).toFixed(1)}s`).join(' · '))
console.log('output footage:', SEGS.reduce((t, [a, b, x]) => t + (b - a) / x, 0).toFixed(1) + 's')

// 1) speed-ramped 16:9 footage at 1920x1080 30fps (source 1600x900 upscales cleanly)
const ramp = path.join(OUT, 'footage-ramped.mp4')
const chains = SEGS.map(([a, b, x], i) => `[0:v]trim=${a}:${b},setpts=(PTS-STARTPTS)/${x}[s${i}]`).join(';')
ff(['-i', RAW, '-filter_complex',
  `${chains};${SEGS.map((_, i) => `[s${i}]`).join('')}concat=n=${SEGS.length}:v=1:a=0,scale=1920:1080:flags=lanczos,fps=30,format=yuv420p[v]`,
  '-map', '[v]', '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', ramp])
console.log('ramped footage:', probe(ramp).toFixed(1) + 's')

// 2) 16:9 master: intro (2.4s fade) + footage + endcard (3.5s fade-in)
const master = path.join(OUT, 'wyberai-demo-16x9.mp4')
ff(['-loop', '1', '-t', '2.4', '-i', path.join(FR, 'intro-1920x1080.png'),
  '-i', ramp,
  '-loop', '1', '-t', '3.5', '-i', path.join(FR, 'endcard-1920x1080.png'),
  '-filter_complex',
  `[0:v]fps=30,format=yuv420p,fade=t=out:st=1.9:d=0.5[i];` +
  `[1:v]fade=t=in:st=0:d=0.4[f];` +
  `[2:v]fps=30,format=yuv420p,fade=t=in:st=0:d=0.5[e];` +
  `[i][f][e]concat=n=3:v=1:a=0[v]`,
  '-map', '[v]', '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', master])

// 3) 9:16 reel: shell PNG + ramped footage scaled into the band (x48 y683 984x554)
const reel = path.join(OUT, 'wyberai-demo-reel-9x16.mp4')
ff(['-loop', '1', '-i', path.join(FR, 'reel-shell-1080x1920.png'), '-i', ramp,
  '-filter_complex',
  `[1:v]scale=984:554:flags=lanczos[f];[0:v][f]overlay=48:683:shortest=1,fps=30,format=yuv420p[v]`,
  '-map', '[v]', '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', reel])

// 4) 4:5 feed: shell PNG + footage into band (x48 y398 984x554)
const feed = path.join(OUT, 'wyberai-demo-feed-4x5.mp4')
ff(['-loop', '1', '-i', path.join(FR, 'feed-shell-1080x1350.png'), '-i', ramp,
  '-filter_complex',
  `[1:v]scale=984:554:flags=lanczos[f];[0:v][f]overlay=48:398:shortest=1,fps=30,format=yuv420p[v]`,
  '-map', '[v]', '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', feed])

for (const f of [master, reel, feed]) console.log('✓', path.basename(f), probe(f).toFixed(1) + 's')
