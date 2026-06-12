const root = document.documentElement;
const toggle = document.querySelector(".theme-toggle");
const icon = document.querySelector(".theme-toggle-icon");

const savedTheme = localStorage.getItem("finalizer-theme");

function getSystemTheme() {
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function setTheme(theme) {
  root.setAttribute("data-theme", theme);
  localStorage.setItem("finalizer-theme", theme);

  if (icon) {
    icon.textContent = theme === "light" ? "☀" : "☾";
  }
}

setTheme(savedTheme || getSystemTheme());

if (toggle) {
  toggle.addEventListener("click", () => {
    const current = root.getAttribute("data-theme");
    setTheme(current === "light" ? "dark" : "light");
  });
}

// Smooth anchor navigation
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const targetId = link.getAttribute("href");
    if (!targetId || targetId === "#") return;

    const target = document.querySelector(targetId);
    if (!target) return;

    event.preventDefault();

    target.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });
});

function isScrollLockTargetReady(target) {
  const rect = target.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const visibleTop = Math.max(rect.top, 0);
  const visibleBottom = Math.min(rect.bottom, viewportHeight);
  const visibleHeight = Math.max(0, visibleBottom - visibleTop);
  const requiredHeight = Math.min(rect.height, viewportHeight) * 0.88;
  const targetCenter = (rect.top + rect.bottom) / 2;
  const viewportCenter = viewportHeight / 2;
  const centerOffset = Math.abs(targetCenter - viewportCenter);

  return visibleHeight >= requiredHeight && centerOffset < viewportHeight * 0.22;
}

// Screenshot carousels: scrolling inside the section advances screenshots first.
function setupCarousel(carousel) {
  const slides = Array.from(carousel.querySelectorAll("[data-slide]"));
  const dots = Array.from(carousel.querySelectorAll("[data-slide-to]"));
  const section = carousel.closest(".scene") || carousel;

  if (!slides.length || !dots.length) return;

  let activeIndex = 0;
  let wheelLocked = false;
  let touchStartY = null;

  function setActiveSlide(index) {
    const safeIndex = Math.max(0, Math.min(index, slides.length - 1));
    activeIndex = safeIndex;

    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("is-active", slideIndex === safeIndex);
    });

    dots.forEach((dot, dotIndex) => {
      const isActive = dotIndex === safeIndex;
      dot.classList.toggle("is-active", isActive);
      dot.setAttribute("aria-current", isActive ? "true" : "false");
    });
  }

  function canAdvance(direction) {
    if (direction > 0) return activeIndex < slides.length - 1;
    if (direction < 0) return activeIndex > 0;
    return false;
  }

  function advance(direction) {
    if (!canAdvance(direction)) return false;
    setActiveSlide(activeIndex + direction);
    return true;
  }

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      const index = Number.parseInt(dot.dataset.slideTo || "0", 10);
      setActiveSlide(index);
    });
  });

  section.addEventListener(
    "wheel",
    (event) => {
      if (!isScrollLockTargetReady(section) || !isScrollLockTargetReady(carousel)) return;

      const direction = Math.sign(event.deltaY);
      if (!direction || Math.abs(event.deltaY) < 12) return;

      if (!canAdvance(direction)) return;

      event.preventDefault();

      if (wheelLocked) return;
      wheelLocked = true;
      advance(direction);

      window.setTimeout(() => {
        wheelLocked = false;
      }, 520);
    },
    { passive: false }
  );

  section.addEventListener(
    "touchstart",
    (event) => {
      touchStartY = event.touches[0]?.clientY ?? null;
    },
    { passive: true }
  );

  section.addEventListener(
    "touchmove",
    (event) => {
      if (touchStartY === null) return;
      if (!isScrollLockTargetReady(section) || !isScrollLockTargetReady(carousel)) return;

      const currentY = event.touches[0]?.clientY ?? touchStartY;
      const deltaY = touchStartY - currentY;
      const direction = Math.sign(deltaY);

      if (!direction || Math.abs(deltaY) < 34) return;
      if (!canAdvance(direction)) return;

      event.preventDefault();

      if (wheelLocked) return;
      wheelLocked = true;
      advance(direction);
      touchStartY = currentY;

      window.setTimeout(() => {
        wheelLocked = false;
      }, 520);
    },
    { passive: false }
  );

  setActiveSlide(0);
}

document.querySelectorAll("[data-carousel]").forEach(setupCarousel);

// Scene reveal: softly replay section entry when scrolling down or back up.
(() => {
  const scenes = Array.from(document.querySelectorAll(".scene"));
  if (!scenes.length) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  scenes.forEach((scene) => {
    scene.classList.add("scene-reveal");
    if (reduceMotion) scene.classList.add("is-visible");
  });

  if (reduceMotion || !("IntersectionObserver" in window)) {
    scenes.forEach((scene) => scene.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle("is-visible", entry.isIntersecting);
      });
    },
    {
      root: null,
      threshold: 0.42,
      rootMargin: "-12% 0px -16% 0px"
    }
  );

  scenes.forEach((scene) => observer.observe(scene));
})();

