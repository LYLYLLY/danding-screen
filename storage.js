const fs = require("fs/promises");
const path = require("path");
const { Pool } = require("pg");

const dataDir = path.join(__dirname, "data");
const configPath = path.join(dataDir, "config.json");
const CONFIG_ROW_ID = 1;

function normalizeStoredConfig(defaultConfig, parsed) {
  return {
    ...defaultConfig,
    ...parsed,
    slogans: Array.isArray(parsed?.slogans) && parsed.slogans.length > 0 ? parsed.slogans : defaultConfig.slogans
  };
}

async function createFileStorage(defaultConfig) {
  async function ensureConfig() {
    await fs.mkdir(dataDir, { recursive: true });

    try {
      await fs.access(configPath);
    } catch {
      await writeConfig(defaultConfig);
    }
  }

  async function readConfig() {
    await ensureConfig();
    const raw = await fs.readFile(configPath, "utf8");
    const parsed = JSON.parse(raw);
    return normalizeStoredConfig(defaultConfig, parsed);
  }

  async function writeConfig(config) {
    const merged = normalizeStoredConfig(defaultConfig, config);
    await fs.writeFile(configPath, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
    return merged;
  }

  await ensureConfig();

  return {
    mode: "file",
    readConfig,
    writeConfig
  };
}

async function createPostgresStorage(defaultConfig) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSL_DISABLE === "true" ? false : { rejectUnauthorized: false }
  });

  async function init() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_config (
        id INTEGER PRIMARY KEY,
        config JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const existing = await pool.query("SELECT config FROM app_config WHERE id = $1", [CONFIG_ROW_ID]);

    if (existing.rowCount === 0) {
      await pool.query(
        "INSERT INTO app_config (id, config) VALUES ($1, $2::jsonb)",
        [CONFIG_ROW_ID, JSON.stringify(defaultConfig)]
      );
    }
  }

  async function readConfig() {
    const result = await pool.query("SELECT config FROM app_config WHERE id = $1", [CONFIG_ROW_ID]);

    if (result.rowCount === 0) {
      await pool.query(
        "INSERT INTO app_config (id, config) VALUES ($1, $2::jsonb)",
        [CONFIG_ROW_ID, JSON.stringify(defaultConfig)]
      );
      return defaultConfig;
    }

    return normalizeStoredConfig(defaultConfig, result.rows[0].config);
  }

  async function writeConfig(config) {
    const merged = normalizeStoredConfig(defaultConfig, config);

    await pool.query(
      `
        INSERT INTO app_config (id, config, updated_at)
        VALUES ($1, $2::jsonb, NOW())
        ON CONFLICT (id)
        DO UPDATE SET config = EXCLUDED.config, updated_at = NOW()
      `,
      [CONFIG_ROW_ID, JSON.stringify(merged)]
    );

    return merged;
  }

  await init();

  return {
    mode: "postgres",
    readConfig,
    writeConfig
  };
}

async function createStorage(defaultConfig) {
  if (process.env.DATABASE_URL) {
    return createPostgresStorage(defaultConfig);
  }

  return createFileStorage(defaultConfig);
}

module.exports = {
  createStorage
};
