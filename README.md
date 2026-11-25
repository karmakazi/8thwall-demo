# Chips Ahoy! package breakout demo

A WebAR prototype using the open-source 8th Wall image-target engine. The supplied Chips Ahoy! package artwork is the marker. When recognized, an original voxel-style snack creature bursts through the pack artwork, pops forward, and can be replayed.

## Prepare the marker

The attached package image must be available locally as `assets/chips-ahoy.png`.

1. From this folder run `npx @8thwall/image-target-cli@latest`.
2. Select `assets/chips-ahoy.png`, choose a flat/planar target, and name it `chips-ahoy`.
3. Save the generated target JSON and image files in `public/image-targets/`.
4. Ensure the JSON is named `chips-ahoy.json` and keep its generated `imagePath` image in the same folder.

The page looks for `/image-targets/chips-ahoy.json`. The target processor's other outputs can remain beside it.

## Run locally

```sh
npm install
npm run dev
```

Open the local URL shown by Vite. Camera access requires HTTPS on a phone, so deploy to Vercel or another HTTPS host for iPhone testing.

## Demo flow

- Tap Start camera.
- Point the camera at the package marker.
- On recognition, the creature and package shards burst outward from the marker.
- Tap Make it burst again to replay the animation.
- The AR content hides when the marker is lost and reappears when it is found again.

The game content is attached to the printed target and uses image tracking only. Keep the package in view while playing.
