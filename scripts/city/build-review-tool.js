import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { cityArgument, invokedDirectly } from './pipeline.js';

export async function buildTrailReviewTool(city = cityArgument()) {
  const root = resolve('data/cities', city);
  const routedPath = resolve(root, 'trail-pilots-routed.json');
  const candidatePath = resolve(root, 'trail-pilots.json');
  const packet = await readOptionalJson(routedPath) ?? await readJson(candidatePath);
  const reviewedSource = await readOptionalJson(resolve(root, 'trails-review.json'));
  const artifact = await readJson(resolve('public/cities', city, packet.sourceArtifact.artifact));
  const trees = new Map(artifact.trees.map(tuple => [String(tuple[0]), tuple]));
  const reviewPacket = {
    ...packet,
    reviews: matchingReviews(reviewedSource?.trails ?? [], packet.candidates),
    candidates: packet.candidates.map(candidate => ({
      ...candidate,
      clusterStops: candidate.clusterStops.map(stop => ({
        ...stop,
        memberTrees: stop.memberTreeIds.map(id => reviewTree(trees.get(String(id)), artifact.species, stop.themeTreeIds.includes(String(id))))
      }))
    }))
  };
  const outputPath = resolve('docs/m3-b/review-tool.html');
  await writeFile(outputPath, reviewToolHtml(reviewPacket));
  return { outputPath, candidateCount: reviewPacket.candidates.length, routed: reviewPacket.candidates.every(candidate => candidate.routing?.status === 'routed') };
}

function matchingReviews(trails, candidates) {
  const byId = new Map(candidates.map(candidate => [candidate.id, candidate]));
  return trails.flatMap(trail => {
    const candidate = byId.get(trail.candidateId);
    if (!candidate || !isDeepStrictEqual(trail.route, candidate.route) || !isDeepStrictEqual(trail.clusterStops, candidate.clusterStops)) return [];
    return [{ candidateId: candidate.id, decision: 'approved', name: trail.name, narrative: trail.narrative, reviewer: trail.review.reviewer, reviewedAt: trail.review.reviewedAt }];
  });
}

function reviewTree(tuple, species, themeMatch) {
  if (!tuple) throw new TypeError('Pilot cluster references a missing public-tree record');
  return {
    id: String(tuple[0]),
    latitude: Number(tuple[1]),
    longitude: Number(tuple[2]),
    commonName: titleCase(species[tuple[3]]?.commonName ?? 'Name not recorded'),
    address: titleCase(tuple[7] ?? 'Address not recorded'),
    themeMatch
  };
}

