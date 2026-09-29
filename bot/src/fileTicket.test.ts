import { describe, expect, it } from 'vitest';
import { readFileTicket } from './readFileTicket';
import { signFileTicket } from './signFileTicket';

const TOKEN = '123456:TEST-token';
const FILE_ID = 'BQACAgIAAxkBAAIBZ2Z_file-id_42';

describe('file tickets', () => {
  it('lets the same user read the file id back', async () => {
    const ticket = await signFileTicket(FILE_ID, 42, TOKEN);

    await expect(readFileTicket(ticket, 42, TOKEN)).resolves.toBe(FILE_ID);
  });

  it('refuses a ticket issued to another user', async () => {
    const ticket = await signFileTicket(FILE_ID, 42, TOKEN);

    await expect(readFileTicket(ticket, 7, TOKEN)).resolves.toBeNull();
  });

  it('refuses a ticket pointing at a different file', async () => {
    const ticket = await signFileTicket(FILE_ID, 42, TOKEN);
    const forged = `other-file${ticket.slice(ticket.lastIndexOf('.'))}`;

    await expect(readFileTicket(forged, 42, TOKEN)).resolves.toBeNull();
    await expect(readFileTicket('no-signature', 42, TOKEN)).resolves.toBeNull();
  });
});
