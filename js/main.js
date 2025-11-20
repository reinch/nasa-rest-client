// js/main.js

const contentArea = document.getElementById('content-area');

// Daftar fitur yang tersedia
const routes = {
  apod: () => import('./features/apod.js'),
  mars: () => import('./features/mars-rover.js'),
  epic: () => import('./features/epic.js'),
  neo:  () => import('./features/neo.js')
};

// Fungsi untuk load halaman berdasarkan hash
async function loadPage() {
  let section = window.location.hash.substring(1); // hilangkan "#"

  // Jika belum ada hash → default ke home
  if (!section) {
    contentArea.innerHTML = `
      <div class="text-center py-5">
        <h1 class="display-5">Selamat Datang!</h1>
        <p class="lead">Pilih menu di atas untuk mulai eksplorasi NASA API</p>
      </div>
    `;
    return;
  }

  // Atur menu yang aktif
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const activeLink = document.querySelector(`.nav-link[href="#${section}"]`);
  if (activeLink) activeLink.classList.add('active');

  // Jika route tidak ada
  if (!routes[section]) {
    contentArea.innerHTML = `<h3 class="text-center text-danger">Menu belum diatur</h3>`;
    return;
  }

  // Loading spinner
  contentArea.innerHTML = `
    <div class="text-center py-5">
      <div class="spinner-border text-primary" style="width:3rem;height:3rem;"></div>
    </div>
  `;

  try {
    const module = await routes[section]();
    if (module.default) module.default();
  } catch (err) {
    contentArea.innerHTML = `
      <div class="alert alert-danger">
        <strong>Error!</strong> File <code>js/features/${section}.js</code> belum dibuat atau ada kesalahan.<br><br>
        Detail: ${err.message}
      </div>
    `;
  }
}

// Listener hashchange & load
window.addEventListener("hashchange", loadPage);
window.addEventListener("load", loadPage);

// Klik link navbar → ubah hash tanpa reload
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.hash = link.getAttribute('href');
  });
});
