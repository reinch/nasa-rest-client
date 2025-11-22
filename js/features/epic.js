// js/features/epic-earth.js
export default function () {
  const API_KEY = '1rbnLdGdyPWgHMnX8PWEikYbwrdFphc0KrII9Zfr'; // pakai key-mu sendiri kalau perlu

  document.getElementById('content-area').innerHTML = `
    <h2 class="mb-4">Foto Bumi dari EPIC (Earth Polychromatic Imaging Camera)</h2>
    <div class="row">
      <div class="col-lg-8 mx-auto">
        <div class="input-group mb-4">
          <input type="date" id="epic-date" class="form-control form-control-lg">
          <button id="epic-load" class="btn btn-primary btn-lg">Tampilkan</button>
        </div>
        <div id="epic-result"></div>
      </div>
    </div>
  `;

  const dateInput = document.getElementById('epic-date');
  const result = document.getElementById('epic-result');

  // set default tanggal hari ini + batasi max agar tidak bisa pilih tanggal masa depan
  const today = new Date();
  dateInput.valueAsDate = today;
  dateInput.max = dateInput.value;

  // util: normalisasi tanggal (kalau user ngetik 22/11/2025 jadi 2025-11-22)
  const normalizeDate = (val) => {
    if (!val) return '';
    if (val.includes('/')) {
      const [d, m, y] = val.split('/');
      if (d && m && y) {
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      }
    }
    return val; // kalau sudah YYYY-MM-DD dari <input type="date">
  };

  const loadEpic = async () => {
    let date = normalizeDate(dateInput.value);

    if (!date) {
      result.innerHTML = `<div class="alert alert-warning">Silakan pilih tanggal terlebih dahulu.</div>`;
      return;
    }

    result.innerHTML = `
      <div class="text-center my-5">
        <div class="spinner-border text-light" style="width:4rem;height:4rem;"></div>
      </div>
    `;

    try {
      const url = `https://api.nasa.gov/EPIC/api/natural/date/${date}?api_key=${API_KEY}`;
      const res = await fetch(url);

      const contentType = res.headers.get('content-type') || '';

      // kalau status HTTP bukan 2xx, baca text untuk pesan error yang lebih jelas
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text.slice(0, 120)}`);
      }

      // kalau bukan JSON (misal: "upstream connect error ..."), jangan paksa json()
      if (!contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error(`Respon non-JSON dari API: ${text.slice(0, 120)}`);
      }

      const data = await res.json();

      if (!Array.isArray(data)) {
        throw new Error('Struktur data EPIC tidak sesuai.');
      }

      if (data.length === 0) {
        result.innerHTML = `
          <div class="alert alert-info">
            Tidak ada data EPIC untuk tanggal <strong>${date}</strong>. Coba pilih tanggal lain.
          </div>
        `;
        return;
      }

      // ambil gambar terakhir di hari itu
      const item = data[data.length - 1];

      const d = new Date(item.date);
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');

      const imageUrl = `https://epic.gsfc.nasa.gov/archive/natural/${year}/${month}/${day}/png/${item.image}.png`;
      const caption = item.caption || 'Foto Bumi dari satelit DSCOVR (kamera EPIC).';

      const centroid = item.centroid_coordinates || {};
      const centroidInfo =
        centroid.lat != null && centroid.lon != null
          ? `<p class="mb-1"><strong>Koordinat pusat:</strong> ${centroid.lat.toFixed(2)}, ${centroid.lon.toFixed(2)}</p>`
          : '';

      result.innerHTML = `
        <h3 class="mt-4">Bumi dari EPIC <small class="text-muted">(${date})</small></h3>
        <img src="${imageUrl}" class="img-fluid rounded shadow my-3" alt="Earth from EPIC on ${date}">
        <p class="mt-3 lead">${caption}</p>
        <div class="small text-muted mt-2">
          ${centroidInfo}
          <p class="mb-1"><strong>Identifier:</strong> ${item.identifier}</p>
          <p class="mb-1"><strong>Nama file:</strong> ${item.image}.png</p>
          <p class="mb-0"><em>Sumber data: NASA EPIC / DSCOVR</em></p>
        </div>
      `;
    } catch (e) {
      result.innerHTML = `<div class="alert alert-danger">Error: ${e.message}</div>`;
    }
  };

  document.getElementById('epic-load').onclick = loadEpic;
  loadEpic(); // langsung load hari ini
}
