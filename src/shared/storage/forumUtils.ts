import type { PersonRole, PersonRow } from '../../modules/institution/types'
import { courseTeachesInstructor } from '../../modules/institution/utils/courseAssignmentUtils'
import type {
  ForumChatListItem,
  ForumChatRecord,
  ForumChatType,
  ForumListTab,
  ForumMessageRecord,
  ForumPersonOption,
} from '../types/forum'
import { CAMPUS_CHAT_ID } from '../types/forum'
import { createId } from '../hooks/useLocalStorageState'
import {
  readCourses,
  readEnrollments,
  readForumChats,
  readForumReadState,
  readInstitutionName,
  readPeople,
  readPublishedApprovedCourses,
} from './readers'
import { STORAGE_KEYS } from './keys'

type ReadState = Record<string, Record<string, string>>

function courseChatId(courseId: string) {
  return `chat-course-${courseId}`
}

function directChatId(personA: string, personB: string) {
  const [first, second] = [personA, personB].sort()
  return `chat-dm-${first}-${second}`
}

export function getDirectChatId(personA: string, personB: string) {
  return directChatId(personA, personB)
}

function isForumEnabled(course: { discussionForumEnabled?: boolean }) {
  return course.discussionForumEnabled !== false
}

function getActivePeople(): PersonRow[] {
  return readPeople().filter((person) => person.status === 'active')
}

export function ensureCampusChat(): ForumChatRecord {
  const chats = readForumChats()
  const existing = chats.find((chat) => chat.id === CAMPUS_CHAT_ID)
  if (existing) return existing

  const institutionName = readInstitutionName()
  const now = new Date().toISOString()
  const campusChat: ForumChatRecord = {
    id: CAMPUS_CHAT_ID,
    type: 'campus',
    name: `${institutionName} Community`,
    description: 'Campus-wide discussion for all students, instructors, and staff.',
    memberIds: [],
    createdById: 'system',
    createdAt: now,
    updatedAt: now,
    pinned: true,
  }

  return campusChat
}

export function syncCourseChats(existingChats: ForumChatRecord[]): ForumChatRecord[] {
  const chatsById = new Map(existingChats.map((chat) => [chat.id, chat]))
  const courses = readPublishedApprovedCourses().filter(isForumEnabled)
  const now = new Date().toISOString()

  courses.forEach((course) => {
    const id = courseChatId(course.id)
    if (chatsById.has(id)) return

    chatsById.set(id, {
      id,
      type: 'course',
      name: `${course.code} · ${course.title}`,
      description: `Course group for ${course.title}.`,
      courseId: course.id,
      courseCode: course.code,
      courseTitle: course.title,
      memberIds: [],
      createdById: 'system',
      createdAt: now,
      updatedAt: now,
    })
  })

  return Array.from(chatsById.values())
}

export function getCourseIdsForPerson(person: PersonRow): string[] {
  if (person.role === 'Student') {
    return readEnrollments()
      .filter((enrollment) => enrollment.studentId === person.id && enrollment.status === 'active')
      .map((enrollment) => enrollment.courseId)
  }

  if (person.role === 'Instructor') {
    return readPublishedApprovedCourses()
      .filter((course) => courseTeachesInstructor(course, person.id, person.name))
      .map((course) => course.id)
  }

  return readPublishedApprovedCourses().map((course) => course.id)
}

export function canAccessChat(chat: ForumChatRecord, person: PersonRow): boolean {
  if (chat.type === 'campus') return person.status === 'active'
  if (chat.type === 'course') {
    if (!chat.courseId) return false
    const course = readCourses().find((item) => item.id === chat.courseId)
    if (!course || !isForumEnabled(course)) return false
    return getCourseIdsForPerson(person).includes(chat.courseId)
  }
  if (chat.type === 'direct' || chat.type === 'thread') {
    return chat.memberIds.includes(person.id)
  }
  return false
}

