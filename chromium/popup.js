const extApi = typeof browser !== "undefined" ? browser : chrome;

function setMessage(text, cssClass) {
  const el = document.getElementById("message");
  el.className = cssClass || "";
  el.textContent = text;
}

function normalizeDomain(input) {
  if (!input) {
    return "";
  }

  let value = String(input).trim().toLowerCase();
  if (!value) {
    return "";
  }

  if (value.includes("://")) {
    try {
      value = new URL(value).hostname;
    } catch {
      return "";
    }
  }

  value = value.replace(/^\.+/, "").replace(/\/$/, "");
  if (!value || value.includes(" ")) {
    return "";
  }

  return value;
}

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return (
    d.getFullYear() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    "-" +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  );
}

function toNetscapeLine(cookie) {
  const domain = cookie.domain || "";
  const domainCol = cookie.httpOnly ? `#HttpOnly_${domain}` : domain;
  const includeSubdomains = cookie.hostOnly ? "FALSE" : "TRUE";
  const path = cookie.path || "/";
  const secure = cookie.secure ? "TRUE" : "FALSE";
  const expiry = Number.isFinite(cookie.expirationDate)
    ? Math.floor(cookie.expirationDate)
    : 0;
  const name = cookie.name || "";
  const value = cookie.value || "";

  return `${domainCol}\t${includeSubdomains}\t${path}\t${secure}\t${expiry}\t${name}\t${value}`;
}

function buildNetscapeFile(cookies) {
  const lines = [
    "# Netscape HTTP Cookie File",
    "# Generated locally by Web Cookie Exporter",
    "# Keep private and delete after use",
    ""
  ];

  for (const cookie of cookies) {
    lines.push(toNetscapeLine(cookie));
  }

  return lines.join("\n");
}

function dedupeCookies(cookies) {
  const map = new Map();
  for (const c of cookies) {
    const key = `${c.domain}|${c.path}|${c.name}|${c.storeId || ""}|${c.partitionKey ? JSON.stringify(c.partitionKey) : ""}`;
    map.set(key, c);
  }
  return Array.from(map.values());
}

async function getCurrentTabDomain() {
  const tabs = await extApi.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tabs || !tabs.length || !tabs[0].url) {
    return "";
  }

  const protocol = tabs[0].url.split(":")[0];
  if (!["http", "https"].includes(protocol)) {
    return "";
  }

  try {
    return normalizeDomain(new URL(tabs[0].url).hostname);
  } catch {
    return "";
  }
}

async function exportForDomain(rawDomain) {
  const domain = normalizeDomain(rawDomain);
  if (!domain) {
    setMessage("Invalid domain.", "err");
    return;
  }

  setMessage("Reading cookies...", "");

  const allCookies = await extApi.cookies.getAll({});
  const cookies = (allCookies || []).filter((cookie) => {
    const cd = normalizeDomain((cookie.domain || "").replace(/^\./, ""));
    if (!cd) {
      return false;
    }

    return (
      domain === cd ||
      domain.endsWith(`.${cd}`) ||
      cd.endsWith(`.${domain}`)
    );
  });
  const list = dedupeCookies(cookies);

  if (!list.length) {
    setMessage(`No cookies found for ${domain}.`, "err");
    return;
  }

  const content = buildNetscapeFile(list);
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const filename = `${domain.replace(/[^a-z0-9.-]/gi, "_")}-cookies-${timestamp()}.txt`;

  await extApi.downloads.download({
    url,
    filename,
    saveAs: true,
    conflictAction: "uniquify"
  });

  URL.revokeObjectURL(url);
  setMessage(`Exported ${list.length} cookies for ${domain}.`, "ok");
}

document.getElementById("exportCurrentBtn").addEventListener("click", async () => {
  try {
    const domain = await getCurrentTabDomain();
    if (!domain) {
      setMessage("Cannot detect current tab domain.", "err");
      return;
    }
    await exportForDomain(domain);
  } catch (err) {
    setMessage(`Export failed: ${err.message || String(err)}`, "err");
  }
});

document.getElementById("exportDomainBtn").addEventListener("click", async () => {
  try {
    const raw = document.getElementById("domainInput").value;
    await exportForDomain(raw);
  } catch (err) {
    setMessage(`Export failed: ${err.message || String(err)}`, "err");
  }
});
