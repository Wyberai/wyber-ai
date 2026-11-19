// The shared build-spec core. A pillar (website, web app, SaaS, mobile, replace-your-SaaS) supplies:
//   1. intents     the jobs it can recognise and a blueprint for each (screens or sections, entities, flows, modules)
//   2. a planner   direction + layout + motion + images + SEO, all from code and a seed
//   3. slots       what the model may write (copy, image subjects, translations) and a validator for it
//   4. a renderer  files built from kit components, never free-form
//   5. checks      the launch-ready items plus a proof check per intent
// Everything else lives here and is reused as is.
export * from './types'
export * from './random'
export * from './json'
export * from './claims'
export * from './images'
export * from './languages'
export * from './facts'
export * from './ui-strings'
export * from './ask'
