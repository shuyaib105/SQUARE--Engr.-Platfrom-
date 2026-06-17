export interface MCQ {
  question: string;
  options: string[];
  correctIdx: number;
  explanation: string;
}

export interface ChapterMCQs {
  name: string;
  board: MCQ[];
  admission: MCQ[];
}

export interface PaperMCQs {
  [chapterKey: string]: ChapterMCQs;
}

export interface SubjectMCQs {
  name: string;
  "1st": PaperMCQs;
  "2nd": PaperMCQs;
}

export interface MCQDatabase {
  [subjectKey: string]: SubjectMCQs;
}

export interface SuggestionChapter {
  id: string;
  name: string;
  boardUrl: string;
  admissionUrl: string;
  impTopics: string[];
  cqCount: string;
  mcqCount: string;
}

export interface SuggestionSubject {
  name: string;
  "1st": SuggestionChapter[];
  "2nd": SuggestionChapter[];
}

export interface SuggestionDatabase {
  [subjectKey: string]: SuggestionSubject;
}

export interface Course {
  id: number;
  batch: string;
  title: string;
  image: string;
  deadlineLabel: string;
  deadlineISO: string;
  price: string;
  originalPrice: string;
  features: string[];
}

export interface Slide {
  image: string;
}

export interface ExamRoutineItem {
  subject: string;
  paper: string;
  date: string;
  targetDate: Date;
}

export interface PollState {
  subject: string;
  paper: "1st" | "2nd";
  chapter: string;
  standard: "board" | "admission";
  count: number;
  isStarted: boolean;
  questions: MCQ[];
  answers: { [qIdx: number]: number };
}

export interface PdfState {
  subject: string;
  paper: "1st" | "2nd";
  chapter: string;
  standard: "board" | "admission";
  iframeLoading: boolean;
}

export interface QuickFeature {
  id: string;
  title: string;
  iconName: string;
  actionType: "view" | "scroll" | "toast" | "link";
  actionValue: string;
  isActive: boolean;
  colorTheme: "blue" | "slate" | "purple" | "orange" | "red" | "indigo" | "emerald" | "amber";
  adminOnly?: boolean;
}

