import { STORAGE_EVENTS, STORAGE_KEYS } from './keys'
import { readAnnouncements } from './readers'

/** Record views without triggering React state loops. Returns true if storage changed. */
export function recordAnnouncementViews(announcementIds: string[], viewerId: string): boolean {
  if (announcementIds.length === 0) return false

  const records = readAnnouncements()
  let changed = false

  const next = records.map((record) => {
    if (!announcementIds.includes(record.id) || record.viewedBy.includes(viewerId)) {
      return record
    }
    changed = true
    return {
      ...record,
      views: record.views + 1,
      viewedBy: [...record.viewedBy, viewerId],
    }
  })

  if (!changed) return false

  try {
    window.localStorage.setItem(STORAGE_KEYS.announcements, JSON.stringify(next))
    window.dispatchEvent(new CustomEvent(STORAGE_EVENTS.announcementsUpdated))
  } catch {
    return false
  }

  return true
}
