import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const themes = [
  { key: "original", svg: "icon.svg", prefix: "" },
  { key: "kuromi", svg: "icon-kuromi.svg", prefix: "-kuromi" },
  { key: "friends", svg: "icon-friends.svg", prefix: "-friends" },
  { key: "gintama", svg: "icon-gintama.svg", prefix: "-gintama" },
];

const sizes = [
  { suffix: "apple-touch-icon", size: 180, apple: true },
  { suffix: "icon-192", size: 192 },
  { suffix: "icon-512", size: 512 },
];

for (const theme of themes) {
  const svgPath = path.join(root, theme.svg);
  const svg = fs.readFileSync(svgPath);

  for (const { suffix, size, apple } of sizes) {
    const base = apple && theme.prefix === "" ? suffix : `${suffix}${theme.prefix}`;
    const name = apple && theme.prefix === "" ? `${suffix}.png` : `${base}.png`;
    await sharp(svg, { density: 288 })
      .resize(size, size)
      .png()
      .toFile(path.join(root, name));
    console.log(`wrote ${name}`);
  }
}
