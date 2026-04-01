const express = require("express");
const path = require("path");
const { createStorage } = require("./storage");

const app = express();
const port = process.env.PORT || 3000;
const host = process.env.HOST || "0.0.0.0";

const publicDir = path.join(__dirname, "public");

const defaultConfig = {
  schoolName: "智力运动学校",
  pageTitle: "定段赛倒计时",
  targetDate: "2026-07-11T09:00:00+08:00",
  theme: "ink-gold",
  showSeconds: true,
  slogans: [
    "围棋的理想是“中和”，又可理解为“调和”。 —— 吴清源",
    "学而时习之，不亦说乎？ —— 孔子",
    "敏而好学，不耻下问。 —— 孔子",
    "三人行，必有我师焉。 —— 孔子",
    "工欲善其事，必先利其器。 —— 孔子",
    "知之者不如好之者，好之者不如乐之者。 —— 孔子",
    "君子求诸己，小人求诸人。 —— 孔子",
    "不积跬步，无以至千里。 —— 荀子",
    "锲而不舍，金石可镂。 —— 荀子",
    "道虽迩，不行不至；事虽小，不为不成。 —— 荀子",
    "博学之，审问之，慎思之，明辨之，笃行之。 ——《中庸》",
    "苟日新，日日新，又日新。 ——《大学》",
    "合抱之木，生于毫末；九层之台，起于累土。 —— 老子",
    "天下难事，必作于易；天下大事，必作于细。 —— 老子",
    "千里之行，始于足下。 —— 老子",
    "胜人者有力，自胜者强。 —— 老子",
    "静胜躁，寒胜热。清静为天下正。 —— 老子",
    "知己知彼，百战不殆。 —— 孙子",
    "多算胜，少算不胜。 —— 孙子",
    "胜兵先胜而后求战，败兵先战而后求胜。 —— 孙子",
    "善战者，胜于易胜者也。 —— 孙子",
    "种树者必培其根，种德者必养其心。 —— 王阳明",
    "志不立，天下无可成之事。 —— 王阳明",
    "破山中贼易，破心中贼难。 —— 王阳明",
    "少年易老学难成，一寸光阴不可轻。 —— 朱熹",
    "问渠那得清如许？为有源头活水来。 —— 朱熹",
    "读书有三到，谓心到，眼到，口到。 —— 朱熹",
    "行是知之始，知是行之成。 —— 陶行知",
    "捧着一颗心来，不带半根草去。 —— 陶行知",
    "操千曲而后晓声，观千剑而后识器。 —— 刘勰"
  ]
};

let storage;

app.use(express.json({ limit: "1mb" }));
app.use(express.static(publicDir));

app.get("/healthz", (_req, res) => {
  res.json({ ok: true });
});

function normalizeConfig(input) {
  const slogans = Array.isArray(input.slogans)
    ? input.slogans
        .map((item) => String(item).trim())
        .filter(Boolean)
        .slice(0, 30)
    : [];

  return {
    schoolName: String(input.schoolName || "").trim() || defaultConfig.schoolName,
    pageTitle: String(input.pageTitle || "").trim() || defaultConfig.pageTitle,
    targetDate: String(input.targetDate || "").trim() || defaultConfig.targetDate,
    theme: String(input.theme || "").trim() || defaultConfig.theme,
    showSeconds: Boolean(input.showSeconds),
    slogans
  };
}

app.get("/api/config", async (_req, res, next) => {
  try {
    const config = await storage.readConfig();
    res.json(config);
  } catch (error) {
    next(error);
  }
});

app.post("/api/config", async (req, res, next) => {
  try {
    const normalized = normalizeConfig(req.body || {});
    const config = await storage.writeConfig(normalized);
    res.json({ ok: true, config });
  } catch (error) {
    next(error);
  }
});

app.get("/config", (_req, res) => {
  res.sendFile(path.join(publicDir, "config.html"));
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ ok: false, message: "服务器发生错误，请检查日志。" });
});

createStorage(defaultConfig)
  .then((createdStorage) => {
    storage = createdStorage;
    console.log(`Config storage mode: ${storage.mode}`);
  })
  .then(() => {
    app.listen(port, host, () => {
      console.log(`Server running at http://${host}:${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
  });
