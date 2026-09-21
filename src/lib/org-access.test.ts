import { describe, it, expect } from 'vitest'
import { canViewOrgProject, canEditOrgProject, canManageOrgProject } from './org-access'

describe('canViewOrgProject', () => {
  it('allows any real role, denies null', () => {
    expect(canViewOrgProject('viewer')).toBe(true)
    expect(canViewOrgProject('member')).toBe(true)
    expect(canViewOrgProject('admin')).toBe(true)
    expect(canViewOrgProject('owner')).toBe(true)
    expect(canViewOrgProject(null)).toBe(false)
  })
})

describe('canEditOrgProject', () => {
  it('allows member/admin/owner, denies viewer and null', () => {
    expect(canEditOrgProject('member')).toBe(true)
    expect(canEditOrgProject('admin')).toBe(true)
    expect(canEditOrgProject('owner')).toBe(true)
    expect(canEditOrgProject('viewer')).toBe(false)
    expect(canEditOrgProject(null)).toBe(false)
  })
})

describe('canManageOrgProject', () => {
  it('allows only admin/owner', () => {
    expect(canManageOrgProject('admin')).toBe(true)
    expect(canManageOrgProject('owner')).toBe(true)
    expect(canManageOrgProject('member')).toBe(false)
    expect(canManageOrgProject('viewer')).toBe(false)
    expect(canManageOrgProject(null)).toBe(false)
  })
})
