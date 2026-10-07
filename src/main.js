import { animate, inView, scroll, stagger } from "motion";

const root = document.documentElement;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
const EASE = [0.22, 1, 0.36, 1];

if (reduce) root.classList.add("reduce-motion");

/* ---------- Header --------------------------------------------------
   Transparent over the hero, solid once scrolled, hides on scroll down and
   returns on scroll up. Open menus keep it solid and visible. */
const header = $(".header");
let menuOpen = false;
let megaOpen = false;
const syncHeader = () => header.classList.toggle("is-solid", menuOpen || megaOpen);

let lastY = window.scrollY;
let ticking = false;
const onScroll = () => {
  const y = window.scrollY;
  const delta = y - lastY;
  header.classList.toggle("is-scrolled", y > 8);
  if (menuOpen || megaOpen || y <= 120) {
    header.classList.remove("is-hidden");
  } else if (delta > 6) {
    header.classList.add("is-hidden");
  } else if (delta < -6) {
    header.classList.remove("is-hidden");
  }
  if (Math.abs(delta) > 6 || y <= 120) lastY = y;
  ticking = false;
};
onScroll();
addEventListener(
  "scroll",
  () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  },
  { passive: true }
);
// keyboard users: never leave focus inside a hidden header
header.addEventListener("focusin", () => header.classList.remove("is-hidden"));

/* Practices mega menu (desktop) */
const ddBtn = $("[data-dropdown-btn]");
const ddMenu = $("[data-dropdown-menu]");
if (ddBtn && ddMenu) {
  const item = ddBtn.closest(".nav__item");
  let timer;
  const setOpen = (open) => {
    megaOpen = open;
    ddBtn.setAttribute("aria-expanded", String(open));
    ddMenu.classList.toggle("is-open", open);
    syncHeader();
  };
  ddBtn.addEventListener("click", () =>
    setOpen(ddBtn.getAttribute("aria-expanded") !== "true")
  );
  if (finePointer) {
    item.addEventListener("mouseenter", () => {
      clearTimeout(timer);
      setOpen(true);
    });
    item.addEventListener("mouseleave", () => {
      timer = setTimeout(() => setOpen(false), 140);
    });
  }
  item.addEventListener("focusout", (e) => {
    if (!item.contains(e.relatedTarget)) setOpen(false);
  });
  addEventListener("keydown", (e) => {
    if (e.key === "Escape" && megaOpen) {
      setOpen(false);
      ddBtn.focus();
    }
  });
  addEventListener("click", (e) => {
    if (!item.contains(e.target)) setOpen(false);
  });
  ddMenu.addEventListener("click", (e) => {
    if (e.target.closest("a")) setOpen(false);
  });
}

/* Mobile menu */
const toggle = $("[data-menu-toggle]");
const menu = $("#mobile-menu");
if (toggle && menu) {
  const setMenu = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.classList.toggle("is-open", open);
    menu.toggleAttribute("inert", !open);
    root.style.overflow = open ? "hidden" : "";
    menuOpen = open;
    syncHeader();
    if (open) header.classList.remove("is-hidden");
  };
  setMenu(false);
  toggle.addEventListener("click", () =>
    setMenu(toggle.getAttribute("aria-expanded") !== "true")
  );
  menu.addEventListener("click", (e) => {
    if (e.target.closest("a")) setMenu(false);
  });
  addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menu.classList.contains("is-open")) {
      setMenu(false);
      toggle.focus();
    }
  });
  matchMedia("(min-width: 1024px)").addEventListener("change", (e) => {
    if (e.matches) setMenu(false);
  });
}

/* ---------- Hero ---------------------------------------------------- */
const h1 = $("[data-split]");
if (h1) {
  // Split into words (kept whole so lines never break mid-word) and characters.
  const text = h1.textContent.trim();
  h1.setAttribute("aria-label", text);
  h1.textContent = "";
  text.split(/\s+/).forEach((word, i, all) => {
    const w = document.createElement("span");
    w.className = i === 2 || i === 3 ? "w w--accent" : "w";
    w.setAttribute("aria-hidden", "true");
    [...word].forEach((ch) => {
      const c = document.createElement("span");
      c.className = "wi";
      c.textContent = ch;
      w.append(c);
    });
    h1.append(w);
    if (i < all.length - 1) h1.append(" ");
  });
}

