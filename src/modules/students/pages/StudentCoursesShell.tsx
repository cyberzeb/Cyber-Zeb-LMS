import { useLocation } from 'react-router-dom'
import { StudentCoursesPage } from './studentcourses'
import { StudentCourseLearnPage } from './StudentCourseLearnPage'

/**
 * Renders exactly one view for the courses section.
 * Avoids nested outlets so the lesson page fully unmounts when returning to the list.
 */
export function StudentCoursesShell() {
  const { pathname } = useLocation()
  const isLearnView = /\/courses\/[^/]+\/learn/.test(pathname)

  if (isLearnView) {
    return <StudentCourseLearnPage key={pathname} />
  }

  return <StudentCoursesPage key="student-courses-list" />
}
