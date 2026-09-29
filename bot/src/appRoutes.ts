import type { Env } from './env.type';
import { handleExport } from './handleExport';
import { handleFileRequest } from './handleFileRequest';

export const APP_ROUTES: Record<string, (request: Request, env: Env) => Promise<Response>> = {
  '/export': handleExport,
  '/file': handleFileRequest,
};