if (!reduce) {
  const media = $("[data-hero-media]");
  const layer = $(".hero__layer");
  if (media) {
    animate(media, { opacity: [0, 1] }, { duration: 1.1, ease: EASE });
    if (layer) animate(layer, { transform: ["scale(1.12)", "scale(1)"] }, { duration: 1.8, ease: EASE });
  }
  if (h1) {
    animate(
      $$(".wi", h1),
      {
        opacity: [0, 1],
        transform: ["translate3d(-0.1em, 105%, 0)", "translate3d(0, 0%, 0)"],
      },
      { duration: 0.9, delay: stagger(0.024, { startDelay: 0.3 }), ease: EASE }
    );
  }
  $$("[data-hero]").forEach((el) => {
    animate(
      el,
      { opacity: [0, 1], transform: ["translateY(20px)", "translateY(0px)"] },
      { duration: 0.9, delay: Number(el.dataset.hero || 0), ease: EASE }
    );
  });
}

/* ---------- Section headings: word rise ----------------------------- */
const splitWords = (el) => {
  const text = el.textContent.trim();
  // keep inline accents (e.g. <span class="join__accent">) on their words
  const tokens = [];
  el.childNodes.forEach((n) => {
    const cls = n.nodeType === 1 ? n.className : "";
    n.textContent.split(/\s+/).filter(Boolean).forEach((w) => tokens.push({ w, cls }));
  });
  el.setAttribute("aria-label", text);
  el.textContent = "";
  tokens.forEach(({ w: word, cls }, i, all) => {
    const w = document.createElement("span");
    w.className = "w";
    w.setAttribute("aria-hidden", "true");
    const c = document.createElement("span");
    c.className = ("wi " + cls).trim();
    c.textContent = word;
    w.append(c);
    el.append(w);
    if (i < all.length - 1) el.append(" ");
  });
};
const headings = $$(".h2, .about__title").filter((el) => !el.closest(".hero"));
headings.forEach((el) => {
  el.removeAttribute("data-reveal"); // headings use the word reveal instead
  splitWords(el);
  el.setAttribute("data-words", "");
});

/* ---------- Scroll reveal ------------------------------------------ */
$$("[data-stagger]").forEach((group) => {
  [...group.children].forEach((child, i) => {
    child.setAttribute("data-reveal", "");
    child.dataset.delay = String(Math.min(i, 8) * 0.07);
  });
});

if (!reduce) {
  $$("[data-reveal]").forEach((el) => {
    inView(
      el,
      () => {
        animate(
          el,
          { opacity: [0, 1], transform: ["translateY(24px)", "translateY(0px)"] },
          { duration: 0.8, delay: Number(el.dataset.delay || 0), ease: EASE }
        );
      },
      { amount: 0.15 }
    );
  });
}

/* ---------- Parallax ------------------------------------------------ */
if (!reduce) {
  $$("[data-parallax]").forEach((img) => {
    const axis = img.dataset.parallax === "x" ? "translateX" : "translateY";
    const range = axis === "translateX" ? 5 : 4;
    scroll(
      animate(img, { transform: [`${axis}(-${range}%)`, `${axis}(${range}%)`] }, { ease: "linear" }),
      { target: img.parentElement, offset: ["start end", "end start"] }
    );
  });
}

/* ---------- Count up ------------------------------------------------ */
// Hero stats wait for the entrance sequence, so the count is actually seen.
$$("[data-count]").forEach((el) => {
  const target = Number(el.dataset.count);
  const fmt = (v) => Math.round(v).toLocaleString("en-US");
  if (reduce) return;
  const final = fmt(target);
  // reserve the final width so digits growing never shift the layout
  el.style.display = "inline-block";
  el.textContent = final;
  el.style.minWidth = `${el.getBoundingClientRect().width}px`;
  el.style.textAlign = "left";
  el.textContent = fmt(0);
  const inHero = !!el.closest(".hero");
  inView(
    el,
    () => {
      setTimeout(() => animate(0, target, {
        duration: 2.2,
        ease: [0.16, 1, 0.3, 1],
        onUpdate: (v) => (el.textContent = fmt(v)),
        onComplete: () => {
          el.textContent = final;
          // small pop on the number when it lands
          const num = el.closest(".stats__num");
          if (num) animate(num, { transform: ["scale(1)", "scale(1.08)", "scale(1)"] }, { duration: 0.5, ease: EASE });
        },
      }), inHero ? 1550 : 100);
    },
    { amount: 0.6 }
  );
});

