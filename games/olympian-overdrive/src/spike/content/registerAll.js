// registerAll — the ONLY place leaves are wired in. Adding a sport = one import +
// one register call. No core edits, no switch statements (architecture §4).
import { pickleRally } from '../sports/pickleRally.js';
import { hurdleDash } from '../sports/hurdleDash.js';

export function registerAllContent(registry) {
  registry.registerSport(pickleRally);
  registry.registerSport(hurdleDash);
}
