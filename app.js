"use strict";
// No build step or third-party runtime: compatible with GitHub Pages.
const USER = "cheongzhiteng";
const CACHE_KEY = "zt.repositories.v1";
const PREF_KEY = "zt.preferences.v1";
const COLORS = {
  JavaScript: "#b59c23",
  TypeScript: "#3178c6",
  Python: "#3572a5",
  HTML: "#e34c26",
  CSS: "#7855a0",
  Dart: "#00a3b6",
  Java: "#b07219",
  Shell: "#739c31",
};
const $ = (id) => document.getElementById(id);
const svg = (name) =>
  `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const escapeHTML = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}
function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
function safeURL(value) {
  try {
    const u = new URL(value);
    return ["https:", "http:"].includes(u.protocol) ? u.href : "";
  } catch {
    return "";
  }
}
function cleanRepo(r) {
  if (!r || typeof r.name !== "string" || !safeURL(r.html_url)) return null;
  return {
    name: r.name,
    archived: r.archived === true,
    html_url: safeURL(r.html_url),
    description: typeof r.description === "string" ? r.description : "",
    language: typeof r.language === "string" ? r.language : null,
    topics: Array.isArray(r.topics)
      ? r.topics.filter((t) => typeof t === "string").slice(0, 3)
      : [],
    stargazers_count: Number.isFinite(r.stargazers_count)
      ? Math.max(0, r.stargazers_count)
      : null,
    forks_count: Number.isFinite(r.forks_count)
      ? Math.max(0, r.forks_count)
      : null,
    updated_at: !isNaN(Date.parse(r.updated_at)) ? r.updated_at : null,
    homepage: safeURL(r.homepage),
  };
}
const featured = [
  {
    name: "nanatsukaze",
    description:
      "A music gallery and player. A little space to listen, discover, and escape.",
    language: "JavaScript",
    homepage: "https://cheongzhiteng.github.io/nanatsukaze",
    topics: ["music", "web"],
  },
  {
    name: "MicroHub",
    description:
      "A campus coding club app. A shared space to learn, build, and grow together.",
    topics: ["community", "mobile"],
  },
  {
    name: "soriva",
    description:
      "Find your own path through Japanese with guided lessons, kana practice, and daily review.",
    language: "TypeScript",
    topics: ["learning", "japanese"],
  },
  {
    name: "cheongzhiteng.github.io",
    description:
      "You are here! My personal workspace for projects, experiments, and things I learn along the way.",
    language: "HTML",
    homepage: "https://cheongzhiteng.github.io",
    topics: ["portfolio", "web"],
  },
].map((r) =>
  cleanRepo({ ...r, html_url: `https://github.com/${USER}/${r.name}` }),
);
const preferences = read(PREF_KEY) || {};
let saved = new Set(
  Array.isArray(preferences.saved)
    ? preferences.saved.filter((s) => typeof s === "string")
    : [],
);
let view = preferences.view === "list" ? "list" : "grid";
let language = "all";
const projectInfo = (name) =>
  PORTFOLIO.projects.find((p) => p.repo.toLowerCase() === name.toLowerCase());
const projectStatus = (r) =>
  r.archived ? "archived" : projectInfo(r.name)?.status || "unlisted";
const statusLabels = {
  development: "In development",
  released: "Public release",
  archived: "Archived",
  unlisted: "Status unlisted",
};
function readFilters() {
  const params = new URLSearchParams(location.search);
  $("searchInput").value = params.get("q") || "";
  language = params.get("tech") || "all";
  $("statusFilter").value = [
    "development",
    "released",
    "archived",
    "unlisted",
  ].includes(params.get("status"))
    ? params.get("status")
    : "all";
  $("sortSelect").value = ["name", "stars"].includes(params.get("sort"))
    ? params.get("sort")
    : "updated";
  if (params.has("view"))
    view = params.get("view") === "list" ? "list" : "grid";
}
function saveFilters() {
  const url = new URL(location);
  const values = {
    q: $("searchInput").value,
    tech: language === "all" ? "" : language,
    status: $("statusFilter").value === "all" ? "" : $("statusFilter").value,
    sort: $("sortSelect").value === "updated" ? "" : $("sortSelect").value,
    view: view === "grid" ? "" : view,
  };
  for (const [key, value] of Object.entries(values))
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  if (url.href !== location.href) history.replaceState(null, "", url);
}

