// DEMO ONLY: a Replace-your-SaaS example (the features of the tool being replaced, and the domain model that covers them). Used by scripts/saas-spec-demo.mjs.
export const DEMO_REPLACE = {
  product: 'Acme Boards',
  category: 'project management',
  features: [
    { module: 'Work', name: 'Projects', description: 'Each piece of work with an owner and a due date' },
    { module: 'Work', name: 'Tasks', description: 'Steps inside a project' },
    { module: 'Reports', name: 'Overdue tasks', description: 'A count of tasks past their date', fit: 'lite' as const, note: 'a count only, no charts' },
  ],
  model: {
    appName: 'Work Board', tagline: 'Our own project tracker, nothing else.', homeIntro: 'Projects and their tasks, with the tasks that are late counted for you.',
    entities: [
      {
        id: 'projects', label: 'Projects', singular: 'Project', title: 'name', blurb: 'Each piece of work and who owns it.', status: 'stage', finalStatuses: ['Done'], due: 'due',
        fields: [{ id: 'name', label: 'Name', type: 'text' as const, required: true }, { id: 'owner', label: 'Owner', type: 'text' as const }, { id: 'stage', label: 'Stage', type: 'select' as const, options: ['Planned', 'Active', 'Done'] }, { id: 'due', label: 'Due', type: 'date' as const }],
        sample: [{ name: 'Website refresh', owner: 'Asha', stage: 'Active', due: '+7d' }, { name: 'Office move', owner: 'Ravi', stage: 'Planned', due: '+30d' }, { name: 'Audit', owner: 'Asha', stage: 'Done', due: '-10d' }],
      },
      {
        id: 'tasks', label: 'Tasks', singular: 'Task', title: 'task', blurb: 'The steps inside each project.', status: 'state', finalStatuses: ['Done'], due: 'by',
        fields: [{ id: 'task', label: 'Task', type: 'text' as const, required: true }, { id: 'project', label: 'Project', type: 'ref' as const, ref: 'projects' }, { id: 'state', label: 'State', type: 'select' as const, options: ['To do', 'Doing', 'Done'] }, { id: 'by', label: 'Do by', type: 'date' as const }],
        sample: [{ task: 'Draft the pages', project: 'Website refresh', state: 'Doing', by: '+2d' }, { task: 'Pick a date', project: 'Office move', state: 'To do', by: '-1d' }, { task: 'Sign off', project: 'Audit', state: 'Done', by: '-9d' }],
      },
    ],
    metrics: [
      { id: 'open', label: 'Open projects', kind: 'countWhere' as const, entity: 'projects', where: { field: 'stage', op: 'neq' as const, value: 'Done' } },
      { id: 'late', label: 'Overdue tasks', kind: 'countWhere' as const, entity: 'tasks', where: { field: 'by', op: 'overdue' as const } },
      { id: 'done', label: 'Tasks done', kind: 'countWhere' as const, entity: 'tasks', where: { field: 'state', op: 'eq' as const, value: 'Done' } },
    ],
  },
}
