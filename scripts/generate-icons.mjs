import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const svgPath = path.join(root, "icon.svg");
const svg = fs.readFileSync(svgPath);

const sizes = [
  { name: "apple-touch-icon.png", size: 180 },
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
];

for (const { name, size } of sizes) {
  await sharp(svg, { density: 288 })
    .resize(size, size)
    .png()
    .toFile(path.join(root, name));
  console.log(`wrote ${name}`);
}