let repos = featured;
let source = "featured";
let busy = false;
let toastTimer;
const cached = read(CACHE_KEY);
if (cached && Array.isArray(cached.repos)) {
  const valid = cached.repos.map(cleanRepo).filter(Boolean);
  if (valid.length) {
    repos = valid;
    source = "cache";
  }
}
function persist() {
  return write(PREF_KEY, {
    saved: [...saved],
    view,
    theme: document.documentElement.dataset.theme || "light",
  });
}
function toast(message) {
  clearTimeout(toastTimer);
  $("toast").textContent = message;
  $("toast").hidden = false;
  toastTimer = setTimeout(() => ($("toast").hidden = true), 3000);
}
function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  $("themeToggle").innerHTML = svg(theme === "dark" ? "sun" : "moon");
  $("themeToggle").setAttribute(
    "aria-label",
    `Switch to ${theme === "dark" ? "light" : "dark"} theme`,
  );
  document.querySelector('meta[name="theme-color"]').content =
    theme === "dark" ? "#111c23" : "#F6F8F8";
}
function isSavedView() {
  return location.hash === "#saved";
}
function buildFilters() {
  const languages = [
    ...new Set(repos.map((r) => r.language).filter(Boolean)),
  ].sort();
  if (language !== "all" && !languages.includes(language))
    languages.push(language);
  $("languageFilters").innerHTML = ["all", ...languages]
    .map(
      (l) =>
        `<button class="filter-chip${language === l ? " active" : ""}" data-language="${escapeHTML(l)}" aria-pressed="${language === l}">${l === "all" ? "All projects" : `<span class="lang-dot" style="background:${COLORS[l] || "#87949b"}"></span>${escapeHTML(l)}`}</button>`,
    )
    .join("");
}
function render() {
  saveFilters();
  const query = $("searchInput").value.trim().toLowerCase();
  const terms = query.split(/\s+/).filter(Boolean);
  const filtered = repos.filter(
    (r) =>
      (!isSavedView() || saved.has(r.name)) &&
      (language === "all" || r.language === language) &&
      ($("statusFilter").value === "all" ||
        projectStatus(r) === $("statusFilter").value) &&
      terms.every((t) =>
        [
          r.name,
          r.description,
          r.language,
          ...r.topics,
          projectInfo(r.name)?.summary.zh || "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(t),
      ),
  );
  filtered.sort((a, b) =>
    $("sortSelect").value === "name"
      ? a.name.localeCompare(b.name)
      : $("sortSelect").value === "stars"
        ? (b.stargazers_count || 0) - (a.stargazers_count || 0) ||
          a.name.localeCompare(b.name)
        : (Date.parse(b.updated_at) || 0) - (Date.parse(a.updated_at) || 0),
  );
  $("repoGrid").classList.toggle("list-view", view === "list");
  $("resultBadge").textContent = filtered.length;
  $("resultSummary").textContent =
    `${filtered.length} of ${repos.length} projects`;
  $("savedCount").textContent = saved.size;
  $("navProjectCount").textContent = repos.length;
  $("repoCount").textContent = repos.length;
  $("repoCountLabel").textContent =
    source === "featured" ? "Featured projects" : "Public repositories";
  $("starCount").textContent =
    source === "featured"
      ? "—"
      : repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
  $("starCaption").textContent =
    source === "featured"
      ? "Connect to see live stats"
      : "Across my repositories";
  $("projectsTitleText").textContent = isSavedView()
    ? "Your saved projects"
    : "Explore my projects";
  $("projectsSubtitle").textContent = isSavedView()
    ? "A little collection of things to come back to."
    : "Experiments, useful tools, and everything in between.";
  for (const b of document.querySelectorAll("[data-language]")) {
    const active = b.dataset.language === language;
    b.classList.toggle("active", active);
    b.setAttribute("aria-pressed", active);
  }
  for (const mode of ["grid", "list"]) {
    $(mode + "View").classList.toggle("selected", view === mode);
    $(mode + "View").setAttribute("aria-pressed", view === mode);
  }
  if (!filtered.length) {
    $("repoGrid").innerHTML =
      `<div class="empty-state"><h3>${isSavedView() && !saved.size ? "Your collection starts here" : "No projects found"}</h3><p>${isSavedView() && !saved.size ? "Use the bookmark on any project to save it on this browser." : "Try another search or clear your filters."}</p><button class="button secondary" id="clearFilters">${isSavedView() ? "Browse all projects" : "Clear filters"}</button></div>`;
    $("clearFilters").addEventListener("click", () => {
      language = "all";
      $("statusFilter").value = "all";
      $("searchInput").value = "";
      if (isSavedView()) location.hash = "projects";
      else render();
    });
    return;
  }
  $("repoGrid").innerHTML = filtered
    .map((r) => {
      const info = projectInfo(r.name);
      const details = info ? `projects/${info.slug}/` : r.html_url;
      const description = info ? info.summary[I18N.locale] : r.description;
      const name = escapeHTML(r.name),
        selected = saved.has(r.name);
      const kind =
        r.name.toLowerCase() === "nanatsukaze"
          ? "music"
          : r.name.toLowerCase() === "soriva"
            ? "book"
            : "code";
      const date = r.updated_at
        ? new Intl.DateTimeFormat(I18N.locale === "zh" ? "zh-CN" : "en", {
            dateStyle: "medium",
          }).format(new Date(r.updated_at))
        : null;
      return `<article class="repo-card"><div class="repo-card-top"><span class="repo-icon">${svg(kind)}</span><button class="icon-button save-button" data-save="${name}" aria-label="${selected ? "Unsave" : "Save"} ${name}" aria-pressed="${selected}" title="${selected ? "Remove bookmark" : "Save project"}">${svg("bookmark")}</button></div><h3 class="repo-name"><a href="${escapeHTML(details)}">${name}</a></h3><span class="status-badge">${statusLabels[projectStatus(r)]}</span><p class="repo-desc">${escapeHTML(description || "Explore the code and follow this project on GitHub.")}</p>${r.topics.length ? `<div class="repo-topics">${r.topics.map((t) => `<span class="topic-tag">${escapeHTML(t)}</span>`).join("")}</div>` : ""}<div class="repo-meta">${r.language ? `<span><span class="lang-dot" style="background:${COLORS[r.language] || "#87949b"}"></span>${escapeHTML(r.language)}</span>` : ""}${r.stargazers_count !== null ? `<span aria-label="${r.stargazers_count} stars">${svg("star")}${r.stargazers_count}</span>` : ""}<div class="repo-links">${info ? `<a class="details-link" href="${details}#preview">Preview ${svg("external")}</a>` : ""}${r.homepage ? `<a href="${escapeHTML(r.homepage)}" target="_blank" rel="noopener noreferrer" aria-label="Open ${name} website">Visit ${svg("external")}</a>` : `<a href="${escapeHTML(r.html_url)}" target="_blank" rel="noopener noreferrer" aria-label="View ${name} on GitHub">Code ${svg("external")}</a>`}</div></div><div class="repo-date">${date ? `Updated ${date}` : "Featured from my workspace"}</div></article>`;
    })
    .join("");
}
const sectionLabels = {
  home: "Overview",
  projects: "Projects",
  saved: "Saved",
  about: "About me",
  skills: "Skills",
  journal: "Journal",
  contact: "Contact",
};
const sectionLinks = document.querySelectorAll("[data-nav]");
const scrollSections = ["projects", "about", "skills", "journal", "contact"];
const compactNav = matchMedia("(max-width: 950px)");
const scrollProgress = document.querySelector(".scroll-progress");
let previousSection;
let previousNav;
let scrollFrame = 0;

function updateNavigation(section) {
  const active =
    compactNav.matches && ["skills", "journal", "contact"].includes(section)
      ? "about"
      : section;
  if (active !== previousNav)
    sectionLinks.forEach((a) => {
      const yes = a.dataset.nav === active;
      a.classList.toggle("active", yes);
      if (yes) a.setAttribute("aria-current", "location");
      else a.removeAttribute("aria-current");
    });
  if (section !== previousSection)
    $("pageLabel").textContent = sectionLabels[section];
  previousSection = section;
  previousNav = active;
}

function scheduleScrollUpdate() {
  if (scrollFrame) return;
  scrollFrame = requestAnimationFrame(() => {
    scrollFrame = 0;
    const scrollRange = document.documentElement.scrollHeight - innerHeight;
    const progress =
      scrollRange > 0 ? Math.max(0, Math.min(1, scrollY / scrollRange)) : 0;
    const atBottom = progress >= 0.998;
    const readingLine = Math.min(160, innerHeight * 0.28);
    const linkedSection = location.hash.slice(1);
    const linkedAnchor = linkedSection === "saved" ? "projects" : linkedSection;
    let section = "home";
    for (const id of scrollSections) {
      if (
        $(id).getBoundingClientRect().top >
        (atBottom ? innerHeight * 0.9 : readingLine)
      )
        break;
      section = id;
    }
    // Several short sections can share the last scroll position on tall screens.
    if (atBottom && scrollSections.includes(linkedAnchor)) {
      const { top, bottom } = $(linkedAnchor).getBoundingClientRect();
      if (top < innerHeight && bottom > 0) section = linkedAnchor;
    }
    if (section === "projects" && isSavedView()) section = "saved";
    updateNavigation(section);
    scrollProgress.style.setProperty("--scroll-progress", progress);
  });
}

function navigate(scroll = true) {
  const route = location.hash.slice(1);
  updateNavigation(Object.hasOwn(sectionLabels, route) ? route : "home");
  render();
  if (scroll && route === "saved") $("projects").scrollIntoView();
  scheduleScrollUpdate();
}
async function refresh() {
  if (busy) return;
  busy = true;
  $("refreshButton").disabled = true;
  $("refreshButton").setAttribute("aria-label", "Refreshing projects");
  $("repoGrid").setAttribute("aria-busy", "true");
  const controller = new AbortController(),
    timeout = setTimeout(() => controller.abort(), 10000);
  try {
    let page = 1,
      collected = [];
    while (true) {
      const response = await fetch(
        `https://api.github.com/users/${USER}/repos?per_page=100&sort=updated&page=${page}`,
        {
          signal: controller.signal,
          headers: { Accept: "application/vnd.github+json" },
        },
      );
      if (!response.ok) throw new Error(`GitHub ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error("Invalid response");
      collected.push(...data.map(cleanRepo).filter(Boolean));
      if (data.length < 100) break;
      page++;
    }
    repos = collected;
    source = "live";
    write(CACHE_KEY, { repos, fetchedAt: Date.now() });
    $("dataNotice").hidden = true;
    $("syncStatus").innerHTML =
      '<span class="status-dot"></span>Up to date with GitHub';
  } catch {
    $("dataNotice").hidden = false;
    $("dataNotice").textContent =
      source === "featured"
        ? "GitHub is unavailable right now. Explore these featured projects, or try Refresh again."
        : "GitHub is unavailable right now. Showing your last loaded projects. Try Refresh again for updates.";
    $("syncStatus").innerHTML =
      `<span class="status-dot"></span>${source === "featured" ? "Featured projects · live stats unavailable" : "Saved repository data · awaiting refresh"}`;
  } finally {
    clearTimeout(timeout);
    busy = false;
    $("refreshButton").disabled = false;
    $("refreshButton").setAttribute("aria-label", "Refresh projects");
    $("repoGrid").setAttribute("aria-busy", "false");
    buildFilters();
    render();
  }
}
$("repoGrid").addEventListener("click", (e) => {
  const b = e.target.closest("[data-save]");
  if (!b) return;
  const name = b.dataset.save;
  if (saved.has(name)) saved.delete(name);
  else saved.add(name);
  const stored = persist();
  render();
  const replacement = [...document.querySelectorAll("[data-save]")].find(
    (el) => el.dataset.save === name,
  );
  if (replacement) replacement.focus({ preventScroll: true });
  else $("searchInput").focus({ preventScroll: true });
  toast(
    stored
      ? saved.has(name)
        ? "Project saved to your collection"
        : "Project removed from saved"
      : "Saved for this visit. Browser storage is unavailable.",
  );
});
$("languageFilters").addEventListener("click", (e) => {
  const b = e.target.closest("[data-language]");
  if (b) {
    language = b.dataset.language;
    render();
  }
});
$("searchInput").addEventListener("input", render);
$("statusFilter").addEventListener("change", render);
window.addEventListener("popstate", () => {
  readFilters();
  buildFilters();
  navigate(false);
});
window.addEventListener("localechange", () => {
  render();
});
$("sortSelect").addEventListener("change", render);
$("refreshButton").addEventListener("click", refresh);
for (const mode of ["grid", "list"])
  $(mode + "View").addEventListener("click", () => {
    view = mode;
    persist();
    render();
  });
$("themeToggle").addEventListener("click", () => {
  setTheme(
    document.documentElement.dataset.theme === "dark" ? "light" : "dark",
  );
  persist();
});
window.addEventListener("hashchange", () => navigate());
window.addEventListener("scroll", scheduleScrollUpdate, { passive: true });
window.addEventListener("resize", scheduleScrollUpdate);
window.addEventListener("pageshow", scheduleScrollUpdate);
new ResizeObserver(scheduleScrollUpdate).observe($("main"));
window.addEventListener("keydown", (e) => {
  if (
    e.key === "/" &&
    !e.ctrlKey &&
    !e.metaKey &&
    !e.altKey &&
    !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)
  ) {
    e.preventDefault();
    $("searchInput").focus();
  }
  if (e.key === "Escape" && document.activeElement === $("searchInput")) {
    $("searchInput").value = "";
    render();
  }
});
$("year").textContent = new Date().getFullYear();
setTheme(preferences.theme === "dark" ? "dark" : "light");
readFilters();
buildFilters();
navigate(false);
if (isSavedView()) $("projects").scrollIntoView();
refresh();
