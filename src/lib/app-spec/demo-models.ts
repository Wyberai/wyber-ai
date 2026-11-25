import type { AppModel } from './types'

// DEMO ONLY: stand-ins for what the model writes (the domain model). Same rules the validator enforces. Sample rows are fake and
// only load when the owner clicks "Load sample data (demo)". Phones are the reserved 90000 range.

export interface DemoApp { key: string; prompt: string; seed: string; model: AppModel }

export const DEMO_APPS: DemoApp[] = [
  {
    key: 'khata',
    prompt: 'A simple udhaar and billing book for a kirana shop in Surat: bills with items, who owes how much, and a WhatsApp reminder for late payers.',
    seed: 'app-1',
    model: {
      appName: 'Kirana Khata',
      tagline: 'Bills, udhaar and reminders in one place.',
      homeIntro: 'Write a bill, see who still owes you and nudge them on WhatsApp. Everything stays on this phone or computer.',
      entities: [
        {
          id: 'bills', label: 'Bills', singular: 'Bill', title: 'customer', blurb: 'Every bill you write, who it is for and whether it is paid.',
          status: 'status', finalStatuses: ['Paid'], due: 'dueDate', amount: 'owed', contact: 'phone',
          fields: [
            { id: 'customer', label: 'Customer', type: 'text', required: true },
            { id: 'phone', label: 'Phone', type: 'phone' },
            { id: 'billDate', label: 'Bill date', type: 'date' },
            { id: 'dueDate', label: 'Pay by', type: 'date' },
            { id: 'status', label: 'Status', type: 'select', options: ['Unpaid', 'Part paid', 'Paid'] },
            { id: 'owed', label: 'Still owed', type: 'money' },
          ],
          computed: [{ id: 'total', label: 'Bill total', kind: 'sumChild', entity: 'lines', field: 'amount', ref: 'bill' }],
          sample: [
            { customer: 'Ramesh Patel', phone: '90000 00001', billDate: '-20d', dueDate: '-6d', status: 'Unpaid', owed: 1840 },
            { customer: 'Sunita Shah', phone: '90000 00002', billDate: '-12d', dueDate: '+3d', status: 'Part paid', owed: 450 },
            { customer: 'Mohan Desai', phone: '90000 00003', billDate: '-30d', dueDate: '-15d', status: 'Paid', owed: 0 },
            { customer: 'Kavita Joshi', phone: '90000 00004', billDate: 'today', dueDate: '+10d', status: 'Unpaid', owed: 620 },
          ],
        },
        {
          id: 'lines', label: 'Bill lines', singular: 'Line', title: 'item', blurb: 'What went on each bill.',
          fields: [
            { id: 'bill', label: 'Bill', type: 'ref', ref: 'bills' },
            { id: 'item', label: 'Item', type: 'text', required: true },
            { id: 'quantity', label: 'Quantity', type: 'number' },
            { id: 'rate', label: 'Rate', type: 'money' },
            { id: 'amount', label: 'Amount', type: 'money' },
          ],
          sample: [
            { bill: 'Ramesh Patel', item: 'Rice, 25 kg', quantity: 1, rate: 1500, amount: 1500 },
            { bill: 'Ramesh Patel', item: 'Cooking oil, 1 litre', quantity: 2, rate: 170, amount: 340 },
            { bill: 'Sunita Shah', item: 'Tea, 500 g', quantity: 3, rate: 150, amount: 450 },
            { bill: 'Kavita Joshi', item: 'Atta, 10 kg', quantity: 1, rate: 420, amount: 420 },
            { bill: 'Kavita Joshi', item: 'Sugar, 5 kg', quantity: 1, rate: 200, amount: 200 },
          ],
        },
      ],
      metrics: [
        { id: 'owed', label: 'Still owed to you', kind: 'sum', entity: 'bills', field: 'owed', money: true },
        { id: 'late', label: 'Late payers', kind: 'countWhere', entity: 'bills', where: { field: 'dueDate', op: 'overdue' } },
        { id: 'unpaid', label: 'Unpaid bills', kind: 'countWhere', entity: 'bills', where: { field: 'status', op: 'eq', value: 'Unpaid' } },
        { id: 'paid', label: 'Paid bills', kind: 'countWhere', entity: 'bills', where: { field: 'status', op: 'eq', value: 'Paid' } },
      ],
    },
  },
  {
    key: 'clinic',
    prompt: 'Appointment book for a small physiotherapy clinic in Pune: patients, what time they come, reminders by WhatsApp and who missed their visit.',
    seed: 'app-1',
    model: {
      appName: 'Clinic Desk',
      tagline: 'Today at the clinic, at a glance.',
      homeIntro: 'See who is coming, remind them on WhatsApp the day before and spot missed visits. Patient details stay in this browser.',
      entities: [
        {
          id: 'visits', label: 'Appointments', singular: 'Appointment', title: 'patient', blurb: 'Booked visits, newest first.',
          status: 'status', finalStatuses: ['Done', 'Cancelled'], due: 'day', contact: 'phone',
          fields: [
            { id: 'patient', label: 'Patient', type: 'text', required: true },
            { id: 'phone', label: 'Phone', type: 'phone' },
            { id: 'day', label: 'Day', type: 'date', required: true },
            { id: 'time', label: 'Time', type: 'text' },
            { id: 'service', label: 'Treatment', type: 'select', options: ['First visit', 'Follow-up', 'Exercise review'] },
            { id: 'status', label: 'Status', type: 'select', options: ['Booked', 'Done', 'Cancelled'] },
          ],
          sample: [
            { patient: 'Anita Kulkarni', phone: '90000 00011', day: 'today', time: '10:30', service: 'Follow-up', status: 'Booked' },
            { patient: 'Rahul Deshmukh', phone: '90000 00012', day: '+1d', time: '11:00', service: 'First visit', status: 'Booked' },
            { patient: 'Meena Joshi', phone: '90000 00013', day: '-2d', time: '16:00', service: 'Exercise review', status: 'Booked' },
            { patient: 'Sanjay Pawar', phone: '90000 00014', day: '-3d', time: '09:30', service: 'Follow-up', status: 'Done' },
          ],
        },
        {
          id: 'patients', label: 'Patients', singular: 'Patient', title: 'name', blurb: 'The people you treat.',
          fields: [
            { id: 'name', label: 'Name', type: 'text', required: true },
            { id: 'phone', label: 'Phone', type: 'phone' },
            { id: 'notes', label: 'Notes', type: 'longtext' },
          ],
          sample: [
            { name: 'Anita Kulkarni', phone: '90000 00011', notes: 'Lower back, twice a week' },
            { name: 'Rahul Deshmukh', phone: '90000 00012', notes: 'Knee, after surgery' },
            { name: 'Meena Joshi', phone: '90000 00013', notes: 'Shoulder' },
          ],
        },
      ],
      metrics: [
        { id: 'booked', label: 'Booked visits', kind: 'countWhere', entity: 'visits', where: { field: 'status', op: 'eq', value: 'Booked' } },
        { id: 'missed', label: 'Past, not marked done', kind: 'countWhere', entity: 'visits', where: { field: 'day', op: 'overdue' } },
        { id: 'patients', label: 'Patients', kind: 'count', entity: 'patients' },
      ],
    },
  },
  {
    key: 'gym',
    prompt: 'Member register for a small gym in Ahmedabad: who has joined, when their fee runs out and the payments they made.',
    seed: 'app-1',
    model: {
      appName: 'Ironroom Register',
      tagline: 'Members, renewals and payments.',
      homeIntro: 'Know whose fee has run out, record a payment in a few taps and remind members on WhatsApp. Data stays in this browser.',
      entities: [
        {
          id: 'members', label: 'Members', singular: 'Member', title: 'name', blurb: 'Everyone who has joined and when their fee runs out.',
          status: 'status', finalStatuses: ['Ended'], due: 'paidUntil', contact: 'phone',
          fields: [
            { id: 'name', label: 'Name', type: 'text', required: true },
            { id: 'phone', label: 'Phone', type: 'phone' },
            { id: 'plan', label: 'Plan', type: 'select', options: ['Monthly', 'Quarterly', 'Yearly'] },
            { id: 'joined', label: 'Joined', type: 'date' },
            { id: 'paidUntil', label: 'Paid until', type: 'date' },
            { id: 'status', label: 'Status', type: 'select', options: ['Active', 'Frozen', 'Ended'] },
          ],
          sample: [
            { name: 'Karan Mehta', phone: '90000 00021', plan: 'Monthly', joined: '-90d', paidUntil: '+5d', status: 'Active' },
            { name: 'Isha Trivedi', phone: '90000 00022', plan: 'Quarterly', joined: '-60d', paidUntil: '-4d', status: 'Active' },
            { name: 'Dev Parmar', phone: '90000 00023', plan: 'Yearly', joined: '-200d', paidUntil: '+120d', status: 'Active' },
            { name: 'Nisha Rana', phone: '90000 00024', plan: 'Monthly', joined: '-150d', paidUntil: '-40d', status: 'Ended' },
          ],
        },
        {
          id: 'payments', label: 'Payments', singular: 'Payment', title: 'note', blurb: 'Fees received.',
          fields: [
            { id: 'member', label: 'Member', type: 'ref', ref: 'members' },
            { id: 'amount', label: 'Amount', type: 'money', required: true },
            { id: 'paidOn', label: 'Paid on', type: 'date' },
            { id: 'method', label: 'Method', type: 'select', options: ['Cash', 'UPI', 'Card'] },
            { id: 'note', label: 'Note', type: 'text' },
          ],
          sample: [
            { member: 'Karan Mehta', amount: 1500, paidOn: '-25d', method: 'UPI', note: 'Monthly fee' },
            { member: 'Isha Trivedi', amount: 4000, paidOn: '-64d', method: 'Cash', note: 'Quarterly fee' },
            { member: 'Dev Parmar', amount: 12000, paidOn: '-80d', method: 'UPI', note: 'Yearly fee' },
          ],
        },
      ],
      metrics: [
        { id: 'active', label: 'Active members', kind: 'countWhere', entity: 'members', where: { field: 'status', op: 'eq', value: 'Active' } },
        { id: 'lapsed', label: 'Fees run out', kind: 'countWhere', entity: 'members', where: { field: 'paidUntil', op: 'overdue' } },
        { id: 'received', label: 'Fees received', kind: 'sum', entity: 'payments', field: 'amount', money: true },
      ],
    },
  },
]
