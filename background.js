const IDLE_THRESHOLD = 60; // segundos hasta considerar idle
const SAVE_INTERVAL = 1000; // guardar cada segundo

let activeTabId = null;
let activeUrl = null;
let lastActiveTime = Date.now();
let isIdle = false;

function getDomain(url) {
  try {
    const u = new URL(url);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return u.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

async function addTime(domain, seconds) {
  if (!domain || seconds <= 0) return;
  const todayKey = getTodayKey();
  const result = await chrome.storage.local.get(['sites', 'lastDate']);
  let sites = result.sites || {};
  const lastDate = result.lastDate;

  // Resetear contadores "hoy" si cambió el día
  if (lastDate !== todayKey) {
    for (const d in sites) {
      sites[d].today = 0;
    }
  }

  if (!sites[domain]) {
    sites[domain] = { today: 0, total: 0 };
  }
  sites[domain].today += seconds;
  sites[domain].total += seconds;
  sites[domain].lastVisit = Date.now();

  await chrome.storage.local.set({ sites, lastDate: todayKey });
}

function flushTime() {
  if (isIdle || !activeUrl) return;
  const domain = getDomain(activeUrl);
  const now = Date.now();
  const elapsed = Math.round((now - lastActiveTime) / 1000);
  lastActiveTime = now;
  if (elapsed > 0 && elapsed < 3600) { // ignorar saltos > 1h
    addTime(domain, elapsed);
  }
}

// Guardar periódicamente
setInterval(flushTime, SAVE_INTERVAL);

chrome.tabs.onActivated.addListener(async (info) => {
  flushTime();
  activeTabId = info.tabId;
  const tab = await chrome.tabs.get(info.tabId).catch(() => null);
  activeUrl = tab?.url || null;
  lastActiveTime = Date.now();
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tabId !== activeTabId) return;
  if (changeInfo.status === 'complete' && tab.url) {
    flushTime();
    activeUrl = tab.url;
    lastActiveTime = Date.now();
  }
});

chrome.idle.setDetectionInterval(IDLE_THRESHOLD);
chrome.idle.onStateChanged.addListener((state) => {
  if (state === 'active') {
    isIdle = false;
    lastActiveTime = Date.now();
  } else {
    flushTime();
    isIdle = true;
  }
});

// Al iniciar, obtener la pestaña activa actual
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs[0]) {
    activeTabId = tabs[0].id;
    activeUrl = tabs[0].url;
    lastActiveTime = Date.now();
  }
});
