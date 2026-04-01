const form = document.querySelector("[data-config-form]");
const statusText = document.querySelector("[data-status-text]");

function joinSlogans(slogans) {
  return Array.isArray(slogans) ? slogans.join("\n") : "";
}

function splitSlogans(text) {
  return text
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 30);
}

async function loadConfig() {
  const response = await fetch("/api/config", { cache: "no-store" });
  const config = await response.json();

  form.schoolName.value = config.schoolName || "";
  form.pageTitle.value = config.pageTitle || "";
  form.targetDate.value = (config.targetDate || "").slice(0, 16);
  form.showSeconds.checked = Boolean(config.showSeconds);
  form.theme.value = config.theme || "ink-gold";
  form.slogans.value = joinSlogans(config.slogans);
}

async function saveConfig(event) {
  event.preventDefault();
  statusText.textContent = "保存中...";

  const payload = {
    schoolName: form.schoolName.value.trim(),
    pageTitle: form.pageTitle.value.trim(),
    targetDate: form.targetDate.value,
    showSeconds: form.showSeconds.checked,
    theme: form.theme.value,
    slogans: splitSlogans(form.slogans.value)
  };

  const response = await fetch("/api/config", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    statusText.textContent = "保存失败，请稍后重试。";
    return;
  }

  statusText.textContent = "保存成功，展示页会在 1 分钟内自动同步。";
}

form.addEventListener("submit", saveConfig);
loadConfig().catch((error) => {
  console.error(error);
  statusText.textContent = "配置加载失败，请检查服务是否正常。";
});
