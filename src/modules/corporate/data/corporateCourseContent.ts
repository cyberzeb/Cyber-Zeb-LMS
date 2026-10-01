/**
 * Lesson content for the corporate demo training modules (Horizon Bank).
 *
 * Every module has short readings and a knowledge check, so an employee can work
 * through a course end to end: finishing it completes the assignment and earns
 * the certification. Generic good-practice material for a demo, not bank policy.
 */
import type { CourseLessonQuestion, CourseModule } from '../../institution/types'

type Reading = { title: string; minutes: number; body: string }
type Check = { title: string; questions: Omit<CourseLessonQuestion, 'id' | 'type'>[] }

function build(courseId: string, sections: { title: string; readings: Reading[]; check?: Check }[]): CourseModule[] {
  return sections.map((section, m) => ({
    id: `${courseId}-m${m + 1}`,
    title: section.title,
    lessons: [
      ...section.readings.map((r, l) => ({
        id: `${courseId}-m${m + 1}-l${l + 1}`,
        title: r.title,
        type: 'reading' as const,
        durationMinutes: r.minutes,
        description: r.body,
      })),
      ...(section.check
        ? [
            {
              id: `${courseId}-m${m + 1}-check`,
              title: section.check.title,
              type: 'quiz' as const,
              durationMinutes: 5,
              description: 'Check your understanding before moving on.',
              questions: section.check.questions.map((q, i) => ({
                ...q,
                id: `${courseId}-m${m + 1}-q${i + 1}`,
                type: 'multiple-choice' as const,
              })),
            },
          ]
        : []),
    ],
  }))
}