// Master Chain paired story
(() => {
  const story = document.querySelector(".paired-story");
  if (!story) return;

  const pairs = Array.from(story.querySelectorAll(".story-pair[data-story-step]"));
  const images = Array.from(story.querySelectorAll("[data-story-image]"));
  const dots = Array.from(story.querySelectorAll("[data-story-to]"));

  if (!pairs.length || !images.length) return;

  let activeIndex = 0;
  let wheelLocked = false;
  let touchStartY = null;

  function setStoryStep(index) {
    const safeIndex = Math.max(0, Math.min(index, pairs.length - 1));
    activeIndex = safeIndex;

    pairs.forEach((pair, pairIndex) => {
      pair.classList.toggle("is-active", pairIndex === safeIndex);
    });

    images.forEach((image, imageIndex) => {
      image.classList.toggle("is-active", imageIndex === safeIndex);
    });

    dots.forEach((dot, dotIndex) => {
      const isActive = dotIndex === safeIndex;
      dot.classList.toggle("is-active", isActive);
      dot.setAttribute("aria-current", isActive ? "true" : "false");
    });
  }

  function canAdvance(direction) {
    if (direction > 0) return activeIndex < pairs.length - 1;
    if (direction < 0) return activeIndex > 0;
    return false;
  }

  function advance(direction) {
    if (!canAdvance(direction)) return false;
    const nextIndex = activeIndex + direction;
    setStoryStep(nextIndex);
    pairs[nextIndex]?.scrollIntoView({ behavior: "smooth", block: "center" });
    return true;
  }

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      const index = Number.parseInt(dot.dataset.storyTo || "0", 10);
      setStoryStep(index);
      pairs[index]?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });

  story.addEventListener(
    "wheel",
    (event) => {
      if (!isScrollLockTargetReady(story)) return;

      const direction = Math.sign(event.deltaY);
      if (!direction || Math.abs(event.deltaY) < 12) return;

      if (!canAdvance(direction)) return;

      event.preventDefault();

      if (wheelLocked) return;
      wheelLocked = true;
      advance(direction);

      window.setTimeout(() => {
        wheelLocked = false;
      }, 620);
    },
    { passive: false }
  );

  story.addEventListener(
    "touchstart",
    (event) => {
      touchStartY = event.touches[0]?.clientY ?? null;
    },
    { passive: true }
  );

  story.addEventListener(
    "touchmove",
    (event) => {
      if (touchStartY === null) return;
      if (!isScrollLockTargetReady(story)) return;

      const currentY = event.touches[0]?.clientY ?? touchStartY;
      const deltaY = touchStartY - currentY;
      const direction = Math.sign(deltaY);

      if (!direction || Math.abs(deltaY) < 34) return;
      if (!canAdvance(direction)) return;

      event.preventDefault();

      if (wheelLocked) return;
      wheelLocked = true;
      advance(direction);
      touchStartY = currentY;

      window.setTimeout(() => {
        wheelLocked = false;
      }, 620);
    },
    { passive: false }
  );

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        const activeEntry = visibleEntries[0];
        if (!activeEntry) return;

        const index = Number.parseInt(activeEntry.target.dataset.storyStep || "0", 10);
        setStoryStep(index);
      },
      {
        root: null,
        threshold: [0.38, 0.52, 0.66]
      }
    );

    pairs.forEach((pair) => observer.observe(pair));
  } else {
    setStoryStep(0);
  }
})();

// Screenshot lightbox
(() => {
  const dialog = document.getElementById("screenshot-lightbox");
  if (!dialog || typeof dialog.showModal !== "function") return;

  const image = dialog.querySelector(".screenshot-lightbox-image");
  const title = dialog.querySelector("#screenshot-lightbox-title");
  const caption = dialog.querySelector(".screenshot-lightbox-caption");
  const closeButton = dialog.querySelector(".screenshot-lightbox-close");

  const screenshotImages = document.querySelectorAll(
    ".workflow-shot img, .inside-image img, .meter-shot img"
  );

  screenshotImages.forEach((img) => {
    img.classList.add("screenshot-lightbox-trigger");
    img.tabIndex = 0;
    img.setAttribute("role", "button");
    img.setAttribute(
      "aria-label",
      `Open screenshot preview: ${img.alt || "Finalizer screenshot"}`
    );

    const openPreview = () => {
      image.src = img.currentSrc || img.src;
      image.alt = img.alt || "Finalizer screenshot preview";

      const figure = img.closest("figure");
      const figureCaption = figure?.querySelector("figcaption")?.textContent?.trim();
      const cardTitle = img.closest("article")?.querySelector("h3")?.textContent?.trim();
      const label = figureCaption || cardTitle || "Finalizer screenshot";

      title.textContent = label;
      caption.textContent = img.alt || label;
      dialog.showModal();
    };

    img.addEventListener("click", openPreview);
    img.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openPreview();
      }
    });
  });

  closeButton?.addEventListener("click", () => dialog.close());

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && dialog.open) {
      dialog.close();
    }
  });
})();