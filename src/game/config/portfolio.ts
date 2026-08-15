/**
 * Real portfolio content for destination screens (Milestone 9).
 * Do not invent education, skills, degrees, or work history here.
 */

export interface EducationEntry {
  school: string;
  degree?: string;
  year?: string;
  notes?: string;
}

export const PORTFOLIO = {
  displayName: "Nicholas Patrick Suyat",
  /** Exact file under public/ — do not rename. */
  profileImageSrc: "/images/Profilepic.png",
  profileImageAlt: "Nicholas Patrick Suyat",

  links: {
    linkedIn:
      "https://www.linkedin.com/in/nicholas-patrick-suyat-5b2065247?utm_source=share_via&utm_content=profile&utm_medium=member_ios",
    github: "https://github.com/NicholasPatrickSuyat",
  },

  /**
   * Inquiry inbox for Ashen Reach leads (server-side only — never embed in client mail).
   * Override with LEAD_TO_EMAIL in production if needed.
   */
  inquiryEmail: "Nicholaspatricksuyat@gmail.com",

  projects: {
    quoteGeneratorPro: {
      title: "Quote Generator Pro",
      status: "Live",
      url: "https://projectx-quote-generator.vercel.app/",
      blurb:
        "A service-business quoting application designed to help office staff create, manage, and deliver professional customer quotes quickly.",
    },
  },

  /**
   * Real education — single cleaned entries only (no duplicates).
   * Fields: school, degree/program, year.
   */
  education: [
    {
      school: "Nucamp Coding Bootcamp",
      degree: "Computer Science, Backend Developer",
      year: "2023",
    },
    {
      school: "Pikes Peak State College",
      degree: "Associate of Science (AS), Computer Science",
      year: "2021–2023",
    },
    {
      school: "Cheyenne Mountain High School",
      degree: "High School Diploma",
      year: "2014–2018",
    },
  ] as EducationEntry[],

  /** Real skills — only those provided. */
  skills: [
    "React / Next.js",
    "Django / Flask",
    "SQL",
    "DevOps",
    "Python",
    "TypeScript",
  ] as string[],
};