/* ---------- Practices preview -------------------------------------- */
const rows = $$("[data-practice]");
const previews = $$(".practices__preview img");
const caption = $("[data-preview-caption]");
if (rows.length && previews.length) {
  const activate = (i) => {
    rows.forEach((r, n) => r.classList.toggle("is-active", n === i));
    previews.forEach((p, n) => p.classList.toggle("is-active", n === i));
    if (caption) {
      caption.querySelector("small").textContent = String(i + 1).padStart(2, "0");
      caption.querySelector("span").textContent = rows[i].dataset.title;
    }
  };
  rows.forEach((row, i) => {
    row.addEventListener("mouseenter", () => activate(i));
    row.addEventListener("focusin", () => activate(i));
  });
  activate(0);
}

/* ---------- Industries: list drives the image stage ----------------- */
const indItems = $$("[data-ind]");
const indSlides = $$("[data-ind-slide]");
if (indItems.length) {
  const show = (i) => {
    indItems.forEach((x, n) => x.setAttribute("aria-pressed", String(n === i)));
    indSlides.forEach((x, n) => x.classList.toggle("is-active", n === i));
  };
  indItems.forEach((btn, i) => {
    btn.addEventListener("click", () => show(i));
    btn.addEventListener("focus", () => show(i));
    if (finePointer) btn.addEventListener("mouseenter", () => show(i));
  });
  show(0);
}

/* ---------- Carousels (gallery, testimonials) ---------------------- */
$$("[data-carousel]").forEach((wrap) => {
  const track = $("[data-track]", wrap);
  const prev = $("[data-prev]", wrap);
  const next = $("[data-next]", wrap);
  if (!track || !prev || !next) return;
  const step = () => {
    const first = track.firstElementChild;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    return first.getBoundingClientRect().width + gap;
  };
  const update = () => {
    const max = track.scrollWidth - track.clientWidth - 2;
    prev.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft >= max;
  };
  const go = (dir) =>
    track.scrollBy({ left: dir * step(), behavior: reduce ? "auto" : "smooth" });
  prev.addEventListener("click", () => go(-1));
  next.addEventListener("click", () => go(1));
  track.addEventListener("scroll", update, { passive: true });
  addEventListener("resize", update);
  update();
});

/* ---------- More scroll motion --------------------------------------- */
if (!reduce) {
  // heading words rise in sequence
  $$("[data-words]").forEach((el) => {
    inView(
      el,
      () => {
        animate(
          $$(".wi", el),
          { transform: ["translateY(105%)", "translateY(0%)"] },
          { duration: 0.85, delay: stagger(0.06), ease: EASE }
        );
      },
      { amount: 0.5 }
    );
  });

  // eyebrow rules draw themselves
  $$(".eyebrow").forEach((el) => inView(el, () => el.classList.add("is-in"), { amount: 1 }));

  // images wipe open with a settling zoom
  $$(".about__img, .join__img").forEach((box) => {
    const img = $("img", box);
    // observe the parent: IntersectionObserver ignores a fully clipped target
    inView(
      box.parentElement,
      () => {
        animate(box, { clipPath: ["inset(0 0 100% 0)", "inset(0 0 0% 0)"] }, { duration: 1.1, ease: EASE }).finished.then(
          () => (box.style.clipPath = "none")
        );
        if (img && !box.matches(".join__img")) {
          animate(img, { scale: [1.18, 1] }, { duration: 1.6, ease: EASE });
        }
      },
      { amount: 0.3 }
    );
  });

  // carousels: cards slide in once the row is visible
  $$("[data-track]").forEach((track) => {
    const cards = [...track.children];
    cards.forEach((c) => (c.style.opacity = "0"));
    inView(
      track,
      () => {
        animate(
          cards,
          { opacity: [0, 1], transform: ["translateX(48px)", "translateX(0px)"] },
          { duration: 0.9, delay: stagger(0.09), ease: EASE }
        );
      },
      { amount: 0.2 }
    );
  });

  // closing band: waves rise as it scrolls into view
  const waves = $(".connect__waves");
  const connect = $(".connect");
  if (waves && connect) {
    scroll(animate(waves, { transform: ["translateY(60px)", "translateY(0px)"], opacity: [0.2, 0.9] }, { ease: "linear" }), {
      target: connect,
      offset: ["start end", "center end"],
    });
  }

  // thin reading-progress line along the header edge
  const bar = document.createElement("div");
  bar.className = "header__progress";
  bar.setAttribute("aria-hidden", "true");
  header.append(bar);
  scroll(animate(bar, { transform: ["scaleX(0)", "scaleX(1)"] }, { ease: "linear" }));

  // join photo drifts inside its frame
  const joinImg = $(".join__img img");
  if (joinImg) {
    scroll(animate(joinImg, { transform: ["translateY(-4%)", "translateY(4%)"] }, { ease: "linear" }), {
      target: joinImg.parentElement,
      offset: ["start end", "end start"],
    });
  }
}

