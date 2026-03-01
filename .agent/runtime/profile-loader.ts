import fs from "fs";
import path from "path";

export function loadProfile(agent: "cloud" | "cli" | "local") {
  const profilePath = path.resolve(
    process.cwd(),
    `.agent/profile/${agent}.json`
  );

  return JSON.parse(fs.readFileSync(profilePath, "utf-8"));
}