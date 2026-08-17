export type ForumChatType = 'campus' | 'course' | 'direct' | 'thread'

export type ForumListTab = 'All' | 'Inbox' | 'Groups'

export interface ForumChatRecord {
  id: string
  type: ForumChatType
  name: string
  description?: string
  courseId?: string
  courseCode?: string
  courseTitle?: string
  memberIds: string[]
  createdById: string
  createdAt: string
  updatedAt: string
  lastMessageAt?: string
  lastMessagePreview?: string
  lastMessageSenderName?: string
  pinned?: boolean
}

export interface ForumMessageRecord {
  id: string
  chatId: string
  senderId: string
  senderName: string
  body: string
  createdAt: string
}

export interface ForumChatListItem {
  id: string
  type: ForumChatType
  name: string
  subtitle: string
  avatarLabel: string
  pinned: boolean
  lastMessageAt?: string
  lastMessagePreview?: string
  unreadCount: number
  isGroup: boolean
}

export interface ForumThreadFormInput {
  title: string
  description: string
  memberIds: string[]
}

export interface ForumPersonOption {
  id: string
  name: string
  email: string
  role: string
  initials: string
}

export const CAMPUS_CHAT_ID = 'chat-campus'
