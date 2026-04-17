// Footer year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Subtle parallax tilt on the hero app window
const appWindow = document.querySelector('.app-window');
const heroVisual = document.querySelector('.hero-visual');

if (appWindow && heroVisual && window.matchMedia('(pointer: fine)').matches) {
  let rafId = null;
  let targetX = -8;
  let targetY = 4;
  let currentX = -8;
  let currentY = 4;

  heroVisual.addEventListener('mousemove', (e) => {
    const rect = heroVisual.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    targetX = -8 + x * 6;
    targetY = 4 - y * 4;
    if (!rafId) rafId = requestAnimationFrame(update);
  });

  heroVisual.addEventListener('mouseleave', () => {
    targetX = -8;
    targetY = 4;
    if (!rafId) rafId = requestAnimationFrame(update);
  });

  function update() {
    currentX += (targetX - currentX) * 0.1;
    currentY += (targetY - currentY) * 0.1;
    appWindow.style.transform = `rotateY(${currentX}deg) rotateX(${currentY}deg) rotate(0.5deg)`;
    if (Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05) {
      rafId = requestAnimationFrame(update);
    } else {
      rafId = null;
    }
  }
}

// Close other FAQ items when one opens (single-open accordion)
const faqItems = document.querySelectorAll('.faq-item');
faqItems.forEach((item) => {
  item.addEventListener('toggle', () => {
    if (item.open) {
      faqItems.forEach((other) => {
        if (other !== item) other.removeAttribute('open');
      });
    }
  });
});

/* =========================================================
   Download modal — detects OS + arch, fetches latest release
   from GitHub, shows the recommended binary first.
   ========================================================= */
const ZZ_REPO = 'cryptopoly/ZipOrZoom';
const ZZ_RELEASES_API = `https://api.github.com/repos/${ZZ_REPO}/releases/latest`;
const ZZ_RELEASES_URL = `https://github.com/${ZZ_REPO}/releases`;
const ZZ_LATEST_URL = `https://github.com/${ZZ_REPO}/releases/latest`;

// Platform match table. Each entry: label, sub, icon key, regex/predicate on asset filename.
const ZZ_PLATFORMS = {
  'mac-arm64':    { label: 'macOS',   sub: 'Apple Silicon (M1-M4)',       icon: 'apple',   match: n => /\.dmg$/i.test(n) && /arm64|aarch64/i.test(n) },
  'mac-x64':      { label: 'macOS',   sub: 'Intel',                        icon: 'apple',   match: n => /\.dmg$/i.test(n) && /(x64|x86_64|intel)/i.test(n) && !/arm/i.test(n) },
  'mac-universal':{ label: 'macOS',   sub: 'Universal (Intel + Apple Silicon)', icon: 'apple', match: n => /\.dmg$/i.test(n) && !/arm64|aarch64|x64|x86_64|intel/i.test(n) },
  'win-x64':      { label: 'Windows', sub: 'x64 installer',                icon: 'windows', match: n => /\.exe$/i.test(n) && !/arm/i.test(n) && !/\.blockmap$/i.test(n) },
  'win-arm64':    { label: 'Windows', sub: 'ARM64 installer',              icon: 'windows', match: n => /\.exe$/i.test(n) && /arm64/i.test(n) && !/\.blockmap$/i.test(n) },
  'linux-x64':    { label: 'Linux',   sub: 'x64 AppImage',                 icon: 'linux',   match: n => /\.AppImage$/i.test(n) && !/arm/i.test(n) },
  'linux-arm64':  { label: 'Linux',   sub: 'ARM64 AppImage',               icon: 'linux',   match: n => /\.AppImage$/i.test(n) && /arm64|aarch64/i.test(n) },
  'linux-deb':    { label: 'Linux',   sub: 'x64 .deb',                     icon: 'linux',   match: n => /\.deb$/i.test(n) && /(amd64|x64|x86_64)/i.test(n) && !/arm/i.test(n) },
  'linux-rpm':    { label: 'Linux',   sub: 'x64 .rpm',                     icon: 'linux',   match: n => /\.rpm$/i.test(n) && !/arm/i.test(n) },
};

