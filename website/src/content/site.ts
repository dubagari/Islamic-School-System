// ============================================================
// SITE CONTENT — PLACEHOLDERS
// Replace every value here with the school's real details.
// Nothing else in the app contains hard-coded marketing copy.
// ============================================================

export const school = {
  name: "Darul Ulum Islamic School",
  nameArabic: "دار العلوم",
  shortName: "Darul Ulum",
  mark: "ض",
  motto: "Knowledge, Worship, Character",
  mottoArabic: "العلم والعبادة والأخلاق",
  description:
    "A madrasa where children memorize the Qur'an, master Arabic and Islamic studies, and excel in modern academics — nurtured in an environment of worship and character.",
  foundedYear: "1995",
  history: [
    "Darul Ulum began as a small neighborhood study circle with eleven students and a single teacher, walking the children through Tajweed and the pillars of worship.",
    "By the grace of Allah and the trust of the community, it grew into a full madrasa — adding graded classrooms, a modern academic curriculum, and dedicated staff — while keeping the Qur'an at the center of every student's day.",
    "Today the school serves hundreds of learners across its Tahfeez and academic tracks, graduates Huffaz who continue into secondary schools around the country, and remains committed to forming believers of sound knowledge, pure worship, and noble character.",
  ],
  mission:
    "To raise a generation of upright Muslims who carry the Book of Allah with excellence, think clearly through the sciences, and live Islam with confidence and gentleness in society.",
  vision:
    "To be the leading madrasa where sacred and modern knowledge meet under the light of the Qur'an and Sunnah.",
  principalWelcome:
    "Assalamu alaykum. At Darul Ulum your child will be taught with love: the Qur'an by tongue and heart, the sciences by curiosity and discipline, and character by living example. Our teachers see themselves not merely as instructors, but as guardians of another person's child. We ask Allah to make your children from His righteous servants.",
  principalName: "Sheikh Muhd Auwal",
  principalTitle: "Head of Madrasa",
  values: [
    { title: "Taqwa", titleArabic: "تقوى", text: "Worshipped hearts before educated tongues — every lesson begins and ends with the carriage of taqwa." },
    { title: "Ihsan", titleArabic: "إحسان", text: "Excellence in both Tahfeez and mathematics; a student's diligence is an act of worship itself." },
    { title: "Adab", titleArabic: "أدب", text: "Respect for parents, teachers, and elderly — the prophetic adab lived out in every corridor." },
    { title: "Ummah", titleArabic: "أمة", text: "Our children learn Arabic as a living language and brotherhood beyond color or class." },
  ],
  programs: [
    {
      name: "Tahfeez al-Qur'an",
      nameArabic: "تحفيظ القرآن",
      text: "A rigorous programme of memorization with daily revision, tajweed mastery, and qualified Huffaz as mentors — pace adjusted to every student.",
    },
    {
      name: "Islamic Studies",
      nameArabic: "الدراسات الإسلامية",
      text: "Fiqh, Aqeedah, Seerah, and Hadith taught with classical texts and contemporary relevance, building a sound worldview.",
    },
    {
      name: "Arabic Language",
      nameArabic: "اللغة العربية",
      text: "Nahw, Sarf, and conversation — students who can open the books of the scholars and understand the khutbah without translation.",
    },
    {
      name: "Modern Academics",
      nameArabic: "العلوم الحديثة",
      text: "English, mathematics, sciences, and digital skills under the same roof — so Huffaz matriculate into any secondary school with confidence.",
    },
  ],
  levels: [
    "Kindergarten",
    "Nisful Tamheedi",
    "Thanawiyya",
  ],
  admissionsSteps: [
    {
      title: "Submit an application",
      text: "Complete the online form on this website (or visit the school office). You will receive an application number — keep it safe.",
    },
    {
      title: "Entrance interview",
      text: "Once appraised, we invite the child for a short placement assessment (Qur'an, Arabic, and numeracy) with their parent.",
    },
    {
      title: "Admission offer",
      text: "Successful applicants receive the admission letter and fee structure for their level. Places are confirmed by payment of the registration fee.",
    },
    {
      title: "Welcome to the madrasa",
      text: "The office issues your child's class placement and tuition invoice, and the day of learning begins.",
    },
  ],
  feesNote:
    "Fee schedules vary by level and board type (day/boarding). The current schedule for every level is available at the school office — we are happy to walk you through it during the admissions interview.",
  faqs: [
    {
      q: "Must my child already memorize Qur'an before applying?",
      a: "No. Our Tahfeez track takes children from the beginning of the mushaf. A placement assessment simply helps us place your child on the right pace.",
    },
    {
      q: "Do you teach the modern academic curriculum in the same school?",
      a: "Yes. Every student takes English, mathematics, sciences, and computer studies alongside their Islamic sciences.",
    },
    {
      q: "Is the school a day or boarding madrasa?",
      a: "We operate as a day madrasa with extended supervision hours, and a boarding wing for senior Tahfeez students — ask the office for current availability.",
    },
    {
      q: "How long does the full Tahfeez journey take?",
      a: "With diligence, most students complete the memorization in three to four years — but the school follows the child's pace, not the calendar.",
    },
    {
      q: "What ages do you admit?",
      a: "Generally from age four into Kindergarten through the senior track; a few places remain each year for transfer students.",
    },
  ],
  contact: {
    address: "Placeholder Street Address, City, Country",
    phone: "+00-000-000-000",
    whatsapp: "+000000000000",
    email: "placeholder@darululum.example",
    officeHours: "Sun – Thu, 8:00 AM – 4:00 PM",
    mapNote: "Campus map and directions are available from the school office.",
  },
  news: [],
  stats: [
    { value: "100+", label: "Students enrolled" },
    { value: "60+", label: "Students memorizing the Qur'an" },
    { value: "20+", label: "Teachers and guardians" },
    { value: "30+", label: "Years of service" },
  ],
  whyFeatures: [
    {
      icon: "book",
      title: "The Book of Allah first",
      text: "Every day begins over the mushaf. Memorization, tajweed, and tafsir are woven into the timetable, not added on top of it.",
    },
    {
      icon: "graduation",
      title: "No false choice",
      text: "Your child memorizes the Qur'an AND passes standard examinations — Anabiya and the three R's taught under one roof.",
    },
    {
      icon: "heart",
      title: "Ushera by example",
      text: "Small classes mean teachers know each child's character as well as their grades — and correct them with gentleness.",
    },
  ],
};

export type SchoolContent = typeof school;

export const portalLinks = {
  portal: "http://localhost:5174/student",
  portalTeacher: "http://localhost:5174/teacher",
  portalParent: "http://localhost:5174/parent",
  admin: "https://islamic-school-system-admin-dashboa.vercel.app/",
};


