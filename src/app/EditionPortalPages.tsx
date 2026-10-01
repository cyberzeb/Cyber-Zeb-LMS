/**
 * Learner and trainer portal routes whose page differs by edition. A training
 * institute runs attendance per cohort session rather than per course.
 */
import { useOrganizationConfig } from '../shared/config/useOrganizationConfig'
import { InstructorAttendancePage } from '../modules/instructors/pages/instructorattendance'
import { StudentAttendancePage } from '../modules/students/pages/studentattendance'
import { LearnerCohortAttendancePage } from '../modules/training/learner/LearnerTrainingWidgets'
import { TrainerCohortsPage } from '../modules/training/trainer/TrainerCohortsPage'

export function EditionStudentAttendancePage() {
  const { edition } = useOrganizationConfig()
  return edition === 'training_organization' ? <LearnerCohortAttendancePage /> : <StudentAttendancePage />
}

export function EditionInstructorAttendancePage() {
  const { edition } = useOrganizationConfig()
  return edition === 'training_organization' ? <TrainerCohortsPage /> : <InstructorAttendancePage />
}
