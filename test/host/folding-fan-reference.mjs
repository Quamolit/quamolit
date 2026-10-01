// Independent native Canvas reference for the optional grouped mixed-content demo.
export async function compareFanDisplay(page) {
  return page.evaluate(async () => {
    const canvas = document.querySelector("canvas");
    const state = window.foldingFanDemo.snapshot();
    const reference = document.createElement("canvas");
    reference.width = canvas.width;
    reference.height = canvas.height;
    const context = reference.getContext("2d");
    context.fillStyle = "#171022";
    context.fillRect(0, 0, reference.width, reference.height);
    const layer = () => {
      // Match the declared isolation surface kind; fractional text rasterization
      // can differ between DOM Canvas and OffscreenCanvas in Chromium.
      const surface =
        typeof OffscreenCanvas === "function"
          ? new OffscreenCanvas(canvas.width, canvas.height)
          : document.createElement("canvas");
      surface.width = canvas.width;
      surface.height = canvas.height;
      const ctx = surface.getContext("2d");
      const scale = Math.min(canvas.width / 900, canvas.height / 650);
      ctx.setTransform(scale, 0, 0, scale, canvas.width / 2, canvas.height * 0.77);
      return { surface, ctx };
    };
    const imageLayer = layer();
    if (state.clipped) {
      imageLayer.ctx.beginPath();
      imageLayer.ctx.rect(-150, -400, 300, 300);
      imageLayer.ctx.clip();
    }
    const image = new Image();
    image.src = new URL("/assets/lotus.jpg", location.href).href;
    await image.decode();
    for (const slice of state.slices) {
      const ctx = imageLayer.ctx;
      ctx.save();
      const cosine = Math.cos(slice.angle),
        sine = Math.sin(slice.angle);
      ctx.transform(cosine, sine, -sine, cosine, 0, 0);
      ctx.drawImage(
        image,
        slice["source-x"],
        0,
        slice["source-width"],
        432,
        -650 / 48,
        -432,
        slice["source-width"],
        432,
      );
      ctx.restore();
    }
    context.drawImage(imageLayer.surface, 0, 0);
    const notes = layer();
    if (state.annotated) {
      const ctx = notes.ctx;
      ctx.strokeStyle = "rgba(191,230,240,1)";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(-150, -95);
      ctx.lineTo(150, -95);
      ctx.stroke();
      ctx.fillStyle = "rgba(191,230,240,1)";
      ctx.font = "18px monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.direction = "ltr";
      ctx.fillText("FOLDING FAN / 24 SLICES", -150, -65);
      context.drawImage(notes.surface, 0, 0);
    }
    const actual = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
    const expected = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let differentPixels = 0,
      maxChannelDelta = 0,
      notePixels = 0;
    const noteData = notes.ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let offset = 0; offset < actual.length; offset += 4) {
      let different = false;
      if (noteData[offset + 3] > 0) notePixels++;
      for (let channel = 0; channel < 4; channel++) {
        const delta = Math.abs(actual[offset + channel] - expected[offset + channel]);
        if (delta !== 0) different = true;
        maxChannelDelta = Math.max(maxChannelDelta, delta);
      }
      if (different) differentPixels++;
    }
    return { differentPixels, maxChannelDelta, notePixels };
  });
}