export const CORPORATE_COURSE_MODULES: Record<string, CourseModule[]> = {
  c1: build('c1', [
    {
      title: 'Understanding money laundering',
      readings: [
        {
          title: 'What money laundering is',
          minutes: 8,
          body: `Money laundering disguises the criminal origin of funds so they appear legitimate.

**The three stages**
- **Placement** — criminal cash enters the financial system, often in small deposits.
- **Layering** — funds move through many transactions to hide their trail.
- **Integration** — "clean" money re-enters the economy as apparently lawful wealth.

Banks are a natural target at every stage, which is why every employee has a role in prevention.`,
        },
        {
          title: 'Red flags at the counter',
          minutes: 10,
          body: `Be alert to activity that does not fit what you know about the customer:

- Cash deposits just under reporting thresholds (**structuring**).
- Reluctance to provide identification or source of funds.
- Rapid movement of funds in and out with no clear purpose.
- Third parties depositing into an account they do not own.
- Transactions inconsistent with the customer's stated occupation.

**Never tip off** a customer that you are suspicious — escalate quietly.`,
        },
      ],
      check: {
        title: 'Knowledge check: AML basics',
        questions: [
          { prompt: 'Which stage moves money through many transactions to hide its origin?', options: ['Placement', 'Layering', 'Integration'], correctIndex: 1, explanation: 'Layering obscures the audit trail.' },
          { prompt: 'Several cash deposits just below the reporting threshold suggest:', options: ['Structuring', 'Normal saving', 'A system error'], correctIndex: 0, explanation: 'Splitting deposits to avoid reporting is structuring.' },
          { prompt: 'If you suspect a customer, you should:', options: ['Tell the customer', 'Escalate quietly to compliance', 'Ignore it'], correctIndex: 1, explanation: 'Tipping off is prohibited; report internally.' },
        ],
      },
    },
    {
      title: 'Know Your Customer (KYC)',
      readings: [
        {
          title: 'Customer due diligence',
          minutes: 10,
          body: `KYC means knowing who your customer really is and what activity to expect.

**Standard due diligence**
- Verify identity with valid, current documents.
- Confirm address and occupation.
- Understand the purpose of the account.

**Enhanced due diligence** applies to higher-risk customers, such as politically exposed persons (PEPs), and requires senior approval and source-of-wealth checks.`,
        },
        {
          title: 'Reporting suspicious activity',
          minutes: 7,
          body: `When something does not add up:

1. Record what you observed, factually.
2. Submit an internal suspicious activity report to the compliance team.
3. Continue to serve the customer normally.

Compliance decides whether to file with the financial intelligence unit. Reporting in good faith protects you.`,
        },
      ],
      check: {
        title: 'Knowledge check: KYC',
        questions: [
          { prompt: 'A politically exposed person requires:', options: ['No extra checks', 'Enhanced due diligence', 'Account refusal'], correctIndex: 1 },
          { prompt: 'Who decides whether to file an external report?', options: ['The teller', 'The compliance team', 'The customer'], correctIndex: 1 },
        ],
      },
    },
  ]),
  c2: build('c2', [
    {
      title: 'Everyday threats',
      readings: [
        {
          title: 'Phishing and social engineering',
          minutes: 9,
          body: `Most attacks start with a person, not a machine.

**Spot a phishing message**
- Urgency: "your account will be closed today".
- Mismatched sender addresses or links.
- Requests for passwords, codes or payments.

Hover over links before clicking. When in doubt, contact the sender through a channel you already trust.`,
        },
        {
          title: 'Passwords and multi-factor authentication',
          minutes: 7,
          body: `- Use long, unique passphrases — never reuse a work password elsewhere.
- Keep MFA on for every system that offers it.
- Never share one-time codes. The bank will never ask for them.`,
        },
      ],
      check: {
        title: 'Knowledge check: cyber awareness',
        questions: [
          { prompt: 'An email says your account closes today unless you log in now. This is most likely:', options: ['Routine IT maintenance', 'Phishing', 'A payroll update'], correctIndex: 1 },
          { prompt: 'A caller from "IT" asks for your MFA code. You should:', options: ['Read it out', 'Refuse and report the call', 'Email it instead'], correctIndex: 1 },
        ],
      },
    },
    {
      title: 'Protecting the bank',
      readings: [
        {
          title: 'Clean desk and device security',
          minutes: 6,
          body: `Lock your screen whenever you step away. Keep customer documents out of sight, use approved storage only, and report lost devices immediately — fast reporting lets IT wipe them.`,
        },
        {
          title: 'Reporting an incident',
          minutes: 5,
          body: `Clicked a suspicious link? Report it at once to the security desk. Early reports stop attacks spreading; nobody is penalised for honest mistakes reported quickly.`,
        },
      ],
      check: {
        title: 'Knowledge check: protecting the bank',
        questions: [
          { prompt: 'You clicked a link you now think was malicious. First step?', options: ['Wait and see', 'Report it to security immediately', 'Delete the email and forget it'], correctIndex: 1 },
        ],
      },
    },
  ]),
  c3: build('c3', [
    {
      title: 'Customer data and privacy',
      readings: [
        {
          title: 'What counts as personal data',
          minutes: 8,
          body: `Personal data is anything that identifies a person: names, ID numbers, account details, phone numbers, photos and transaction history.

Collect only what you need, use it only for the purpose it was collected for, and keep it no longer than required.`,
        },
        {
          title: 'Handling requests and breaches',
          minutes: 8,
          body: `- Verify identity before discussing any account.
- Share data only with authorised people, through approved channels.
- A misdirected email or lost file is a **data breach** — report it to the privacy officer the same day.`,
        },
      ],
      check: {
        title: 'Knowledge check: data privacy',
        questions: [
          { prompt: 'Before discussing an account on the phone you must:', options: ['Verify the caller’s identity', 'Ask for their password', 'Nothing'], correctIndex: 0 },
          { prompt: 'You emailed a statement to the wrong customer. This is:', options: ['Not important', 'A data breach to report today', 'Only a problem if they complain'], correctIndex: 1 },
        ],
      },
    },
  ]),
  c4: build('c4', [
    {
      title: 'Fraud at the front line',
      readings: [
        {
          title: 'Common fraud schemes',
          minutes: 9,
          body: `- **Identity fraud**: forged or borrowed documents to open accounts.
- **Account takeover**: criminals posing as the customer to change contact details.
- **Cheque and card fraud**: altered cheques, skimmed cards.
- **Authorised push-payment scams**: customers tricked into sending money themselves.`,
        },
        {
          title: 'Protecting vulnerable customers',
          minutes: 8,
          body: `Watch for customers who seem pressured, are accompanied by someone answering for them, or want to move large sums urgently. Slow the transaction down, ask open questions, and involve a supervisor.`,
        },
      ],
      check: {
        title: 'Knowledge check: fraud detection',
        questions: [
          { prompt: 'A customer wants to send their savings urgently to a new "investment". You should:', options: ['Process it quickly', 'Slow down, ask questions and involve a supervisor', 'Refuse service'], correctIndex: 1 },
          { prompt: 'Changing a customer’s phone number on a call without checks risks:', options: ['Account takeover', 'Faster service', 'Nothing'], correctIndex: 0 },
        ],
      },
    },
  ]),
  c5: build('c5', [
    {
      title: 'Service that customers remember',
      readings: [
        {
          title: 'Listening first',
          minutes: 7,
          body: `Great service starts with understanding the need. Let the customer finish, repeat back what you heard, and agree the next step before acting.`,
        },
        {
          title: 'Handling complaints',
          minutes: 8,
          body: `1. Acknowledge the problem and apologise for the experience.
2. Take ownership — do not pass the customer around.
3. Explain what will happen and by when.
4. Follow up and record the complaint so it can be fixed for everyone.`,
        },
      ],
      check: {
        title: 'Knowledge check: service',
        questions: [
          { prompt: 'The first step with an unhappy customer is to:', options: ['Explain the policy', 'Acknowledge the problem', 'Transfer them'], correctIndex: 1 },
        ],
      },
    },
  ]),
  c6: build('c6', [
    {
      title: 'Leading a team',
      readings: [
        {
          title: 'Setting clear expectations',
          minutes: 8,
          body: `People perform best when they know what good looks like. Agree goals, explain why they matter, and check in regularly rather than only at review time.`,
        },
        {
          title: 'Coaching and feedback',
          minutes: 9,
          body: `Give feedback soon and specifically: describe the situation, the behaviour you saw, and its impact. Ask how they see it and agree one improvement together.`,
        },
        {
          title: 'Keeping your team compliant',
          minutes: 6,
          body: `As a manager you are accountable for your team's mandatory training. Use the manager portal to see who is overdue, send reminders, and assign what their job role requires.`,
        },
      ],
      check: {
        title: 'Knowledge check: leadership',
        questions: [
          { prompt: 'Effective feedback is:', options: ['Saved for the annual review', 'Timely and specific', 'General praise only'], correctIndex: 1 },
          { prompt: 'Who is accountable for a team’s mandatory training being up to date?', options: ['Only HR', 'The team’s manager', 'Nobody'], correctIndex: 1 },
        ],
      },
    },
  ]),
}
