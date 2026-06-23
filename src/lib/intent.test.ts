import { describe, it, expect } from 'vitest'
import { classifyIntent } from './intent'

describe('classifyIntent — conversational (CHAT)', () => {
  const chats = [
    'done?',
    'is it done?',
    'is it working?',
    'does this work?',
    'what next?',
    "what's next?",
    'thanks',
    'thank you!',
    'ok',
    'looks good',
    'perfect',
    'what does this button do?',
    'why is the page blank?',
    'how do I deploy this?',
  ]
  for (const msg of chats) {
    it(`"${msg}" → CHAT (with files)`, () => {
      expect(classifyIntent(msg, true)).toBe('CHAT')
    })
  }

  it('question with no files yet → CHAT', () => {
    expect(classifyIntent('what can you build?', false)).toBe('CHAT')
  })
})

describe('classifyIntent — edits to an existing app (EDIT)', () => {
  const edits = [
    'add a settings page',
    'Connect Supabase', // the original loop-bug trigger
    'make the header sticky',
    'remove the footer',
    'change the theme to dark',
    'fix the login button',
    'can you make it dark mode?',
    'could you add a search bar?',
    'please center the title',
  ]
  for (const msg of edits) {
    it(`"${msg}" → EDIT (with files)`, () => {
      expect(classifyIntent(msg, true)).toBe('EDIT')
    })
  }
})

describe('classifyIntent — net-new builds (BUILD)', () => {
  const builds = [
    'build a CRM',
    'a todo app with dark mode',
    'create a landing page for my startup',
    'make a kanban board',
  ]
  for (const msg of builds) {
    it(`"${msg}" → BUILD (no files)`, () => {
      expect(classifyIntent(msg, false)).toBe('BUILD')
    })
  }
})

describe('classifyIntent — edges', () => {
  it('empty message with files → AMBIGUOUS', () => {
    expect(classifyIntent('', true)).toBe('AMBIGUOUS')
  })
  it('empty message, no files → BUILD', () => {
    expect(classifyIntent('', false)).toBe('BUILD')
  })
  it('vague statement with files and no verb/question → AMBIGUOUS', () => {
    expect(classifyIntent('the sidebar on the right side over there', true)).toBe('AMBIGUOUS')
  })
  it('short verbless fragment with files → CHAT', () => {
    expect(classifyIntent('the footer', true)).toBe('CHAT')
  })
})
