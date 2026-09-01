import type { ReactNode } from 'react'
import {
  BookCheck,
  BookOpen,
  ClipboardCheck,
  ClipboardList,
  FileText,
  Headset,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  MonitorPlay,
  Settings,
  Shield,
  ShieldCheck,
  SquarePen,
  UserCog,
  Users,
  UsersRound,
  Network,
  Briefcase,
  Sparkles,
  GraduationCap,
  Layers,
  UserCheck,
} from 'lucide-react'
import type { EditionConfig, EditionModules, ResolvedNavSection } from './editions/types'

const ICON_SIZE = 17

const iconMap: Record<string, ReactNode> = {
  dashboard: <LayoutDashboard size={ICON_SIZE} />,
  organization: <Network size={ICON_SIZE} />,
  employees: <Users size={ICON_SIZE} />,
  departments: <UserCog size={ICON_SIZE} />,
  teams: <UsersRound size={ICON_SIZE} />,
  'job-roles': <Briefcase size={ICON_SIZE} />,
  'training-catalog': <BookOpen size={ICON_SIZE} />,
  'training-assignments': <ClipboardCheck size={ICON_SIZE} />,
  'training-programs': <GraduationCap size={ICON_SIZE} />,
  cohorts: <Layers size={ICON_SIZE} />,
  learners: <UsersRound size={ICON_SIZE} />,
  assignments: <SquarePen size={ICON_SIZE} />,
  assessments: <ClipboardList size={ICON_SIZE} />,
  'live-training': <MonitorPlay size={ICON_SIZE} />,
  skills: <Sparkles size={ICON_SIZE} />,
  certificates: <BookCheck size={ICON_SIZE} />,
  compliance: <ShieldCheck size={ICON_SIZE} />,
  trainers: <UserCheck size={ICON_SIZE} />,
  staff: <Briefcase size={ICON_SIZE} />,
  admins: <Shield size={ICON_SIZE} />,
  announcements: <Megaphone size={ICON_SIZE} />,
  forum: <MessageSquare size={ICON_SIZE} />,
  'help-desk': <Headset size={ICON_SIZE} />,
  reports: <FileText size={ICON_SIZE} />,
  settings: <Settings size={ICON_SIZE} />,
}

function isModuleEnabled(modules: EditionModules, key?: keyof EditionModules): boolean {
  if (!key) return true
  return modules[key] === true
}

export function buildCorporateNavSections(
  editionConfig: EditionConfig,
  path: string,
  badgeOverrides: Record<string, number> = {},
): ResolvedNavSection[] {
  const isActive = (routes: string[]) => routes.some((route) => path === route)

  return editionConfig.navSections
    .map((section) => ({
      title: section.title,
      items: section.items
        .filter((item) => isModuleEnabled(editionConfig.modules, item.moduleKey))
        .map((item) => ({
          label: item.label,
          to: item.to,
          active: isActive(item.activePaths ?? [item.to]),
          icon: iconMap[item.iconKey] ?? <LayoutDashboard size={ICON_SIZE} />,
          badge: badgeOverrides[item.id] ?? item.badge,
        })),
    }))
    .filter((section) => section.items.length > 0)
}

export function resolveCorporateBreadcrumb(
  editionConfig: EditionConfig,
  path: string,
): string {
  return editionConfig.breadcrumbLabels[path] ?? ''
}
