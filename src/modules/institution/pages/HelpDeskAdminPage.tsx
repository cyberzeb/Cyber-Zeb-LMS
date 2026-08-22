import { PageHeader } from '../../../shared/components/PageHeader'
import { HelpDeskTicketBoard } from '../components/HelpDeskTicketBoard'

export function HelpDeskAdminPage() {
  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title="Help Desk"
        subtitle="Manage support tickets from students, instructors, and staff."
      />
      <HelpDeskTicketBoard />
    </div>
  )
}

export default HelpDeskAdminPage
