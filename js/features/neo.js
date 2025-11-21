// js/features/neo.js
export default function () {
  const API_KEY = 'rqc9xqdIxc9XiWXc5XiNvRMHceS14Iic6bJHvjuR'; // ganti dengan key pribadi kalau mau lebih dari 1000 request/hari
  const content = document.getElementById('content-area');

  content.innerHTML = `
    <h2 class="mb-4">Near Earth Objects (NEO) — Objek Dekat Bumi</h2>
    <div class="row">
      <div class="col-lg-8 mx-auto">
        <div class="input-group mb-3">
          <input type="date" id="start-date" class="form-control form-control-lg" />
          <input type="date" id="end-date" class="form-control form-control-lg" />
          <button id="load-neo" class="btn btn-primary btn-lg">Tampilkan</button>
        </div>

        <div id="notice" class="mb-3 text-muted small">
          Catatan: endpoint feed NeoWs menerima rentang maksimum 7 hari. Akan otomatis menyesuaikan jika rentang lebih panjang.
        </div>

        <div id="result-neo"></div>
      </div>
    </div>

    <!-- Modal untuk detail object -->
    <div class="modal fade" id="neoModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content bg-dark text-light">
          <div class="modal-header">
            <h5 class="modal-title" id="neoModalLabel"></h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body" id="neoModalBody"></div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Tutup</button>
          </div>
        </div>
      </div>
    </div>
  `;

  const startInput = document.getElementById('start-date');
  const endInput = document.getElementById('end-date');
  const loadBtn = document.getElementById('load-neo');
  const result = document.getElementById('result-neo');

  // set default tanggal hari ini
  const today = new Date();
  const isoDate = (d) => d.toISOString().slice(0, 10);
  startInput.value = isoDate(today);
  endInput.value = isoDate(today);

  // util: format number dengan pemisah ribuan
  const fmt = (n, digits = 0) => {
    if (n === null || n === undefined || isNaN(n)) return '-';
    return Number(n).toLocaleString(undefined, { maximumFractionDigits: digits });
  };

  // util: safe parse float
  const pf = (v) => (v === undefined || v === null || v === '') ? NaN : parseFloat(v);

  const loadNEO = async () => {
    let start = startInput.value;
    let end = endInput.value;

    if (!start || !end) {
      result.innerHTML = `<div class="alert alert-warning">Pilih tanggal mulai dan/atau tanggal selesai.</div>`;
      return;
    }

    // pastikan start <= end
    if (new Date(start) > new Date(end)) {
      [start, end] = [end, start]; // swap
    }

    // batasi range maksimum 7 hari (NeoWs limit)
    const msInDay = 24 * 60 * 60 * 1000;
    const days = Math.round((new Date(end) - new Date(start)) / msInDay) + 1;
    if (days > 7) {
      // set end = start + 6 hari
      const newEnd = new Date(new Date(start).getTime() + 6 * msInDay);
      end = isoDate(newEnd);
      endInput.value = end;
      document.getElementById('notice').innerHTML = `<span class="text-warning">Rentang diubah agar ≤ 7 hari. Menampilkan ${start} → ${end}.</span>`;
    } else {
      document.getElementById('notice').innerHTML = `<span class="text-muted small">Catatan: endpoint feed NeoWs menerima rentang maksimum 7 hari.</span>`;
    }

    result.innerHTML = `<div class="text-center my-5"><div class="spinner-border text-light" style="width:4rem;height:4rem;"></div></div>`;

    try {
      const url = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${start}&end_date=${end}&api_key=${API_KEY}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));

      // data.near_earth_objects is object with keys = dates
      const byDate = data.near_earth_objects || {};
      const dates = Object.keys(byDate).sort();
      let items = [];
      dates.forEach(d => {
        items = items.concat(byDate[d].map(obj => ({ ...obj, _close_date: d })));
      });

      if (items.length === 0) {
        result.innerHTML = `<div class="alert alert-info">Tidak ada NEO untuk rentang tanggal tersebut.</div>`;
        return;
      }

      // sort by close approach time ascending
      items.sort((a, b) => {
        const aTime = a.close_approach_data && a.close_approach_data[0] ? a.close_approach_data[0].epoch_date_close_approach || 0 : 0;
        const bTime = b.close_approach_data && b.close_approach_data[0] ? b.close_approach_data[0].epoch_date_close_approach || 0 : 0;
        return aTime - bTime;
      });

      // build HTML list
      const cards = items.map(obj => {
        const hazardous = obj.is_potentially_hazardous_asteroid;
        const estMin = obj.estimated_diameter.meters.estimated_diameter_min;
        const estMax = obj.estimated_diameter.meters.estimated_diameter_max;

        // take first close approach (closest approach in the requested range)
        const ca = (obj.close_approach_data && obj.close_approach_data[0]) || {};
        const approachDate = ca.close_approach_date_full || ca.close_approach_date || obj._close_date || '-';
        const relVelKmH = ca.relative_velocity ? pf(ca.relative_velocity.kilometers_per_hour) : NaN;
        const missKm = ca.miss_distance ? pf(ca.miss_distance.kilometers) : NaN;
        const missLD = ca.miss_distance ? pf(ca.miss_distance.lunar) : NaN;
        const orbitingBody = ca.orbiting_body || '-';
        const jplUrl = obj.nasa_jpl_url || '#';

        return `
        <div class="card mb-3 bg-dark text-light shadow-sm">
          <div class="card-body">
            <div class="d-flex justify-content-between">
              <div>
                <h5 class="card-title mb-1">${obj.name} ${hazardous ? '<span class="badge bg-danger align-top">HAZARD</span>' : '<span class="badge bg-success align-top">Safe</span>'}</h5>
                <div class="text-muted small">${obj.designation || ''} • Close: <strong>${approachDate}</strong> • Orbiting: <strong>${orbitingBody}</strong></div>
              </div>
              <div class="text-end">
                <div class="small text-muted">Diameter (m)</div>
                <div><strong>${fmt(estMin,2)} — ${fmt(estMax,2)}</strong></div>
              </div>
            </div>

            <div class="mt-3 d-flex justify-content-between align-items-center">
              <div class="small text-muted">Miss distance: <strong>${fmt(missKm,2)} km</strong> (~${fmt(missLD,2)} LD)</div>
              <div class="small text-muted">Rel. velocity: <strong>${fmt(relVelKmH,2)} km/h</strong></div>
            </div>

            <div class="mt-3 d-flex justify-content-end">
              <button class="btn btn-outline-light btn-sm me-2" data-neo-id="${obj.id}" onclick="(function(){document.dispatchEvent(new CustomEvent('neo_show_detail',{detail:${JSON.stringify(obj).replace(/</g,'\\u003c')}}))})()">Detail</button>
              <a class="btn btn-light btn-sm" target="_blank" href="${jplUrl}">JPL Link</a>
            </div>
          </div>
        </div>
        `;
      }).join('');

      result.innerHTML = `
        <div class="mb-3"><strong>Ditemukan ${items.length} objek</strong> untuk rentang ${start} → ${end}.</div>
        ${cards}
      `;

    } catch (e) {
      console.error(e);
      result.innerHTML = `<div class="alert alert-danger">Error: ${e.message}</div>`;
    }
  };

  // event listener untuk menampilkan modal detail
  document.addEventListener('neo_show_detail', (ev) => {
    const obj = ev.detail;
    const hazardous = obj.is_potentially_hazardous_asteroid;
    const estM = obj.estimated_diameter.meters;
    const estMin = estM.estimated_diameter_min;
    const estMax = estM.estimated_diameter_max;

    let caHtml = '<div class="text-muted small">Tidak ada data close approach.</div>';
    if (obj.close_approach_data && obj.close_approach_data.length > 0) {
      caHtml = obj.close_approach_data.map(ca => {
        const dateFull = ca.close_approach_date_full || ca.close_approach_date;
        const relVel = ca.relative_velocity ? `${fmt(pf(ca.relative_velocity.kilometers_per_hour),2)} km/h` : '-';
        const missKm = ca.miss_distance ? `${fmt(pf(ca.miss_distance.kilometers),2)} km` : '-';
        const missL = ca.miss_distance ? `${fmt(pf(ca.miss_distance.lunar),2)} LD` : '-';
        return `
          <div class="mb-2">
            <div><strong>${dateFull}</strong> — Orbiting: ${ca.orbiting_body || '-'}</div>
            <div class="small text-muted">Rel. velocity: ${relVel} • Miss: ${missKm} (~${missL})</div>
          </div>
        `;
      }).join('');
    }

    const modalTitle = document.getElementById('neoModalLabel');
    const modalBody = document.getElementById('neoModalBody');

    modalTitle.innerHTML = `${obj.name} ${hazardous ? '<span class="badge bg-danger">Potentially Hazardous</span>' : '<span class="badge bg-success">Not Hazardous</span>'}`;

    modalBody.innerHTML = `
      <p class="mb-2"><strong>Designation:</strong> ${obj.designation || '-'}</p>
      <p class="mb-2"><strong>Estimated diameter (meters):</strong> ${fmt(estMin,2)} — ${fmt(estMax,2)} m</p>
      <p class="mb-2"><strong>Absolute magnitude (H):</strong> ${fmt(obj.absolute_magnitude_h,2)}</p>
      <hr/>
      <h6>Close approach data</h6>
      ${caHtml}
      <hr/>
      <p class="small text-muted">More info: <a target="_blank" href="${obj.nasa_jpl_url}">${obj.nasa_jpl_url}</a></p>
      <pre class="small bg-black p-2 rounded" style="max-height:220px;overflow:auto">${JSON.stringify(obj, null, 2)}</pre>
    `;

    // show modal (Bootstrap 5)
    const neoModalEl = document.getElementById('neoModal');
    const neoModal = new bootstrap.Modal(neoModalEl);
    neoModal.show();
  });

  loadBtn.onclick = loadNEO;

  // langsung load hari ini
  loadNEO();
}
