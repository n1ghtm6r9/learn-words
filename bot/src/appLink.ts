export function appLink(appUrl: string, params: Record<string, string>): string {
  const url = new URL(appUrl);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return url.toString();
}
