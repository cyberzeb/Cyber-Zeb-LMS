import { useCallback } from 'react'
import { useApiCollection } from '../../../shared/hooks/useApiCollection'
import { createId } from '../../../shared/hooks/useLocalStorageState'
import { STORAGE_EVENTS, STORAGE_KEYS } from '../../../shared/storage/keys'
import {
  seedAssignments,
  seedLiveSessions,
  seedQuestions,
  seedQuizzes,
  seedStudentSubmissions,
} from '../data/assessmentSeedData'
import type {
  AssignmentRecord,
  LiveSessionRecord,
  QuestionRecord,
  QuizRecord,
  StudentSubmissionRecord,
} from '../types/assessments'

function notifyAssessmentsUpdated() {
  window.dispatchEvent(new CustomEvent(STORAGE_EVENTS.assessmentsUpdated))
}

export function useLiveSessions() {
  const [records, setRecordsRaw] = useApiCollection<LiveSessionRecord[]>(
    STORAGE_KEYS.liveSessions,
    seedLiveSessions,
  )

  const setRecords = useCallback(
    (updater: LiveSessionRecord[] | ((prev: LiveSessionRecord[]) => LiveSessionRecord[])) => {
      setRecordsRaw(updater)
      notifyAssessmentsUpdated()
    },
    [setRecordsRaw],
  )

  const createSession = useCallback(
    (input: Omit<LiveSessionRecord, 'id'>) => {
      const record: LiveSessionRecord = { ...input, id: createId('ls') }
      setRecords((prev) => [record, ...prev])
      return record
    },
    [setRecords],
  )

  const updateSession = useCallback(
    (id: string, patch: Partial<LiveSessionRecord>) => {
      setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
    },
    [setRecords],
  )

  const deleteSession = useCallback(
    (id: string) => {
      setRecords((prev) => prev.filter((r) => r.id !== id))
    },
    [setRecords],
  )

  return { records, setRecords, createSession, updateSession, deleteSession }
}

export function useAssignmentRecords() {
  const [records, setRecordsRaw] = useApiCollection<AssignmentRecord[]>(
    STORAGE_KEYS.assignments,
    seedAssignments,
  )

  const setRecords = useCallback(
    (updater: AssignmentRecord[] | ((prev: AssignmentRecord[]) => AssignmentRecord[])) => {
      setRecordsRaw(updater)
      notifyAssessmentsUpdated()
    },
    [setRecordsRaw],
  )

  const createAssignment = useCallback(
    (input: Omit<AssignmentRecord, 'id'>) => {
      const record: AssignmentRecord = { ...input, id: createId('asg') }
      setRecords((prev) => [record, ...prev])
      return record
    },
    [setRecords],
  )

  const updateAssignment = useCallback(
    (id: string, patch: Partial<AssignmentRecord>) => {
      setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
    },
    [setRecords],
  )

  const deleteAssignment = useCallback(
    (id: string) => {
      setRecords((prev) => prev.filter((r) => r.id !== id))
    },
    [setRecords],
  )

  return { records, setRecords, createAssignment, updateAssignment, deleteAssignment }
}

export function useQuizzes() {
  const [records, setRecordsRaw] = useApiCollection<QuizRecord[]>(
    STORAGE_KEYS.quizzes,
    seedQuizzes,
  )

  const setRecords = useCallback(
    (updater: QuizRecord[] | ((prev: QuizRecord[]) => QuizRecord[])) => {
      setRecordsRaw(updater)
      notifyAssessmentsUpdated()
    },
    [setRecordsRaw],
  )

  const createQuiz = useCallback(
    (input: Omit<QuizRecord, 'id'>) => {
      const record: QuizRecord = { ...input, id: createId('quiz') }
      setRecords((prev) => [record, ...prev])
      return record
    },
    [setRecords],
  )

  const updateQuiz = useCallback(
    (id: string, patch: Partial<QuizRecord>) => {
      setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
    },
    [setRecords],
  )

  const deleteQuiz = useCallback(
    (id: string) => {
      setRecords((prev) => prev.filter((r) => r.id !== id))
    },
    [setRecords],
  )

  return { records, setRecords, createQuiz, updateQuiz, deleteQuiz }
}

