#!/usr/bin/env bun
// Local iOS preview build → upload to EAS → print install QR codes.
// Free alternative to cloud `eas build`: compiles on this Mac (Xcode required),
// then `eas upload` hosts the .ipa so testers get the same install page/QR.
//
// Usage: bun run build:ios

import { $ } from "bun";
import qrcode from "qrcode-terminal";
import appJson from "../app.json";

const PROFILE = "preview";
const IPA = "build/meettime.ipa";
const projectId: string = appJson.expo.extra.eas.projectId;

console.log(`\n▸ Building (${PROFILE}, local)…\n`);
await $`eas build --profile ${PROFILE} --platform ios --non-interactive --local --output ${IPA}`;

console.log("\n▸ Uploading to EAS for sharing…\n");
const out = await $`eas upload -p ios --build-path ${IPA} --non-interactive`.text();
process.stdout.write(out);

const pageUrl = out.match(/https:\/\/expo\.dev\/\S*\/builds\/[0-9a-f-]+/)?.[0];
const buildId = pageUrl?.match(/builds\/([0-9a-f-]+)/)?.[1];
if (!pageUrl || !buildId) {
  console.error("Could not find the build URL in eas upload output.");
  process.exit(1);
}

// Same target the Install button on the build page uses — scanning this QR
// with the iPhone camera triggers the install prompt directly.
const manifest = `https://api.expo.dev/v2/projects/${projectId}/builds/${buildId}/manifest.plist`;
const itms = `itms-services://?action=download-manifest;url=${encodeURIComponent(manifest)}`;

console.log("\n━━ Direct install (scan with iPhone camera) ━━\n");
qrcode.generate(itms, { small: true }, (q: string) => console.log(q));

console.log("\n━━ Build page (Install button + details) ━━\n");
qrcode.generate(pageUrl, { small: true }, (q: string) => console.log(q));
console.log(`\n${pageUrl}\n`);
