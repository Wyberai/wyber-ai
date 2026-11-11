// The anonymous door counters. Shared by the browser helper and the API route, so the two can never disagree about what is
// allowed. A counter, not a log: a door and a step, nothing about the person.

export const DOORS = ['home', 'solve', 'create', 'agencies'] as const
export type Door = (typeof DOORS)[number]

export const STEPS = [
  'view',          // the page was opened
  'door_solve', 'door_create', 'door_agencies', 'door_scroll', // which door was chosen on the homepage
  'quick_submit',  // the homepage quick box
  'example_click', // a suggested example was used
  'sketch',        // a plan was shown
  'sketch_ai',     // ...and it was written for their words (not a canned shape)
  'build_click',   // "Build this"
  'demo_play',     // the watch-it-build demo or the client-page demo was used
  'start_click',   // a main call to action
] as const
export type Step = (typeof STEPS)[number]

export function isDoorEvent(door: unknown, step: unknown): door is Door {
  return typeof door === 'string' && typeof step === 'string' && (DOORS as readonly string[]).includes(door) && (STEPS as readonly string[]).includes(step)
}
