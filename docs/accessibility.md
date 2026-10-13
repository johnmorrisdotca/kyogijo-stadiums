# Accessibility

- **Each drawing says what it is.** The `svg` has `role="img"`, a `<title>` (the teams and the score, or the surface) and a `<desc>` (the competition, the status, the result, and what the surface is), linked by `aria-labelledby`. The words are in English or Japanese by `language`.
- **A score is also text.** The names, scores and statuses in a drawing are text elements, so they can be selected and found in a page. Pass `title` and `description` to say it your own way.
- **Words stay upright.** In a tall drawing the text is turned back, and a football field's numbers are upright on both sides.
- **Colour is not the only sign.** The winner is marked by a bar under the score and the loser's side is lighter, as well as by the colours.
- **Contrast.** The score sits on a dark panel with white words in both themes; a team's words on its colour are black or white by the colour's lightness, or the `textColor` you give.
- **Motion.** Nothing in the package animates. The demo's live score moves only when pressed, or every few seconds when told to play and the page is in view.
- **Not yet: a spoken update.** A page that changes the score may announce it with its own live region; the drawing does not.
