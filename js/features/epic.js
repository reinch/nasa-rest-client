//js/features/epic.js

const API_KEY = "1rbnLdGdyPWgHMnX8PWEikYbwrdFphc0KrII9Zfr";

export default function loadEpic() {
  const content = document.getElementById("content-area");
  if (!content) return console.error("#content element not found");
  content.innerHTML = `
    <h2>EPIC Earth Images</h2>
    <p>Fitur ini dikerjakan oleh Teman 3</p>
    <p>Endpoint:</p>
    <code>https://api.nasa.gov/EPIC/api/natural/images</code>

    <div class="mt-3">
    <button id="btn-load-epic" class="btn btn-primary">Load EPIC Images</button>
    </div>

    <div id="epic-result" class="mt-3"></div>
  `;
  document.getElementById("btn-load-epic").addEventListener("click", fetchEpicImages);
}

async function fetchEpicImages() {
  const result = document.getElementById("epic-result");

  result.innerHTML = `<div class="epic-loading">Loading EPIC images...</div>`;

  const endpoint = `https://api.nasa.gov/EPIC/api/natural/images?api_key=${API_KEY}`;

  try {
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      result.innerHTML = `<p>No EPIC images available.</p>`;
      return;
    }

    const cards = data.map(item => {
      const dateOnly = item.date.split(" ")[0];
      const [year, month, day] = dateOnly.split("-");
      const imageUrl = `https://epic.gsfc.nasa.gov/archive/natural/${year}/${month}/${day}/jpg/${item.image}.jpg`;

      return `
        <article class="epic-card">
          <img loading="lazy" src="${imageUrl}" alt="EPIC image of Earth taken ${item.date}" />
          <div class="epic-meta">
            <div class="epic-date"><strong>${item.date}</strong></div>
            <div class="epic-caption">${escapeHtml(item.caption || "No caption")}</div>
          </div>
        </article>
      `;
    }).join("");

    result.innerHTML = `
      <section class="epic-gallery">
        ${cards}
      </section>
    `;

  } catch (err) {
    result.innerHTML = `<div class="epic-error">Error loading EPIC: ${err.message}</div>`;
    console.error(err);
  }
}

function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
