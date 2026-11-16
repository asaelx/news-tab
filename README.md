# Briefly

A lightweight, magazine-style Brave new-tab extension demo. It uses plain JavaScript and CSS, with no build step.

## Try it in Brave

1. Open `brave://extensions`.
2. Enable **Developer mode**.
3. Choose **Load unpacked** and select this folder: `/Users/asaelx/Code/news-tab`.
4. Open a new tab. Use the gear icon to change theme, subjects, and weather location.

The initial preview uses clearly labeled sample stories. In an installed extension, it attempts the five configured RSS feeds and replaces the samples with live items when at least one responds. Feed responses are cached for 15 minutes. The demo currently has no server or proxy.

## Current feeds

- The Verge: `https://www.theverge.com/rss/index.xml`
- TechCrunch: `https://techcrunch.com/feed/`
- 9to5Mac: `https://9to5mac.com/feed/`
- MacRumors: `https://www.macrumors.com/macrumors.xml`
- Ars Technica: `https://feeds.arstechnica.com/arstechnica/index`

The endpoints returned XML/RSS content types in web checks. Their article image quality, feed permissions, and runtime fetch behavior still need checking in Brave. TechCrunch's RSS terms require attribution and links to the original stories, which the cards provide.

Weather uses Open-Meteo. Location is requested only when you click **Use current location**. You can enter a city instead. Preferences and cached articles remain in browser local storage.

## Visual direction

The interface uses a restrained glass material for the sticky header and settings sheet. News imagery and cards stay opaque so headlines remain readable. Light, dark, reduced-motion, high-contrast, forced-colors, and no-backdrop-filter styles are included. This design direction was adapted from Armitanemati's Liquid Glass skill; the browser effect uses CSS blur and tint, not native Apple refraction.

## Updating the unpacked extension

After editing files, click **Reload** for Briefly in `brave://extensions`, then open a new tab. The manifest version is `0.1.2` for the current build.

Location-based weather now resolves the current GPS position to a city name using BigDataCloud's free client-side reverse-geocoding endpoint. This sends the coordinates to BigDataCloud when **Use current location** is selected; its free service uses coordinate and IP signals to improve its geolocation data. You can enter a city manually instead. Existing generic location labels are cleared and retried when location permission is already granted.
