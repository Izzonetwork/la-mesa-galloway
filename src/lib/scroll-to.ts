function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function finishJump() {
  const html = document.documentElement;
  const clear = () => html.classList.remove("is-jumping");
  if (prefersReducedMotion()) {
    clear();
    return;
  }
  let fallback = 0;
  const done = () => {
    window.removeEventListener("scrollend", done);
    window.clearTimeout(fallback);
    clear();
  };
  fallback = window.setTimeout(done, 900);
  window.addEventListener("scrollend", done, { once: true });
}

export function scrollHome() {
  document.body.style.overflow = "";
  document.documentElement.classList.add("is-jumping");
  const path = window.location.pathname || "/";
  window.history.replaceState(null, "", path);
  window.scrollTo({
    top: 0,
    behavior: prefersReducedMotion() ? "auto" : "smooth",
  });
  finishJump();
}

export function scrollToId(id: string) {
  if (id === "top") {
    scrollHome();
    return;
  }
  const el = document.getElementById(id);
  if (!el) return;
  document.body.style.overflow = "";
  document.documentElement.classList.add("is-jumping");
  const header = document.querySelector("header");
  const offset = (header?.getBoundingClientRect().height ?? 64) + 10;
  const top = Math.max(0, el.getBoundingClientRect().top + window.scrollY - offset);
  window.scrollTo({
    top,
    behavior: prefersReducedMotion() ? "auto" : "smooth",
  });
  finishJump();
}

export function handleHashClick(
  event: { preventDefault: () => void },
  href: string,
  afterCloseMs = 0,
) {
  const id = href.includes("#") ? href.split("#")[1] : "";
  if (!id) return;
  event.preventDefault();
  const jump = () => {
    if (id === "top") {
      scrollHome();
      return;
    }
    window.history.replaceState(null, "", `#${id}`);
    scrollToId(id);
  };
  if (afterCloseMs > 0) {
    window.setTimeout(jump, afterCloseMs);
  } else {
    jump();
  }
}

export function handleHomeClick(
  event: { preventDefault: () => void },
  afterCloseMs = 0,
) {
  const path = window.location.pathname || "/";
  if (path !== "/" && path !== "") return;
  event.preventDefault();
  const jump = () => scrollHome();
  if (afterCloseMs > 0) {
    window.setTimeout(jump, afterCloseMs);
  } else {
    jump();
  }
}
