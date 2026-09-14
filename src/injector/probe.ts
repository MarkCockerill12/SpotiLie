/**
 * TEMPORARY diagnostic — dumps the live now-playing bar structure to logcat.
 *
 * Spotify's player markup is obfuscated and changes without notice, so writing
 * layout CSS against remembered selectors is guesswork. This prints what is
 * actually on screen so the CSS can target reality.
 *
 * Compiled out entirely unless built with `-Debug`.
 */

import { DEBUG, ext } from './shared';

const MAX_NODES = 120;
const CHUNK = 1200;

function describe(el: Element, depth: number): string {
  const box = el as HTMLElement;
  const style = getComputedStyle(box);
  const testid = el.getAttribute('data-testid');
  const cls = (typeof el.className === 'string' ? el.className : '').slice(0, 48);

  return [
    '  '.repeat(depth) + el.tagName.toLowerCase(),
    testid ? `#${testid}` : '',
    cls ? `.${cls}` : '',
    ` [${style.display}/${style.flexDirection}`,
    ` ${box.offsetWidth}x${box.offsetHeight}`,
    style.overflow !== 'visible' ? ` ovf:${style.overflow}` : '',
    style.opacity !== '1' ? ` op:${style.opacity}` : '',
    style.visibility !== 'visible' ? ` vis:${style.visibility}` : '',
    ']',
  ].join('');
}

function walk(root: Element): string {
  const lines: string[] = [];
  const visit = (el: Element, depth: number) => {
    if (lines.length >= MAX_NODES || depth > 7) return;
    lines.push(describe(el, depth));
    for (const child of el.children) visit(child, depth + 1);
  };
  visit(root, 0);
  return lines.join('\n');
}

export function initDomProbe() {
  if (!DEBUG) return;

  setTimeout(() => {
    const bar =
      document.querySelector('[data-testid="now-playing-bar"]') ||
      document.querySelector('.Root__now-playing-bar') ||
      document.querySelector('footer');

    // Walk up too: if the bar itself has collapsed, the cause is an ancestor
    // that established a containing block or zeroed its width.
    let ancestors = `viewport=${window.innerWidth}x${window.innerHeight}\n`;
    for (let el = bar?.parentElement, d = 0; el && d < 10; el = el.parentElement, d++) {
      const s = getComputedStyle(el);
      ancestors +=
        `^${d} ${el.tagName.toLowerCase()}` +
        `${el.getAttribute('data-testid') ? '#' + el.getAttribute('data-testid') : ''}` +
        `.${(el.className || '').toString().slice(0, 30)}` +
        ` [${s.display} ${s.position} ${(el as HTMLElement).offsetWidth}x${(el as HTMLElement).offsetHeight}` +
        ` w:${s.width} tf:${s.transform !== 'none' ? 'Y' : 'n'}` +
        ` bf:${s.backdropFilter !== 'none' ? 'Y' : 'n'}` +
        ` flt:${s.filter !== 'none' ? 'Y' : 'n'}` +
        ` ctn:${s.contain}]\n`;
    }

    const report = bar
      ? `${ancestors}NOW-PLAYING-BAR\n${walk(bar)}`
      : 'NOW-PLAYING-BAR NOT FOUND; footer candidates: ' +
        Array.from(document.querySelectorAll('footer, [class*="now-playing" i], [class*="player" i]'))
          .slice(0, 8)
          .map((e) => `${e.tagName}.${(e.className || '').toString().slice(0, 40)}`)
          .join(' | ');

    const api = ext();
    if (!api?.runtime?.sendMessage) return;
    for (let i = 0; i < report.length; i += CHUNK) {
      api.runtime.sendMessage({
        type: 'DEBUG_DUMP',
        part: Math.floor(i / CHUNK),
        text: report.slice(i, i + CHUNK),
      })?.catch?.(() => {});
    }
  }, 9000);
}
