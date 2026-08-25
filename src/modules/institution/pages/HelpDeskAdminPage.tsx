import { PageHeader } from '../../../shared/components/PageHeader'
import { HelpDeskTicketBoard } from '../components/HelpDeskTicketBoard'
import { getEditionPageCopy } from '../../../shared/config/editionUi'

export function HelpDeskAdminPage() {
  const pageCopy = getEditionPageCopy('helpDesk')
  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader title={pageCopy.title} subtitle={pageCopy.subtitle} />
      <HelpDeskTicketBoard />
    </div>
  )
}

export default HelpDeskAdminPage
