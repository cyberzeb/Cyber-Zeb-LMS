export type ResourceKind = 'Syllabus' | 'Lecture Notes' | 'Reading' | 'Video'

export type QuizStatus = 'Open' | 'Locked' | 'Completed'

export type AssignmentStatus = 'Ready to submit' | 'Submitted' | 'Awaiting review'

export type EventType = 'Live class' | 'Exam' | 'Office hour' | 'Deadline'

export interface StudentStat {
	label: string
	value: string
	detail: string
}

export interface CourseResource {
	id: string
	title: string
	course: string
	kind: ResourceKind
	size: string
	updatedAt: string
	href: string
}

export interface QuizItem {
	id: string
	title: string
	course: string
	dueAt: string
	questions: number
	duration: string
	status: QuizStatus
	score?: string
}

export interface AssignmentItem {
	id: string
	title: string
	course: string
	dueAt: string
	brief: string
	acceptedFormats: string[]
	status: AssignmentStatus
	feedback?: string
}

export interface ScheduleItem {
	id: string
	title: string
	course: string
	startAt: string
	type: EventType
	location: string
	accent: string
}

export interface GradeItem {
	id: string
	course: string
	grade: string
	percent: number
	progress: number
	feedback: string
	instructor: string
	updatedAt: string
}

export interface StudentDashboardData {
	studentName: string
	program: string
	term: string
	standing: string
	stats: StudentStat[]
	resources: CourseResource[]
	quizzes: QuizItem[]
	assignments: AssignmentItem[]
	schedule: ScheduleItem[]
	grades: GradeItem[]
}
