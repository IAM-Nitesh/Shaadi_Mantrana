export function getUserCompleteness(user: any): number {
  if (!user) return 0;
  const top = user.profileCompleteness;
  const nested = user.profile?.profileCompleteness;
  const legacy = user.profileCompleted ? 100 : undefined;
  const value = top ?? nested ?? legacy ?? 0;
  return typeof value === 'number' ? value : (parseInt(value) || 0);
}
