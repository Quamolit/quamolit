import { test, expect } from "@playwright/test";
import { readScalarSample } from "./host/gpu-scalar-readback.mjs";
import { writeFile } from "node:fs/promises";

test("公共计划的整层 Canvas 回退与原参考一致", async ({ page }, info) => {
  await page.goto("/test/retained-component.html");
  await expect(page.locator("#gpu-status")).toHaveAttribute("data-backend", "canvas");
  for (const label of ["1s", "0s", "0.5s", "0.25s", "1s"]) {
    await page.getByRole("button", { name: label, exact: true }).click();
    await page.getByRole("button", { name: "验证当前像素", exact: true }).click();
    await expect(page.locator("#gpu-pixels")).toHaveAttribute("data-result", "pass");
  }
  await page.screenshot({ path: info.outputPath("canvas-fallback.png"), fullPage: true });
});

test("非软件 GPU 同源像素、热上传、禁用与重建", async ({ page }, info) => {
  await page.goto("/test/retained-component.html");
  await page.getByRole("button", { name: "启用 / 重建 GPU", exact: true }).click();
  await expect(page.locator("#gpu-status")).not.toContainText("正在获取设备");
  const description = await page.locator("#gpu-status").textContent();
  // 缺硬件/软件 adapter 允许明确 skip；renderer 或 shader 错误必须失败。
  if (!description.startsWith("WebGPU")) {
    expect(description).toMatch(/软件 adapter|unavailable|failed/);
    test.skip(true, description);
  }
  for (const label of ["1s", "0s", "0.5s", "0.25s", "1s"]) {
    await page.getByRole("button", { name: label, exact: true }).click();
    await expect(page.locator("#gpu-status")).toContainText("本帧记录上传 64 B");
    await page.getByRole("button", { name: "验证当前像素", exact: true }).click();
    await expect(page.locator("#gpu-pixels")).toHaveAttribute("data-result", "pass");
  }
  await page.getByRole("button", { name: "禁用 GPU", exact: true }).click();
  await expect(page.locator("#gpu-status")).toContainText("手动禁用");
  await page.getByRole("button", { name: "验证当前像素", exact: true }).click();
  await expect(page.locator("#gpu-pixels")).toHaveAttribute("data-result", "pass");
  await page.getByRole("button", { name: "启用 / 重建 GPU", exact: true }).click();
  await expect(page.locator("#gpu-status")).toContainText("本帧记录上传 4160 B");
  await page.screenshot({ path: info.outputPath("gpu-component.png"), fullPage: true });
  await info.attach("GPU 对照", { path: info.outputPath("gpu-component.png"), contentType: "image/png" });
});

test("GPU 初始化等待期间，Canvas 回退仍可接受输入", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
      if (kind !== "webgpu") return original.call(this, kind, ...args);
      return {
        configure() {},
        unconfigure() {},
        getCurrentTexture() {
          return {
            createView() {
              return {};
            },
          };
        },
      };
    };
    const device = {
      limits: { maxBufferSize: 1e7 },
      lost: new Promise(() => {}),
      destroy() {},
      pushErrorScope() {},
      popErrorScope() {
        return new Promise((resolve) => {
          window.releaseGpuValidation = () => resolve(null);
        });
      },
      createShaderModule() {
        return {};
      },
      createRenderPipeline() {
        return {
          getBindGroupLayout() {
            return {};
          },
        };
      },
      createBuffer() {
        return { destroy() {} };
      },
      createBindGroup() {
        return {};
      },
      createCommandEncoder() {
        return {
          beginRenderPass() {
            return { setPipeline() {}, setBindGroup() {}, setVertexBuffer() {}, draw() {}, end() {} };
          },
          finish() {
            return {};
          },
        };
      },
      queue: { writeBuffer() {}, submit() {} },
    };
    Object.defineProperty(navigator, "gpu", {
      value: {
        getPreferredCanvasFormat() {
          return "bgra8unorm";
        },
        async requestAdapter() {
          return {
            info: { vendor: "test-mock", architecture: "mock", isFallbackAdapter: false },
            async requestDevice() {
              return device;
            },
          };
        },
      },
    });
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/test/retained-component.html");
  await page.getByRole("button", { name: "启用 / 重建 GPU", exact: true }).click();
  await page.waitForFunction(() => typeof window.releaseGpuValidation === "function");
  await page.getByRole("button", { name: "Model +1", exact: true }).click();
  await expect(page.locator("#status")).toContainText("y=63");
  await expect(page.locator("#gpu-status")).toHaveAttribute("data-backend", "canvas");
  await page.evaluate(() => window.releaseGpuValidation());
  await expect(page.locator("#gpu-status")).toHaveAttribute("data-backend", "webgpu");
  expect(errors).toEqual([]);
});

