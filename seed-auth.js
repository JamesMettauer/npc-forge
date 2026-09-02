// Seeds ~/.base44/auth/auth.json from BASE44_ACCESS_TOKEN so the Base44 CLI
// can start non-interactively (its built-in env seeding only works for JWT tokens).
const fs = require("fs");
const path = require("path");
const os = require("os");

const accessToken = process.env.BASE44_ACCESS_TOKEN;
if (!accessToken) {
  console.log("No BASE44_ACCESS_TOKEN set; skipping auth seed.");
  process.exit(0);
}

const authDir = path.join(os.homedir(), ".base44", "auth");
fs.mkdirSync(authDir, { recursive: true });

const auth = {
  accessToken,
  refreshToken: process.env.BASE44_REFRESH_TOKEN || accessToken,
  expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
  email: "dev@base44.local",
  name: "dev",
};

fs.writeFileSync(path.join(authDir, "auth.json"), JSON.stringify(auth));
console.log("Seeded Base44 CLI auth from BASE44_ACCESS_TOKEN.");
