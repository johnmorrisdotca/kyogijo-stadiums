# The colours

Every colour of a drawing is a custom property on its `svg`, with a light set and a dark set. See [Theming](../README.md#theming) for how a page sets them.

| Property | What it colours | Light | Dark |
| --- | --- | --- | --- |
| `--ky-apron` | the ground round the surface | `#dcd8c9` | `#1b1f1c` |
| `--ky-surface` | turf, ice, wood or outfield grass | by sport | by sport |
| `--ky-surface-alt` | mown stripes and planks | by sport | by sport |
| `--ky-line` | painted lines | `#ffffff` | `#e9ece6` |
| `--ky-zone` | a football end zone no team colours | `#2d6a40` | `#1f4a2d` |
| `--ky-red`, `--ky-blue`, `--ky-crease` | the rink's lines, and the crease's fill | `#c8372d`, `#2a5db0`, `#bfd3ec` | `#d4574d`, `#5584d4`, `#8ea9cc` |
| `--ky-boards` | the boards, a court's border, a ballpark's fence | by sport | by sport |
| `--ky-key` | the paint of a court's keys | `#c25b3c` | `#8a3f2b` |
| `--ky-court` | a futsal court's floor | `#3b79ad` | `#2a5478` |
| `--ky-dirt`, `--ky-foul`, `--ky-infield` | the baseball field | `#c28e5c`, `#3a8148`, `#58a05d` | `#8a6040`, `#275a31`, `#367a42` |
| `--ky-left`, `--ky-right` | the teams' colours | `#2f6db0`, `#b5452c` | the same |
| `--ky-left-ink`, `--ky-right-ink` | the words on those colours | `#ffffff` | the same |
| `--ky-plate`, `--ky-plate-ink` | the score's panel | `rgba(18,24,21,.9)`, `#ffffff` | `rgba(0,0,0,.82)`, the same |
| `--ky-halo` | the outline round a name painted on ice or wood | `rgba(255,255,255,.92)` | the same |
| `--ky-layer`, `--ky-layer-home`, `--ky-layer-away`, `--ky-layer-edge`, `--ky-layer-hollow`, `--ky-layer-ink`, `--ky-layer-halo` | a data layer's marks (see [docs/layers.md](./docs/layers.md)) | light set | lightened |
| `--ky-font` | the face of every word | the system's, with Hiragino and Noto Sans JP | the same |
