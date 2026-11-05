// =====================================================
// Smart Tab Organizer — popup.js
// BYOK multi-AI client | v3.0.0
// =====================================================

// ─── Provider Configuration ───────────────────────────────────────────────────
const PROVIDERS = {
  gemini: {
    label: "Google Gemini",
    models: [
      { id: "gemini-3.8-flash",      label: "Gemini 3.8 Flash (Latest)" },
      { id: "gemini-3.6-flash",      label: "Gemini 3.6 Flash" },
      { id: "gemini-3.5-flash",      label: "Gemini 3.5 Flash" },
      { id: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash-Lite (Fast)" },
    ],
  },
  openai: {
    label: "OpenAI ChatGPT",
    models: [
      { id: "gpt-6-astra",   label: "GPT-6 Astra (Flagship)" },
      { id: "gpt-6.1-sol",   label: "GPT-6.1 Sol" },
      { id: "gpt-5.5-pro",   label: "GPT-5.5 Pro" },
      { id: "gpt-5.5",       label: "GPT-5.5" },
      { id: "gpt-5.4-mini",  label: "GPT-5.4 Mini (Fast)" },
    ],
  },
  claude: {
    label: "Anthropic Claude",
    models: [
      { id: "claude-opus-5-5",   label: "Claude Opus 5.5 (Powerful)" },
      { id: "claude-sonnet-5-5", label: "Claude Sonnet 5.5" },
      { id: "claude-haiku-5-5",  label: "Claude Haiku 5.5 (Fast)" },
    ],
  },
  grok: {
    label: "xAI Grok",
    models: [
      { id: "grok-4.7",          label: "Grok 4.7" },
      { id: "grok-420-reasoning", label: "Grok 4.20 Reasoning" },
    ],
  },
  kimi: {
    label: "Moonshot Kimi",
    models: [
      { id: "kimi-k3.1-pro",            label: "Kimi K3.1 Pro" },
      { id: "kimi-k3.1-pro-highspeed",  label: "Kimi K3.1 Pro Highspeed (Fast)" },
      { id: "kimi-k3",                  label: "Kimi K3" },
    ],
  },
};

// ─── Default Categories ────────────────────────────────────────────────────────
const DEFAULT_CATEGORIES = ["İş / Work", "Sosyal / Social", "Araştırma / Research"];

// ─── DOM References ────────────────────────────────────────────────────────────
const settingsBtn     = document.getElementById("settingsBtn");
const settingsPanel   = document.getElementById("settingsPanel");
const providerSelect  = document.getElementById("providerSelect");
const modelSelect     = document.getElementById("modelSelect");
const apiKeyInput     = document.getElementById("apiKeyInput");
const saveCredBtn     = document.getElementById("saveCredBtn");
const categoryList    = document.getElementById("categoryList");
const addCategoryBtn  = document.getElementById("addCategoryBtn");
const junksToggle     = document.getElementById("junksToggle");
const groupBtn        = document.getElementById("groupBtn");
const statusBox       = document.getElementById("statusBox");
const statusText      = document.getElementById("statusText");
const indicatorDot    = document.getElementById("indicatorDot");
const indicatorText   = document.getElementById("indicatorText");

// ─── State ──────────────────────────────────────────────────────────────────────
let junksEnabled = false;

// =====================================================================
// SECTION 1 — UI Helpers
// =====================================================================

/**
 * Set the status display state.
 * @param {string} message
 * @param {'idle'|'loading'|'success'|'error'} type
 */
function setStatus(message, type = "idle") {
  statusText.textContent = message;
  statusBox.className = "status-box";
  if (type !== "idle") statusBox.classList.add(type);
}

/**
 * Update the config indicator bar.
 * @param {string|null} provider e.g. "gemini"
 * @param {string|null} model
 * @param {boolean} hasKey
 */
function updateIndicator(provider, model, hasKey) {
  if (!hasKey) {
    indicatorDot.className = "indicator-dot";
    indicatorText.textContent = "No API key configured — open ⚙ to set up";
  } else {
    indicatorDot.className = "indicator-dot active";
    const provLabel = PROVIDERS[provider]?.label ?? provider ?? "Unknown";
    const modLabel  = PROVIDERS[provider]?.models.find(m => m.id === model)?.label ?? model ?? "Unknown";
    indicatorText.textContent = `${provLabel} · ${modLabel}`;
  }
}

/**
 * Populate the Model dropdown based on selected provider.
 * @param {string} provider
 * @param {string|null} savedModel
 */
function populateModels(provider, savedModel = null) {
  const models = PROVIDERS[provider]?.models ?? [];
  modelSelect.innerHTML = "";
  for (const m of models) {
    const opt = document.createElement("option");
    opt.value = m.id;
    opt.textContent = m.label;
    modelSelect.appendChild(opt);
  }
  if (savedModel && [...modelSelect.options].some(o => o.value === savedModel)) {
    modelSelect.value = savedModel;
  }
}

/**
 * Create a category input row element.
 * @param {string} value
 * @param {boolean} isDeletable
 * @returns {HTMLElement}
 */
function createCategoryRow(value = "", isDeletable = false) {
  const row = document.createElement("div");
  row.className = "category-row";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "text-field";
  input.placeholder = "Category name...";
  input.value = value;
  input.maxLength = 40;
  row.appendChild(input);

  if (isDeletable) {
    const delBtn = document.createElement("button");
    delBtn.className = "category-delete-btn";
    delBtn.title = "Remove category";
    delBtn.setAttribute("aria-label", "Remove category");
    delBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
           stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6"  y1="6" x2="18" y2="18"/>
      </svg>`;
    delBtn.addEventListener("click", () => {
      row.style.animation = "none";
      row.style.transition = "opacity 0.15s, transform 0.15s";
      row.style.opacity = "0";
      row.style.transform = "translateY(-4px)";
      setTimeout(() => row.remove(), 160);
    });
    row.appendChild(delBtn);
  }

  return row;
}

/**
 * Collect non-empty category names from the list.
 * @returns {string[]}
 */
function getCategories() {
  return [...categoryList.querySelectorAll(".category-row input")]
    .map(i => i.value.trim())
    .filter(v => v.length > 0);
}

// =====================================================================
// SECTION 2 — Multi-AI Provider Abstraction Layer
// =====================================================================

const RESTRICTED_SCHEMES = ["chrome://", "edge://", "about:", "chrome-extension://"];

/**
 * Build the classification prompt.
 * @param {object[]} tabs        Array of { id, title, url }
 * @param {string[]} categories  User-defined category names
 * @param {boolean}  junksToo
 * @returns {string}
 */
function buildPrompt(tabs, categories, junksToo) {
  return `You are a browser tab organizer.
Analyze the provided open browser tabs and assign each one to exactly one of the specified categories.

User-defined categories: ${JSON.stringify(categories)}

Unmatched tab policy: ${junksToo
    ? 'Assign any tab that does not clearly belong to the user categories to "Junks".'
    : 'Assign any tab that does not clearly belong to the user categories to "Other".'}

IMPORTANT — Output format rules:
- Output ONLY a raw JSON array. No markdown, no code fences, no explanation.
- Each element: { "tabId": <number>, "category": "<string>" }
- Include every single tab in the output using its exact numeric tabId.

Tabs to categorize:
${JSON.stringify(tabs, null, 2)}`;
}

/**
 * Unified AI dispatch function.
 * @param {{ provider: string, model: string, apiKey: string, prompt: string }} opts
 * @returns {Promise<string>} Raw response text (pre-parsed JSON string)
 */
async function callAIProvider({ provider, model, apiKey, prompt }) {
  let url, headers, body, response;

  if (provider === "gemini") {
    // ── Google Gemini ──────────────────────────────────────────────────
    const cleanModel = model.replace(/^models\//, "");
    url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${apiKey}`;
    headers = { "Content-Type": "application/json" };
    body = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    });

    response = await fetch(url, { method: "POST", headers, body });
    if (!response.ok) await throwProviderError(response, "Gemini");

    const data = await response.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) throw new Error("Gemini: Boş yanıt alındı.");
    return raw;

  } else if (provider === "openai" || provider === "grok" || provider === "kimi") {
    // ── OpenAI-compatible endpoints ────────────────────────────────────
    if (provider === "openai") url = "https://api.openai.com/v1/chat/completions";
    else if (provider === "grok") url = "https://api.x.ai/v1/chat/completions";
    else url = "https://api.moonshot.cn/v1/chat/completions";

    headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    };
    body = JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    response = await fetch(url, { method: "POST", headers, body });
    if (!response.ok) await throwProviderError(response, provider);

    const data = await response.json();
    const raw = data?.choices?.[0]?.message?.content;
    if (!raw) throw new Error(`${provider}: Boş yanıt alındı.`);
    return raw;

  } else if (provider === "claude") {
    // ── Anthropic Claude ───────────────────────────────────────────────
    url = "https://api.anthropic.com/v1/messages";
    headers = {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    };
    body = JSON.stringify({
      model,
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    response = await fetch(url, { method: "POST", headers, body });
    if (!response.ok) await throwProviderError(response, "Claude");

    const data = await response.json();
    const raw = data?.content?.[0]?.text;
    if (!raw) throw new Error("Claude: Boş yanıt alındı.");
    return raw;

  } else {
    throw new Error(`Desteklenmeyen provider: "${provider}"`);
  }
}

/**
 * Parse error from a non-ok fetch response and throw.
 * @param {Response} response
 * @param {string}   providerName
 */
async function throwProviderError(response, providerName) {
  const payload = await response.json().catch(() => ({}));
  const msg =
    payload?.error?.message ||
    payload?.message ||
    `HTTP ${response.status} ${response.statusText}`;

  if (response.status === 401 || response.status === 403) {
    throw new Error(`${providerName}: Geçersiz API Key (${response.status}).`);
  }
  if (response.status === 429) {
    throw new Error(`${providerName}: Rate limit aşıldı (429). Biraz bekleyin.`);
  }
  if (response.status === 404) {
    throw new Error(`${providerName}: Model bulunamadı (404) — farklı model seçin.`);
  }
  throw new Error(`${providerName} API Hatası: ${msg}`);
}

// =====================================================================
// SECTION 3 — Main Tab Grouping Workflow
// =====================================================================

async function runGrouping() {
  // ── 1. Load credentials from storage ──────────────────────────────────
  const stored = await chrome.storage.local.get(["apiKey", "provider", "model"]);
  const apiKey  = (stored.apiKey  || "").trim();
  const provider = stored.provider || "gemini";
  const model    = stored.model   || (PROVIDERS[provider]?.models[0]?.id ?? "");

  if (!apiKey) {
    setStatus("API Key bulunamadı! Lütfen ⚙ ayarlarını açıp kaydedin.", "error");
    return;
  }

  // ── 2. Collect & validate categories ─────────────────────────────────
  const categories = getCategories();
  if (categories.length === 0) {
    setStatus("Lütfen en az bir kategori girin!", "error");
    return;
  }

  groupBtn.disabled = true;
  setStatus("Sekmeler alınıyor...", "loading");

  try {
    // ── 3. Query & sanitize tabs ────────────────────────────────────────
    const allTabs = await chrome.tabs.query({ currentWindow: true });
    const tabs = allTabs
      .filter(t =>
        typeof t.id === "number" &&
        t.id >= 0 &&
        t.url &&
        !RESTRICTED_SCHEMES.some(s => t.url.startsWith(s))
      )
      .map(t => ({ id: t.id, title: t.title || "", url: t.url || "" }));

    if (tabs.length === 0) {
      setStatus("Düzenlenecek uygun açık sekme bulunamadı.", "idle");
      return;
    }

    const validTabIds = new Set(tabs.map(t => t.id));

    // ── 4. Build prompt & call AI ───────────────────────────────────────
    const provLabel = PROVIDERS[provider]?.label ?? provider;
    setStatus(`${provLabel} ile analiz ediliyor...`, "loading");

    const prompt  = buildPrompt(tabs, categories, junksEnabled);
    const rawText = await callAIProvider({ provider, model, apiKey, prompt });

    // ── 5. Parse JSON response ──────────────────────────────────────────
    const sanitized = rawText
      .replace(/```(?:json)?/gi, "")
      .replace(/```/g, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(sanitized);
    } catch (e) {
      throw new Error(`JSON ayrıştırma hatası: ${e.message}`);
    }

    if (!Array.isArray(parsed)) {
      throw new Error("AI yanıtı beklenen dizi formatında değil.");
    }

    // ── 6. Build category map (deduplicated) ────────────────────────────
    setStatus("Sekmeler gruplandırılıyor...", "loading");

    const liveTabs   = await chrome.tabs.query({ currentWindow: true });
    const liveTabIds = new Set(liveTabs.map(t => t.id));

    const categoryMap  = {};
    const assignedIds  = new Set();

    for (const item of parsed) {
      const tabId   = Number(item.tabId);
      const catName = typeof item.category === "string" ? item.category.trim() : "";

      if (!catName || !validTabIds.has(tabId) || !liveTabIds.has(tabId) || assignedIds.has(tabId)) {
        continue;
      }

      assignedIds.add(tabId);
      (categoryMap[catName] ??= []).push(tabId);
    }

    // ── 7. Ungroup existing groups to avoid stale ID errors ─────────────
    const toUngroup = [...assignedIds];
    if (toUngroup.length > 0) {
      try { await chrome.tabs.ungroup(toUngroup); } catch { /* non-fatal */ }
    }

    // ── 8. Create native tab groups ─────────────────────────────────────
    let groupsCreated = 0;

    for (const [catName, ids] of Object.entries(categoryMap)) {
      if (catName.toLowerCase() === "other") continue;

      // Strictly typed number[] validated as still live
      const numericIds = ids.filter(id =>
        typeof id === "number" && Number.isInteger(id) && liveTabIds.has(id)
      );

      if (numericIds.length === 0) continue;

      try {
        const groupId = await chrome.tabs.group({ tabIds: numericIds });
        if (typeof groupId === "number" && groupId > 0) {
          await chrome.tabGroups.update(groupId, { title: catName });
          groupsCreated++;
        }
      } catch (groupErr) {
        console.warn(`"${catName}" grubu hatası:`, groupErr);
      }
    }

    if (groupsCreated > 0) {
      setStatus(`✓ Sekmeler Başarıyla Gruplandı! (${groupsCreated} grup)`, "success");
    } else {
      setStatus("Hiçbir kategoriye sekme eşleştirilemedi.", "idle");
    }

  } catch (err) {
    console.error("[Smart Tab Organizer]", err);
    setStatus(err.message || "Bilinmeyen bir hata oluştu.", "error");
  } finally {
    groupBtn.disabled = false;
  }
}

// =====================================================================
// SECTION 4 — Initialization & Event Bindings
// =====================================================================

document.addEventListener("DOMContentLoaded", async () => {

  // ── 4.1 Render default category rows ─────────────────────────────────
  for (const cat of DEFAULT_CATEGORIES) {
    categoryList.appendChild(createCategoryRow(cat, false));
  }

  // ── 4.2 Load persisted settings ──────────────────────────────────────
  try {
    const stored = await chrome.storage.local.get(["apiKey", "provider", "model"]);
    const prov   = stored.provider ?? "gemini";
    const model  = stored.model    ?? null;

    if (PROVIDERS[prov]) providerSelect.value = prov;
    populateModels(providerSelect.value, model);

    if (stored.apiKey) {
      apiKeyInput.value = stored.apiKey;
    }

    updateIndicator(providerSelect.value, modelSelect.value, !!stored.apiKey);
  } catch (err) {
    console.error("Storage load error:", err);
    populateModels("gemini", null);
  }

  // ── 4.3 Settings panel toggle ─────────────────────────────────────────
  settingsBtn.addEventListener("click", () => {
    const isOpen = settingsPanel.classList.toggle("open");
    settingsBtn.classList.toggle("active", isOpen);
    settingsPanel.setAttribute("aria-hidden", String(!isOpen));
  });

  // ── 4.4 Provider change → repopulate models ───────────────────────────
  providerSelect.addEventListener("change", () => {
    populateModels(providerSelect.value, null);
  });

  // ── 4.5 Save credentials ──────────────────────────────────────────────
  saveCredBtn.addEventListener("click", async () => {
    const apiKey   = apiKeyInput.value.trim();
    const provider = providerSelect.value;
    const model    = modelSelect.value;

    if (!apiKey) {
      setStatus("API Key boş bırakılamaz.", "error");
      return;
    }

    try {
      await chrome.storage.local.set({ apiKey, provider, model });
      updateIndicator(provider, model, true);
      setStatus("API Key ve model tercihi kaydedildi!", "success");

      // Auto-close settings panel after save
      settingsPanel.classList.remove("open");
      settingsBtn.classList.remove("active");
      settingsPanel.setAttribute("aria-hidden", "true");
    } catch (err) {
      setStatus(`Kaydetme hatası: ${err.message}`, "error");
    }
  });

  // ── 4.6 Add category row ──────────────────────────────────────────────
  addCategoryBtn.addEventListener("click", () => {
    const row = createCategoryRow("", true);
    categoryList.appendChild(row);
    // Focus the new input
    row.querySelector("input")?.focus();
  });

  // ── 4.7 Junks toggle ──────────────────────────────────────────────────
  junksToggle.addEventListener("click", () => {
    junksEnabled = !junksEnabled;
    junksToggle.setAttribute("aria-checked", String(junksEnabled));
  });

  // Also allow clicking the whole toggle row
  document.getElementById("junksToggleRow").addEventListener("click", (e) => {
    if (e.target !== junksToggle && !junksToggle.contains(e.target)) {
      junksEnabled = !junksEnabled;
      junksToggle.setAttribute("aria-checked", String(junksEnabled));
    }
  });

  // ── 4.8 Primary action ────────────────────────────────────────────────
  groupBtn.addEventListener("click", runGrouping);
});
