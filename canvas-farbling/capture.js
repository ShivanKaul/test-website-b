/* Shared canvas capture + farbling-analysis helpers.
 *
 * This file is byte-for-byte identical on test-website-a and test-website-b.
 * That is the whole point: the drawing is fully deterministic (no Math.random,
 * no Date, no animation), so when the same scene is captured on two different
 * eTLD+1 sites the ONLY thing that can differ between the two readbacks is
 * Brave's per-site canvas farbling. Any cross-site pixel difference is the
 * farbling, nothing else.
 *
 * Exposed as window.CF.
 */
(function () {
  "use strict";

  // A fixed, content-rich scene. Bigger than the reporter's 100x100 so we can
  // show what fraction of the canvas the (fixed-size) farbling perturbation
  // actually touches.
  const WIDTH = 300;
  const HEIGHT = 150;

  // Draw a deterministic fingerprint-style scene. Mirrors the kind of canvas a
  // real fingerprinter builds: mixed fonts, an emoji, a gradient, compositing,
  // shadows, and overlapping translucent shapes. The device's text rasteriser,
  // GPU and font stack produce a device-specific pixel pattern here, and that
  // pattern is identical run-to-run on a given device.
  function drawScene(ctx) {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // Opaque background so most pixels have alpha=255 (farbling only touches
    // RGB channels, never alpha, which we also verify).
    ctx.fillStyle = "#f7f7f7";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Gradient band.
    const grad = ctx.createLinearGradient(0, 0, WIDTH, 0);
    grad.addColorStop(0, "#102a43");
    grad.addColorStop(0.5, "#3b7dd8");
    grad.addColorStop(1, "#d64545");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WIDTH, 28);

    // Text in several fonts/sizes (rasterisation is device-specific).
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#1b1b1b";
    ctx.font = "18px 'Times New Roman', serif";
    ctx.fillText("Cwm fjord bank glyphs vext quiz", 8, 52);

    ctx.font = "15px Arial, sans-serif";
    ctx.fillStyle = "rgba(20,80,160,0.95)";
    ctx.fillText("The quick brown fox 0123456789", 8, 74);

    ctx.font = "16px monospace";
    ctx.strokeStyle = "rgba(180,40,40,0.9)";
    ctx.lineWidth = 1;
    ctx.strokeText("∀∑λ∞≠ farble?", 8, 96);

    // Emoji (color font rendering varies by platform).
    ctx.font = "22px sans-serif";
    ctx.fillText("😃🦄🔒", 8, 124);

    // Compositing + shadow + overlapping translucent shapes.
    ctx.globalCompositeOperation = "multiply";
    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = 3;

    ctx.fillStyle = "rgba(255,120,0,0.55)";
    ctx.beginPath();
    ctx.arc(210, 90, 34, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(0,160,90,0.55)";
    ctx.beginPath();
    ctx.arc(245, 105, 30, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(60,60,220,0.5)";
    ctx.beginPath();
    ctx.moveTo(255, 60);
    ctx.lineTo(295, 130);
    ctx.lineTo(215, 130);
    ctx.closePath();
    ctx.fill();

    // Reset state we changed.
    ctx.globalCompositeOperation = "source-over";
    ctx.shadowBlur = 0;
    ctx.shadowColor = "transparent";
  }

  // Draw the scene and read it back. The getImageData() call is the moment
  // Brave applies PerturbPixels() to the returned bytes.
  function captureCanvas() {
    const canvas = document.createElement("canvas");
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    drawScene(ctx);
    const img = ctx.getImageData(0, 0, WIDTH, HEIGHT);
    // Copy out of the (possibly reused) ImageData buffer.
    const rgba = new Uint8Array(img.data.buffer.slice(0));
    return { width: WIDTH, height: HEIGHT, rgba: rgba };
  }

  async function sha256Hex(u8) {
    const buf = await crypto.subtle.digest("SHA-256", u8);
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  // Compare two equal-length RGBA buffers. Returns the stats that matter for
  // judging the farbling: how many pixels/channels changed, by how much, and
  // whether the change is the tell-tale single-LSB XOR signature.
  function analyzeDiff(a, b) {
    const n = Math.min(a.length, b.length);
    const nPixels = Math.floor(n / 4);
    let diffPixels = 0;
    let diffChannels = 0;
    let maxAbsDelta = 0;
    let alphaChanged = false;
    const deltaHist = {}; // signed delta -> count (RGB channels only)

    for (let p = 0; p < nPixels; p++) {
      const o = p * 4;
      let pixelDiffers = false;
      for (let c = 0; c < 4; c++) {
        const delta = a[o + c] - b[o + c];
        if (delta !== 0) {
          pixelDiffers = true;
          if (c === 3) {
            alphaChanged = true;
          } else {
            diffChannels++;
            const ad = Math.abs(delta);
            if (ad > maxAbsDelta) maxAbsDelta = ad;
            deltaHist[delta] = (deltaHist[delta] || 0) + 1;
          }
        }
      }
      if (pixelDiffers) diffPixels++;
    }

    const totalChannels = nPixels * 3; // RGB only
    return {
      nPixels: nPixels,
      totalChannels: totalChannels,
      diffPixels: diffPixels,
      diffChannels: diffChannels,
      identicalPixelPct: nPixels ? (100 * (nPixels - diffPixels)) / nPixels : 0,
      changedChannelPct: totalChannels ? (100 * diffChannels) / totalChannels : 0,
      maxAbsDelta: maxAbsDelta,
      alphaChanged: alphaChanged,
      // The signature of Brave's PerturbPixels(): every change is +/-1 in a
      // single RGB channel, alpha untouched.
      isLsbSignature: !alphaChanged && maxAbsDelta <= 1 && diffChannels > 0,
      deltaHist: deltaHist,
    };
  }

  // base64 round-trip for the manual copy/paste fallback path.
  function rgbaToBase64(u8) {
    let s = "";
    const chunk = 0x8000;
    for (let i = 0; i < u8.length; i += chunk) {
      s += String.fromCharCode.apply(null, u8.subarray(i, i + chunk));
    }
    return btoa(s);
  }
  function base64ToRgba(b64) {
    const s = atob(b64);
    const u8 = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) u8[i] = s.charCodeAt(i);
    return u8;
  }

  window.CF = {
    WIDTH: WIDTH,
    HEIGHT: HEIGHT,
    drawScene: drawScene,
    captureCanvas: captureCanvas,
    sha256Hex: sha256Hex,
    analyzeDiff: analyzeDiff,
    rgbaToBase64: rgbaToBase64,
    base64ToRgba: base64ToRgba,
  };
})();
