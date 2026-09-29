export function webAppButton(text: string, url: string) {
  return { text, web_app: { url } };
}
