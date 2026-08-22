import { PageHeader } from '../../../shared/components/PageHeader'
import { HelpDeskTicketBoard } from '../../institution/components/HelpDeskTicketBoard'
import { getSessionPerson } from '../../../shared/storage/session'

export function HelpDeskTicketsPage() {
  const person = getSessionPerson()

  if (!person) return null

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Support Tickets"
        subtitle="Assign, resolve and manage tickets from students, instructors and staff."
      />
      <HelpDeskTicketBoard assigneeName={person.name} />
    </div>
  )
}