/* ---------- Watermark drift ------------------------------------------ */
if (!reduce) {
  $$(".wm").forEach((wm) => {
    const host = wm.parentElement;
    scroll(
      animate(wm, { transform: ["translateX(-3%)", "translateX(3%)"] }, { ease: "linear" }),
      { target: host, offset: ["start end", "end start"] }
    );
  });
}

/* ---------- Hero video: respect motion/data preferences, pause offscreen */
const heroVideo = $(".hero__video");
if (heroVideo) {
  const saveData = navigator.connection && navigator.connection.saveData;
  if (reduce || saveData) {
    heroVideo.removeAttribute("autoplay");
    heroVideo.pause();
  } else {
    inView(heroVideo.closest(".hero"), () => {
      heroVideo.play().catch(() => {});
      return () => heroVideo.pause();
    }, { amount: 0.05 });
  }
}

/* ---------- Footer link groups: accordion on mobile, open on desktop ---- */
const folds = $$(".fold");
if (folds.length) {
  const desktop = matchMedia("(min-width: 768px)");
  const apply = () => folds.forEach((d) => (d.open = desktop.matches));
  apply();
  desktop.addEventListener("change", apply);
  // keep them open on desktop even if toggled by keyboard
  folds.forEach((d) =>
    d.addEventListener("toggle", () => {
      if (desktop.matches && !d.open) d.open = true;
    })
  );
}

/* ---------- Success stories: tabs + autoplay with progress ------------ */
const storyRoot = $("[data-stories]");
if (storyRoot) {
  const slides = $$("[data-story-slide]", storyRoot);
  const tabs = $$("[data-story-tab]", storyRoot);
  const DURATION = 8000;
  let index = 0;
  let start = 0;
  let paused = false;
  let visible = false;

  const show = (i) => {
    index = (i + slides.length) % slides.length;
    slides.forEach((s, n) => s.classList.toggle("is-active", n === index));
    tabs.forEach((t, n) => {
      t.classList.toggle("is-active", n === index);
      t.setAttribute("aria-pressed", String(n === index));
      t.style.setProperty("--p", "0");
    });
    start = performance.now();
  };
  const tick = (now) => {
    if (!paused && visible) {
      const p = Math.min((now - start) / DURATION, 1);
      tabs[index].style.setProperty("--p", p.toFixed(3));
      if (p >= 1) show(index + 1);
    } else {
      // freeze: shift the clock so progress resumes where it stopped
      start = now - parseFloat(tabs[index].style.getPropertyValue("--p") || 0) * DURATION;
    }
    requestAnimationFrame(tick);
  };

  tabs.forEach((t, i) => t.addEventListener("click", () => show(i)));
  $("[data-story-prev]", storyRoot).addEventListener("click", () => show(index - 1));
  $("[data-story-next]", storyRoot).addEventListener("click", () => show(index + 1));
  show(0);

  if (!reduce) {
    storyRoot.addEventListener("pointerenter", () => (paused = true));
    storyRoot.addEventListener("pointerleave", () => (paused = false));
    storyRoot.addEventListener("focusin", () => (paused = true));
    storyRoot.addEventListener("focusout", () => (paused = false));
    new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
      },
      { threshold: 0.3 }
    ).observe(storyRoot);
    requestAnimationFrame(tick);
  }
}

