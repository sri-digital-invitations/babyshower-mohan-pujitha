const eventDate = new Date("2026-11-19T18:00:00+05:30");
const $ = (id) => document.getElementById(id);
const pad = (n) => String(n).padStart(2, "0");

function updateCountdown() {
  const diff = eventDate.getTime() - Date.now();
  if (diff <= 0) {
    ["days","hours","minutes","seconds"].forEach(id => $(id).textContent = "00");
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
  $("languageToggle").textContent = language === "en" ? "தமிழ்" : "English";
});

function sendRsvp(isAttending) {
  const message = language === "en"
    ? (isAttending
        ? "Hello Mohan Sai & Pujitha, I'll be attending your baby shower celebration on 19 November 2026 at 6 PM. With best wishes!"
        : "Hello Mohan Sai & Pujitha, I'm sorry I won't be able to attend your baby shower celebration on 19 November 2026. Sending my best wishes!")
    : (isAttending
        ? "வணக்கம் மோகன் சாய் & பூஜிதா, 19 நவம்பர் 2026 மாலை 6 மணிக்கு நடைபெறும் உங்கள் வளைகாப்பு விழாவில் நிச்சயமாகக் கலந்து கொள்கிறேன். மனமார்ந்த வாழ்த்துகள்!"
        : "வணக்கம் மோகன் சாய் & பூஜிதா, 19 நவம்பர் 2026 அன்று நடைபெறும் உங்கள் வளைகாப்பு விழாவில் என்னால் கலந்து கொள்ள இயலாது. என் அன்பான வாழ்த்துகள்!")
  window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener");
}
$("attendingBtn").addEventListener("click", () => sendRsvp(true));
$("unableBtn").addEventListener("click", () => sendRsvp(false));

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
