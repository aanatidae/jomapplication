import assets from './leafletAssets.json';

// Only numeric coordinates/route IDs cross the WebView bridge. User content is
// never concatenated into HTML, popups or executable source.
export function scriptJson(value: unknown): string {
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, character => `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`);
}
const configuredTiles = process.env.EXPO_PUBLIC_MAP_TILE_URL;
const tileUrl = configuredTiles?.startsWith('https://') && ['{z}', '{x}', '{y}'].every(token => configuredTiles.includes(token)) ? configuredTiles : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const providerName = process.env.EXPO_PUBLIC_MAP_TILE_ATTRIBUTION ?? 'OpenStreetMap contributors';

export const leafletDocument = `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src https: data:; connect-src 'none'">
<style>${assets.css}
html,body,#map{height:100%;margin:0;background:#F5F5EF;font-family:system-ui,sans-serif}
.leaflet-control-zoom a{width:44px;height:44px;line-height:44px}
.leaflet-control-attribution{font-size:11px;max-width:85%;white-space:normal}
.jom-endpoint{background:#172F2C;color:white;border:2px solid white;border-radius:50%;text-align:center;line-height:28px;font-weight:700;font-size:16px}
.jom-puck{background:#234D78;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px #172F2C66}
.jom-heading{position:absolute;left:5px;top:-12px;width:10px;height:10px;background:#234D78;transform:rotate(45deg)}
</style></head><body><div id="map" role="application" aria-label="Interactive Brickfields walking map"></div>
<script>${assets.js}
const send=value=>window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify(value));
const map=L.map('map',{center:[3.1334,101.6869],zoom:16,minZoom:12,maxZoom:20,zoomAnimation:false,fadeAnimation:false,markerZoomAnimation:false});
const layer=L.tileLayer(${scriptJson(tileUrl)},{maxNativeZoom:19,maxZoom:20,keepBuffer:0,updateWhenIdle:true,
attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'}).addTo(map);
// A configured provider's additional attribution is text, never provider-supplied HTML.
const provider=document.createElement('span');provider.textContent=${scriptJson(providerName)};
if(provider.textContent!=='OpenStreetMap contributors')map.attributionControl.addAttribution(provider.outerHTML);
layer.on('tileerror',()=>send({type:'tile_error'}));layer.on('tileload',()=>send({type:'tile_loaded'}));
L.circle([3.1334,101.6869],{radius:2000,color:'#52635D',weight:1,fill:false,dashArray:'6 6',interactive:false}).addTo(map);
const drawings=L.layerGroup().addTo(map),progressLayer=L.layerGroup().addTo(map);
let lastRoute=null,lastLocation=null,lastStatic=null,lastInsets=null,lastFollowing=false,localFollowing=true,puck=null,accuracyCircle=null;
const explore=()=>{localFollowing=false;send({type:'explore'});};
map.on('dragstart',explore);
map.getContainer().addEventListener('touchstart',()=>map.stop(),{passive:true});
map.getContainer().addEventListener('wheel',explore,{passive:true});
map.on('zoomstart',()=>{if(!programmatic)explore();});
let programmatic=false;
window.jomUpdate=state=>{
if(state.following&&!lastFollowing)localFollowing=true;
const insetKey=JSON.stringify(state.insets),height=map.getSize().y;
const top=Math.min(state.insets?.top||0,height*0.35),bottom=Math.min(state.insets?.bottom||0,height*0.55);
const staticKey=JSON.stringify([state.routes,state.selected,state.origin,state.destination,state.navigating,insetKey]);
if(staticKey!==lastStatic){
drawings.clearLayers();
const ordered=state.routes.filter(r=>r.id!==state.selected).concat(state.routes.filter(r=>r.id===state.selected));
ordered.forEach(r=>L.polyline(r.geometry.map(p=>[p[1],p[0]]),{color:r.id===state.selected?(state.navigating?'#7C8B82':'#006653'):'#52635D',weight:r.id===state.selected?7:4,opacity:1,interactive:false}).addTo(drawings));
const marker=(point,label,color)=>{if(!point)return;L.marker([point.latitude,point.longitude],{icon:L.divIcon({className:'jom-endpoint',html:label,iconSize:[32,32],iconAnchor:[16,16]})}).addTo(drawings);};
marker(state.origin,'A');marker(state.destination,'B');
const selected=state.routes.find(r=>r.id===state.selected);
if(selected){selected.geometry.filter((_,i)=>i===0||i===selected.geometry.length-1).forEach(p=>L.circleMarker([p[1],p[0]],{radius:5,color:'#172F2C',fillColor:'#fff',fillOpacity:1,weight:2,interactive:false}).addTo(drawings));
if((lastRoute!==selected.id||lastInsets!==insetKey)&&!state.navigating){programmatic=true;map.fitBounds(L.latLngBounds(selected.geometry.map(p=>[p[1],p[0]])),{paddingTopLeft:[24,top+12],paddingBottomRight:[24,bottom+12],maxZoom:18,animate:false});programmatic=false;}lastRoute=selected.id;}
lastStatic=staticKey;}
progressLayer.clearLayers();
if(state.remainingPath)L.polyline(state.remainingPath.map(p=>[p[1],p[0]]),{color:'#006653',weight:8,interactive:false}).addTo(progressLayer);
const locationKey=JSON.stringify(state.currentLocation);
if(state.currentLocation){
const latlng=[state.currentLocation.latitude,state.currentLocation.longitude];
const icon=L.divIcon({className:'jom-puck',html:typeof state.heading==='number'?'<svg width="40" height="40" viewBox="0 0 40 40" style="position:absolute;left:-10px;top:-10px;transform:rotate('+state.heading+'deg)"><path d="M20 0L14 12H26Z" fill="#234D78"/></svg>':'',iconSize:[20,20],iconAnchor:[13,13]});
if(!puck)puck=L.marker(latlng,{icon,interactive:false,zIndexOffset:1000}).addTo(map);else {puck.setIcon(icon);puck.setLatLng(latlng);}
if(puck.getElement())puck.getElement().style.transition=state.reducedMotion?'none':'transform 250ms cubic-bezier(0.23,1,0.32,1)';
if(accuracyCircle)accuracyCircle.remove();
if(typeof state.accuracy==='number')accuracyCircle=L.circle(latlng,{radius:state.accuracy,color:'#234D78',weight:1,fillOpacity:0.08,interactive:false}).addTo(map);
if(state.following!==false&&localFollowing&&(lastLocation!==locationKey||!lastFollowing||lastInsets!==insetKey)){programmatic=true;map.stop();const zoom=state.navigating?18:17;const pixel=map.project(latlng,zoom);pixel.y+=(bottom-top)/2;map.setView(map.unproject(pixel,zoom),zoom,{animate:!state.reducedMotion,duration:0.25});programmatic=false;}
lastLocation=locationKey;
}else{if(puck)puck.remove();puck=null;if(accuracyCircle)accuracyCircle.remove();accuracyCircle=null;}
lastFollowing=!!state.following;
lastInsets=insetKey;
};
map.on('click',e=>send({type:'pick',latitude:e.latlng.lat,longitude:e.latlng.lng}));
window.addEventListener('resize',()=>map.invalidateSize());
send({type:'ready'});
</script></body></html>`;
