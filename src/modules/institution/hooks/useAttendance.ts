import { useCallback } from 'react'
import { useLocalStorageState } from '../../../shared/hooks/useLocalStorageState'
import { STORAGE_EVENTS, STORAGE_KEYS } from '../../../shared/storage/keys'
import { seedAttendance } from '../data/attendanceSeedData'
import type { AttendanceRecord, AttendanceStatus } from '../types'

function notifyAttendancesUpdated() {
  window.dispatchEvent(new CustomEvent(STORAGE_EVENTS.attendancesUpdated))
}

export function useAttendance() {
  const [records, setRecordsRaw] = useLocalStorageState<AttendanceRecord[]>(
    STORAGE_KEYS.attendances,
    seedAttendance,
  )

  const setRecords = useCallback(
    (updater: AttendanceRecord[] | ((prev: AttendanceRecord[]) => AttendanceRecord[])) => {
      setRecordsRaw(updater)
      notifyAttendancesUpdated()
    },
    [setRecordsRaw],
  )

  /**
   * Override a student's attendance status for a specific session date.
   * If the session doesn't exist yet, it's appended to history.
   * Stats (present/absent/late/attendancePercent/riskLevel) are recomputed.
   */
  const overrideSession = useCallback(
    (recordId: string, date: string, status: AttendanceStatus, note?: string) => {
      setRecords((prev) =>
        prev.map((r) => {
          if (r.id !== recordId) return r
          const existingIdx = r.history.findIndex((h) => h.date === date)
          const newHistory =
            existingIdx >= 0
              ? r.history.map((h, i) =>
                  i === existingIdx ? { ...h, status, note: note ?? h.note } : h,
                )
              : [...r.history, { date, status, note }].sort((a, b) =>
                  a.date.localeCompare(b.date),
                )
          const present = newHistory.filter((h) => h.status === 'present').length
          const absent = newHistory.filter((h) => h.status === 'absent').length
          const late = newHistory.filter((h) => h.status === 'late').length
          const excused = newHistory.filter((h) => h.status === 'excused').length
          const total = newHistory.length
          const attendancePercent =
            total > 0 ? Math.round(((present + late) / total) * 100) : 0
          const riskLevel =
            attendancePercent >= 80
              ? ('good' as const)
              : attendancePercent >= 60
                ? ('warning' as const)
                : ('at-risk' as const)
          return {
            ...r,
            history: newHistory,
            present,
            absent,
            late,
            excused,
            totalSessions: total,
            attendancePercent,
            riskLevel,
            lastSessionDate: newHistory[newHistory.length - 1]?.date,
          }
        }),
      )
    },
    [setRecords],
  )

  return { records, setRecords, overrideSession }
}
