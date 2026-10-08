import builtin from "./videos.json";

export interface Video {
  id: string;
  title: string;
  channel: string;
  topics: string[];
  note: string;
  custom?: boolean;
}

const KEY = "eq:customVideos";

export function builtinVideos(): Video[] {
  return (builtin as { videos: Video[] }).videos;
}

export function loadCustomVideos(): Video[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Video[]) : [];
  } catch {
    return [];
  }
}

function saveCustomVideos(list: Video[]): void {
  localStorage.setItem(KEY, JSON.stringify(list));
}

/** 支持 watch?v= / youtu.be / embed/ 三种链接写法 */
export function parseYouTubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/embed\/)([\w-]{11})/,
    /(?:youtube\.com\/shorts\/)([\w-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m?.[1]) return m[1];
  }
  return null;
}

export function addCustomVideo(url: string, title?: string): Video | null {
  const id = parseYouTubeId(url.trim());
  if (!id) return null;
  const list = loadCustomVideos();
  if (list.some(v => v.id === id)) return list.find(v => v.id === id)!;
  const video: Video = {
    id,
    title: title?.trim() || "我的视频 " + id,
    channel: "自添加",
    topics: ["我的视频"],
    note: "",
    custom: true,
  };
  list.push(video);
  saveCustomVideos(list);
  return video;
}

export function removeCustomVideo(id: string): void {
  saveCustomVideos(loadCustomVideos().filter(v => v.id !== id));
}

export function allVideos(): Video[] {
  return [...builtinVideos(), ...loadCustomVideos()];
}

export function videoTopics(): string[] {
  const set = new Set<string>();
  for (const v of builtinVideos()) for (const t of v.topics) set.add(t);
  return [...set];
}

/** 在线时用 oEmbed 刷新标题/频道；失败静默返回原值（离线可用） */
export async function refreshVideoMeta(v: Video): Promise<Video> {
  try {
    const url = `https://www.youtube.com/oembed?url=${encodeURIComponent("https://www.youtube.com/watch?v=" + v.id)}&format=json`;
    const res = await fetch(url);
    if (!res.ok) return v;
    const j = (await res.json()) as { title?: string; author_name?: string };
    return { ...v, title: j.title ?? v.title, channel: j.author_name ?? v.channel };
  } catch {
    return v;
  }
}