/* ---------- Blog slider: infinite loop, arrows, dots, autoplay ---------- */
const blogRoot = $("[data-blogs]");
if (blogRoot) {
  const track = $("[data-blog-track]", blogRoot);
  const prev = $("[data-blog-prev]", blogRoot);
  const next = $("[data-blog-next]", blogRoot);
  const dots = $$("[data-blog-dot]", blogRoot);
  const real = [...track.children];
  const N = real.length;

  // clone the set before and after so the track can loop forever
  const clone = (el) => {
    const c = el.cloneNode(true);
    c.setAttribute("aria-hidden", "true");
    $$("img", c).forEach((im) => (im.loading = "eager"));
    $$("a, button", c).forEach((x) => x.setAttribute("tabindex", "-1"));
    return c;
  };
  real.slice().reverse().forEach((el) => track.insertBefore(clone(el), track.firstChild));
  real.forEach((el) => track.append(clone(el)));
  const all = [...track.children];

  const posOf = (i) => all[i].offsetLeft - all[0].offsetLeft;
  const setWidth = () => posOf(2 * N) - posOf(N);
  const snapOff = parseFloat(getComputedStyle(track).scrollPaddingInline || 0);
  const x = (i) => posOf(i) - snapOff;

  const jump = (left) => {
    track.style.scrollSnapType = "none";
    track.scrollLeft = left;
    // re-enable snap after the jump has been applied
    requestAnimationFrame(() => (track.style.scrollSnapType = ""));
  };
  const center = () => jump(x(N));
  const logical = () => {
    let best = 0;
    for (let i = 0; i < all.length; i++) {
      if (Math.abs(x(i) - track.scrollLeft) < Math.abs(x(best) - track.scrollLeft)) best = i;
    }
    return ((best % N) + N) % N;
  };
  const update = () => {
    const c = logical();
    dots.forEach((d, i) => {
      d.classList.toggle("is-active", i === c);
      d.setAttribute("aria-current", String(i === c));
    });
  };
  // silently wrap when the user scrolls into a clone set
  const wrap = () => {
    const w = setWidth();
    if (track.scrollLeft < x(N) - w / 2) jump(track.scrollLeft + w);
    else if (track.scrollLeft > x(N) + w + w / 2 - 1) jump(track.scrollLeft - w);
    else if (track.scrollLeft >= x(2 * N) - 1) jump(track.scrollLeft - w);
    else if (track.scrollLeft <= x(0) + 1) jump(track.scrollLeft + w);
  };

  const step = (dir) => {
    const here = logical();
    // find the cloned/real index nearest the current position, then move by one
    let idx = 0;
    for (let i = 0; i < all.length; i++) {
      if (Math.abs(x(i) - track.scrollLeft) < Math.abs(x(idx) - track.scrollLeft)) idx = i;
    }
    const target = Math.max(0, Math.min(all.length - 1, idx + dir));
    track.scrollTo({ left: x(target), behavior: reduce ? "auto" : "smooth" });
    return here;
  };

  let timer = 0;
  let hold = false;
  const AUTO_MS = 4500;
  const startAuto = () => {
    clearInterval(timer);
    if (reduce) return;
    timer = setInterval(() => {
      if (!hold && !document.hidden) step(1);
    }, AUTO_MS);
  };

  prev.addEventListener("click", () => { step(-1); startAuto(); });
  next.addEventListener("click", () => { step(1); startAuto(); });
  dots.forEach((d, i) =>
    d.addEventListener("click", () => {
      track.scrollTo({ left: x(N + i), behavior: reduce ? "auto" : "smooth" });
      startAuto();
    })
  );
  let ticking = false;
  track.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        wrap();
        update();
        ticking = false;
      });
    },
    { passive: true }
  );
  ["pointerenter", "focusin", "touchstart"].forEach((e) => blogRoot.addEventListener(e, () => (hold = true), { passive: true }));
  ["pointerleave", "focusout", "touchend"].forEach((e) => blogRoot.addEventListener(e, () => (hold = false), { passive: true }));
  new IntersectionObserver(([e]) => { if (!e.isIntersecting) hold = true; else hold = false; }, { threshold: 0.3 }).observe(blogRoot);
  addEventListener("resize", center);
  // wait for layout, then start on the first real card
  requestAnimationFrame(() => { center(); update(); });
  startAuto();
}
