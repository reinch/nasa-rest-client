// js/features/apod.js
export default function () {
  const API_KEY = 'DEMO KEY'; // ganti dengan key pribadi kalau mau lebih dari 1000 request/hari
  document.getElementById('content-area').innerHTML = `
    <h2 class="mb-4">Foto Astronomi Hari ini (Astronomy Picture Of the Day APOD)</h2>
    <div class="row">
      <div class="col-lg-8 mx-auto">
        <div class="input-group mb-4">
          <input type="date" id="date" class="form-control form-control-lg">
          <button id="load" class="btn btn-primary btn-lg">Tampilkan</button>
        </div>
        <div id="result"></div>
      </div>
    </div>`;

  const dateInput = document.getElementById('date');
  const result = document.getElementById('result');
  dateInput.valueAsDate = new Date();

  const loadAPOD = async () => {
    const date = dateInput.value;
    result.innerHTML = `<div class="text-center my-5"><div class="spinner-border text-light" style="width:4rem;height:4rem;"></div></div>`;

    try {
      const res = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${API_KEY}&date=${date}`);
      const data = await res.json();

      if (data.error) throw new Error(data.error.message);

      let media = '';
      if (data.media_type === 'image') {
        media = `<img src="${data.hdurl || data.url}" class="img-fluid rounded shadow" alt="${data.title}">`;
      } else if (data.media_type === 'video') {
        media = `<iframe width="100%" height="500" src="${data.url}" class="rounded shadow" allowfullscreen></iframe>`;
      }

      result.innerHTML = `
        <h3 class="mt-4">${data.title} <small class="text-muted">(${data.date})</small></h3>
        ${media}
        <p class="mt-4 lead">${data.explanation}</p>
        ${data.copyright ? `<p class="text-end text-muted"><em>© ${data.copyright}</em></p>` : ''}
      `;
    } catch (e) {
      result.innerHTML = `<div class="alert alert-danger">Error: ${e.message}</div>`;
    }
  };

  document.getElementById('load').onclick = loadAPOD;
  loadAPOD(); // langsung load hari ini
}