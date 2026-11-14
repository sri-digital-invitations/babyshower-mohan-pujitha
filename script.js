// Configure these with your invitation's Supabase project details.
// Use the Project URL and publishable (anon) key only. Never put a service_role key here.
const SUPABASE_URL = "https://bedystobmjhluvdvqenx.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_p5Ff4b5_aaKkAT5G1v59xA_NgNHAyWQ";

const eventDate = new Date("2026-11-19T18:00:00+05:30");
const $ = (id) => document.getElementById(id);
const pad = (n) => String(n).padStart(2, "0");

function updateCountdown() {
  const diff = eventDate.getTime() - Date.now();
  if (diff <= 0) {
    ["days", "hours", "minutes", "seconds"].forEach(id => $(id).textContent = "00");
    return;
  }
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  $("days").textContent = days;
  $("hours").textContent = pad(hours);
  $("minutes").textContent = pad(minutes);
  $("seconds").textContent = pad(seconds);
}
updateCountdown();
setInterval(updateCountdown, 1000);

let language = "en";
$("languageToggle").addEventListener("click", () => {
  language = language === "en" ? "ta" : "en";
  document.documentElement.lang = language;
  document.querySelectorAll("[data-en][data-ta]").forEach(el => {
    el.innerHTML = el.dataset[language];
  });
  document.querySelectorAll("[data-placeholder-en][data-placeholder-ta]").forEach(el => {
    el.placeholder = el.dataset[language === "en" ? "placeholderEn" : "placeholderTa"];
  });
  $("languageToggle").textContent = language === "en" ? "தமிழ்" : "English";
});

const attendingInputs = document.querySelectorAll('input[name="attending"]');
const guestCountWrap = $("guestCountWrap");
const guestCountInput = $("guestCount");
attendingInputs.forEach(input => input.addEventListener("change", () => {
  const attending = document.querySelector('input[name="attending"]:checked')?.value === "true";
  guestCountWrap.hidden = !attending;
  guestCountInput.required = attending;
  if (!attending) guestCountInput.value = "0";
  else if (Number(guestCountInput.value) < 1) guestCountInput.value = "1";
}));

function setRsvpStatus(message, isError = false) {
  const status = $("rsvpStatus");
  status.textContent = message;
  status.classList.toggle("error", isError);
}

$("rsvpForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  setRsvpStatus("");

  if (!SUPABASE_URL.startsWith("https://") || SUPABASE_ANON_KEY.includes("YOUR_SUPABASE")) {
    setRsvpStatus(language === "en"
      ? "The RSVP form is not configured yet. Please contact the hosts."
      : "RSVP வசதி இன்னும் அமைக்கப்படவில்லை. அழைப்பாளர்களைத் தொடர்பு கொள்ளவும்.", true);
    return;
  }

  const guestName = $("guestName").value.trim();
  const selectedAttendance = document.querySelector('input[name="attending"]:checked');
  if (!guestName || !selectedAttendance) {
    setRsvpStatus(language === "en" ? "Please enter your name and select your response." : "உங்கள் பெயரையும் வருகை பதிலையும் தெரிவிக்கவும்.", true);
    return;
  }

  const attending = selectedAttendance.value === "true";
  const guestCount = attending ? Number(guestCountInput.value) : 0;
  if (attending && (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 30)) {
    setRsvpStatus(language === "en" ? "Please enter a guest count between 1 and 30." : "1 முதல் 30 வரையிலான எண்ணிக்கையை உள்ளிடவும்.", true);
    return;
  }

  const submitButton = $("rsvpSubmit");
  submitButton.disabled = true;
  submitButton.textContent = language === "en" ? "Submitting…" : "அனுப்பப்படுகிறது…";

  try {
    const response = await fetch(`${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/rpc/submit_guest_rsvp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        p_guest_name: guestName,
        p_attending: attending,
        p_guest_count: guestCount
      })
    });

    if (!response.ok) {
      let detail = "";
      try { const body = await response.json(); detail = body.message || body.details || ""; } catch (_) {}
      throw new Error(detail || `Request failed (${response.status})`);
    }

    $("rsvpForm").reset();
    guestCountWrap.hidden = true;
    guestCountInput.required = false;
    guestCountInput.value = "1";
    setRsvpStatus(language === "en"
      ? "Thank you! Your RSVP has been recorded successfully."
      : "நன்றி! உங்கள் வருகை பதில் வெற்றிகரமாகப் பதிவு செய்யப்பட்டது.");
  } catch (error) {
    console.error("RSVP submission failed:", error);
    setRsvpStatus(language === "en"
      ? "We couldn't submit your RSVP. Please check your connection and try again."
      : "உங்கள் பதிலைப் பதிவு செய்ய முடியவில்லை. இணைய இணைப்பைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.", true);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = language === "en" ? "Submit RSVP" : "வருகையை உறுதிப்படுத்தவும்";
  }
});

$("shareBtn").addEventListener("click", async () => {
  const shareData = {
    title: "Baby Shower — Mohan Sai & Pujitha",
    text: "A Little Miracle, A Lot of Love! Join Mohan Sai & Pujitha on 19 November 2026 at 6 PM.",
    url: window.location.href
  };
  if (navigator.share) {
    try { await navigator.share(shareData); } catch (e) {}
  } else if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(window.location.href);
      $("shareBtn").querySelector("[data-en], [data-ta]").textContent = language === "en" ? "Link copied!" : "இணைப்பு நகலெடுக்கப்பட்டது!";
    } catch (e) {
      window.prompt("Copy this invitation link:", window.location.href);
    }
  } else {
    window.prompt("Copy this invitation link:", window.location.href);
  }
});