export function useQuestionBank() {
  const [records, setRecordsRaw] = useApiCollection<QuestionRecord[]>(
    STORAGE_KEYS.questionBank,
    seedQuestions,
  )

  const setRecords = useCallback(
    (updater: QuestionRecord[] | ((prev: QuestionRecord[]) => QuestionRecord[])) => {
      setRecordsRaw(updater)
      notifyAssessmentsUpdated()
    },
    [setRecordsRaw],
  )

  const createQuestion = useCallback(
    (input: Omit<QuestionRecord, 'id' | 'createdAt'>) => {
      const record: QuestionRecord = {
        ...input,
        id: createId('q'),
        createdAt: new Date().toISOString(),
      }
      setRecords((prev) => [record, ...prev])
      return record
    },
    [setRecords],
  )

  const updateQuestion = useCallback(
    (id: string, patch: Partial<QuestionRecord>) => {
      setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
    },
    [setRecords],
  )

  const deleteQuestion = useCallback(
    (id: string) => {
      setRecords((prev) => prev.filter((r) => r.id !== id))
    },
    [setRecords],
  )

  return { records, setRecords, createQuestion, updateQuestion, deleteQuestion }
}

export function useStudentSubmissions() {
  const [records, setRecordsRaw] = useApiCollection<StudentSubmissionRecord[]>(
    STORAGE_KEYS.studentSubmissions,
    seedStudentSubmissions,
  )

  const setRecords = useCallback(
    (
      updater:
        | StudentSubmissionRecord[]
        | ((prev: StudentSubmissionRecord[]) => StudentSubmissionRecord[]),
    ) => {
      setRecordsRaw(updater)
      notifyAssessmentsUpdated()
    },
    [setRecordsRaw],
  )

  const submitAssignment = useCallback(
    (
      studentId: string,
      assignmentId: string,
      attachmentName: string,
      maxScore: number,
    ) => {
      const now = new Date().toISOString()
      setRecords((prev) => {
        const existing = prev.find(
          (s) =>
            s.studentId === studentId &&
            s.assessmentType === 'assignment' &&
            s.assessmentId === assignmentId,
        )
        if (existing) {
          return prev.map((s) =>
            s.id === existing.id
              ? {
                  ...s,
                  status: 'submitted' as const,
                  submittedAt: now,
                  attachmentName,
                  maxScore,
                }
              : s,
          )
        }
        return [
          {
            id: createId('sub'),
            studentId,
            assessmentType: 'assignment' as const,
            assessmentId: assignmentId,
            status: 'submitted' as const,
            submittedAt: now,
            attachmentName,
            maxScore,
          },
          ...prev,
        ]
      })
    },
    [setRecords],
  )

  const submitQuizAttempt = useCallback(
    (
      studentId: string,
      quizId: string,
      score: number,
      maxScore: number,
    ) => {
      const now = new Date().toISOString()
      setRecords((prev) => {
        const existing = prev.find(
          (s) =>
            s.studentId === studentId &&
            s.assessmentType === 'quiz' &&
            s.assessmentId === quizId,
        )
        if (existing) {
          return prev.map((s) =>
            s.id === existing.id
              ? {
                  ...s,
                  status: 'graded' as const,
                  score,
                  maxScore,
                  submittedAt: now,
                }
              : s,
          )
        }
        return [
          {
            id: createId('sub'),
            studentId,
            assessmentType: 'quiz' as const,
            assessmentId: quizId,
            status: 'graded' as const,
            score,
            maxScore,
            submittedAt: now,
          },
          ...prev,
        ]
      })
    },
    [setRecords],
  )

  const gradeSubmission = useCallback(
    (
      submissionId: string,
      score: number,
      feedback: string,
      maxScore: number,
    ) => {
      setRecords((prev) =>
        prev.map((s) =>
          s.id === submissionId
            ? { ...s, status: 'graded' as const, score, feedback, maxScore }
            : s,
        ),
      )
    },
    [setRecords],
  )

  return {
    records,
    setRecords,
    submitAssignment,
    submitQuizAttempt,
    gradeSubmission,
  }
}
