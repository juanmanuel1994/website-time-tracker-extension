function formatTime(seconds) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  }
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

let viewMode = 'today'; // 'today' | 'total'

async function render() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const currentDomain = tab?.url ? getDomain(tab.url) : null;

  const { sites = {} } = await chrome.storage.local.get('sites');

  // Sitio actual
  const domainEl = document.getElementById('currentDomain');
  const timeEl = document.getElementById('currentTime');
  if (currentDomain) {
    domainEl.textContent = currentDomain;
    const s = sites[currentDomain];
    timeEl.textContent = formatTime(s ? (viewMode === 'today' ? s.today : s.total) : 0);
  } else {
    domainEl.textContent = 'No active page';
    timeEl.textContent = '—';
  }

  // Ordenar sitios
  const entries = Object.entries(sites)
    .map(([domain, data]) => ({ domain, seconds: viewMode === 'today' ? data.today : data.total }))
    .filter(e => e.seconds > 0)
    .sort((a, b) => b.seconds - a.seconds)
    .slice(0, 8);

  const listEl = document.getElementById('sitesList');
  const totalRow = document.getElementById('totalRow');
  const totalTime = document.getElementById('totalTime');

  if (entries.length === 0) {
    listEl.innerHTML = '<div class="empty">Browse some websites<br>to see your statistics</div>';
    totalRow.style.display = 'none';
    return;
  }

  const max = entries[0].seconds;
  const totalSeconds = entries.reduce((acc, e) => acc + e.seconds, 0);

  listEl.innerHTML = entries.map(({ domain, seconds }) => `
    <div class="site-item">
      <div class="site-header">
        <span class="site-name">${domain}</span>
        <span class="site-time">${formatTime(seconds)}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${Math.round((seconds / max) * 100)}%"></div>
      </div>
    </div>
  `).join('');

  totalRow.style.display = 'flex';
  totalTime.textContent = formatTime(totalSeconds);
}

function getDomain(url) {
  try {
    const u = new URL(url);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return u.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

document.getElementById('btnToday').addEventListener('click', () => {
  viewMode = 'today';
  document.getElementById('btnToday').classList.add('active');
  document.getElementById('btnTotal').classList.remove('active');
  render();
});

document.getElementById('btnTotal').addEventListener('click', () => {
  viewMode = 'total';
  document.getElementById('btnTotal').classList.add('active');
  document.getElementById('btnToday').classList.remove('active');
  render();
});

document.getElementById('btnReset').addEventListener('click', async () => {
  const confirmed = confirm('Clear all statistics?');
  if (confirmed) {
    await chrome.storage.local.remove('sites');
    render();
  }
});

render();
// Refrescar cada segundo mientras el popup está abierto
setInterval(render, 1000);
