import { useCallback, useMemo } from 'react'

import { useApiCollection } from '../../../shared/hooks/useApiCollection'
import { createId } from '../../../shared/hooks/useLocalStorageState'
import {
  readCourses as readCoursesFromCache,
  readAcademicTerms as readAcademicTermsFromCache,
  readCourseOfferings as readCourseOfferingsFromCache,
  readEnrollments as readEnrollmentsFromCache,
  readSettings as readSettingsFromCache,
  readPrograms as readProgramsFromCache,
} from '../../../shared/storage/readers'

import { DEFAULT_CAMPUS_ID } from '../data/orgSeedData'

import type { Campus, CampusRecord, Department, SetupStep, SsoProvider } from '../types'

export const ORG_STORAGE_KEYS = {
  campuses: 'berana:campuses',
  departments: 'berana:departments',
  programs: 'berana:programs',
  courses: 'berana:courses',
  settings: 'berana:settings',
  selectedCampus: 'berana:selectedCampus',
} as const



type LegacyDepartment = Omit<Department, 'campusId'> & {
  campusId?: string
  /** Retired: colleges were removed (Campus → Department). */
  collegeId?: string
}



/** Departments belong straight to a campus; a stored college link is dropped. */
function migrateDepartments(raw: LegacyDepartment[]): Department[] {
  return raw.map((dept) => {
    const { collegeId: _retired, ...rest } = dept
    return { ...rest, campusId: dept.campusId ?? DEFAULT_CAMPUS_ID }
  })
}



interface SettingsIntegrations {

  googleSso?: boolean

  microsoftSso?: boolean

}



interface SettingsSnapshot {

  general?: { name?: string }

  branding?: { domain?: string }

  integrations?: SettingsIntegrations

}



function readSettings(): SettingsSnapshot {
  return readSettingsFromCache<SettingsSnapshot>()
}



function withDeptCounts(records: CampusRecord[], departments: Department[]): Campus[] {

  return records.map((campus) => ({

    ...campus,

    deptCount: departments.filter((d) => d.campusId === campus.id).length,

  }))

}