test("公共标准动画在非软件 GPU 采样，时间帧不上传记录或参数", async ({ page }, info) => {
  await page.goto("/test/retained-component.html");
  const status = page.locator("#gpu-status");
  await page.getByRole("button", { name: "启用 GPU 动画采样", exact: true }).click();
  await expect(status).not.toContainText("正在获取设备");
  const description = await status.textContent();
  if (!description.startsWith("WebGPU")) {
    expect(description).toMatch(/软件 adapter|unavailable|failed/);
    test.skip(true, description);
  }
  await expect(status).toHaveAttribute("data-motion", "gpu");
  await expect(status).toContainText("本帧记录上传 4160 B");
  await page.getByRole("button", { name: "验证 GPU 非整数数值", exact: true }).click();
  await expect(page.locator("#gpu-numeric-status")).toHaveAttribute("data-result", "pass");
  await expect(page.locator("#gpu-numeric-status")).toContainText("总读回 40 B");
  for (const label of ["1s", "0s", "0.5s", "0.25s", "1s", "Model +1", "资源 ready 切换", "视口版本切换"]) {
    await page.getByRole("button", { name: label, exact: true }).click();
    await expect(status).toContainText(
      label.endsWith("s") ? "本帧记录上传 0 B · 参数上传 0 B + 16 B" : "本帧记录上传 4160 B",
    );
    await page.getByRole("button", { name: "验证当前像素", exact: true }).click();
    await expect(page.locator("#gpu-pixels")).toHaveAttribute("data-result", "pass");
  }
  await page.getByRole("button", { name: "禁用 GPU", exact: true }).click();
  await expect(status).toHaveAttribute("data-backend", "canvas");
  await page.getByRole("button", { name: "启用 GPU 动画采样", exact: true }).click();
  await expect(status).toHaveAttribute("data-motion", "gpu");
  await page.getByRole("button", { name: "验证当前像素", exact: true }).click();
  await expect(page.locator("#gpu-pixels")).toHaveAttribute("data-result", "pass");
  await page.screenshot({ path: info.outputPath("gpu-scalar-program.png"), fullPage: true });
});

