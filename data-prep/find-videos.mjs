// 抓 YouTube 搜索结果 → 提取候选视频 → oEmbed 逐个核验真实存在
const TOPICS = [
  "英语思维 语法",
  "英语 时态 讲解",
  "英语 冠词 讲解",
  "英语 定语从句 讲解",
  "英语 虚拟语气 讲解",
  "English grammar tenses lesson",
  "English articles a an the lesson",
  "English relative clauses lesson",
];

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0 Safari/537.36";

async function fetchText(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8" } });
  if (!res.ok) throw new Error("HTTP " + res.status);
  return await res.text();
}

function extractVideos(html) {
  const out = [];
  const re = /"videoRenderer":\{"videoId":"([\w-]{11})".*?"title":\{"runs":\[\{"text":"(.*?)"\}\].*?"ownerText":\{"runs":\[\{"text":"(.*?)"/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    out.push({ id: m[1], title: m[2], channel: m[3] });
    if (out.length >= 5) break;
  }
  return out;
}

async function oembed(id) {
  try {
    const txt = await fetchText(`https://www.youtube.com/oembed?url=https%3A//www.youtube.com/watch%3Fv%3D${id}&format=json`);
    const j = JSON.parse(txt);
    return { ok: true, title: j.title, author: j.author_name };
  } catch (e) {
    return { ok: false, error: String(e.message ?? e) };
  }
}

for (const topic of TOPICS) {
  try {
    const html = await fetchText("https://www.youtube.com/results?search_query=" + encodeURIComponent(topic));
    const cands = extractVideos(html);
    console.log(`\n【${topic}】候选 ${cands.length} 个`);
    for (const c of cands.slice(0, 3)) {
      const v = await oembed(c.id);
      if (v.ok) console.log(`  ✅ ${c.id} | ${v.title.slice(0, 46)} | ${v.author}`);
      else console.log(`  ❌ ${c.id} | ${v.error}`);
    }
  } catch (e) {
    console.log(`\n【${topic}】抓取失败: ${e.message ?? e}`);
  }
}
