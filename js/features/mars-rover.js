// js/features/mars-rover.js

export default function () {
  const area = document.getElementById('content-area');

  area.innerHTML = `
    <h2>Mars Rover Photos</h2>
    <p>Fitur ini dikerjakan oleh Teman 2</p>
    <p>Endpoint:</p>
    <code>https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/photos</code>

    <div class="mt-3">
      <button id="loadRover" class="btn btn-primary">Ambil Foto Rover</button>
    </div>

    <div id="rover-result" class="mt-3"></div>
  `;

  document.getElementById("loadRover").onclick = async () => {
    const result = document.getElementById("rover-result");
    result.innerHTML = "Mengambil data...";

    try {
      const res = await fetch(
        "https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/photos?sol=1000&api_key=DEMO_KEY"
      );
      const data = await res.json();

      if (!data.photos || data.photos.length === 0) {
        result.innerHTML = "<p>Tidak ada foto pada sol ini.</p>";
        return;
      }

      const photo = data.photos[0];

      result.innerHTML = `
        <img src="${photo.img_src}" class="img-fluid rounded">
        <p><strong>Camera:</strong> ${photo.camera.full_name}</p>
        <p><strong>Earth Date:</strong> ${photo.earth_date}</p>
      `;
    } catch (err) {
      result.innerHTML = "<p>Gagal mengambil data.</p>";
    }
  };
}
