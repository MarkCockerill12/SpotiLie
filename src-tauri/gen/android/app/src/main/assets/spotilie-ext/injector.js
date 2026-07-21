function q(){try{let Q={__cmpCall:function(){},__tcfapiCall:function(){},postMessage:function(Z){try{if(Z&&typeof Z==="object"&&Z.__cmpCall){let J=Z.__cmpCall;window.postMessage({__cmpReturn:{returnValue:{eventStatus:"tcloaded",gdprApplies:!1},success:!0,callId:J?J.callId:null}},"*")}}catch(J){}}};Q.contentWindow=Q,Q.frames=Q,Q.__cmpLocator=Q,Q.__tcfapiLocator=Q;try{let Z=Object.getOwnPropertyDescriptor(MessageEvent.prototype,"source");if(Z&&Z.get){let J=Z.get;Object.defineProperty(MessageEvent.prototype,"source",{get:function(){return J.call(this)||Q},configurable:!0})}}catch(Z){}try{if(!("__cmpCall"in Object.prototype))Object.defineProperty(Object.prototype,"__cmpCall",{get:function(){return Q.__cmpCall},configurable:!0});if(!("__tcfapiCall"in Object.prototype))Object.defineProperty(Object.prototype,"__tcfapiCall",{get:function(){return Q.__tcfapiCall},configurable:!0})}catch(Z){}let Y=[window,window.top,window.parent,globalThis];for(let Z of Y){if(!Z)continue;try{Z.__cmpLocator=Q,Z.__tcfapiLocator=Q,Z.__cmpCall=Q.__cmpCall}catch(J){}}try{let Z=window.addEventListener;window.addEventListener=function(J,V,G){if(J==="message"&&typeof V==="function"){let K=function(F){try{if(F&&typeof F==="object"&&"source"in F)try{Object.defineProperty(F,"source",{get:()=>Q,configurable:!0})}catch(z){}return V.apply(this,arguments)}catch(z){if(z&&z.message&&(z.message.includes("__cmpCall")||z.message.includes("__cmp"))){console.warn("SpotiLIE: Suppressed CMP error in message listener:",z.message);return}throw z}};return Z.call(this,J,K,G)}return Z.call(this,J,V,G)}}catch(Z){}if(window.addEventListener("unhandledrejection",(Z)=>{let J=Z.reason?.message||String(Z.reason||"");if(J.includes("__cmpCall")||J.includes("__cmp"))Z.preventDefault()},!0),!window.__cmp){let Z=function(){let J=Array.from(arguments);if(typeof J[2]==="function")try{J[2]({eventStatus:"tcloaded",gdprApplies:!1},!0)}catch(V){}};Z.a=[],window.__cmp=Z}if(!window.__tcfapi){let Z=function(J,V,G){if(typeof G==="function")try{G({eventStatus:"tcloaded",gdprApplies:!1,tcString:"CP1234567890",listenerId:1},!0)}catch(K){}};Z.a=[],window.__tcfapi=Z}let $=(Z)=>{try{let J=document.querySelector(`iframe[name="${Z}"]`);if(!J){J=document.createElement("iframe"),J.name=Z,J.id=Z,J.style.display="none";let V=document.body||document.documentElement||document.head;if(V)V.appendChild(J)}if(J&&J.contentWindow)try{J.contentWindow.__cmpCall=Q.__cmpCall,J.contentWindow.__tcfapiCall=Q.__tcfapiCall}catch(V){}}catch(J){}};if($("__cmpLocator"),$("__tcfapiLocator"),document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>{$("__cmpLocator"),$("__tcfapiLocator")});window.addEventListener("message",(Z)=>{try{if(Z.data&&typeof Z.data==="object"&&Z.data.__cmpCall){let J=Z.data.__cmpCall;if(Z.source&&typeof Z.source.postMessage==="function")Z.source.postMessage({__cmpReturn:{returnValue:{eventStatus:"tcloaded",gdprApplies:!1},success:!0,callId:J?J.callId:null}},"*")}}catch(J){}},!0),window.addEventListener("error",(Z)=>{if(Z.message&&(Z.message.includes("__cmpCall")||Z.message.includes("__cmp")))console.warn("SpotiLIE: Suppressed CMP TypeError:",Z.message),Z.stopImmediatePropagation(),Z.preventDefault()},!0),console.log("SpotiLIE: CMP stub & locator iframes initialized")}catch(Q){console.error("SpotiLIE: Failed to initialize CMP stub",Q)}}var T=["/ad-logic/","/ads/","/ad-service/","/commercial/","spclient.wg.spotify.com/ads","spclient.wg.spotify.com/ad-logic","spclient.wg.spotify.com/commercial","spclient.wg.spotify.com/sponsored","spclient.wg.spotify.com/rewarded","spclient.wg.spotify.com/v1/ads","spclient.wg.spotify.com/ad-service","spclient.wg.spotify.com/adbreak","api.spotify.com/v1/ads","audio-ads.spotify.com","adeventtracker.spotify.com","ads-fa.spotify.com","adgen.spotify.com","ad-proxy.spotify.com","adstudio.spotify.com","ads.spotify.com","pixel.spotify.com","video-ak.cdn.spotify.com","adjust-callback.spotify.com","crashdump.spotify.com","datasharing.spotify.com","doubleclick.net","googleadservices.com","googletagservices.com","googlesyndication.com","google-analytics.com","pagead2.googlesyndication.com","securepubads.g.doubleclick.net","moatads.com","comscore.com","scorecardresearch.com","branch.io","branchster.link","app.link","facebook.com/tr","facebook.net/en_US/fbevents.js","connect.facebook.net","admob.com","adsrvr.org","adnxs.com","casalemedia.com","criteo.com","rubiconproject.com","openx.net","pubmatic.com","freewheel.tv","spotxchange.com","liveramp.com","rlcdn.com"],P=new RegExp(T.map((Q)=>Q.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|"),"i");function O(Q){return P.test(Q)}function w(Q){let Y=new Headers({"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"*","Access-Control-Allow-Methods":"*"});if(Q.includes(".js"))return Y.set("Content-Type","application/javascript"),new Response("",{status:200,headers:Y});return Y.set("Content-Type","application/json"),new Response("{}",{status:200,headers:Y})}function U(Q){if(!Q||typeof Q!=="object")return;if(Q.isAd!==void 0)Q.isAd=!1;if(Q.is_advertisement!==void 0)Q.is_advertisement="false";if(Q.adBreak!==void 0)Q.adBreak=null;if(Q.ad_id!==void 0)delete Q.ad_id;if(Q.ad_type!==void 0)delete Q.ad_type;if(Q.advertisement!==void 0)delete Q.advertisement}function S(Q){if(!Q||typeof Q!=="object")return Q;if(Q.__spotilie_spoofed)return Q;try{Q.__spotilie_spoofed=!0}catch(Y){}if(Q.canPlayOnDemand!==void 0)Q.canPlayOnDemand=!0;if(Q.is_premium!==void 0)Q.is_premium=!0;if(Q.premium!==void 0&&typeof Q.premium==="boolean")Q.premium=!0;if(Q.product!==void 0&&typeof Q.product==="string"){if(Q.product==="free"||Q.product==="open")Q.product="premium"}if(Q.streaming_rules)Q.streaming_rules.advancement_disabled=!1,Q.streaming_rules.advancement_mode="NORMAL",Q.streaming_rules.skips_unlimited=!0,Q.streaming_rules.max_skips_per_hour=999;if(Q.skips_remaining!==void 0)Q.skips_remaining=999;if(Q.advancement)Q.advancement.advancement_mode="NORMAL",Q.advancement.advancement_disabled=!1,Q.advancement.skips_remaining=999;if(U(Q.track),U(Q.item),U(Q.current_track),U(Q.context_track),Array.isArray(Q.next_tracks))Q.next_tracks.forEach(U);if(Array.isArray(Q.prev_tracks))Q.prev_tracks.forEach(U);return Q}function B(){try{try{let K=Headers.prototype.set;Headers.prototype.set=function(z,_){if(z&&z.toLowerCase()==="x-cache-hint")return;return K.call(this,z,_)};let F=Headers.prototype.append;Headers.prototype.append=function(z,_){if(z&&z.toLowerCase()==="x-cache-hint")return;return F.call(this,z,_)}}catch(K){}let Q=JSON.parse;JSON.parse=function(K,F){try{let z=F?Q(K,F):Q(K);return S(z)}catch(z){try{return Q(K)}catch(_){return null}}};let Y=window.fetch;window.fetch=async function(K,F){let z=K,_=F,H=typeof z==="string"?z:z instanceof URL?z.toString():z.url;if(O(H))return w(H);try{if(z instanceof Request){if(z.headers.has("x-cache-hint")||z.headers.has("X-Cache-Hint")){let X=new Headers(z.headers);X.delete("x-cache-hint"),X.delete("X-Cache-Hint"),z=new Request(z,{headers:X})}}if(_&&_.headers){if(_.headers instanceof Headers)_.headers.delete("x-cache-hint"),_.headers.delete("X-Cache-Hint");else if(Array.isArray(_.headers))_.headers=_.headers.filter(([X])=>X.toLowerCase()!=="x-cache-hint");else if(typeof _.headers==="object")delete _.headers["x-cache-hint"],delete _.headers["X-Cache-Hint"]}}catch(X){}return Y.call(this,z,_)};let $=XMLHttpRequest.prototype.open,Z=XMLHttpRequest.prototype.send,J=XMLHttpRequest.prototype.setRequestHeader;XMLHttpRequest.prototype.setRequestHeader=function(K,F){if(K&&K.toLowerCase()==="x-cache-hint")return;return J.apply(this,arguments)},XMLHttpRequest.prototype.open=function(K,F){let z=F.toString();if(O(z))this.__blocked=!0;return $.apply(this,arguments)};let V=navigator.sendBeacon;if(V)navigator.sendBeacon=function(K,F){if(O(K.toString()))return!0;return V.apply(this,arguments)};let G=window.Worker;if(G)window.Worker=function(K,F){let z=K.toString();if(z.startsWith("data:")||z.startsWith("blob:"))return new G(K,F);try{let _=`
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
            importScripts('${z}');
          `,H=new Blob([_],{type:"application/javascript"}),X=URL.createObjectURL(H);return new G(X,F)}catch(_){return new G(K,F)}},window.Worker.prototype=G.prototype;XMLHttpRequest.prototype.send=function(){if(this.__blocked){setTimeout(()=>{try{Object.defineProperty(this,"readyState",{get:()=>4,configurable:!0})}catch(K){}try{Object.defineProperty(this,"status",{get:()=>200,configurable:!0})}catch(K){}try{Object.defineProperty(this,"statusText",{get:()=>"OK",configurable:!0})}catch(K){}try{Object.defineProperty(this,"responseText",{get:()=>"{}",configurable:!0})}catch(K){}try{Object.defineProperty(this,"response",{get:()=>"{}",configurable:!0})}catch(K){}try{this.dispatchEvent(new Event("readystatechange"))}catch(K){}try{this.dispatchEvent(new Event("load"))}catch(K){}try{this.dispatchEvent(new Event("loadend"))}catch(K){}try{if(typeof this.onreadystatechange==="function")this.onreadystatechange()}catch(K){}try{if(typeof this.onload==="function")this.onload()}catch(K){}},10);return}return Z.apply(this,arguments)},A(),h(),console.log("SpotiLIE: Nuclear adblock v4 initialized (DOM + Network + JSON + Audio)")}catch(Q){console.error("SpotiLIE: Failed to initialize adblock",Q)}}function A(){let Q=['[data-testid="ad-indicator"]','[data-testid="ad-sponsor-container"]','[data-testid="advertisement"]',".Root__ads-container",".nav-bar-ad-item",".desktop-media-picker-ads",'[class*="ad-slot"]','[class*="adSlot"]','[class*="AdSlot"]','iframe[src*="doubleclick"]','iframe[src*="googlesyndication"]','div[id*="google_ads"]','div[class*="video-ad"]','div[class*="videoAd"]'],Y=()=>{for(let Z of Q)try{document.querySelectorAll(Z).forEach((J)=>J.remove())}catch(J){}};Y(),setInterval(Y,500);let $=()=>{new MutationObserver(Y).observe(document.body,{childList:!0,subtree:!0})};if(document.body)$();else document.addEventListener("DOMContentLoaded",$,{once:!0})}function h(){let Q=!1,Y=[/\badvertisement\b/i,/\banuncio\b/i,/\banzeige\b/i,/\bpublicité\b/i,/\bpublicite\b/i,/\bsponsored\b/i,/\bspotify premium\b/i,/\bcommercial\b/i],$=()=>{let z=document.querySelector("audio, video");if(z?.src&&(z.src.includes("audio-ads")||z.src.includes("ad-logic")||z.src.includes("/ad/")))return!0;let _=(document.title||"").trim();if(_&&Y.some((D)=>D.test(_)))return!0;if(document.querySelector('[data-testid="ad-indicator"], [data-testid="ad-sponsor-container"], .Root__ads-container, [class*="ad-overlay"], [class*="video-ad"], [class*="ad-slot"]'))return!0;let H=document.querySelector('[data-testid="context-item-info-title"], [data-testid="now-playing-widget"] [data-testid="context-item-link"]');if(H){let D=(H.textContent||"").toLowerCase().trim();if(D&&Y.some((M)=>M.test(D)))return!0}let X=document.querySelector('[data-testid="context-item-link"], [data-testid="now-playing-bar"] a');if(X){let D=X.getAttribute("href")||"";if(D.includes("/ad/")||D.includes("advertisement"))return!0}return!1},Z=()=>{document.querySelectorAll("audio, video").forEach((z)=>{let _=z;_.muted=!0;try{_.volume=0}catch(H){}})},J=()=>{document.querySelectorAll("audio, video").forEach((z)=>{let _=z;_.muted=!1;try{_.volume=1}catch(H){}})},V=()=>{Z();let z=document.querySelector("audio, video");if(z)try{if(isFinite(z.duration)&&z.duration>0)z.currentTime=z.duration-0.01;else z.currentTime=999999;z.dispatchEvent(new Event("ended"))}catch(H){}let _=['button[data-testid="control-button-skip-forward"]','button[aria-label*="next" i]','button[aria-label*="skip" i]','button[aria-label*="siguiente" i]','[data-testid="skip-ad-button"]'];for(let H of _)document.querySelectorAll(H).forEach((D)=>{let M=D;M.removeAttribute("disabled"),M.removeAttribute("aria-disabled");try{M.click()}catch(N){}})},G=()=>{if($()){if(!Q)Q=!0,console.log("SpotiLIE: Audio ad detected — skipping");V()}else if(Q)Q=!1,console.log("SpotiLIE: Ad ended — restoring audio"),J()},K=document.querySelector("title");if(K)new MutationObserver(G).observe(K,{subtree:!0,characterData:!0,childList:!0});let F=()=>{let z=document.querySelector('[data-testid="now-playing-bar"]')||document.querySelector(".Root__now-playing-bar");if(z)new MutationObserver(G).observe(z,{subtree:!0,childList:!0,attributes:!0})};if(document.body)F(),new MutationObserver(()=>F()).observe(document.body,{childList:!0});document.addEventListener("loadedmetadata",(z)=>{if(z.target?.tagName==="AUDIO")G()},!0),document.addEventListener("play",(z)=>{if(z.target?.tagName==="AUDIO")G()},!0),setInterval(G,500)}function L(){try{try{Object.defineProperty(navigator,"platform",{get:()=>"Win32",configurable:!0})}catch(Y){}try{Object.defineProperty(navigator,"vendor",{get:()=>"Google Inc.",configurable:!0})}catch(Y){}try{let $=[{name:"Chrome PDF Plugin",filename:"internal-pdf-viewer",description:"Portable Document Format",length:1,item:()=>null,namedItem:()=>null}];$.item=(Z)=>$[Z]||null,$.namedItem=(Z)=>$.find((J)=>J.name===Z)||null,Object.defineProperty(navigator,"plugins",{get:()=>$,configurable:!0})}catch(Y){}"userAgentData"in navigator;try{let Y={brands:[{brand:"Not-A.Brand",version:"99"},{brand:"Chromium",version:"124"},{brand:"Google Chrome",version:"124"}],mobile:!1,platform:"Windows",getHighEntropyValues:async($)=>({brands:[{brand:"Not-A.Brand",version:"99"},{brand:"Chromium",version:"124"},{brand:"Google Chrome",version:"124"}],mobile:!1,platform:"Windows",platformVersion:"10.0.0",architecture:"x86",bitness:"64",model:"",uaFullVersion:"124.0.6367.201",fullVersionList:[{brand:"Not-A.Brand",version:"99.0.0.0"},{brand:"Chromium",version:"124.0.6367.201"},{brand:"Google Chrome",version:"124.0.6367.201"}]}),toJSON:()=>({brands:[{brand:"Not-A.Brand",version:"99"},{brand:"Chromium",version:"124"},{brand:"Google Chrome",version:"124"}],mobile:!1,platform:"Windows"})};Object.defineProperty(navigator,"userAgentData",{get:()=>Y,configurable:!0})}catch(Y){console.warn("SpotiLIE: Failed to spoof userAgentData",Y)}let Q=navigator.requestMediaKeySystemAccess;if(Q&&!Q._spotilie_patched){let Y=function($,Z){return console.log("SpotiLIE: EME requestMediaKeySystemAccess called for:",$),Q.call(this,$,Z).then((J)=>{return console.log("SpotiLIE: EME requestMediaKeySystemAccess SUCCEEDED for:",$),J}).catch((J)=>{console.warn("SpotiLIE: EME requestMediaKeySystemAccess failed with original configs, retrying with sanitized Android Widevine L3 configs...",J);try{let V=JSON.parse(JSON.stringify(Z));return V.forEach((G)=>{if(G.audioCapabilities)G.audioCapabilities.forEach((K)=>delete K.robustness);if(G.videoCapabilities)G.videoCapabilities.forEach((K)=>delete K.robustness)}),Q.call(this,$,V).then((G)=>{return console.log("SpotiLIE: EME requestMediaKeySystemAccess SUCCEEDED with sanitized configs for:",$),G}).catch(()=>{console.warn("SpotiLIE: Retrying EME with basic Widevine L3 config");let G=[{initDataTypes:["cenc"],audioCapabilities:[{contentType:'audio/mp4; codecs="mp4a.40.2"'},{contentType:'audio/webm; codecs="opus"'}]}];return Q.call(this,$,G)})}catch(V){throw J}})};Y._spotilie_patched=!0,navigator.requestMediaKeySystemAccess=Y}f(),console.log("SpotiLIE: Hardware spoofing active (desktop layout + userAgentData + EME handler)")}catch(Q){console.error("SpotiLIE: Failed to spoof hardware",Q)}}function f(){let Q=()=>{try{let Y=window.AudioContext||window.webkitAudioContext;if(Y){let $=new Y;if($.state==="suspended")$.resume()}}catch(Y){}try{let Y=new Audio;Y.src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=",Y.play().then(()=>Y.pause()).catch(()=>{})}catch(Y){}document.removeEventListener("touchstart",Q,!0),document.removeEventListener("click",Q,!0)};document.addEventListener("touchstart",Q,!0),document.addEventListener("click",Q,!0)}function R(){let Q=document.createElement("style");Q.id="spotilie-ui",Q.textContent=y(),(()=>{let $=document.head||document.documentElement;if($){if(!document.getElementById("spotilie-ui"))$.appendChild(Q)}else document.addEventListener("DOMContentLoaded",()=>{let Z=document.head||document.documentElement;if(Z&&!document.getElementById("spotilie-ui"))Z.appendChild(Q)},{once:!0})})(),b(),v(),g(),u(),k()}function y(){return`
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
  `}function b(){let Q=document.querySelector('meta[name="viewport"]');if(!Q)Q=document.createElement("meta"),Q.name="viewport",(document.head||document.documentElement).appendChild(Q);Q.content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"}function v(){let Q=()=>{try{document.documentElement.style.setProperty("--app-nav-h","52px"),document.documentElement.style.setProperty("--player-h","148px"),document.documentElement.style.setProperty("--top-bar-h","56px")}catch(Y){}};Q(),window.visualViewport?.addEventListener("resize",Q),window.addEventListener("resize",Q)}function k(){let Q=globalThis.browser||globalThis.chrome;if(!Q?.runtime?.onMessage)return;Q.runtime.onMessage.addListener((Y)=>{if(Y?.type==="SET_NAV_HEIGHT"&&typeof Y.height==="number"){let $=Math.max(0,Y.height);document.documentElement.style.setProperty("--sys-nav-h",`${$}px`),document.documentElement.style.setProperty("--bottom-h",`${$+52+148+6}px`);let Z=document.getElementById("spotilie-bottom-nav");if(Z)Z.style.setProperty("bottom",`calc(${$}px + 6px)`,"important");console.log(`SpotiLIE: Nav height set to ${$}px CSS from Kotlin`)}})}function W(Q){let Y=`a[href="${Q}"]`;if(Q==="/collection")Y='a[href^="/collection"], a[href="/collection/playlists"], a[href="/library"]';let $=document.querySelector(Y);if($){$.click();return}try{history.pushState(null,"",Q),window.dispatchEvent(new PopStateEvent("popstate"))}catch(Z){window.location.href=Q}}function g(){let Q=()=>{if(document.getElementById("spotilie-bottom-nav"))return;let Y=document.createElement("div");Y.id="spotilie-bottom-nav",Y.innerHTML=`
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
    `,Y.querySelectorAll(".nav-item").forEach((V)=>{V.addEventListener("click",()=>{let G=V.getAttribute("data-nav");if(G==="home")W("/");else if(G==="search")W("/search");else if(G==="library")W("/collection")})}),document.body.appendChild(Y);let $=()=>{let V=window.location.pathname;Y.querySelectorAll(".nav-item").forEach((G)=>{G.classList.remove("active");let K=G.getAttribute("data-nav");if(K==="home"&&(V==="/"||V===""))G.classList.add("active");else if(K==="search"&&V.startsWith("/search"))G.classList.add("active");else if(K==="library"&&V.startsWith("/collection"))G.classList.add("active")})},Z=history.pushState;history.pushState=function(){Z.apply(this,arguments),$()};let J=history.replaceState;history.replaceState=function(){J.apply(this,arguments),$()},window.addEventListener("popstate",$),$()};if(document.body)Q();else{let Y=setInterval(()=>{if(document.body)clearInterval(Y),Q()},50)}}function u(){let Q=[".playback-bar",'[data-testid="playback-progressbar"]','[data-testid="progress-bar"]','[class*="progressBar"]','[class*="PlaybackBar"]','[class*="playback-bar"]','div[role="slider"]'],Y=()=>{for(let $ of Q)document.querySelectorAll($).forEach((Z)=>{let J=Z;J.style.setProperty("display","flex","important"),J.style.setProperty("visibility","visible","important"),J.style.setProperty("opacity","1","important"),J.style.setProperty("overflow","visible","important"),J.style.setProperty("min-width","120px","important"),J.style.setProperty("width","100%","important");let V=J.parentElement,G=0;while(V&&G<8){let K=getComputedStyle(V);if(K.overflow==="hidden"||K.overflowY==="hidden")V.style.setProperty("overflow","visible","important");if(K.display==="none")V.style.setProperty("display","flex","important");V=V.parentElement,G++}})};setTimeout(Y,500),setTimeout(Y,1500),setTimeout(Y,3000),setInterval(Y,5000)}function E(){l(),p(),s(),o(),d(),c(),m(),n()}function m(){window.addEventListener("online",()=>{console.log("SpotiLIE: Network connection restored — resuming audio"),setTimeout(()=>{let Q=document.querySelector("audio, video");if(Q&&Q.paused)window.spotilieMediaAction?.("play")},1000)}),window.addEventListener("error",(Q)=>{let Y=Q.target;if(Y?.tagName==="AUDIO"||Y?.tagName==="VIDEO")console.warn("SpotiLIE: HTMLMediaElement error — retrying playback"),setTimeout(()=>{let $=document.querySelector('button[data-testid="control-button-playpause"]');if($)$.click()},1500)},!0)}function p(){try{let Q=HTMLMediaElement.prototype.play;if(Q&&!Q._spotilie_patched){let Y=function(){return console.log("SpotiLIE: HTMLMediaElement.play() invoked on",this.src||this.currentSrc||"MSE stream"),Q.apply(this,arguments).then(($)=>{return console.log("SpotiLIE: HTMLMediaElement.play() SUCCEEDED"),$}).catch(($)=>{throw console.error("SpotiLIE: HTMLMediaElement.play() REJECTED:",$?.name,$?.message,$),$})};Y._spotilie_patched=!0,HTMLMediaElement.prototype.play=Y}document.addEventListener("error",(Y)=>{let $=Y.target;if($&&($.tagName==="AUDIO"||$.tagName==="VIDEO")){let Z=$.error;console.error("SpotiLIE: Media Element Error Event:",Z?.code,Z?.message,$.src)}},!0)}catch(Q){}}function l(){document.addEventListener("click",(Q)=>{let Y=Q.target;if(Y){let $=`${Y.tagName}.${(Y.className||"").toString().slice(0,40)} [id=${Y.id||""}] [data-testid=${Y.getAttribute("data-testid")||""}]`;console.log("SpotiLIE Click Target:",$)}},!0)}function c(){document.addEventListener("click",(Q)=>{if(!Q.isTrusted)return;let Y=Q.target;if(!Y)return;if(Y.closest('button, a[href*="/artist/"], a[href*="/album/"], [role="button"], [data-testid="more-button"], [data-testid="add-button"]'))return;let $=Y.closest('[data-testid="tracklist-row"], [role="row"]');if(!$)return;let Z=$.querySelector('button[aria-label*="Play" i], button[aria-label*="play" i], [data-testid="play-button"], [data-testid="row-play-button"], [data-encore-id="buttonPrimary"], [class*="playButton" i]');if(!Z)Z=Array.from($.querySelectorAll("button")).find((G)=>{let K=(G.getAttribute("aria-label")||G.getAttribute("data-testid")||G.className||"").toLowerCase();return K.includes("play")||K.includes("reproducir")})||null;if(Z){console.log("SpotiLIE: Track play button clicked via row tap"),Z.click();return}let J=$.querySelector('a[data-testid="internal-track-link"], a[href*="/track/"]');if(J)console.log("SpotiLIE: Clicking internal track link via row tap"),J.click()},!1)}function x(Q){for(let Y of Q){let $=document.querySelector(Y);if($)try{return $.click(),console.log(`SpotiLIE: Clicked media button via selector: ${Y}`),!0}catch(Z){console.warn(`SpotiLIE: Failed clicking ${Y}:`,Z)}}return!1}function s(){window.spotilieMediaAction=(Q)=>{console.log(`SpotiLIE: spotilieMediaAction executed for action '${Q}'`);let Y=document.querySelector("audio, video");if(Q==="play"){if(!x(['button[data-testid="control-button-playpause"]','button[aria-label*="Play" i]','button[aria-label*="reproducir" i]'])||Y&&Y.paused)Y?.play().catch(()=>{})}else if(Q==="pause"){if(x(['button[data-testid="control-button-playpause"]','button[aria-label*="Pause" i]']),Y&&!Y.paused)Y.pause()}else if(Q==="toggle"){if(!x(['button[data-testid="control-button-playpause"]'])&&Y)if(Y.paused)Y.play().catch(()=>{});else Y.pause()}else if(Q==="next")x(['button[data-testid="control-button-skip-forward"]','button[aria-label*="Next" i]','button[aria-label*="Siguiente" i]','[data-testid="skip-ad-button"]']);else if(Q==="prev")x(['button[data-testid="control-button-skip-back"]','button[aria-label*="Previous" i]','button[aria-label*="Anterior" i]'])}}function d(){try{if(!navigator.mediaDevices?.addEventListener)return;navigator.mediaDevices.addEventListener("devicechange",()=>{setTimeout(()=>{let Q=document.querySelector("audio, video");if(Q&&!Q.paused)console.log("SpotiLIE: Audio output device changed/disconnected — pausing playback"),Q.pause(),x(['button[data-testid="control-button-playpause"]'])},250)})}catch(Q){console.warn("SpotiLIE: Could not set up Bluetooth pause guard",Q)}}function o(){try{let Q=globalThis.browser||globalThis.chrome;if(!Q?.runtime?.onMessage)return;Q.runtime.onMessage.addListener((Y)=>{if(Y?.type==="MEDIA_ACTION"&&typeof Y.action==="string")return console.log("SpotiLIE: MEDIA_ACTION received from native bridge:",Y.action),window.spotilieMediaAction?.(Y.action),!0}),console.log("SpotiLIE: Native message listener active")}catch(Q){console.warn("SpotiLIE: Could not set up native message listener",Q)}}function n(){}function I(){let Q={title:"",artist:"",isPlaying:!1},Y=null,$=!1,Z=!1,J=()=>{let X=document.title||"",D=X.indexOf(" - ");if(D<1)return null;let M=X.substring(0,D).trim(),N=X.substring(D+3).trim(),j=N.lastIndexOf(" · ");if(j>0)N=N.substring(0,j).trim();if(!M||M.toLowerCase()==="spotify")return null;return{title:M,artist:N,isPlaying:G()}},V=()=>{try{let X=document.querySelector('[data-testid="context-item-info-title"]')||document.querySelector('[data-testid="now-playing-widget"] [data-testid="context-item-link"]'),D=document.querySelector('[data-testid="context-item-info-subtitles"]')||document.querySelector('[data-testid="now-playing-widget"] [data-testid="context-item-info-subtitles"]');if(!X||!D)return null;let M=(X.textContent||"").trim(),N=(D.textContent||"").trim();if(!M||M.toLowerCase()==="advertisement")return null;return{title:M,artist:N,isPlaying:G()}}catch(X){return null}},G=()=>{let X=document.querySelector('button[data-testid="control-button-playpause"]');if(X)return(X.getAttribute("aria-label")||"").toLowerCase()==="pause";return!!document.querySelector('button[aria-label="Pause"]')},K=(X)=>{if(!X.title)return;if(X.title===Q.title&&X.artist===Q.artist&&X.isPlaying===Q.isPlaying)return;Q={...X};try{let D=globalThis.browser||globalThis.chrome;if(D?.runtime?.sendMessage){D.runtime.sendMessage({type:"UPDATE_METADATA",title:X.title,artist:X.artist,isPlaying:X.isPlaying}).catch(()=>{}),console.log(`SpotiLIE: Metadata sent → "${X.title}" by "${X.artist}" playing=${X.isPlaying}`);return}}catch(D){}try{let D=window.__TAURI__?.core?.invoke||window.__TAURI_INTERNALS__?.invoke;if(D)D("update_media_info",{title:X.title,artist:X.artist,isPlaying:X.isPlaying})}catch(D){}},F=()=>{if(Y)clearTimeout(Y);Y=setTimeout(()=>{let X=J()||V();if(X)K(X)},250)},z=()=>{if($)return;let X=document.querySelector("title");if(!X)return;$=!0,new MutationObserver(F).observe(X,{subtree:!0,characterData:!0,childList:!0})},_=()=>{if(Z)return;let X=document.querySelector('[data-testid="now-playing-bar"]')||document.querySelector(".Root__now-playing-bar");if(!X)return;Z=!0,new MutationObserver(F).observe(X,{subtree:!0,characterData:!0,childList:!0,attributes:!0,attributeFilter:["aria-label"]})};setInterval(F,2000),document.addEventListener("play",(X)=>{if(X.target?.tagName==="AUDIO")F()},!0),document.addEventListener("pause",(X)=>{if(X.target?.tagName==="AUDIO")F()},!0);let H=()=>{z(),_()};if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",H);else H();if(document.body){let X=new MutationObserver(()=>{if(!Z)_();if(!$)z();if(Z&&$)X.disconnect()});X.observe(document.body,{childList:!0,subtree:!1})}}function C(){try{i(),r(),a(),console.log("SpotiLIE: Premium features module active")}catch(Q){console.error("SpotiLIE: Premium features init failed",Q)}}function i(){let Q=Response.prototype.json;Response.prototype.json=async function(){let Y=await Q.call(this);if(!Y||typeof Y!=="object")return Y;if(Y.skips_remaining!==void 0)Y.skips_remaining=999;if(Y.advancement)Y.advancement.advancement_mode="NORMAL",Y.advancement.advancement_disabled=!1;if(Y.enableLyrics!==void 0)Y.enableLyrics=!0;if(Y.canShowLyrics!==void 0)Y.canShowLyrics=!0;if(Y.lyricsEnabled!==void 0)Y.lyricsEnabled=!0;if(Y.features){if(Y.features.enableLyrics!==void 0)Y.features.enableLyrics=!0;if(Y.features.lyrics!==void 0)Y.features.lyrics=!0}return Y}}function r(){try{let Q=localStorage.getItem("playback.settings");if(Q)try{let Y=JSON.parse(Q),$=!1;if(!Y.autoplay)Y.autoplay=!0,$=!0;if(Y.crossfade===void 0)Y.crossfade=0,$=!0;if($)localStorage.setItem("playback.settings",JSON.stringify(Y))}catch(Y){}}catch(Q){}}function a(){setInterval(()=>{let Y=document.querySelector('[data-testid="connect-device-picker-button"]');if(Y)Y.style.removeProperty("display"),Y.style.removeProperty("visibility"),Y.style.removeProperty("opacity")},5000)}(function(){if(window._spotilie_initialized)return;window._spotilie_initialized=!0,console.log("SpotiLIE: Injector Active v2.0 (Nuclear Edition)"),B(),q(),L(),C(),R(),E(),I()})();