export function getVisibleChatsForPerson(person: PersonRow): ForumChatRecord[] {
  const campus = ensureCampusChat()
  const synced = syncCourseChats(readForumChats())
  const allChats = synced.some((chat) => chat.id === campus.id) ? synced : [campus, ...synced]

  return allChats
    .filter((chat) => canAccessChat(chat, person))
    .sort((a, b) => {
      const aTime = a.lastMessageAt ?? a.createdAt
      const bTime = b.lastMessageAt ?? b.createdAt
      return bTime.localeCompare(aTime)
    })
}

export function filterChatsByTab(
  chats: ForumChatRecord[],
  tab: ForumListTab,
  _person: PersonRow,
): ForumChatRecord[] {
  if (tab === 'Inbox') {
    return chats.filter((chat) => chat.type === 'direct')
  }

  if (tab === 'Groups') {
    return chats.filter((chat) => chat.type === 'campus' || chat.type === 'course' || chat.type === 'thread')
  }

  return chats
}

export function sortChatsForList(chats: ForumChatRecord[]): ForumChatRecord[] {
  const pinned = chats.filter((chat) => chat.pinned)
  const rest = chats.filter((chat) => !chat.pinned)
  return [...pinned, ...rest]
}

function getDirectChatName(chat: ForumChatRecord, viewerId: string): string {
  const otherId = chat.memberIds.find((id) => id !== viewerId)
  const other = otherId ? readPeople().find((person) => person.id === otherId) : undefined
  return other?.name ?? 'Direct message'
}

function getChatSubtitle(chat: ForumChatRecord, viewerId: string): string {
  if (chat.type === 'campus') return 'Campus group · Everyone'
  if (chat.type === 'course') return chat.courseCode ? `Course · ${chat.courseCode}` : 'Course group'
  if (chat.type === 'direct') {
    const otherId = chat.memberIds.find((id) => id !== viewerId)
    const other = otherId ? readPeople().find((person) => person.id === otherId) : undefined
    return other ? `${other.role} · ${other.email}` : 'Private chat'
  }
  return `${chat.memberIds.length} member${chat.memberIds.length === 1 ? '' : 's'}`
}

function getUnreadCount(chatId: string, personId: string, messages: ForumMessageRecord[]): number {
  const readState = readForumReadState()
  const lastReadAt = readState[personId]?.[chatId]
  if (!lastReadAt) {
    return messages.filter((message) => message.senderId !== personId).length
  }
  return messages.filter(
    (message) => message.senderId !== personId && message.createdAt > lastReadAt,
  ).length
}

export function toChatListItems(
  chats: ForumChatRecord[],
  person: PersonRow,
  messages: ForumMessageRecord[],
): ForumChatListItem[] {
  return chats.map((chat) => {
    const chatMessages = messages.filter((message) => message.chatId === chat.id)
    const name = chat.type === 'direct' ? getDirectChatName(chat, person.id) : chat.name

    return {
      id: chat.id,
      type: chat.type,
      name,
      subtitle: getChatSubtitle(chat, person.id),
      avatarLabel: name,
      pinned: Boolean(chat.pinned),
      lastMessageAt: chat.lastMessageAt,
      lastMessagePreview: chat.lastMessagePreview,
      unreadCount: getUnreadCount(chat.id, person.id, chatMessages),
      isGroup: chat.type !== 'direct',
    }
  })
}

export function searchPeopleForChat(
  query: string,
  viewerId: string,
  viewerRole: PersonRole | 'Admin',
): ForumPersonOption[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return []

  return getActivePeople()
    .filter((person) => person.id !== viewerId)
    .filter((person) => {
      if (viewerRole === 'Student' && person.role === 'Guardian') return false
      return (
        person.name.toLowerCase().includes(normalized) ||
        person.email.toLowerCase().includes(normalized)
      )
    })
    .slice(0, 8)
    .map((person) => ({
      id: person.id,
      name: person.name,
      email: person.email,
      role: person.role,
      initials: person.initials,
    }))
}

