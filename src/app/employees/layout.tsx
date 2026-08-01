import { redirect } from 'next/navigation'

// Same gate as /ai-employees — this is the public gallery of the 100 role
// templates, not live yet either.
export default function EmployeesLayout() {
  redirect('/coming-soon?product=AI+Employees')
}
