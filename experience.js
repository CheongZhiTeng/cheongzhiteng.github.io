/* Progressive enhancements: navigation remains useful without these effects. */
(() => {
  const paired = (value) =>
    `<span data-en="${esc(value.en)}" data-zh="${esc(value.zh)}">${esc(value.en)}</span>`;
  const esc = (value) =>
    String(value).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const t = (s) => (window.I18N ? I18N.text(s) : s);
  let timer;
  function announce(text) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = t(text);
    toast.hidden = false;
    clearTimeout(timer);
    timer = setTimeout(() => (toast.hidden = true), 3500);
  }
  async function copy(value, message) {
    try {
      await navigator.clipboard.writeText(value);
      announce(message);
    } catch {
      const dialog = document.createElement("dialog");
      dialog.className = "copy-dialog";
      const heading = document.createElement("h2");
      heading.textContent = t("Copy filtered link");
      const input = document.createElement("input");
      input.value = value;
      input.readOnly = true;
      input.setAttribute("aria-label", t("Copy filtered link"));
      const close = document.createElement("button");
      close.className = "button secondary";
      close.textContent = t("Close preview");
      dialog.append(heading, input, close);
      document.body.append(dialog);
      close.onclick = () => dialog.close();
      dialog.addEventListener("close", () => dialog.remove());
      dialog.showModal();
      input.select();
    }
  }
  if (window.PORTFOLIO && document.getElementById("skillsGrid")) {
    const skills = [
      ["JavaScript", "nanatsukaze"],
      ["TypeScript", "microhub"],
      ["React & Next.js", "soriva"],
      ["HTML & CSS", "workspace"],
      ["Supabase", "microhub"],
      ["Playwright", "workspace"],
    ];
    document.getElementById("skillsGrid").innerHTML = skills
      .map(([skill, slug]) => {
        const p = PORTFOLIO.projects.find((p) => p.slug === slug);
        return `<a class="skill-card" href="projects/${slug}/"><span class="skill-mark" aria-hidden="true">&lt;/&gt;</span><strong>${skill}</strong><span>${esc(p.title)} <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10"/></svg></span></a>`;
      })
      .join("");
    document.getElementById("journalGrid").innerHTML = PORTFOLIO.journal
      .map(
        (e) =>
          `<a class="journal-card" href="journal/${e.slug}/"><span class="section-kicker">${paired(e.tag)} · <time datetime="${e.date}">${e.date}</time></span><h3>${paired(e.title)}</h3><p>${paired(e.body[0])}</p><span class="text-link">Read note →</span></a>`,
      )
      .join("");
    document
      .getElementById("copyEmail")
      .addEventListener("click", () =>
        copy("mr.cheongzhiteng@gmail.com", "Email copied"),
      );
    document.getElementById("shareFilters").addEventListener("click", () => {
      const url = new URL(location);
      url.hash = "projects";
      copy(url.href, "Link copied");
    });
  }
  try {
    const prefs = JSON.parse(localStorage.getItem("zt.preferences.v1"));
    if (prefs?.theme === "dark")
      document.documentElement.dataset.theme = "dark";
  } catch {}
  let motion = true;
  const media = matchMedia("(prefers-reduced-motion: reduce)");
  try {
    motion = localStorage.getItem("zt.motion") !== "off";
  } catch {}
  function updateMotion() {
    const enabled = motion && !media.matches;
    document.documentElement.dataset.motion = enabled ? "on" : "off";
    document.querySelectorAll(".motion-toggle").forEach((button) => {
      button.textContent = enabled ? "Animations on" : "Animations off";
      button.setAttribute("aria-pressed", String(enabled));
      button.setAttribute(
        "aria-label",
        enabled ? "Pause animations" : "Enable animations",
      );
      button.title = media.matches
        ? "Reduced motion follows your device setting"
        : button.getAttribute("aria-label");
    });
    document.querySelectorAll(".reveal:not(.is-visible)").forEach((el) => {
      if (!enabled) el.classList.add("is-visible");
    });
  }
  document.addEventListener("click", (e) => {
    if (e.target.closest(".motion-toggle")) {
      motion = !motion;
      try {
        localStorage.setItem("zt.motion", motion ? "on" : "off");
      } catch {}
      updateMotion();
    }
  });
  media.addEventListener("change", updateMotion);
  updateMotion();
  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }),
    { threshold: 0.08 },
  );
  document
    .querySelectorAll(".reveal,.featured-section,.stats,.about-card")
    .forEach((el) => {
      el.classList.add("reveal");
      observer.observe(el);
    });
  document.querySelectorAll(".launch-preview").forEach((button) =>
    button.addEventListener("click", () => {
      const mount = button.parentElement.querySelector(".iframe-mount");
      if (mount.childElementCount) {
        mount.replaceChildren();
        button.dataset.en = "Load interactive preview";
        button.dataset.zh = "加载交互预览";
        button.textContent = "Load interactive preview";
        return;
      }
      const url = new URL(button.dataset.demo, location.href);
      if (!["http:", "https:"].includes(url.protocol)) return;
      const frame = document.createElement("iframe");
      frame.src = url.href;
      frame.title =
        I18N.locale === "zh" ? "项目交互预览" : "Interactive project preview";
      frame.loading = "lazy";
      frame.referrerPolicy = "no-referrer";
      frame.setAttribute(
        "sandbox",
        "allow-scripts allow-same-origin allow-presentation",
      );
      frame.allow = "autoplay; fullscreen";
      mount.append(frame);
      button.dataset.en = "Close preview";
      button.dataset.zh = "关闭预览";
      button.textContent = "Close preview";
      announce("Preview loaded. If it does not appear, open it in a new tab.");
    }),
  );
  if (new URLSearchParams(location.search).has("embed"))
    document.body.classList.add("embedded-preview");
  I18N?.apply();
})();
