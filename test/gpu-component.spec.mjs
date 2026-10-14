import { test, expect } from "@playwright/test";

test("非软件GPU线性RGB：同一声明的数值读回、sRGB像素与热帧参数不变", async ({ page }, info) => {
  await page.goto("/test/retained-component.html");
  const report = await page.evaluate(async () => {
    const adapter = await navigator.gpu?.requestAdapter();
    if (
      !adapter ||
      adapter.info?.isFallbackAdapter ||
      /swiftshader|software|llvmpipe/i.test(`${adapter.info?.vendor} ${adapter.info?.architecture}`)
    )
      return { result: "SKIP", reason: adapter ? "software-adapter" : "adapter-unavailable" };
    const root = "/target/js/retained-component/";
    const core = await import(root + "calcit.core.mjs"),
      retained = await import(root + "quamolit.retained-component.mjs");
    const fixture = await import(root + "quamolit.test.retained-component-fixture.mjs");
    const scalar = await import(root + "quamolit.gpu-scalar-program.mjs"),
      gpu = await import(root + "quamolit.gpu-component.mjs");
    const { readScalarSample } = await import("/test/host/gpu-scalar-readback.mjs");
    const tag = (key) => core.init_tags([key])[key];
    // 声明、颜色拆分及计划构建均由 Calcit 完成，JS 仅驱动 GPU 和独立断言。
    const plan = fixture.start_colored(0);
    const rect = core._$n_enum_$o_nth(plan.get(tag("scene")).get(tag("nodes")).get(0).get(tag("content")), 1);
    const prepared = scalar.prepare_program(plan);
    if (prepared.tag.value !== "ready") throw Error(JSON.stringify(core.to_js_data(prepared)));
    const program = prepared.extra[0],
      device = await adapter.requestDevice(),
      errors = [];
    device.addEventListener("uncapturederror", (event) => errors.push(event.error.message));
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 180;
    const capture = document.createElement("canvas");
    capture.width = 320;
    capture.height = 180;
    const context = capture.getContext("2d");
    let host;
    const encode = (v) => (v === 0 || v === 1 ? v : v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055);
    const expected = (time) => {
      const t = Math.max(0, Math.min(1, time));
      return [t, 1 - t, 0.25 + t * 0.5];
    };
    try {
      host = scalar.create_renderer_$x_(canvas, device, navigator.gpu.getPreferredCanvasFormat(), 128);
      scalar.install_program_$x_(host, program);
      const cold = host.parameterBytes,
        pixels = [],
        numeric = [];
      for (const time of [1, 0, 0.5, 0.25, 1]) {
        scalar.draw_at_$x_(host, program, time);
        context.drawImage(canvas, 0, 0);
        const color = expected(time).map((value) => Math.round(encode(value) * 255));
        const actual = [...context.getImageData(rect.get(tag("x")) + 4, rect.get(tag("y")) + 4, 1, 1).data];
        const cpu = core.to_js_data(retained.sample_plan_at(plan, time));
        pixels.push({
          time,
          actual,
          expected: [...color, 255],
          cpu: cpu.scene.nodes[0].content[1].fill,
          declarations: cpu.declarations,
          builds: cpu["plan-builds"],
        });
      }
      for (const time of [0.37, 0.81, 0.4999999, -0.1, 1.1]) {
        const rg = await readScalarSample(host, 0, time, 5),
          bb = await readScalarSample(host, 0, time, 7);
        numeric.push({ time, actual: [...rg, bb[0]], expected: expected(time) });
      }
      return {
        result: "MEASURED",
        adapter: {
          vendor: adapter.info.vendor,
          architecture: adapter.info.architecture,
          software: adapter.info.isFallbackAdapter,
        },
        cold,
        after: host.parameterBytes,
        pixels,
        numeric,
        errors,
      };
    } finally {
      if (host) gpu.dispose_renderer_$x_(host);
      device.destroy();
    }
  });
  await info.attach("linear-rgb-report", { body: JSON.stringify(report, null, 2), contentType: "application/json" });
  console.log(`linear RGB: ${JSON.stringify(report)}`);
  test.skip(report.result === "SKIP", report.reason);
  expect(report.errors).toEqual([]);
  expect(report.cold).toBe(65 * 256 + 5 * 32);
  expect(report.after).toBe(report.cold);
  for (const sample of report.pixels) {
    expect([sample.cpu.r, sample.cpu.g, sample.cpu.b].map((value) => Math.round(value * 255))).toEqual(
      sample.expected.slice(0, 3),
    );
    // 此新夹具只允许8位色域转换的1级舍入差；原有整图零差异测试不变。
    for (let channel = 0; channel < 3; channel++)
      expect(Math.abs(sample.actual[channel] - sample.expected[channel])).toBeLessThanOrEqual(1);
    expect(sample.actual[3]).toBe(255);
    expect(sample.declarations).toBe(1);
    expect(sample.builds).toBe(1);
  }
  for (const sample of report.numeric)
    sample.actual.forEach((value, i) =>
      expect(Math.abs(value - sample.expected[i])).toBeLessThanOrEqual(1e-5 + 1e-5 * Math.abs(sample.expected[i])),
    );
});

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
