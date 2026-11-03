# Sound credits

The demo's recordings, in [`demo/sounds/`](../demo/sounds/), and where each came from. Every one is **CC0 1.0** or in the **public domain**: no credit is owed, and it is given anyway. None is CC BY-NC or CC BY-ND, none is taken from a broadcast, and none is a team's song or chant. The npm package ships none of them: its [sound](./sound.md) is made in the browser, and a page gives recordings of its own if it wants them.

Each was read on its licence page first (the Wikimedia Commons file page, and the Freesound page it came from where it came from one). [`scripts/sounds.data.json`](../scripts/sounds.data.json) holds the same list with the part of each raw file that is used; `pnpm sounds:fetch` fetches the raw files into `data-sources/sounds/raw/` (left out of git) and `pnpm sounds` makes the demo's files from them: cut, high-passed at 80 Hz, one channel, brought to one loudness, a loop's end crossfaded into its start, and written as Ogg Opus and as AAC (`.m4a`) for a browser that cannot decode Opus.

| File | What it is | Made by | Licence | Read on |
| --- | --- | --- | --- | --- |
| `murmur` | About a thousand people talking, with almost no word that can be made out: the bed's murmur. 8 s loop. | eguobyte | CC0 1.0 | [Commons](https://commons.wikimedia.org/wiki/File:360703_eguobyte_large-crowd-medium-distance-stereo.wav), [Freesound](https://freesound.org/people/eguobyte/sounds/360703/) |
| `applause` | A hall's applause, steady: the bed's applause. 6 s loop. | Amada44 | CC0 1.0 | [Commons](https://commons.wikimedia.org/wiki/File:Sound_Effects_-_Applause_after_a_concert.ogg) |
| `water` | An indoor pool's hall: water and voices far off, ringing. The pool's bed. 8 s loop. | stephan (pdsounds.org) | Public domain | [Commons](https://commons.wikimedia.org/wiki/File:Indoor_swimming_pool_hall.ogg) |

Made in the browser and in no file: the crowd's roar and the building's air. Each is in [`src/sound.synth.ts`](../src/sound.synth.ts).

## What a sport loads

A sport loads only the files its venue's bed uses, and only after its sound is turned on. The most any sport loads is under 110 kB as Opus and under 190 kB as AAC; a test (`src/sound.files.test.js`) holds every sport's set under 160 kB and 250 kB.
