import { describe, it, expect } from 'vitest'
import { can, type OrgRole, type OrgCapability } from './rbac'

const ALL_CAPABILITIES: OrgCapability[] = [
  'org.manage_settings', 'org.manage_billing', 'org.manage_sso', 'org.view_audit_logs',
  'org.invite_members', 'org.remove_members', 'org.change_member_role',
  'project.view', 'project.create', 'project.update', 'project.delete',
]
const ALL_ROLES: OrgRole[] = ['owner', 'admin', 'member', 'viewer']

describe('can()', () => {
  it('owner has every capability', () => {
    for (const cap of ALL_CAPABILITIES) expect(can('owner', cap)).toBe(true)
  })

  it('admin has everything except billing', () => {
    for (const cap of ALL_CAPABILITIES) {
      expect(can('admin', cap)).toBe(cap !== 'org.manage_billing')
    }
  })

  it('member can view/create/update projects but not manage the org', () => {
    expect(can('member', 'project.view')).toBe(true)
    expect(can('member', 'project.create')).toBe(true)
    expect(can('member', 'project.update')).toBe(true)
    expect(can('member', 'project.delete')).toBe(false)
    expect(can('member', 'org.manage_settings')).toBe(false)
    expect(can('member', 'org.invite_members')).toBe(false)
  })

  it('viewer can only view projects', () => {
    expect(can('viewer', 'project.view')).toBe(true)
    for (const cap of ALL_CAPABILITIES.filter((c) => c !== 'project.view')) {
      expect(can('viewer', cap)).toBe(false)
    }
  })

  it('every role x capability combination resolves to a boolean (no undefined matrix gaps)', () => {
    for (const role of ALL_ROLES) {
      for (const cap of ALL_CAPABILITIES) {
        expect(typeof can(role, cap)).toBe('boolean')
      }
    }
  })
})
