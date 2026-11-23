import { DEMO_APPS } from '../app-spec/demo-models'
import type { AppModel } from '../app-spec/types'

// DEMO ONLY: the same domain models the web app tests use (fake sample rows, reserved 90000 phones), with the home line reworded for a phone.
// Each is pinned to a different mobile direction so the three demos look and behave differently.
export interface MobileDemo { key: string; prompt: string; seed: string; directionId: string; model: AppModel }

const onPhone = (m: AppModel): AppModel => ({ ...m, homeIntro: m.homeIntro.replace(/this phone or computer/i, 'this phone').replace(/this browser/gi, 'this phone') })
const by = (key: string) => DEMO_APPS.find(d => d.key === key)!

export const MOBILE_DEMOS: MobileDemo[] = [
  { key: 'khata', prompt: by('khata').prompt, seed: 'mob-1', directionId: 'm-ledger-calm', model: onPhone(by('khata').model) },
  { key: 'gym', prompt: by('gym').prompt, seed: 'mob-2', directionId: 'm-sport-energy', model: onPhone(by('gym').model) },
  { key: 'clinic', prompt: by('clinic').prompt, seed: 'mob-3', directionId: 'm-calm-sage', model: onPhone(by('clinic').model) },
]
