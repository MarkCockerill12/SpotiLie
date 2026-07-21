function R(){try{let Q={__cmpCall:function(){},__tcfapiCall:function(){},postMessage:function(Z){try{if(Z&&typeof Z==="object"&&Z.__cmpCall){let z=Z.__cmpCall;window.postMessage({__cmpReturn:{returnValue:{eventStatus:"tcloaded",gdprApplies:!1},success:!0,callId:z?z.callId:null}},"*")}}catch(z){}}};Q.contentWindow=Q,Q.frames=Q,Q.__cmpLocator=Q,Q.__tcfapiLocator=Q;try{let Z=Object.getOwnPropertyDescriptor(MessageEvent.prototype,"source");if(Z&&Z.get){let z=Z.get;Object.defineProperty(MessageEvent.prototype,"source",{get:function(){return z.call(this)||Q},configurable:!0})}}catch(Z){}try{if(!("__cmpCall"in Object.prototype))Object.defineProperty(Object.prototype,"__cmpCall",{get:function(){return Q.__cmpCall},configurable:!0});if(!("__tcfapiCall"in Object.prototype))Object.defineProperty(Object.prototype,"__tcfapiCall",{get:function(){return Q.__tcfapiCall},configurable:!0})}catch(Z){}let Y=[window,window.top,window.parent,globalThis];for(let Z of Y){if(!Z)continue;try{Z.__cmpLocator=Q,Z.__tcfapiLocator=Q,Z.__cmpCall=Q.__cmpCall}catch(z){}}try{let Z=window.addEventListener;window.addEventListener=function(z,V,K){if(z==="message"&&typeof V==="function"){let X=function(F){try{if(F&&!F.source)try{Object.defineProperty(F,"source",{get:()=>Q,configurable:!0})}catch(G){}return V.apply(this,arguments)}catch(G){if(G&&G.message&&(G.message.includes("__cmpCall")||G.message.includes("__cmp"))){console.warn("SpotiLIE: Suppressed CMP error in message listener:",G.message);return}throw G}};return Z.call(this,z,X,K)}return Z.call(this,z,V,K)}}catch(Z){}if(window.addEventListener("unhandledrejection",(Z)=>{let z=Z.reason?.message||String(Z.reason||"");if(z.includes("__cmpCall")||z.includes("__cmp"))Z.preventDefault()},!0),!window.__cmp){let Z=function(){let z=Array.from(arguments);if(typeof z[2]==="function")try{z[2]({eventStatus:"tcloaded",gdprApplies:!1},!0)}catch(V){}};Z.a=[],window.__cmp=Z}if(!window.__tcfapi){let Z=function(z,V,K){if(typeof K==="function")try{K({eventStatus:"tcloaded",gdprApplies:!1,tcString:"CP1234567890",listenerId:1},!0)}catch(X){}};Z.a=[],window.__tcfapi=Z}let $=(Z)=>{try{let z=document.querySelector(`iframe[name="${Z}"]`);if(!z){z=document.createElement("iframe"),z.name=Z,z.id=Z,z.style.display="none";let V=document.body||document.documentElement||document.head;if(V)V.appendChild(z)}if(z&&z.contentWindow)try{z.contentWindow.__cmpCall=Q.__cmpCall,z.contentWindow.__tcfapiCall=Q.__tcfapiCall}catch(V){}}catch(z){}};if($("__cmpLocator"),$("__tcfapiLocator"),document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>{$("__cmpLocator"),$("__tcfapiLocator")});window.addEventListener("message",(Z)=>{try{if(Z.data&&typeof Z.data==="object"&&Z.data.__cmpCall){let z=Z.data.__cmpCall;if(Z.source&&typeof Z.source.postMessage==="function")Z.source.postMessage({__cmpReturn:{returnValue:{eventStatus:"tcloaded",gdprApplies:!1},success:!0,callId:z?z.callId:null}},"*")}}catch(z){}},!0),window.addEventListener("error",(Z)=>{if(Z.message&&(Z.message.includes("__cmpCall")||Z.message.includes("__cmp")))console.warn("SpotiLIE: Suppressed CMP TypeError:",Z.message),Z.stopImmediatePropagation(),Z.preventDefault()},!0),console.log("SpotiLIE: CMP stub & locator iframes initialized")}catch(Q){console.error("SpotiLIE: Failed to initialize CMP stub",Q)}}var w=["/ad-logic/","spclient.wg.spotify.com/ads","spclient.wg.spotify.com/ad-logic","api.spotify.com/v1/ads","audio-ads.spotify.com","adeventtracker.spotify.com","ads-fa.spotify.com","adgen.spotify.com","ad-proxy.spotify.com","adstudio.spotify.com","ads.spotify.com","pixel.spotify.com","video-ak.cdn.spotify.com","adjust-callback.spotify.com","crashdump.spotify.com","datasharing.spotify.com","doubleclick.net","googleadservices.com","googletagservices.com","googlesyndication.com","google-analytics.com","pagead2.googlesyndication.com","securepubads.g.doubleclick.net","moatads.com","comscore.com","scorecardresearch.com","branch.io","branchster.link","app.link","facebook.com/tr","facebook.net/en_US/fbevents.js","connect.facebook.net","admob.com","adsrvr.org","adnxs.com","casalemedia.com","criteo.com","rubiconproject.com","openx.net","pubmatic.com","freewheel.tv","spotxchange.com","liveramp.com","rlcdn.com"],T=new RegExp(w.map((Q)=>Q.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|"),"i");function B(Q){return T.test(Q)}function S(Q){let Y=new Headers({"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"*","Access-Control-Allow-Methods":"*"});if(Q.includes(".js"))return Y.set("Content-Type","application/javascript"),new Response("",{status:200,headers:Y});return Y.set("Content-Type","application/json"),new Response("{}",{status:200,headers:Y})}function h(Q){if(!Q||typeof Q!=="object")return Q;if(Q.__spotilie_spoofed)return Q;try{Q.__spotilie_spoofed=!0}catch(Z){}if(Q.canPlayOnDemand!==void 0)Q.canPlayOnDemand=!0;if(Q.is_premium!==void 0)Q.is_premium=!0;if(Q.premium!==void 0&&typeof Q.premium==="boolean")Q.premium=!0;if(Q.product!==void 0&&typeof Q.product==="string"){if(Q.product==="free"||Q.product==="open")Q.product="premium"}if(Q.streaming_rules)Q.streaming_rules.advancement_disabled=!1,Q.streaming_rules.advancement_mode="NORMAL",Q.streaming_rules.skips_unlimited=!0,Q.streaming_rules.max_skips_per_hour=999;if(Q.ads!==void 0&&typeof Q.ads==="object"&&!Array.isArray(Q.ads))Q.ads={speedy:null,audio:null,video:null,leaderboard:null,billboard:null};if(Array.isArray(Q.adSlots))Q.adSlots=[];if(Array.isArray(Q.adBreaks))Q.adBreaks=[];if(Array.isArray(Q.adInfos))Q.adInfos=[];if(Q.ad!==void 0&&typeof Q.ad==="object")Q.ad=null;if(Q.advertisement!==void 0)delete Q.advertisement;let Y=(Z)=>{if(!Z||typeof Z!=="object")return;if(Z.advertisement!==void 0)delete Z.advertisement;if(Z.isAd!==void 0)Z.isAd=!1;if(Z.adBreak!==void 0)Z.adBreak=null};if(Y(Q.track),Y(Q.episode),Y(Q.item),Q.skips_remaining!==void 0)Q.skips_remaining=999;if(Q.advancement)Q.advancement.advancement_mode="NORMAL",Q.advancement.advancement_disabled=!1,Q.advancement.skips_remaining=999;let $=(Z)=>{Z.forEach((z)=>{if(!z||typeof z!=="object")return;if(Y(z),Y(z.track),Y(z.episode),z.track?.track)Y(z.track.track)})};if(Array.isArray(Q.items))$(Q.items);if(Array.isArray(Q.tracks?.items))$(Q.tracks.items);if(Array.isArray(Q.episodes?.items))$(Q.episodes.items);if(Array.isArray(Q.edges))Q.edges.forEach((Z)=>{if(Z?.node)Y(Z.node)});return Q}function L(){try{try{let X=Headers.prototype.set;Headers.prototype.set=function(G,_){if(G&&G.toLowerCase()==="x-cache-hint")return;return X.call(this,G,_)};let F=Headers.prototype.append;Headers.prototype.append=function(G,_){if(G&&G.toLowerCase()==="x-cache-hint")return;return F.call(this,G,_)}}catch(X){}let Q=JSON.parse;JSON.parse=function(X,F){try{let G=F?Q(X,F):Q(X);return h(G)}catch(G){try{return Q(X)}catch(_){return null}}};let Y=window.fetch;window.fetch=async function(X,F){let G=X,_=F,N=typeof G==="string"?G:G instanceof URL?G.toString():G.url;if(B(N))return S(N);try{if(G instanceof Request){if(G.headers.has("x-cache-hint")||G.headers.has("X-Cache-Hint")){let J=new Headers(G.headers);J.delete("x-cache-hint"),J.delete("X-Cache-Hint"),G=new Request(G,{headers:J})}}if(_&&_.headers){if(_.headers instanceof Headers)_.headers.delete("x-cache-hint"),_.headers.delete("X-Cache-Hint");else if(Array.isArray(_.headers))_.headers=_.headers.filter(([J])=>J.toLowerCase()!=="x-cache-hint");else if(typeof _.headers==="object")delete _.headers["x-cache-hint"],delete _.headers["X-Cache-Hint"]}}catch(J){}return Y.call(this,G,_)};let $=XMLHttpRequest.prototype.open,Z=XMLHttpRequest.prototype.send,z=XMLHttpRequest.prototype.setRequestHeader;XMLHttpRequest.prototype.setRequestHeader=function(X,F){if(X&&X.toLowerCase()==="x-cache-hint")return;return z.apply(this,arguments)},XMLHttpRequest.prototype.open=function(X,F){let G=F.toString();if(B(G))this.__blocked=!0;return $.apply(this,arguments)};let V=navigator.sendBeacon;if(V)navigator.sendBeacon=function(X,F){if(B(X.toString()))return!0;return V.apply(this,arguments)};let K=window.Worker;if(K)window.Worker=function(X,F){let G=X.toString();if(G.startsWith("data:")||G.startsWith("blob:"))return new K(X,F);try{let _=`
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
          `,N=new Blob([_],{type:"application/javascript"}),J=URL.createObjectURL(N);return new K(J,F)}catch(_){return new K(X,F)}},window.Worker.prototype=K.prototype;XMLHttpRequest.prototype.send=function(){if(this.__blocked){setTimeout(()=>{try{Object.defineProperty(this,"readyState",{get:()=>4,configurable:!0})}catch(X){}try{Object.defineProperty(this,"status",{get:()=>200,configurable:!0})}catch(X){}try{Object.defineProperty(this,"statusText",{get:()=>"OK",configurable:!0})}catch(X){}try{Object.defineProperty(this,"responseText",{get:()=>"{}",configurable:!0})}catch(X){}try{Object.defineProperty(this,"response",{get:()=>"{}",configurable:!0})}catch(X){}try{this.dispatchEvent(new Event("readystatechange"))}catch(X){}try{this.dispatchEvent(new Event("load"))}catch(X){}try{this.dispatchEvent(new Event("loadend"))}catch(X){}try{if(typeof this.onreadystatechange==="function")this.onreadystatechange()}catch(X){}try{if(typeof this.onload==="function")this.onload()}catch(X){}},10);return}return Z.apply(this,arguments)},f(),A(),console.log("SpotiLIE: Nuclear adblock v4 initialized (DOM + Network + JSON + Audio)")}catch(Q){console.error("SpotiLIE: Failed to initialize adblock",Q)}}function f(){let Q=['[data-testid="ad-indicator"]','[data-testid="ad-sponsor-container"]','[data-testid="advertisement"]',".Root__ads-container",".nav-bar-ad-item",".desktop-media-picker-ads",'[class*="ad-slot"]','[class*="adSlot"]','[class*="AdSlot"]','iframe[src*="doubleclick"]','iframe[src*="googlesyndication"]','div[id*="google_ads"]','div[class*="video-ad"]','div[class*="videoAd"]'],Y=()=>{for(let Z of Q)try{document.querySelectorAll(Z).forEach((z)=>z.remove())}catch(z){}};Y(),setInterval(Y,500);let $=()=>{new MutationObserver(Y).observe(document.body,{childList:!0,subtree:!0})};if(document.body)$();else document.addEventListener("DOMContentLoaded",$,{once:!0})}function A(){let Q=!1,Y=0,$=null,Z=[/^advertisement/i,/^ad\s*[-–—]/i,/sponsored/i],z=()=>{let D=(document.title||"").trim();if(Z.some((U)=>U.test(D)))return!0;if(document.querySelector('[data-testid="ad-indicator"]'))return!0;if(document.querySelector('[data-testid="ad-sponsor-container"]'))return!0;let M=document.querySelector('[data-testid="context-item-info-title"], [data-testid="now-playing-widget"] [data-testid="context-item-link"]');if(M){let U=(M.textContent||"").toLowerCase().trim();if(U==="advertisement"||U.startsWith("advertisement"))return!0}let j=document.querySelector('.Root__ads-container, [class*="ad-overlay"], [class*="video-ad"]');if(j&&j.offsetParent!==null)return!0;let O=document.querySelector('[data-testid="context-item-link"]');if(O){let U=O.getAttribute("href")||"";if(U.startsWith("/ad/")||U.includes("advertisement"))return!0}return!1},V=()=>{document.querySelectorAll("audio, video").forEach((D)=>{D.muted=!0;try{D.volume=0}catch(M){}})},K=()=>{document.querySelectorAll("audio, video").forEach((D)=>{D.muted=!1;try{D.volume=1}catch(M){}})},X=()=>{let D=['button[data-testid="control-button-skip-forward"]','button[aria-label="Next"]','button[aria-label="Skip"]','button[aria-label="Skip ad"]','[data-testid="skip-ad-button"]'];for(let M of D){let j=document.querySelector(M);if(j&&!j.hasAttribute("disabled"))return j.click(),console.log("SpotiLIE: Auto-skipped audio ad via",M),!0}return!1},F=()=>{if($)return;Y=0,$=setInterval(()=>{if(!Q){clearInterval($),$=null;return}if(V(),X(),Y++,Y>60)clearInterval($),$=null},100)},G=()=>{if(Q)return;if(Q=!0,console.log("SpotiLIE: Audio ad detected — muting and attacking skip button"),V(),!X())[50,150,300,500,800,1200,2000,3000].forEach((D)=>setTimeout(X,D));F()},_=()=>{if(!Q)return;if(Q=!1,$)clearInterval($),$=null;console.log("SpotiLIE: Audio ad ended — restoring audio"),K()},N=()=>{if(z())G();else _()},J=document.querySelector("title");if(J)new MutationObserver(N).observe(J,{subtree:!0,characterData:!0,childList:!0});let H=()=>{let D=document.querySelector('[data-testid="now-playing-bar"]')||document.querySelector(".Root__now-playing-bar");if(D)new MutationObserver(N).observe(D,{subtree:!0,childList:!0,attributes:!0})};if(document.body)H(),new MutationObserver(()=>H()).observe(document.body,{childList:!0});document.addEventListener("play",(D)=>{if(D.target?.tagName==="AUDIO")setTimeout(N,50),setTimeout(N,250)},!0),setInterval(N,500)}function q(){try{try{Object.defineProperty(navigator,"platform",{get:()=>"Win32",configurable:!0})}catch(Y){}try{Object.defineProperty(navigator,"vendor",{get:()=>"Google Inc.",configurable:!0})}catch(Y){}try{let $=[{name:"Chrome PDF Plugin",filename:"internal-pdf-viewer",description:"Portable Document Format",length:1,item:()=>null,namedItem:()=>null}];$.item=(Z)=>$[Z]||null,$.namedItem=(Z)=>$.find((z)=>z.name===Z)||null,Object.defineProperty(navigator,"plugins",{get:()=>$,configurable:!0})}catch(Y){}"userAgentData"in navigator;try{let Y={brands:[{brand:"Not-A.Brand",version:"99"},{brand:"Chromium",version:"124"},{brand:"Google Chrome",version:"124"}],mobile:!1,platform:"Windows",getHighEntropyValues:async($)=>({brands:[{brand:"Not-A.Brand",version:"99"},{brand:"Chromium",version:"124"},{brand:"Google Chrome",version:"124"}],mobile:!1,platform:"Windows",platformVersion:"10.0.0",architecture:"x86",bitness:"64",model:"",uaFullVersion:"124.0.6367.201",fullVersionList:[{brand:"Not-A.Brand",version:"99.0.0.0"},{brand:"Chromium",version:"124.0.6367.201"},{brand:"Google Chrome",version:"124.0.6367.201"}]}),toJSON:()=>({brands:[{brand:"Not-A.Brand",version:"99"},{brand:"Chromium",version:"124"},{brand:"Google Chrome",version:"124"}],mobile:!1,platform:"Windows"})};Object.defineProperty(navigator,"userAgentData",{get:()=>Y,configurable:!0})}catch(Y){console.warn("SpotiLIE: Failed to spoof userAgentData",Y)}let Q=navigator.requestMediaKeySystemAccess;if(Q&&!Q._spotilie_patched){let Y=function($,Z){return console.log("SpotiLIE: EME requestMediaKeySystemAccess called for:",$),Q.call(this,$,Z).then((z)=>{return console.log("SpotiLIE: EME requestMediaKeySystemAccess SUCCEEDED for:",$),z}).catch((z)=>{console.warn("SpotiLIE: EME requestMediaKeySystemAccess failed with original configs, retrying with sanitized Android Widevine L3 configs...",z);try{let V=JSON.parse(JSON.stringify(Z));return V.forEach((K)=>{if(K.audioCapabilities)K.audioCapabilities.forEach((X)=>delete X.robustness);if(K.videoCapabilities)K.videoCapabilities.forEach((X)=>delete X.robustness)}),Q.call(this,$,V).then((K)=>{return console.log("SpotiLIE: EME requestMediaKeySystemAccess SUCCEEDED with sanitized configs for:",$),K}).catch(()=>{console.warn("SpotiLIE: Retrying EME with basic Widevine L3 config");let K=[{initDataTypes:["cenc"],audioCapabilities:[{contentType:'audio/mp4; codecs="mp4a.40.2"'},{contentType:'audio/webm; codecs="opus"'}]}];return Q.call(this,$,K)})}catch(V){throw z}})};Y._spotilie_patched=!0,navigator.requestMediaKeySystemAccess=Y}b(),console.log("SpotiLIE: Hardware spoofing active (desktop layout + userAgentData + EME handler)")}catch(Q){console.error("SpotiLIE: Failed to spoof hardware",Q)}}function b(){let Q=()=>{try{let Y=window.AudioContext||window.webkitAudioContext;if(Y){let $=new Y;if($.state==="suspended")$.resume()}}catch(Y){}try{let Y=new Audio;Y.src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=",Y.play().then(()=>Y.pause()).catch(()=>{})}catch(Y){}document.removeEventListener("touchstart",Q,!0),document.removeEventListener("click",Q,!0)};document.addEventListener("touchstart",Q,!0),document.addEventListener("click",Q,!0)}function E(){let Q=document.createElement("style");Q.id="spotilie-ui",Q.textContent=y(),(()=>{let $=document.head||document.documentElement;if($){if(!document.getElementById("spotilie-ui"))$.appendChild(Q)}else document.addEventListener("DOMContentLoaded",()=>{let Z=document.head||document.documentElement;if(Z&&!document.getElementById("spotilie-ui"))Z.appendChild(Q)},{once:!0})})(),v(),u(),g(),m(),k()}function y(){return`
    :root {
      --sys-nav-h:  0px;
      --app-nav-h:  52px;
      --player-h:   148px;
      --top-bar-h:  ${"56"}px;
      --bottom-h:   calc(var(--sys-nav-h) + var(--app-nav-h) + var(--player-h));
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
      bottom: var(--sys-nav-h) !important;
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
  `}function v(){let Q=document.querySelector('meta[name="viewport"]');if(!Q)Q=document.createElement("meta"),Q.name="viewport",(document.head||document.documentElement).appendChild(Q);Q.content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"}function u(){let Q=()=>{try{document.documentElement.style.setProperty("--app-nav-h","52px"),document.documentElement.style.setProperty("--player-h","148px"),document.documentElement.style.setProperty("--top-bar-h","56px")}catch(Y){}};Q(),window.visualViewport?.addEventListener("resize",Q),window.addEventListener("resize",Q)}function k(){let Q=globalThis.browser||globalThis.chrome;if(!Q?.runtime?.onMessage)return;Q.runtime.onMessage.addListener((Y)=>{if(Y?.type==="SET_NAV_HEIGHT"&&typeof Y.height==="number"){let $=Math.max(0,Y.height);document.documentElement.style.setProperty("--sys-nav-h",`${$}px`),document.documentElement.style.setProperty("--bottom-h",`${$+52+148}px`);let Z=document.getElementById("spotilie-bottom-nav");if(Z)Z.style.setProperty("bottom",`${$}px`,"important");console.log(`SpotiLIE: Nav height set to ${$}px CSS from Kotlin`)}})}function W(Q){let Y=`a[href="${Q}"]`;if(Q==="/collection")Y='a[href^="/collection"], a[href="/collection/playlists"], a[href="/library"]';let $=document.querySelector(Y);if($){$.click();return}try{history.pushState(null,"",Q),window.dispatchEvent(new PopStateEvent("popstate"))}catch(Z){window.location.href=Q}}function g(){let Q=()=>{if(document.getElementById("spotilie-bottom-nav"))return;let Y=document.createElement("div");Y.id="spotilie-bottom-nav",Y.innerHTML=`
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
    `,Y.querySelectorAll(".nav-item").forEach((V)=>{V.addEventListener("click",()=>{let K=V.getAttribute("data-nav");if(K==="home")W("/");else if(K==="search")W("/search");else if(K==="library")W("/collection")})}),document.body.appendChild(Y);let $=()=>{let V=window.location.pathname;Y.querySelectorAll(".nav-item").forEach((K)=>{K.classList.remove("active");let X=K.getAttribute("data-nav");if(X==="home"&&(V==="/"||V===""))K.classList.add("active");else if(X==="search"&&V.startsWith("/search"))K.classList.add("active");else if(X==="library"&&V.startsWith("/collection"))K.classList.add("active")})},Z=history.pushState;history.pushState=function(){Z.apply(this,arguments),$()};let z=history.replaceState;history.replaceState=function(){z.apply(this,arguments),$()},window.addEventListener("popstate",$),$()};if(document.body)Q();else{let Y=setInterval(()=>{if(document.body)clearInterval(Y),Q()},50)}}function m(){let Q=[".playback-bar",'[data-testid="playback-progressbar"]','[data-testid="progress-bar"]','[class*="progressBar"]','[class*="PlaybackBar"]','[class*="playback-bar"]','div[role="slider"]'],Y=()=>{for(let $ of Q)document.querySelectorAll($).forEach((Z)=>{let z=Z;z.style.setProperty("display","flex","important"),z.style.setProperty("visibility","visible","important"),z.style.setProperty("opacity","1","important"),z.style.setProperty("overflow","visible","important"),z.style.setProperty("min-width","120px","important"),z.style.setProperty("width","100%","important");let V=z.parentElement,K=0;while(V&&K<8){let X=getComputedStyle(V);if(X.overflow==="hidden"||X.overflowY==="hidden")V.style.setProperty("overflow","visible","important");if(X.display==="none")V.style.setProperty("display","flex","important");V=V.parentElement,K++}})};setTimeout(Y,500),setTimeout(Y,1500),setTimeout(Y,3000),setInterval(Y,5000)}function I(){l(),p(),o(),s(),d(),c(),n()}function p(){try{let Q=HTMLMediaElement.prototype.play;if(Q&&!Q._spotilie_patched){let Y=function(){return console.log("SpotiLIE: HTMLMediaElement.play() invoked on",this.src||this.currentSrc||"MSE stream"),Q.apply(this,arguments).then(($)=>{return console.log("SpotiLIE: HTMLMediaElement.play() SUCCEEDED"),$}).catch(($)=>{throw console.error("SpotiLIE: HTMLMediaElement.play() REJECTED:",$?.name,$?.message,$),$})};Y._spotilie_patched=!0,HTMLMediaElement.prototype.play=Y}document.addEventListener("error",(Y)=>{let $=Y.target;if($&&($.tagName==="AUDIO"||$.tagName==="VIDEO")){let Z=$.error;console.error("SpotiLIE: Media Element Error Event:",Z?.code,Z?.message,$.src)}},!0)}catch(Q){}}function l(){document.addEventListener("click",(Q)=>{let Y=Q.target;if(Y){let $=`${Y.tagName}.${(Y.className||"").toString().slice(0,40)} [id=${Y.id||""}] [data-testid=${Y.getAttribute("data-testid")||""}]`;console.log("SpotiLIE Click Target:",$)}},!0)}function c(){document.addEventListener("click",(Q)=>{if(!Q.isTrusted)return;let Y=Q.target;if(!Y)return;if(Y.closest('button, a[href*="/artist/"], a[href*="/album/"], [role="button"], [data-testid="more-button"], [data-testid="add-button"]'))return;let $=Y.closest('[data-testid="tracklist-row"], [role="row"]');if(!$)return;let Z=$.querySelector('button[aria-label*="Play" i], button[aria-label*="play" i], [data-testid="play-button"], [data-testid="row-play-button"], [data-encore-id="buttonPrimary"], [class*="playButton" i]');if(!Z)Z=Array.from($.querySelectorAll("button")).find((K)=>{let X=(K.getAttribute("aria-label")||K.getAttribute("data-testid")||K.className||"").toLowerCase();return X.includes("play")||X.includes("reproducir")})||null;if(Z){console.log("SpotiLIE: Track play button clicked via row tap"),Z.click();return}let z=$.querySelector('a[data-testid="internal-track-link"], a[href*="/track/"]');if(z)console.log("SpotiLIE: Clicking internal track link via row tap"),z.click()},!1)}function x(Q){for(let Y of Q){let $=document.querySelector(Y);if($)try{return $.click(),console.log(`SpotiLIE: Clicked media button via selector: ${Y}`),!0}catch(Z){console.warn(`SpotiLIE: Failed clicking ${Y}:`,Z)}}return!1}function o(){window.spotilieMediaAction=(Q)=>{console.log(`SpotiLIE: spotilieMediaAction executed for action '${Q}'`);let Y=document.querySelector("audio, video");if(Q==="play"){if(!x(['button[data-testid="control-button-playpause"]','button[aria-label*="Play" i]','button[aria-label*="reproducir" i]'])||Y&&Y.paused)Y?.play().catch(()=>{})}else if(Q==="pause"){let $=x(['button[data-testid="control-button-playpause"]','button[aria-label*="Pause" i]']);if(Y&&!Y.paused)Y.pause()}else if(Q==="toggle"){if(!x(['button[data-testid="control-button-playpause"]'])&&Y)if(Y.paused)Y.play().catch(()=>{});else Y.pause()}else if(Q==="next")x(['button[data-testid="control-button-skip-forward"]','button[aria-label*="Next" i]','button[aria-label*="Siguiente" i]','[data-testid="skip-ad-button"]']);else if(Q==="prev")x(['button[data-testid="control-button-skip-back"]','button[aria-label*="Previous" i]','button[aria-label*="Anterior" i]'])}}function s(){try{let Q=globalThis.browser||globalThis.chrome;if(!Q?.runtime?.onMessage)return;Q.runtime.onMessage.addListener((Y)=>{if(Y?.type==="MEDIA_ACTION"&&typeof Y.action==="string")return console.log("SpotiLIE: MEDIA_ACTION received from native bridge:",Y.action),window.spotilieMediaAction?.(Y.action),!0}),console.log("SpotiLIE: Native message listener active")}catch(Q){console.warn("SpotiLIE: Could not set up native message listener",Q)}}function d(){try{if(!navigator.mediaDevices?.addEventListener)return;navigator.mediaDevices.addEventListener("devicechange",()=>{setTimeout(()=>{let Q=document.querySelector('button[data-testid="control-button-playpause"][aria-label="Pause"]');if(Q)console.log("SpotiLIE: Audio device disconnected — pausing playback"),Q.click()},400)})}catch(Q){console.warn("SpotiLIE: Could not set up Bluetooth pause guard",Q)}}function n(){}function C(){let Q={title:"",artist:"",isPlaying:!1},Y=null,$=!1,Z=!1,z=()=>{let J=document.title||"",H=J.indexOf(" - ");if(H<1)return null;let D=J.substring(0,H).trim(),M=J.substring(H+3).trim(),j=M.lastIndexOf(" · ");if(j>0)M=M.substring(0,j).trim();if(!D||D.toLowerCase()==="spotify")return null;return{title:D,artist:M,isPlaying:K()}},V=()=>{try{let J=document.querySelector('[data-testid="context-item-info-title"]')||document.querySelector('[data-testid="now-playing-widget"] [data-testid="context-item-link"]'),H=document.querySelector('[data-testid="context-item-info-subtitles"]')||document.querySelector('[data-testid="now-playing-widget"] [data-testid="context-item-info-subtitles"]');if(!J||!H)return null;let D=(J.textContent||"").trim(),M=(H.textContent||"").trim();if(!D||D.toLowerCase()==="advertisement")return null;return{title:D,artist:M,isPlaying:K()}}catch(J){return null}},K=()=>{let J=document.querySelector('button[data-testid="control-button-playpause"]');if(J)return(J.getAttribute("aria-label")||"").toLowerCase()==="pause";return!!document.querySelector('button[aria-label="Pause"]')},X=(J)=>{if(!J.title)return;if(J.title===Q.title&&J.artist===Q.artist&&J.isPlaying===Q.isPlaying)return;Q={...J};try{let H=globalThis.browser||globalThis.chrome;if(H?.runtime?.sendMessage){H.runtime.sendMessage({type:"UPDATE_METADATA",title:J.title,artist:J.artist,isPlaying:J.isPlaying}).catch(()=>{}),console.log(`SpotiLIE: Metadata sent → "${J.title}" by "${J.artist}" playing=${J.isPlaying}`);return}}catch(H){}try{let H=window.__TAURI__?.core?.invoke||window.__TAURI_INTERNALS__?.invoke;if(H)H("update_media_info",{title:J.title,artist:J.artist,isPlaying:J.isPlaying})}catch(H){}},F=()=>{if(Y)clearTimeout(Y);Y=setTimeout(()=>{let J=z()||V();if(J)X(J)},250)},G=()=>{if($)return;let J=document.querySelector("title");if(!J)return;$=!0,new MutationObserver(F).observe(J,{subtree:!0,characterData:!0,childList:!0})},_=()=>{if(Z)return;let J=document.querySelector('[data-testid="now-playing-bar"]')||document.querySelector(".Root__now-playing-bar");if(!J)return;Z=!0,new MutationObserver(F).observe(J,{subtree:!0,characterData:!0,childList:!0,attributes:!0,attributeFilter:["aria-label"]})};setInterval(F,2000),document.addEventListener("play",(J)=>{if(J.target?.tagName==="AUDIO")F()},!0),document.addEventListener("pause",(J)=>{if(J.target?.tagName==="AUDIO")F()},!0);let N=()=>{G(),_()};if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",N);else N();if(document.body){let J=new MutationObserver(()=>{if(!Z)_();if(!$)G();if(Z&&$)J.disconnect()});J.observe(document.body,{childList:!0,subtree:!1})}}function P(){try{i(),r(),a(),console.log("SpotiLIE: Premium features module active")}catch(Q){console.error("SpotiLIE: Premium features init failed",Q)}}function i(){let Q=Response.prototype.json;Response.prototype.json=async function(){let Y=await Q.call(this);if(!Y||typeof Y!=="object")return Y;if(Y.skips_remaining!==void 0)Y.skips_remaining=999;if(Y.advancement)Y.advancement.advancement_mode="NORMAL",Y.advancement.advancement_disabled=!1;if(Y.enableLyrics!==void 0)Y.enableLyrics=!0;if(Y.canShowLyrics!==void 0)Y.canShowLyrics=!0;if(Y.lyricsEnabled!==void 0)Y.lyricsEnabled=!0;if(Y.features){if(Y.features.enableLyrics!==void 0)Y.features.enableLyrics=!0;if(Y.features.lyrics!==void 0)Y.features.lyrics=!0}return Y}}function r(){try{let Q=localStorage.getItem("playback.settings");if(Q)try{let Y=JSON.parse(Q),$=!1;if(!Y.autoplay)Y.autoplay=!0,$=!0;if(Y.crossfade===void 0)Y.crossfade=0,$=!0;if($)localStorage.setItem("playback.settings",JSON.stringify(Y))}catch(Y){}}catch(Q){}}function a(){setInterval(()=>{let Y=document.querySelector('[data-testid="connect-device-picker-button"]');if(Y)Y.style.removeProperty("display"),Y.style.removeProperty("visibility"),Y.style.removeProperty("opacity")},5000)}(function(){if(window._spotilie_initialized)return;window._spotilie_initialized=!0,console.log("SpotiLIE: Injector Active v2.0 (Nuclear Edition)"),L(),R(),q(),P(),E(),I(),C()})();
