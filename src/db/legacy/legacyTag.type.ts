import type { Tag } from '../tag.type';

export interface LegacyTag extends Omit<Tag, 'id'> {
  id?: number;
}
