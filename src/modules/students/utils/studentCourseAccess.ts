import { readCourses } from '../../../shared/storage/readers'
import { readDepartments } from '../../../shared/storage/readers'
import type { CourseRecord } from '../../institution/types'

export function readStudentAccessibleCourses(): CourseRecord[] {
  return readCourses()
}

export function readStudentDepartments() {
  return readDepartments()
}
