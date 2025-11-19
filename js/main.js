// js/main.js
const contentArea = document.getElementById('content-area');

const routes = {
  apod:   () => import('./features/apod.js'),
  mars:   () => import('./features/mars-rover.js'),
  epic:   () => import('./features/epic.js'),
  neo:    () => import('./features/neo.js')
};

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', async (e) => {
    e.preventDefault();
    
    // Ganti active
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    link.classList.add('active');

    const section = link.getAttribute('href').substring(1);

    if (!routes[section]) {
      contentArea.innerHTML = `<h3 class="text-center text-danger">Menu belum diatur</h3>`;
      return;
    }

    contentArea.innerHTML = `<div class="text-center py-5"><div class="spinner-border text-primary" style="width:3rem;height:3rem;"></div></div>`;

    try {
      const module = await routes[section]();
      if (module.default) module.default();
    } catch (err) {
      contentArea.innerHTML = `
        <div class="alert alert-danger">
          <strong>Error!</strong> File <code>js/features/${section}.js</code> belum dibuat atau ada kesalahan.<br><br>
          Detail: ${err.message}
        </div>`;
    }
  });
});