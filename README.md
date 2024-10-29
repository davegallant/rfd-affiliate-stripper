# rfd-affiliate-stripper

<a href="https://addons.mozilla.org/en-US/firefox/addon/rfd-redirect-stripper/"><img src="https://user-images.githubusercontent.com/585534/107280546-7b9b2a00-6a26-11eb-8f9f-f95932f4bfec.png" alt="Get rfd-affiliate-stripper for Firefox"></a>
<a href="https://chromewebstore.google.com/detail/rfd-affiliate-stripper/nhjomcijhonhoggkckbjjfnjdcefbblo?authuser=0&hl=en"><img src="https://user-images.githubusercontent.com/585534/107280622-91a8ea80-6a26-11eb-8d07-77c548b28665.png" alt="Get rfd-affiliate-stripper for Chrome"></a>

Strips affiliate redirects from deal links posted on RFD.

On every page load, it transforms a link with tracking such as

```
http://www.amazon.ca/gp/redirect.html?ie=UTF8&location=https%3A%2F%2Fwww.amazon.ca%2Fdp%2FB09YXY3DKN%3Fref%3Dcm_sw_r_apan_dp_NX4HJ8HZ3XX2YK1J900A%26ref_%3Dcm_sw_r_apan_dp_NX4HJ8HZ3XX2YK1J900A%26social_share%3Dcm_sw_r_apan_dp_NX4HJ8HZ3XX2YK1J900A%26starsLeft%3D1%26skipTwisterOG%3D1&tag=redflagdealsc-20&linkCode=ur2&camp=15121&creative=330641
```

into

```
https://www.amazon.ca/dp/B09YXY3DKN
```

## Why?

This helps navigate around broken links when using certain adblockers.

## Building the extension

To build the extension, run:

```sh
npm install
npm run build
```

## Updating redirects

The browser extension will update the list of redirects by periodically fetching the latest [redirects.json](redirects.json).

Open a pull request to this repo to update the redirects.

An easy way to test regex: [regex101.com](https://regex101.com/).

New config can be tested by pointing the config url of the extension to your own branch.

For example:

```text
https://raw.githubusercontent.com/davegallant/rfd-affiliate-stripper/my-new-branch/redirects.json
```

## Tampermonkey Script

This was originally a [Tampermonkey](https://www.tampermonkey.net/) userscript before evolving into a browser extension.

To use as a tampermonkey script, copy [script.js](./script.js) into Tampermonkey.
