/**
 * MAXIMUS.COM.AR - Analytics Dashboard
 * JavaScript para análisis de tráfico web (Google Analytics 4)
 */

// Configuración de Chart.js
Chart.defaults.color = '#4a5568';
Chart.defaults.font.family = "'Barlow',sans-serif";
Chart.defaults.borderColor = 'rgba(255,255,255,.05)';

// Utilidades de formato
const fmt = n => n >= 1000000 ? (n/1000000).toFixed(1) + 'M' : n >= 1000 ? Math.round(n/1000) + 'K' : n.toLocaleString('es-AR');
const fmtF = n => Math.round(n).toLocaleString('es-AR');
const fmtSeg = s => {
  const m = Math.floor(s/60);
  const sg = Math.round(s%60);
  return m > 0 ? `${m}m ${sg}s` : `${sg}s`;
};
const DIAS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

// Páginas internas del ERP a filtrar
const FILTRAR = ['/wfmUpdateIsEditing','/MICUENTA','/CHECKOUT','/seguimiento','/rma','/AYUDA'];
const esInterna = p => FILTRAR.some(f => p.includes(f));

/**
 * Clasifica el tipo de página según su path
 */
function tipoPagina(path) {
  if (path === '/' || path.includes('home')) return {l:'Home', c:'tg'};
  if (path.includes('Producto/') && path.includes('ITEM=')) return {l:'Producto', c:'tb'};
  if (path.includes('Productos/')) return {l:'Categoría', c:'ty'};
  if (path.includes('armarpc') || path.includes('combopc')) return {l:'Armá tu PC', c:'tp'};
  if (path.includes('empresas')) return {l:'Empresas', c:'tr'};
  return {l:'Otra', c:'td'};
}

/**
 * Carga los datos desde analytics_data.json
 */
