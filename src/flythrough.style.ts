// The fly-through's stylesheet, written into the mount (as the 3D view writes its own): the stage with its layers, the controls under it, light and dark. The colours are custom properties of
// `.kf`, so that a page can set them; `data-theme` on `.kf` forces a theme, and without it the device's setting decides.
const LIGHT = "--kf-bg:#ffffff;--kf-ink:#10151b;--kf-muted:#434b54;--kf-panel:rgba(255,255,255,.9);--kf-line:#b9b3a3;--kf-accent:#1f5fa8;--kf-pin:#c0392b;--kf-grid:rgba(60,70,80,.2);--kf-sea:#cfe3ee;--kf-button:#ffffff;--kf-button-on:#10151b;--kf-button-on-ink:#ffffff;--kf-land:#e9e1c8;--kf-coast:#5d5a50";
const DARK = "--kf-bg:#18212a;--kf-ink:#f6f3ea;--kf-muted:#bcc3cb;--kf-panel:rgba(24,33,42,.9);--kf-line:#475463;--kf-accent:#7fb2ee;--kf-pin:#ff7a6b;--kf-grid:rgba(200,210,220,.22);--kf-sea:#14232f;--kf-button:#18212a;--kf-button-on:#f6f3ea;--kf-button-on-ink:#0d1218;--kf-land:#2f3b44;--kf-coast:#8a97a3";

/** The fly-through's stylesheet. */
export const FLYTHROUGH_STYLE = `.kf{${LIGHT};color:var(--kf-ink);font:16px/1.45 system-ui,-apple-system,"Segoe UI","Hiragino Sans","Noto Sans JP",sans-serif;color-scheme:light dark}
@media (prefers-color-scheme:dark){.kf:not([data-theme=light]){${DARK}}}
.kf[data-theme=dark]{${DARK};color-scheme:dark}
.kf[data-theme=light]{color-scheme:light}
.kf *{box-sizing:border-box}
.kf [hidden]{display:none!important}
.kf-stage{position:relative;isolation:isolate;width:100%;aspect-ratio:16/10;min-height:260px;overflow:hidden;background:var(--kf-bg);border:1px solid var(--kf-line);border-radius:12px;outline-offset:2px;user-select:none;-webkit-user-select:none}
.kf-stage:focus-visible{outline:3px solid var(--kf-accent)}
@media (max-width:560px){.kf-stage{aspect-ratio:4/5}}
.kf-layer{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none}
.kf-map{overflow:hidden}
.kf-map-box{position:absolute;transform-origin:50% 50%;background:var(--kf-sea)}
.kf-map-box svg{display:block;width:100%;height:100%}
.kf-map-box .chizu{--cz-sea:var(--kf-sea);--cz-land:var(--kf-land);--cz-line:var(--kf-coast)}
.kf-site{overflow:hidden}
.kf-grid{fill:none;stroke:var(--kf-grid);stroke-width:1}
.kf-rink{fill:var(--kf-bg);fill-opacity:.9;stroke:var(--kf-muted);stroke-width:.6;vector-effect:non-scaling-stroke}
.kf-3d{overflow:hidden}
.kf-3d .ky-turn{height:100%}
.kf-3d .ky-turn-view{aspect-ratio:auto;height:100%;min-height:0;border-radius:0;cursor:default;touch-action:auto}
.kf-3d .ky-turn-help,.kf-3d .ky-turn-live{display:none}
.kf-3d .ky-up-roof{filter:opacity(var(--kf-roof,1))}
.kf-3d[data-roof="0"] .ky-up-roof{visibility:hidden}
.kf-pin{position:absolute;left:0;top:0;width:0;height:0;pointer-events:none}
.kf-pin::before{content:"";position:absolute;left:-7px;top:-7px;width:14px;height:14px;border-radius:50%;background:var(--kf-pin);border:2px solid var(--kf-bg);box-shadow:0 0 0 2px var(--kf-pin)}
.kf-scale{position:absolute;left:12px;bottom:12px;display:flex;flex-direction:column;gap:2px;align-items:flex-start;font-size:.8rem;color:var(--kf-ink);background:var(--kf-panel);padding:4px 8px;border-radius:8px;pointer-events:none}
.kf-scale-bar{display:block;height:6px;border:2px solid var(--kf-ink);border-top:0}
.kf-caption{position:absolute;right:12px;top:12px;max-width:min(26rem,calc(100% - 24px));padding:8px 12px;border-radius:10px;background:var(--kf-panel);color:var(--kf-ink);pointer-events:none}
.kf-title{display:block;font-weight:800}
.kf-text{display:block;font-size:.92rem;color:var(--kf-muted)}
.kf-controls{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:10px 0 0}
.kf-group{display:flex;flex-wrap:wrap;gap:8px;margin:0;padding:0;list-style:none}
.kf button{font:inherit;font-size:1rem;font-weight:700;min-height:44px;min-width:44px;padding:0 14px;border-radius:12px;border:2px solid var(--kf-ink);background:var(--kf-button);color:var(--kf-ink);cursor:pointer}
.kf button[aria-pressed=true],.kf button[aria-current=step]{background:var(--kf-button-on);color:var(--kf-button-on-ink)}
.kf button:focus-visible{outline:3px solid var(--kf-accent);outline-offset:2px}
.kf-help,.kf-credit,.kf-still{margin:8px 0 0;font-size:.85rem;color:var(--kf-muted)}
.kf-live{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}`;
