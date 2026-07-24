const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");

const root = __dirname;
const source = path.join(root, "cards.html");
const outputs = [
  "01-cover-give-words-to-snow.png",
  "02-content-almost-melted.png",
  "03-content-snow-letter-flow.png",
  "04-content-unique-fingerprint.png",
  "05-content-open-once.png",
  "06-content-specimen-gallery.png",
  "07-ending-write-your-snow.png",
];

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: ["--allow-file-access-from-files"],
  });
  const page = await browser.newPage({
    viewport: { width: 1200, height: 1600 },
    deviceScaleFactor: 1,
  });

  await page.goto(pathToFileURL(source).href, { waitUntil: "load" });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      [...document.images].map((image) => {
        if (image.complete && image.naturalWidth > 0) return Promise.resolve();
        return new Promise((resolve, reject) => {
          image.addEventListener("load", resolve, { once: true });
          image.addEventListener("error", reject, { once: true });
        });
      }),
    );
  });

  const report = [];
  for (let index = 0; index < outputs.length; index += 1) {
    const card = page.locator(`#card-${index + 1}`);
    const output = path.join(root, outputs[index]);
    await card.screenshot({ path: output });
    const box = await card.boundingBox();
    report.push({ file: outputs[index], width: box.width, height: box.height });
  }

  console.log(JSON.stringify(report, null, 2));
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
