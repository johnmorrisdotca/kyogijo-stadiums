// The two icon links of a page: the site's static `favicon.svg` and `apple-touch-icon.png`, which sit at the site's root (`prefix` is the way up to it: "" or "../"). They are files, not a `data:` address,
// because a sanitizer on the deployed page turned the old inline icon into `about:invalid#zCSafez` and the page had no icon.
export const iconLinks = (prefix = "") => `<link rel="icon" href="${prefix}favicon.svg" type="image/svg+xml" />
    <link rel="apple-touch-icon" href="${prefix}apple-touch-icon.png" />`;
