#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const [sourceArg, outputArg] = process.argv.slice(2);
if (!sourceArg || !outputArg) {
  throw new Error(
    "usage: node scripts/build-safe-embedding-preview.mjs <viewer-v5.html> <output.html>",
  );
}

const sourcePath = resolve(sourceArg);
const outputPath = resolve(outputArg);
const source = readFileSync(sourcePath, "utf8");
const dataStart = source.indexOf("const DATA = ");
const dataEnd = source.indexOf(";\nconst byId", dataStart);
if (dataStart < 0 || dataEnd < 0) {
  throw new Error("viewer DATA payload not found");
}

const raw = JSON.parse(
  source.slice(dataStart + "const DATA = ".length, dataEnd),
);
const people = raw.people.filter((person) => person.kind === "person");
const sourceIds = new Set(people.map((person) => person.id));

const orderedIds = people
  .map((person) => person.id)
  .sort((left, right) =>
    createHash("sha256")
      .update(`nvc-safe-preview-v1:${left}`)
      .digest("hex")
      .localeCompare(
        createHash("sha256")
          .update(`nvc-safe-preview-v1:${right}`)
          .digest("hex"),
      ),
  );
const aliasById = new Map(
  orderedIds.map((sourceId, index) => [
    sourceId,
    `인물 ${String(index + 1).padStart(3, "0")}`,
  ]),
);

const round = (value) => Number(Number(value).toFixed(5));
const nodes = people
  .map((person) => ({
    id: aliasById.get(person.id),
    x: round(person.x),
    y: round(person.y),
    rx: round(person.rx),
    ry: round(person.ry),
    cluster: Number(person.cluster),
  }))
  .sort((left, right) => left.id.localeCompare(right.id));

const neighbors = {};
for (const sourceId of orderedIds) {
  neighbors[aliasById.get(sourceId)] = (raw.neighbors[sourceId] ?? [])
    .map((candidate) => candidate.id)
    .filter((targetId) => sourceIds.has(targetId))
    .slice(0, 3)
    .map((targetId) => aliasById.get(targetId));
}

const contextEdges = (raw.relationship_edges ?? [])
  .filter((edge) => sourceIds.has(edge.s) && sourceIds.has(edge.t))
  .map((edge) => [aliasById.get(edge.s), aliasById.get(edge.t)]);

const preview = {
  generatedAt: new Date().toISOString(),
  sourceSha256: createHash("sha256").update(source).digest("hex"),
  model: {
    id: raw.model.id,
    dimensions: raw.model.dimensions,
    distance: raw.model.distance,
  },
  stats: raw.relationship_layout,
  nodes,
  neighbors,
  contextEdges,
};

