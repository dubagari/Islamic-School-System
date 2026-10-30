2. DATABASE_SCHEMA.md

Every collection in MongoDB.

Example:

User
â”œâ”€â”€ fullName
â”œâ”€â”€ username
â”œâ”€â”€ email
â”œâ”€â”€ password
â”œâ”€â”€ role
â””â”€â”€ ...

Student
â”œâ”€â”€ registrationNumber
â”œâ”€â”€ admissionNumber
â”œâ”€â”€ class
â”œâ”€â”€ section
â””â”€â”€ ...

Teacher
...

We'll also include relationship diagrams.
CBT collections
---------------

CbtQuestion
  subject (Subject, required)
  questionText
  type: MultipleChoice | TrueFalse
  options [{ key, text }]
  correctAnswer
  explanation
  difficulty: Easy | Medium | Hard
  defaultMarks
  isActive
  createdBy (User)

CbtExam
  title
  classSubject (ClassSubject, required)
  academicSemester (AcademicSemester)
  description, instructions
  startAt, endAt
  durationMinutes (1-480)
  passMark (0-100)
  maxAttempts (1-5)
  totalMarks
  shuffleQuestions, shuffleOptions
  resultVisibility: AfterPublish | Immediate | Hidden
  allowReview
  linkedAssessment (Assessment, optional)
  isPublished, resultsPublished, isClosed, isActive

CbtExamQuestion
  exam (CbtExam)
  question (CbtQuestion)
  order, marks
  questionText, type, options, correctAnswer, explanation (snapshot)
  unique: (exam, order) and (exam, question)

CbtAttempt
  exam (CbtExam)
  student (Student)
  attemptNumber
  status: InProgress | Submitted | Voided
  startedAt, expiresAt, submittedAt
  autoSubmitted
  questionOrder [CbtExamQuestion]
  optionOrder { questionId: [optionKey] }
  score, totalMarks, percentage, passed
  linkedScoreStatus
  startedIp, userAgent

CbtAttemptAnswer
  attempt (CbtAttempt)
  exam (CbtExam)
  student (Student)
  question (CbtExamQuestion)
  selectedAnswer
  isCorrect, marksAwarded
  answeredAt
  unique: (attempt, question)

AssessmentScore is extended with:
  source: Manual | CBT
  cbtExam (CbtExam, optional)
  cbtAttempt (CbtAttempt, optional)