const ZZ_ICONS = {
  apple:   '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>',
  windows: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/></svg>',
  linux:   '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.835-.41 1.684-.287 2.489a.424.424 0 0 0-.11.135c-.26.268-.45.6-.663.839-.199.199-.485.267-.797.4-.313.136-.658.269-.864.68-.09.189-.136.394-.132.602 0 .199.027.4.055.6.058.399.116.773.027 1.04-.225.714-.154 1.37.081 1.834.234.464.631.77 1.05.866.847.197 1.95.038 2.855-.678.874-.689 2.3-.99 3.594-.897.597.035 1.235.168 1.74.395.515.223.916.517 1.094.844.317.571.845.854 1.44.854.643 0 1.168-.336 1.476-.845.324-.507.835-.787 1.478-.85.646-.064 1.293.116 1.893.37 1.154.504 2.51.556 3.486.131.488-.21.88-.58 1.09-1.07.21-.488.173-1.115-.113-1.75-.287-.637-.813-1.218-1.523-1.667-.672-.413-1.46-.713-2.33-.865-.866-.151-1.76-.16-2.626-.004-.822.143-1.623.412-2.313.783-1.123.606-1.755 1.457-2.086 2.311z"/></svg>',
};

let zzReleaseData = null;

function zzDetectOS() {
  const ua = navigator.userAgent || '';
  if (/Mac|iPhone|iPad|iPod/i.test(ua)) return 'mac';
  if (/Windows/i.test(ua)) return 'win';
  if (/Linux/i.test(ua)) return /aarch64|arm64/i.test(ua) ? 'linux-arm' : 'linux';
  return null;
}

async function zzDetectMacArch() {
  try {
    if (navigator.userAgentData && typeof navigator.userAgentData.getHighEntropyValues === 'function') {
      const d = await navigator.userAgentData.getHighEntropyValues(['architecture']);
      if (d.architecture === 'arm') return 'mac-arm64';
      if (d.architecture === 'x86') return 'mac-x64';
    }
  } catch (e) { /* unknown */ }
  return null;
}

async function zzFetchRelease() {
  if (zzReleaseData) return zzReleaseData;
  const cached = sessionStorage.getItem('zz-release');
  if (cached) {
    try { zzReleaseData = JSON.parse(cached); return zzReleaseData; } catch (e) { /* fall through */ }
  }
  try {
    const res = await fetch(ZZ_RELEASES_API);
    if (!res.ok) throw new Error('API error');
    zzReleaseData = await res.json();
    sessionStorage.setItem('zz-release', JSON.stringify(zzReleaseData));
    return zzReleaseData;
  } catch (e) {
    return null;
  }
}

function zzFindAssetUrl(platformKey) {
  if (!zzReleaseData || !Array.isArray(zzReleaseData.assets)) return null;
  const p = ZZ_PLATFORMS[platformKey];
  if (!p) return null;
  const asset = zzReleaseData.assets.find(a => p.match(a.name));
  return asset ? asset.browser_download_url : null;
}

function zzRenderButton(key, highlighted) {
  const p = ZZ_PLATFORMS[key];
  if (!p) return '';
  const url = zzFindAssetUrl(key);
  const href = url || ZZ_LATEST_URL;
  const cls = highlighted ? 'dl-btn dl-btn-recommended' : 'dl-btn';
  return `<a href="${href}" class="${cls}" target="_blank" rel="noopener">
    <span class="dl-btn-icon">${ZZ_ICONS[p.icon]}</span>
    <span class="dl-btn-info">
      <span class="dl-btn-label">${p.label}</span>
      <span class="dl-btn-sub">${p.sub}</span>
    </span>
    <svg class="dl-btn-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
  </a>`;
}

function toggleOtherPlatforms() {
  const el = document.getElementById('modal-other-list');
  const btn = document.getElementById('modal-other-toggle');
  if (!el || !btn) return;
  const isHidden = el.hasAttribute('hidden');
  if (isHidden) {
    el.removeAttribute('hidden');
    btn.classList.add('modal-toggle-open');
  } else {
    el.setAttribute('hidden', '');
    btn.classList.remove('modal-toggle-open');
  }
}

