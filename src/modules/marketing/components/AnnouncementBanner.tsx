import { useQuery } from '@tanstack/react-query'
import { axiosClient } from '../../../lib/axiosClient'

interface SiteContentBlock {
  id: string
  key: string
  value: string
  is_active: boolean
}

export function AnnouncementBanner() {
  const { data } = useQuery({
    queryKey: ['public', 'site-content'],
    queryFn: async () => {
      const { data: blocks } = await axiosClient.get<SiteContentBlock[]>('/site-content')
      return blocks
    },
    staleTime: 5_000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  })

  const banner = data?.find((b) => b.key === 'announcement_banner' && b.is_active && b.value.trim())
  if (!banner) return null

  return (
    <div className="bg-navy-900 text-white px-4 py-2.5 text-center text-[13px] font-semibold">
      {banner.value}
    </div>
  )
}
