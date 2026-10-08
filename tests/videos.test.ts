import { describe, it, expect, beforeEach, vi } from "vitest";
import { builtinVideos, loadCustomVideos, addCustomVideo, parseYouTubeId, videoTopics, allVideos, refreshVideoMeta } from "../src/data/videos";

describe("视频课数据层", () => {
  beforeEach(() => localStorage.clear());

  it("内置清单 ≥ 10 条且字段齐全", () => {
    const v = builtinVideos();
    expect(v.length).toBeGreaterThanOrEqual(10);
    for (const x of v) {
      expect(x.id.length).toBe(11);
      expect(x.title.length).toBeGreaterThan(0);
      expect(x.topics.length).toBeGreaterThan(0);
    }
  });

  it("主题聚合包含英语思维/时态/冠词/从句", () => {
    const topics = videoTopics();
    for (const t of ["英语思维", "时态", "冠词", "从句"]) expect(topics).toContain(t);
  });

  it("解析 YouTube 链接的多种写法", () => {
    expect(parseYouTubeId("https://www.youtube.com/watch?v=is7vn5URVcc")).toBe("is7vn5URVcc");
    expect(parseYouTubeId("https://youtu.be/is7vn5URVcc?t=10")).toBe("is7vn5URVcc");
    expect(parseYouTubeId("https://www.youtube.com/embed/is7vn5URVcc")).toBe("is7vn5URVcc");
    expect(parseYouTubeId("https://www.youtube.com/watch?v=is7vn5URVcc&list=abc")).toBe("is7vn5URVcc");
    expect(parseYouTubeId("https://example.com/video")).toBeNull();
    expect(parseYouTubeId("随便一段文字")).toBeNull();
  });

  it("添加自定义视频并读回", () => {
    const v = addCustomVideo("https://youtu.be/is7vn5URVcc", "我的语法课");
    expect(v).not.toBeNull();
    expect(v!.custom).toBe(true);
    expect(v!.id).toBe("is7vn5URVcc");
    const list = loadCustomVideos();
    expect(list.length).toBe(1);
    expect(list[0]!.title).toBe("我的语法课");
  });

  it("非法链接返回 null 且不写入", () => {
    expect(addCustomVideo("https://example.com/x")).toBeNull();
    expect(loadCustomVideos().length).toBe(0);
  });

  it("allVideos 合并内置与自定义", () => {
    addCustomVideo("https://youtu.be/is7vn5URVcc", "自定义");
    expect(allVideos().length).toBe(builtinVideos().length + 1);
  });

  it("oEmbed 刷新失败时静默返回原值", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const v = builtinVideos()[0]!;
    const out = await refreshVideoMeta(v);
    expect(out.id).toBe(v.id);
    expect(out.title).toBe(v.title);
    vi.unstubAllGlobals();
  });
});
