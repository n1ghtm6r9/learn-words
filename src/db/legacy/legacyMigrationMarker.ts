export function legacyMigrationMarker(databaseName: string): string {
  return `legacyMigrated:${databaseName}`;
}