async function load() {
  let D;
  
  try {
    const r = await fetch('./data/analytics_data.json');
    if (!r.ok) throw new Error('No se pudo cargar analytics_data.json');
    D = await r.json();
  } catch(e) {
    alert('No se encontró analytics_data.json. Colocalo en la carpeta /data/');
    return;
  }

  const t = D.totales;
  document.getElementById('periodo').textContent = `${D.date_start} → ${D.date_end}`;
  document.getElementById('fts').textContent = new Date(D.fetch_ts).toLocaleString('es-AR');

  // Header stats
  document.getElementById('h1').textContent = fmt(t.sessions);
  document.getElementById('h2').textContent = fmt(t.activeUsers);
  document.getElementById('h3').textContent = fmt(t.screenPageViews);
  document.getElementById('h4').textContent = fmtSeg(t.avg_session_duration);

  // KPIs principales
  document.getElementById('k1').textContent = fmt(t.sessions);
  document.getElementById('k1s').textContent = `~${fmt(Math.round(t.sessions/90))} por día`;
  document.getElementById('k2').textContent = fmt(t.activeUsers);
  document.getElementById('k2s').textContent = `${fmt(t.newUsers)} nuevos`;
  document.getElementById('k3').textContent = fmt(t.screenPageViews);
  document.getElementById('k4').textContent = fmtSeg(t.avg_session_duration);
  document.getElementById('k5').textContent = fmt(t.newUsers);
  document.getElementById('k5s').textContent = `${Math.round(t.newUsers/t.activeUsers*100)}% del total`;
  document.getElementById('k6').textContent = `${(t.avg_bounce_rate*100).toFixed(1)}%`;

  // Cálculos para insights
  const devMobile = D.dispositivos.find(d => d.deviceCategory === 'mobile');
  const devDesktop = D.dispositivos.find(d => d.deviceCategory === 'desktop');
  const pctMobile = devMobile ? Math.round(devMobile.sessions/t.sessions*100) : 0;
  const pctCPC = D.fuentes_trafico.filter(f => f.sessionMedium === 'cpc').reduce((a,f) => a + f.sessions, 0);
  const pctOrg = D.fuentes_trafico.filter(f => f.sessionMedium === 'organic').reduce((a,f) => a + f.sessions, 0);

  // Tendencia (primera vs segunda mitad del período)
  const dias = D.sesiones_por_dia;
  const primerMitad = dias.slice(0,45).reduce((a,d) => a + d.sessions, 0) / 45;
  const segMitad = dias.slice(45).reduce((a,d) => a + d.sessions, 0) / 45;
  const crecimiento = Math.round((segMitad - primerMitad) / primerMitad * 100);

  // Insights automáticos
  const ins = [
    {tipo:'info', texto:`<strong>${pctMobile}% del tráfico es mobile</strong> (${fmt(devMobile?.sessions||0)} sesiones). El sitio debe estar optimizado para celulares.`},
    {tipo:'info', texto:`<strong>Google Ads (CPC) representa el ${Math.round(pctCPC/t.sessions*100)}%</strong> del tráfico total (${fmt(pctCPC)} sesiones) — es la principal fuente pagada.`},
    {tipo:'info', texto:`<strong>Google Orgánico: ${Math.round(pctOrg/t.sessions*100)}%</strong> del tráfico (${fmt(pctOrg)} sesiones) — buen posicionamiento SEO.`},
    {tipo:crecimiento>0?'info':'warn', texto:`<strong>Tendencia: ${crecimiento>0?'+':''}${crecimiento}%</strong> en sesiones vs primera mitad del período. ${crecimiento>0?'El tráfico está creciendo.':'El tráfico bajó.'}`},
    {tipo:'info', texto:`<strong>Hora pico: 20hs</strong> con mayor concentración de sesiones. El tráfico cae fuerte entre las 3hs y 7hs.`},
    {tipo:'warn', texto:`<strong>Sesiones desde EEUU: ${fmt(D.paises?.find(p=>p.country==='United States')?.sessions||0)}</strong> — revisar si son bots o tráfico legítimo.`},
  ];
  
  document.getElementById('insights').innerHTML = ins.map(i => `
    <div class="insight ${i.tipo==='warn'?'warn':''}">
      <span class="iico">${i.tipo==='warn'?'⚠':'→'}</span>
      <div>${i.texto}</div>
    </div>
  `).join('');

  // Chart: Sesiones por día (tendencia)
  const labelsDias = dias.map(d => {
    const s = d.date;
    return `${s.slice(6,8)}/${s.slice(4,6)}`;
  });
  const trend = `${crecimiento>0?'↑':'↓'} ${Math.abs(crecimiento)}% vs mes anterior`;
  document.getElementById('trend-lbl').textContent = trend;
  
  new Chart(document.getElementById('cDias'), {
    type: 'line',
    data: {
      labels: labelsDias,
      datasets: [
        {
          label: 'Sesiones',
          data: dias.map(d => d.sessions),
          borderColor: '#3d9eff',
          backgroundColor: 'rgba(61,158,255,.1)',
          borderWidth: 2,
          fill: true,
          tension: .3,
          pointRadius: 0,
          pointHoverRadius: 4
        },
        {
          label: 'Usuarios',
          data: dias.map(d => d.activeUsers),
          borderColor: '#00ff88',
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          tension: .3,
          pointRadius: 0,
          pointHoverRadius: 4,
          borderDash: [4,4]
        },
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'top',
          labels: { font: { size: 11 }, boxWidth: 12, color: '#dde3ed' }
        }
      },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { maxTicksLimit: 12, font: { size: 10 } } },
        y: { grid: { color: 'rgba(255,255,255,.04)' }, beginAtZero: false }
      }
    }
  });

  // Chart: Dispositivos
  const devs = D.dispositivos.filter(d => d.sessions > 100);
  new Chart(document.getElementById('cDevices'), {
    type: 'doughnut',
    data: {
      labels: devs.map(d => d.deviceCategory.charAt(0).toUpperCase() + d.deviceCategory.slice(1)),
      datasets: [{
        data: devs.map(d => d.sessions),
        backgroundColor: ['#3d9eff','#00ff88','#ffd60a','#a78bfa'],
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

  // Chart: Fuentes de tráfico (agrupadas)
  const fuentesAgrup = {};
  D.fuentes_trafico.forEach(f => {
    const key = f.sessionSource === '(direct)' ? 'Directo' :
                f.sessionSource === 'google' && f.sessionMedium === 'cpc' ? 'Google Ads' :
                f.sessionSource === 'google' && f.sessionMedium === 'organic' ? 'Google Orgánico' :
                f.sessionSource === 'facebook' ? 'Facebook' :
                f.sessionSource + '/' + f.sessionMedium;
    fuentesAgrup[key] = (fuentesAgrup[key] || 0) + f.sessions;
  });
  const sortF = Object.entries(fuentesAgrup).sort((a,b) => b[1] - a[1]).slice(0, 8);
  const colF = ['#ff3d5a','#3d9eff','#00ff88','#ffd60a','#a78bfa','#fb923c','#34d399','#f472b6'];
  
  new Chart(document.getElementById('cFuentes'), {
    type: 'bar',
    data: {
      labels: sortF.map(x => x[0]),
      datasets: [{
        data: sortF.map(x => x[1]),
        backgroundColor: sortF.map((_, i) => colF[i] + '99'),
        borderColor: sortF.map((_, i) => colF[i]),
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
        x: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { callback: v => fmt(v) } },
        y: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { font: { size: 11 } } }
      }
    }
  });

  // Chart: Tráfico por hora
  const horas = D.por_hora.sort((a,b) => parseInt(a.hour) - parseInt(b.hour));
  new Chart(document.getElementById('cHoras'), {
    type: 'bar',
    data: {
      labels: horas.map(h => h.hour.padStart(2,'0') + 'h'),
      datasets: [{
        data: horas.map(h => h.sessions),
        backgroundColor: horas.map(h => {
          const hr = parseInt(h.hour);
          return hr >= 20 || hr <= 6 ? '#ffd60a99' : '#3d9eff55';
        }),
        borderColor: horas.map(h => {
          const hr = parseInt(h.hour);
          return hr >= 20 || hr <= 6 ? '#ffd60a' : '#3d9eff';
        }),
        borderWidth: 1,
        borderRadius: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { font: { size: 10 } } },
        y: { grid: { color: 'rgba(255,255,255,.04)' }, beginAtZero: true, ticks: { callback: v => fmt(v) } }
      }
    }
  });

  // Chart: Días de la semana
  const diasSem = D.por_dia_semana.sort((a,b) => parseInt(a.dayOfWeek) - parseInt(b.dayOfWeek));
  new Chart(document.getElementById('cDiaSemana'), {
    type: 'bar',
    data: {
      labels: diasSem.map(d => DIAS[parseInt(d.dayOfWeek)]),
      datasets: [{
        data: diasSem.map(d => d.sessions),
        backgroundColor: diasSem.map(d => parseInt(d.dayOfWeek) === 0 || parseInt(d.dayOfWeek) === 6 ? '#a78bfa99' : '#3d9eff99'),
        borderColor: diasSem.map(d => parseInt(d.dayOfWeek) === 0 || parseInt(d.dayOfWeek) === 6 ? '#a78bfa' : '#3d9eff'),
        borderWidth: 1,
        borderRadius: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,.04)' } },
        y: { grid: { color: 'rgba(255,255,255,.04)' }, beginAtZero: true, ticks: { callback: v => fmt(v) } }
      }
    }
  });

  // Chart: Sistemas Operativos
  const os = D.sistemas_operativos.filter(s => s.sessions > 100).slice(0, 6);
  const osColors = ['#3d9eff','#00ff88','#a78bfa','#ffd60a','#fb923c','#f472b6'];
  new Chart(document.getElementById('cOS'), {
    type: 'doughnut',
    data: {
      labels: os.map(s => s.operatingSystem),
      datasets: [{
        data: os.map(s => s.sessions),
        backgroundColor: osColors.map(c => c + 'cc'),
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
          labels: { font: { size: 11 }, boxWidth: 10, padding: 8, color: '#dde3ed' }
        }
      }
    }
  });

  // Mini bars: Top ciudades
  const ciudades = D.ciudades.filter(c => c.city !== '(not set)').slice(0, 10);
  const maxC = ciudades[0]?.sessions || 1;
  document.getElementById('mbar-ciudades').innerHTML = ciudades.map(c => {
    const pct = (c.sessions / maxC * 100).toFixed(1);
    return `<div class="mb"><div class="mb-l" title="${c.city}">${c.city}</div><div class="mb-t"><div class="mb-f" style="width:${pct}%;background:var(--blue)"></div></div><div class="mb-v">${fmt(c.sessions)}</div></div>`;
  }).join('');

  // Tabla: Páginas más visitadas (filtrar internas del ERP)
  const pags = D.paginas_top.filter(p => !esInterna(p.pagePath)).slice(0, 20);
  document.getElementById('tbl-paginas').innerHTML = pags.map((p, i) => {
    const tipo = tipoPagina(p.pagePath);
    const titulo = p.pageTitle && p.pageTitle !== '(not set)' ? p.pageTitle.slice(0,60) : p.pagePath.slice(0,60);
    return `<tr>
      <td class="tm" style="color:var(--muted)">${i+1}</td>
      <td><span style="color:var(--text)">${titulo}</span><br><span style="color:var(--muted);font-size:11px">${p.pagePath.slice(0,70)}</span></td>
      <td class="tm" style="color:var(--blue)">${fmtF(p.screenPageViews)}</td>
      <td class="tm" style="color:var(--muted)">${fmtSeg(p.averageSessionDuration)}</td>
      <td class="tm" style="color:${p.bounceRate>0.5?'var(--accent2)':'var(--muted)'}">${(p.bounceRate*100).toFixed(1)}%</td>
      <td><span class="tag ${tipo.c}">${tipo.l}</span></td>
    </tr>`;
  }).join('');

  // Tabla: Fuentes de tráfico detalladas
  const totalSess = t.sessions;
  document.getElementById('tbl-fuentes').innerHTML = D.fuentes_trafico.slice(0, 15).map((f, i) => {
    const convRate = f.sessions > 0 ? (f.conversions / f.sessions * 100).toFixed(2) : '0.00';
    const medioTag = f.sessionMedium === 'cpc' ? 'tr' :
                     f.sessionMedium === 'organic' ? 'tg' :
                     f.sessionMedium.includes('social') ? 'tp' : 'tb';
    return `<tr>
      <td class="tm" style="color:var(--muted)">${i+1}</td>
      <td style="color:var(--text)">${f.sessionSource}</td>
      <td><span class="tag ${medioTag}">${f.sessionMedium}</span></td>
      <td class="tm" style="color:var(--blue)">${fmtF(f.sessions)}</td>
      <td class="tm" style="color:var(--muted)">${fmtF(f.activeUsers)}</td>
      <td class="tm" style="color:var(--accent)">${fmtF(f.conversions)}</td>
      <td class="tm" style="color:${parseFloat(convRate)>1?'var(--accent)':'var(--muted)'}">${convRate}%</td>
    </tr>`;
  }).join('');
}

// Inicializar al cargar la página
load();
