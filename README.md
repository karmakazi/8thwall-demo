# 8th Wall CPG image-target demo

A minimal WebAR validation build using the open-source 8th Wall engine. It tracks a flat sample package panel and anchors a small animated product reveal to it. The demo uses image targets only, so world tracking is disabled.

## 1. Generate the image target

The image-target CLI converts artwork into the metadata and feature image the engine needs.

1. Install Node.js 20 or newer.
2. From this folder, run `npx @8thwall/image-target-cli@latest`.
3. Choose `assets/aura-pack-front.png` as the source image.
4. Choose a flat/planar target and name it `aura-pack`.
5. Save the generated output in `public/image-targets/`.
6. Make sure the generated JSON is named `aura-pack.json`. Keep the generated target image beside it and preserve the relative path in its `imagePath` field.

The generated JSON and target image are deliberately not included: they are derived from the editable source artwork by 8th Wall's official target processor.

## 2. Run it

```sh
npm install
npm run dev
```

Open the local URL shown by Vite on the development computer. Camera access requires a secure context. To test on a phone, deploy the folder to an HTTPS static host, then open the HTTPS URL on the phone. The phone must have internet access for the pinned 8th Wall and A-Frame scripts used by this starter.

## What to validate

- Does the artwork acquire reliably from normal package viewing distances?
- Does the anchored overlay remain stable while tilting and rotating the carton?
- How does tracking behave under glare, uneven lighting, motion, and partial hand occlusion?
- Does the user understand the camera prompt and what to point at?
- Is the effect worth the scan and camera-permission steps?

This starter uses a flat carton front. For a bottle, can, cup, or tapered pack, generate a curved or conical target and tune its geometry to the real package. Repeat testing with production artwork and final print finishes before committing to a campaign.

## Files

- `assets/aura-pack-front.png`: sample artwork to process and print.
- `src/main.js`: camera scene, marker configuration, anchored reveal, and tracking status.
- `src/style.css`: mobile intro and status UI.

## Notes

This is a technical validation prototype, not a production campaign build. The engine and XR Extras are loaded from jsDelivr; for production, pin and self-host the runtime assets, review the 8th Wall open-source license and dependency licenses, and add analytics/privacy handling appropriate to the campaign.
