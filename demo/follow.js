// The follow camera's choice in the address: `follow=action` or `follow=puck`, one for the page. Every replay the page plays (the hero's game, the Try it surface's, the game section's and the
// real arenas') starts with it, and pressing Action or Puck in a replay's bar writes it. Nothing here is sent anywhere or stored.
import { replaceAddress } from "./address.js";

/** What the address says the camera follows: `action`, `puck`, or `off` when it says nothing (or something else). */
export function followOfAddress() {
  const asked = new URLSearchParams(location.search).get("follow");
  return asked === "action" || asked === "puck" ? asked : "off";
}

/**
 * Keep a replay's choice in the address: told of each change of what its camera follows. Returns the function that stops it.
 * @param {{ subscribe(listener: (change: { reason: string, state: { follow: string } }) => void): () => void }} replay
 */
export function keepFollow(replay) {
  return replay.subscribe((change) => {
    if (change.reason !== "follow") return;
    const next = new URLSearchParams(location.search);
    if (change.state.follow === "off") next.delete("follow");
    else next.set("follow", change.state.follow);
    const url = `${location.pathname}${next.size === 0 ? "" : `?${next}`}${location.hash}`;
    if (url !== `${location.pathname}${location.search}${location.hash}`) replaceAddress(url);
  });
}