export function buildDirectChatRecord(personA: PersonRow, personB: PersonRow): ForumChatRecord {
  const now = new Date().toISOString()
  return {
    id: directChatId(personA.id, personB.id),
    type: 'direct',
    name: personB.name,
    memberIds: [personA.id, personB.id],
    createdById: personA.id,
    createdAt: now,
    updatedAt: now,
  }
}

export function buildThreadChatRecord(
  input: { title: string; description: string; memberIds: string[] },
  creator: PersonRow,
): ForumChatRecord {
  const now = new Date().toISOString()
  const memberIds = Array.from(new Set([creator.id, ...input.memberIds]))

  return {
    id: createId('thread'),
    type: 'thread',
    name: input.title.trim(),
    description: input.description.trim() || undefined,
    memberIds,
    createdById: creator.id,
    createdAt: now,
    updatedAt: now,
  }
}

export function buildWelcomeCampusMessage(chatId: string, institutionName: string): ForumMessageRecord {
  const now = new Date().toISOString()
  return {
    id: createId('msg'),
    chatId,
    senderId: 'system',
    senderName: institutionName,
    body: `Welcome to the ${institutionName} community chat. Connect with classmates, instructors, and staff across campus.`,
    createdAt: now,
  }
}

export function formatForumTimestamp(iso?: string): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''

  const now = new Date()
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()

  if (sameDay) {
    return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  }

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate()

  if (isYesterday) return 'Yesterday'

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function formatMessageTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export function getStudentInstructors(student: PersonRow): ForumPersonOption[] {
  if (student.role !== 'Student') return []

  const courseIds = new Set(getCourseIdsForPerson(student))
  const instructorIds = new Set<string>()

  readPublishedApprovedCourses().forEach((course) => {
    if (!courseIds.has(course.id)) return
    getActivePeople()
      .filter(
        (person) =>
          person.role === 'Instructor' &&
          courseTeachesInstructor(course, person.id, person.name),
      )
      .forEach((person) => instructorIds.add(person.id))
  })

  return getActivePeople()
    .filter((person) => instructorIds.has(person.id))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((person) => ({
      id: person.id,
      name: person.name,
      email: person.email,
      role: person.role,
      initials: person.initials,
    }))
}

export function getInviteOptions(viewer: PersonRow): ForumPersonOption[] {
  const courseIds = new Set(getCourseIdsForPerson(viewer))

  return getActivePeople()
    .filter((person) => person.id !== viewer.id)
    .filter((person) => {
      if (viewer.role === 'Student') {
        if (person.role === 'Instructor') {
          return readPublishedApprovedCourses().some(
            (course) =>
              courseIds.has(course.id) && courseTeachesInstructor(course, person.id, person.name),
          )
        }
        if (person.role === 'Student') {
          const personCourses = new Set(getCourseIdsForPerson(person))
          return [...courseIds].some((courseId) => personCourses.has(courseId))
        }
        return person.role === 'Staff' || person.role === 'Admin'
      }

      if (viewer.role === 'Instructor') {
        return person.role === 'Student' || person.role === 'Instructor' || person.role === 'Staff'
      }

      return true
    })
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((person) => ({
      id: person.id,
      name: person.name,
      email: person.email,
      role: person.role,
      initials: person.initials,
    }))
}

export function writeForumReadState(personId: string, chatId: string, readAt: string) {
  const current = readForumReadState()
  const next: ReadState = {
    ...current,
    [personId]: {
      ...(current[personId] ?? {}),
      [chatId]: readAt,
    },
  }
  window.localStorage.setItem(STORAGE_KEYS.forumReadState, JSON.stringify(next))
}

export function isGroupChatType(type: ForumChatType): boolean {
  return type === 'campus' || type === 'course' || type === 'thread'
}
