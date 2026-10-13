// The rules of a special game's host, kept apart like the courts' so that style.ts can hold them without importing the code that draws one.

/** The colours of the host's surface, by the sport it is for: what a rule in the stylesheet gives the host's group. */
const PALETTES: Record<"default" | "nhl" | "nba" | "mlb" | "soccer", { light: string; dark: string }> = {
  default: { light: "--ky-surface:#3f8f55;--ky-surface-alt:#3a864f;--ky-apron:#dcd8c9;--ky-boards:#c8c1b0", dark: "--ky-surface:#2c6a3f;--ky-surface-alt:#296239;--ky-apron:#1b1f1c;--ky-boards:#4d5450" },
  nhl: { light: "--ky-surface:#eef5fa;--ky-surface-alt:#3a864f;--ky-apron:#d3dbe1;--ky-boards:#9aa4ab", dark: "--ky-surface:#a9bccb;--ky-surface-alt:#296239;--ky-apron:#1a2025;--ky-boards:#4b5156" },
  nba: { light: "--ky-surface:#d9a766;--ky-surface-alt:#cf9c5b;--ky-apron:#c9c3b4;--ky-boards:#a97d46", dark: "--ky-surface:#8f6a3c;--ky-surface-alt:#876234;--ky-apron:#1a1c1b;--ky-boards:#5e4426" },
  mlb: { light: "--ky-surface:#4f9a55;--ky-surface-alt:#478f4e;--ky-apron:#bdb59f;--ky-boards:#2f4a36", dark: "--ky-surface:#2f6b3a;--ky-surface-alt:#2b6336;--ky-apron:#1b1f1c;--ky-boards:#1c2b20" },
  soccer: { light: "--ky-surface:#4c9b56;--ky-surface-alt:#438f4d;--ky-apron:#c9d2bd;--ky-boards:#c8c1b0;--ky-court:#3b79ad", dark: "--ky-surface:#2d6c3e;--ky-surface-alt:#276136;--ky-apron:#1b1f1c;--ky-boards:#4d5450;--ky-court:#2a5478" },
};

/** The ends of a football host are not the guest's teams': they keep the colours they have without any. */
const NOT_TEAMS = "--ky-left:#2f6db0;--ky-right:#b5452c;--ky-left-ink:#fff;--ky-right-ink:#fff";

/** The host's sports and the palette each takes. */
const HOST_PALETTE: Record<string, keyof typeof PALETTES> = { nfl: "default", cfl: "default", ifaf: "default", deck: "default", mlb: "mlb", soccer: "soccer", nhl: "nhl", nba: "nba" };

/**
 * The rules of a special game: the host keeps the colours of its own sport (a ballpark's grass under a rink's ice) inside the drawing, which has those of
 * the guest, and the deck of a ship its steel. The guest needs none: the drawing is of its sport. A drawing that has a host writes in the rules of its host's
 * sport (`specialStyle`), and `KYOGIJO_STYLE` has the rules of every host.
 */
export function specialStyle(only?: string): string {
  const rules: string[] = [":where(.kyogijo){--ky-deck:#8d979e}", "@media (prefers-color-scheme:dark){:where(html:not([data-theme=light]) .kyogijo:not([data-theme=light])){--ky-deck:#4f585e}}", ":where(html[data-theme=dark] .kyogijo,.kyogijo[data-theme=dark]){--ky-deck:#4f585e}", ".kyogijo .ky-deck{fill:var(--ky-deck)}"];
  const light: string[] = [];
  const auto: string[] = [];
  const forced: string[] = [];
  for (const sport of Object.keys(HOST_PALETTE)) {
    if (only !== undefined && sport !== only) continue;
    const palette = { light: `${PALETTES[HOST_PALETTE[sport]].light};${NOT_TEAMS}`, dark: `${PALETTES[HOST_PALETTE[sport]].dark};${NOT_TEAMS}` };
    const mine = `.ky-host[data-sport=${sport}]`;
    light.push(`:where(.kyogijo ${mine}){${palette.light}}`);
    auto.push(`:where(html:not([data-theme=light]) .kyogijo:not([data-theme=light]) ${mine}){${palette.dark}}`);
    forced.push(`:where(html[data-theme=dark] .kyogijo ${mine},.kyogijo[data-theme=dark] ${mine}){${palette.dark}}`);
  }
  return [...rules, ...light, `@media (prefers-color-scheme:dark){${auto.join("")}}`, ...forced].join("\n");
}

/** The rules of every host's sport. */
export const KYOGIJO_SPECIAL_STYLE = specialStyle();