export function useOrgStructure() {

  const [campusRecords, setCampusRecords] = useApiCollection<CampusRecord[]>(

    ORG_STORAGE_KEYS.campuses,

    [],

  )

  const [departmentsRaw, setDepartmentsRaw] = useApiCollection<LegacyDepartment[]>(

    ORG_STORAGE_KEYS.departments,

    [],

  )

  const [selectedCampusId, setSelectedCampusId] = useApiCollection<string | 'all'>(

    ORG_STORAGE_KEYS.selectedCampus,

    'all',

  )



  const departments = useMemo(

    () => migrateDepartments(departmentsRaw),
    [departmentsRaw],

  )



  const setDepartments = useCallback(

    (updater: Department[] | ((prev: Department[]) => Department[])) => {

      setDepartmentsRaw((prev) => {

        const current = migrateDepartments(prev)

        const next = typeof updater === 'function' ? updater(current) : updater

        return next

      })

    },

    [setDepartmentsRaw],

  )



  const campuses = useMemo(

    () => withDeptCounts(campusRecords, departments),

    [campusRecords, departments],

  )



  const activeCampuses = useMemo(

    () => campuses.filter((c) => c.status === 'active'),

    [campuses],

  )



  const getDepartmentsForCampus = useCallback(

    (campusId: string) => departments.filter((d) => d.campusId === campusId),

    [departments],

  )



  const getCampusById = useCallback(

    (campusId: string) => campuses.find((c) => c.id === campusId),

    [campuses],

  )



  const addCampus = useCallback(

    (input: Omit<CampusRecord, 'id' | 'status'> & { status?: CampusRecord['status'] }) => {

      const campus: CampusRecord = {

        id: createId('campus'),

        name: input.name.trim(),

        code: input.code.trim().toUpperCase(),

        address: input.address.trim(),

        subtitle: input.subtitle.trim(),

        status: input.status ?? 'pending',

      }

      setCampusRecords((prev) => [...prev, campus])

      return campus

    },

    [setCampusRecords],

  )



  const updateCampus = useCallback(

    (campusId: string, patch: Partial<Omit<CampusRecord, 'id'>>) => {

      setCampusRecords((prev) =>

        prev.map((c) =>

          c.id === campusId

            ? {

                ...c,

                ...patch,

                code: patch.code ? patch.code.trim().toUpperCase() : c.code,

              }

            : c,

        ),

      )

    },

    [setCampusRecords],

  )



  const activateCampus = useCallback(

    (campusId: string) => updateCampus(campusId, { status: 'active' }),

    [updateCampus],

  )



  const ssoProviders = useMemo((): SsoProvider[] => {

    const settings = readSettings()

    const integrations = settings.integrations ?? {}

    return [

      {

        id: 'sso-google',

        name: 'Google Workspace',

        subtitle: 'Sign in with Google accounts',

        status: integrations.googleSso ? 'connected' : 'not-configured',

      },

      {

        id: 'sso-microsoft',

        name: 'Microsoft Entra ID',

        subtitle: 'Azure AD / Office 365 SSO',

        status: integrations.microsoftSso ? 'connected' : 'not-configured',

      },

      {

        id: 'sso-local',

        name: 'Local Accounts',

        subtitle: 'Email & password authentication',

        status: 'enabled',

      },

    ]

  }, [campusRecords, departmentsRaw])



  const setupSteps = useMemo((): SetupStep[] => {

    const settings = readSettings()

    const hasProfile = Boolean(settings.general?.name?.trim())

    const hasStructure =

      activeCampuses.length > 0 && departments.some((d) => d.campusId && d.name.trim())

    const hasCalendar = readAcademicTermsFromCache().some((t) => t.isCurrent)

    // Programs exist and each active one has a curriculum.
    const activePrograms = readProgramsFromCache().filter((p) => p.status === 'active')
    const hasDepartmentsConfigured =
      activePrograms.length > 0 && activePrograms.every((p) => (p.curriculum?.length ?? 0) > 0)

    const hasCatalog = readCoursesFromCache().length > 0

    const offerings = readCourseOfferingsFromCache()

    const hasOfferings = offerings.length > 0

    const hasInstructors = offerings.some((o) => Boolean(o.primaryInstructorId))

    const hasEnrollments = readEnrollmentsFromCache().some((e) => e.status === 'active')



    return [

      {

        id: 'profile',

        title: 'University Setup',

        subtitle: 'Name, timezone and regional settings',

        done: hasProfile,

        href: '/admin/settings',

      },

      {

        id: 'structure',

        title: 'Academic Structure',

        subtitle: 'Configure campuses and their departments',

        done: hasStructure,

        href: '/admin/institution/structure',

      },

      {

        id: 'calendar',

        title: 'Academic Year / Term',

        subtitle: 'Define calendar and set the current term',

        done: hasCalendar,

        href: '/admin/institution/academic-calendar',

      },

      {

        id: 'departments',

        title: 'Programs & Curriculum',
        subtitle: 'Degrees each department offers, with courses by year and semester',

        done: hasDepartmentsConfigured,

        href: '/admin/institution/programs',
      },
      {
        id: 'catalog',

        title: 'Course Catalog',

        subtitle: 'Reusable courses without term binding',

        done: hasCatalog,

        href: '/admin/courses',

      },

      {

        id: 'offerings',

        title: 'Course Offerings',

        subtitle: 'Sections by department, year, and term',

        done: hasOfferings,

        href: '/admin/course-offerings',

      },

      {

        id: 'instructors',

        title: 'Instructor Assignment',

        subtitle: 'Assign teaching staff to offerings',

        done: hasInstructors,

        href: '/admin/instructors',

      },

      {

        id: 'enrollments',

        title: 'Student Enrollment',

        subtitle: 'Register students into offerings',

        done: hasEnrollments,

        href: '/admin/enrollments',

      },

    ]

  }, [activeCampuses.length, departments, campusRecords, departmentsRaw])



  const setupPercent = useMemo(() => {

    const done = setupSteps.filter((s) => s.done).length

    return Math.round((done / setupSteps.length) * 100)

  }, [setupSteps])



  const institutionName = useMemo(() => readSettings().general?.name ?? 'Berana University', [])



  return {

    campuses,

    campusRecords,

    setCampusRecords,

    departments,

    setDepartments,

    selectedCampusId,

    setSelectedCampusId,

    activeCampuses,

    getDepartmentsForCampus,

    getCampusById,

    addCampus,

    updateCampus,

    activateCampus,

    ssoProviders,

    setupSteps,

    setupPercent,

    institutionName,

  }

}

