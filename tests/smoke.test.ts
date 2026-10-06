import { describe, it, expect } from "vitest";

describe("smoke", () => {
  it("jsdom 环境可用", () => {
    document.body.innerHTML = `<div id="app"></div>`;
    expect(document.getElementById("app")).not.toBeNull();
  });
});
