/** Overdue Progress Review CSV – business report for learner_plan_due dashboard tile. */

export const OVERDUE_PROGRESS_REVIEW_CSV_HEADERS = [
  'Learner Name',
  'Email',
  'Mobile',
  'ULN',
  'National Insurance Number',
  'Job Title',
  'Learner Type',
  'Funding Body',
  'Awarding Body',
  'Registration Number',
  'Registration Date',
  'Plan Title',
  'Plan Type',
  'Trainer Name',
  'Location',
  'Start Date',
  'Duration',
  'Attended',
  'Status',
  'Feedback',
  'Reminder Email Sent At',
  'Trainer Reminder Email Sent At',
  'Review Date',
  'Planned Review Date',
  'Manager Name',
  'Last Login',
  'Assessor Comment',
  'Account Status',
  'Created At',
  'Updated At',
] as const

function escapeCsvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

function formatCsvDateOnly(value: unknown): string {
  if (value === null || value === undefined || value === '') return ''
  const date = value instanceof Date ? value : new Date(String(value))
  if (isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function formatCsvDateTime(value: unknown): string {
  if (value === null || value === undefined || value === '') return ''
  const date = value instanceof Date ? value : new Date(String(value))
  if (isNaN(date.getTime())) return ''
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

function formatText(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

function formatPlanStatus(value: unknown): string {
  if (value === null || value === undefined || value === '') return ''
  if (typeof value === 'boolean') return value ? 'Active' : 'Inactive'
  return formatText(value)
}

function learnerDisplayName(learner: Record<string, unknown> | null): string {
  if (!learner) return ''
  return `${formatText(learner.first_name)} ${formatText(learner.last_name)}`.trim()
}

function trainerDisplayName(assessor: unknown): string {
  if (!assessor || typeof assessor !== 'object') return ''
  const trainer = assessor as {
    first_name?: string | null
    last_name?: string | null
    user_name?: string | null
  }
  const fullName = `${trainer.first_name ?? ''} ${trainer.last_name ?? ''}`.trim()
  return fullName || formatText(trainer.user_name)
}

function accountStatus(learner: Record<string, unknown> | null): string {
  if (!learner) return ''
  const userId = learner.user_id
  if (!userId || typeof userId !== 'object') return ''
  return formatText((userId as { status?: string }).status)
}

function planRowToCells(
  plan: Record<string, unknown>,
  learner: Record<string, unknown> | null,
): string[] {
  return [
    learnerDisplayName(learner),
    learner ? formatText(learner.email) : '',
    learner ? formatText(learner.mobile) : '',
    learner ? formatText(learner.uln) : '',
    learner ? formatText(learner.national_ins_no) : '',
    learner ? formatText(learner.job_title) : '',
    learner ? formatText(learner.learner_type) : '',
    learner ? formatText(learner.funding_body) : '',
    learner ? formatText(learner.awarding_body) : '',
    learner ? formatText(learner.registration_number) : '',
    learner ? formatCsvDateOnly(learner.registration_date) : '',
    formatText(plan.title),
    formatText(plan.type),
    trainerDisplayName(plan.assessor_id),
    formatText(plan.location),
    formatCsvDateTime(plan.startDate),
    formatText(plan.Duration),
    formatText(plan.Attended),
    formatPlanStatus(plan.status),
    formatText(plan.feedback),
    formatCsvDateTime(plan.reminder_email_sent_at),
    formatCsvDateTime(plan.trainer_reminder_email_sent_at),
    learner ? formatCsvDateOnly(learner.review_date) : '',
    learner ? formatCsvDateOnly(learner.planned_review_date) : '',
    learner ? formatText(learner.manager_name) : '',
    learner ? formatCsvDateTime(learner.last_login) : '',
    learner ? formatText(learner.comment) : '',
    accountStatus(learner),
    formatCsvDateTime(plan.created_at),
    formatCsvDateTime(plan.updated_at),
  ]
}

function expandPlansToRows(
  plans: Record<string, unknown>[],
): string[][] {
  const rows: string[][] = []

  for (const plan of plans) {
    const learners = plan.learners

    if (!Array.isArray(learners) || learners.length === 0) {
      rows.push(planRowToCells(plan, null))
      continue
    }

    for (const learner of learners) {
      if (!learner || typeof learner !== 'object') continue
      rows.push(planRowToCells(plan, learner as Record<string, unknown>))
    }
  }

  return rows
}

export function buildOverdueProgressReviewCsv(
  plans: Record<string, unknown>[],
): string {
  const headerRow = [...OVERDUE_PROGRESS_REVIEW_CSV_HEADERS]
  const dataRows = expandPlansToRows(plans)

  return [headerRow, ...dataRows]
    .map((row) => row.map((cell) => escapeCsvCell(cell)).join(','))
    .join('\n')
}
