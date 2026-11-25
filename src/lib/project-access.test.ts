import { describe, it, expect } from 'vitest'
import { makeFakeDb } from '@/lib/agency/fake-db'
import { projectRole, canEditProject, mayActOnProject } from './project-access'

// Who may change a project. Owner, workspace editors and accepted editor collaborators: yes. Everyone else: no, even
// when the project is public.
function world() {
  return makeFakeDb({
    projects: [
      { id: 'solo', user_id: 'A', org_id: null, is_public: false },
      { id: 'public', user_id: 'A', org_id: null, is_public: true },
      { id: 'shared', user_id: 'A', org_id: 'W', is_public: false },
    ],
    organization_members: [
      { org_id: 'W', user_id: 'A', role: 'owner' }, { org_id: 'W', user_id: 'MEM', role: 'member' },
      { org_id: 'W', user_id: 'ADM', role: 'admin' }, { org_id: 'W', user_id: 'VIEW', role: 'viewer' },
      { org_id: 'OTHER', user_id: 'X', role: 'owner' },
    ],
    project_collaborators: [
      { project_id: 'solo', collaborator_id: 'EDIT', role: 'editor', status: 'accepted' },
      { project_id: 'solo', collaborator_id: 'WATCH', role: 'viewer', status: 'accepted' },
      { project_id: 'solo', collaborator_id: 'PENDING', role: 'editor', status: 'pending' },
    ],
  })
}

describe('project access', () => {
  it('the owner can edit', async () => {
    expect(await canEditProject(world(), 'A', 'solo')).toBe(true)
  })
  it('workspace members and admins can edit a shared project; a viewer cannot', async () => {
    const db = world()
    expect(await canEditProject(db, 'MEM', 'shared')).toBe(true)
    expect(await canEditProject(db, 'ADM', 'shared')).toBe(true)
    expect(await canEditProject(db, 'VIEW', 'shared')).toBe(false)
    expect((await projectRole(db, 'VIEW', 'shared')).role).toBe('org-viewer')
  })
  it('a member of ANOTHER workspace cannot touch it', async () => {
    expect(await canEditProject(world(), 'X', 'shared')).toBe(false)
  })
  it('workspace membership does not reach a personal project', async () => {
    expect(await canEditProject(world(), 'MEM', 'solo')).toBe(false)
  })
  it('an accepted editor collaborator can edit; a viewer or a pending invite cannot', async () => {
    const db = world()
    expect(await canEditProject(db, 'EDIT', 'solo')).toBe(true)
    expect(await canEditProject(db, 'WATCH', 'solo')).toBe(false)
    expect(await canEditProject(db, 'PENDING', 'solo')).toBe(false)
  })
  it('a stranger cannot edit a private project or a public one', async () => {
    const db = world()
    expect(await canEditProject(db, 'X', 'solo')).toBe(false)
    expect(await canEditProject(db, 'X', 'public')).toBe(false)
  })
  it('a project that does not exist is not editable, but is not blocked for routes that used to accept any id', async () => {
    const db = world()
    expect(await canEditProject(db, 'A', 'nope')).toBe(false)
    expect(await mayActOnProject(db, 'A', 'nope')).toBe(true)
    expect(await mayActOnProject(db, 'X', 'solo')).toBe(false)
    expect(await mayActOnProject(db, 'A', 'solo')).toBe(true)
  })
})
