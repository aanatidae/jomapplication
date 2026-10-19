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
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src https: data:; connect-src 'none'">
<style>${assets.css}
html,body,#map{height:100%;margin:0;background:#F5F5EF;font-family:system-ui,sans-serif}
.leaflet-control-zoom a{width:44px;height:44px;line-height:44px}
.leaflet-control-attribution{font-size:11px;max-width:85%;white-space:normal}
.jom-endpoint{background:#172F2C;color:white;border:2px solid white;border-radius:50%;text-align:center;line-height:28px;font-weight:700;font-size:16px}
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
const drawings=L.layerGroup().addTo(map);let lastRoute=null,lastLocation=null;
window.jomUpdate=state=>{
drawings.clearLayers();
const ordered=state.routes.filter(r=>r.id!==state.selected).concat(state.routes.filter(r=>r.id===state.selected));
ordered.forEach(r=>L.polyline(r.geometry.map(p=>[p[1],p[0]]),{color:r.id===state.selected?'#006653':'#52635D',weight:r.id===state.selected?7:4,opacity:1,interactive:false}).addTo(drawings));
const marker=(point,label,color)=>{if(!point)return;L.marker([point.latitude,point.longitude],{icon:L.divIcon({className:'jom-endpoint',html:label,iconSize:[32,32],iconAnchor:[16,16]})}).addTo(drawings);};
marker(state.origin,'A');marker(state.destination,'B');
if(state.currentLocation)L.circleMarker([state.currentLocation.latitude,state.currentLocation.longitude],{radius:8,color:'#fff',fillColor:'#1264A3',fillOpacity:1,weight:3}).addTo(drawings);
const selected=state.routes.find(r=>r.id===state.selected);
if(selected){selected.geometry.filter((_,i)=>i===0||i===selected.geometry.length-1).forEach(p=>L.circleMarker([p[1],p[0]],{radius:5,color:'#172F2C',fillColor:'#fff',fillOpacity:1,weight:2,interactive:false}).addTo(drawings));
if(lastRoute!==selected.id){map.fitBounds(L.latLngBounds(selected.geometry.map(p=>[p[1],p[0]])),{padding:[36,36],maxZoom:18,animate:false});lastRoute=selected.id;}}
const locationKey=JSON.stringify(state.currentLocation);
if(state.currentLocation&&lastLocation!==locationKey){map.setView([state.currentLocation.latitude,state.currentLocation.longitude],17,{animate:false});lastLocation=locationKey;}
};
map.on('click',e=>send({type:'pick',latitude:e.latlng.lat,longitude:e.latlng.lng}));
window.addEventListener('resize',()=>map.invalidateSize());
send({type:'ready'});
</script></body></html>`;
