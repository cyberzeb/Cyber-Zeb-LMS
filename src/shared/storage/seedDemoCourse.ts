import {
  createDemoLearningCourse,
  DEMO_LEARNING_COURSE_ID,
} from '../../modules/institution/data/demoLearningCourse'
import { STORAGE_EVENTS, STORAGE_KEYS } from './keys'
import { readCourses } from './readers'

/** Ensures the demo learning course exists with full module content. */
export function ensureDemoLearningCourse() {
  try {
    const demo = createDemoLearningCourse()
    const courses = readCourses()
    const existingIndex = courses.findIndex((c) => c.id === DEMO_LEARNING_COURSE_ID)

    if (existingIndex === -1) {
      window.localStorage.setItem(STORAGE_KEYS.courses, JSON.stringify([demo, ...courses]))
    } else {
      const merged = {
        ...demo,
        enrolledCount: courses[existingIndex].enrolledCount,
        instructorId: courses[existingIndex].instructorId ?? demo.instructorId,
        instructor: courses[existingIndex].instructor || demo.instructor,
      }
      const next = [...courses]
      next[existingIndex] = merged
      window.localStorage.setItem(STORAGE_KEYS.courses, JSON.stringify(next))
    }

    window.dispatchEvent(new CustomEvent(STORAGE_EVENTS.coursesUpdated))
  } catch {
    /* storage blocked */
  }
}