const html = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>사람 관계 임베딩 지도 — 안전 미리보기</title>
  <style>
    :root{color-scheme:light dark;--bg:#f7f4ef;--panel:#fffdf9;--ink:#29231f;--muted:#766c64;--line:#d8cec2;--soft:#e8eee7;--sage:#718a74;--accent:#bc5b37;--accent-soft:#f5dfd5;--node:#3f6653;--shadow:0 18px 50px rgba(68,50,38,.10)}
    @media(prefers-color-scheme:dark){:root{--bg:#181614;--panel:#24211e;--ink:#f5eee7;--muted:#b9aea4;--line:#4b433c;--soft:#2c3830;--sage:#8eaa91;--accent:#e4835f;--accent-soft:#513126;--node:#9bc0a7;--shadow:none}}
    *{box-sizing:border-box}
    body{margin:0;background:var(--bg);color:var(--ink);font-family:Pretendard,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    main{width:min(1180px,calc(100% - 32px));margin:28px auto 44px}
    header{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin-bottom:18px}
    h1{margin:0 0 7px;font-family:Georgia,"Times New Roman",serif;font-size:clamp(28px,4vw,48px);font-weight:500;letter-spacing:-.035em}
    .lede{margin:0;color:var(--muted);font-size:14px}
    .badge{display:inline-flex;padding:7px 10px;border:1px solid var(--line);border-radius:999px;color:var(--muted);font-size:12px;white-space:nowrap}
    .toolbar{display:flex;align-items:center;flex-wrap:wrap;gap:10px;margin:0 0 12px}
    button,select{font:inherit;color:var(--ink);background:var(--panel);border:1px solid var(--line);border-radius:9px;padding:9px 12px}
    button{cursor:pointer}
    button[aria-pressed="true"]{background:var(--ink);color:var(--bg);border-color:var(--ink)}
    select{min-width:170px}
    .stats{margin-left:auto;color:var(--muted);font-size:12px}
    .canvas{background:var(--panel);border:1px solid var(--line);border-radius:18px;box-shadow:var(--shadow);overflow:hidden}
    svg{display:block;width:100%;height:auto;min-height:620px}
    .context-edge{stroke:var(--line);stroke-width:.8;opacity:.2}
    .background-node{fill:var(--node);opacity:.34;cursor:pointer}
    .background-node:hover,.background-node:focus{opacity:.95;outline:none}
    .focus-halo{stroke:var(--panel);stroke-width:10}
    .focus-edge{stroke:var(--accent);stroke-width:2.6;stroke-dasharray:7 6}
    .focus-node circle{fill:var(--node);stroke:var(--panel);stroke-width:4}
    .focus-node.centre circle{fill:var(--accent)}
    .focus-node text{fill:var(--ink);font-size:13px;font-weight:500;text-anchor:middle;paint-order:stroke;stroke:var(--panel);stroke-width:5px}
    .focus-node .initial{fill:var(--panel);font-size:16px;stroke:none}
    .atlas-node{fill:var(--node);opacity:.38;cursor:pointer}
    .atlas-node.selected{fill:var(--accent);opacity:1;stroke:var(--panel);stroke-width:3}
    .atlas-node:hover,.atlas-node:focus{opacity:1;outline:none}
    .caption{display:flex;gap:18px;align-items:center;justify-content:space-between;padding:13px 16px;border-top:1px solid var(--line);color:var(--muted);font-size:13px}
    .caption strong{color:var(--ink);font-weight:500}
    .legend{display:flex;gap:14px;flex-wrap:wrap}
    .dot{display:inline-block;width:9px;height:9px;border-radius:50%;background:var(--node);margin-right:5px}
    .dash{display:inline-block;width:22px;border-top:2px dashed var(--accent);margin:0 5px 3px 0}
    footer{margin-top:12px;color:var(--muted);font-size:12px;line-height:1.6}
    @media(max-width:720px){header{align-items:flex-start;flex-direction:column}.stats{width:100%;margin-left:0}.canvas{border-radius:12px}svg{min-height:500px}.caption{align-items:flex-start;flex-direction:column}}
  </style>
</head>
<body>
<main>
  <header>
    <div>
      <h1>사람 관계 임베딩 지도</h1>
      <p class="lede">KURE-v1 근접 이웃 구조를 익명화해 확인하는 검증용 미리보기</p>
    </div>
    <span class="badge">추천 결과 아님 · evidence retrieval 진단</span>
  </header>
  <div class="toolbar" aria-label="지도 표시 제어">
    <button id="relationButton" type="button" aria-pressed="true">관계 중심</button>
    <button id="atlasButton" type="button" aria-pressed="false">2D 투영</button>
    <label for="personSelect">선택 인물</label>
    <select id="personSelect"></select>
    <span class="stats" id="stats"></span>
  </div>
  <section class="canvas" aria-label="익명화된 사람 임베딩 지도">
    <svg id="map" viewBox="0 0 1000 620" role="img" aria-labelledby="mapTitle mapDesc">
      <title id="mapTitle">익명화된 사람 관계 임베딩 지도</title>
      <desc id="mapDesc">선택한 인물과 세 명의 근접 이웃 또는 전체 이차원 투영을 보여줍니다.</desc>
    </svg>
    <div class="caption">
      <strong id="selectionLabel"></strong>
      <div class="legend"><span><i class="dot"></i>익명 인물</span><span><i class="dash"></i>정확한 top-3 이웃</span></div>
    </div>
  </section>
  <footer>
    이름·URL·본문·키워드·조직·원본 벡터를 제거하고 익명 ID, 2D 좌표, top-3 연결만 포함했습니다.
    관계 중심 화면의 세 선은 선택 인물의 실제 top-3 이웃이며, 배경은 상호 top-3 관계의 spring layout입니다.
  </footer>
</main>
<script>
const DATA=${JSON.stringify(preview)};
const SVG_NS="http://www.w3.org/2000/svg";
const byId=new Map(DATA.nodes.map(function(node){return [node.id,node]}));
let mode=new URLSearchParams(location.search).get("mode")==="atlas"?"atlas":"relation";
let selected=DATA.nodes[0].id;
const map=document.getElementById("map");
const select=document.getElementById("personSelect");
const relationButton=document.getElementById("relationButton");
const atlasButton=document.getElementById("atlasButton");
const selectionLabel=document.getElementById("selectionLabel");
const stats=document.getElementById("stats");
function element(name,attrs){const node=document.createElementNS(SVG_NS,name);Object.entries(attrs||{}).forEach(function(entry){node.setAttribute(entry[0],String(entry[1]))});return node}
function scale(value,min,max,outMin,outMax){return outMin+(value-min)*(outMax-outMin)/(max-min||1)}
function bounds(key){const values=DATA.nodes.map(function(node){return node[key]});return [Math.min.apply(null,values),Math.max.apply(null,values)]}
const relationX=bounds("rx"),relationY=bounds("ry"),atlasX=bounds("x"),atlasY=bounds("y");
function relationPoint(node){return [scale(node.rx,relationX[0],relationX[1],55,945),scale(node.ry,relationY[0],relationY[1],565,55)]}
function atlasPoint(node){return [scale(node.x,atlasX[0],atlasX[1],45,955),scale(node.y,atlasY[0],atlasY[1],570,50)]}
function activate(node,callback,label){node.setAttribute("role","button");node.setAttribute("tabindex","0");node.setAttribute("aria-label",label);node.addEventListener("click",callback);node.addEventListener("keydown",function(event){if(event.key==="Enter"||event.key===" "){event.preventDefault();callback()}})}
function choose(id){selected=id;select.value=id;draw()}
function drawRelation(){
  const focus=[selected].concat(DATA.neighbors[selected]||[]);
  const focusSet=new Set(focus);
  const edges=element("g",{"aria-hidden":"true"});
  DATA.contextEdges.forEach(function(edge){if(focusSet.has(edge[0])||focusSet.has(edge[1]))return;const a=byId.get(edge[0]),b=byId.get(edge[1]);if(!a||!b)return;const p=relationPoint(a),q=relationPoint(b);edges.append(element("line",{x1:p[0],y1:p[1],x2:q[0],y2:q[1],class:"context-edge"}))});
  map.append(edges);
  DATA.nodes.forEach(function(node){if(focusSet.has(node.id))return;const point=relationPoint(node);const circle=element("circle",{cx:point[0],cy:point[1],r:4.2,class:"background-node"});activate(circle,function(){choose(node.id)},node.id+" 관계 보기");map.append(circle)});
  const centre=[500,310],positions=[[500,86],[730,448],[270,448]];
  const candidates=DATA.neighbors[selected]||[];
  candidates.forEach(function(id,index){const point=positions[index];map.append(element("line",{x1:centre[0],y1:centre[1],x2:point[0],y2:point[1],class:"focus-halo"}));map.append(element("line",{x1:centre[0],y1:centre[1],x2:point[0],y2:point[1],class:"focus-edge"}))});
  [selected].concat(candidates).forEach(function(id,index){const point=index===0?centre:positions[index-1];const group=element("g",{class:"focus-node"+(index===0?" centre":""),transform:"translate("+point[0]+" "+point[1]+")"});activate(group,function(){choose(id)},id+(index===0?" 선택 인물":" 근접 이웃 "+index));group.append(element("circle",{r:index===0?31:26}));const initial=element("text",{x:0,y:5,class:"initial"});initial.textContent=id.slice(-3);group.append(initial);const label=element("text",{x:0,y:index===0?51:46});label.textContent=id;group.append(label);map.append(group)});
  stats.textContent=DATA.stats.nodes+"명 · layout edge "+DATA.stats.layout_edges+"개 · 선택 top-3";
}
function drawAtlas(){
  DATA.nodes.forEach(function(node){const point=atlasPoint(node);const circle=element("circle",{cx:point[0],cy:point[1],r:node.id===selected?7:4.2,class:"atlas-node"+(node.id===selected?" selected":"")});activate(circle,function(){choose(node.id)},node.id+" 선택");map.append(circle)});
  stats.textContent=DATA.stats.nodes+"명 · KURE-v1 "+DATA.model.dimensions+"차원 → 2D · 연결선 0개";
}
function draw(){while(map.lastChild&&map.lastChild.nodeName!=="desc"&&map.lastChild.nodeName!=="title")map.removeChild(map.lastChild);if(mode==="relation")drawRelation();else drawAtlas();relationButton.setAttribute("aria-pressed",String(mode==="relation"));atlasButton.setAttribute("aria-pressed",String(mode==="atlas"));selectionLabel.textContent=selected+" · "+(mode==="relation"?"top-3 관계":"2D 위치")}
DATA.nodes.forEach(function(node){const option=document.createElement("option");option.value=node.id;option.textContent=node.id;select.append(option)});
select.addEventListener("change",function(){choose(select.value)});
relationButton.addEventListener("click",function(){mode="relation";draw()});
atlasButton.addEventListener("click",function(){mode="atlas";draw()});
draw();
</script>
</body>
</html>`;

writeFileSync(outputPath, html);
console.log(
  JSON.stringify({
    output: outputPath,
    bytes: Buffer.byteLength(html),
    nodes: nodes.length,
    contextEdges: contextEdges.length,
    rawPersonFieldsIncluded: false,
    sourceSha256: preview.sourceSha256,
  }),
);