test("标准TRS真实GPU：同源shader世界坐标、乱序帧、镜像及参数常驻", async ({ page }, info) => {
  await page.goto("/test/retained-component.html");
  await page.addScriptTag({ content: `globalThis.__quamolitTrsProbe=${readScalarSample.toString()}` });
  const report = await page.evaluate(async () => {
    const adapter = await navigator.gpu?.requestAdapter();
    if (!adapter) return { result: "SKIP", reason: "adapter-unavailable" };
    const identity = {
      vendor: adapter.info.vendor,
      architecture: adapter.info.architecture,
      device: adapter.info.device,
      description: adapter.info.description,
    };
    if (
      adapter.isFallbackAdapter ||
      adapter.info.isFallbackAdapter ||
      /swiftshader|software|llvmpipe/i.test(Object.values(identity).join(" "))
    )
      return { result: "SKIP", reason: "software-adapter", adapter: identity };
    const fixture = await import("/target/js/retained-component/quamolit.test.retained-component-fixture.mjs");
    const api = await import("/target/js/retained-component/quamolit.gpu-scalar-program.mjs");
    const gpu = await import("/target/js/retained-component/quamolit.gpu-component.mjs");
    const core = await import("/target/js/retained-component/calcit.core.mjs");
    const fields = core.init_tags(["frame", "records", "parameters"]),
      device = await adapter.requestDevice(),
      errors = [],
      samples = [],
      frames = [];
    device.addEventListener("uncapturederror", (event) => errors.push(event.error.message));
    device.pushErrorScope("validation");
    const canvas = document.createElement("canvas"),
      capture = document.createElement("canvas");
    for (const target of [canvas, capture]) {
      target.width = 320;
      target.height = 180;
    }
    const context = capture.getContext("2d");
    let host;
    try {
      host = api.create_renderer_$x_(canvas, device, navigator.gpu.getPreferredCanvasFormat(), 65);
      for (const scaleEnd of [1.05, -1, 0]) {
        const prepared = api.prepare_program(fixture.start_transform(0, 0.4, 100, scaleEnd));
        if (prepared.tag.value !== "ready") throw Error(`unexpected-trs-fallback:${prepared.extra[0]}`);
        const program = prepared.extra[0],
          envelope = core.to_js_data(
            api.trs_precision(
              program.get(fields.frame).get(fields.records).get(64),
              program.get(fields.parameters),
              64,
            ),
          );
        api.install_program_$x_(host, program);
        const coldRecords = host.uploadedBytes,
          coldParameters = host.parameterBytes;
        for (let frame = 0; frame < 1000; frame++) api.draw_at_$x_(host, program, (frame % 101) / 100);
        if (host.uploadedBytes !== coldRecords || host.parameterBytes !== coldParameters)
          throw Error("trs-hot-parameter-upload");
        for (const time of [1, 0, 0.5, 0.25, 1, 0.37, 0.81, -0.1, 1.1]) {
          api.draw_at_$x_(host, program, time);
          const t = Math.max(0, Math.min(1, time)),
            s = t * t * (3 - 2 * t),
            x = 80 + 40 * t,
            y = 62;
          const scale = 0.7 + (scaleEnd - 0.7) * s,
            angle = -0.4 + 0.8 * s,
            pivot = [100, 72];
          const expectedPoint = ([px, py]) => {
            const dx = (px - pivot[0]) * scale,
              dy = (py - pivot[1]) * scale;
            return [
              32 * s + pivot[0] + Math.cos(angle) * dx - Math.sin(angle) * dy,
              -12 * s + pivot[1] + Math.sin(angle) * dx + Math.cos(angle) * dy,
            ];
          };
          const bitmap = await createImageBitmap(canvas);
          context.clearRect(0, 0, 320, 180);
          context.drawImage(bitmap, 0, 0);
          bitmap.close();
          if (scaleEnd === 1.05) {
            const [cx, cy] = expectedPoint([x + 5, y + 10]);
            const pixel = [...context.getImageData(Math.floor(cx), Math.floor(cy), 1, 1).data];
            if (pixel.join(",") !== "235,71,153,255") throw Error(`trs-center-pixel:${time}:${pixel}`);
            frames.push({ time, pixel, png: capture.toDataURL() });
          }
          const bound = 0.125 * (envelope.x + envelope.y * Math.abs(time));
          if (!(bound > 0 && bound <= 0.125)) throw Error(`trs-error-budget:${bound}`);
          for (const point of [
            [x, y],
            [x + 10, y],
            [x, y + 20],
            [x + 10, y + 20],
            [x + 5, y + 10],
          ]) {
            const actual = await window.__quamolitTrsProbe(host, 64, time, 0, point),
              expected = expectedPoint(point);
            for (let axis = 0; axis < 2; axis++)
              if (Math.abs(actual[axis] - expected[axis]) > bound)
                throw Error(`trs-world-error:${JSON.stringify({ time, scaleEnd, point, actual, expected, bound })}`);
            if (Math.abs(actual[0] + 1 - expected[0]) <= bound) throw Error("trs-translation-negative-control");
            samples.push({ time, scaleEnd, point, actual, expected, bound });
          }
        }
      }
      const validation = await device.popErrorScope();
      if (validation) errors.push(validation.message);
      return {
        result: "PASS",
        adapter: identity,
        errors,
        samples,
        frames,
        scope: "世界坐标传播预算与实色内区；旋转边缘完整栅格合同仍归#144",
      };
    } finally {
      if (host) gpu.dispose_renderer_$x_(host);
      device.destroy();
    }
  });
  if (report.result === "SKIP") {
    if (process.env.QUAMOLIT_CONSUMER_REQUIRE_GPU === "1") expect(report.result, JSON.stringify(report)).toBe("PASS");
    test.skip(true, report.reason);
    return;
  }
  expect(report.errors).toEqual([]);
  expect(report.samples).toHaveLength(135);
  expect(report.frames).toHaveLength(9);
  for (const [index, frame] of report.frames.entries()) {
    const path = info.outputPath(`trs-${index}-gpu.png`);
    await writeFile(path, Buffer.from(frame.png.split(",")[1], "base64"));
    frame.png = path;
  }
  const reportPath = info.outputPath("trs-report.json");
  await writeFile(reportPath, JSON.stringify(report, null, 2));
  await info.attach("TRS世界坐标与固定帧", { path: reportPath, contentType: "application/json" });
});
