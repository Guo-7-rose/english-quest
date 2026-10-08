$ErrorActionPreference = "Continue"
$ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0 Safari/537.36"
$topics = @(
  "英语思维 语法",
  "英语 时态 讲解",
  "英语 冠词 讲解",
  "英语 定语从句 讲解",
  "英语 虚拟语气 讲解",
  "English grammar tenses lesson",
  "English articles a an the lesson"
)

foreach ($t in $topics) {
  try {
    $url = "https://www.youtube.com/results?search_query=" + [uri]::EscapeDataString($t)
    $html = (Invoke-WebRequest -Uri $url -UserAgent $ua -TimeoutSec 25 -UseBasicParsing).Content
    $ms = [regex]::Matches($html, '"videoId":"([\w-]{11})".{0,500}?"title":\{"runs":\[\{"text":"(.*?)"\}\]')
    Write-Output ("`n【" + $t + "】候选 " + $ms.Count)
    $seen = @{}
    $shown = 0
    foreach ($m in $ms) {
      if ($shown -ge 3) { break }
      $id = $m.Groups[1].Value
      if ($seen.ContainsKey($id)) { continue }
      $seen[$id] = $true
      $shown++
      try {
        $o = (Invoke-WebRequest -Uri "https://www.youtube.com/oembed?url=https%3A//www.youtube.com/watch%3Fv%3D$id&format=json" -TimeoutSec 15 -UseBasicParsing).Content | ConvertFrom-Json
        $title = $m.Groups[2].Value
        if ($title.Length -gt 42) { $title = $title.Substring(0, 42) }
        Write-Output ("  OK  " + $id + " | " + $title + " | " + $o.author_name)
      }
      catch {
        Write-Output ("  FAIL " + $id)
      }
    }
  }
  catch {
    Write-Output ("`n【" + $t + "】抓取失败: " + $_.Exception.Message)
  }
}
