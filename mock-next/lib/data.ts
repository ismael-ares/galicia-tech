import sample from './sample.json';
export type Event = {
  id: string; title: string; start: string; end: string | null; dateLabel: string; timeLabel: string;
  city: string; community: string; place: string; price: string; requirements: string; statusNote: string;
  cardNote?: string; description: string[]; sourceIds?: string[];
  sources: {label: string; url: string}[]; registration: {label: string; url: string} | null;
};
export type Source = {id: string; name: string; url: string; city: string; platform: string; enabled: boolean; checkedAt?: string; method?: string; note?: string};
export type Decision = {status: 'approved' | 'pending' | 'discarded'; value?: string; note?: string};
export const events = sample.events as Event[];
export const sources = sample.sources as Source[];
export const cases = sample.cases;
export const ranking = sample.ranking;
export const covers = sample.covers;
export const day = (value: string) => new Intl.DateTimeFormat('es-ES', {day: '2-digit', timeZone: 'Europe/Madrid'}).format(new Date(value));
export const month = (value: string) => new Intl.DateTimeFormat('es-ES', {month: 'short', timeZone: 'Europe/Madrid'}).format(new Date(value)).replace('.', '');
export function topic(event: Event) {
  if (/flutter/i.test(event.title)) return 'Desarrollo móvil';
  if (/hacktober/i.test(event.title)) return 'Open source';
  if (/wordpress/i.test(event.community)) return 'Comunidad';
  if (/devfest/i.test(event.title)) return 'Conferencia';
  if (/\bia\b|\bai\b|coding/i.test(event.title)) return 'Inteligencia artificial';
  return 'Tecnología';
}
