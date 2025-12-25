const API_URL = "http://localhost:5000/api/contests";
let allContests = [];
let currentFilter = "All";
let pendingRegistration = null;

// Request notification permission
if (Notification.permission !== "granted") {
  Notification.requestPermission();
}

// Fetch contests
async function fetchContests() {
  try {
    const res = await fetch(API_URL);
    allContests = await res.json();
    displayContests();
  } catch (err) {
    console.error(err);
    document.getElementById("contests").innerText = "❌ Backend error";
  }
}

// Display contests
function displayContests() {
  const container = document.getElementById("contests");
  container.innerHTML = "";

  const now = new Date();
  let filtered = allContests.filter(c => currentFilter === "All" || c.platform === currentFilter);

  // Sort by start time
  filtered.sort((a, b) => new Date(a.start) - new Date(b.start));

  if (!filtered.length) {
    container.innerHTML = "<p class='no-contests'>No upcoming contests.</p>";
    return;
  }

  filtered.forEach(c => {
    const start = new Date(c.start);
    const diffMs = start - now;

    // 1-hour notification
    if (diffMs > 0 && diffMs <= 3600 * 1000) {
      new Notification(`Contest starting soon: ${c.event}`, {
        body: `Platform: ${c.platform} | Starts at: ${start.toLocaleString()}`,
      });
    }

    // Check if user already registered (localStorage)
    const registered = localStorage.getItem(`contest_${c.id}`) === "yes";
    const notRegistered = localStorage.getItem(`contest_${c.id}`) === "no";

    const card = document.createElement("div");
    card.className = "contest-card";

    card.innerHTML = `
      <div class="contest-header">
        <span class="contest-platform">${c.platform}</span>
        <span class="contest-status ${registered ? "status-registered" : notRegistered ? "status-not-registered" : "status-upcoming"}">
          ${registered ? "Registered ✅" : notRegistered ? "Not Registered ❌" : "Upcoming"}
        </span>
      </div>
      <div class="contest-name">${c.event}</div>
      <div class="contest-details">
        <div class="detail-row"><span class="detail-icon">🕒</span>${start.toLocaleString()}</div>
        <div class="detail-row">
          <span class="detail-icon">🌐</span>
          <a href="${c.href}" target="_blank" class="register-link">Register</a>
        </div>
      </div>
    `;

    // Register click
    card.querySelector(".register-link").addEventListener("click", async e => {
      e.preventDefault();
      pendingRegistration = c.id;
      window.open(c.href, "_blank"); // open contest site
    });

    container.appendChild(card);
  });
}

// Filter buttons
document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.platform;
    displayContests();
  });
});

// Theme toggle
document.getElementById("theme-toggle").addEventListener("click", () => {
  document.body.classList.toggle("light");
});

// Window focus listener for registration confirmation
window.addEventListener('focus', () => {
  if (pendingRegistration) {
    const confirmed = confirm(`Apne contest me register kar liya hai?`);
    if (confirmed) {
      localStorage.setItem(`contest_${pendingRegistration}`, "yes");
    } else {
      localStorage.setItem(`contest_${pendingRegistration}`, "no");
    }
    pendingRegistration = null;
    displayContests(); // update UI
  }
});

// Initial fetch & auto-refresh
fetchContests();
setInterval(fetchContests, 5 * 60 * 1000);
