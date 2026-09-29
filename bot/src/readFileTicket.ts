import { fileTicketSignature } from './fileTicketSignature';
import { safeEqual } from './safeEqual';

export async function readFileTicket(ticket: string, userId: number, botToken: string): Promise<string | null> {
  const separator = ticket.lastIndexOf('.');
  if (separator <= 0) return null;
  const fileId = ticket.slice(0, separator);
  const signature = ticket.slice(separator + 1);
  return safeEqual(await fileTicketSignature(fileId, userId, botToken), signature) ? fileId : null;
}
