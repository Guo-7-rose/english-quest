import { describe, it, expect, beforeEach } from "vitest";
import { loadAll, save, resetAll, defaultState, SCHEMA_VERSION } from "../src/store/storage";

describe("storage", () => {
  beforeEach(() => { localStorage.clear(); resetAll(); });

  it("默认状态可保存并读回", () => {
    const s = defaultState();
    s.profile.xp = 123;
    save(s);
    const loaded = loadAll();
    expect(loaded.profile.xp).toBe(123);
    expect(loaded.schemaVersion).toBe(SCHEMA_VERSION);
  });

  it("缺失键时返回默认状态", () => {
    localStorage.clear();
    const loaded = loadAll();
    expect(loaded.profile.level).toBe(1);
  });

  it("旧版本状态走迁移", () => {
    localStorage.setItem("eq:state", JSON.stringify({ schemaVersion: 1, profile: { xp: 42 } }));
    const loaded = loadAll();
    expect(loaded.schemaVersion).toBe(SCHEMA_VERSION);
    expect(loaded.profile.xp).toBe(42);
    expect(loaded.profile.freezeCards).toBe(0);
  });
});
