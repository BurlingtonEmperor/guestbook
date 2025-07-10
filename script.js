const supabaseClient = supabase.createClient(
  'https://YOUR_PROJECT.supabase.co',
  'YOUR_PUBLIC_ANON_KEY'
);

const PAGE_SIZE = 10;
let currentPage = 0;

async function loadEntries(page = 0) {
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, error } = await supabaseClient
    .from("guestbook")
    .select("name, message, timestamp", { count: "exact" })
    .order("timestamp", { ascending: false })
    .range(from, to);

  if (error) {
    document.getElementById("entries").innerHTML = "Failed to load entries.";
    console.error(error);
    return;
  }

  const entries = data.map(entry => {
    const safeName = escapeHTML(entry.name);
    const safeMsg = escapeHTML(entry.message);
    const time = new Date(entry.timestamp).toLocaleString();

    return `
    <div class="entry">
      <div class="entry-name">${safeName}</div>
      <div class="entry-message">${safeMsg}</div>
      <time>${time}</time>
    </div>
    `;
  });

  document.getElementById("entries").innerHTML = entries.join("");

  // Update button state
  document.getElementById("prev-btn").disabled = page === 0;
  document.getElementById("next-btn").disabled = data.length < PAGE_SIZE;
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[tag]));
}

document.getElementById("prev-btn").addEventListener("click", () => {
  if (currentPage > 0) {
    currentPage--;
    loadEntries(currentPage);
  }
});

document.getElementById("next-btn").addEventListener("click", () => {
  currentPage++;
  loadEntries(currentPage);
});

document.getElementById("guestbook-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value.trim();
  const message = document.getElementById("message").value.trim();

  if (!name || !message) return alert("Please fill out both fields.");

  const { error } = await supabaseClient.from("guestbook").insert([
    { name, message, timestamp: new Date().toISOString() }
  ]);

  if (error) {
    alert("Failed to submit: " + error.message);
  } else {
    document.getElementById("guestbook-form").reset();
    currentPage = 0; // reset to first page
    loadEntries(currentPage);
  }
});

loadEntries();