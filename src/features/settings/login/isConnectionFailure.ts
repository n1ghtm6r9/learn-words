const CONNECTION_FAILURE = /could not connect|failed to fetch|network ?error|networkerror/i;

export function isConnectionFailure(message: string): boolean {
  return CONNECTION_FAILURE.test(message);
}
