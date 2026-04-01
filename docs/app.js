const state = {
  config: null,
  sloganIndex: 0
};

const els = {
  schoolName: document.querySelector("[data-school-name]"),
  pageTitle: document.querySelector("[data-page-title]"),
  countdownValue: document.querySelector("[data-countdown-value]"),
  countdownDetail: document.querySelector("[data-countdown-detail]"),
  currentTime: document.querySelector("[data-current-time]"),
  currentDate: document.querySelector("[data-current-date]"),
  sloganText: document.querySelector("[data-slogan-text]"),
  sloganAuthor: document.querySelector("[data-slogan-author]"),
  targetInfo: document.querySelector("[data-target-info]")
};

async function fetchConfig() {
  if (window.RUNTIME_CONFIG) {
    return window.RUNTIME_CONFIG;
  }

  const response = await fetch("/api/config", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to load config.");
  }

  return response.json();
}

function formatDateLabel(date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
    timeZone: "Asia/Shanghai"
  }).format(date);
}

function formatTimeLabel(date, showSeconds) {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: showSeconds ? "2-digit" : undefined,
    hour12: false,
    timeZone: "Asia/Shanghai"
  }).format(date);
}

function calculateRemaining(targetDate, currentDate) {
  const remainingMs = targetDate.getTime() - currentDate.getTime();
  const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));

  return {
    remainingMs,
    remainingDays: Math.max(remainingDays, 0)
  };
}

function parseSlogan(value) {
  const raw = String(value || "").trim();
  const parts = raw.split(/\s*——\s*/);

  if (parts.length >= 2) {
    const author = parts.pop();
    return {
      text: parts.join(" —— ").trim(),
      author: `—— ${author.trim()}`
    };
  }

  return {
    text: raw,
    author: ""
  };
}

function renderSlogan(value) {
  const { text, author } = parseSlogan(value);
  els.sloganText.textContent = text;
  els.sloganAuthor.textContent = author;
}

function renderStatic(config) {
  document.title = `${config.schoolName} | ${config.pageTitle}`;
  els.schoolName.textContent = config.schoolName;
  els.pageTitle.textContent = config.pageTitle;
  els.targetInfo.textContent = `目标时间 ${formatDateLabel(new Date(config.targetDate))}`;

  const slogans = Array.isArray(config.slogans) ? config.slogans : [];
  state.sloganIndex = Math.floor(Math.random() * Math.max(slogans.length, 1));
  renderSlogan(slogans[state.sloganIndex] || "");
}

function renderClock() {
  if (!state.config) {
    return;
  }

  const now = new Date();
  const targetDate = new Date(state.config.targetDate);
  const { remainingMs, remainingDays } = calculateRemaining(targetDate, now);

  els.currentTime.textContent = formatTimeLabel(now, state.config.showSeconds);
  els.currentDate.textContent = formatDateLabel(now);

  if (remainingMs <= 0) {
    els.countdownValue.textContent = "0";
    els.countdownDetail.textContent = "定段赛已开始，沉着入局。";
    return;
  }

  els.countdownValue.textContent = String(remainingDays);
  els.countdownDetail.textContent = `距离 ${formatDateLabel(targetDate)} 还有 ${remainingDays} 天`;
}

function rotateSlogan() {
  if (!state.config || !Array.isArray(state.config.slogans) || state.config.slogans.length === 0) {
    return;
  }

  state.sloganIndex = (state.sloganIndex + 1) % state.config.slogans.length;
  renderSlogan(state.config.slogans[state.sloganIndex]);
}

async function init() {
  try {
    const config = await fetchConfig();
    state.config = config;
    renderStatic(config);
    renderClock();

    setInterval(renderClock, 1000);
    setInterval(rotateSlogan, 30000);
    setInterval(async () => {
      try {
        state.config = await fetchConfig();
        renderStatic(state.config);
      } catch (error) {
        console.error(error);
      }
    }, 60000);
  } catch (error) {
    console.error(error);
    els.countdownDetail.textContent = "配置加载失败，请检查服务器。";
  }
}

init();