function titleCase(value) {
  return String(value).toLowerCase().replace(/\b\p{L}/gu, letter => letter.toUpperCase());
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

async function readOptionalJson(path) {
  try { return await readJson(path); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

function reviewToolHtml(packet) {
  const embedded = JSON.stringify(packet).replace(/<\//g, '<\\/');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Treeways pilot review</title>
<style>
:root{font-family:Inter,ui-sans-serif,system-ui,sans-serif;color:#26352b;background:#f4f0e6}*{box-sizing:border-box}body{margin:0}button,input,textarea{font:inherit}button{cursor:pointer}.shell{display:grid;grid-template-columns:280px minmax(0,1fr);min-height:100vh}.sidebar{padding:24px 18px;background:#26352b;color:#fff}.sidebar h1{font-family:Georgia,serif;font-size:26px;margin:0 0 8px}.sidebar p{color:#d8e1d7;line-height:1.45}.candidate-list{display:grid;gap:9px;margin-top:22px}.candidate{width:100%;text-align:left;padding:12px;border:1px solid #59715f;border-radius:12px;background:#31483a;color:#fff}.candidate[aria-current=true]{background:#f4f0e6;color:#26352b}.candidate small{display:block;margin-top:5px;color:inherit;opacity:.75}.main{padding:28px;max-width:1160px;width:100%;margin:auto}.status{padding:12px 14px;border-radius:10px;background:#fff5cf;border:1px solid #d7bd59}.status.routed{background:#e7f1e6;border-color:#7fa580}.grid{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(300px,.8fr);gap:22px;margin-top:20px}.card{background:#fffdf7;border:1px solid #d9d2c4;border-radius:16px;padding:20px}.card h2,.card h3{font-family:Georgia,serif}.map{width:100%;aspect-ratio:1.45;border-radius:12px;background:#edf0e9;border:1px solid #ccd5c9}.route{fill:none;stroke:#9a5a3a;stroke-width:4;stroke-linecap:round;stroke-linejoin:round}.member{fill:#50745b;opacity:.75}.member.theme{fill:#ce6b79;opacity:1}.area{fill:none;stroke:#2f5640;stroke-width:2}.anchor{fill:#26352b;stroke:#fff;stroke-width:2}.legend{display:flex;gap:16px;flex-wrap:wrap;font-size:13px;margin-top:10px}.meta{display:flex;gap:10px;flex-wrap:wrap}.pill{padding:6px 9px;border-radius:999px;background:#edf0e9;font-size:13px}.areas{display:grid;gap:10px;padding:0;list-style:none}.areas li{padding:11px;border:1px solid #ddd7cb;border-radius:10px}.areas small{display:block;color:#617064;margin-top:3px}.members{max-height:180px;overflow:auto;font-size:12px;color:#506157;margin-top:8px}label{display:grid;gap:6px;font-weight:650;margin-top:13px}input,textarea{width:100%;padding:10px;border:1px solid #a9b1a8;border-radius:8px;background:#fff}textarea{min-height:100px;resize:vertical}.unknowns{padding:11px;background:#f1eee6;border-radius:10px;font-size:13px;line-height:1.5}.actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:16px}.primary,.secondary,.danger{border-radius:10px;padding:10px 13px;border:0}.primary{background:#315d40;color:#fff}.secondary{background:#e5e9e2;color:#26352b}.danger{background:#f4dddd;color:#782d2d}.primary:disabled{opacity:.45;cursor:not-allowed}.download{position:sticky;bottom:16px;margin-top:22px;width:100%}.decision{font-weight:700;margin-top:12px}.provenance{font-size:12px;color:#627067;word-break:break-word}@media(max-width:800px){.shell{grid-template-columns:1fr}.grid{grid-template-columns:1fr}.main{padding:18px}.sidebar{position:static}}
</style>
</head>
<body>
<div class="shell"><aside class="sidebar"><h1>Treeways review</h1><p>Three density-first Vancouver pilots. Generated and routed candidates remain unpublished until you approve them here.</p><div id="candidate-list" class="candidate-list"></div><button id="download" class="primary download" disabled>Download reviewed.json</button></aside><main class="main"><div id="status" class="status"></div><div id="content"></div></main></div>
<script type="application/json" id="review-data">${embedded}</script>
<script>
const packet=JSON.parse(document.getElementById('review-data').textContent);const decisions=new Map((packet.reviews||[]).map(review=>[review.candidateId,review]));let selected=packet.candidates[0];
const forbidden=/\\b(accessible|accessibility|safe|safety|walkable|walkability|walking route|pedestrian-safe|permission|edible|bloom|harvest|open to the public)\\b/i;
function esc(value){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))}
function distance(candidate){return candidate.route?Number(candidate.route.distanceM/1000).toFixed(1)+' km':'Not routed'}
function renderList(){const root=document.getElementById('candidate-list');root.innerHTML='';packet.candidates.forEach(candidate=>{const button=document.createElement('button');button.className='candidate';button.setAttribute('aria-current',candidate.id===selected.id);button.innerHTML='<strong>'+esc(candidate.neighbourhoodName)+'</strong><small>'+esc(candidate.theme.displayName)+' · '+distance(candidate)+'</small><small>'+(decisions.get(candidate.id)?.decision||'Not reviewed')+'</small>';button.onclick=()=>{selected=candidate;render()};root.append(button)});const approved=[...decisions.values()].filter(item=>item.decision==='approved').length;const download=document.getElementById('download');download.disabled=!approved;download.textContent='Download reviewed.json ('+approved+')'}
function svg(candidate){const members=candidate.clusterStops.flatMap(stop=>stop.memberTrees);const route=candidate.route?.geometry?.coordinates||[];const points=[...members.map(tree=>[tree.longitude,tree.latitude]),...route];const xs=points.map(point=>point[0]),ys=points.map(point=>point[1]);const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);const scale=(point)=>[30+(point[0]-minX)/Math.max(maxX-minX,.0001)*740,470-(point[1]-minY)/Math.max(maxY-minY,.0001)*420];const path=route.length?'<polyline class="route" points="'+route.map(point=>scale(point).join(',')).join(' ')+'"/>':'';const dots=members.map(tree=>{const p=scale([tree.longitude,tree.latitude]);return '<circle class="member '+(tree.themeMatch?'theme':'')+'" cx="'+p[0]+'" cy="'+p[1]+'" r="3"/>'}).join('');const areas=candidate.clusterStops.map((stop,index)=>{const p=scale([stop.anchor.longitude,stop.anchor.latitude]);return '<circle class="area" cx="'+p[0]+'" cy="'+p[1]+'" r="18"/><circle class="anchor" cx="'+p[0]+'" cy="'+p[1]+'" r="7"/><text x="'+p[0]+'" y="'+(p[1]+4)+'" text-anchor="middle" fill="white" font-size="10">'+(index+1)+'</text>'}).join('');return '<svg class="map" viewBox="0 0 800 500" role="img" aria-label="Candidate clusters and routed path">'+path+dots+areas+'</svg>'}
function orderedAreas(candidate){if(!candidate.route)return candidate.clusterStops;const byId=new Map(candidate.clusterStops.map(stop=>[stop.id,stop]));return candidate.route.anchorOrder.map(id=>byId.get(id)).filter((stop,index,all)=>stop&&(index===0||stop.id!==all[0].id))}
function render(){renderList();const routed=selected.routing?.status==='routed';const prior=decisions.get(selected.id);const status=document.getElementById('status');status.className='status'+(routed?' routed':'');status.textContent=prior?.decision==='approved'?'Human reviewed by '+prior.reviewer+' on '+prior.reviewedAt+'.':routed?'Routed with OpenRouteService foot-walking. Still NOT HUMAN REVIEWED.':'Routing is required before this candidate can be approved. Add the ORS key and run npm run city:route-pilots.';const areas=orderedAreas(selected);const total=new Set(selected.clusterStops.flatMap(stop=>stop.memberTreeIds)).size;document.getElementById('content').innerHTML='<div class="grid"><section class="card"><p class="provenance">'+esc(selected.id)+'</p><h2>'+esc(selected.neighbourhoodName)+' · '+esc(selected.theme.displayName)+'</h2><div class="meta"><span class="pill">'+distance(selected)+'</span><span class="pill">'+esc(selected.shape||'shape pending')+'</span><span class="pill">'+selected.clusterStops.length+' areas</span><span class="pill">'+total+' distinct trees</span></div>'+svg(selected)+'<div class="legend"><span>● all recorded trees</span><span style="color:#ce6b79">● theme records</span><span style="color:#9a5a3a">— ORS walking geometry</span></div><h3>Cluster membership and order</h3><ol class="areas">'+areas.map((stop,index)=>'<li><strong>'+(index+1)+'. '+esc(stop.locationLabel)+'</strong><small>'+stop.totalTreeCount+' trees · '+stop.themeTreeCount+' '+esc(selected.theme.displayName)+' records · '+stop.diversityCount+' recorded kinds</small><details class="members"><summary>Inspect '+stop.memberTrees.length+' member records</summary>'+stop.memberTrees.map(tree=>esc(tree.commonName)+' · '+esc(tree.address)+' · '+esc(tree.id)).join('<br>')+'</details></li>').join('')+'</ol><p class="provenance">'+esc(selected.route?.provenance?.attribution||'No route provenance yet')+'</p></section><section class="card"><h2>Human decision</h2><p>Review the cluster membership, routed shape, order, name, narrative, and limitations. The tool does not assert street-level safety or access.</p><label>Name<input id="name" value="'+esc(prior?.name||selected.theme.displayName+' in '+selected.neighbourhoodName)+'"></label><label>Narrative<textarea id="narrative">'+esc(prior?.narrative||areas.length+' tree-rich areas selected for overall public-tree density, with '+selected.theme.displayName+' records highlighted.')+'</textarea></label><div class="unknowns"><strong>Required unknowns</strong><br>Accessibility: unknown<br>Pedestrian plausibility: unknown<br>Safety: unknown<br>Right of access: unknown<br>Live conditions: unknown</div><label>Reviewer<input id="reviewer" value="'+esc(prior?.reviewer||'')+'" autocomplete="name"></label><label>Reviewed date<input id="date" type="date" value="'+esc(prior?.reviewedAt||new Date().toISOString().slice(0,10))+'"></label><div class="actions"><button id="approve" class="primary" '+(routed?'':'disabled')+'>Approve candidate</button><button id="reject" class="danger">Reject candidate</button></div><p id="message" class="decision">'+esc(prior?prior.decision:'Not reviewed')+'</p></section></div>';document.getElementById('approve').onclick=approve;document.getElementById('reject').onclick=reject}
function approve(){const name=document.getElementById('name').value.trim(),narrative=document.getElementById('narrative').value.trim(),reviewer=document.getElementById('reviewer').value.trim(),reviewedAt=document.getElementById('date').value;const message=document.getElementById('message');if(!name||!narrative||!reviewer||!/^\\d{4}-\\d{2}-\\d{2}$/.test(reviewedAt)){message.textContent='Complete the name, narrative, reviewer, and date.';return}if(forbidden.test(narrative)){message.textContent='Narrative contains an unsupported claim word.';return}if(/\\b(ai|agent|model)\\b/i.test(reviewer)){message.textContent='Reviewer must identify the human reviewer.';return}decisions.set(selected.id,{decision:'approved',name,narrative,reviewer,reviewedAt});render()}
function reject(){decisions.set(selected.id,{decision:'rejected'});render()}
function reviewedTrail(candidate,draft){const id=candidate.id.replace(/^candidate-/,'');return {...candidate,id,status:'human-reviewed',cityId:'vancouver',candidateId:candidate.id,candidateGeneratorVersion:packet.candidateGeneratorVersion,sourceSnapshotSha256:packet.sourceArtifact.sourceSnapshotSha256,name:draft.name,narrative:draft.narrative,accessibilityNotes:'unknown',pedestrianPlausibility:'unknown',safetyNotes:'unknown',rightOfAccess:'unknown',liveConditions:'unknown',review:{status:'human-reviewed',reviewer:draft.reviewer,reviewedAt:draft.reviewedAt},caveats:['Generated density clusters and ORS foot-walking route were human reviewed; accessibility, safety, access, and live conditions remain unknown.']}}
document.getElementById('download').onclick=()=>{const trails=packet.candidates.filter(candidate=>decisions.get(candidate.id)?.decision==='approved').map(candidate=>reviewedTrail(candidate,decisions.get(candidate.id)));const output={schemaVersion:2,cityId:'vancouver',sourceSnapshotSha256:packet.sourceArtifact.sourceSnapshotSha256,candidateGeneratorVersion:packet.candidateGeneratorVersion,trails};const blob=new Blob([JSON.stringify(output,null,2)+'\\n'],{type:'application/json'});const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download='trails-review.json';link.click();URL.revokeObjectURL(link.href)};
render();
</script>
</body>
</html>\n`;
}

if (invokedDirectly(import.meta.url)) {
  const result = await buildTrailReviewTool();
  console.log(`Built ${result.candidateCount}-pilot review tool (${result.routed ? 'routed' : 'routing pending'}).`);
}
