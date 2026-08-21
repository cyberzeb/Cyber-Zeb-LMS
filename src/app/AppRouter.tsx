import { createBrowserRouter } from 'react-router-dom'
import { InstitutionAdminLayout } from './InstitutionAdminLayout'
import { CampusProfilePage } from '../modules/institution/pages/CampusProfilePage'
import { OrgStructurePage } from '../modules/institution/pages/OrgStructurePage'
import { InstitutionOverviewPage } from '../modules/institution/pages/InstitutionOverviewPage'
import { DepartmentsPage } from '../modules/institution/pages/DepartmentsPage'
import { ProgramsPage } from '../modules/institution/pages/ProgramsPage'
import { CoursesPage } from '../modules/institution/pages/CoursesPage'
import { PeoplePage } from '../modules/institution/pages/PeoplePage'
import { StudentsPage } from '../modules/institution/pages/StudentsPage'
import { InstructorsPage } from '../modules/institution/pages/InstructorsPage'
import { StaffPage } from '../modules/institution/pages/StaffPage'
import { GuardiansPage } from '../modules/institution/pages/GuardiansPage'
import { AdministratorsPage } from '../modules/institution/pages/AdministratorsPage'
import { VerifyPeoplePage } from '../modules/institution/pages/VerifyPeoplePage'
import { EnrollmentsPage } from '../modules/institution/pages/EnrollmentsPage'
import { CertificatesPage } from '../modules/institution/pages/CertificatesPage'
import { AttendanceAdminPage } from '../modules/institution/pages/AttendanceAdminPage'
import { PaymentsAdminPage } from '../modules/institution/pages/PaymentsAdminPage'
import { HelpDeskAdminPage } from '../modules/institution/pages/HelpDeskAdminPage'
import { ApiIntegrationsAdminPage } from '../modules/institution/pages/ApiIntegrationsAdminPage'
import { LiveClassesAdminPage } from '../modules/institution/pages/LiveClassesAdminPage'
import { AssignmentsAdminPage } from '../modules/institution/pages/AssignmentsAdminPage'
import { QuizzesExamsAdminPage } from '../modules/institution/pages/QuizzesExamsAdminPage'
import { QuestionBankAdminPage } from '../modules/institution/pages/QuestionBankAdminPage'
import { ReportsPage } from '../modules/institution/pages/ReportsPage'
import { AdminAnnouncementsPage } from '../modules/institution/pages/AdminAnnouncementsPage'
import { AdminDiscussionForumPage } from '../modules/institution/pages/AdminDiscussionForumPage'
import { SettingsPage } from '../modules/institution/pages/SettingsPage'
import { LandingPage } from '../modules/marketing/pages/LandingPage'
import { InstitutionLandingPage } from '../modules/marketing/pages/InstitutionLandingPage'
import { StudentLayout } from '../modules/students/layout/StudentLayout'
import { StudentDashboardPage } from '../modules/students/pages/studentdashboard'
import { StudentResourcesPage } from '../modules/students/pages/studentresources'
import { StudentQuizzesPage } from '../modules/students/pages/studentquizzes'
import { StudentAssignmentsPage } from '../modules/students/pages/studentassignments'
import { StudentCalendarPage } from '../modules/students/pages/studentcalendar'
import { StudentGradesPage } from '../modules/students/pages/studentgrades'
import { StudentCoursesShell } from '../modules/students/pages/StudentCoursesShell'
import { StudentLiveClassesPage } from '../modules/students/pages/studentliveclasses'
import { StudentAttendancePage } from '../modules/students/pages/studentattendance'
import { StudentAnnouncementsPage } from '../modules/students/pages/studentannouncements'
import { StudentForumPage } from '../modules/students/pages/studentforum'
import { StudentCertificatesPage } from '../modules/students/pages/studentcertificates'
import { StudentPaymentsPage } from '../modules/students/pages/studentpayments'
import { StudentHelpDeskPage } from '../modules/students/pages/studenthelpdesk'
import { StudentSettingsPage } from '../modules/students/pages/studentsettings'
import { InstructorLayout } from '../modules/instructors/layout/InstructorLayout'
import { InstructorDashboardPage } from '../modules/instructors/pages/instructordashboard'
import { InstructorCoursesPage } from '../modules/instructors/pages/instructorcourses'
import { InstructorStudentsPage } from '../modules/instructors/pages/instructorstudents'
import { InstructorLiveClassesPage } from '../modules/instructors/pages/instructorliveclasses'
import { InstructorResourcesPage } from '../modules/instructors/pages/instructorresources'
import { InstructorQuizzesPage } from '../modules/instructors/pages/instructorquizzes'
import { InstructorAssignmentsPage } from '../modules/instructors/pages/instructorassignments'
import { InstructorCalendarPage } from '../modules/instructors/pages/instructorcalendar'
import { InstructorGradesPage } from '../modules/instructors/pages/instructorgrades'
import { InstructorAttendancePage } from '../modules/instructors/pages/instructorattendance'
import { InstructorAnnouncementsPage } from '../modules/instructors/pages/instructorannouncements'
import { InstructorForumPage } from '../modules/instructors/pages/instructorforum'
import { InstructorCertificatesPage } from '../modules/instructors/pages/instructorcertificates'
import { InstructorHelpDeskPage } from '../modules/instructors/pages/instructorhelpdesk'
import { InstructorSettingsPage } from '../modules/instructors/pages/instructorsettings'
import { SuperAdminLayout } from '../modules/superadmin/layout/SuperAdminLayout'
import { SuperAdminLoginPage } from '../modules/superadmin/pages/SuperAdminLoginPage'
import { OverviewPage } from '../modules/superadmin/pages/OverviewPage'
import { ServiceRequestsListPage } from '../modules/superadmin/pages/ServiceRequestsListPage'
import { ServiceRequestDetailPage } from '../modules/superadmin/pages/ServiceRequestDetailPage'
import { ManageModulesPage } from '../modules/superadmin/pages/ManageModulesPage'
import { AddOnRequestsPage } from '../modules/superadmin/pages/AddOnRequestsPage'
import { AddOnRequestDetailPage } from '../modules/superadmin/pages/AddOnRequestDetailPage'
import { RenewalsPage } from '../modules/superadmin/pages/RenewalsPage'
import { InstitutionsListPage } from '../modules/superadmin/pages/InstitutionsListPage'
import { InstitutionDetailPage } from '../modules/superadmin/pages/InstitutionDetailPage'
import { LandingContentPage } from '../modules/superadmin/pages/LandingContentPage'
import { AuditLogsPage } from '../modules/superadmin/pages/AuditLogsPage'
import { RolesPermissionsPage } from '../modules/superadmin/pages/RolesPermissionsPage'
import { SystemSettingsPage } from '../modules/superadmin/pages/SystemSettingsPage'
import { NotificationsPage } from '../modules/superadmin/pages/NotificationsPage'
import { DataExportPage } from '../modules/superadmin/pages/DataExportPage'
import {
  AppearancePage,
  AnalyticsPage,
  BackupPage,
  IntegrationsPage,
  SecurityPage,
  SystemHealthPage,
} from '../modules/superadmin/pages/ComingSoonPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    // Local fallback only; production tenant lookup is by subdomain host.
    path: '/institution/:slug',
    element: <InstitutionLandingPage />,
  },
  {
    path: '/super-admin',
    element: <SuperAdminLayout />,
    children: [
      { index: true, element: <OverviewPage /> },
      { path: 'requests', element: <ServiceRequestsListPage /> },
      { path: 'requests/:id', element: <ServiceRequestDetailPage /> },
      { path: 'addons', element: <AddOnRequestsPage /> },
      { path: 'addons/:id', element: <AddOnRequestDetailPage /> },
      { path: 'modules', element: <ManageModulesPage /> },
      { path: 'renewals', element: <RenewalsPage /> },
      { path: 'institutions', element: <InstitutionsListPage /> },
      { path: 'institutions/:id', element: <InstitutionDetailPage /> },
      { path: 'landing-content', element: <LandingContentPage /> },
      { path: 'audit-logs', element: <AuditLogsPage /> },
      { path: 'roles', element: <RolesPermissionsPage /> },
      { path: 'settings', element: <SystemSettingsPage /> },
      { path: 'appearance', element: <AppearancePage /> },
      { path: 'integrations', element: <IntegrationsPage /> },
      { path: 'notifications', element: <NotificationsPage /> },
      { path: 'system-health', element: <SystemHealthPage /> },
      { path: 'backup', element: <BackupPage /> },
      { path: 'security', element: <SecurityPage /> },
      { path: 'export', element: <DataExportPage /> },
      { path: 'analytics', element: <AnalyticsPage /> },
      { path: 'login', element: <SuperAdminLoginPage /> },
    ],
  },
  {
    path: '/student',
    element: <StudentLayout />,
    children: [
      { index: true, element: <StudentDashboardPage /> },
      { path: 'resources', element: <StudentResourcesPage /> },
      { path: 'quizzes', element: <StudentQuizzesPage /> },
      { path: 'assignments', element: <StudentAssignmentsPage /> },
      { path: 'calendar', element: <StudentCalendarPage /> },
      { path: 'grades', element: <StudentGradesPage /> },
      { path: 'courses', element: <StudentCoursesShell /> },
      { path: 'courses/:courseId/learn', element: <StudentCoursesShell /> },
      { path: 'courses/:courseId/learn/:lessonId', element: <StudentCoursesShell /> },
      { path: 'live-classes', element: <StudentLiveClassesPage /> },
      { path: 'attendance', element: <StudentAttendancePage /> },
      { path: 'announcements', element: <StudentAnnouncementsPage /> },
      { path: 'forum', element: <StudentForumPage /> },
      { path: 'certificates', element: <StudentCertificatesPage /> },
      { path: 'payments', element: <StudentPaymentsPage /> },
      { path: 'help-desk', element: <StudentHelpDeskPage /> },
      { path: 'settings', element: <StudentSettingsPage /> },
    ],
  },
  {
    path: '/instructor',
    element: <InstructorLayout />,
    children: [
      { index: true, element: <InstructorDashboardPage /> },
      { path: 'courses', element: <InstructorCoursesPage /> },
      { path: 'students', element: <InstructorStudentsPage /> },
      { path: 'live-classes', element: <InstructorLiveClassesPage /> },
      { path: 'resources', element: <InstructorResourcesPage /> },
      { path: 'quizzes', element: <InstructorQuizzesPage /> },
      { path: 'assignments', element: <InstructorAssignmentsPage /> },
      { path: 'calendar', element: <InstructorCalendarPage /> },
      { path: 'grades', element: <InstructorGradesPage /> },
      { path: 'attendance', element: <InstructorAttendancePage /> },
      { path: 'announcements', element: <InstructorAnnouncementsPage /> },
      { path: 'forum', element: <InstructorForumPage /> },
      { path: 'certificates', element: <InstructorCertificatesPage /> },
      { path: 'help-desk', element: <InstructorHelpDeskPage /> },
      { path: 'settings', element: <InstructorSettingsPage /> },
    ],
  },
  {
    path: '/admin',
    element: <InstitutionAdminLayout />,
    children: [
      { index: true, element: <InstitutionOverviewPage /> },
      { path: 'institution/overview', element: <InstitutionOverviewPage /> },
      { path: 'institution/dashboard', element: <InstitutionOverviewPage /> },
      { path: 'institution/structure', element: <OrgStructurePage /> },
      { path: 'institution/profile', element: <CampusProfilePage /> },
      { path: 'institution/profile/:campusId', element: <CampusProfilePage /> },
      { path: 'institution/departments', element: <DepartmentsPage /> },
      { path: 'institution/programs', element: <ProgramsPage /> },
      { path: 'courses', element: <CoursesPage /> },
      { path: 'people', element: <PeoplePage focus="all" /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'live-classes', element: <LiveClassesAdminPage /> },
      { path: 'assignments', element: <AssignmentsAdminPage /> },
      { path: 'quizzes-exams', element: <QuizzesExamsAdminPage /> },
      { path: 'question-bank', element: <QuestionBankAdminPage /> },
      { path: 'students', element: <StudentsPage /> },
      { path: 'instructors', element: <InstructorsPage /> },
      { path: 'staff', element: <StaffPage /> },
      { path: 'guardians', element: <GuardiansPage /> },
      { path: 'admins', element: <AdministratorsPage /> },
      { path: 'verify-people', element: <VerifyPeoplePage /> },
      { path: 'enrollments', element: <EnrollmentsPage /> },
      { path: 'attendance', element: <AttendanceAdminPage /> },
      { path: 'announcements', element: <AdminAnnouncementsPage /> },
      { path: 'discussion-forum', element: <AdminDiscussionForumPage /> },
      { path: 'certificates', element: <CertificatesPage /> },
      { path: 'resources', element: <CoursesPage /> },
      { path: 'calendar', element: <CampusProfilePage /> },
      { path: 'payments', element: <PaymentsAdminPage /> },
      { path: 'api-integrations', element: <ApiIntegrationsAdminPage /> },
      { path: 'help-desk', element: <HelpDeskAdminPage /> },
    ],
  },
])