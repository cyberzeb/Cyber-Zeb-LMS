/**
 * Lesson content for the Training Edition demo (Apex Training Institute).
 *
 * Six catalog courses make up the demo programs. Each has short readings and a
 * knowledge check, so a learner can work through a program end to end and earn
 * its certificate. General good-practice material written for the demo.
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
              questions: section.check.questions.map((q, i) => ({ ...q, id: `${courseId}-m${m + 1}-q${i + 1}`, type: 'multiple-choice' as const })),
            },
          ]
        : []),
    ],
  }))
}

export const TRAINING_COURSE_MODULES: Record<string, CourseModule[]> = {
  t1: build('t1', [
    {
      title: 'What a project is',
      readings: [
        {
          title: 'Projects, programs and operations',
          minutes: 8,
          body: `A **project** is a temporary effort to create a unique result. It has a start, an end and a defined goal — unlike **operations**, which keep the business running day to day.

- A **program** groups related projects so their benefits are managed together.
- A **portfolio** is everything an organization invests in, prioritised against its strategy.

Knowing which one you are running tells you how to plan it and who decides.`,
        },
        {
          title: 'The triple constraint',
          minutes: 7,
          body: `Every project balances **scope**, **time** and **cost** — and quality depends on all three.

1. Add scope and you need more time or money.
2. Cut the budget and something else has to give.
3. Shorten the schedule and cost or risk goes up.

A good project manager makes these trade-offs visible early, so sponsors decide with open eyes.`,
        },
      ],
      check: {
        title: 'Knowledge check: project basics',
        questions: [
          { prompt: 'Which of these is a project?', options: ['Processing monthly payroll', 'Opening a new branch office', 'Answering customer calls'], correctIndex: 1, explanation: 'Opening a branch is temporary and unique.' },
          { prompt: 'The sponsor adds features but keeps the deadline. What usually has to change?', options: ['Nothing', 'Cost or resources', 'The project charter title'], correctIndex: 1, explanation: 'More scope in the same time needs more resources.' },
        ],
      },
    },
    {
      title: 'Planning the work',
      readings: [
        {
          title: 'Work breakdown structure',
          minutes: 10,
          body: `A **work breakdown structure (WBS)** splits the project into deliverables, then into smaller work packages you can estimate and assign.

- Break work down until a package takes roughly one to two weeks.
- Name deliverables as nouns ("Training manual"), not tasks.
- Every package has one owner.

If it is not in the WBS, it is not in the project.`,
        },
        {
          title: 'Schedules and the critical path',
          minutes: 10,
          body: `Link work packages by their dependencies and you get a network. The **critical path** is the longest chain through it — any delay on it delays the whole project.

- Tasks off the critical path have **float**: they can slip a little.
- Watch the critical path weekly; that is where your attention pays off.`,
        },
      ],
      check: {
        title: 'Knowledge check: planning',
        questions: [
          { prompt: 'What does a delay on the critical path do?', options: ['Nothing', 'Delays the project end date', 'Reduces cost'], correctIndex: 1 },
          { prompt: 'A good WBS work package should…', options: ['Have one owner', 'Last six months', 'Be named as a verb'], correctIndex: 0 },
        ],
      },
    },
  ]),
  t2: build('t2', [
    {
      title: 'Agile values',
      readings: [
        {
          title: 'Why agile',
          minutes: 7,
          body: `Agile teams deliver in **short iterations** and learn from real feedback instead of predicting everything up front.

It suits work where requirements change or are hard to know in advance — software, new services, process improvement.`,
        },
        {
          title: 'The Scrum framework',
          minutes: 9,
          body: `Scrum organises work into **sprints** of one to four weeks.

- **Product owner** — orders the backlog by value.
- **Scrum master** — removes obstacles and protects the process.
- **Developers** — build the increment.

Each sprint has planning, a daily stand-up, a review with stakeholders and a retrospective.`,
        },
      ],
      check: {
        title: 'Knowledge check: Scrum',
        questions: [
          { prompt: 'Who orders the product backlog?', options: ['Scrum master', 'Product owner', 'The sponsor'], correctIndex: 1 },
          { prompt: 'The retrospective is for…', options: ['Demonstrating the product', 'Improving how the team works', 'Estimating the budget'], correctIndex: 1 },
        ],
      },
    },
    {
      title: 'Running sprints',
      readings: [
        {
          title: 'User stories and estimation',
          minutes: 8,
          body: `A **user story** describes value from the user's point of view: *"As a customer, I want to reset my PIN so I can use my card again."*

Teams estimate stories in relative **story points** and use their **velocity** — points finished per sprint — to forecast.`,
        },
        {
          title: 'Kanban boards',
          minutes: 6,
          body: `A Kanban board shows work moving through columns such as **To do → Doing → Review → Done**.

Limit **work in progress** in each column: finishing beats starting.`,
        },
      ],
      check: {
        title: 'Knowledge check: sprints',
        questions: [{ prompt: 'Velocity is…', options: ['Hours worked per day', 'Story points completed per sprint', 'The number of team members'], correctIndex: 1 }],
      },
    },
  ]),
  t3: build('t3', [
    {
      title: 'Clean data',
      readings: [
        {
          title: 'Tables, not ranges',
          minutes: 7,
          body: `Turn raw data into an Excel **Table** (Ctrl + T) before you analyse it.

- Headers stay visible and formulas fill down automatically.
- New rows are picked up by charts and pivot tables.
- Structured references like \`[@Amount]\` read like sentences.`,
        },
        {
          title: 'Fixing messy data',
          minutes: 9,
          body: `Most analysis time goes on cleaning. Useful tools:

- **TRIM** and **CLEAN** remove stray spaces and characters.
- **Text to Columns** splits "Addis Ababa, Bole" into two fields.
- **Remove Duplicates** — but check which columns define a duplicate first.
- Keep the raw data untouched on its own sheet.`,
        },
      ],
      check: {
        title: 'Knowledge check: clean data',
        questions: [
          { prompt: 'Which function removes extra spaces?', options: ['TRIM', 'SUM', 'VLOOKUP'], correctIndex: 0 },
          { prompt: 'Why convert data to a Table?', options: ['It prints better', 'Formulas and charts grow with new rows', 'It encrypts the file'], correctIndex: 1 },
        ],
      },
    },
    {
      title: 'Summarising',
      readings: [
        {
          title: 'Lookups',
          minutes: 8,
          body: `**XLOOKUP** finds a value in one column and returns the matching value from another:

\`=XLOOKUP(A2, Products[Code], Products[Price])\`

It replaces VLOOKUP, works left or right, and lets you say what to show when nothing is found.`,
        },
        {
          title: 'Pivot tables',
          minutes: 10,
          body: `A **pivot table** summarises thousands of rows in seconds: drag *Region* to rows, *Month* to columns and *Sales* to values.

Add a **slicer** so others can filter without touching the layout.`,
        },
      ],
      check: {
        title: 'Knowledge check: summarising',
        questions: [{ prompt: 'Which tool summarises many rows by category fastest?', options: ['Pivot table', 'Conditional formatting', 'Freeze panes'], correctIndex: 0 }],
      },
    },
  ]),
  t4: build('t4', [
    {
      title: 'Power BI basics',
      readings: [
        {
          title: 'Getting data in',
          minutes: 8,
          body: `Power BI loads data from Excel, databases and web sources through **Power Query**, where you clean it once and refresh it forever.

Every step you apply is recorded, so next month's file goes through the same cleaning automatically.`,
        },
        {
          title: 'Data models',
          minutes: 9,
          body: `Split data into **fact tables** (sales, transactions) and **dimension tables** (products, dates, branches) and relate them.

This *star schema* keeps reports fast and measures correct.`,
        },
      ],
      check: {
        title: 'Knowledge check: modelling',
        questions: [{ prompt: 'In a star schema, "Sales" is usually a…', options: ['Dimension table', 'Fact table', 'Slicer'], correctIndex: 1 }],
      },
    },
    {
      title: 'Dashboards that get used',
      readings: [
        {
          title: 'Choosing visuals',
          minutes: 7,
          body: `Pick the chart for the question:

- **Trend over time** — line chart.
- **Compare categories** — bar chart.
- **Part of a whole** — only with few parts; otherwise a bar chart.
- **One key number** — a card, with its target.`,
        },
        {
          title: 'Designing for decisions',
          minutes: 8,
          body: `Put the most important number top-left. Keep one page to one question. Label with what the number means ("Overdue loans, % of book"), and show the target so people know if it is good or bad.`,
        },
      ],
      check: {
        title: 'Knowledge check: visuals',
        questions: [{ prompt: 'Best visual for monthly revenue over two years?', options: ['Pie chart', 'Line chart', 'Table'], correctIndex: 1 }],
      },
    },
  ]),
  t5: build('t5', [
    {
      title: 'From colleague to leader',
      readings: [
        {
          title: 'Your first 90 days',
          minutes: 8,
          body: `New supervisors succeed by **listening first**: meet each team member one-to-one, learn what they need, and agree how you will work together.

Set a few clear priorities rather than changing everything at once.`,
        },
        {
          title: 'Setting expectations',
          minutes: 7,
          body: `People perform best when they know what good looks like. Agree goals that are **specific, measurable and time-bound**, and write them down.`,
        },
      ],
      check: {
        title: 'Knowledge check: new leaders',
        questions: [{ prompt: 'A good first step for a new supervisor is…', options: ['Reorganising the team', 'One-to-one conversations with each member', 'Changing all processes'], correctIndex: 1 }],
      },
    },
    {
      title: 'Leading the team',
      readings: [
        {
          title: 'Delegation',
          minutes: 8,
          body: `Delegate the **outcome**, not just the task: explain why it matters, what success looks like and when you will check in.

Match the level of support to the person's experience with that task.`,
        },
        {
          title: 'Running good meetings',
          minutes: 6,
          body: `Every meeting needs a purpose, an agenda and an owner. End with **decisions and actions**: who does what by when.`,
        },
      ],
      check: {
        title: 'Knowledge check: delegation',
        questions: [{ prompt: 'When delegating, you should explain…', options: ['Only the deadline', 'The outcome and why it matters', 'Nothing — trust them'], correctIndex: 1 }],
      },
    },
  ]),
  t6: build('t6', [
    {
      title: 'Coaching conversations',
      readings: [
        {
          title: 'The GROW model',
          minutes: 8,
          body: `**GROW** structures a coaching conversation:

1. **Goal** — what do you want to achieve?
2. **Reality** — what is happening now?
3. **Options** — what could you do?
4. **Way forward** — what will you do, and when?`,
        },
        {
          title: 'Asking better questions',
          minutes: 6,
          body: `Open questions ("What would make this easier?") help people think for themselves. Resist giving the answer first.`,
        },
      ],
      check: {
        title: 'Knowledge check: coaching',
        questions: [{ prompt: 'In GROW, "R" stands for…', options: ['Results', 'Reality', 'Review'], correctIndex: 1 }],
      },
    },
    {
      title: 'Feedback that helps',
      readings: [
        {
          title: 'The SBI method',
          minutes: 7,
          body: `Describe the **Situation**, the **Behaviour** you saw and its **Impact**:

*"In yesterday's client meeting (S), you summarised the next steps clearly (B), so the client signed the same day (I)."*

It keeps feedback factual and easy to act on.`,
        },
        {
          title: 'Difficult conversations',
          minutes: 8,
          body: `Prepare, stay curious and focus on the future. Agree one or two concrete changes and a date to follow up.`,
        },
      ],
      check: {
        title: 'Knowledge check: feedback',
        questions: [{ prompt: 'SBI stands for…', options: ['Situation, Behaviour, Impact', 'Skill, Budget, Idea', 'Start, Build, Improve'], correctIndex: 0 }],
      },
    },
  ]),
}
