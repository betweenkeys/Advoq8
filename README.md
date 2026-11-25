# Advoq8

A self-advocacy app for recovering people pleasers. Practice saying what you need, without folding and without blowing up.

Logo concept by Yani.

## What this version does

This is the first usable prototype. It runs entirely in the browser.

1. **Unpack.** Describe what happened, what you want, and what you are afraid of. Advoq8 reflects it back in your own words and lays out two costs: saying it in anger, and swallowing it.
2. **Draft your ask.** Write your ask, then check it. Advoq8 highlights apologies, hedges, permission-asking, and built-in outs ("totally fine if not!"). It never rewrites your words. You decide what to keep.
3. **Get ready for pushback.** Pick the pushback that sounds like them, add your own, and plan a reply to each.
4. **Your plan.** Copy it or download it as a text file.

**Safety.** If what you type includes phrases that point to a safety concern, Advoq8 pauses and shows support resources (911, the National Domestic Violence Hotline, and the 988 Lifeline). A support link is always on the first screens too. You can keep going with a support banner in view. The check is a simple phrase match, not real understanding, so it will miss things and sometimes trigger when it shouldn't.

**Privacy.** Nothing is sent anywhere and nothing is saved. Closing the page clears everything.

## Not in this version yet

- Live AI coaching (the draft check uses fixed phrase rules)
- Screenshot upload and Google Drive saving
- The Name the pattern and Debrief steps

## Run it

No build step. Open `index.html` in a browser, or serve the folder:

```
python3 -m http.server
```

## Put it online with GitHub Pages

In the repo on GitHub: **Settings > Pages > Build and deployment**. Set Source to **Deploy from a branch**, pick **main** and **/ (root)**, and save. After a minute or two the app is live at `https://betweenkeys.github.io/Advoq8/`.

## Files

- `index.html` : the screens
- `styles.css` : the look
- `app.js` : navigation, the draft check, pushback, the plan, and the safety check
- `assets/` : Yani's logo and app icons
