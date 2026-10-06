const http = require("http");
const fs = require("fs");
const path = require("path");
const root = __dirname;
const port = 8899;
const mime = { ".html":"text/html; charset=utf-8", ".js":"text/javascript", ".css":"text/css", ".json":"application/json", ".png":"image/png", ".svg":"image/svg+xml" };
http.createServer((req,res)=>{
  try{
    let p = decodeURIComponent(req.url.split("?")[0]);
    if(p === "/") p = "/prototype.html";
    const file = path.join(root, p);
    if(!file.startsWith(root)){ res.writeHead(403); return res.end(); }
    const data = fs.readFileSync(file);
    res.writeHead(200, {"Content-Type": mime[path.extname(file).toLowerCase()] || "application/octet-stream"});
    res.end(data);
  }catch(e){
    res.writeHead(404, {"Content-Type":"text/plain; charset=utf-8"});
    res.end("404 not found");
  }
}).listen(port, "127.0.0.1", ()=>console.log("serving on http://127.0.0.1:"+port));
