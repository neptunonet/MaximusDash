/**
 * MAXIMUS.COM.AR - Catálogo Dashboard
 * JavaScript para análisis de productos
 */

// Configuración de Chart.js
Chart.defaults.color = '#4a5568';
Chart.defaults.font.family = "'Barlow',sans-serif";
Chart.defaults.borderColor = 'rgba(255,255,255,.05)';

// Paleta de colores
const P = ['#00ff88','#3d9eff','#ffd60a','#ff3d5a','#a78bfa','#fb923c','#34d399','#f472b6','#60a5fa','#facc15','#4ade80','#e879f9','#38bdf8','#f87171','#c084fc'];

// Estado global
let DATA = [];
let ACT = 'all';  // Categoría activa
let CH = {};      // Charts

/**
 * Carga los datos desde products.json
 */
async function load() {
  try {
    const r = await fetch('./data/products.json');
    if (!r.ok) throw new Error('No se pudo cargar products.json');
    
    const j = await r.json();
    DATA = Array.isArray(j) ? j : (j.products || []);
    
    document.getElementById('plive').textContent = 'DATOS REALES';
    
    if (DATA[0]?.scrape_ts) {
      const d = new Date(DATA[0].scrape_ts);
      document.getElementById('sd').textContent = d.toLocaleDateString('es-AR');
      document.getElementById('fts').textContent = d.toLocaleString('es-AR');
    }
  } catch(e) {
    // Datos de demostración
    DATA = [
      {categoria_nombre:'Microprocesadores',nombre:'Micro Amd Ryzen 9 9950x 5.7 Ghz Am5',precio:1061300,stock:'STOCK ALTO EN LA WEB',marca:'AMD',codigo:'100-100001277WOF',garantia:'180 días'},
      {categoria_nombre:'Placas de Video',nombre:'Placa de Video Msi Rtx 5090 32gb Gddr7',precio:8926200,stock:'¡ULTIMAS UNIDADES!',marca:'MSI',codigo:'912-V530-237',garantia:'180 días'},
      {categoria_nombre:'Notebooks',nombre:'Notebook Asus Rog Strix G16 Rtx 4080',precio:3432000,stock:'STOCK ALTO EN LA WEB',marca:'ASUS',codigo:'G614JZR',garantia:'365 días'},
      {categoria_nombre:'Computadoras',nombre:'Pc Armada Intel I9 + Rtx 4090 64gb',precio:2800000,stock:'¡ULTIMAS UNIDADES!',marca:'MAXIMUS',codigo:'PC-I9-RTX4090',garantia:'180 días'},
      {categoria_nombre:'Monitores Gaming',nombre:'Monitor Asus Rog Swift 4k 144hz 27',precio:980000,stock:'STOCK ALTO EN LA WEB',marca:'ASUS',codigo:'PG27UCDM',garantia:'365 días'},
    ];
    document.getElementById('sd').textContent = 'DEMO';
    document.getElementById('plive').textContent = 'DATOS DEMO';
  }
  
  buildFilters();
  render();
}

/**
 * Funciones auxiliares
 */
const F = () => ACT === 'all' ? DATA : DATA.filter(p => p.categoria_nombre === ACT);
const WP = arr => arr.filter(p => p.precio && p.precio < 5_000_000);
const avg = arr => arr.length ? arr.reduce((a,b) => a + b, 0) / arr.length : 0;
const fmt = n => n >= 1000000 ? '$' + (n/1000000).toFixed(1) + 'M' : n >= 1000 ? '$' + Math.round(n/1000) + 'K' : '$' + Math.round(n);
const fmtF = n => '$' + Math.round(n).toLocaleString('es-AR');
const cats = () => [...new Set(DATA.map(p => p.categoria_nombre))].sort();
const cnt = (arr, k) => arr.reduce((a, x) => { const v = x[k] || '—'; a[v] = (a[v] || 0) + 1; return a; }, {});
const dc = id => { if(CH[id]) { CH[id].destroy(); delete CH[id]; } };

/**
 * Formatea el estado de stock
 */
function stk(s) {
  if (!s) return '<span class="tag td">—</span>';
  if (s.includes('ALTO')) return '<span class="tag tg">Stock Alto</span>';
  if (s.includes('ULTIMAS')) return `<span class="tag td">${s.slice(0,16)}</span>`;
  if (s.includes('EN STOCK')) return '<span class="tag tg">En Stock</span>';
  return `<span class="tag td">${s.slice(0,18)}</span>`;
}

