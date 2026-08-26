import type { CourseRecord } from '../types'

export const DEMO_LEARNING_COURSE_ID = 'demo-cyber-101'

/** Full published course for testing the student learning flow. */
export function createDemoLearningCourse(): CourseRecord {
  return {
    id: DEMO_LEARNING_COURSE_ID,
    code: 'CYB-101',
    title: 'Introduction to Cybersecurity',
    instructor: 'Prof. Elias Hailu',
    instructorId: 'u6',
    department: 'Computer Science',
    level: 'Undergraduate',
    enrolledCount: 0,
    moduleCount: 3,
    status: 'published',
    progressPercent: 100,
    icon: '🛡️',
    approvalStatus: 'approved',
    shortDescription:
      'Learn core cybersecurity concepts through readings, videos, and hands-on checks.',
    description:
      'A complete starter course covering the CIA triad, network security fundamentals, and everyday defensive practices. Use this course to test enrollment, lesson progress, and the student learning experience.',
    credits: 3,
    durationWeeks: 8,
    deliveryMode: 'Self-paced',
    language: 'English',
    prerequisites: 'Basic computer literacy',
    learningOutcomes:
      'Explain the CIA triad\nIdentify common cyber threats\nDescribe firewall and HTTPS basics\nApply password and MFA best practices\nOutline an incident response workflow',
    tags: ['cybersecurity', 'demo', 'self-paced'],
    allowSelfEnrollment: false,
    certificateEnabled: true,
    discussionForumEnabled: true,
    visibility: 'private',
    startDate: '2026-01-15',
    endDate: '2026-05-30',
    modules: [
      {
        id: 'demo-mod-1',
        title: 'Foundations of Cybersecurity',
        description: 'Core concepts every security professional should know.',
        lessons: [
          {
            id: 'demo-les-1-1',
            title: 'What is Cybersecurity?',
            type: 'reading',
            durationMinutes: 10,
            description: `Cybersecurity is the practice of protecting systems, networks, programs, and data from digital attacks.

These attacks often aim to access, change, or destroy sensitive information, extort money from users, or interrupt normal business processes.

**Why it matters**
- Organizations store personal, financial, and health data online.
- A single breach can damage trust, finances, and operations.
- Security is everyone's responsibility—not only IT teams.

**Key takeaway:** Cybersecurity is proactive defense, not just reacting after an incident.`,
          },
          {
            id: 'demo-les-1-2',
            title: 'The CIA Triad Explained',
            type: 'video',
            durationMinutes: 12,
            description:
              'Watch this short overview of Confidentiality, Integrity, and Availability—the three pillars of information security.',
          },
          {
            id: 'demo-les-1-3',
            title: 'Common Threat Landscape',
            type: 'reading',
            durationMinutes: 15,
            description: `Modern organizations face a wide range of threats:

**Malware** — Software designed to harm or exploit systems (viruses, ransomware, spyware).

**Phishing** — Fraudulent messages that trick users into revealing credentials or installing malware.

**Social engineering** — Manipulating people into breaking security procedures.

**Insider threats** — Risk from employees, contractors, or partners with legitimate access.

**Denial of Service (DoS)** — Overwhelming a service so legitimate users cannot access it.

Understanding these categories helps you prioritize controls and training.`,
          },
        ],
      },
      {
        id: 'demo-mod-2',
        title: 'Network Security Basics',
        description: 'How data moves safely across networks.',
        lessons: [
          {
            id: 'demo-les-2-1',
            title: 'Firewalls and Network Perimeters',
            type: 'reading',
            durationMinutes: 12,
            description: `A **firewall** inspects incoming and outgoing traffic and applies rules to allow or block packets.

**Types**
- **Network firewalls** — Protect entire subnets at the edge.
- **Host firewalls** — Run on individual devices.

**Defense in depth:** Firewalls are one layer. Combine them with segmentation, monitoring, and patching for stronger protection.`,
          },
          {
            id: 'demo-les-2-2',
            title: 'How HTTPS Works',
            type: 'video',
            durationMinutes: 14,
            description:
              'Learn how TLS encrypts web traffic so attackers cannot easily read or modify data in transit.',
          },
          {
            id: 'demo-les-2-3',
            title: 'Network Security Check',
            type: 'quiz',
            durationMinutes: 8,
            description: 'Answer the questions below to check your understanding of network security basics.',
            questions: [
              {
                id: 'demo-q-2-3-1',
                prompt: 'Which layer primarily filters traffic between trusted and untrusted networks?',
                type: 'multiple-choice',
                options: ['Firewall', 'Antivirus', 'Backup drive'],
                correctIndex: 0,
                explanation: 'Firewalls inspect and filter network traffic at the network perimeter.',
              },
              {
                id: 'demo-q-2-3-2',
                prompt: 'What does HTTPS add on top of HTTP?',
                type: 'multiple-choice',
                options: ['Faster downloads', 'Encryption and authentication', 'Unlimited storage'],
                correctIndex: 1,
                explanation: 'HTTPS uses TLS to encrypt data in transit and verify the server identity.',
              },
              {
                id: 'demo-q-2-3-3',
                prompt: 'Phishing attacks most often target:',
                type: 'multiple-choice',
                options: [
                  'Hardware cooling systems',
                  'Human judgment and credentials',
                  'Printer paper trays',
                ],
                correctIndex: 1,
                explanation: 'Phishing relies on social engineering to trick people into revealing secrets.',
              },
            ],
          },
        ],
      },
      {
        id: 'demo-mod-3',
        title: 'Defensive Practices',
        description: 'Everyday habits that reduce risk.',
        lessons: [
          {
            id: 'demo-les-3-1',
            title: 'Password Hygiene & MFA',
            type: 'reading',
            durationMinutes: 10,
            description: `Strong authentication reduces account takeover risk.

**Password hygiene**
- Use long, unique passwords for each account.
- Prefer a password manager over reused passwords.
- Never share credentials in chat or email.

**Multi-factor authentication (MFA)**
- Combines something you know (password) with something you have (phone/app) or something you are (biometric).
- Even if a password leaks, MFA often blocks unauthorized access.

Enable MFA on email, banking, and work accounts first.`,
          },
          {
            id: 'demo-les-3-2',
            title: 'Security Audit Worksheet',
            type: 'assignment',
            durationMinutes: 20,
            description:
              'Complete the prompts below based on your personal or lab environment. Confirm each response when finished.',
            questions: [
              {
                id: 'demo-a-3-2-1',
                prompt: 'List three accounts where MFA is enabled.',
                type: 'short-answer',
                sampleAnswer: 'Example: work email (Microsoft Authenticator), banking app, GitHub.',
              },
              {
                id: 'demo-a-3-2-2',
                prompt: 'Name two accounts that still need MFA and why they matter.',
                type: 'short-answer',
                sampleAnswer:
                  'Example: personal email (password resets), cloud storage (sensitive files).',
              },
              {
                id: 'demo-a-3-2-3',
                prompt: 'Identify one software package that should be updated and why.',
                type: 'short-answer',
                sampleAnswer:
                  'Example: web browser — outdated versions may lack security patches for known exploits.',
              },
            ],
          },
          {
            id: 'demo-les-3-3',
            title: 'Incident Response Overview',
            type: 'reading',
            durationMinutes: 12,
            description: `When a security incident occurs, a structured response limits damage.

**Typical phases**
1. **Preparation** — Policies, contacts, and tools ready before an incident.
2. **Detection & analysis** — Identify and scope the issue.
3. **Containment** — Isolate affected systems to prevent spread.
4. **Eradication & recovery** — Remove the threat and restore services.
5. **Post-incident review** — Document lessons learned and improve controls.

Congratulations—you have reached the final lesson of this demo course!`,
          },
        ],
      },
    ],
    videos: [
      {
        id: 'demo-vid-cia',
        title: 'The CIA Triad Explained',
        url: 'https://www.youtube.com/embed/inWWhr5tnEA',
        durationMinutes: 12,
        moduleId: 'demo-mod-1',
        description: 'Confidentiality, Integrity, and Availability in practice.',
      },
      {
        id: 'demo-vid-https',
        title: 'How HTTPS Works',
        url: 'https://www.youtube.com/embed/ArqcBh206Wo',
        durationMinutes: 14,
        moduleId: 'demo-mod-2',
        description: 'TLS handshake and certificate basics.',
      },
    ],
    resources: [
      {
        id: 'demo-res-syllabus',
        title: 'Course Syllabus (PDF)',
        type: 'document',
        url: '#',
        fileName: 'CYB-101-syllabus.pdf',
        description: 'Weekly outline and grading policy.',
      },
      {
        id: 'demo-res-cheatsheet',
        title: 'Security Terminology Cheatsheet',
        type: 'worksheet',
        url: '#',
        fileName: 'security-terms.pdf',
        description: 'Quick reference for key terms used in this course.',
      },
    ],
    gradingPolicy: 'Readings & videos 40% · Quizzes 25% · Assignment 20% · Participation 15%',
  }
}
