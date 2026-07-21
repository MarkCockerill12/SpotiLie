function C(){try{let Q={__cmpCall:function(){},__tcfapiCall:function(){},postMessage:function($){try{if($&&typeof $==="object"&&$.__cmpCall){let z=$.__cmpCall;window.postMessage({__cmpReturn:{returnValue:{eventStatus:"tcloaded",gdprApplies:!1},success:!0,callId:z?z.callId:null}},"*")}}catch(z){}}};Q.contentWindow=Q,Q.frames=Q,Q.__cmpLocator=Q,Q.__tcfapiLocator=Q;try{let $=Object.getOwnPropertyDescriptor(MessageEvent.prototype,"source");if($&&$.get){let z=$.get;Object.defineProperty(MessageEvent.prototype,"source",{get:function(){return z.call(this)||Q},configurable:!0})}}catch($){}try{if(!("__cmpCall"in Object.prototype))Object.defineProperty(Object.prototype,"__cmpCall",{get:function(){return Q.__cmpCall},configurable:!0});if(!("__tcfapiCall"in Object.prototype))Object.defineProperty(Object.prototype,"__tcfapiCall",{get:function(){return Q.__tcfapiCall},configurable:!0})}catch($){}let Y=[window,window.top,window.parent,globalThis];for(let $ of Y){if(!$)continue;try{$.__cmpLocator=Q,$.__tcfapiLocator=Q,$.__cmpCall=Q.__cmpCall}catch(z){}}try{let $=window.addEventListener;window.addEventListener=function(z,V,K){if(z==="message"&&typeof V==="function"){let X=function(_){try{if(_&&typeof _==="object"&&"source"in _)try{Object.defineProperty(_,"source",{get:()=>Q,configurable:!0})}catch(G){}return V.apply(this,arguments)}catch(G){if(G&&G.message&&(G.message.includes("__cmpCall")||G.message.includes("__cmp"))){console.warn("SpotiLIE: Suppressed CMP error in message listener:",G.message);return}throw G}};return $.call(this,z,X,K)}return $.call(this,z,V,K)}}catch($){}if(window.addEventListener("unhandledrejection",($)=>{let z=$.reason?.message||String($.reason||"");if(z.includes("__cmpCall")||z.includes("__cmp"))$.preventDefault()},!0),!window.__cmp){let $=function(){let z=Array.from(arguments);if(typeof z[2]==="function")try{z[2]({eventStatus:"tcloaded",gdprApplies:!1},!0)}catch(V){}};$.a=[],window.__cmp=$}if(!window.__tcfapi){let $=function(z,V,K){if(typeof K==="function")try{K({eventStatus:"tcloaded",gdprApplies:!1,tcString:"CP1234567890",listenerId:1},!0)}catch(X){}};$.a=[],window.__tcfapi=$}let Z=($)=>{try{let z=document.querySelector(`iframe[name="${$}"]`);if(!z){z=document.createElement("iframe"),z.name=$,z.id=$,z.style.display="none";let V=document.body||document.documentElement||document.head;if(V)V.appendChild(z)}if(z&&z.contentWindow)try{z.contentWindow.__cmpCall=Q.__cmpCall,z.contentWindow.__tcfapiCall=Q.__tcfapiCall}catch(V){}}catch(z){}};if(Z("__cmpLocator"),Z("__tcfapiLocator"),document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>{Z("__cmpLocator"),Z("__tcfapiLocator")});window.addEventListener("message",($)=>{try{if($.data&&typeof $.data==="object"&&$.data.__cmpCall){let z=$.data.__cmpCall;if($.source&&typeof $.source.postMessage==="function")$.source.postMessage({__cmpReturn:{returnValue:{eventStatus:"tcloaded",gdprApplies:!1},success:!0,callId:z?z.callId:null}},"*")}}catch(z){}},!0),window.addEventListener("error",($)=>{if($.message&&($.message.includes("__cmpCall")||$.message.includes("__cmp")))console.warn("SpotiLIE: Suppressed CMP TypeError:",$.message),$.stopImmediatePropagation(),$.preventDefault()},!0),console.log("SpotiLIE: CMP stub & locator iframes initialized")}catch(Q){console.error("SpotiLIE: Failed to initialize CMP stub",Q)}}var A=["/ad-logic/","/ads/","/ad-service/","/commercial/","spclient.wg.spotify.com/ads","spclient.wg.spotify.com/ad-logic","spclient.wg.spotify.com/commercial","spclient.wg.spotify.com/sponsored","spclient.wg.spotify.com/rewarded","spclient.wg.spotify.com/v1/ads","spclient.wg.spotify.com/ad-service","spclient.wg.spotify.com/adbreak","api.spotify.com/v1/ads","audio-ads.spotify.com","adeventtracker.spotify.com","ads-fa.spotify.com","adgen.spotify.com","ad-proxy.spotify.com","adstudio.spotify.com","ads.spotify.com","pixel.spotify.com","video-ak.cdn.spotify.com","adjust-callback.spotify.com","crashdump.spotify.com","datasharing.spotify.com","doubleclick.net","googleadservices.com","googletagservices.com","googlesyndication.com","google-analytics.com","pagead2.googlesyndication.com","securepubads.g.doubleclick.net","moatads.com","comscore.com","scorecardresearch.com","branch.io","branchster.link","app.link","facebook.com/tr","facebook.net/en_US/fbevents.js","connect.facebook.net","admob.com","adsrvr.org","adnxs.com","casalemedia.com","criteo.com","rubiconproject.com","openx.net","pubmatic.com","freewheel.tv","spotxchange.com","liveramp.com","rlcdn.com"],b=new RegExp(A.map((Q)=>Q.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|"),"i");function R(Q){return b.test(Q)}function y(Q){let Y=new Headers({"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"*","Access-Control-Allow-Methods":"*"});if(Q.includes(".js"))return Y.set("Content-Type","application/javascript"),new Response("",{status:200,headers:Y});return Y.set("Content-Type","application/json"),new Response("{}",{status:200,headers:Y})}function W(Q){if(!Q||typeof Q!=="object")return;if(Q.isAd!==void 0)Q.isAd=!1;if(Q.is_advertisement!==void 0)Q.is_advertisement="false";if(Q.adBreak!==void 0)Q.adBreak=null;if(Q.ad_id!==void 0)delete Q.ad_id;if(Q.ad_type!==void 0)delete Q.ad_type;if(Q.advertisement!==void 0)delete Q.advertisement}function v(Q){if(!Q||typeof Q!=="object")return Q;if(Q.__spotilie_spoofed)return Q;try{Q.__spotilie_spoofed=!0}catch(Y){}if(Q.canPlayOnDemand!==void 0)Q.canPlayOnDemand=!0;if(Q.is_premium!==void 0)Q.is_premium=!0;if(Q.premium!==void 0&&typeof Q.premium==="boolean")Q.premium=!0;if(Q.product!==void 0&&typeof Q.product==="string"){if(Q.product==="free"||Q.product==="open")Q.product="premium"}if(Q.streaming_rules)Q.streaming_rules.advancement_disabled=!1,Q.streaming_rules.advancement_mode="NORMAL",Q.streaming_rules.skips_unlimited=!0,Q.streaming_rules.max_skips_per_hour=999;if(Q.skips_remaining!==void 0)Q.skips_remaining=999;if(Q.advancement)Q.advancement.advancement_mode="NORMAL",Q.advancement.advancement_disabled=!1,Q.advancement.skips_remaining=999;if(W(Q.track),W(Q.item),W(Q.current_track),W(Q.context_track),Array.isArray(Q.next_tracks))Q.next_tracks.forEach(W);if(Array.isArray(Q.prev_tracks))Q.prev_tracks.forEach(W);return Q}function I(){try{try{let X=Headers.prototype.set;Headers.prototype.set=function(G,H){if(G&&G.toLowerCase()==="x-cache-hint")return;return X.call(this,G,H)};let _=Headers.prototype.append;Headers.prototype.append=function(G,H){if(G&&G.toLowerCase()==="x-cache-hint")return;return _.call(this,G,H)}}catch(X){}let Q=JSON.parse;JSON.parse=function(X,_){try{let G=_?Q(X,_):Q(X);return v(G)}catch(G){try{return Q(X)}catch(H){return null}}};let Y=window.fetch;window.fetch=async function(X,_){let G=X,H=_,x=typeof G==="string"?G:G instanceof URL?G.toString():G.url;if(R(x))return y(x);try{if(G instanceof Request){if(G.headers.has("x-cache-hint")||G.headers.has("X-Cache-Hint")){let J=new Headers(G.headers);J.delete("x-cache-hint"),J.delete("X-Cache-Hint"),G=new Request(G,{headers:J})}}if(H&&H.headers){if(H.headers instanceof Headers)H.headers.delete("x-cache-hint"),H.headers.delete("X-Cache-Hint");else if(Array.isArray(H.headers))H.headers=H.headers.filter(([J])=>J.toLowerCase()!=="x-cache-hint");else if(typeof H.headers==="object")delete H.headers["x-cache-hint"],delete H.headers["X-Cache-Hint"]}}catch(J){}return Y.call(this,G,H)};let Z=XMLHttpRequest.prototype.open,$=XMLHttpRequest.prototype.send,z=XMLHttpRequest.prototype.setRequestHeader;XMLHttpRequest.prototype.setRequestHeader=function(X,_){if(X&&X.toLowerCase()==="x-cache-hint")return;return z.apply(this,arguments)},XMLHttpRequest.prototype.open=function(X,_){let G=_.toString();if(R(G))this.__blocked=!0;return Z.apply(this,arguments)};let V=navigator.sendBeacon;if(V)navigator.sendBeacon=function(X,_){if(R(X.toString()))return!0;return V.apply(this,arguments)};let K=window.Worker;if(K)window.Worker=function(X,_){let G=X.toString();if(G.startsWith("data:")||G.startsWith("blob:"))return new K(X,_);try{let H=`
            (function() {
              var origFetch = self.fetch;
              if (origFetch) {
                self.fetch = function(input, init) {
                  var reqInput = input;
                  var reqInit = init;
                  try {
                    if (reqInput instanceof Request) {
                      if (reqInput.headers.has('x-cache-hint') || reqInput.headers.has('X-Cache-Hint')) {
                        var cleanHeaders = new Headers(reqInput.headers);
                        cleanHeaders.delete('x-cache-hint');
                        cleanHeaders.delete('X-Cache-Hint');
                        reqInput = new Request(reqInput, { headers: cleanHeaders });
                      }
                    }
                    if (reqInit && reqInit.headers) {
                      if (reqInit.headers instanceof Headers) {
                        reqInit.headers.delete('x-cache-hint');
                        reqInit.headers.delete('X-Cache-Hint');
                      } else if (Array.isArray(reqInit.headers)) {
                        reqInit.headers = reqInit.headers.filter(function(pair) { return pair[0].toLowerCase() !== 'x-cache-hint'; });
                      } else if (typeof reqInit.headers === 'object') {
                        delete reqInit.headers['x-cache-hint'];
                        delete reqInit.headers['X-Cache-Hint'];
                      }
                    }
                  } catch(e) {}
                  return origFetch.call(this, reqInput, reqInit);
                };
              }
            })();
            importScripts('${G}');
          `,x=new Blob([H],{type:"application/javascript"}),J=URL.createObjectURL(x);return new K(J,_)}catch(H){return new K(X,_)}},window.Worker.prototype=K.prototype;XMLHttpRequest.prototype.send=function(){if(this.__blocked){setTimeout(()=>{try{Object.defineProperty(this,"readyState",{get:()=>4,configurable:!0})}catch(X){}try{Object.defineProperty(this,"status",{get:()=>200,configurable:!0})}catch(X){}try{Object.defineProperty(this,"statusText",{get:()=>"OK",configurable:!0})}catch(X){}try{Object.defineProperty(this,"responseText",{get:()=>"{}",configurable:!0})}catch(X){}try{Object.defineProperty(this,"response",{get:()=>"{}",configurable:!0})}catch(X){}try{this.dispatchEvent(new Event("readystatechange"))}catch(X){}try{this.dispatchEvent(new Event("load"))}catch(X){}try{this.dispatchEvent(new Event("loadend"))}catch(X){}try{if(typeof this.onreadystatechange==="function")this.onreadystatechange()}catch(X){}try{if(typeof this.onload==="function")this.onload()}catch(X){}},10);return}return $.apply(this,arguments)},g(),k(),console.log("SpotiLIE: Nuclear adblock v4 initialized (DOM + Network + JSON + Audio)")}catch(Q){console.error("SpotiLIE: Failed to initialize adblock",Q)}}function g(){let Q=['[data-testid="ad-indicator"]','[data-testid="ad-sponsor-container"]','[data-testid="advertisement"]',".Root__ads-container",".nav-bar-ad-item",".desktop-media-picker-ads",'[class*="ad-slot"]','[class*="adSlot"]','[class*="AdSlot"]','iframe[src*="doubleclick"]','iframe[src*="googlesyndication"]','div[id*="google_ads"]','div[class*="video-ad"]','div[class*="videoAd"]'],Y=()=>{for(let $ of Q)try{document.querySelectorAll($).forEach((z)=>z.remove())}catch(z){}};Y(),setInterval(Y,500);let Z=()=>{new MutationObserver(Y).observe(document.body,{childList:!0,subtree:!0})};if(document.body)Z();else document.addEventListener("DOMContentLoaded",Z,{once:!0})}function k(){let Q=!1,Y=0,Z=null,$=0,z=[/\badvertisement\b/i,/\banuncio\b/i,/\banzeige\b/i,/\bpublicité\b/i,/\bpublicite\b/i,/\bsponsored\b/i,/\bspotify premium\b/i,/\bcommercial\b/i],V=()=>{let F=document.querySelector("audio, video");if(F?.src&&(F.src.includes("audio-ads")||F.src.includes("ad-logic")||F.src.includes("/ad/")))return!0;let D=(document.title||"").trim();if(D&&z.some((U)=>U.test(D)))return!0;if(document.querySelector('[data-testid="ad-indicator"], [data-testid="ad-sponsor-container"], .Root__ads-container, [class*="ad-overlay"], [class*="video-ad"], [class*="ad-slot"]'))return!0;let O=document.querySelector('[data-testid="context-item-info-title"], [data-testid="now-playing-widget"] [data-testid="context-item-link"]');if(O){let U=(O.textContent||"").toLowerCase().trim();if(U&&z.some((E)=>E.test(U)))return!0}let q=document.querySelector('[data-testid="context-item-link"], [data-testid="now-playing-bar"] a');if(q){let U=q.getAttribute("href")||"";if(U.includes("/ad/")||U.includes("advertisement"))return!0}return!1},K=()=>{document.querySelectorAll("audio, video").forEach((F)=>{let D=F;D.muted=!0;try{D.volume=0}catch(O){}})},X=()=>{document.querySelectorAll("audio, video").forEach((F)=>{let D=F;D.muted=!1;try{D.volume=1}catch(O){}})},_=()=>{let F=Date.now();if(F-$<800)return!1;$=F,K();let D=document.querySelector("audio, video");if(D)try{if(isFinite(D.duration)&&D.duration>0)D.currentTime=D.duration-0.01;else D.currentTime=999999;D.dispatchEvent(new Event("ended"))}catch(U){}let O=['button[data-testid="control-button-skip-forward"]','button[aria-label*="next" i]','button[aria-label*="skip" i]','button[aria-label*="siguiente" i]','[data-testid="skip-ad-button"]'],q=!1;for(let U of O)document.querySelectorAll(U).forEach((f)=>{let L=f;L.removeAttribute("disabled"),L.removeAttribute("aria-disabled");try{L.click(),q=!0}catch(zQ){}});return q},G=()=>{if(Z)return;Y=0,Z=setInterval(()=>{if(!Q){clearInterval(Z),Z=null;return}if(K(),_(),Y++,Y>50)clearInterval(Z),Z=null},50)},H=()=>{if(Q)return;Q=!0,console.log("SpotiLIE: Audio ad detected — muting and seeking to end"),K(),_(),[20,50,100,200,400,800].forEach((F)=>setTimeout(_,F)),G()},x=()=>{if(!Q)return;if(Q=!1,Z)clearInterval(Z),Z=null;console.log("SpotiLIE: Audio ad ended — restoring audio"),X()},J=()=>{if(V())H();else x()},M=document.querySelector("title");if(M)new MutationObserver(J).observe(M,{subtree:!0,characterData:!0,childList:!0});let N=()=>{let F=document.querySelector('[data-testid="now-playing-bar"]')||document.querySelector(".Root__now-playing-bar");if(F)new MutationObserver(J).observe(F,{subtree:!0,childList:!0,attributes:!0})};if(document.body)N(),new MutationObserver(()=>N()).observe(document.body,{childList:!0});document.addEventListener("loadedmetadata",(F)=>{if(F.target?.tagName==="AUDIO")setTimeout(J,10),setTimeout(J,100)},!0),document.addEventListener("timeupdate",(F)=>{if(F.target?.tagName==="AUDIO"){if(V())H()}},!0),document.addEventListener("play",(F)=>{if(F.target?.tagName==="AUDIO")setTimeout(J,10),setTimeout(J,100)},!0),setInterval(J,250)}function P(){try{try{Object.defineProperty(navigator,"platform",{get:()=>"Win32",configurable:!0})}catch(Y){}try{Object.defineProperty(navigator,"vendor",{get:()=>"Google Inc.",configurable:!0})}catch(Y){}try{let Z=[{name:"Chrome PDF Plugin",filename:"internal-pdf-viewer",description:"Portable Document Format",length:1,item:()=>null,namedItem:()=>null}];Z.item=($)=>Z[$]||null,Z.namedItem=($)=>Z.find((z)=>z.name===$)||null,Object.defineProperty(navigator,"plugins",{get:()=>Z,configurable:!0})}catch(Y){}"userAgentData"in navigator;try{let Y={brands:[{brand:"Not-A.Brand",version:"99"},{brand:"Chromium",version:"124"},{brand:"Google Chrome",version:"124"}],mobile:!1,platform:"Windows",getHighEntropyValues:async(Z)=>({brands:[{brand:"Not-A.Brand",version:"99"},{brand:"Chromium",version:"124"},{brand:"Google Chrome",version:"124"}],mobile:!1,platform:"Windows",platformVersion:"10.0.0",architecture:"x86",bitness:"64",model:"",uaFullVersion:"124.0.6367.201",fullVersionList:[{brand:"Not-A.Brand",version:"99.0.0.0"},{brand:"Chromium",version:"124.0.6367.201"},{brand:"Google Chrome",version:"124.0.6367.201"}]}),toJSON:()=>({brands:[{brand:"Not-A.Brand",version:"99"},{brand:"Chromium",version:"124"},{brand:"Google Chrome",version:"124"}],mobile:!1,platform:"Windows"})};Object.defineProperty(navigator,"userAgentData",{get:()=>Y,configurable:!0})}catch(Y){console.warn("SpotiLIE: Failed to spoof userAgentData",Y)}let Q=navigator.requestMediaKeySystemAccess;if(Q&&!Q._spotilie_patched){let Y=function(Z,$){return console.log("SpotiLIE: EME requestMediaKeySystemAccess called for:",Z),Q.call(this,Z,$).then((z)=>{return console.log("SpotiLIE: EME requestMediaKeySystemAccess SUCCEEDED for:",Z),z}).catch((z)=>{console.warn("SpotiLIE: EME requestMediaKeySystemAccess failed with original configs, retrying with sanitized Android Widevine L3 configs...",z);try{let V=JSON.parse(JSON.stringify($));return V.forEach((K)=>{if(K.audioCapabilities)K.audioCapabilities.forEach((X)=>delete X.robustness);if(K.videoCapabilities)K.videoCapabilities.forEach((X)=>delete X.robustness)}),Q.call(this,Z,V).then((K)=>{return console.log("SpotiLIE: EME requestMediaKeySystemAccess SUCCEEDED with sanitized configs for:",Z),K}).catch(()=>{console.warn("SpotiLIE: Retrying EME with basic Widevine L3 config");let K=[{initDataTypes:["cenc"],audioCapabilities:[{contentType:'audio/mp4; codecs="mp4a.40.2"'},{contentType:'audio/webm; codecs="opus"'}]}];return Q.call(this,Z,K)})}catch(V){throw z}})};Y._spotilie_patched=!0,navigator.requestMediaKeySystemAccess=Y}u(),console.log("SpotiLIE: Hardware spoofing active (desktop layout + userAgentData + EME handler)")}catch(Q){console.error("SpotiLIE: Failed to spoof hardware",Q)}}function u(){let Q=()=>{try{let Y=window.AudioContext||window.webkitAudioContext;if(Y){let Z=new Y;if(Z.state==="suspended")Z.resume()}}catch(Y){}try{let Y=new Audio;Y.src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=",Y.play().then(()=>Y.pause()).catch(()=>{})}catch(Y){}document.removeEventListener("touchstart",Q,!0),document.removeEventListener("click",Q,!0)};document.addEventListener("touchstart",Q,!0),document.addEventListener("click",Q,!0)}function w(){let Q=document.createElement("style");Q.id="spotilie-ui",Q.textContent=m(),(()=>{let Z=document.head||document.documentElement;if(Z){if(!document.getElementById("spotilie-ui"))Z.appendChild(Q)}else document.addEventListener("DOMContentLoaded",()=>{let $=document.head||document.documentElement;if($&&!document.getElementById("spotilie-ui"))$.appendChild(Q)},{once:!0})})(),p(),l(),s(),d(),c()}function m(){return`
    :root {
      --sys-nav-h:  44px;
      --app-nav-h:  52px;
      --player-h:   148px;
      --top-bar-h:  ${"56"}px;
      --bottom-h:   calc(var(--sys-nav-h) + var(--app-nav-h) + var(--player-h) + 6px);
    }

    html, body {
      width: 100vw !important;
      min-width: 0 !important;
      max-width: 100vw !important;
      height: 100dvh !important;
      min-height: 0 !important;
      overflow: hidden !important;
      overscroll-behavior: none !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #121212 !important;
    }

    body {
      min-width: unset !important;
    }

    .Root {
      width: 100vw !important;
      min-width: 0 !important;
      max-width: 100vw !important;
      height: 100dvh !important;
      overflow: hidden !important;
      overscroll-behavior: none !important;
    }

    .Root > div {
      display: block !important;
      position: relative !important;
      width: 100vw !important;
      height: 100dvh !important;
      overflow: hidden !important;
    }

    /* Hide desktop-only elements */
    [data-testid="left-sidebar"],
    .Root__nav-bar,
    #Desktop_LeftSidebar_Id,
    nav[aria-label="Main"],
    .Root__right-sidebar,
    [data-testid="buddy-feed"],
    aside[aria-label="Friend Activity"],
    .LayoutResizer__handler,
    [data-testid="upgrade-button"],
    [data-testid="install-app-button"],
    [aria-label*="Install"],
    [aria-label*="Get the app"],
    [aria-label*="Upgrade to Premium"],
    a[href*="/premium"],
    .main-view-container__footer,
    [data-testid="ad-indicator"],
    [data-testid="ad-sponsor-container"],
    .desktop-media-picker-ads,
    .Root__ads-container,
    .nav-bar-ad-item,
    iframe[src*="doubleclick"],
    div[class*="ad-slot"],
    .Root__modal-slot:has([aria-label*="Premium"]),
    div[role="dialog"]:has([href*="premium"]),
    [class*="globalNav__history"],
    [data-testid="topbar-navigation-button"] {
      display: none !important;
      width: 0 !important;
      min-width: 0 !important;
    }

    /* Top bar */
    .Root__globalNav,
    .Root__top-bar,
    [data-testid="topbar-content-wrapper"] {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      height: var(--top-bar-h) !important;
      z-index: 9990 !important;
      width: 100% !important;
      min-width: 0 !important;
      max-width: 100vw !important;
      background: rgba(18, 18, 18, 0.96) !important;
      backdrop-filter: blur(12px) !important;
      -webkit-backdrop-filter: blur(12px) !important;
      display: flex !important;
      align-items: center !important;
      box-sizing: border-box !important;
      padding: 0 12px !important;
    }

    /* Main View Area */
    .Root__main-view,
    #main-view,
    main[data-testid="main-view"] {
      position: fixed !important;
      top: var(--top-bar-h) !important;
      left: 0 !important;
      right: 0 !important;
      bottom: var(--bottom-h) !important;
      width: 100% !important;
      box-sizing: border-box !important;
      overflow-y: auto !important;
      overflow-x: hidden !important;
      -webkit-overflow-scrolling: touch !important;
      padding-bottom: 8px !important;
    }

    .main-view-container__scroll-node,
    [data-testid="main-view-container__scroll-node"],
    .os-viewport,
    [data-overlayscrollbars-viewport] {
      padding-bottom: 0px !important;
      height: auto !important;
      min-height: 100% !important;
    }

    /* Fix blank space under header on non-home pages */
    [data-testid="playlist-page"] > div:first-child,
    [data-testid="artist-page"] > div:first-child,
    [data-testid="album-page"] > div:first-child,
    [class*="contentSpacing"],
    .main-view-container__scroll-node-child {
      padding-top: 0 !important;
    }

    [data-testid="entity-header-image-container"],
    [class*="entityHeader"],
    [class*="EntityHeader"] {
      margin-top: 0 !important;
      padding-top: 0 !important;
    }

    [data-testid="main-view-container__scroll-node"] > div:first-child,
    .os-content > div:first-child {
      padding-top: 0 !important;
      margin-top: 0 !important;
    }

    /* ═══════════════════════════════════════════════════════════════════════
       SECTION 6: Spotify Native Now-Playing Bar
       ═══════════════════════════════════════════════════════════════════════ */
    .Root__now-playing-bar,
    aside[data-testid="now-playing-bar"],
    [data-testid="now-playing-bar"] {
      position: fixed !important;
      bottom: calc(var(--sys-nav-h) + var(--app-nav-h)) !important;
      left: 0 !important;
      right: 0 !important;
      width: 100vw !important;
      min-width: 0 !important;
      max-width: 100vw !important;
      height: var(--player-h) !important;
      background: #181818 !important;
      border-top: 1px solid rgba(255,255,255,0.08) !important;
      z-index: 9980 !important;
      overflow: visible !important;
      padding: 0 !important;
    }

    [data-testid="now-playing-bar"] > div {
      display: flex !important;
      flex-direction: column !important;
      width: 100% !important;
      height: 100% !important;
      padding: 8px 12px 10px !important;
      box-sizing: border-box !important;
      gap: 6px !important;
      overflow: visible !important;
    }

    /* Track Info Row */
    [data-testid="now-playing-bar"] > div > div:first-child {
      display: flex !important;
      flex-direction: row !important;
      align-items: center !important;
      width: 100% !important;
      gap: 10px !important;
      min-width: 0 !important;
      flex-shrink: 0 !important;
    }

    [data-testid="CoverSlotCollapsed__container"],
    [data-testid="now-playing-bar"] [data-testid="cover-art-image"],
    [data-testid="now-playing-bar"] img:not([data-testid]) {
      width: 44px !important;
      height: 44px !important;
      min-width: 44px !important;
      border-radius: 4px !important;
      flex-shrink: 0 !important;
      object-fit: cover !important;
    }

    [data-testid="context-item-info-title"],
    [data-testid="now-playing-bar"] [data-testid="context-item-link"] {
      font-size: 13px !important;
      font-weight: 600 !important;
      color: #fff !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      white-space: nowrap !important;
      flex: 1 !important;
      min-width: 0 !important;
    }

    [data-testid="context-item-info-subtitles"],
    [data-testid="context-item-info-subtitle"] {
      font-size: 11px !important;
      color: rgba(255,255,255,0.55) !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      white-space: nowrap !important;
    }

    /* Progress bar — force visible */
    .playback-bar,
    [data-testid="playback-progressbar"],
    [data-testid="progress-bar"],
    [class*="progressBar"],
    [class*="progress-bar"],
    [class*="PlaybackBar"],
    [class*="playbackBar"],
    [class*="ProgressBar"],
    div[role="slider"] {
      display: flex !important;
      flex-direction: row !important;
      align-items: center !important;
      width: 100% !important;
      max-width: 100% !important;
      min-width: 0 !important;
      height: 28px !important;
      opacity: 1 !important;
      visibility: visible !important;
      overflow: visible !important;
      flex-shrink: 0 !important;
    }

    /* Track background */
    [class*="progressBar"] [class*="bg"],
    [class*="progressBar"] [class*="track"],
    [class*="playback-bar"] [class*="bg"],
    .playback-bar > div > div:first-child {
      height: 6px !important;
      flex: 1 !important;
      background: #3e3e3e !important;
      border-radius: 3px !important;
      position: relative !important;
      cursor: pointer !important;
    }

    /* Fill */
    [class*="progressBar"] [class*="fg"],
    [class*="progressBar"] [class*="fill"],
    [class*="progress-bar__fill"],
    [class*="PlaybackBar"] [class*="fill"] {
      background: #1DB954 !important;
      border-radius: 3px !important;
      height: 100% !important;
    }

    /* Thumb knob */
    [class*="progressBar"] [role="slider"],
    [class*="progressBar"] [class*="handle"],
    [class*="progressBar"] [class*="thumb"],
    [class*="progressBar"] [class*="knob"] {
      background: #fff !important;
      border-radius: 50% !important;
      width: 14px !important;
      height: 14px !important;
      position: absolute !important;
    }

    /* Time text */
    [class*="playback-bar"] [data-testid="playback-duration"],
    [class*="playback-bar"] [data-testid="playback-position"],
    [class*="PlaybackBar"] time,
    .playback-bar__progress-time-elapsed,
    .playback-bar__progress-time {
      font-size: 11px !important;
      color: rgba(255,255,255,0.7) !important;
      min-width: 32px !important;
      text-align: center !important;
      flex-shrink: 0 !important;
    }

    /* Controls Row */
    [data-testid="player-controls"],
    .player-controls__buttons,
    [data-testid="now-playing-bar"] [class*="controls"],
    [data-testid="now-playing-bar"] [class*="Controls"] {
      display: flex !important;
      flex-direction: row !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 20px !important;
      width: 100% !important;
      max-width: none !important;
      padding: 0 !important;
      flex-shrink: 0 !important;
    }

    [data-testid="control-button-playpause"] {
      width: 44px !important;
      height: 44px !important;
      background: #1DB954 !important;
      border-radius: 50% !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      flex-shrink: 0 !important;
    }
    [data-testid="control-button-playpause"] svg {
      fill: #000 !important;
      width: 20px !important;
      height: 20px !important;
    }

    [data-testid="control-button-skip-forward"],
    [data-testid="control-button-skip-back"] {
      width: 36px !important;
      height: 36px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      flex-shrink: 0 !important;
    }
    [data-testid="control-button-skip-forward"] svg,
    [data-testid="control-button-skip-back"] svg {
      fill: rgba(255,255,255,0.85) !important;
      width: 22px !important;
      height: 22px !important;
    }

    [data-testid="control-button-shuffle"],
    [data-testid="control-button-repeat"] {
      width: 32px !important;
      height: 32px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      flex-shrink: 0 !important;
    }
    [data-testid="control-button-shuffle"] svg,
    [data-testid="control-button-repeat"] svg {
      fill: rgba(255,255,255,0.55) !important;
      width: 18px !important;
      height: 18px !important;
    }

    [data-testid="volume-bar"],
    [data-testid="connect-device-picker-button"] {
      display: none !important;
    }

    /* ═══════════════════════════════════════════════════════════════════════
       SECTION 7: App bottom nav
       ═══════════════════════════════════════════════════════════════════════ */
    #spotilie-bottom-nav {
      position: fixed !important;
      bottom: calc(var(--sys-nav-h) + 6px) !important;
      left: 0 !important;
      right: 0 !important;
      height: var(--app-nav-h) !important;
      background: #000 !important;
      border-top: 1px solid rgba(255,255,255,0.1) !important;
      display: flex !important;
      flex-direction: row !important;
      justify-content: space-around !important;
      align-items: center !important;
      z-index: 9999 !important;
      padding: 0 !important;
      box-sizing: border-box !important;
    }

    #spotilie-bottom-nav .nav-item {
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      color: rgba(255,255,255,0.45) !important;
      text-decoration: none !important;
      font-size: 10px !important;
      font-weight: 500 !important;
      gap: 2px !important;
      padding: 6px 20px !important;
      -webkit-tap-highlight-color: transparent !important;
      cursor: pointer !important;
      flex: 1 !important;
      height: 100% !important;
    }

    #spotilie-bottom-nav .nav-item.active {
      color: #fff !important;
    }

    #spotilie-bottom-nav .nav-item svg {
      width: 22px !important;
      height: 22px !important;
      fill: currentColor !important;
    }

    [data-testid="tracklist-row"] {
      padding: 8px 12px !important;
      min-height: 52px !important;
      -webkit-tap-highlight-color: rgba(255,255,255,0.05) !important;
    }
  `}function p(){let Q=document.querySelector('meta[name="viewport"]');if(!Q)Q=document.createElement("meta"),Q.name="viewport",(document.head||document.documentElement).appendChild(Q);Q.content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"}function l(){let Q=()=>{try{document.documentElement.style.setProperty("--app-nav-h","52px"),document.documentElement.style.setProperty("--player-h","148px"),document.documentElement.style.setProperty("--top-bar-h","56px")}catch(Y){}};Q(),window.visualViewport?.addEventListener("resize",Q),window.addEventListener("resize",Q)}function c(){let Q=globalThis.browser||globalThis.chrome;if(!Q?.runtime?.onMessage)return;Q.runtime.onMessage.addListener((Y)=>{if(Y?.type==="SET_NAV_HEIGHT"&&typeof Y.height==="number"){let Z=Math.max(0,Y.height);document.documentElement.style.setProperty("--sys-nav-h",`${Z}px`),document.documentElement.style.setProperty("--bottom-h",`${Z+52+148+6}px`);let $=document.getElementById("spotilie-bottom-nav");if($)$.style.setProperty("bottom",`calc(${Z}px + 6px)`,"important");console.log(`SpotiLIE: Nav height set to ${Z}px CSS from Kotlin`)}})}function B(Q){let Y=`a[href="${Q}"]`;if(Q==="/collection")Y='a[href^="/collection"], a[href="/collection/playlists"], a[href="/library"]';let Z=document.querySelector(Y);if(Z){Z.click();return}try{history.pushState(null,"",Q),window.dispatchEvent(new PopStateEvent("popstate"))}catch($){window.location.href=Q}}function s(){let Q=()=>{if(document.getElementById("spotilie-bottom-nav"))return;let Y=document.createElement("div");Y.id="spotilie-bottom-nav",Y.innerHTML=`
      <div class="nav-item active" data-nav="home">
        <svg viewBox="0 0 24 24"><path d="M13.5 1.515a3 3 0 0 0-3 0L3 5.845a2 2 0 0 0-1 1.732V21a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-6h4v6a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V7.577a2 2 0 0 0-1-1.732l-7.5-4.33z"/></svg>
        <span>Home</span>
      </div>
      <div class="nav-item" data-nav="search">
        <svg viewBox="0 0 24 24"><path d="M10.533 1.279c-5.18 0-9.407 4.14-9.407 9.279s4.226 9.279 9.407 9.279c2.234 0 4.29-.77 5.907-2.058l4.353 4.353a1 1 0 1 0 1.414-1.414l-4.344-4.344a9.157 9.157 0 0 0 2.077-5.816c0-5.14-4.226-9.28-9.407-9.28zm-7.407 9.279c0-4.006 3.302-7.28 7.407-7.28s7.407 3.274 7.407 7.28-3.302 7.279-7.407 7.279-7.407-3.273-7.407-7.28z"/></svg>
        <span>Search</span>
      </div>
      <div class="nav-item" data-nav="library">
        <svg viewBox="0 0 24 24"><path d="M3 22a1 1 0 0 1-1-1V3a1 1 0 0 1 2 0v18a1 1 0 0 1-1 1zM15.5 2.134A1 1 0 0 0 14 3v18a1 1 0 0 0 1.5.866l11-9a1 1 0 0 0 0-1.732l-11-9zM16 19.27V4.73L24.113 12 16 19.27z"/><path d="M9 22a1 1 0 0 1-1-1V3a1 1 0 1 1 2 0v18a1 1 0 0 1-1 1z"/></svg>
        <span>Library</span>
      </div>
    `,Y.querySelectorAll(".nav-item").forEach((V)=>{V.addEventListener("click",()=>{let K=V.getAttribute("data-nav");if(K==="home")B("/");else if(K==="search")B("/search");else if(K==="library")B("/collection")})}),document.body.appendChild(Y);let Z=()=>{let V=window.location.pathname;Y.querySelectorAll(".nav-item").forEach((K)=>{K.classList.remove("active");let X=K.getAttribute("data-nav");if(X==="home"&&(V==="/"||V===""))K.classList.add("active");else if(X==="search"&&V.startsWith("/search"))K.classList.add("active");else if(X==="library"&&V.startsWith("/collection"))K.classList.add("active")})},$=history.pushState;history.pushState=function(){$.apply(this,arguments),Z()};let z=history.replaceState;history.replaceState=function(){z.apply(this,arguments),Z()},window.addEventListener("popstate",Z),Z()};if(document.body)Q();else{let Y=setInterval(()=>{if(document.body)clearInterval(Y),Q()},50)}}function d(){let Q=[".playback-bar",'[data-testid="playback-progressbar"]','[data-testid="progress-bar"]','[class*="progressBar"]','[class*="PlaybackBar"]','[class*="playback-bar"]','div[role="slider"]'],Y=()=>{for(let Z of Q)document.querySelectorAll(Z).forEach(($)=>{let z=$;z.style.setProperty("display","flex","important"),z.style.setProperty("visibility","visible","important"),z.style.setProperty("opacity","1","important"),z.style.setProperty("overflow","visible","important"),z.style.setProperty("min-width","120px","important"),z.style.setProperty("width","100%","important");let V=z.parentElement,K=0;while(V&&K<8){let X=getComputedStyle(V);if(X.overflow==="hidden"||X.overflowY==="hidden")V.style.setProperty("overflow","visible","important");if(X.display==="none")V.style.setProperty("display","flex","important");V=V.parentElement,K++}})};setTimeout(Y,500),setTimeout(Y,1500),setTimeout(Y,3000),setInterval(Y,5000)}function T(){r(),n(),a(),e(),t(),i(),o(),QQ()}function o(){window.addEventListener("online",()=>{console.log("SpotiLIE: Network connection restored — resuming audio"),setTimeout(()=>{let Q=document.querySelector("audio, video");if(Q&&Q.paused)window.spotilieMediaAction?.("play")},1000)}),window.addEventListener("error",(Q)=>{let Y=Q.target;if(Y?.tagName==="AUDIO"||Y?.tagName==="VIDEO")console.warn("SpotiLIE: HTMLMediaElement error — retrying playback"),setTimeout(()=>{let Z=document.querySelector('button[data-testid="control-button-playpause"]');if(Z)Z.click()},1500)},!0)}function n(){try{let Q=HTMLMediaElement.prototype.play;if(Q&&!Q._spotilie_patched){let Y=function(){return console.log("SpotiLIE: HTMLMediaElement.play() invoked on",this.src||this.currentSrc||"MSE stream"),Q.apply(this,arguments).then((Z)=>{return console.log("SpotiLIE: HTMLMediaElement.play() SUCCEEDED"),Z}).catch((Z)=>{throw console.error("SpotiLIE: HTMLMediaElement.play() REJECTED:",Z?.name,Z?.message,Z),Z})};Y._spotilie_patched=!0,HTMLMediaElement.prototype.play=Y}document.addEventListener("error",(Y)=>{let Z=Y.target;if(Z&&(Z.tagName==="AUDIO"||Z.tagName==="VIDEO")){let $=Z.error;console.error("SpotiLIE: Media Element Error Event:",$?.code,$?.message,Z.src)}},!0)}catch(Q){}}function r(){document.addEventListener("click",(Q)=>{let Y=Q.target;if(Y){let Z=`${Y.tagName}.${(Y.className||"").toString().slice(0,40)} [id=${Y.id||""}] [data-testid=${Y.getAttribute("data-testid")||""}]`;console.log("SpotiLIE Click Target:",Z)}},!0)}function i(){document.addEventListener("click",(Q)=>{if(!Q.isTrusted)return;let Y=Q.target;if(!Y)return;if(Y.closest('button, a[href*="/artist/"], a[href*="/album/"], [role="button"], [data-testid="more-button"], [data-testid="add-button"]'))return;let Z=Y.closest('[data-testid="tracklist-row"], [role="row"]');if(!Z)return;let $=Z.querySelector('button[aria-label*="Play" i], button[aria-label*="play" i], [data-testid="play-button"], [data-testid="row-play-button"], [data-encore-id="buttonPrimary"], [class*="playButton" i]');if(!$)$=Array.from(Z.querySelectorAll("button")).find((K)=>{let X=(K.getAttribute("aria-label")||K.getAttribute("data-testid")||K.className||"").toLowerCase();return X.includes("play")||X.includes("reproducir")})||null;if($){console.log("SpotiLIE: Track play button clicked via row tap"),$.click();return}let z=Z.querySelector('a[data-testid="internal-track-link"], a[href*="/track/"]');if(z)console.log("SpotiLIE: Clicking internal track link via row tap"),z.click()},!1)}function j(Q){for(let Y of Q){let Z=document.querySelector(Y);if(Z)try{return Z.click(),console.log(`SpotiLIE: Clicked media button via selector: ${Y}`),!0}catch($){console.warn(`SpotiLIE: Failed clicking ${Y}:`,$)}}return!1}function a(){window.spotilieMediaAction=(Q)=>{console.log(`SpotiLIE: spotilieMediaAction executed for action '${Q}'`);let Y=document.querySelector("audio, video");if(Q==="play"){if(!j(['button[data-testid="control-button-playpause"]','button[aria-label*="Play" i]','button[aria-label*="reproducir" i]'])||Y&&Y.paused)Y?.play().catch(()=>{})}else if(Q==="pause"){if(j(['button[data-testid="control-button-playpause"]','button[aria-label*="Pause" i]']),Y&&!Y.paused)Y.pause()}else if(Q==="toggle"){if(!j(['button[data-testid="control-button-playpause"]'])&&Y)if(Y.paused)Y.play().catch(()=>{});else Y.pause()}else if(Q==="next")j(['button[data-testid="control-button-skip-forward"]','button[aria-label*="Next" i]','button[aria-label*="Siguiente" i]','[data-testid="skip-ad-button"]']);else if(Q==="prev")j(['button[data-testid="control-button-skip-back"]','button[aria-label*="Previous" i]','button[aria-label*="Anterior" i]'])}}function t(){try{if(!navigator.mediaDevices?.addEventListener)return;navigator.mediaDevices.addEventListener("devicechange",()=>{setTimeout(()=>{let Q=document.querySelector("audio, video");if(Q&&!Q.paused)console.log("SpotiLIE: Audio output device changed/disconnected — pausing playback"),Q.pause(),j(['button[data-testid="control-button-playpause"]'])},250)})}catch(Q){console.warn("SpotiLIE: Could not set up Bluetooth pause guard",Q)}}function e(){try{let Q=globalThis.browser||globalThis.chrome;if(!Q?.runtime?.onMessage)return;Q.runtime.onMessage.addListener((Y)=>{if(Y?.type==="MEDIA_ACTION"&&typeof Y.action==="string")return console.log("SpotiLIE: MEDIA_ACTION received from native bridge:",Y.action),window.spotilieMediaAction?.(Y.action),!0}),console.log("SpotiLIE: Native message listener active")}catch(Q){console.warn("SpotiLIE: Could not set up native message listener",Q)}}function QQ(){}function h(){let Q={title:"",artist:"",isPlaying:!1},Y=null,Z=!1,$=!1,z=()=>{let J=document.title||"",M=J.indexOf(" - ");if(M<1)return null;let N=J.substring(0,M).trim(),F=J.substring(M+3).trim(),D=F.lastIndexOf(" · ");if(D>0)F=F.substring(0,D).trim();if(!N||N.toLowerCase()==="spotify")return null;return{title:N,artist:F,isPlaying:K()}},V=()=>{try{let J=document.querySelector('[data-testid="context-item-info-title"]')||document.querySelector('[data-testid="now-playing-widget"] [data-testid="context-item-link"]'),M=document.querySelector('[data-testid="context-item-info-subtitles"]')||document.querySelector('[data-testid="now-playing-widget"] [data-testid="context-item-info-subtitles"]');if(!J||!M)return null;let N=(J.textContent||"").trim(),F=(M.textContent||"").trim();if(!N||N.toLowerCase()==="advertisement")return null;return{title:N,artist:F,isPlaying:K()}}catch(J){return null}},K=()=>{let J=document.querySelector('button[data-testid="control-button-playpause"]');if(J)return(J.getAttribute("aria-label")||"").toLowerCase()==="pause";return!!document.querySelector('button[aria-label="Pause"]')},X=(J)=>{if(!J.title)return;if(J.title===Q.title&&J.artist===Q.artist&&J.isPlaying===Q.isPlaying)return;Q={...J};try{let M=globalThis.browser||globalThis.chrome;if(M?.runtime?.sendMessage){M.runtime.sendMessage({type:"UPDATE_METADATA",title:J.title,artist:J.artist,isPlaying:J.isPlaying}).catch(()=>{}),console.log(`SpotiLIE: Metadata sent → "${J.title}" by "${J.artist}" playing=${J.isPlaying}`);return}}catch(M){}try{let M=window.__TAURI__?.core?.invoke||window.__TAURI_INTERNALS__?.invoke;if(M)M("update_media_info",{title:J.title,artist:J.artist,isPlaying:J.isPlaying})}catch(M){}},_=()=>{if(Y)clearTimeout(Y);Y=setTimeout(()=>{let J=z()||V();if(J)X(J)},250)},G=()=>{if(Z)return;let J=document.querySelector("title");if(!J)return;Z=!0,new MutationObserver(_).observe(J,{subtree:!0,characterData:!0,childList:!0})},H=()=>{if($)return;let J=document.querySelector('[data-testid="now-playing-bar"]')||document.querySelector(".Root__now-playing-bar");if(!J)return;$=!0,new MutationObserver(_).observe(J,{subtree:!0,characterData:!0,childList:!0,attributes:!0,attributeFilter:["aria-label"]})};setInterval(_,2000),document.addEventListener("play",(J)=>{if(J.target?.tagName==="AUDIO")_()},!0),document.addEventListener("pause",(J)=>{if(J.target?.tagName==="AUDIO")_()},!0);let x=()=>{G(),H()};if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",x);else x();if(document.body){let J=new MutationObserver(()=>{if(!$)H();if(!Z)G();if($&&Z)J.disconnect()});J.observe(document.body,{childList:!0,subtree:!1})}}function S(){try{YQ(),ZQ(),$Q(),console.log("SpotiLIE: Premium features module active")}catch(Q){console.error("SpotiLIE: Premium features init failed",Q)}}function YQ(){let Q=Response.prototype.json;Response.prototype.json=async function(){let Y=await Q.call(this);if(!Y||typeof Y!=="object")return Y;if(Y.skips_remaining!==void 0)Y.skips_remaining=999;if(Y.advancement)Y.advancement.advancement_mode="NORMAL",Y.advancement.advancement_disabled=!1;if(Y.enableLyrics!==void 0)Y.enableLyrics=!0;if(Y.canShowLyrics!==void 0)Y.canShowLyrics=!0;if(Y.lyricsEnabled!==void 0)Y.lyricsEnabled=!0;if(Y.features){if(Y.features.enableLyrics!==void 0)Y.features.enableLyrics=!0;if(Y.features.lyrics!==void 0)Y.features.lyrics=!0}return Y}}function ZQ(){try{let Q=localStorage.getItem("playback.settings");if(Q)try{let Y=JSON.parse(Q),Z=!1;if(!Y.autoplay)Y.autoplay=!0,Z=!0;if(Y.crossfade===void 0)Y.crossfade=0,Z=!0;if(Z)localStorage.setItem("playback.settings",JSON.stringify(Y))}catch(Y){}}catch(Q){}}function $Q(){setInterval(()=>{let Y=document.querySelector('[data-testid="connect-device-picker-button"]');if(Y)Y.style.removeProperty("display"),Y.style.removeProperty("visibility"),Y.style.removeProperty("opacity")},5000)}(function(){if(window._spotilie_initialized)return;window._spotilie_initialized=!0,console.log("SpotiLIE: Injector Active v2.0 (Nuclear Edition)"),I(),C(),P(),S(),w(),T(),h()})();
