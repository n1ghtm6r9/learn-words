import { fileTicketSignature } from './fileTicketSignature';

export async function signFileTicket(fileId: string, userId: number, botToken: string): Promise<string> {
  return `${fileId}.${await fileTicketSignature(fileId, userId, botToken)}`;
}
