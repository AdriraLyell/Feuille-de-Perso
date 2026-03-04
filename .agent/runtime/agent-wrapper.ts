import { loadProfile } from "./profile-loader";

export async function callAgent(agent: string, taskType: string, prompt: string) {
  const profile = loadProfile(agent);

  const temperature =
    profile.temperature_by_task?.[taskType] ??
    profile.base_temperature ??
    profile.temperature;

  const payload = {
    prompt,
    temperature,
    max_tokens: profile.max_tokens
  };

  return execute(agent, payload);
}