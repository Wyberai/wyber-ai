import { describe, it, expect } from 'vitest'
import { matchesFixedPlan } from './guide'

describe('fixed plans match only when the words fit', () => {
  it('a tailor who tracks orders in a notebook does not get the delivery-driver plan', () => {
    expect(matchesFixedPlan('problem', 'tailoring orders in a notebook, customers ask when the suit is ready')).toBe(false)
  })
  it('real delivery problems still get the delivery plan', () => {
    expect(matchesFixedPlan('problem', 'My drivers deliver orders but I have no proof they arrived')).toBe(true)
  })
  it('the other examples on the page still match their plans', () => {
    expect(matchesFixedPlan('problem', 'I get 40 invoices a week on paper and do not know who has paid')).toBe(true)
    expect(matchesFixedPlan('problem', 'I track my staff attendance in a notebook')).toBe(true)
  })
})
