(function () {
  const fiverrUrl =
    typeof window.__FIVERR_PROFILE_URL__ === "string"
      ? window.__FIVERR_PROFILE_URL__
      : "https://www.fiverr.com/sk8ingg";

  const cta = document.getElementById("fiverrCta");
  if (cta) {
    cta.href = fiverrUrl;
  }

  const menuBtn = document.getElementById("menuBtn");
  const contactDock = document.getElementById("contactDock");
  const sheetBackdrop = document.getElementById("sheetBackdrop");
  const MQ_MOBILE = window.matchMedia("(max-width: 768px)");

  function isMobileNav() {
    return MQ_MOBILE.matches;
  }

  function setContactSheetOpen(open) {
    if (!contactDock || !menuBtn || !sheetBackdrop) return;
    contactDock.classList.toggle("is-open", open);
    menuBtn.classList.toggle("is-open", open);
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    sheetBackdrop.hidden = !open;
    sheetBackdrop.setAttribute("aria-hidden", open ? "false" : "true");
    document.body.classList.toggle("is-sheet-open", open);
  }

  if (menuBtn && contactDock && sheetBackdrop) {
    menuBtn.addEventListener("click", () => {
      const open = !contactDock.classList.contains("is-open");
      setContactSheetOpen(open);
    });
    sheetBackdrop.addEventListener("click", () => setContactSheetOpen(false));
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (contactDock.classList.contains("is-open") && isMobileNav()) {
        e.preventDefault();
        setContactSheetOpen(false);
      }
    });
    MQ_MOBILE.addEventListener("change", () => {
      if (!isMobileNav()) setContactSheetOpen(false);
    });
  }

  const imgEl = document.getElementById("workImg");
  const titleEl = document.getElementById("workTitle");
  const tagsEl = document.getElementById("workTags");
  const noteEl = document.getElementById("workNote");
  const curIdxEl = document.getElementById("curIdx");
  const totalEl = document.getElementById("total");
  const rail = document.getElementById("thumbRail");
  const prevBtn = document.querySelector(".navbtn--prev");
  const nextBtn = document.querySelector(".navbtn--next");

  let works = [];
  let index = 0;
  let touchStartX = null;

  async function loadWorks() {
    const tryFetch = async (url) => {
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) throw new Error(String(r.status));
      return r.json();
    };
    try {
      works = await tryFetch("/api/works");
    } catch {
      works = await tryFetch("data/works.json");
    }
    if (!Array.isArray(works) || works.length === 0) {
      works = [
        {
          id: "placeholder",
          title: "Add works",
          styles: ["edit data/works.json"],
          image: "",
          note: "Drop images into static/images and list them in works.json.",
        },
      ];
    }
    totalEl.textContent = String(works.length);
    buildThumbs();
    goTo(0, false);
  }

  function buildThumbs() {
    rail.innerHTML = "";
    works.forEach((w, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", `Show work ${i + 1}: ${w.title || "work"}`);
      b.dataset.index = String(i);
      const thumb = document.createElement("img");
      thumb.src = w.image || "";
      thumb.alt = "";
      thumb.width = 72;
      thumb.height = 72;
      thumb.loading = "lazy";
      b.appendChild(thumb);
      b.addEventListener("click", () => goTo(i));
      rail.appendChild(b);
    });
  }

  function updateRailActive() {
    rail.querySelectorAll("button").forEach((btn, i) => {
      btn.classList.toggle("is-active", i === index);
    });
  }

  function goTo(i, animate = true) {
    const n = works.length;
    if (n === 0) return;
    index = ((i % n) + n) % n;
    const w = works[index];

    curIdxEl.textContent = String(index + 1);

    titleEl.textContent = w.title || "Untitled";
    noteEl.textContent = w.note || "";

    tagsEl.innerHTML = "";
    (w.styles || []).forEach((s) => {
      const li = document.createElement("li");
      li.textContent = s;
      tagsEl.appendChild(li);
    });

    const src = w.image || "";
    imgEl.alt = w.title ? `${w.title} — outfit concept` : "Outfit concept";

    if (!animate) {
      imgEl.classList.remove("is-ready");
      imgEl.src = src;
      void imgEl.offsetWidth;
      imgEl.classList.add("is-ready");
    } else {
      imgEl.classList.remove("is-ready");
      const onDone = () => {
        imgEl.removeEventListener("load", onDone);
        imgEl.removeEventListener("error", onDone);
        requestAnimationFrame(() => imgEl.classList.add("is-ready"));
      };
      imgEl.addEventListener("load", onDone, { once: true });
      imgEl.addEventListener("error", onDone, { once: true });
      imgEl.src = src;
    }

    updateRailActive();
    prefetchNeighbors();
  }

  function prefetchNeighbors() {
    const n = works.length;
    if (n < 2) return;
    const next = works[(index + 1) % n];
    const prev = works[(index - 1 + n) % n];
    [next, prev].forEach((w) => {
      if (!w || !w.image) return;
      const im = new Image();
      im.src = w.image;
    });
  }

  prevBtn.addEventListener("click", () => goTo(index - 1));
  nextBtn.addEventListener("click", () => goTo(index + 1));

  document.addEventListener("keydown", (e) => {
    if (contactDock && contactDock.classList.contains("is-open") && isMobileNav()) {
      return;
    }
    if (e.key === "ArrowLeft") goTo(index - 1);
    if (e.key === "ArrowRight") goTo(index + 1);
  });

  const stage = document.querySelector(".stage");
  stage.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.changedTouches[0].screenX;
    },
    { passive: true }
  );
  stage.addEventListener(
    "touchend",
    (e) => {
      if (touchStartX === null) return;
      const dx = e.changedTouches[0].screenX - touchStartX;
      touchStartX = null;
      if (Math.abs(dx) < 48) return;
      if (dx < 0) goTo(index + 1);
      else goTo(index - 1);
    },
    { passive: true }
  );

  loadWorks().catch(() => {
    totalEl.textContent = "0";
    titleEl.textContent = "Could not load works";
    noteEl.textContent = "Run the Python server or open via a static host with data/works.json available.";
  });
})();
