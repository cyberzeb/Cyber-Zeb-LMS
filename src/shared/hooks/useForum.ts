import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useApiCollection } from './useApiCollection'
import { createId } from './useLocalStorageState'
import { STORAGE_EVENTS, STORAGE_KEYS } from '../storage/keys'
import type { PersonRow } from '../../modules/institution/types'
import type {
  ForumChatListItem,
  ForumChatRecord,
  ForumListTab,
  ForumMessageRecord,
  ForumThreadFormInput,
} from '../types/forum'
import { CAMPUS_CHAT_ID } from '../types/forum'
import {
  buildDirectChatRecord,
  buildThreadChatRecord,
  buildWelcomeCampusMessage,
  ensureCampusChat,
  filterChatsByTab,
  getVisibleChatsForPerson,
  sortChatsForList,
  syncCourseChats,
  toChatListItems,
  writeForumReadState,
} from '../storage/forumUtils'
import { readInstitutionName } from '../storage/readers'

function notifyForumUpdated() {
  window.dispatchEvent(new CustomEvent(STORAGE_EVENTS.forumUpdated))
}

function upsertChat(chats: ForumChatRecord[], chat: ForumChatRecord): ForumChatRecord[] {
  const index = chats.findIndex((item) => item.id === chat.id)
  if (index === -1) return [chat, ...chats]
  const next = [...chats]
  next[index] = chat
  return next
}

function chatListsEqual(a: ForumChatRecord[], b: ForumChatRecord[]) {
  if (a.length !== b.length) return false
  return a.every((chat, index) => chat.id === b[index]?.id)
}

export function useForum(person: PersonRow | null) {
  const [chats, setChatsRaw] = useApiCollection<ForumChatRecord[]>(STORAGE_KEYS.forumChats, [])
  const [messages, setMessagesRaw] = useApiCollection<ForumMessageRecord[]>(
    STORAGE_KEYS.forumMessages,
    [],
  )
  const [activeTab, setActiveTab] = useState<ForumListTab>('All')
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState(0)
  const bootstrappedRef = useRef(false)

  const setChats = useCallback(
    (updater: ForumChatRecord[] | ((prev: ForumChatRecord[]) => ForumChatRecord[])) => {
      setChatsRaw(updater)
      notifyForumUpdated()
    },
    [setChatsRaw],
  )

  const setMessages = useCallback(
    (
      updater: ForumMessageRecord[] | ((prev: ForumMessageRecord[]) => ForumMessageRecord[]),
    ) => {
      setMessagesRaw(updater)
      notifyForumUpdated()
    },
    [setMessagesRaw],
  )

  useEffect(() => {
    if (!person || bootstrappedRef.current) return
    bootstrappedRef.current = true

    const campus = ensureCampusChat()

    setChatsRaw((prev) => {
      const base = prev.some((chat) => chat.id === campus.id) ? prev : [campus, ...prev]
      const synced = syncCourseChats(base)
      return chatListsEqual(prev, synced) ? prev : synced
    })

    setMessagesRaw((current) => {
      if (current.some((message) => message.chatId === CAMPUS_CHAT_ID)) return current

      const welcome = buildWelcomeCampusMessage(CAMPUS_CHAT_ID, readInstitutionName())
      setChatsRaw((prev) =>
        prev.map((chat) =>
          chat.id === CAMPUS_CHAT_ID
            ? {
                ...chat,
                lastMessageAt: welcome.createdAt,
                lastMessagePreview: welcome.body,
                lastMessageSenderName: welcome.senderName,
                updatedAt: welcome.createdAt,
              }
            : chat,
        ),
      )
      return [...current, welcome]
    })
  }, [person, setChatsRaw, setMessagesRaw])

  useEffect(() => {
    const onCustom = () => setRefreshToken((value) => value + 1)
    window.addEventListener(STORAGE_EVENTS.forumUpdated, onCustom)
    return () => window.removeEventListener(STORAGE_EVENTS.forumUpdated, onCustom)
  }, [])

  const visibleChats = useMemo(() => {
    if (!person) return []
    void refreshToken
    return getVisibleChatsForPerson(person)
  }, [person, refreshToken, chats, messages])

  const tabChats = useMemo(() => {
    if (!person) return []
    const filtered = filterChatsByTab(visibleChats, activeTab, person)
    return sortChatsForList(filtered)
  }, [visibleChats, activeTab, person])

  const chatListItems: ForumChatListItem[] = useMemo(() => {
    if (!person) return []
    return toChatListItems(tabChats, person, messages)
  }, [tabChats, person, messages])

  const selectedChat = useMemo(
    () => visibleChats.find((chat) => chat.id === selectedChatId) ?? null,
    [visibleChats, selectedChatId],
  )

  const selectedMessages = useMemo(
    () =>
      messages
        .filter((message) => message.chatId === selectedChatId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [messages, selectedChatId],
  )

  useEffect(() => {
    if (!selectedChatId || !person || selectedMessages.length === 0) return
    const lastMessage = selectedMessages[selectedMessages.length - 1]
    writeForumReadState(person.id, selectedChatId, lastMessage.createdAt)
  }, [selectedChatId, selectedMessages, person])

  useEffect(() => {
    if (selectedChatId && !visibleChats.some((chat) => chat.id === selectedChatId)) {
      setSelectedChatId(null)
    }
  }, [visibleChats, selectedChatId])

  const sendMessage = useCallback(
    (body: string) => {
      if (!person || !selectedChat) return false
      const trimmed = body.trim()
      if (!trimmed) return false

      const now = new Date().toISOString()
      const message: ForumMessageRecord = {
        id: createId('msg'),
        chatId: selectedChat.id,
        senderId: person.id,
        senderName: person.name,
        body: trimmed,
        createdAt: now,
      }

      setMessages((prev) => [...prev, message])
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === selectedChat.id
            ? {
                ...chat,
                updatedAt: now,
                lastMessageAt: now,
                lastMessagePreview: trimmed,
                lastMessageSenderName: person.name,
              }
            : chat,
        ),
      )
      writeForumReadState(person.id, selectedChat.id, now)
      return true
    },
    [person, selectedChat, setChats, setMessages],
  )

  const startDirectChat = useCallback(
    (other: PersonRow) => {
      if (!person || other.id === person.id) return null

      const record = buildDirectChatRecord(person, other)
      setChats((prev) => upsertChat(prev, record))
      setSelectedChatId(record.id)
      setActiveTab('Inbox')
      return record
    },
    [person, setChats],
  )

  const createThread = useCallback(
    (input: ForumThreadFormInput) => {
      if (!person) return null
      const record = buildThreadChatRecord(input, person)
      setChats((prev) => [record, ...prev])
      setSelectedChatId(record.id)
      setActiveTab('Groups')
      return record
    },
    [person, setChats],
  )

  return {
    activeTab,
    setActiveTab,
    chatListItems,
    selectedChatId,
    setSelectedChatId,
    selectedChat,
    selectedMessages,
    sendMessage,
    startDirectChat,
    createThread,
  }
}
