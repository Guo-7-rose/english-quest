import type { AppState } from "../types";
import { allVideos, videoTopics, addCustomVideo, removeCustomVideo, refreshVideoMeta, type Video } from "../data/videos";
import { toast } from "../fx/fx";

export function renderVideos(root: HTMLElement, _state: AppState): void {
  root.innerHTML = "";
  const head = document.createElement("div");
  head.className = "card";
  head.innerHTML = `<h2>🎬 语法视频课</h2>
    <div class="muted">内置精选视频（已逐一核验可播放）+ 你自己的收藏。播放需要联网，其余功能离线可用。</div>
    <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;align-items:center">
      <input id="videoUrl" placeholder="粘贴 YouTube 链接添加，如 https://youtu.be/xxxx" style="flex:1;min-width:240px;padding:8px 12px;border:2px solid #E5E5E5;border-radius:12px;font-family:inherit;font-size:14px" />
      <button class="btn btn--green" id="addVideo">+ 添加</button>
    </div>`;
  root.appendChild(head);

  const filterBar = document.createElement("div");
  filterBar.style.cssText = "display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px";
  root.appendChild(filterBar);

  const listBox = document.createElement("div");
  root.appendChild(listBox);

  let filter = "全部";

  const draw = () => {
    const topics = ["全部", ...videoTopics()];
    if (!topics.includes(filter)) filter = "全部";
    filterBar.innerHTML = topics.map(t => `<button class="btn${t === filter ? " on" : ""}" data-topic="${t}">${t}</button>`).join("");
    filterBar.querySelectorAll("[data-topic]").forEach(b => b.addEventListener("click", () => {
      filter = b.getAttribute("data-topic")!;
      draw();
    }));

    const vids = allVideos().filter(v => filter === "全部" || v.topics.includes(filter));
    listBox.innerHTML = "";
    for (const v of vids) listBox.appendChild(videoCard(v, draw));
  };

  head.querySelector("#addVideo")!.addEventListener("click", () => {
    const input = head.querySelector("#videoUrl") as HTMLInputElement;
    const added = addCustomVideo(input.value);
    if (!added) { toast("❌ 链接无法识别，请粘贴 YouTube 视频链接"); return; }
    input.value = "";
    toast("✅ 已添加：" + added.title);
    filter = "全部";
    draw();
  });

  draw();
}

function videoCard(v: Video, redraw: () => void): HTMLElement {
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap">
      <div style="flex:1;min-width:240px">
        <div style="font-weight:900;font-size:16px">${v.title}</div>
        <div class="muted">${v.channel || "频道信息联网后自动刷新"} · ${v.topics.join(" / ")}</div>
        ${v.note ? `<div class="muted" style="margin-top:4px">💡 ${v.note}</div>` : ""}
      </div>
      ${v.custom ? `<button class="btn btn--red" data-del="1">移除</button>` : `<button class="btn" data-load="1">▶ 播放</button>`}
    </div>
    <div data-slot="1" style="margin-top:10px"></div>`;
  const slot = card.querySelector('[data-slot="1"]') as HTMLElement;

  const load = () => {
    slot.innerHTML = `<div style="position:relative;padding-top:56.25%;border-radius:14px;overflow:hidden;background:#000">
        <iframe src="https://www.youtube.com/embed/${v.id}" title="${v.title}" allowfullscreen
          style="position:absolute;inset:0;width:100%;height:100%;border:0"></iframe>
      </div>`;
    void refreshVideoMeta(v).then(meta => {
      if (meta.channel && meta.channel !== v.channel) {
        const metaLine = card.querySelector(".muted");
        if (metaLine) metaLine.textContent = `${meta.channel} · ${v.topics.join(" / ")}`;
      }
    });
  };

  card.querySelector('[data-load="1"]')?.addEventListener("click", load);
  card.querySelector('[data-del="1"]')?.addEventListener("click", () => {
    removeCustomVideo(v.id);
    toast("已移除自定义视频");
    redraw();
  });
  card.addEventListener("dblclick", load);
  return card;
}
