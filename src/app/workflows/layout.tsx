import { redirect } from 'next/navigation'

// Same gate as /flows — this is the public workflow-template gallery.
export default function WorkflowsLayout() {
  redirect('/coming-soon?product=Workflows')
}
