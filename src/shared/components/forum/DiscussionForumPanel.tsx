import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  ArrowLeft,
  Hash,
  MessageSquarePlus,
  Pin,
  Search,
  SendHorizontal,
  Users,
} from 'lucide-react'
import type { PersonRow } from '../../../modules/institution/types'
import { Button } from '../Button'
import { FilterTabs } from '../FilterTabs'
import { Monogram } from '../Monogram'
import { SearchInput } from '../SearchInput'
import { useToast } from '../toast/ToastProvider'
import { useForum } from '../../hooks/useForum'
import {
  formatForumTimestamp,
  formatMessageTime,
  getInviteOptions,
  getDirectChatId,
  getStudentInstructors,
  searchPeopleForChat,
} from '../../storage/forumUtils'
import { readPeople } from '../../storage/readers'
import type { ForumChatRecord, ForumChatType } from '../../types/forum'
import { CreateThreadModal } from './CreateThreadModal'

const tabs = ['All', 'Inbox', 'Groups'] as const

interface DiscussionForumPanelProps {
  person: PersonRow
}

function getChatHeaderName(chat: ForumChatRecord, viewerId: string): string {
  if (chat.type !== 'direct') return chat.name
  const otherId = chat.memberIds.find((id) => id !== viewerId)
  const other = otherId ? readPeople().find((person) => person.id === otherId) : undefined
  return other?.name ?? chat.name
}

function ChatAvatar({
  type,
  label,
  size = 'list',
}: {
  type: ForumChatType
  label: string
  size?: 'list' | 'header'
}) {
  const isGroup = type !== 'direct'
  const boxClass = size === 'header' ? 'w-9 h-9' : 'w-8 h-8'
  const iconSize = size === 'header' ? 15 : 13

  if (isGroup) {
    return (
      <div
        className={`${boxClass} rounded-full bg-navy-100 border border-divider flex items-center justify-center text-navy-600 shrink-0`}
      >
        {type === 'campus' ? <Users size={iconSize} /> : <Hash size={iconSize} />}
      </div>
    )
  }

  return (
    <Monogram
      label={label}
      size={size === 'header' ? 'sm' : 'xs'}
    />
  )
}

function getChatHeaderSubtitle(chat: ForumChatRecord, viewerId: string): string {
  if (chat.type === 'campus') return 'Campus group · All members'
  if (chat.type === 'course') return chat.courseTitle ?? 'Course discussion group'
  if (chat.type === 'thread') return `${chat.memberIds.length} invited members`
  const otherId = chat.memberIds.find((id) => id !== viewerId)
  const other = otherId ? readPeople().find((person) => person.id === otherId) : undefined
  return other ? `${other.role} · Online` : 'Private chat'
}