/**
 * Renderiza el dashboard completo
 */
function render() {
  const f = F();
  const fp = WP(f);
  const prices = fp.map(p => p.precio);
  const allM = new Set(DATA.filter(p => p.marca).map(p => p.marca));

  // Header stats
  document.getElementById('h1').textContent = DATA.length;
  document.getElementById('h2').textContent = cats().length;
  document.getElementById('h3').textContent = allM.size;

  // KPIs principales
  document.getElementById('k1').textContent = f.length.toLocaleString('es-AR');
  document.getElementById('k1s').textContent = cats().length + ' categorías activas';
  
  if (prices.length) {
    document.getElementById('k2').textContent = fmt(avg(prices));
    const mx = Math.max(...prices);
    const mxp = fp.find(p => p.precio === mx);
    document.getElementById('k3').textContent = fmt(mx);
    document.getElementById('k3s').textContent = (mxp?.nombre || '').slice(0, 40) + '…';
  }
  
  const mF = new Set(f.filter(p => p.marca).map(p => p.marca));
  document.getElementById('k5').textContent = mF.size;
  const topM = Object.entries(cnt(f.filter(p => p.marca), 'marca')).sort((a,b) => b[1] - a[1])[0];
  if (topM) document.getElementById('k5s').textContent = 'top: ' + topM[0] + ' (' + topM[1] + ')';

  // Chart: Productos por Categoría
  const cc = cnt(f, 'categoria_nombre');
  const sc = Object.entries(cc).sort((a,b) => b[1] - a[1]);
  document.getElementById('lc').textContent = sc.length + ' categorías';
  dc('cCat');
  CH.cCat = new Chart(document.getElementById('cCat'), {
    type: 'bar',
    data: {
      labels: sc.map(x => x[0]),
      datasets: [{
        data: sc.map(x => x[1]),
        backgroundColor: sc.map((_, i) => P[i % P.length] + '99'),
        borderColor: sc.map((_, i) => P[i % P.length]),
        borderWidth: 1,
        borderRadius: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { maxRotation: 40, font: { size: 11 } } },
        y: { grid: { color: 'rgba(255,255,255,.04)' }, beginAtZero: true }
      }
    }
  });

  // Chart: Estado de Stock
  const sk = cnt(f, 'stock');
  const skC = {
    'STOCK ALTO EN LA WEB': '#00ff88',
    '¡ULTIMAS UNIDADES!': '#ffd60a',
    'EN STOCK': '#3d9eff',
    '—': '#4a5568'
  };
  dc('cStock');
  CH.cStock = new Chart(document.getElementById('cStock'), {
    type: 'doughnut',
    data: {
      labels: Object.keys(sk),
      datasets: [{
        data: Object.values(sk),
        backgroundColor: Object.keys(sk).map(k => (skC[k] || '#888') + 'cc'),
        borderColor: '#0d1117',
        borderWidth: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { font: { size: 11 }, boxWidth: 10, padding: 10, color: '#dde3ed' }
        }
      }
    }
  });

  // Chart: Top 12 Marcas
  const mc = cnt(f.filter(p => p.marca), 'marca');
  const tm = Object.entries(mc).sort((a,b) => b[1] - a[1]).slice(0, 12);
  document.getElementById('lm').textContent = Object.keys(mc).length + ' marcas';
  dc('cMarcas');
  CH.cMarcas = new Chart(document.getElementById('cMarcas'), {
    type: 'bar',
    data: {
      labels: tm.map(x => x[0]),
      datasets: [{
        data: tm.map(x => x[1]),
        backgroundColor: '#3d9eff44',
        borderColor: '#3d9eff',
        borderWidth: 1,
        borderRadius: 3
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,.04)' }, beginAtZero: true },
        y: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { font: { size: 11 } } }
      }
    }
  });

  // Chart: Ticket Promedio por Categoría
  const catA = {};
  cats().forEach(c => {
    const ps = WP(DATA.filter(p => p.categoria_nombre === c)).map(p => p.precio);
    if (ps.length) catA[c] = Math.round(avg(ps));
  });
  const sa = Object.entries(catA).sort((a,b) => b[1] - a[1]);
  dc('cAvg');
  CH.cAvg = new Chart(document.getElementById('cAvg'), {
    type: 'bar',
    data: {
      labels: sa.map(x => x[0]),
      datasets: [{
        data: sa.map(x => x[1]),
        backgroundColor: '#3d9eff33',
        borderColor: '#3d9eff',
        borderWidth: 1,
        borderRadius: 3
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => fmtF(ctx.raw) } }
      },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { callback: v => fmt(v), font: { size: 10 } } },
        y: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { font: { size: 11 } } }
      }
    }
  });

  // Chart: Histograma de Precios
  if (fp.length > 2) {
    const mn = Math.min(...prices);
    const mx2 = Math.max(...prices);
    const BINS = 8;
    const step = (mx2 - mn) / BINS;
    const bk = Array(BINS).fill(0);
    const ll = [];
    
    for (let i = 0; i < BINS; i++) ll.push(fmt(mn + i * step));
    prices.forEach(p => {
      let b = Math.min(Math.floor((p - mn) / step), BINS - 1);
      bk[b]++;
    });
    
    dc('cHisto');
    CH.cHisto = new Chart(document.getElementById('cHisto'), {
      type: 'bar',
      data: {
        labels: ll,
        datasets: [{
          data: bk,
          backgroundColor: '#ffd60a44',
          borderColor: '#ffd60a',
          borderWidth: 1,
          borderRadius: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { maxRotation: 35, font: { size: 10 } } },
          y: { grid: { color: 'rgba(255,255,255,.04)' }, beginAtZero: true }
        }
      }
    });
  }

  // Mini bars: Ticket Promedio por Marca
  const maA = {};
  [...new Set(DATA.filter(p => p.marca).map(p => p.marca))].forEach(m => {
    const ps = WP(DATA.filter(p => p.marca === m)).map(p => p.precio);
    if (ps.length >= 2) maA[m] = Math.round(avg(ps));
  });
  const sma = Object.entries(maA).sort((a,b) => b[1] - a[1]).slice(0, 12);
  const mxMA = sma[0]?.[1] || 1;
  
  document.getElementById('mbar').innerHTML = sma.map(([m, v]) => {
    const pct = (v / mxMA * 100).toFixed(1);
    const col = v > mxMA * .7 ? 'var(--accent2)' : v > mxMA * .4 ? 'var(--accent3)' : 'var(--accent)';
    return `<div class="mb"><div class="mb-l" title="${m}">${m}</div><div class="mb-t"><div class="mb-f" style="width:${pct}%;background:${col}"></div></div><div class="mb-v">${fmt(v)}</div></div>`;
  }).join('');

  // Tabla: Top 25 productos más caros
  const t25 = [...fp].sort((a,b) => b.precio - a.precio).slice(0, 25);
  const catL = cats();
  const tagCols = ['tg','tb','ty','tr','td'];
  
  document.getElementById('ltbl').textContent = ACT === 'all' ? 'todas las categorías' : ACT;
  document.getElementById('tbl').innerHTML = t25.map((p, i) => `
    <tr>
      <td class="tm" style="color:var(--muted)">${i+1}</td>
      <td><a href="${p.url||'#'}" target="_blank" style="color:var(--text);text-decoration:none">${p.nombre.slice(0,55)}${p.nombre.length>55?'…':''}</a></td>
      <td><span class="tag ${tagCols[catL.indexOf(p.categoria_nombre) % tagCols.length]}">${p.categoria_nombre}</span></td>
      <td style="color:var(--muted);font-size:12px">${p.marca||'—'}</td>
      <td class="tm" style="color:var(--accent)">${fmtF(p.precio)}</td>
      <td class="tm" style="color:var(--muted);font-size:11px">${p.codigo||'—'}</td>
      <td>${stk(p.stock)}</td>
      <td style="color:var(--muted);font-size:12px">${p.garantia||'—'}</td>
    </tr>
  `).join('');
}

/**
 * Construye los botones de filtro por categoría
 */
function buildFilters() {
  const bar = document.querySelector('.fbar');
  
  cats().forEach(c => {
    const b = document.createElement('button');
    b.className = 'fbtn';
    b.dataset.cat = c;
    b.textContent = c;
    b.addEventListener('click', () => {
      ACT = c;
      upBtns();
      render();
    });
    bar.appendChild(b);
  });
  
  document.querySelector('[data-cat="all"]').addEventListener('click', () => {
    ACT = 'all';
    upBtns();
    render();
  });
}

/**
 * Actualiza el estado activo de los botones de filtro
 */
function upBtns() {
  document.querySelectorAll('.fbtn').forEach(b => {
    b.classList.toggle('active', b.dataset.cat === ACT);
  });
}

// Inicializar al cargar la página
load();
