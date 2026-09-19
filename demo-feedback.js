/* Reflect demo feedback - detachable widget.
   Remove the <script src="demo-feedback.js"> tag to turn this off.
   Optional: data-key="WEB3FORMS_ACCESS_KEY" to email submissions.
   Hide for a session with ?feedback=off */
(function () {
  const script = document.currentScript;
  const params = new URLSearchParams(location.search);
  if (params.get("feedback") === "off") return;

  const rawKey = ((script && script.getAttribute("data-key")) || "").trim();
  const accessKey = (!rawKey || rawKey === "YOUR_WEB3FORMS_ACCESS_KEY") ? "" : rawKey;

  const ABOUT = [
    { id: "screen", label: "This screen" },
    { id: "overall", label: "Reflect overall" },
    { id: "off", label: "Something's off" }
  ];
  const FEEL = [
    { id: "rough", label: "Rough" },
    { id: "fine", label: "Fine" },
    { id: "good", label: "Good" }
  ];
  const PLACEHOLDERS = {
    screen: "What about this screen should we change?",
    overall: "What's working, or what isn't clicking yet?",
    off: "What happened, and what did you expect?"
  };

  const state = {
    open: false,
    about: "screen",
    feel: "",
    note: "",
    sending: false,
    status: null,
    copied: false
  };

  const host = document.createElement("div");
  host.id = "reflect-demo-feedback";
  host.setAttribute("data-demo-feedback", "on");
  const shadow = host.attachShadow({ mode: "open" });

  function isPatientRoute(h) {
    const hash = h || location.hash || "#/";
    return hash.startsWith("#/s/") && !hash.startsWith("#/surveys");
  }

  function esc(t) {
    return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function pageContext() {
    const hash = location.hash || "#/";
    const patient = isPatientRoute(hash);
    let page = "Overview";
    let surveyId = "";
    if (patient) {
      page = "Patient survey";
    } else if (hash === "#/alerts") {
      page = "Alerts";
    } else if (hash === "#/triggers") {
      page = "Triggers";
    } else if (hash === "#/scorecard") {
      page = "Scorecard";
    } else if (hash === "#/blink") {
      page = "Blink";
    } else if (hash === "#/surveys") {
      page = "Surveys";
    } else if (hash.startsWith("#/surveys/")) {
      const m = hash.match(/^#\/surveys\/([^/]+)/);
      surveyId = m ? decodeURIComponent(m[1]) : "";
      const title = document.querySelector("h1.t-h2");
      const name = title ? title.textContent.trim() : "";
      page = name ? "Survey: " + name : "Survey builder";
    }
    const roleBtn = document.querySelector('.seg button[aria-pressed="true"]');
    const role = patient ? "Patient" : (roleBtn ? roleBtn.textContent.trim() : "Unknown");
    const theme = document.documentElement.getAttribute("data-theme") || "light";
    return {
      hash,
      patient,
      page,
      role,
      theme,
      surveyId,
      at: new Date().toISOString()
    };
  }

  function formatNote(ctx) {
    const about = ABOUT.find(a => a.id === state.about);
    const feel = FEEL.find(f => f.id === state.feel);
    const lines = [
      "Reflect demo feedback",
      "",
      "About: " + (about ? about.label : state.about),
      "Feel: " + (feel ? feel.label : "(skipped)"),
      "Note: " + state.note.trim(),
      "",
      "Page: " + ctx.page,
      "Role: " + ctx.role,
      "Hash: " + ctx.hash,
      ctx.surveyId ? "Survey id: " + ctx.surveyId : "",
      "Theme: " + ctx.theme,
      "When: " + ctx.at
    ];
    return lines.filter(l => l !== "").join("\n");
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      return false;
    }
  }

  async function send() {
    const note = state.note.trim();
    if (!note || state.sending) return;
    state.sending = true;
    state.status = null;
    render();

    const ctx = pageContext();
    const payload = formatNote(ctx);
    const canPost = accessKey && location.protocol !== "file:";

    if (canPost) {
      try {
        const res = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            access_key: accessKey,
            subject: "Reflect demo feedback - " + ctx.page,
            from_name: "Reflect prototype",
            message: payload,
            about: (ABOUT.find(a => a.id === state.about) || {}).label,
            feel: (FEEL.find(f => f.id === state.feel) || {}).label || "(skipped)",
            page: ctx.page,
            role: ctx.role,
            hash: ctx.hash,
            survey_id: ctx.surveyId,
            theme: ctx.theme,
            botcheck: ""
          })
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success !== false) {
          state.sending = false;
          state.status = "sent";
          state.note = "";
          state.feel = "";
          state.about = "screen";
          render();
          setTimeout(close, 1800);
          return;
        }
      } catch (err) {
        /* fall through to clipboard */
      }
    }

    const copied = await copyText(payload);
    state.sending = false;
    state.copied = copied;
    state.status = "copied";
    if (copied) {
      state.note = "";
      state.feel = "";
      state.about = "screen";
    }
    render();
    if (copied) setTimeout(close, 2800);
  }

  function open() {
    state.open = true;
    state.status = null;
    state.copied = false;
    render({ animate: true });
  }

  function close() {
    const wasOpen = state.open;
    state.open = false;
    state.sending = false;
    state.status = null;
    render();
    if (wasOpen) {
      const trigger = shadow.querySelector("[data-trigger]");
      if (trigger) trigger.focus();
    }
  }

  function toggle() {
    if (state.open) close();
    else open();
  }

  function onKey(e) {
    if (e.key === "Escape" && state.open) {
      e.stopPropagation();
      close();
    }
  }

  const CSS = `
    :host {
      all: initial;
      font-family: Lato, -apple-system, "Segoe UI", sans-serif;
      -webkit-font-smoothing: antialiased;
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 80;
    }
    *, *::before, *::after { box-sizing: border-box; }
    button, textarea { font-family: inherit; }
    :focus-visible { outline: 2px solid #2563EB; outline-offset: 2px; }
    :focus:not(:focus-visible) { outline: none; }

    .tab, .pill, .scrim, .panel { pointer-events: auto; }

    .tab {
      position: fixed;
      right: 0;
      bottom: 24px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      border: 0;
      border-radius: 10px 0 0 10px;
      background: #171717;
      color: #FAFAFA;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 8px 24px rgba(0,0,0,.18);
      transition: background-color 160ms cubic-bezier(.22,1,.36,1);
    }
    .tab:hover { background: #262626; }
    .tab-label {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 16px 8px;
      writing-mode: vertical-rl;
      text-orientation: mixed;
      transform: rotate(180deg);
      letter-spacing: .02em;
      font-weight: 600;
    }
    .tab .demo {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: .04em;
      color: #A3A3A3;
      border: 1px solid #525252;
      border-radius: 4px;
      padding: 5px 3px;
    }

    .pill {
      position: fixed;
      right: 16px;
      bottom: 16px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      height: 36px;
      padding: 0 14px;
      border: 1px solid rgba(255,255,255,.18);
      border-radius: 999px;
      background: rgba(26,29,34,.72);
      color: #E8E5E0;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: .01em;
      cursor: pointer;
      backdrop-filter: blur(8px);
      box-shadow: 0 8px 20px rgba(0,0,0,.28);
      transition: background-color 160ms cubic-bezier(.22,1,.36,1);
    }
    .pill:hover { background: rgba(26,29,34,.88); }
    .pill .dot {
      width: 6px; height: 6px; border-radius: 999px;
      background: #D4A05A; flex: 0 0 auto;
    }

    .scrim {
      position: fixed; inset: 0;
      background: rgba(0,0,0,.32);
      animation: fade 200ms cubic-bezier(.22,1,.36,1);
    }

    .panel {
      position: fixed;
      right: 44px;
      bottom: 24px;
      top: auto;
      width: min(360px, calc(100vw - 72px));
      height: auto;
      max-height: calc(100vh - 48px);
      background: #FAFAFA;
      color: #171717;
      border: 1px solid #D4D4D4;
      border-radius: 12px;
      box-shadow: 0 20px 40px -12px rgba(0,0,0,.28);
      padding: 20px;
      overflow-y: auto;
    }
    .panel.enter { animation: sweepIn 280ms cubic-bezier(.22,1,.36,1) both; }
    .panel.patient { right: 16px; bottom: 60px; }

    .head {
      display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
      margin-bottom: 12px;
    }
    .kicker {
      font-size: 11px; font-weight: 600; letter-spacing: .06em;
      text-transform: uppercase; color: #737373; margin-bottom: 4px;
    }
    h2 { margin: 0; font-size: 18px; line-height: 24px; font-weight: 700; letter-spacing: -.01em; }
    .close {
      width: 32px; height: 32px; border: 0; background: transparent;
      border-radius: 6px; color: #737373; cursor: pointer;
      display: grid; place-items: center; flex: 0 0 auto;
    }
    .close:hover { background: #F5F5F5; color: #171717; }

    .notice {
      font-size: 13px; line-height: 20px; color: #525252;
      background: #F5F5F5; border-radius: 8px; padding: 10px 12px; margin: 0 0 16px;
    }
    .notice.patient {
      background: #FBF7F0; color: #585D66; border: 1px solid #E5E0D8;
    }

    .label {
      display: block; font-size: 13px; font-weight: 700; margin: 0 0 8px;
    }
    .opt { font-weight: 400; color: #737373; }
    .chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
    .chip {
      height: 32px; padding: 0 12px; border-radius: 999px; cursor: pointer;
      border: 1px solid #D4D4D4; background: #fff; color: #171717;
      font-size: 13px; font-weight: 500;
      transition: background-color 160ms cubic-bezier(.22,1,.36,1), border-color 160ms cubic-bezier(.22,1,.36,1);
    }
    .chip:hover { background: #F0F9FF; border-color: #0284C7; color: #0369A1; }
    .chip[aria-pressed="true"] {
      background: #171717; border-color: #171717; color: #fff;
    }
    .chip[aria-pressed="true"]:hover {
      background: #0A0A0A; border-color: #0A0A0A; color: #fff;
    }
    .chip.feel { min-width: 72px; }

    textarea {
      width: 100%; min-height: 96px; padding: 10px 12px;
      border: 1px solid #D4D4D4; border-radius: 8px;
      background: #fff; color: #171717; font-size: 14px; line-height: 22px;
      resize: vertical; margin-bottom: 8px;
      outline: none;
    }
    textarea:hover { border-color: #737373; }
    textarea:focus, textarea:focus-visible {
      outline: 2px solid #2563EB; outline-offset: 2px; border-color: #D4D4D4;
    }
    textarea::placeholder { color: #A3A3A3; }

    .actions { display: flex; justify-content: flex-end; margin-top: 8px; }
    .send {
      display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      height: 40px; padding: 0 16px; border: 0; border-radius: 6px;
      background: #171717; color: #fff; font-size: 14px; font-weight: 700;
      cursor: pointer;
    }
    .send:hover:not([disabled]) { background: #262626; }
    .send[disabled] { opacity: .45; cursor: not-allowed; }

    .thanks {
      text-align: left; padding: 8px 0 4px;
    }
    .thanks h2 { margin-bottom: 8px; }
    .thanks p { margin: 0; font-size: 14px; line-height: 22px; color: #525252; }
    .thanks pre {
      margin: 12px 0 0; padding: 10px 12px; background: #F5F5F5;
      border-radius: 8px; font-size: 12px; line-height: 18px;
      white-space: pre-wrap; word-break: break-word; max-height: 180px; overflow: auto;
    }

    @keyframes fade { from { opacity: 0; } }
    @keyframes sweepIn {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }

    @media (prefers-reduced-motion: reduce) {
      .scrim, .panel.enter { animation: none; }
      .tab, .pill, .chip, .send { transition: none; }
    }
    @media (max-width: 520px) {
      .panel, .panel.patient {
        left: 16px;
        right: 44px;
        width: auto;
        bottom: 24px;
      }
    }
  `;

  function xIcon() {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;
  }

  function render(opts) {
    const animate = !!(opts && opts.animate);
    const ctx = pageContext();
    const patient = ctx.patient;
    const placeholder = PLACEHOLDERS[state.about] || PLACEHOLDERS.screen;
    const canSend = state.note.trim().length > 0 && !state.sending;

    const trigger = patient
      ? `<button class="pill" data-trigger type="button"
          aria-expanded="${state.open}" aria-controls="df-panel"
          aria-haspopup="dialog" aria-label="Prototype feedback">
          <span class="dot" aria-hidden="true"></span> Prototype feedback
        </button>`
      : `<button class="tab" data-trigger type="button"
          aria-expanded="${state.open}" aria-controls="df-panel" aria-haspopup="dialog">
          <span class="tab-label"><span class="demo">Demo</span> Feedback</span>
        </button>`;

    let body = "";
    if (state.status === "sent") {
      body = `<div class="thanks">
        <h2>Got it - thanks.</h2>
        <p>This landed with the people building Reflect.</p>
      </div>`;
    } else if (state.status === "copied") {
      body = `<div class="thanks">
        <h2>${state.copied ? "Copied to your clipboard." : "Couldn't send from here."}</h2>
        <p>${state.copied
          ? "Paste this note to the person running the demo."
          : "Copy the note below and send it to the person running the demo."}</p>
        ${state.copied ? "" : `<pre>${esc(formatNote(ctx))}</pre>`}
      </div>`;
    } else {
      body = `
        ${patient
          ? `<p class="notice patient">This note goes to the people building Reflect, not to the crew or the agency.</p>`
          : `<p class="notice">A short note for the people building this prototype.</p>`}
        <div class="label" id="df-about">What is this about?</div>
        <div class="chips" role="group" aria-labelledby="df-about">
          ${ABOUT.map(a => `<button type="button" class="chip" data-about="${a.id}"
            aria-pressed="${state.about === a.id}">${esc(a.label)}</button>`).join("")}
        </div>
        <div class="label" id="df-feel">How did this feel? <span class="opt">Optional</span></div>
        <div class="chips" role="group" aria-labelledby="df-feel">
          ${FEEL.map(f => `<button type="button" class="chip feel" data-feel="${f.id}"
            aria-pressed="${state.feel === f.id}">${esc(f.label)}</button>`).join("")}
        </div>
        <label class="label" for="df-note">What should we know?</label>
        <textarea id="df-note" maxlength="1200" placeholder="${esc(placeholder)}">${esc(state.note)}</textarea>
        <div class="actions">
          <button type="button" class="send" data-send ${canSend ? "" : "disabled"}>
            ${state.sending ? "Sending..." : "Send note"}
          </button>
        </div>`;
    }

    shadow.innerHTML = `<style>${CSS}</style>
      ${trigger}
      ${state.open ? `
        <div class="scrim" data-scrim></div>
        <div class="panel ${patient ? "patient" : "staff"}${animate ? " enter" : ""}" id="df-panel" role="dialog"
          aria-modal="true" aria-labelledby="df-title">
          <div class="head">
            <div>
              <div class="kicker">Demo feedback</div>
              <h2 id="df-title">${patient ? "Note about this prototype" : "What should we know?"}</h2>
            </div>
            <button class="close" type="button" data-close aria-label="Close">${xIcon()}</button>
          </div>
          ${body}
        </div>` : ""}`;

    bind();
  }

  function bind() {
    const trigger = shadow.querySelector("[data-trigger]");
    if (trigger) trigger.addEventListener("click", toggle);
    const scrim = shadow.querySelector("[data-scrim]");
    if (scrim) scrim.addEventListener("click", close);
    const closeBtn = shadow.querySelector("[data-close]");
    if (closeBtn) closeBtn.addEventListener("click", close);
    const sendBtn = shadow.querySelector("[data-send]");
    if (sendBtn) sendBtn.addEventListener("click", send);
    shadow.querySelectorAll("[data-about]").forEach(btn => {
      btn.addEventListener("click", () => {
        state.about = btn.getAttribute("data-about");
        shadow.querySelectorAll("[data-about]").forEach(b => {
          b.setAttribute("aria-pressed", b === btn ? "true" : "false");
        });
        const ta = shadow.querySelector("textarea");
        if (ta) ta.placeholder = PLACEHOLDERS[state.about] || PLACEHOLDERS.screen;
      });
    });
    shadow.querySelectorAll("[data-feel]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-feel");
        state.feel = state.feel === id ? "" : id;
        shadow.querySelectorAll("[data-feel]").forEach(b => {
          b.setAttribute("aria-pressed", b.getAttribute("data-feel") === state.feel ? "true" : "false");
        });
      });
    });
    const ta = shadow.querySelector("textarea");
    if (ta) {
      ta.addEventListener("input", () => {
        state.note = ta.value;
        const sendBtnLive = shadow.querySelector("[data-send]");
        if (sendBtnLive) sendBtnLive.disabled = state.note.trim().length === 0 || state.sending;
      });
    }
  }

  function mount() {
    if (document.getElementById("reflect-demo-feedback")) return;
    document.body.appendChild(host);
    render();
    window.addEventListener("hashchange", render);
    window.addEventListener("keydown", onKey, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
