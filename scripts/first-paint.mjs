// What every page of the site is made with so that its first paint is whole: the English words written into the HTML (the
// family's header and footer say them through data-say, which a script fills, and a page that shows the words only after its
// script has run is blank, then jumps), and the little script in <head> that sets the page's language before anything is drawn.
//
// Language. The page's language is the address's (?lang=), else what this device kept, else the browser's, as the family's
// script decides it. English is what the HTML says. A reader who will read Japanese would see English words, then Japanese, so
// for that reader the page is held back (invisible, but laid out) until the page's script has set the words, and shown at
// once then; a script that never comes shows the page after three seconds. Nobody else waits for anything.
import { FAMILY_WORDS } from "./family-template.mjs";

const escapeText = (text) => String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** The tiny classic script and the rule it needs, for <head>: it sets <html lang> and holds a Japanese page back; the page's script lets it go with `releasePage`. */
export function firstPaintHead(id, { theme = false } = {}) {
  const script = `(function(){var d=document.documentElement,q=new URLSearchParams(location.search),k=null,t=null,l=q.get("lang");try{k=localStorage.getItem(${JSON.stringify(`${id}.page.lang`)});t=localStorage.getItem(${JSON.stringify(`${id}.theme`)})}catch(e){}if(l!=="ja"&&l!=="en")l=k==="ja"||k==="en"?k:String(navigator.language).toLowerCase().indexOf("ja")===0?"ja":"en";d.lang=l;if(l==="ja")d.setAttribute("data-first","ja");${theme ? 't=q.get("theme")||t;if(t==="light"||t==="dark")d.setAttribute("data-theme",t);' : ""}})();`;
  const rule = "html[data-first] body{visibility:hidden;animation:ky-first 0s 3s forwards}@keyframes ky-first{to{visibility:visible}}";
  return `<script>${script}</script>\n    <style id="first-paint">${rule}</style>`;
}

/** The line a page's own script ends with, once its words are in: show a page that was held back. */
export const RELEASE_PAGE = `document.documentElement.removeAttribute("data-first");`;

/**
 * Write the English words into a page's HTML, where the page's script would put them: the text of every empty element that says
 * `data-say="key"`, and the `aria-label`, `placeholder` and `title` that `data-say-label`, `data-say-placeholder` and
 * `data-say-title` ask for, and the pressed language button. `own` is the page's table of English words, laid over the family's.
 * A key the table lacks is an error, so that no word is left for the script to fill. An element that already has text keeps it.
 */
export function sayEnglish(html, own = {}) {
  const words = { ...FAMILY_WORDS.en, ...own };
  const word = (key) => {
    if (!(key in words)) throw new Error(`first paint: the key "${key}" has no English word`);
    return words[key];
  };
  // Scripts and styles are left alone: they may hold anything.
  return html
    .split(/(<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>)/)
    .map((part, at) => {
      if (at % 2 === 1) return part;
      return part
        .replace(/(<([a-z][a-z0-9-]*)\b[^<>]*\sdata-say="([^"]+)"[^<>]*>)(<\/\2>)/g, (_, open, _tag, key, close) => `${open}${escapeText(word(key))}${close}`)
        .replace(/<([a-z][a-z0-9-]*)\b([^<>]*)>/g, (tag, _name, attributes) => {
          let out = tag;
          for (const [from, to] of [["data-say-label", "aria-label"], ["data-say-placeholder", "placeholder"], ["data-say-title", "title"]]) {
            const key = new RegExp(`\\s${from}="([^"]+)"`).exec(attributes)?.[1];
            if (key !== undefined && !new RegExp(`\\s${to}=`).test(attributes)) out = out.replace(/\s*\/?>$/, (end) => ` ${to}="${escapeText(word(key))}"${end}`);
          }
          const lang = /\sdata-lang="(en|ja)"/.exec(attributes)?.[1];
          if (lang !== undefined && !/\saria-pressed=/.test(attributes)) out = out.replace(/>$/, ` aria-pressed="${lang === "en"}">`);
          return out;
        });
    })
    .join("");
}
