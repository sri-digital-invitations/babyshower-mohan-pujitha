
// Baby Shower Admin Dashboard

// Use your Supabase project URL and publishable key.
// Never put the service_role key or admin password in this file.

const SUPABASE_URL = "https://bedystobmjhluvdvqenx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_p5Ff4b5_aaKkAT5G1v59xA_NgNHAyWQ";
// Fixed admin password — visible in the public website source.
const ADMIN_PASSWORD = "MoPu@1234";

const $ = (id) => document.getElementById(id);

let adminPassword = ADMIN_PASSWORD;

let adminPassword = "";

let dashboardData = {
  rsvps: [],
  wishes: [],
  predictions: {
    girl_count: 0,
    boy_count: 0
  }
};

function setStatus(message, error = false) {
  $("dashboardStatus").textContent = message || "";
  $("dashboardStatus").classList.toggle("error", error);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

function dateLabel(value) {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short"
      });
}

// Call the secure Supabase Edge Function
async function callAdmin(action, extra = {}) {

  const response = await fetch(
    `${SUPABASE_URL.replace(/\/$/, "")}/functions/v1/${FUNCTION_NAME}`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_PUBLISHABLE_KEY,
        "Authorization": `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        "x-admin-password": adminPassword
      },

      body: JSON.stringify({
        action,
        ...extra
      })
    }
  );

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.error) {
    throw new Error(
      payload.error ||
      payload.message ||
      `Request failed (${response.status})`
    );
  }

  return payload;
}

// Login
// Automatically open the dashboard using the configured password.
async function initialiseDashboard() {
    $("loginPanel").hidden = true;
    $("dashboard").hidden = false;

    try {
        await loadDashboard();
    } catch (error) {
        setStatus(error.message || "Unable to load dashboard.", true);
    }
}

initialiseDashboard();



// Load dashboard data
async function loadDashboard() {

  setStatus("Refreshing dashboard…");

  const data = await callAdmin("dashboard");

  dashboardData = {
    rsvps: Array.isArray(data.rsvps) ? data.rsvps : [],
    wishes: Array.isArray(data.wishes) ? data.wishes : [],
    predictions: data.predictions || {
      girl_count: 0,
      boy_count: 0
    }
  };

  renderAll();

  setStatus(`Updated ${new Date().toLocaleTimeString("en-IN")}`);

}

// Refresh button
$("refreshBtn").addEventListener("click", async () => {

  $("refreshBtn").disabled = true;

  try {
    await loadDashboard();
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    $("refreshBtn").disabled = false;
  }

});

// Render dashboard
function renderAll() {

  const yes = dashboardData.rsvps.filter(
    r => r.attending === true
  );

  const no = dashboardData.rsvps.filter(
    r => r.attending === false
  );

  const headcount = yes.reduce(
    (sum, r) => sum + Number(r.guest_count || 0),
    0
  );

  const pending = dashboardData.wishes.filter(
    w => !w.approved
  ).length;

  $("metricConfirmed").textContent = headcount;
  $("metricResponses").textContent = dashboardData.rsvps.length;
  $("metricWishes").textContent = dashboardData.wishes.length;
  $("metricPending").textContent = pending;

  $("rsvpYes").textContent = yes.length;
  $("rsvpNo").textContent = no.length;
  $("rsvpHeadcount").textContent = headcount;

  renderRsvps();
  renderPredictions();
  renderWishes();

}

// RSVP table
function renderRsvps() {

  const query = $("rsvpSearch").value.trim().toLowerCase();
  const filter = $("rsvpFilter").value;

  const rows = dashboardData.rsvps.filter(r => {

    const matchName = String(r.guest_name || "")
      .toLowerCase()
      .includes(query);

    const matchStatus =
      filter === "all" ||
      (filter === "yes" ? r.attending : !r.attending);

    return matchName && matchStatus;

  });

  $("rsvpRows").innerHTML = rows.length
    ? rows.map(r => `
      <tr>
        <td>${escapeHtml(r.guest_name)}</td>

        <td>
          <span class="pill ${r.attending ? "yes" : "no"}">
            ${r.attending ? "Attending" : "Not attending"}
          </span>
        </td>

        <td>${Number(r.guest_count || 0)}</td>

        <td>${dateLabel(r.created_at)}</td>
      </tr>
    `).join("")
    : '<tr><td colspan="4" class="empty">No matching RSVP responses.</td></tr>';

}

// Prediction statistics
function renderPredictions() {

  const girl = Number(
    dashboardData.predictions.girl_count || 0
  );

  const boy = Number(
    dashboardData.predictions.boy_count || 0
  );

  const total = girl + boy;

  const girlPct = total
    ? Math.round(girl / total * 100)
    : 0;

  const boyPct = total
    ? 100 - girlPct
    : 0;

  $("girlCount").textContent = girl;
  $("boyCount").textContent = boy;

  $("girlPercent").textContent =
    `${girlPct}% of ${total} votes`;

  $("boyPercent").textContent =
    `${boyPct}% of ${total} votes`;

  $("girlBar").style.width = `${girlPct}%`;
  $("boyBar").style.width = `${boyPct}%`;

}

// Wishes
function wishStatus(w) {
  return w.approved ? "approved" : "pending";
}

function renderWishes() {

  const query = $("wishSearch").value.trim().toLowerCase();
  const filter = $("wishFilter").value;

  const wishes = dashboardData.wishes.filter(w => {

    const status = wishStatus(w);

    const matchesStatus =
      filter === "all" || status === filter;

    const text =
      `${w.guest_name || ""} ${w.message || ""}`.toLowerCase();

    return matchesStatus && text.includes(query);

  });

  $("wishList").innerHTML = wishes.length
    ? wishes.map(w => {

        const status = wishStatus(w);

        const actions = status === "pending"
          ? `
            <button
              class="button button-approve"
              data-wish-action="approve"
              data-id="${w.id}"
            >
              ✓ Approve
            </button>
          `
          : `
            <button
              class="button button-neutral"
              data-wish-action="unapprove"
              data-id="${w.id}"
            >
              Move back to pending
            </button>
          `;

        return `
          <article class="wish-card">

            <div class="wish-top">
              <span class="wish-name">
                ${escapeHtml(w.guest_name || "Guest")}
              </span>

              <span class="pill ${status}">
                ${escapeHtml(status)}
              </span>
            </div>

            <div class="wish-message">
              ${escapeHtml(w.message)}
            </div>

            <div class="wish-top">

              <span class="wish-date">
                ${dateLabel(w.created_at)}
              </span>

              <div class="wish-actions">
                ${actions}
              </div>

            </div>

          </article>
        `;

      }).join("")
    : '<p class="empty">No wishes in this view.</p>';

}

// Search and filters
["rsvpSearch", "rsvpFilter"].forEach(id => {
  $(id).addEventListener("input", renderRsvps);
});

["wishSearch", "wishFilter"].forEach(id => {
  $(id).addEventListener("input", renderWishes);
});

// Approve / move wish back to pending
$("wishList").addEventListener("click", async (event) => {

  const button = event.target.closest("[data-wish-action]");

  if (!button) return;

  const id = Number(button.dataset.id);

  const approved =
    button.dataset.wishAction === "approve";

  button.disabled = true;

  try {

    await callAdmin("review_wish", {
      id,
      approved
    });

    const wish = dashboardData.wishes.find(
      w => Number(w.id) === id
    );

    if (wish) {
      wish.approved = approved;
    }

    renderAll();

    setStatus(
      approved
        ? "Wish approved and now visible on the public wishes wall."
        : "Wish moved back to pending approval."
    );

  } catch (error) {

    button.disabled = false;
    setStatus(error.message, true);

  }

});

// CSV export
function downloadCsv(filename, rows) {

  if (!rows.length) {
    setStatus("There is no data to export.", true);
    return;
  }

  const csv = rows.map(row =>
    row.map(value =>
      `"${String(value ?? "").replace(/"/g, '""')}"`
    ).join(",")
  ).join("\r\n");

  const blob = new Blob(
    ["\uFEFF" + csv],
    { type: "text/csv;charset=utf-8" }
  );

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");

  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);

}

$("exportRsvps").addEventListener("click", () => {

  downloadCsv("baby-shower-rsvps.csv", [

    ["Guest name", "Attending", "Guest count", "Submitted at"],

    ...dashboardData.rsvps.map(r => [
      r.guest_name,
      r.attending ? "Yes" : "No",
      r.guest_count,
      r.created_at
    ])

  ]);

});

$("exportWishes").addEventListener("click", () => {

  downloadCsv("baby-shower-wishes.csv", [

    ["Guest name", "Message", "Review status", "Submitted at"],

    ...dashboardData.wishes.map(w => [
      w.guest_name,
      w.message,
      wishStatus(w),
      w.created_at
    ])

  ]);

});

// Tab navigation
document.querySelectorAll(".tab").forEach(button => {

  button.addEventListener("click", () => {

    document.querySelectorAll(".tab").forEach(tab => {
      tab.classList.toggle("active", tab === button);
    });

    ["rsvps", "predictions", "wishes"].forEach(name => {

      $("panel-" + name).hidden =
        name !== button.dataset.tab;

    });

  });

});
