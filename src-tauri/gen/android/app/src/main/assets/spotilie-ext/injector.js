function E(){try{let Q={__cmpCall:function(){},__tcfapiCall:function(){},postMessage:function($){try{if($&&typeof $==="object"&&$.__cmpCall){let j=$.__cmpCall;window.postMessage({__cmpReturn:{returnValue:{eventStatus:"tcloaded",gdprApplies:!1},success:!0,callId:j?j.callId:null}},"*")}}catch(j){}}};Q.contentWindow=Q,Q.frames=Q,Q.__cmpLocator=Q,Q.__tcfapiLocator=Q;try{let $=Object.getOwnPropertyDescriptor(MessageEvent.prototype,"source");if($&&$.get){let j=$.get;Object.defineProperty(MessageEvent.prototype,"source",{get:function(){return j.call(this)||Q},configurable:!0})}}catch($){}try{if(!("__cmpCall"in Object.prototype))Object.defineProperty(Object.prototype,"__cmpCall",{get:function(){return Q.__cmpCall},configurable:!0});if(!("__tcfapiCall"in Object.prototype))Object.defineProperty(Object.prototype,"__tcfapiCall",{get:function(){return Q.__tcfapiCall},configurable:!0})}catch($){}let Y=[window,window.top,window.parent,globalThis];for(let $ of Y){if(!$)continue;try{$.__cmpLocator=Q,$.__tcfapiLocator=Q,$.__cmpCall=Q.__cmpCall}catch(j){}}try{let $=window.addEventListener;window.addEventListener=function(j,G,X){if(j==="message"&&typeof G==="function"){let J=function(V){try{if(V&&typeof V==="object"&&"source"in V)try{Object.defineProperty(V,"source",{get:()=>Q,configurable:!0})}catch(K){}return G.apply(this,arguments)}catch(K){if(K&&K.message&&(K.message.includes("__cmpCall")||K.message.includes("__cmp"))){console.warn("SpotiLIE: Suppressed CMP error in message listener:",K.message);return}throw K}};return $.call(this,j,J,X)}return $.call(this,j,G,X)}}catch($){}if(window.addEventListener("unhandledrejection",($)=>{let j=$.reason?.message||String($.reason||"");if(j.includes("__cmpCall")||j.includes("__cmp"))$.preventDefault()},!0),!window.__cmp){let $=function(){let j=Array.from(arguments);if(typeof j[2]==="function")try{j[2]({eventStatus:"tcloaded",gdprApplies:!1},!0)}catch(G){}};$.a=[],window.__cmp=$}if(!window.__tcfapi){let $=function(j,G,X){if(typeof X==="function")try{X({eventStatus:"tcloaded",gdprApplies:!1,tcString:"CP1234567890",listenerId:1},!0)}catch(J){}};$.a=[],window.__tcfapi=$}let Z=($)=>{try{let j=document.querySelector(`iframe[name="${$}"]`);if(!j){j=document.createElement("iframe"),j.name=$,j.id=$,j.style.display="none";let G=document.body||document.documentElement||document.head;if(G)G.appendChild(j)}if(j&&j.contentWindow)try{j.contentWindow.__cmpCall=Q.__cmpCall,j.contentWindow.__tcfapiCall=Q.__tcfapiCall}catch(G){}}catch(j){}};if(Z("__cmpLocator"),Z("__tcfapiLocator"),document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>{Z("__cmpLocator"),Z("__tcfapiLocator")});window.addEventListener("message",($)=>{try{if($.data&&typeof $.data==="object"&&$.data.__cmpCall){let j=$.data.__cmpCall;if($.source&&typeof $.source.postMessage==="function")$.source.postMessage({__cmpReturn:{returnValue:{eventStatus:"tcloaded",gdprApplies:!1},success:!0,callId:j?j.callId:null}},"*")}}catch(j){}},!0),window.addEventListener("error",($)=>{if($.message&&($.message.includes("__cmpCall")||$.message.includes("__cmp")))console.warn("SpotiLIE: Suppressed CMP TypeError:",$.message),$.stopImmediatePropagation(),$.preventDefault()},!0),console.log("SpotiLIE: CMP stub & locator iframes initialized")}catch(Q){console.error("SpotiLIE: Failed to initialize CMP stub",Q)}}var f=["/ad-logic/","/ads/","/ad-service/","/commercial/","spclient.wg.spotify.com/ads","spclient.wg.spotify.com/ad-logic","spclient.wg.spotify.com/commercial","spclient.wg.spotify.com/sponsored","spclient.wg.spotify.com/rewarded","spclient.wg.spotify.com/v1/ads","spclient.wg.spotify.com/ad-service","spclient.wg.spotify.com/adbreak","api.spotify.com/v1/ads","audio-ads.spotify.com","adeventtracker.spotify.com","ads-fa.spotify.com","adgen.spotify.com","ad-proxy.spotify.com","adstudio.spotify.com","ads.spotify.com","pixel.spotify.com","video-ak.cdn.spotify.com","adjust-callback.spotify.com","crashdump.spotify.com","datasharing.spotify.com","doubleclick.net","googleadservices.com","googletagservices.com","googlesyndication.com","google-analytics.com","pagead2.googlesyndication.com","securepubads.g.doubleclick.net","moatads.com","comscore.com","scorecardresearch.com","branch.io","branchster.link","app.link","facebook.com/tr","facebook.net/en_US/fbevents.js","connect.facebook.net","admob.com","adsrvr.org","adnxs.com","casalemedia.com","criteo.com","rubiconproject.com","openx.net","pubmatic.com","freewheel.tv","spotxchange.com","liveramp.com","rlcdn.com"],A=new RegExp(f.map((Q)=>Q.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|"),"i");function L(Q){return A.test(Q)}function b(Q){let Y=new Headers({"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"*","Access-Control-Allow-Methods":"*"});if(Q.includes(".js"))return Y.set("Content-Type","application/javascript"),new Response("",{status:200,headers:Y});return Y.set("Content-Type","application/json"),new Response("{}",{status:200,headers:Y})}function y(Q){if(!Q||typeof Q!=="object")return Q;if(Q.__spotilie_spoofed)return Q;try{Q.__spotilie_spoofed=!0}catch(Y){}if(Q.canPlayOnDemand!==void 0)Q.canPlayOnDemand=!0;if(Q.is_premium!==void 0)Q.is_premium=!0;if(Q.premium!==void 0&&typeof Q.premium==="boolean")Q.premium=!0;if(Q.product!==void 0&&typeof Q.product==="string"){if(Q.product==="free"||Q.product==="open")Q.product="premium"}if(Q.streaming_rules)Q.streaming_rules.advancement_disabled=!1,Q.streaming_rules.advancement_mode="NORMAL",Q.streaming_rules.skips_unlimited=!0,Q.streaming_rules.max_skips_per_hour=999;if(Q.skips_remaining!==void 0)Q.skips_remaining=999;if(Q.advancement)Q.advancement.advancement_mode="NORMAL",Q.advancement.advancement_disabled=!1,Q.advancement.skips_remaining=999;return Q}function C(){try{try{let J=Headers.prototype.set;Headers.prototype.set=function(K,_){if(K&&K.toLowerCase()==="x-cache-hint")return;return J.call(this,K,_)};let V=Headers.prototype.append;Headers.prototype.append=function(K,_){if(K&&K.toLowerCase()==="x-cache-hint")return;return V.call(this,K,_)}}catch(J){}let Q=JSON.parse;JSON.parse=function(J,V){try{let K=V?Q(J,V):Q(J);return y(K)}catch(K){try{return Q(J)}catch(_){return null}}};let Y=window.fetch;window.fetch=async function(J,V){let K=J,_=V,U=typeof K==="string"?K:K instanceof URL?K.toString():K.url;if(L(U))return b(U);try{if(K instanceof Request){if(K.headers.has("x-cache-hint")||K.headers.has("X-Cache-Hint")){let z=new Headers(K.headers);z.delete("x-cache-hint"),z.delete("X-Cache-Hint"),K=new Request(K,{headers:z})}}if(_&&_.headers){if(_.headers instanceof Headers)_.headers.delete("x-cache-hint"),_.headers.delete("X-Cache-Hint");else if(Array.isArray(_.headers))_.headers=_.headers.filter(([z])=>z.toLowerCase()!=="x-cache-hint");else if(typeof _.headers==="object")delete _.headers["x-cache-hint"],delete _.headers["X-Cache-Hint"]}}catch(z){}return Y.call(this,K,_)};let Z=XMLHttpRequest.prototype.open,$=XMLHttpRequest.prototype.send,j=XMLHttpRequest.prototype.setRequestHeader;XMLHttpRequest.prototype.setRequestHeader=function(J,V){if(J&&J.toLowerCase()==="x-cache-hint")return;return j.apply(this,arguments)},XMLHttpRequest.prototype.open=function(J,V){let K=V.toString();if(L(K))this.__blocked=!0;return Z.apply(this,arguments)};let G=navigator.sendBeacon;if(G)navigator.sendBeacon=function(J,V){if(L(J.toString()))return!0;return G.apply(this,arguments)};let X=window.Worker;if(X)window.Worker=function(J,V){let K=J.toString();if(K.startsWith("data:")||K.startsWith("blob:"))return new X(J,V);try{let _=`
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
            importScripts('${K}');
          `,U=new Blob([_],{type:"application/javascript"}),z=URL.createObjectURL(U);return new X(z,V)}catch(_){return new X(J,V)}},window.Worker.prototype=X.prototype;XMLHttpRequest.prototype.send=function(){if(this.__blocked){setTimeout(()=>{try{Object.defineProperty(this,"readyState",{get:()=>4,configurable:!0})}catch(J){}try{Object.defineProperty(this,"status",{get:()=>200,configurable:!0})}catch(J){}try{Object.defineProperty(this,"statusText",{get:()=>"OK",configurable:!0})}catch(J){}try{Object.defineProperty(this,"responseText",{get:()=>"{}",configurable:!0})}catch(J){}try{Object.defineProperty(this,"response",{get:()=>"{}",configurable:!0})}catch(J){}try{this.dispatchEvent(new Event("readystatechange"))}catch(J){}try{this.dispatchEvent(new Event("load"))}catch(J){}try{this.dispatchEvent(new Event("loadend"))}catch(J){}try{if(typeof this.onreadystatechange==="function")this.onreadystatechange()}catch(J){}try{if(typeof this.onload==="function")this.onload()}catch(J){}},10);return}return $.apply(this,arguments)},v(),g(),console.log("SpotiLIE: Nuclear adblock v4 initialized (DOM + Network + JSON + Audio)")}catch(Q){console.error("SpotiLIE: Failed to initialize adblock",Q)}}function v(){let Q=['[data-testid="ad-indicator"]','[data-testid="ad-sponsor-container"]','[data-testid="advertisement"]',".Root__ads-container",".nav-bar-ad-item",".desktop-media-picker-ads",'[class*="ad-slot"]','[class*="adSlot"]','[class*="AdSlot"]','iframe[src*="doubleclick"]','iframe[src*="googlesyndication"]','div[id*="google_ads"]','div[class*="video-ad"]','div[class*="videoAd"]'],Y=()=>{for(let $ of Q)try{document.querySelectorAll($).forEach((j)=>j.remove())}catch(j){}};Y(),setInterval(Y,500);let Z=()=>{new MutationObserver(Y).observe(document.body,{childList:!0,subtree:!0})};if(document.body)Z();else document.addEventListener("DOMContentLoaded",Z,{once:!0})}function g(){let Q=!1,Y=0,Z=null,$=0,j=[/advertisement/i,/anuncio/i,/anzeige/i,/publicit/i,/sponsor/i,/commercial/i,/^ad\s*[-–—]/i],G=()=>{let F=document.querySelector("audio, video");if(F?.src&&(F.src.includes("audio-ads")||F.src.includes("ad-logic")||F.src.includes("/ad/")))return!0;let H=(document.title||"").trim();if(H&&j.some((N)=>N.test(H)))return!0;if(document.querySelector('[data-testid="ad-indicator"], [data-testid="ad-sponsor-container"], .Root__ads-container, [class*="ad-overlay"], [class*="video-ad"], [class*="ad-slot"]'))return!0;let x=document.querySelector('[data-testid="context-item-info-title"], [data-testid="now-playing-widget"] [data-testid="context-item-link"]');if(x){let N=(x.textContent||"").toLowerCase().trim();if(N&&j.some((B)=>B.test(N)))return!0}let W=document.querySelector('[data-testid="context-item-link"], [data-testid="now-playing-bar"] a');if(W){let N=W.getAttribute("href")||"";if(N.includes("/ad/")||N.includes("advertisement"))return!0}return!1},X=()=>{document.querySelectorAll("audio, video").forEach((F)=>{let H=F;H.muted=!0;try{H.volume=0}catch(x){}})},J=()=>{document.querySelectorAll("audio, video").forEach((F)=>{let H=F;H.muted=!1;try{H.volume=1}catch(x){}})},V=()=>{let F=Date.now();if(F-$<800)return!1;$=F,X();let H=document.querySelector("audio, video");if(H)try{if(isFinite(H.duration)&&H.duration>0)H.currentTime=H.duration-0.01;else H.currentTime=999999;H.dispatchEvent(new Event("ended"))}catch(N){}let x=['button[data-testid="control-button-skip-forward"]','button[aria-label*="next" i]','button[aria-label*="skip" i]','button[aria-label*="siguiente" i]','[data-testid="skip-ad-button"]'],W=!1;for(let N of x)document.querySelectorAll(N).forEach((S)=>{let q=S;q.removeAttribute("disabled"),q.removeAttribute("aria-disabled");try{q.click(),W=!0}catch($Q){}});return W},K=()=>{if(Z)return;Y=0,Z=setInterval(()=>{if(!Q){clearInterval(Z),Z=null;return}if(X(),V(),Y++,Y>50)clearInterval(Z),Z=null},50)},_=()=>{if(Q)return;Q=!0,console.log("SpotiLIE: Audio ad detected — muting and seeking to end"),X(),V(),[20,50,100,200,400,800].forEach((F)=>setTimeout(V,F)),K()},U=()=>{if(!Q)return;if(Q=!1,Z)clearInterval(Z),Z=null;console.log("SpotiLIE: Audio ad ended — restoring audio"),J()},z=()=>{if(G())_();else U()},D=document.querySelector("title");if(D)new MutationObserver(z).observe(D,{subtree:!0,characterData:!0,childList:!0});let M=()=>{let F=document.querySelector('[data-testid="now-playing-bar"]')||document.querySelector(".Root__now-playing-bar");if(F)new MutationObserver(z).observe(F,{subtree:!0,childList:!0,attributes:!0})};if(document.body)M(),new MutationObserver(()=>M()).observe(document.body,{childList:!0});document.addEventListener("loadedmetadata",(F)=>{if(F.target?.tagName==="AUDIO")setTimeout(z,10),setTimeout(z,100)},!0),document.addEventListener("timeupdate",(F)=>{if(F.target?.tagName==="AUDIO"){if(G())_()}},!0),document.addEventListener("play",(F)=>{if(F.target?.tagName==="AUDIO")setTimeout(z,10),setTimeout(z,100)},!0),setInterval(z,250)}function I(){try{try{Object.defineProperty(navigator,"platform",{get:()=>"Win32",configurable:!0})}catch(Y){}try{Object.defineProperty(navigator,"vendor",{get:()=>"Google Inc.",configurable:!0})}catch(Y){}try{let Z=[{name:"Chrome PDF Plugin",filename:"internal-pdf-viewer",description:"Portable Document Format",length:1,item:()=>null,namedItem:()=>null}];Z.item=($)=>Z[$]||null,Z.namedItem=($)=>Z.find((j)=>j.name===$)||null,Object.defineProperty(navigator,"plugins",{get:()=>Z,configurable:!0})}catch(Y){}"userAgentData"in navigator;try{let Y={brands:[{brand:"Not-A.Brand",version:"99"},{brand:"Chromium",version:"124"},{brand:"Google Chrome",version:"124"}],mobile:!1,platform:"Windows",getHighEntropyValues:async(Z)=>({brands:[{brand:"Not-A.Brand",version:"99"},{brand:"Chromium",version:"124"},{brand:"Google Chrome",version:"124"}],mobile:!1,platform:"Windows",platformVersion:"10.0.0",architecture:"x86",bitness:"64",model:"",uaFullVersion:"124.0.6367.201",fullVersionList:[{brand:"Not-A.Brand",version:"99.0.0.0"},{brand:"Chromium",version:"124.0.6367.201"},{brand:"Google Chrome",version:"124.0.6367.201"}]}),toJSON:()=>({brands:[{brand:"Not-A.Brand",version:"99"},{brand:"Chromium",version:"124"},{brand:"Google Chrome",version:"124"}],mobile:!1,platform:"Windows"})};Object.defineProperty(navigator,"userAgentData",{get:()=>Y,configurable:!0})}catch(Y){console.warn("SpotiLIE: Failed to spoof userAgentData",Y)}let Q=navigator.requestMediaKeySystemAccess;if(Q&&!Q._spotilie_patched){let Y=function(Z,$){return console.log("SpotiLIE: EME requestMediaKeySystemAccess called for:",Z),Q.call(this,Z,$).then((j)=>{return console.log("SpotiLIE: EME requestMediaKeySystemAccess SUCCEEDED for:",Z),j}).catch((j)=>{console.warn("SpotiLIE: EME requestMediaKeySystemAccess failed with original configs, retrying with sanitized Android Widevine L3 configs...",j);try{let G=JSON.parse(JSON.stringify($));return G.forEach((X)=>{if(X.audioCapabilities)X.audioCapabilities.forEach((J)=>delete J.robustness);if(X.videoCapabilities)X.videoCapabilities.forEach((J)=>delete J.robustness)}),Q.call(this,Z,G).then((X)=>{return console.log("SpotiLIE: EME requestMediaKeySystemAccess SUCCEEDED with sanitized configs for:",Z),X}).catch(()=>{console.warn("SpotiLIE: Retrying EME with basic Widevine L3 config");let X=[{initDataTypes:["cenc"],audioCapabilities:[{contentType:'audio/mp4; codecs="mp4a.40.2"'},{contentType:'audio/webm; codecs="opus"'}]}];return Q.call(this,Z,X)})}catch(G){throw j}})};Y._spotilie_patched=!0,navigator.requestMediaKeySystemAccess=Y}k(),console.log("SpotiLIE: Hardware spoofing active (desktop layout + userAgentData + EME handler)")}catch(Q){console.error("SpotiLIE: Failed to spoof hardware",Q)}}function k(){let Q=()=>{try{let Y=window.AudioContext||window.webkitAudioContext;if(Y){let Z=new Y;if(Z.state==="suspended")Z.resume()}}catch(Y){}try{let Y=new Audio;Y.src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=",Y.play().then(()=>Y.pause()).catch(()=>{})}catch(Y){}document.removeEventListener("touchstart",Q,!0),document.removeEventListener("click",Q,!0)};document.addEventListener("touchstart",Q,!0),document.addEventListener("click",Q,!0)}function P(){let Q=document.createElement("style");Q.id="spotilie-ui",Q.textContent=u(),(()=>{let Z=document.head||document.documentElement;if(Z){if(!document.getElementById("spotilie-ui"))Z.appendChild(Q)}else document.addEventListener("DOMContentLoaded",()=>{let $=document.head||document.documentElement;if($&&!document.getElementById("spotilie-ui"))$.appendChild(Q)},{once:!0})})(),m(),p(),c(),s(),l()}function u(){return`
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
  `}function m(){let Q=document.querySelector('meta[name="viewport"]');if(!Q)Q=document.createElement("meta"),Q.name="viewport",(document.head||document.documentElement).appendChild(Q);Q.content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"}function p(){let Q=()=>{try{document.documentElement.style.setProperty("--app-nav-h","52px"),document.documentElement.style.setProperty("--player-h","148px"),document.documentElement.style.setProperty("--top-bar-h","56px")}catch(Y){}};Q(),window.visualViewport?.addEventListener("resize",Q),window.addEventListener("resize",Q)}function l(){let Q=globalThis.browser||globalThis.chrome;if(!Q?.runtime?.onMessage)return;Q.runtime.onMessage.addListener((Y)=>{if(Y?.type==="SET_NAV_HEIGHT"&&typeof Y.height==="number"){let Z=Math.max(0,Y.height);document.documentElement.style.setProperty("--sys-nav-h",`${Z}px`),document.documentElement.style.setProperty("--bottom-h",`${Z+52+148+6}px`);let $=document.getElementById("spotilie-bottom-nav");if($)$.style.setProperty("bottom",`calc(${Z}px + 6px)`,"important");console.log(`SpotiLIE: Nav height set to ${Z}px CSS from Kotlin`)}})}function R(Q){let Y=`a[href="${Q}"]`;if(Q==="/collection")Y='a[href^="/collection"], a[href="/collection/playlists"], a[href="/library"]';let Z=document.querySelector(Y);if(Z){Z.click();return}try{history.pushState(null,"",Q),window.dispatchEvent(new PopStateEvent("popstate"))}catch($){window.location.href=Q}}function c(){let Q=()=>{if(document.getElementById("spotilie-bottom-nav"))return;let Y=document.createElement("div");Y.id="spotilie-bottom-nav",Y.innerHTML=`
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
    `,Y.querySelectorAll(".nav-item").forEach((G)=>{G.addEventListener("click",()=>{let X=G.getAttribute("data-nav");if(X==="home")R("/");else if(X==="search")R("/search");else if(X==="library")R("/collection")})}),document.body.appendChild(Y);let Z=()=>{let G=window.location.pathname;Y.querySelectorAll(".nav-item").forEach((X)=>{X.classList.remove("active");let J=X.getAttribute("data-nav");if(J==="home"&&(G==="/"||G===""))X.classList.add("active");else if(J==="search"&&G.startsWith("/search"))X.classList.add("active");else if(J==="library"&&G.startsWith("/collection"))X.classList.add("active")})},$=history.pushState;history.pushState=function(){$.apply(this,arguments),Z()};let j=history.replaceState;history.replaceState=function(){j.apply(this,arguments),Z()},window.addEventListener("popstate",Z),Z()};if(document.body)Q();else{let Y=setInterval(()=>{if(document.body)clearInterval(Y),Q()},50)}}function s(){let Q=[".playback-bar",'[data-testid="playback-progressbar"]','[data-testid="progress-bar"]','[class*="progressBar"]','[class*="PlaybackBar"]','[class*="playback-bar"]','div[role="slider"]'],Y=()=>{for(let Z of Q)document.querySelectorAll(Z).forEach(($)=>{let j=$;j.style.setProperty("display","flex","important"),j.style.setProperty("visibility","visible","important"),j.style.setProperty("opacity","1","important"),j.style.setProperty("overflow","visible","important"),j.style.setProperty("min-width","120px","important"),j.style.setProperty("width","100%","important");let G=j.parentElement,X=0;while(G&&X<8){let J=getComputedStyle(G);if(J.overflow==="hidden"||J.overflowY==="hidden")G.style.setProperty("overflow","visible","important");if(J.display==="none")G.style.setProperty("display","flex","important");G=G.parentElement,X++}})};setTimeout(Y,500),setTimeout(Y,1500),setTimeout(Y,3000),setInterval(Y,5000)}function w(){n(),o(),i(),t(),a(),r(),d(),e()}function d(){window.addEventListener("online",()=>{console.log("SpotiLIE: Network connection restored — resuming audio"),setTimeout(()=>{let Q=document.querySelector("audio, video");if(Q&&Q.paused)window.spotilieMediaAction?.("play")},1000)}),window.addEventListener("error",(Q)=>{let Y=Q.target;if(Y?.tagName==="AUDIO"||Y?.tagName==="VIDEO")console.warn("SpotiLIE: HTMLMediaElement error — retrying playback"),setTimeout(()=>{let Z=document.querySelector('button[data-testid="control-button-playpause"]');if(Z)Z.click()},1500)},!0)}function o(){try{let Q=HTMLMediaElement.prototype.play;if(Q&&!Q._spotilie_patched){let Y=function(){return console.log("SpotiLIE: HTMLMediaElement.play() invoked on",this.src||this.currentSrc||"MSE stream"),Q.apply(this,arguments).then((Z)=>{return console.log("SpotiLIE: HTMLMediaElement.play() SUCCEEDED"),Z}).catch((Z)=>{throw console.error("SpotiLIE: HTMLMediaElement.play() REJECTED:",Z?.name,Z?.message,Z),Z})};Y._spotilie_patched=!0,HTMLMediaElement.prototype.play=Y}document.addEventListener("error",(Y)=>{let Z=Y.target;if(Z&&(Z.tagName==="AUDIO"||Z.tagName==="VIDEO")){let $=Z.error;console.error("SpotiLIE: Media Element Error Event:",$?.code,$?.message,Z.src)}},!0)}catch(Q){}}function n(){document.addEventListener("click",(Q)=>{let Y=Q.target;if(Y){let Z=`${Y.tagName}.${(Y.className||"").toString().slice(0,40)} [id=${Y.id||""}] [data-testid=${Y.getAttribute("data-testid")||""}]`;console.log("SpotiLIE Click Target:",Z)}},!0)}function r(){document.addEventListener("click",(Q)=>{if(!Q.isTrusted)return;let Y=Q.target;if(!Y)return;if(Y.closest('button, a[href*="/artist/"], a[href*="/album/"], [role="button"], [data-testid="more-button"], [data-testid="add-button"]'))return;let Z=Y.closest('[data-testid="tracklist-row"], [role="row"]');if(!Z)return;let $=Z.querySelector('button[aria-label*="Play" i], button[aria-label*="play" i], [data-testid="play-button"], [data-testid="row-play-button"], [data-encore-id="buttonPrimary"], [class*="playButton" i]');if(!$)$=Array.from(Z.querySelectorAll("button")).find((X)=>{let J=(X.getAttribute("aria-label")||X.getAttribute("data-testid")||X.className||"").toLowerCase();return J.includes("play")||J.includes("reproducir")})||null;if($){console.log("SpotiLIE: Track play button clicked via row tap"),$.click();return}let j=Z.querySelector('a[data-testid="internal-track-link"], a[href*="/track/"]');if(j)console.log("SpotiLIE: Clicking internal track link via row tap"),j.click()},!1)}function O(Q){for(let Y of Q){let Z=document.querySelector(Y);if(Z)try{return Z.click(),console.log(`SpotiLIE: Clicked media button via selector: ${Y}`),!0}catch($){console.warn(`SpotiLIE: Failed clicking ${Y}:`,$)}}return!1}function i(){window.spotilieMediaAction=(Q)=>{console.log(`SpotiLIE: spotilieMediaAction executed for action '${Q}'`);let Y=document.querySelector("audio, video");if(Q==="play"){if(!O(['button[data-testid="control-button-playpause"]','button[aria-label*="Play" i]','button[aria-label*="reproducir" i]'])||Y&&Y.paused)Y?.play().catch(()=>{})}else if(Q==="pause"){if(O(['button[data-testid="control-button-playpause"]','button[aria-label*="Pause" i]']),Y&&!Y.paused)Y.pause()}else if(Q==="toggle"){if(!O(['button[data-testid="control-button-playpause"]'])&&Y)if(Y.paused)Y.play().catch(()=>{});else Y.pause()}else if(Q==="next")O(['button[data-testid="control-button-skip-forward"]','button[aria-label*="Next" i]','button[aria-label*="Siguiente" i]','[data-testid="skip-ad-button"]']);else if(Q==="prev")O(['button[data-testid="control-button-skip-back"]','button[aria-label*="Previous" i]','button[aria-label*="Anterior" i]'])}}function a(){try{if(!navigator.mediaDevices?.addEventListener)return;navigator.mediaDevices.addEventListener("devicechange",()=>{setTimeout(()=>{let Q=document.querySelector("audio, video");if(Q&&!Q.paused)console.log("SpotiLIE: Audio output device changed/disconnected — pausing playback"),Q.pause(),O(['button[data-testid="control-button-playpause"]'])},250)})}catch(Q){console.warn("SpotiLIE: Could not set up Bluetooth pause guard",Q)}}function t(){try{let Q=globalThis.browser||globalThis.chrome;if(!Q?.runtime?.onMessage)return;Q.runtime.onMessage.addListener((Y)=>{if(Y?.type==="MEDIA_ACTION"&&typeof Y.action==="string")return console.log("SpotiLIE: MEDIA_ACTION received from native bridge:",Y.action),window.spotilieMediaAction?.(Y.action),!0}),console.log("SpotiLIE: Native message listener active")}catch(Q){console.warn("SpotiLIE: Could not set up native message listener",Q)}}function e(){}function T(){let Q={title:"",artist:"",isPlaying:!1},Y=null,Z=!1,$=!1,j=()=>{let z=document.title||"",D=z.indexOf(" - ");if(D<1)return null;let M=z.substring(0,D).trim(),F=z.substring(D+3).trim(),H=F.lastIndexOf(" · ");if(H>0)F=F.substring(0,H).trim();if(!M||M.toLowerCase()==="spotify")return null;return{title:M,artist:F,isPlaying:X()}},G=()=>{try{let z=document.querySelector('[data-testid="context-item-info-title"]')||document.querySelector('[data-testid="now-playing-widget"] [data-testid="context-item-link"]'),D=document.querySelector('[data-testid="context-item-info-subtitles"]')||document.querySelector('[data-testid="now-playing-widget"] [data-testid="context-item-info-subtitles"]');if(!z||!D)return null;let M=(z.textContent||"").trim(),F=(D.textContent||"").trim();if(!M||M.toLowerCase()==="advertisement")return null;return{title:M,artist:F,isPlaying:X()}}catch(z){return null}},X=()=>{let z=document.querySelector('button[data-testid="control-button-playpause"]');if(z)return(z.getAttribute("aria-label")||"").toLowerCase()==="pause";return!!document.querySelector('button[aria-label="Pause"]')},J=(z)=>{if(!z.title)return;if(z.title===Q.title&&z.artist===Q.artist&&z.isPlaying===Q.isPlaying)return;Q={...z};try{let D=globalThis.browser||globalThis.chrome;if(D?.runtime?.sendMessage){D.runtime.sendMessage({type:"UPDATE_METADATA",title:z.title,artist:z.artist,isPlaying:z.isPlaying}).catch(()=>{}),console.log(`SpotiLIE: Metadata sent → "${z.title}" by "${z.artist}" playing=${z.isPlaying}`);return}}catch(D){}try{let D=window.__TAURI__?.core?.invoke||window.__TAURI_INTERNALS__?.invoke;if(D)D("update_media_info",{title:z.title,artist:z.artist,isPlaying:z.isPlaying})}catch(D){}},V=()=>{if(Y)clearTimeout(Y);Y=setTimeout(()=>{let z=j()||G();if(z)J(z)},250)},K=()=>{if(Z)return;let z=document.querySelector("title");if(!z)return;Z=!0,new MutationObserver(V).observe(z,{subtree:!0,characterData:!0,childList:!0})},_=()=>{if($)return;let z=document.querySelector('[data-testid="now-playing-bar"]')||document.querySelector(".Root__now-playing-bar");if(!z)return;$=!0,new MutationObserver(V).observe(z,{subtree:!0,characterData:!0,childList:!0,attributes:!0,attributeFilter:["aria-label"]})};setInterval(V,2000),document.addEventListener("play",(z)=>{if(z.target?.tagName==="AUDIO")V()},!0),document.addEventListener("pause",(z)=>{if(z.target?.tagName==="AUDIO")V()},!0);let U=()=>{K(),_()};if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",U);else U();if(document.body){let z=new MutationObserver(()=>{if(!$)_();if(!Z)K();if($&&Z)z.disconnect()});z.observe(document.body,{childList:!0,subtree:!1})}}function h(){try{QQ(),YQ(),ZQ(),console.log("SpotiLIE: Premium features module active")}catch(Q){console.error("SpotiLIE: Premium features init failed",Q)}}function QQ(){let Q=Response.prototype.json;Response.prototype.json=async function(){let Y=await Q.call(this);if(!Y||typeof Y!=="object")return Y;if(Y.skips_remaining!==void 0)Y.skips_remaining=999;if(Y.advancement)Y.advancement.advancement_mode="NORMAL",Y.advancement.advancement_disabled=!1;if(Y.enableLyrics!==void 0)Y.enableLyrics=!0;if(Y.canShowLyrics!==void 0)Y.canShowLyrics=!0;if(Y.lyricsEnabled!==void 0)Y.lyricsEnabled=!0;if(Y.features){if(Y.features.enableLyrics!==void 0)Y.features.enableLyrics=!0;if(Y.features.lyrics!==void 0)Y.features.lyrics=!0}return Y}}function YQ(){try{let Q=localStorage.getItem("playback.settings");if(Q)try{let Y=JSON.parse(Q),Z=!1;if(!Y.autoplay)Y.autoplay=!0,Z=!0;if(Y.crossfade===void 0)Y.crossfade=0,Z=!0;if(Z)localStorage.setItem("playback.settings",JSON.stringify(Y))}catch(Y){}}catch(Q){}}function ZQ(){setInterval(()=>{let Y=document.querySelector('[data-testid="connect-device-picker-button"]');if(Y)Y.style.removeProperty("display"),Y.style.removeProperty("visibility"),Y.style.removeProperty("opacity")},5000)}(function(){if(window._spotilie_initialized)return;window._spotilie_initialized=!0,console.log("SpotiLIE: Injector Active v2.0 (Nuclear Edition)"),C(),E(),I(),h(),P(),w(),T()})();