export function DiscussionForumPanel({ person }: DiscussionForumPanelProps) {
  const { notify } = useToast()
  const {
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
  } = useForum(person)

  const [userSearch, setUserSearch] = useState('')
  const [messageDraft, setMessageDraft] = useState('')
  const [threadModalOpen, setThreadModalOpen] = useState(false)
  const [mobileShowChat, setMobileShowChat] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const searchResults = useMemo(
    () => searchPeopleForChat(userSearch, person.id, person.role),
    [userSearch, person.id, person.role],
  )

  const inviteOptions = useMemo(() => getInviteOptions(person), [person])

  const studentInstructors = useMemo(() => {
    if (person.role !== 'Student' || activeTab !== 'Inbox') return []
    const existingDirectIds = new Set(chatListItems.map((chat) => chat.id))
    return getStudentInstructors(person).filter(
      (instructor) => !existingDirectIds.has(getDirectChatId(person.id, instructor.id)),
    )
  }, [person, activeTab, chatListItems])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedMessages, selectedChatId])

  useEffect(() => {
    if (selectedChatId) {
      inputRef.current?.focus()
    }
  }, [selectedChatId])

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId)
    setMobileShowChat(true)
    setUserSearch('')
  }

  const handleStartDirectChat = (otherId: string) => {
    const other = readPeople().find((candidate) => candidate.id === otherId)
    if (!other) return
    startDirectChat(other)
    setUserSearch('')
    setMobileShowChat(true)
    notify(`Started chat with ${other.name}`)
  }

  const handleSendMessage = () => {
    if (sendMessage(messageDraft)) {
      setMessageDraft('')
    }
  }

  const handleCreateThread = (input: { title: string; description: string; memberIds: string[] }) => {
    const thread = createThread(input)
    if (thread) {
      notify(`Thread "${thread.name}" created`)
      setMobileShowChat(true)
    }
  }

  const showPinnedSection =
    (activeTab === 'All' || activeTab === 'Groups') &&
    chatListItems.some((chat) => chat.pinned)

  const pinnedChats = chatListItems.filter((chat) => chat.pinned)
  const regularChats = chatListItems.filter((chat) => !chat.pinned)

  const renderPersonRow = (
    id: string,
    name: string,
    subtitle: string,
    onClick: () => void,
  ) => (
    <button
      key={id}
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors border-b border-divider/60 forum-list-hover"
    >
      <Monogram label={name} size="xs" />
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] font-semibold text-navy-900 truncate">{name}</p>
        <p className="text-[10.5px] text-secondary-text truncate">{subtitle}</p>
      </div>
    </button>
  )

  const renderChatRow = (chat: (typeof chatListItems)[number]) => {
    const isActive = chat.id === selectedChatId
    return (
      <button
        key={chat.id}
        type="button"
        onClick={() => handleSelectChat(chat.id)}
        className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors border-b border-divider/60 ${
          isActive ? 'forum-list-active' : 'forum-list-hover'
        }`}
      >
        <div className="shrink-0">
          <ChatAvatar type={chat.type} label={chat.avatarLabel} size="list" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-[12.5px] font-semibold text-navy-900 truncate">{chat.name}</p>
            {chat.pinned ? <Pin size={10} className="text-lemon-700 shrink-0" /> : null}
          </div>
          <p className="text-[10.5px] text-secondary-text truncate">
            {chat.lastMessagePreview ?? chat.subtitle}
          </p>
        </div>
        <div className="flex flex-col items-end gap-0.5 shrink-0">
          <span className="text-[9px] text-secondary-text">
            {formatForumTimestamp(chat.lastMessageAt)}
          </span>
          {chat.unreadCount > 0 ? (
            <span className="min-w-[16px] h-[16px] px-1 rounded-full bg-lemon-500 text-[9px] font-bold text-navy-900 flex items-center justify-center">
              {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
            </span>
          ) : null}
        </div>
      </button>
    )
  }

  const renderListSection = (label: string, content: ReactNode) => (
    <div>
      <div className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-secondary-text bg-navy-100/40 border-b border-divider/60 sticky top-0 z-10">
        {label}
      </div>
      {content}
    </div>
  )

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0 flex overflow-hidden forum-shell">
        <aside
          className={`w-full md:w-[300px] lg:w-[320px] shrink-0 flex flex-col h-full min-h-0 forum-sidebar ${
            mobileShowChat ? 'hidden md:flex' : 'flex'
          }`}
        >
          <div className="shrink-0 p-2.5 space-y-2.5 forum-sidebar-header">
            <div className="flex items-center gap-2">
              <SearchInput
                value={userSearch}
                onChange={setUserSearch}
                placeholder="Search users..."
                className="flex-1 min-w-0"
              />
              <Button
                variant="primary"
                size="sm"
                onClick={() => setThreadModalOpen(true)}
                className="shrink-0 h-[34px] px-2.5"
                aria-label="New thread"
              >
                <MessageSquarePlus size={14} />
                <span className="hidden sm:inline">New</span>
              </Button>
            </div>
            {userSearch.trim() ? (
              <div className="nested-panel overflow-hidden shadow-sm max-h-40 overflow-y-auto app-scroll">
                {searchResults.length === 0 ? (
                  <div className="px-3 py-3 text-[11px] text-secondary-text text-center">
                    No users found.
                  </div>
                ) : (
                  searchResults.map((result) =>
                    renderPersonRow(
                      result.id,
                      result.name,
                      `${result.role} · ${result.email}`,
                      () => handleStartDirectChat(result.id),
                    ),
                  )
                )}
              </div>
            ) : null}
            <FilterTabs tabs={[...tabs]} active={activeTab} onChange={(tab) => setActiveTab(tab as typeof activeTab)} />
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto app-scroll">
            {activeTab === 'Inbox' && person.role === 'Student' ? (
              <>
                {chatListItems.length > 0
                  ? renderListSection('Messages', chatListItems.map(renderChatRow))
                  : null}
                {studentInstructors.length > 0
                  ? renderListSection(
                      'Instructors',
                      studentInstructors.map((instructor) =>
                        renderPersonRow(
                          instructor.id,
                          instructor.name,
                          instructor.email,
                          () => handleStartDirectChat(instructor.id),
                        ),
                      ),
                    )
                  : null}
                {chatListItems.length === 0 && studentInstructors.length === 0 ? (
                  <div className="p-6 text-center">
                    <Search size={24} className="mx-auto text-navy-300 mb-2" />
                    <p className="text-[12px] font-semibold text-navy-900">No messages yet</p>
                    <p className="text-[11px] text-secondary-text mt-1">
                      Message an instructor from your courses below.
                    </p>
                  </div>
                ) : null}
              </>
            ) : chatListItems.length === 0 ? (
              <div className="p-6 text-center">
                <Search size={24} className="mx-auto text-navy-300 mb-2" />
                <p className="text-[12px] font-semibold text-navy-900">No chats here yet</p>
                <p className="text-[11px] text-secondary-text mt-1">
                  Search for a user or create a new thread.
                </p>
              </div>
            ) : (
              <>
                {showPinnedSection
                  ? renderListSection('Pinned', pinnedChats.map(renderChatRow))
                  : null}
                {regularChats.length > 0 ? (
                  showPinnedSection ? (
                    renderListSection('Chats', regularChats.map(renderChatRow))
                  ) : (
                    regularChats.map(renderChatRow)
                  )
                ) : null}
              </>
            )}
          </div>
        </aside>

        <section
          className={`flex-1 flex flex-col min-w-0 h-full min-h-0 forum-chat-pane ${
            mobileShowChat ? 'flex' : 'hidden md:flex'
          }`}
        >
          {selectedChat ? (
            <>
              <div className="shrink-0 px-3 py-2 flex items-center gap-2.5 forum-chat-header backdrop-blur-sm">
                <button
                  type="button"
                  className="md:hidden w-8 h-8 rounded-lg hover:bg-navy-50 text-navy-700 flex items-center justify-center"
                  onClick={() => setMobileShowChat(false)}
                  aria-label="Back to chats"
                >
                  <ArrowLeft size={18} />
                </button>
                <ChatAvatar
                  type={selectedChat.type}
                  label={getChatHeaderName(selectedChat, person.id)}
                  size="header"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-[14px] font-bold text-navy-900 truncate">
                      {getChatHeaderName(selectedChat, person.id)}
                    </h2>
                    {selectedChat.pinned ? <Pin size={14} className="text-lemon-700 shrink-0" /> : null}
                  </div>
                  <p className="text-[10.5px] text-secondary-text truncate">
                    {getChatHeaderSubtitle(selectedChat, person.id)}
                  </p>
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto app-scroll px-3 py-2 space-y-1 forum-messages-bg">
                {selectedChat.description ? (
                  <div className="mx-auto max-w-xl rounded-lg border border-divider/70 bg-navy-50/80 px-3 py-2 text-center">
                    <p className="text-[10.5px] text-secondary-text">{selectedChat.description}</p>
                  </div>
                ) : null}

                {selectedMessages.map((message) => {
                  const isOwn = message.senderId === person.id
                  const isSystem = message.senderId === 'system'
                  const time = formatMessageTime(message.createdAt)
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`w-fit max-w-[min(100%,480px)] rounded-lg px-2 py-1 ${
                          isSystem
                            ? 'bg-navy-100/70 border border-divider/70 text-center mx-auto px-3'
                            : isOwn
                              ? 'bg-lemon-200/90 text-navy-900 rounded-br-sm border border-lemon-500/20'
                              : 'forum-bubble-incoming rounded-bl-sm backdrop-blur-sm'
                        }`}
                      >
                        {!isOwn && !isSystem ? (
                          <p className="text-[10px] font-semibold text-navy-600 leading-none mb-0.5">
                            {message.senderName}
                          </p>
                        ) : null}
                        <p className="text-[15px] leading-[1.4] whitespace-pre-wrap break-words">
                          {message.body}
                          {!isSystem ? (
                            <span
                              className={`inline-block ml-1.5 text-[10px] leading-none whitespace-nowrap align-bottom ${
                                isOwn ? 'forum-msg-time-own' : 'forum-msg-time-other'
                              }`}
                            >
                              {time}
                            </span>
                          ) : (
                            <span className="block mt-0.5 text-[9px] forum-msg-time-system">{time}</span>
                          )}
                        </p>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="shrink-0 p-2 forum-composer backdrop-blur-sm">
                <div className="flex items-end gap-2">
                  <textarea
                    ref={inputRef}
                    value={messageDraft}
                    onChange={(event) => setMessageDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    rows={1}
                    placeholder="Write a message..."
                    className="flex-1 resize-none rounded-lg input-surface px-2.5 py-1.5 text-[11px] placeholder:text-secondary-text focus:outline-none focus:border-lemon-500/40 focus:ring-2 focus:ring-lemon-500/20 min-h-[34px] max-h-24"
                  />
                  <Button
                    variant="primary"
                    onClick={handleSendMessage}
                    disabled={!messageDraft.trim()}
                    className="shrink-0 h-[34px] px-2.5 text-[11px]"
                  >
                    <SendHorizontal size={14} />
                    Send
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6 forum-messages-bg">
              <div className="w-12 h-12 rounded-xl bg-lemon-200/60 text-lemon-800 flex items-center justify-center mb-3">
                <MessageSquarePlus size={22} />
              </div>
              <h3 className="text-[15px] font-bold text-navy-900">Select a chat to start messaging</h3>
              <p className="text-[11px] text-secondary-text mt-1.5 max-w-md">
                Open a group from the list, search for someone to message, or create a thread.
              </p>
            </div>
          )}
        </section>
      </div>

      <CreateThreadModal
        open={threadModalOpen}
        onClose={() => setThreadModalOpen(false)}
        inviteOptions={inviteOptions}
        onSubmit={handleCreateThread}
      />
    </div>
  )
}