async function openDownloadModal() {
  const modal = document.getElementById('download-modal');
  if (!modal) {
    // Fallback — no modal on this page (legal pages). Go to releases.
    window.open(ZZ_LATEST_URL, '_blank', 'noopener');
    return;
  }
  modal.removeAttribute('hidden');
  document.body.style.overflow = 'hidden';

  const detectMsg = document.getElementById('modal-detect-msg');
  const recSection = document.getElementById('modal-recommended');
  const recList = document.getElementById('modal-recommended-list');
  const otherList = document.getElementById('modal-other-list');
  const otherToggle = document.getElementById('modal-other-toggle');
  const versionEl = document.getElementById('modal-version');

  // Reset
  if (detectMsg) detectMsg.textContent = 'Detecting your platform…';
  if (recSection) recSection.setAttribute('hidden', '');
  if (recList) recList.innerHTML = '';
  if (otherList) { otherList.innerHTML = ''; otherList.setAttribute('hidden', ''); }
  if (otherToggle) otherToggle.classList.remove('modal-toggle-open');
  if (versionEl) versionEl.innerHTML = '';

  const [, os] = await Promise.all([zzFetchRelease(), Promise.resolve(zzDetectOS())]);

  // Determine recommended keys
  let recommended = [];
  if (os === 'mac') {
    const arch = await zzDetectMacArch();
    if (arch) {
      recommended = [arch];
    } else {
      // Unknown arch — show both Apple Silicon and Intel
      recommended = ['mac-arm64', 'mac-x64'];
    }
  } else if (os === 'win') {
    recommended = ['win-x64'];
  } else if (os === 'linux-arm') {
    recommended = ['linux-arm64'];
  } else if (os === 'linux') {
    recommended = ['linux-x64'];
  }

  // Filter recommended to only keys where we actually have an asset (or always include if no release data yet)
  const availableRecommended = recommended.filter(k => !zzReleaseData || zzFindAssetUrl(k) || true);

  if (detectMsg) {
    detectMsg.textContent = availableRecommended.length
      ? 'We detected your platform — your download is ready.'
      : 'Select your platform to download.';
  }

  if (availableRecommended.length && recSection && recList) {
    recSection.removeAttribute('hidden');
    recList.innerHTML = availableRecommended.map(k => zzRenderButton(k, true)).join('');
  }

  // Other platforms = everything not in recommended
  const otherKeys = Object.keys(ZZ_PLATFORMS).filter(k => !availableRecommended.includes(k));
  if (otherList) otherList.innerHTML = otherKeys.map(k => zzRenderButton(k, false)).join('');

  // Version footer
  if (versionEl) {
    if (zzReleaseData && zzReleaseData.tag_name) {
      versionEl.innerHTML = `<a href="${zzReleaseData.html_url}" target="_blank" rel="noopener">${zzReleaseData.tag_name}</a> · <a href="${ZZ_RELEASES_URL}" target="_blank" rel="noopener">All releases</a>`;
    } else {
      versionEl.innerHTML = `<a href="${ZZ_RELEASES_URL}" target="_blank" rel="noopener">View all releases on GitHub</a>`;
    }
  }
}

function closeDownloadModal() {
  const modal = document.getElementById('download-modal');
  if (modal) modal.setAttribute('hidden', '');
  document.body.style.overflow = '';
}

// Close on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeDownloadModal();
});

// Close on overlay click
document.addEventListener('click', (e) => {
  const modal = document.getElementById('download-modal');
  if (modal && e.target === modal) closeDownloadModal();
});

// Expose to inline onclick handlers
window.openDownloadModal = openDownloadModal;
window.closeDownloadModal = closeDownloadModal;
window.toggleOtherPlatforms = toggleOtherPlatforms;

// Footer version — populate dynamically from GitHub release tag
(async () => {
  const el = document.getElementById('footer-version');
  if (!el) return;
  const release = await zzFetchRelease();
  if (release && release.tag_name) {
    el.textContent = release.tag_name;
  } else {
    el.textContent = 'Open source';
  }
})();

// If landing with #download in the URL, open the modal.
// Lets legal-page "Download" links route back to index and open it.
function zzHandleDownloadHash() {
  if (window.location.hash === '#download') {
    openDownloadModal();
    // Clean up the URL so refresh doesn't re-open
    if (history.replaceState) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }
}
window.addEventListener('DOMContentLoaded', zzHandleDownloadHash);
window.addEventListener('hashchange', zzHandleDownloadHash);
