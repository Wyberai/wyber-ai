// Isolation for published apps rendered on wyberai.com/app/[slug].
//
// Published apps are user-generated code. They used to run in a srcDoc iframe
// with sandbox="allow-scripts allow-same-origin", which gives the app the
// wyberai.com origin: any published app could read a visiting WyberAi user's
// cookies (the session) and localStorage, and every other app's stored data.
//
// Now the iframe has NO allow-same-origin, so the app runs in an opaque
// origin and can't touch wyberai.com. Opaque origins can't use localStorage,
// sessionStorage or document.cookie, so this shim (injected as the first
// script in the app's <head>) provides working replacements:
//   - localStorage: in-memory, seeded from the parent with ONLY this app's
//     saved data, and every write posted to the parent, which persists it
//     under `wyber-app:<slug>:` (SandboxedApp.tsx). One app can never see
//     another app's data or anything else on wyberai.com.
//   - sessionStorage / document.cookie: in-memory for the page's life.
//   - navigator.sendBeacon: JSON blobs re-sent as text/plain (CORS-safelisted)
//     so the analytics / live-error beacons keep working from the opaque
//     origin — including in apps published before this change.

export const PUBLISHED_APP_SANDBOX = 'allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads'

export const STORAGE_MESSAGE_FLAG = '__wyberStorage'

export function storagePrefix(slug: string): string {
  return `wyber-app:${slug}:`
}

export function buildStorageShim(seed: Record<string, string>): string {
  // JSON.stringify + "<" escaping so seed data can't close the script tag.
  const seedJson = JSON.stringify(seed).replace(/</g, '\\u003c')
  return `<script>(function(){
var FLAG=${JSON.stringify(STORAGE_MESSAGE_FLAG)};
function post(m){try{m[FLAG]=1;parent.postMessage(m,'*')}catch(e){}}
function makeStorage(data,persist){
  var api={
    getItem:function(k){k=String(k);return Object.prototype.hasOwnProperty.call(data,k)?data[k]:null},
    setItem:function(k,v){k=String(k);v=String(v);data[k]=v;if(persist)post({op:'set',k:k,v:v})},
    removeItem:function(k){k=String(k);delete data[k];if(persist)post({op:'remove',k:k})},
    clear:function(){for(var k in data)delete data[k];if(persist)post({op:'clear'})},
    key:function(i){var ks=Object.keys(data);return i>=0&&i<ks.length?ks[i]:null}
  };
  Object.defineProperty(api,'length',{get:function(){return Object.keys(data).length}});
  return api;
}
function install(name,store){
  try{var s=window[name];s.length;return}catch(e){}
  try{Object.defineProperty(window,name,{value:store,configurable:true,writable:false})}catch(e){}
}
install('localStorage',makeStorage(${seedJson},true));
install('sessionStorage',makeStorage({},false));
try{document.cookie}catch(e){
  var jar={};
  try{Object.defineProperty(document,'cookie',{configurable:true,
    get:function(){return Object.keys(jar).map(function(k){return k+'='+jar[k]}).join('; ')},
    set:function(v){var p=String(v).split(';')[0];var i=p.indexOf('=');if(i>0)jar[p.slice(0,i).trim()]=p.slice(i+1).trim()}})}catch(e2){}
}
try{
  var sb=navigator.sendBeacon&&navigator.sendBeacon.bind(navigator);
  if(sb)navigator.sendBeacon=function(url,data){
    if(data&&typeof Blob!=='undefined'&&data instanceof Blob&&data.type&&!/^(text\\/plain|application\\/x-www-form-urlencoded|multipart\\/form-data)/i.test(data.type)){
      data=new Blob([data],{type:'text/plain;charset=UTF-8'})}
    return sb(url,data)};
}catch(e){}
})();</script>`
}

/** Put the shim before any other script: right after <head>, else at the very top. */
export function injectStorageShim(html: string, seed: Record<string, string>): string {
  const shim = buildStorageShim(seed)
  const m = html.match(/<head[^>]*>/i)
  return m ? html.replace(m[0], `${m[0]}${shim}`) : shim + html
}
