export function routeTask(taskType: string) {
  if (taskType === "mass_generation") return "local";
  if (taskType === "refactor_large") return "local";
  if (taskType === "ci_debug") return "cli";
  return "cloud";
}