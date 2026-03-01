export function validateOutput(output: string, profile: any) {
  if (profile.forbidden_patterns) {
    for (const pattern of profile.forbidden_patterns) {
      if (output.includes(pattern)) {
        throw new Error(`Violation: ${pattern}`);
      }
    }
  }

  return true;
}