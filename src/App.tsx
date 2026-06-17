import React, { useState, useEffect } from "react";
import {
  User,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  FileText,
  Star,
  FileDown,
  Calendar,
  Mail,
  Lock,
  ArrowLeft,
  Send,
  Zap,
  CheckCircle,
  Layout,
  FileSearch,
  Clock,
  CreditCard,
  BookMarked,
  HelpCircle,
  BarChart3,
  SlidersHorizontal,
  Search,
  AlertCircle,
  Sparkles,
  ExternalLink,
  Download,
  Info,
  Check,
  X,
  PlayCircle,
  Award,
  RefreshCw,
} from "lucide-react";
import { MCQ_DATABASE, FALLBACK_MCQS, SUGGESTION_DATA, COURSES, SLIDES, HSC_ROUTINE } from "./data";
import { PollState, PdfState, QuickFeature } from "./types";
import {
  uploadPdfToFirebase,
  saveSuggestionsToFirestore,
  loadSuggestionsFromFirestore,
  DEFAULT_QUICK_FEATURES,
  saveQuickFeaturesToFirestore,
  loadQuickFeaturesFromFirestore,
  saveCoursesToFirestore,
  loadCoursesFromFirestore,
  saveRoutineToFirestore,
  loadRoutineFromFirestore,
  saveMcqDbToFirestore,
  loadMcqDbFromFirestore,
  saveFreeExamsToFirestore,
  loadFreeExamsFromFirestore,
  saveReviewsToFirestore,
  loadReviewsFromFirestore
} from "./firebase";
import { QuizUploader } from "./components/QuizUploader";
import { QuizPlayer } from "./components/QuizPlayer";
import { Upload, Database, Settings as SettingsIcon, Link2, Trash2, List, Trophy } from "lucide-react";


export function toBanglaNumber(num: number | string | undefined): string {
  if (num === undefined || num === null) return "০";
  const banglaDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return num
    .toString()
    .split("")
    .map((digit) => {
      const idx = parseInt(digit, 10);
      return isNaN(idx) ? digit : banglaDigits[idx];
    })
    .join("");
}

export function getIconComponent(name: string, className: string = "w-6 h-6") {
  switch (name) {
    case "BarChart3": return <BarChart3 className={className} />;
    case "BookOpen": return <BookOpen className={className} />;
    case "FileText": return <FileText className={className} />;
    case "Star": return <Star className={className} />;
    case "FileDown": return <FileDown className={className} />;
    case "Calendar": return <Calendar className={className} />;
    case "Award": return <Award className={className} />;
    case "HelpCircle": return <HelpCircle className={className} />;
    case "Zap": return <Zap className={className} />;
    case "Layout": return <Layout className={className} />;
    case "BookMarked": return <BookMarked className={className} />;
    case "Clock": return <Clock className={className} />;
    case "Sparkles": return <Sparkles className={className} />;
    case "SettingsIcon": return <SettingsIcon className={className} />;
    case "Database": return <Database className={className} />;
    case "Upload": return <Upload className={className} />;
    default: return <HelpCircle className={className} />;
  }
}


export default function App() {
  // Navigation & View State
  const [view, setView] = useState<"home" | "login" | "course-details" | "pdf-suggestions" | "calendar-timeline" | "poll-practice" | "free-exams" | "subject-reviews" | "admin" | "quiz-uploader" | "quiz-player">("home");
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>("HSC 26");
  const [currentSlide, setCurrentSlide] = useState<number>(0);

  // User Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");

  // Persistent Reactive Datasets loaded from localStorage or fallback defaults
  const [courses, setCourses] = useState<any[]>(() => {
    const saved = localStorage.getItem("engr_platform_courses");
    return saved ? JSON.parse(saved) : COURSES;
  });

  const [mcqDatabase, setMcqDatabase] = useState<any>(() => {
    const saved = localStorage.getItem("engr_platform_mcqs");
    return saved ? JSON.parse(saved) : MCQ_DATABASE;
  });

  const [suggestionData, setSuggestionData] = useState<any>(() => {
    const saved = localStorage.getItem("engr_platform_suggestions");
    return saved ? JSON.parse(saved) : SUGGESTION_DATA;
  });

  const [hscRoutine, setHscRoutine] = useState<any[]>(() => {
    const saved = localStorage.getItem("engr_platform_routine");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((item: any) => ({
          ...item,
          targetDate: new Date(item.targetDate)
        }));
      } catch (e) {
        return HSC_ROUTINE;
      }
    }
    return HSC_ROUTINE;
  });

  const [freeExams, setFreeExams] = useState<any[]>(() => {
    const saved = localStorage.getItem("engr_platform_free_exams");
    return saved ? JSON.parse(saved) : [
      { id: 1, title: "পদার্থবিজ্ঞান ১ম পত্র - ভেক্টর মেগা মডেল টেস্ট", subject: "physics", paper: "1st", chapter: "vector", questionsCount: 5, timeMins: 10, status: "Active" },
      { id: 2, title: "রসায়ন ১ম পত্র - গুণগত রসায়ন ডেমো পরীক্ষা", subject: "chemistry", paper: "1st", chapter: "qualitative", questionsCount: 2, timeMins: 5, status: "Active" },
      { id: 3, title: "উচ্চতর গণিত ১ম পত্র - ম্যাট্রিক্স কুইজ", subject: "math", paper: "1st", chapter: "matrix", questionsCount: 2, timeMins: 6, status: "Active" }
    ];
  });

  const [subjectReviews, setSubjectReviews] = useState<any[]>(() => {
    const saved = localStorage.getItem("engr_platform_subject_reviews");
    return saved ? JSON.parse(saved) : [
      { id: 1, subject: "পদার্থবিজ্ঞান ১ম পত্র (ভেক্টর + নিউটনিয়ান)", rating: 5, difficulty: "সহজ-মধ্যম", bestBooks: "তপন স্যার, ইসহাক স্যার", content: "ভেক্টর অধ্যায়ে নদী-নৌকা ও বৃষ্টি-ছাতার অংকগুলো সবচেয়ে বেশি গুরুত্বপূর্ণ। নিউটনিয়ান বলবিদ্যায় জড়তার ভ্রামক ও ব্যাংকিং কোণের গাণিতিক সূত্রগুলো বারবার প্র্যাকটিস করতে হবে।" },
      { id: 2, subject: "রসায়ন ১ম পত্র (গুণগত রসায়ন)", rating: 4, difficulty: "মধ্যম", bestBooks: "হাজারী স্যার", content: "কোয়ান্টাম সংখ্যা এবং দ্রাব্যতা গুনফলের অংক প্রতিবার ভর্তি পরীক্ষায় আসে। সংকরায়ণ এবং অরবিটালের আকৃতি ভালো করে পড়ে রাখবেন।" },
      { id: 3, subject: "উচ্চতর গণিত ১ম পত্র (সরলরেখা ও ম্যাট্রিক্স)", rating: 5, difficulty: "মধ্যম-কঠিন", bestBooks: "এস ইউ আহাম্মদ স্যার", content: "ম্যাট্রিক্স থেকে একটি প্রশ্ন অবশ্যই পাবেন। সরলরেখার ক্ষেত্রে লম্ব দূরত্ব এবং ক্ষেত্রফল নির্ণয়ের শর্টকাটগুলো আয়ত্তে আনলে দ্রুত উত্তর দেওয়া যাবে।" }
    ];
  });

  const [quickFeatures, setQuickFeatures] = useState<QuickFeature[]>(() => {
    const saved = localStorage.getItem("firestore_features_cache");
    return saved ? JSON.parse(saved) : DEFAULT_QUICK_FEATURES;
  });

  // Free Exams Session States
  const [activeFreeExamId, setActiveFreeExamId] = useState<number | null>(null);
  const [freeExamStarted, setFreeExamStarted] = useState<boolean>(false);
  const [freeExamQuestions, setFreeExamQuestions] = useState<any[]>([]);
  const [freeExamAnswers, setFreeExamAnswers] = useState<Record<number, number>>({});
  const [freeExamTimeLeft, setFreeExamTimeLeft] = useState<number>(0);
  const [freeExamScore, setFreeExamScore] = useState<{ correct: number; total: number; submitted: boolean } | null>(null);

  // Custom chapter creator state
  const [newChapterCode, setNewChapterCode] = useState<string>("");
  const [newChapterName, setNewChapterName] = useState<string>("");

  const [selectedCourseEditId, setSelectedCourseEditId] = useState<number | null>(null);

  const [adminTab, setAdminTab] = useState<"buttons" | "courses" | "routine" | "exams_mcqs" | "suggestions" | "reviews">("buttons");
  
  // MCQ edit helper states
  const [editingMcqSubject, setEditingMcqSubject] = useState<string>("physics");
  const [editingMcqPaper, setEditingMcqPaper] = useState<"1st" | "2nd">("1st");
  const [editingMcqChapter, setEditingMcqChapter] = useState<string>("vector");
  const [editingMcqCategory, setEditingMcqCategory] = useState<"board" | "admission">("board");
  
  // Suggestion edit helper states
  const [editingSuggSubject, setEditingSuggSubject] = useState<string>("physics");
  const [editingSuggPaper, setEditingSuggPaper] = useState<"1st" | "2nd">("1st");

  // States for adding objects
  const [newCourse, setNewCourse] = useState({
    batch: "HSC 26",
    title: "",
    image: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=600",
    deadlineLabel: "৩০ জুন",
    deadlineISO: "2026-06-30T23:59:59",
    price: "৪৫০০",
    originalPrice: "৬০০০",
    features: ["১২০+ লাইভ ক্লাস", "প্রতিদিন প্র্যাকটিস শিট", "সাপ্তাহিক মডেল টেস্ট"]
  });

  const [newRoutineItem, setNewRoutineItem] = useState({
    subject: "",
    paper: "১ম পত্র",
    date: "",
    targetDateStr: ""
  });

  const [newMcq, setNewMcq] = useState({
    question: "",
    options: ["", "", "", ""],
    correctIdx: 0,
    explanation: ""
  });

  const [newFreeExam, setNewFreeExam] = useState({
    title: "",
    subject: "physics",
    paper: "1st",
    chapter: "vector",
    questionsCount: 5,
    timeMins: 10,
    status: "Active"
  });

  const [newReview, setNewReview] = useState({
    subject: "",
    rating: 5,
    difficulty: "সহজ",
    bestBooks: "",
    content: ""
  });


  // Auth Inputs State (for demo simulation)
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  // Custom Notification Toast State
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" | "warning"; show: boolean } | null>(null);

  // Sync to local storage when state changes
  useEffect(() => {
    localStorage.setItem("engr_platform_courses", JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    localStorage.setItem("engr_platform_mcqs", JSON.stringify(mcqDatabase));
  }, [mcqDatabase]);

  useEffect(() => {
    localStorage.setItem("engr_platform_suggestions", JSON.stringify(suggestionData));
  }, [suggestionData]);

  useEffect(() => {
    localStorage.setItem("engr_platform_routine", JSON.stringify(hscRoutine));
  }, [hscRoutine]);

  useEffect(() => {
    localStorage.setItem("engr_platform_free_exams", JSON.stringify(freeExams));
  }, [freeExams]);

  useEffect(() => {
    localStorage.setItem("engr_platform_subject_reviews", JSON.stringify(subjectReviews));
  }, [subjectReviews]);

  // Scroll to top when view changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [view]);

  // Free Exam Countdown Timer Logic
  useEffect(() => {
    let timer: any;
    if (freeExamStarted && freeExamTimeLeft > 0) {
      timer = setInterval(() => {
        setFreeExamTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            // Submit with auto-flag
            setTimeout(() => handleFreeExamSubmit(true), 50);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [freeExamStarted, freeExamTimeLeft]);

  const handleFreeExamSubmit = (isTimeOver = false) => {
    setFreeExamStarted(false);
    
    let correctCount = 0;
    freeExamQuestions.forEach((q, idx) => {
      if (freeExamAnswers[idx] === q.correctIdx) {
        correctCount++;
      }
    });

    setFreeExamScore({
      correct: correctCount,
      total: freeExamQuestions.length,
      submitted: true
    });

    if (isTimeOver) {
      showToast("সময় শেষ হওয়ায় পরীক্ষাটি স্বয়ংক্রিয়ভাবে জমা নেওয়া হয়েছে!", "info");
    } else {
      showToast("আপনার পরীক্ষা সফলভাবে জমা নেওয়া হয়েছে!", "success");
    }
  };

  const handleCsvUploadForExam = (examId: number, csvText: string) => {
    try {
      const lines = csvText.split(/\r?\n/);
      if (lines.length < 2) {
        showToast("সিএসভি ফাইলে পর্যাপ্ত ডেটা নেই!", "warning");
        return;
      }

      // Parse header
      const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
      
      const questionIdx = headers.indexOf("question");
      const opt1Idx = headers.indexOf("option1");
      const opt2Idx = headers.indexOf("option2");
      const opt3Idx = headers.indexOf("option3");
      const opt4Idx = headers.indexOf("option4");
      const correctIdx = headers.indexOf("correctidx");
      const expIdx = headers.indexOf("explanation");

      if (questionIdx === -1 || opt1Idx === -1 || opt2Idx === -1 || opt3Idx === -1 || opt4Idx === -1) {
        showToast("CSV ফরম্যাট মিলাতে পারছে না। কলামে question, option1, option2, option3, option4, correctIdx থাকতে হবে।", "warning");
        return;
      }

      const parsedQuestions = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Safe CSV parser supporting quote escapes
        const row: string[] = [];
        let inQuotes = false;
        let currentVal = "";
        for (let charIdx = 0; charIdx < line.length; charIdx++) {
          const char = line[charIdx];
          if (char === '"' || char === "'") {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            row.push(currentVal.trim().replace(/^["']|["']$/g, ''));
            currentVal = "";
          } else {
            currentVal += char;
          }
        }
        row.push(currentVal.trim().replace(/^["']|["']$/g, ''));

        if (row.length < 5) continue;

        const questionText = row[questionIdx] || "";
        const opt1 = row[opt1Idx] || "";
        const opt2 = row[opt2Idx] || "";
        const opt3 = row[opt3Idx] || "";
        const opt4 = row[opt4Idx] || "";
        
        let corr = parseInt(row[correctIdx]) || 0;
        // Convert 1-based index (like 1, 2, 3, 4) to 0-based if needed
        if (corr >= 1 && corr <= 4) {
          corr = corr - 1;
        } else if (corr < 0 || corr > 3) {
          corr = 0;
        }

        const explanationText = expIdx !== -1 ? (row[expIdx] || "") : "";

        if (questionText && opt1 && opt2) {
          parsedQuestions.push({
            question: questionText,
            option1: opt1,
            option2: opt2,
            option3: opt3 || "কোনোটিই নয়",
            option4: opt4 || "সবগুলো",
            correctIdx: corr,
            explanation: explanationText
          });
        }
      }

      if (parsedQuestions.length === 0) {
        showToast("কোনো বৈধ প্রশ্ন খুঁজে পাওয়া যায়নি!", "warning");
        return;
      }

      // Update freeExams
      const updatedExams = freeExams.map((item: any) => {
        if (item.id === examId) {
          return {
            ...item,
            questions: parsedQuestions,
            questionsCount: parsedQuestions.length
          };
        }
        return item;
      });

      setFreeExams(updatedExams);
      localStorage.setItem("engr_platform_free_exams", JSON.stringify(updatedExams));
      showToast(`সফলভাবে ${toBanglaNumber(parsedQuestions.length)} টি প্রশ্ন এই পরীক্ষায় যুক্ত হয়েছে!`, "success");
    } catch (error) {
      showToast("CSV ফাইল পার্স করতে সমস্যা হয়েছে। দয়া করে সঠিক কলামের কমা সেপারেটেড ফাইল প্রদান করুন।", "warning");
    }
  };

  const startExamSession = (test: any) => {
    setActiveFreeExamId(test.id);
    let questionsList: any[] = [];
    
    if (test.questions && test.questions.length > 0) {
      questionsList = test.questions;
    } else {
      // Dynamic fallback
      const subj = test.subject || "physics";
      const paperVal = test.paper || "1st";
      const chKey = test.chapter || "vector";
      
      const chapterObj = mcqDatabase[subj]?.[paperVal]?.[chKey];
      if (chapterObj) {
        const boardQ = chapterObj.board || [];
        const admQ = chapterObj.admission || [];
        questionsList = [...boardQ, ...admQ].slice(0, test.questionsCount || 5);
      }
    }

    if (questionsList.length === 0) {
      showToast("এই পরীক্ষার জন্য বর্তমানে কোনো প্রশ্ন সংরক্ষিত নেই। অনুগ্রহ করে গ্লোবাল ডাটাবেজে প্রশ্ন যোগ করুন অথবা CSV আপলোড করুন।", "warning");
      return;
    }

    setFreeExamQuestions(questionsList);
    setFreeExamAnswers({});
    setFreeExamTimeLeft((test.timeMins || 10) * 60);
    setFreeExamScore(null);
    setFreeExamStarted(true);
  };

  const formatTimeLeft = (secondsCount: number) => {
    const min = Math.floor(secondsCount / 60);
    const sec = secondsCount % 60;
    const formatted = `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
    return toBanglaNumber(formatted);
  };

  // Countdown Timer State
  const [timeRemaining, setTimeRemaining] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, completed: false });

  // Routine Search Query State
  const [routineSearch, setRoutineSearch] = useState<string>("");

  // Suggestion PDF State
  const [pdfState, setPdfState] = useState<PdfState>({
    subject: "physics",
    paper: "1st",
    chapter: "vector",
    standard: "board",
    iframeLoading: true,
  });

  // Interactive Poll Practice State
  const [pollState, setPollState] = useState<PollState>({
    subject: "physics",
    paper: "1st",
    chapter: "vector",
    standard: "board",
    count: 5,
    isStarted: false,
    questions: [],
    answers: {},
  });

  // Function to trigger elegant non-intrusive toasts
  const showToast = (message: string, type: "success" | "info" | "warning" = "info") => {
    setToast({ message, type, show: true });
    setTimeout(() => {
      setToast((prev) => (prev ? { ...prev, show: false } : null));
    }, 4000);
  };

  // MathJax re-render trigger on state updates
  useEffect(() => {
    try {
      if ((window as any).MathJax && (window as any).MathJax.typesetPromise) {
        (window as any).MathJax.typesetPromise();
      }
    } catch (err) {
      console.warn("MathJax formatting error:", err);
    }
  }, [
    view,
    pollState.isStarted,
    pollState.answers,
    pdfState.chapter,
    pdfState.paper,
    pdfState.standard,
    selectedCourseId,
  ]);

  // Automatic Hero Carousel effect
  useEffect(() => {
    if (view === "home") {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev === SLIDES.length - 1 ? 0 : prev + 1));
      }, 6000);
      return () => clearInterval(interval);
    }
  }, [view]);

  // Routine countdown timer calculation
  useEffect(() => {
    const targetDate = new Date("2026-06-21T10:00:00");
    const updateTimer = () => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();
      if (difference <= 0) {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0, completed: true });
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        setTimeRemaining({ days, hours, minutes, seconds, completed: false });
      }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync Slider range bounds when database lists reload
  const getActiveChapterMcqs = (subj: string, pr: "1st" | "2nd", ch: string, std: "board" | "admission") => {
    if (!ch) return [];
    const chData = mcqDatabase[subj]?.[pr]?.[ch];
    if (chData) {
      return chData[std] || [];
    }
    return [];
  };

  // Core event handlers for updating Poll config safely
  const handlePollSubjectChange = (subjectVal: string) => {
    const paperVal = pollState.paper;
    const chaptersMap = mcqDatabase[subjectVal]?.[paperVal] || {};
    const chapterKeys = Object.keys(chaptersMap);
    const chosenChapter = chapterKeys[0] || "";

    const qs = getActiveChapterMcqs(subjectVal, paperVal, chosenChapter, pollState.standard);
    const resolvedLimit = qs.length > 0 ? qs.length : FALLBACK_MCQS.length;

    setPollState((prev) => ({
      ...prev,
      subject: subjectVal,
      chapter: chosenChapter,
      count: Math.min(prev.count, resolvedLimit) || resolvedLimit,
      answers: {},
    }));
  };

  const handlePollPaperChange = (paperVal: "1st" | "2nd") => {
    const subjectVal = pollState.subject;
    const chaptersMap = mcqDatabase[subjectVal]?.[paperVal] || {};
    const chapterKeys = Object.keys(chaptersMap);
    const chosenChapter = chapterKeys[0] || "";

    const qs = getActiveChapterMcqs(subjectVal, paperVal, chosenChapter, pollState.standard);
    const resolvedLimit = qs.length > 0 ? qs.length : FALLBACK_MCQS.length;

    setPollState((prev) => ({
      ...prev,
      paper: paperVal,
      chapter: chosenChapter,
      count: Math.min(prev.count, resolvedLimit) || resolvedLimit,
      answers: {},
    }));
  };

  const handlePollChapterChange = (chapterVal: string) => {
    const qs = getActiveChapterMcqs(pollState.subject, pollState.paper, chapterVal, pollState.standard);
    const resolvedLimit = qs.length > 0 ? qs.length : FALLBACK_MCQS.length;

    setPollState((prev) => ({
      ...prev,
      chapter: chapterVal,
      count: Math.min(prev.count, resolvedLimit) || resolvedLimit,
      answers: {},
    }));
  };

  const handlePollStandardChange = (stdVal: "board" | "admission") => {
    const qs = getActiveChapterMcqs(pollState.subject, pollState.paper, pollState.chapter, stdVal);
    const resolvedLimit = qs.length > 0 ? qs.length : FALLBACK_MCQS.length;

    setPollState((prev) => ({
      ...prev,
      standard: stdVal,
      count: Math.min(prev.count, resolvedLimit) || resolvedLimit,
      answers: {},
    }));
  };

  // Live countdown calculation for exam routine rows
  const getDaysDiffFromToday = (target: Date): string => {
    const now = new Date();
    const diff = target.getTime() - now.getTime();
    if (diff <= 0) {
      return "পরীক্ষা শেষ/চলমান";
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) {
      return "আজকে পরীক্ষা";
    }
    return `${toBanglaNumber(days)} দিন বাকি`;
  };

  // Filter Routine based on query
  const filteredRoutine = hscRoutine.filter((item) => {
    return (
      item.subject.toLowerCase().includes(routineSearch.toLowerCase()) ||
      item.paper.toLowerCase().includes(routineSearch.toLowerCase())
    );
  });

  // Start Instant Poll session
  const startPollSession = () => {
    const qs = getActiveChapterMcqs(pollState.subject, pollState.paper, pollState.chapter, pollState.standard);
    const sourceQuestions = qs.length > 0 ? qs : FALLBACK_MCQS;

    // Shuffle and pick maximum selected amount
    const shuffled = [...sourceQuestions].sort(() => 0.5 - Math.random());
    const subset = shuffled.slice(0, pollState.count);

    setPollState((prev) => ({
      ...prev,
      isStarted: true,
      questions: subset,
      answers: {},
    }));
    showToast("লাইভ পোল সেশন শুরু হয়েছে!", "success");
  };

  const handleAnswerSubmit = (qIdx: number, optIdx: number) => {
    if (pollState.answers[qIdx] !== undefined) return;
    setPollState((prev) => {
      const updatedAnswers = { ...prev.answers, [qIdx]: optIdx };
      return {
        ...prev,
        answers: updatedAnswers,
      };
    });
  };

  // Firebase Storage & Firestore States
  const [pdfPortalTab, setPdfPortalTab] = useState<"viewer" | "storage">("viewer");
  const [firebaseFile, setFirebaseFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadedFilesList, setUploadedFilesList] = useState<any[]>([]);

  // Sync suggestion filter choices
  const handlePdfSubjectChange = (subjectVal: string) => {
    const activeChaptersList = suggestionData[subjectVal]?.[pdfState.paper] || [];
    const firstChId = activeChaptersList[0]?.id || "";
    setPdfState((prev) => ({
      ...prev,
      subject: subjectVal,
      chapter: firstChId,
      iframeLoading: true,
    }));
  };

  const handlePdfPaperChange = (paperVal: "1st" | "2nd") => {
    const activeChaptersList = suggestionData[pdfState.subject]?.[paperVal] || [];
    const firstChId = activeChaptersList[0]?.id || "";
    setPdfState((prev) => ({
      ...prev,
      paper: paperVal,
      chapter: firstChId,
      iframeLoading: true,
    }));
  };

  // Fetch list of files uploaded to Firebase Storage
  const fetchUploadedFiles = async () => {
    try {
      const { storage } = await import("./firebase");
      const { ref, listAll } = await import("firebase/storage");
      const folderRef = ref(storage, `suggestions/${pdfState.subject}/${pdfState.paper}`);
      const res = await listAll(folderRef);
      const files = res.items.map(item => ({
        name: item.name,
        fullPath: item.fullPath,
      }));
      setUploadedFilesList(files);
    } catch (err: any) {
      console.warn("Could not list Firebase Storage suggestions:", err);
    }
  };

  // Trigger loading uploaded listing and initial Firestore suggestion data fetch
  useEffect(() => {
    async function loadFirestoreData() {
      try {
        const cloudData = await loadSuggestionsFromFirestore();
        if (cloudData) {
          setSuggestionData(cloudData);
        }
      } catch (err) {
        console.warn("Error running initial firestore recommendations load:", err);
      }

      try {
        const cloudFeatures = await loadQuickFeaturesFromFirestore();
        if (cloudFeatures && Array.isArray(cloudFeatures)) {
          setQuickFeatures(cloudFeatures);
        }
      } catch (err) {
        console.warn("Error running initial firestore features load:", err);
      }

      try {
        const cloudCourses = await loadCoursesFromFirestore();
        if (cloudCourses && Array.isArray(cloudCourses)) {
          setCourses(cloudCourses);
        }
      } catch (err) {
        console.warn("Error running initial firestore courses load:", err);
      }

      try {
        const cloudRoutine = await loadRoutineFromFirestore();
        if (cloudRoutine && Array.isArray(cloudRoutine)) {
          const parsed = cloudRoutine.map((item: any) => ({
            ...item,
            targetDate: item.targetDate ? new Date(item.targetDate) : undefined
          }));
          setHscRoutine(parsed);
        }
      } catch (err) {
        console.warn("Error running initial firestore routine load:", err);
      }

      try {
        const cloudMcqs = await loadMcqDbFromFirestore();
        if (cloudMcqs) {
          setMcqDatabase(cloudMcqs);
        }
      } catch (err) {
        console.warn("Error running initial firestore mcqs load:", err);
      }

      try {
        const cloudFreeExams = await loadFreeExamsFromFirestore();
        if (cloudFreeExams && Array.isArray(cloudFreeExams)) {
          setFreeExams(cloudFreeExams);
        }
      } catch (err) {
        console.warn("Error running initial firestore free exams load:", err);
      }

      try {
        const cloudReviews = await loadReviewsFromFirestore();
        if (cloudReviews && Array.isArray(cloudReviews)) {
          setSubjectReviews(cloudReviews);
        }
      } catch (err) {
        console.warn("Error running initial firestore reviews load:", err);
      }
    }
    loadFirestoreData();
  }, []);

  useEffect(() => {
    if (view === "pdf-suggestions") {
      fetchUploadedFiles();
    }
  }, [view, pdfState.subject, pdfState.paper]);

  // Handle uploading PDF to Firebase Storage and saving to Firestore
  const handleUploadToFirebase = async () => {
    if (!firebaseFile) {
      showToast("দয়া করে প্রথমে একটি পিডিএফ ফাইল সিলেক্ট করুন।", "warning");
      return;
    }
    
    setIsUploading(true);
    try {
      showToast("ফাইল ফায়রবেস স্টোরেজে আপলোড হচ্ছে...", "info");
      const publicUrl = await uploadPdfToFirebase(
        firebaseFile,
        pdfState.subject,
        pdfState.paper,
        pdfState.chapter,
        pdfState.standard
      );

      // Successfully uploaded! Update current react state
      let updatedData: any = null;
      setSuggestionData((prev: any) => {
        const copy = JSON.parse(JSON.stringify(prev)); // Deep copy
        if (copy[pdfState.subject] && copy[pdfState.subject][pdfState.paper]) {
          copy[pdfState.subject][pdfState.paper] = copy[pdfState.subject][pdfState.paper].map((ch: any) => {
            if (ch.id === pdfState.chapter) {
              if (pdfState.standard === "board") {
                return { ...ch, boardUrl: publicUrl };
              } else {
                return { ...ch, admissionUrl: publicUrl };
              }
            }
            return ch;
          });
        }
        updatedData = copy;
        return copy;
      });

      // Write the updated suggestions to Firestore
      setTimeout(async () => {
        if (updatedData) {
          try {
            await saveSuggestionsToFirestore(updatedData);
            showToast("ফায়ারবেস স্টোরেজ ও ক্লাউড ডাটাবেজে পিডিএফ সফলভাবে সংরক্ষিত হয়েছে!", "success");
          } catch (e) {
            showToast("সুপার সাকসেস কিন্তু ক্লাউড ডাটাবেজে সেইভ করতে সমস্যা হয়েছে।", "warning");
          }
        }
      }, 100);

      setFirebaseFile(null);
      fetchUploadedFiles();
    } catch (error: any) {
      console.error(error);
      showToast(error.message || "আপলোড প্রসেস সফল হয়নি!", "warning");
    } finally {
      setIsUploading(false);
    }
  };


  const activeSuggestionChapters = suggestionData[pdfState.subject]?.[pdfState.paper] || [];
  const activeSuggestionObj =
    activeSuggestionChapters.find((ch: any) => ch.id === pdfState.chapter) || activeSuggestionChapters[0];

  const activeCourse = courses.find((c: any) => c.id === selectedCourseId);
  const isCourseOfferActive = activeCourse ? new Date(activeCourse.deadlineISO) > new Date() : false;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-black selection:text-white">
      
      {/* ================= HEADER / NAVIGATION ================= */}
      {view !== "login" && (
        <nav
          id="main-nav"
          className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm"
        >
          <div className="max-w-7xl mx-auto px-4 md:px-8 h-18 flex items-center justify-between">
            <div
              className="flex items-center gap-1.5 cursor-pointer group"
              onClick={() => setView("home")}
            >
              <div className="w-14 h-14 p-0.5 border-2 border-transparent group-hover:border-black rounded-xl transition-all duration-300">
                <img
                  src="https://raw.githubusercontent.com/shuyaib105/square/refs/heads/main/1536-removebg-preview.png"
                  alt="Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xl font-extrabold text-black tracking-tight font-mixed">
                Engr. Platform
              </span>
            </div>
            
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <button
                    onClick={() => setView("admin")}
                    className="flex items-center gap-1.5 bg-red-600 text-white px-4.5 py-2.5 rounded-full font-bold hover:bg-red-700 transition-all font-mixed text-xs cursor-pointer shadow-sm"
                  >
                    <SettingsIcon className="w-3.5 h-3.5" /> এডমিন প্যানেল
                  </button>
                )}
                <span className="text-xs text-slate-500 font-medium font-mixed hidden md:inline truncate max-w-[150px]">
                  {currentUserEmail}
                </span>
                <button
                  onClick={() => {
                    setIsLoggedIn(false);
                    setIsAdmin(false);
                    setCurrentUserEmail("");
                    setView("home");
                    showToast("লগআউট করা হয়েছে।", "info");
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4.5 py-2.5 rounded-full font-bold transition-all font-mixed text-xs cursor-pointer"
                >
                  লগআউট
                </button>
              </div>
            ) : (
              <button
                onClick={() => setView("login")}
                className="flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-full font-bold hover:bg-slate-800 transition-all transform hover:scale-102 font-mixed cursor-pointer shadow-md text-sm cursor-pointer"
              >
                <User className="w-4 h-4" /> লগইন
              </button>
            )}
          </div>
        </nav>
      )}

      {/* ================= DYNAMIC VIEW PANELS ================= */}
      <main className="flex-1">
        
        {/* VIEW 1: HOME PANEL */}
        {view === "home" && (
          <div className="animate-tab-content">
            
            {/* Carousel Slider */}
            <section className="relative overflow-hidden w-full bg-black group" style={{ aspectRatio: "16/9", maxHeight: "500px" }}>
              <div className="relative w-full h-full">
                {SLIDES.map((slide, idx) => (
                  <div
                    key={idx}
                    className={`absolute inset-0 transition-opacity duration-1000 ${
                      idx === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
                    }`}
                  >
                    <img
                      src={slide.image}
                      alt={`Slider ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 hero-gradient"></div>
                  </div>
                ))}
              </div>



              {/* Slider Arrows */}
              <button
                onClick={() =>
                  setCurrentSlide((prev) => (prev === 0 ? SLIDES.length - 1 : prev - 1))
                }
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black p-2.5 rounded-full text-white backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 z-30 cursor-pointer hidden sm:block"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() =>
                  setCurrentSlide((prev) => (prev === SLIDES.length - 1 ? 0 : prev + 1))
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black p-2.5 rounded-full text-white backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 z-30 cursor-pointer hidden sm:block"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Carousel Dots */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-30">
                {SLIDES.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      idx === currentSlide ? "w-8 bg-white" : "w-2 bg-white/50"
                    }`}
                  ></button>
                ))}
              </div>
            </section>

            {/* Quick Access Grid Card Menu */}
            <section className="max-w-7xl mx-auto px-4 md:px-8 pt-12">
              <div className="text-center mb-10">
                <h2 className="font-mixed text-2xl md:text-3xl lg:text-4xl font-extrabold text-black mb-1">
                  এক নজরে সকল সার্ভিস
                </h2>

                <div className="h-1.5 w-12 bg-black mt-3 mx-auto rounded-full"></div>
              </div>

              <div className="grid grid-cols-3 gap-2.5 sm:gap-4 md:gap-8">
                {quickFeatures.map((feature) => {
                  if (!feature.isActive) return null;
                  if (feature.adminOnly && !isAdmin) return null;

                  // Dynamic color styling
                  let bgClass = "bg-blue-50";
                  let textClass = "text-blue-600";
                  if (feature.colorTheme === "slate") { bgClass = "bg-slate-100"; textClass = "text-slate-800"; }
                  else if (feature.colorTheme === "purple") { bgClass = "bg-purple-50"; textClass = "text-purple-600"; }
                  else if (feature.colorTheme === "orange") { bgClass = "bg-orange-50"; textClass = "text-orange-600"; }
                  else if (feature.colorTheme === "red") { bgClass = "bg-red-50"; textClass = "text-red-600"; }
                  else if (feature.colorTheme === "indigo") { bgClass = "bg-indigo-50"; textClass = "text-indigo-600"; }
                  else if (feature.colorTheme === "emerald") { bgClass = "bg-emerald-50"; textClass = "text-emerald-700"; }
                  else if (feature.colorTheme === "amber") { bgClass = "bg-amber-50"; textClass = "text-amber-700"; }

                  const handleFeatureClick = () => {
                    if (feature.id === "exam" || feature.actionValue === "free-exams") {
                      setView("free-exams");
                      return;
                    }
                    if (feature.actionType === "view") {
                      setView(feature.actionValue as any);
                    } else if (feature.actionType === "scroll") {
                      const el = document.getElementById(feature.actionValue);
                      if (el) {
                        el.scrollIntoView({ behavior: "smooth" });
                      } else {
                        showToast("সেকশনটি খুঁজে পাওয়া যায়নি।", "warning");
                      }
                    } else if (feature.actionType === "toast") {
                      showToast(feature.actionValue, "info");
                    } else if (feature.actionType === "link") {
                      window.open(feature.actionValue, "_blank");
                    }
                  };

                  return (
                    <button
                      key={feature.id}
                      onClick={handleFeatureClick}
                      className="flex flex-col items-center justify-center gap-2 md:gap-5 p-3 sm:p-5 md:p-8 bg-white border border-slate-200/60 rounded-2xl md:rounded-3xl shadow-sm hover:shadow-xl hover:border-black transition-all group relative overflow-hidden text-center cursor-pointer"
                    >
                      <div className={`${bgClass} p-2 sm:p-4 md:p-5 rounded-xl md:rounded-2xl group-hover:bg-black transition-all duration-300 transform group-hover:rotate-6 flex items-center justify-center`}>
                        {getIconComponent(feature.iconName, `${textClass} group-hover:text-white transition-colors w-5 h-5 sm:w-7 sm:h-7 md:w-9 md:h-9`)}
                      </div>
                      <span className="font-mixed text-[11px] sm:text-xs md:text-lg lg:text-xl font-bold text-slate-800 group-hover:text-black transition-colors leading-tight">
                        {feature.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Program & Course Selection Showcase */}
            <section id="courses-section" className="bg-slate-100/50 pt-12 pb-20 px-4 mt-16 border-t border-slate-200/60 scroll-mt-20">
              <div className="max-w-7xl mx-auto">
                <div className="text-center mb-10">
                  <span className="text-xs font-bold text-slate-500 font-mixed tracking-widest uppercase block mb-2">
                    ভর্তি সহায়িকা প্যানেল
                  </span>
                  <h2 className="font-mixed text-3xl md:text-4xl font-extrabold text-black mb-2">
                    আমাদের এক্সক্লুসিভ কোর্সসমূহ
                  </h2>
                  <div className="flex justify-center mt-6">
                    <div className="inline-flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200/60 overflow-x-auto no-scrollbar whitespace-nowrap">
                      {["HSC 26", "HSC 27", "Admission"].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`course-tab px-6 md:px-10 py-3 rounded-xl font-bold transition-all font-mixed text-md cursor-pointer ${
                            activeTab === tab
                              ? "bg-black text-white shadow-md font-extrabold"
                              : "text-slate-600 hover:bg-slate-100 hover:text-black"
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Course Grid loop */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-tab-content">
                  {courses.filter((c) => c.batch === activeTab).map((course) => {
                    const isOfferActive = new Date(course.deadlineISO) > new Date();
                    return (
                      <div
                        key={course.id}
                        className="bg-white rounded-[2rem] overflow-hidden shadow-md border border-slate-100 hover:-translate-y-2 transition-all duration-300 group flex flex-col justify-between"
                      >
                        <div className="relative aspect-video overflow-hidden">
                          <img
                            src={course.image}
                            alt={course.title}
                            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                          />
                          {isOfferActive && (
                            <div className="absolute top-0 left-0 z-10">
                              <div className="premium-badge-red shine-effect relative flex items-center gap-1.5 px-4 py-2 text-white font-extrabold">
                                <Zap className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400 animate-pulse" />
                                <span className="font-mixed text-xs tracking-wide">
                                  ডিসকাউন্ট অফার শেষ: {course.deadlineLabel}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="font-mixed text-lg md:text-xl font-extrabold text-black mb-3 line-clamp-2 leading-snug">
                              {course.title}
                            </h3>
                            <div className="bg-slate-50 border-l-4 border-black p-3.5 rounded-r-2xl mb-6 flex items-baseline justify-between shadow-sm">
                              <div className="flex items-baseline gap-2">
                                <span className="font-mixed text-2xl font-black text-black">
                                  ৳{toBanglaNumber(isOfferActive ? course.price : course.originalPrice)}
                                </span>
                                {isOfferActive && (
                                  <span className="font-mixed text-xs md:text-sm text-slate-400 line-through">
                                    ৳{toBanglaNumber(course.originalPrice)}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                এককালীন ফি
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col gap-3">
                            <button
                              onClick={() => {
                                setSelectedCourseId(course.id);
                                setView("course-details");
                              }}
                              className="w-full bg-black text-white py-3.5 rounded-xl font-bold text-md hover:bg-slate-900 transition-all font-mixed cursor-pointer text-center"
                            >
                              এনরোলমেন্ট দেখুন
                            </button>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => {
                                  setSelectedCourseId(course.id);
                                  setView("course-details");
                                }}
                                className="flex items-center justify-center gap-2 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-bold hover:border-black hover:text-black transition-all font-mixed cursor-pointer"
                              >
                                <Calendar className="w-4 h-4" />
                                <span className="text-xs">রুটিন</span>
                              </button>
                              <div className="rotating-border-container">
                                <button
                                  onClick={() => {
                                    setSelectedCourseId(course.id);
                                    setView("course-details");
                                  }}
                                  className="rotating-border-inner flex items-center justify-center gap-1 py-1.5 text-black font-bold w-full font-mixed cursor-pointer text-xs"
                                >
                                  <Info className="w-3.5 h-3.5" />
                                  <span className="font-bold">বিস্তারিত</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* VIEW 2: LOGIN PANEL */}
        {view === "login" && (
          <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 text-slate-900 animate-tab-content">
            <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-xl border border-slate-200/85 overflow-hidden">
              <div className="p-8 md:p-12">
                <div className="flex flex-col items-center mb-8">
                  <div
                    className="w-16 h-16 mb-4 cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => setView("home")}
                  >
                    <img
                      src="https://raw.githubusercontent.com/shuyaib105/square/refs/heads/main/1536-removebg-preview.png"
                      alt="Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-extrabold font-mixed text-slate-900 tracking-tight">
                    নিরাপদ লগইন
                  </h2>
                  <p className="text-slate-500 font-mixed text-xs mt-2 text-center">
                    আপনার ড্যাশবোর্ড ও ট্র্যাকিং সেকশন অ্যাক্সেস করুন
                  </p>
                </div>

                <form
                  className="space-y-5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (email.trim() === "mdshuyaibislam5050@gmail.com" && password === "shuyaib2332@") {
                      showToast("আসসালামু আলাইকুম এডমিন! এডমিন প্যানেলে স্বাগতম।", "success");
                      setIsLoggedIn(true);
                      setIsAdmin(true);
                      setCurrentUserEmail("mdshuyaibislam5050@gmail.com");
                      setView("admin");
                    } else if (email && password) {
                      showToast("সফলভাবে লগইন করা হয়েছে!", "success");
                      setIsLoggedIn(true);
                      setIsAdmin(false);
                      setCurrentUserEmail(email);
                      setView("home");
                    } else {
                      showToast("দয়া করে সঠিক ইমেল এবং পাসওয়ার্ড প্রবেশ করান", "warning");
                    }
                  }}
                >
                  <div>
                    <label className="block text-xs font-bold font-mixed text-slate-700 mb-2 ml-1">
                      ইমেইল বা ফোন নম্বর
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-5 h-5" />
                      </div>
                      <input
                        type="text"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-300 focus:bg-white text-slate-900 text-sm font-mixed transition-all"
                        placeholder="example@email.com বা 01xxxxxxxxx"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2 ml-1">
                      <label className="text-xs font-bold font-mixed text-slate-700">
                        পাসওয়ার্ড
                      </label>
                      <button
                        type="button"
                        onClick={() => showToast("পাসওয়ার্ড পুনরুদ্ধারের সেবাটি শীঘ্রই সচল হবে।", "info")}
                        className="text-[10px] font-bold font-mixed text-slate-500 hover:text-black"
                      >
                        ভুলে গেছেন?
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-5 h-5" />
                      </div>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-300 focus:bg-white text-slate-900 text-sm font-mixed transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-black text-white py-4 rounded-2xl font-extrabold text-md hover:bg-slate-850 transition-all transform active:scale-98 font-mixed shadow-lg shadow-slate-100 mt-4 cursor-pointer"
                  >
                    লগইন করুন
                  </button>
                </form>

                <div className="mt-10 pt-8 border-t border-slate-100 flex flex-col items-center">
                  <p className="text-slate-500 font-mixed text-xs mb-4">
                    নতুন অ্যাকাউন্ট খুলতে চান?
                  </p>
                  <a
                    href="https://t.me/shu_yaib"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-sky-50 border border-sky-100/70 text-sky-700 px-6 py-3.5 rounded-2xl font-bold font-mixed hover:bg-sky-100 transition-colors w-full justify-center text-xs"
                  >
                    <Send className="w-4 h-4 text-sky-600" /> রেজিস্ট্রেশনের জন্য সরাসরি মেন্টরকে মেসেজ করুন
                  </a>
                </div>
              </div>
            </div>
            <button
              onClick={() => setView("home")}
              className="mt-8 flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-mixed font-bold text-sm cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> মেইন পেজে ফিরে যান
            </button>
          </div>
        )}

        {/* VIEW 3: COURSE DETAILS PANEL */}
        {view === "course-details" && activeCourse && (
          <div className="animate-tab-content">
            <div className="bg-white border-b border-slate-200 sticky top-18 z-40">
              <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
                <button
                  onClick={() => {
                    setSelectedCourseId(null);
                    setView("home");
                  }}
                  className="flex items-center gap-2 text-slate-700 hover:text-black font-extrabold font-mixed transition-colors text-sm cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" /> কোর্সের তালিকায় ফিরুন
                </button>
                <span className="text-xs font-bold text-slate-400 font-mixed">
                  কোর্স আইডি: #{activeCourse.id}
                </span>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column Description */}
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-slate-200/80">
                  <div className="aspect-video w-full relative">
                    <img
                      src={activeCourse.image}
                      alt={activeCourse.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end p-6 md:p-10">
                      <h1 className="text-white text-2xl md:text-3xl lg:text-4xl font-black font-mixed leading-tight">
                        {activeCourse.title}
                      </h1>
                    </div>
                  </div>
                  <div className="p-6 md:p-8">
                    <h2 className="text-lg md:text-xl font-extrabold font-mixed text-black mb-4 flex items-center gap-2.5">
                      <Layout className="w-5 h-5 text-slate-500" /> এই কোর্সের বৈশিষ্ট্য ও পরিচিতি
                    </h2>
                    <p className="text-slate-600 font-mixed leading-relaxed text-sm md:text-md mb-6">
                      এইচএসসি এবং বুয়েট, রুয়েট, কুয়েট, চুয়েট ভর্তি ইচ্ছুকদের জন্য চূড়ান্ত রোডম্যাপ সংবলিত এই কোর্সে সম্পূর্ণ থিওরি নিখুঁত বিশ্লেষণের পর বিগত বিশ বছরের ভর্তি প্রশ্নসমূহের সঠিক ট্রিকস শেখানো হবে। এর ফলে খুব অল্প সময়ে সঠিক উত্তর ট্র্যাকিং করা সম্ভব হবে।
                    </p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center text-center shadow-xs">
                        <PlayCircle className="w-6 h-6 text-black mb-2" />
                        <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">রিয়েল-টাইম ক্লাস</span>
                        <span className="font-extrabold font-mixed text-sm text-slate-800 mt-1">{activeCourse.classesCount || "১২০+ সেশন"}</span>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center text-center shadow-xs">
                        <FileSearch className="w-6 h-6 text-black mb-2" />
                        <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">মূল্যায়ন সেট</span>
                        <span className="font-extrabold font-mixed text-sm text-slate-800 mt-1">{activeCourse.examsCount || "১৬টি মডেল টেস্ট"}</span>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center text-center shadow-xs">
                        <Calendar className="w-6 h-6 text-black mb-2" />
                        <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">মোট মেয়াদ</span>
                        <span className="font-extrabold font-mixed text-sm text-slate-800 mt-1">{activeCourse.duration || "০৬ মাস"}</span>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center text-center shadow-xs">
                        <User className="w-6 h-6 text-black mb-2" />
                        <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">২৪/৭ ওয়ান ওয়ান</span>
                        <span className="font-extrabold font-mixed text-sm text-slate-800 mt-1">{activeCourse.mentorSupport || "মেন্টর সাপোর্ট"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sessional/Routine Class details inside Course Details */}
                <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-200/80">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                    <h2 className="text-lg md:text-xl font-extrabold font-mixed text-black flex items-center gap-2.5">
                      <Clock className="w-5 h-5 text-slate-500" /> ক্লাস ও পরীক্ষার রুটিন ছক
                    </h2>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full font-mixed">
                      লাইভ ক্লাসের তালিকা
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[500px]">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-bold text-xs uppercase tracking-wider text-left">
                          <th className="py-4 font-mixed font-extrabold text-slate-500 text-sm">বার</th>
                          <th className="py-4 font-mixed font-extrabold text-slate-500 text-sm">বিষয়</th>
                          <th className="py-4 font-mixed font-extrabold text-slate-500 text-sm">সময়</th>
                          <th className="py-4 font-mixed font-extrabold text-slate-500 text-sm">নির্ধারিত টপিক বা অধ্যায়</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800">
                        {(activeCourse.routineList && activeCourse.routineList.length > 0
                          ? activeCourse.routineList
                          : [
                              { day: "শনিবার", subject: "পদার্থবিজ্ঞান (Physics)", time: "০৯:০০ PM", topic: "ভেক্টর ও গতিবিদ্যা ম্যাথ হ্যাকস" },
                              { day: "সোমবার", subject: "রসায়ন (Chemistry)", time: "০৮:৩০ PM", topic: "পর্যায়বৃত্ত ধর্ম ও সংকরায়ণ সমীকরণ" },
                              { day: "বুধবার", subject: "উচ্চতর গণিত (Math)", time: "০৯:০০ PM", topic: "ম্যাট্রিক্স ও ক্রেমার সুত্র সলভিং" },
                              { day: "শুক্রবার", subject: "উইকলি পরীক্ষা", time: "০৪:০০ PM", topic: "সাপ্তাহিক স্পেশাল এমসিকিউ ও সেশন ট্র্যাকিং" }
                            ]
                        ).map((session: any, sIdx: number) => (
                          <tr key={sIdx} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-5 font-mixed font-bold text-black text-sm">{session.day}</td>
                            <td className="py-5">
                              <span className="px-3 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 font-mixed">{session.subject}</span>
                            </td>
                            <td className="py-5 font-mixed text-slate-600 text-sm">
                              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {session.time}</span>
                            </td>
                            <td className="py-5 font-mixed text-slate-500 text-xs md:text-sm">{session.topic}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right Column Checkout Panel */}
              <div className="lg:col-span-1">
                <div className="sticky top-24 bg-white rounded-[2rem] p-6 md:p-8 shadow-xl border border-slate-200/60 transition-all">
                  <div className="mb-6">
                    <span className="text-[10px] font-black text-slate-400 font-mixed uppercase tracking-widest block mb-2">
                      ভর্তি ফি পেমেন্ট
                    </span>
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-4xl font-black font-mixed text-black">
                        ৳{toBanglaNumber(isCourseOfferActive ? activeCourse.price : activeCourse.originalPrice)}
                      </h3>
                      {isCourseOfferActive && (
                        <span className="text-lg text-slate-400 line-through font-mixed">
                          ৳{toBanglaNumber(activeCourse.originalPrice)}
                        </span>
                      )}
                    </div>
                    {isCourseOfferActive && (
                      <div className="mt-4 bg-red-50 text-red-650 px-4 py-2.5 rounded-2xl text-xs font-bold font-mixed flex items-center gap-2 border border-red-100 shadow-xs">
                        <Zap className="w-4 h-4 fill-red-600 text-red-600 animate-pulse" />
                        <span>অফারটি সচল থাকবে: {activeCourse.deadlineLabel} পর্যন্ত</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 mb-8 border-t border-b border-slate-100 py-6">
                    {activeCourse.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-3 text-slate-600">
                        <div className="bg-emerald-50 p-1 rounded-full shrink-0">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                        </div>
                        <span className="font-mixed text-sm font-semibold text-slate-700 leading-snug">
                          {feat}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() =>
                      showToast(
                        `৳${isCourseOfferActive ? activeCourse.price : activeCourse.originalPrice} পেমেন্ট করার জন্য আপনাকে গেটওয়েতে পাঠানো হচ্ছে...`,
                        "success"
                      )
                    }
                    className="w-full bg-black text-white py-4 rounded-2xl font-black font-mixed text-md hover:bg-slate-900 transition-all transform active:scale-95 shadow-xl shadow-slate-200 flex items-center justify-center gap-3 cursor-pointer"
                  >
                    <CreditCard className="w-5 h-5 text-white" /> এখনই বুকিং করুন
                  </button>
                  <p className="text-center text-slate-400 text-[10px] mt-6 font-mixed leading-normal">
                    অনলাইনে পেমেন্ট সম্পূর্ণ করার সাথে সাথে আপনার ইমেইলে কোর্সের সম্পূর্ণ এক্টিভেশন লিংক চলে যাবে।
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: PDF SUGGESTIONS PANEL */}
        {view === "pdf-suggestions" && (
          <div className="animate-tab-content">
            <div className="sticky top-18 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
              <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
                <button
                  onClick={() => setView("home")}
                  className="flex items-center gap-2 text-slate-700 hover:text-black font-extrabold font-mixed transition-colors text-sm cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" /> হোমপেজে ফিরুন
                </button>
                <div className="flex items-center gap-2">
                  <img
                    src="https://raw.githubusercontent.com/shuyaib105/square/refs/heads/main/1536-removebg-preview.png"
                    className="w-8 h-8 object-contain"
                    alt="Logo"
                  />
                  <span className="font-bold font-mixed text-sm hidden sm:inline text-black">
                    PDF Portal- সাজেশন মেগাহাব
                  </span>
                </div>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8">
              <div className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-black font-mixed text-black flex items-center gap-3">
                    <FileDown className="w-8 h-8 text-red-650 animate-bounce shrink-0" /> চ্যাপ্টার-ভিত্তিক স্পেশাল সাজেশন পিডিএফ
                  </h1>
                  <p className="text-slate-500 font-mixed text-sm mt-1 max-w-2xl">
                    আপনার প্রয়োজনীয় বিষয়, পত্র ও অধ্যায় সিলেক্ট করে মেন্টর-সায়েন্টিফিক পদ্ধতিতে সাজানো পিডিএফ ফাইল প্রিভিউ ও ডাউনলোড করুন।
                  </p>
                </div>
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl flex items-center gap-2 max-w-sm shrink-0">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                  <span className="text-xs text-amber-900 font-mixed leading-normal">
                    সরাসরি ফাইল এম্বেড ড্রাইভ থেকে দেখতে সমস্যা হলে বাটন থেকে ডাইরেক্ট লিংকে ওপেন করতে পারেন।
                  </span>
                </div>
              </div>

              {/* Premium Segmented Tab Controls for PDF Portal */}
              <div className="flex bg-slate-100 p-1.5 rounded-2xl max-w-md mb-8 border border-slate-200/50">
                <button
                  onClick={() => setPdfPortalTab("viewer")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold font-mixed transition-all cursor-pointer ${
                    pdfPortalTab === "viewer"
                      ? "bg-white text-black shadow-md border border-slate-200/40"
                      : "text-slate-600 hover:text-black"
                  }`}
                >
                  <BookOpen className="w-4 h-4 shrink-0" />
                  পিডিএফ সাজেশন প্রিভিউ
                </button>
                <button
                  onClick={() => setPdfPortalTab("storage")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold font-mixed transition-all cursor-pointer ${
                    pdfPortalTab === "storage"
                      ? "bg-black text-white shadow-md border border-black/40"
                      : "text-slate-600 hover:text-black"
                  }`}
                >
                  <Database className="w-4 h-4 shrink-0" />
                  ফায়ারবেস স্টোরেজ আপলোড (এডমিন)
                </button>
              </div>


              {/* PDF Filter Selector Panel */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 mb-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  {/* Select Subject */}
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider font-mixed mb-2 ml-1">
                      ১. বিষয় সিলেক্ট করুন
                    </label>
                    <div className="relative">
                      <select
                        id="pdf-subject"
                        value={pdfState.subject}
                        onChange={(e) => handlePdfSubjectChange(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 py-3 pl-3 pr-10 rounded-xl font-mixed font-bold focus:outline-none focus:ring-2 focus:ring-black appearance-none cursor-pointer text-sm"
                      >
                        <option value="physics">পদার্থবিজ্ঞান (Physics)</option>
                        <option value="chemistry">রসায়ন (Chemistry)</option>
                        <option value="math">উচ্চতর গণিত (Higher Math)</option>
                      </select>
                      <ChevronRight className="w-4 h-4 text-slate-500 absolute right-3 top-3.5 rotate-90 pointer-events-none" />
                    </div>
                  </div>

                  {/* Select Paper */}
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider font-mixed mb-2 ml-1">
                      ২. পত্র
                    </label>
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                      <button
                        onClick={() => handlePdfPaperChange("1st")}
                        className={`flex-1 py-2 rounded-lg text-xs font-black font-mixed transition-all cursor-pointer ${
                          pdfState.paper === "1st" ? "bg-white text-black shadow-sm" : "text-slate-500 hover:text-black"
                        }`}
                      >
                        ১ম পত্র
                      </button>
                      <button
                        onClick={() => handlePdfPaperChange("2nd")}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-black font-mixed transition-all cursor-pointer ${
                          pdfState.paper === "2nd" ? "bg-white text-black shadow-sm" : "text-slate-500 hover:text-black"
                        }`}
                      >
                        ২য় পত্র
                      </button>
                    </div>
                  </div>

                  {/* Select Chapter */}
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider font-mixed mb-2 ml-1">
                      ৩. অধ্যায়
                    </label>
                    <div className="relative">
                      <select
                        id="pdf-chapter"
                        value={pdfState.chapter}
                        onChange={(e) => setPdfState((prev) => ({ ...prev, chapter: e.target.value, iframeLoading: true }))}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 py-3 pl-3 pr-10 rounded-xl font-mixed font-bold focus:outline-none focus:ring-2 focus:ring-black appearance-none cursor-pointer text-sm"
                      >
                        {activeSuggestionChapters.map((ch) => (
                          <option key={ch.id} value={ch.id}>
                            {ch.name}
                          </option>
                        ))}
                      </select>
                      <ChevronRight className="w-4 h-4 text-slate-500 absolute right-3 top-3.5 rotate-90 pointer-events-none" />
                    </div>
                  </div>

                  {/* Select PDF category */}
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider font-mixed mb-2 ml-1">
                      ৪. পিডিএফ ক্যাটাগরি
                    </label>
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                      <button
                        onClick={() => setPdfState((prev) => ({ ...prev, standard: "board" }))}
                        className={`flex-1 py-2 rounded-lg text-xs font-black font-mixed transition-all cursor-pointer ${
                          pdfState.standard === "board" ? "bg-black text-white shadow-sm" : "text-slate-500 hover:text-black"
                        }`}
                      >
                        বোর্ড স্ট্যান্ডার্ড
                      </button>
                      <button
                        onClick={() => setPdfState((prev) => ({ ...prev, standard: "admission" }))}
                        className={`flex-1 py-2 rounded-lg text-xs font-black font-mixed transition-all cursor-pointer ${
                          pdfState.standard === "admission" ? "bg-red-650 text-white shadow-sm" : "text-slate-500 hover:text-red-650"
                        }`}
                      >
                        এডমিশন স্ট্যান্ডার্ড
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              {/* Side Metadata and PDF Embed screen */}
              {pdfPortalTab === "viewer" && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                
                {/* Chapter metadata details */}
                <div className="lg:col-span-1 space-y-4 animate-tab-content">
                  <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                      <BookMarked className="w-5 h-5 text-black" />
                      <h3 className="font-extrabold font-mixed text-slate-850">অধ্যায়ের সংক্ষিপ্ত তথ্য</h3>
                    </div>
                    {activeSuggestionObj ? (
                      <div className="space-y-4">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">বিষয় ও পত্র</span>
                          <p className="font-bold font-mixed text-xs bg-slate-50 py-2 px-3 rounded-xl border border-slate-100 text-slate-700 leading-relaxed">
                            {SUGGESTION_DATA[pdfState.subject]?.name} - {pdfState.paper === "1st" ? "১ম পত্র" : "২য় পত্র"}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">অধ্যায়</span>
                          <p className="font-extrabold font-mixed text-md text-black">{activeSuggestionObj.name}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div className="bg-blue-50/55 border border-blue-105 p-3 rounded-2xl text-center">
                            <span className="text-[9px] text-blue-500 font-bold block">CQ প্রশ্ন সংখ্যা</span>
                            <span className="font-extrabold font-mixed text-black text-sm">{activeSuggestionObj.cqCount}</span>
                          </div>
                          <div className="bg-purple-50/55 border border-purple-105 p-3 rounded-2xl text-center">
                            <span className="text-[9px] text-purple-500 font-bold block">MCQ সাজেশন্স</span>
                            <span className="font-extrabold font-mixed text-black text-sm">{activeSuggestionObj.mcqCount}</span>
                          </div>
                        </div>
                        <div className="pt-2">
                          <span className="text-[10px] text-slate-400 uppercase font-extrabold block mb-2">স্পেশাল গুরুত্বপূর্ণ টপিকস্</span>
                          <ul className="space-y-2">
                            {activeSuggestionObj.impTopics?.map((topic, tIdx) => (
                              <li key={tIdx} className="text-xs text-slate-600 font-semibold font-mixed flex items-start gap-1.5">
                                <span className="text-red-500 font-black mt-0.5">•</span>
                                <span className="leading-snug">{topic}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-400 font-mixed text-sm">কোন তথ্য পাওয়া যায়নি</p>
                    )}
                  </div>

                  {/* Guideline Banner */}
                  <div className="bg-slate-950 text-white rounded-3xl p-5 shadow-md relative overflow-hidden">
                    <h4 className="font-extrabold font-mixed text-sm mb-2 text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-yellow-400 fill-yellow-400" /> এক্সক্লুসিভ নির্দেশিকা
                    </h4>
                    <p className="text-xs text-slate-450 font-mixed leading-relaxed mb-4">
                      আমাদের সকল সাজেশন শিট অভিজ্ঞ মেন্টর টিম দ্বারা HSC ২০২৬ এবং বিগত বছরের প্রশ্ন এনালাইসিস করে তৈরি করা হয়েছে।
                    </p>
                    <a
                      href="https://t.me/shu_yaib"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-white text-black font-mixed text-xs font-bold py-2.5 px-4 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      মেন্টর মতামত জানান
                    </a>
                  </div>
                </div>

                {/* PDF Viewer Embed Panel */}
                {activeSuggestionObj ? (
                  <div className="lg:col-span-3 space-y-4 animate-tab-content">
                    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200/80 overflow-hidden">
                      
                      {/* Embed toolbar */}
                      <div className="bg-slate-900 text-white px-5 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                          <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                          <span className="text-xs text-slate-400 font-mixed ml-2 truncate max-w-[180px] sm:max-w-md font-semibold">
                            {`${activeSuggestionObj.name}_${pdfState.standard === "board" ? "Board" : "Admission"}_Suggestions.pdf`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={pdfState.standard === "board" ? activeSuggestionObj.boardUrl : activeSuggestionObj.admissionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-3.5 py-2 rounded-xl text-xs font-bold font-mixed transition-all cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> ড্রাইভ-এ দেখুন
                          </a>
                          <a
                            href={(pdfState.standard === "board" ? activeSuggestionObj.boardUrl : activeSuggestionObj.admissionUrl).replace("/preview", "/view")}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 bg-white text-black hover:bg-slate-100 px-3.5 py-2 rounded-xl text-xs font-bold font-mixed transition-all shadow-sm cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" /> ডাউনলোড
                          </a>
                        </div>
                      </div>

                      {/* Frame view */}
                      <div className="relative bg-slate-850 min-h-[450px] md:min-h-[580px] flex flex-col justify-between">
                        
                        {/* Custom visual loader overlays */}
                        {pdfState.iframeLoading && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800 z-10 p-4 text-center">
                            <div className="pdf-loader mb-4"></div>
                            <p className="text-white font-mixed text-sm font-extrabold animate-pulse">
                              গুগল ড্রাইভ থেকে সাজেশন ফাইল লোড হচ্ছে...
                            </p>
                            <p className="text-slate-400 font-mixed text-xs mt-1">
                              দয়া করে কয়েক মূহুর্ত অপেক্ষা করুন
                            </p>
                          </div>
                        )}

                        <iframe
                          src={pdfState.standard === "board" ? activeSuggestionObj.boardUrl : activeSuggestionObj.admissionUrl}
                          className="w-full h-[450px] md:h-[580px] border-none bg-slate-900"
                          allow="autoplay"
                          onLoad={() => setPdfState((prev) => ({ ...prev, iframeLoading: false }))}
                        ></iframe>

                        <div className="bg-slate-950/80 backdrop-blur-xs border-t border-slate-800 p-3.5 flex items-center justify-center gap-2 text-center text-xs text-slate-400 font-mixed">
                          <Lock className="w-3.5 h-3.5 text-green-500 fill-green-500/10" /> সুরক্ষিত এম্বেডেড প্রিভিউ পোর্টাল। কোনো প্রকার রিডাইরেক্ট বা পপআপ নেই।
                        </div>
                      </div>

                    </div>

                    <div className="bg-slate-100 border border-slate-200/80 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <h5 className="font-extrabold font-mixed text-black text-sm">পিডিএফ এম্বেড স্ক্রিন দেখতে কি অসুবিধা হচ্ছে?</h5>
                        <p className="text-slate-500 font-mixed text-xs">আপনার ব্রাউজার সিকিউরিটি যদি গুগল এম্বেড ব্লক করে থাকে তবে পাশের বাটন দ্বারা ডিরেক্ট গুগল ড্রাইভ লিংকে ওপেন করতে পারেন।</p>
                      </div>
                      <a
                        href={pdfState.standard === "board" ? activeSuggestionObj.boardUrl : activeSuggestionObj.admissionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-black hover:bg-slate-800 text-white py-3 px-5 rounded-xl text-xs font-bold font-mixed transition-all shadow-md shrink-0 flex items-center gap-1 cursor-pointer"
                      >
                        ডাইরেক্ট ড্রাইভ ভিউ <ChevronRight className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="lg:col-span-3 text-center text-slate-400 py-12 font-mixed text-sm">
                    কোন পিডিএফ সাজেশন পাওয়া যায়নি।
                  </div>
                )}

              </div>
              )}

              {/* Firebase Cloud Storage Upload Tab view for admin usage */}
              {pdfPortalTab === "storage" && (
                <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-200/80 animate-tab-content space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-xl font-extrabold font-mixed text-black flex items-center gap-2">
                      <Upload className="w-5 h-5 text-red-650" />
                      ফায়ারবেস ক্লাউড স্টোরেজে পিডিএফ আপলোড পোর্টাল
                    </h2>
                    <p className="text-slate-500 font-mixed text-xs mt-1">
                      সিলেক্টেড বিষয়: <span className="font-bold text-black uppercase">{pdfState.subject} ({pdfState.paper === "1st" ? "১ম" : "২য়"} পত্র)</span>, চ্যাপ্টার আইডি: <span className="font-bold text-black uppercase">{pdfState.chapter}</span>, টাইপ: <span className="font-bold text-black uppercase">{pdfState.standard === "board" ? "এইচএসসি বোর্ড স্ট্যান্ডার্ড" : "বিশ্ববিদ্যালয় ভর্তি স্ট্যান্ডার্ড"}</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* Left Column: Upload controller */}
                    <div className="space-y-4">
                      <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-6 text-center">
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => setFirebaseFile(e.target.files?.[0] || null)}
                          className="hidden"
                          id="pdf-uploader-input"
                        />
                        <label
                          htmlFor="pdf-uploader-input"
                          className="cursor-pointer flex flex-col items-center justify-center space-y-3"
                        >
                          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-650">
                            <FileText className="w-6 h-6" />
                          </div>
                          <div>
                            <span className="text-xs font-bold font-mixed text-black block">
                              {firebaseFile ? firebaseFile.name : "পিডিএফ ফাইল সিলেক্ট করতে ক্লিক করুন"}
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-1">
                              {firebaseFile ? `${(firebaseFile.size / 1024 / 1024).toFixed(2)} MB` : "সমর্থিত ফরম্যাট: .pdf সর্বোচ্চ ১০ এমবি"}
                            </span>
                          </div>
                        </label>
                      </div>

                      <div className="flex gap-4">
                        <button
                          onClick={handleUploadToFirebase}
                          disabled={isUploading}
                          className="flex-1 bg-black text-white py-3.5 rounded-xl text-xs font-black font-mixed hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                        >
                          {isUploading ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              আপলোড হচ্ছে...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              ফায়ারবেসে আপলোড ও লিংক সেভ করুন
                            </>
                          )}
                        </button>
                        
                        {firebaseFile && (
                          <button
                            onClick={() => setFirebaseFile(null)}
                            disabled={isUploading}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-3.5 rounded-xl transition-all cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Right Column: Files listing */}
                    <div className="space-y-4">
                      <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider font-mixed flex items-center gap-2">
                        <List className="w-4 h-4 text-slate-400" />
                        এই ফোল্ডারে বিদ্যমান আপলোডেড ফাইলস ({uploadedFilesList.length})
                      </h4>
                      
                      {uploadedFilesList.length === 0 ? (
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl py-8 px-4 text-center text-slate-400 font-mixed text-xs">
                          এই ক্যাটাগরিতে এখনো কোনো ফাইল সরাসরি ক্লাউড স্টোরেজে আপলোড করা নেই।
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-2">
                          {uploadedFilesList.map((file, idx) => (
                            <div key={idx} className="bg-slate-50 border border-slate-150 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText className="w-4 h-4 text-red-650 shrink-0" />
                                <span className="font-bold text-slate-700 truncate font-mixed block">
                                  {file.name}
                                </span>
                              </div>
                              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-extrabold whitespace-nowrap">
                                Active Cloud File
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 5: CALENDAR ROUTINE & TIMELINE */}
        {view === "calendar-timeline" && (
          <div className="animate-tab-content">
            <div className="sticky top-18 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
              <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
                <button
                  onClick={() => setView("home")}
                  className="flex items-center gap-2 text-slate-700 hover:text-black font-extrabold font-mixed transition-colors text-sm cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" /> হোমপেজে ফিরুন
                </button>
                <div className="flex items-center gap-2">
                  <img
                    src="https://raw.githubusercontent.com/shuyaib105/square/refs/heads/main/1536-removebg-preview.png"
                    className="w-8 h-8 object-contain"
                    alt="Logo"
                  />
                  <span className="font-bold font-mixed text-sm hidden sm:inline text-black">
                    HSC 26 Exam Routing Dashboard
                  </span>
                </div>
              </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 pt-8">
              <div className="text-center mb-8">
                <span className="bg-red-50 border border-red-100 text-red-650 font-bold px-4 py-2 rounded-full text-xs uppercase tracking-wider font-mixed inline-flex items-center gap-2 mb-4">
                  <Calendar className="w-3.5 h-3.5 text-red-600 animate-pulse" /> HSC ২০২৬ বোর্ড পরীক্ষার সমীকরণ রুটিন
                </span>
                <h1 className="text-2xl md:text-3.5xl font-black font-mixed text-black tracking-tight">
                  এইচএসসি ২০২৬ রুটিন ও নির্বাচনী দিনপঞ্জি
                </h1>
                <p className="text-slate-500 font-mixed text-sm mt-3 max-w-xl mx-auto leading-relaxed">
                  পরীক্ষার চূড়ান্ত তারিখ ও সূচী মিলিয়ে নিন। নিচের কাইন্ড সার্চবক্স দ্বারা নিজের নির্দিষ্ট বিষয়ের নির্ধারিত তথ্য জেনে নিন দ্রুত উপায়ে।
                </p>
              </div>

              {/* Dynamic Live Countdown timer display */}
              <div className="bg-slate-950 text-white rounded-[2rem] p-6 md:p-8 shadow-2xl mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 opacity-5 pointer-events-none">
                  <RefreshCw className="w-64 h-64 text-white animate-spin" style={{ animationDuration: "60s" }} />
                </div>
                
                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-5 gap-6 items-center">
                  <div className="lg:col-span-2 space-y-2 text-center lg:text-left">
                    <span className="inline-flex items-center gap-1.5 text-[10px] bg-red-600/20 text-red-400 border border-red-500/30 px-3 py-1 rounded-full font-bold font-mixed uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span> লাইভ কাউন্টডাউন
                    </span>
                    <h2 className="text-lg md:text-xl font-bold font-mixed leading-tight text-white mt-1">
                      বোর্ড পরীক্ষা শুরু হতে বাকি:
                    </h2>
                    <p className="text-[11px] text-slate-400 font-mixed font-semibold bg-slate-900 px-3 py-1.5 rounded-lg inline-block border border-slate-850">
                      প্রথম পরীক্ষা: বাংলা ১ম পত্র (২১ জুন, ২০২৬ ইং)
                    </p>
                  </div>

                  {/* Timer display blocks */}
                  <div className="lg:col-span-3 flex justify-center lg:justify-end">
                    {timeRemaining.completed ? (
                      <div className="bg-red-950/40 border border-red-500/30 p-5 rounded-2xl text-center w-full">
                        <span className="text-md font-bold font-mixed text-red-400">এইচএসসি ২০২৬ পরীক্ষা শুরু হয়ে গেছে!</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-2.5 sm:gap-4 w-full max-w-sm">
                        <div className="bg-gradient-to-b from-zinc-850 to-zinc-900 border border-slate-800/65 py-3 rounded-xl flex flex-col items-center justify-center shadow-lg">
                          <span className="text-lg sm:text-2xl font-black text-white tracking-widest font-mixed">
                            {toBanglaNumber(timeRemaining.days.toString().padStart(2, "0"))}
                          </span>
                          <span className="text-[10px] sm:text-xs text-slate-400 font-mixed mt-1">দিন</span>
                        </div>
                        <div className="bg-gradient-to-b from-zinc-850 to-zinc-900 border border-slate-800/65 py-3 rounded-xl flex flex-col items-center justify-center shadow-lg">
                          <span className="text-lg sm:text-2xl font-black text-white tracking-widest font-mixed">
                            {toBanglaNumber(timeRemaining.hours.toString().padStart(2, "0"))}
                          </span>
                          <span className="text-[10px] sm:text-xs text-slate-400 font-mixed mt-1">ঘণ্টা</span>
                        </div>
                        <div className="bg-gradient-to-b from-zinc-850 to-zinc-900 border border-slate-800/65 py-3 rounded-xl flex flex-col items-center justify-center shadow-lg">
                          <span className="text-lg sm:text-2xl font-black text-white tracking-widest font-mixed">
                            {toBanglaNumber(timeRemaining.minutes.toString().padStart(2, "0"))}
                          </span>
                          <span className="text-[10px] sm:text-xs text-slate-400 font-mixed mt-1">মিনিট</span>
                        </div>
                        <div className="bg-gradient-to-b from-red-950 to-red-900 border border-red-800/20 py-3 rounded-xl flex flex-col items-center justify-center shadow-lg">
                          <span className="text-lg sm:text-2xl font-black text-red-400 tracking-widest font-mixed">
                            {toBanglaNumber(timeRemaining.seconds.toString().padStart(2, "0"))}
                          </span>
                          <span className="text-[10px] sm:text-xs text-red-300 font-mixed mt-1">সেকেন্ড</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Printable Table Section */}
              <div id="print-area" className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200 mb-8 animate-tab-content">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-lg font-bold font-mixed text-black flex items-center gap-2">
                      <SlidersHorizontal className="w-5 h-5 text-indigo-600" /> এইচএসসি ২০২৬ চূড়ান্ত রুটিন
                    </h3>
                    <p className="text-xs text-slate-400 font-mixed mt-0.5">সবগুলো পরীক্ষা একই সূচীতে দেখে নিন সহজে</p>
                  </div>

                  {/* Interactive Search input box */}
                  <div className="relative w-full sm:w-64">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Search className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      placeholder="বিষয়ের নাম বা পত্র দিয়ে খুঁজুন..."
                      value={routineSearch}
                      onChange={(e) => setRoutineSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:bg-white text-xs font-mixed transition-all text-slate-800"
                    />
                  </div>
                </div>

                {/* Printable Routine Rows */}
                <div className="overflow-x-auto rounded-2xl border border-slate-150">
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="p-4 font-mixed font-bold text-slate-600 text-sm">বিষয়ের নাম ও পত্র</th>
                        <th className="p-4 font-mixed font-bold text-slate-600 text-sm">পরীক্ষার তারিখ</th>
                        <th className="p-4 font-mixed font-bold text-slate-600 text-sm text-right">অবশিষ্ট দিন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRoutine.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="p-12 text-center text-slate-400 font-mixed text-sm">
                            আপনি যা খুঁজছেন তার সাথে মিল পাওয়া যায়নি! দয়া করে সঠিক বিষয়ের নাম লিখুন।
                          </td>
                        </tr>
                      ) : (
                        filteredRoutine.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 font-mixed font-bold text-slate-900 text-sm">
                              <span className="mr-2.5">{item.subject}</span>
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-150">
                                {item.paper}
                              </span>
                            </td>
                            <td className="p-4 font-mixed font-bold text-slate-700 text-sm">
                              {item.date}
                            </td>
                            <td className="p-4 text-xs font-bold text-right">
                              {getDaysDiffFromToday(item.targetDate)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 p-4 bg-slate-50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-150">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-mixed font-semibold">সর্বমোট নির্ধারিত পরীক্ষা সংখ্যা:</span>
                    <span className="text-xs font-extrabold text-black font-mixed bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                      {toBanglaNumber(filteredRoutine.length)} টি
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold font-mixed text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500" /> রুটিন প্রিন্ট করুন
                    </button>
                  </div>
                </div>
              </div>

              {/* Informative Grid Notice Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                <div className="bg-red-50/50 border border-red-100 p-5 rounded-3xl flex items-start gap-3 shadow-xs">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold font-mixed text-sm text-red-900">জরুরী নোটিশ ও গুরুত্বপূর্ণ রূপরেখা</h4>
                    <p className="text-xs text-red-800/80 font-mixed leading-relaxed mt-1.5">
                      পরীক্ষার হলে কমপক্ষে ৩০ মিনিট পূর্বে অবশ্যই নিজের আসনে প্রবেশ করতে হবে। এডমিট কার্ড, রেজিঃ কার্ড, জ্যামিতি বক্স ও অনুমোদিত ক্যালকুলেটর আগের রাতেই সাজিয়ে রাখুন।
                    </p>
                  </div>
                </div>
                <div className="bg-indigo-50/50 border border-indigo-100 p-5 rounded-3xl flex items-start gap-3 shadow-xs">
                  <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold font-mixed text-sm text-indigo-900">স্মার্ট রিভিশন মেন্টর টিপস্</h4>
                    <p className="text-xs text-indigo-800/80 font-mixed leading-relaxed mt-1.5">
                      পরীক্ষার মধ্যবর্তী বিরতির সময়ে কোনোক্রমেই নতুন অনভ্যস্ত চ্যাপ্টার রিভিশন দিতে যাবেন না। আগে তৈরি করা ক্লাস লেকচার শিট ও ওয়ান-শট ম্যাথ নোটগুলি একনজরে দেখে যাওয়া শ্রেয়।
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* VIEW 6: POLL PRACTICE PANEL */}
        {view === "poll-practice" && (
          <div className="animate-tab-content">
            <div className="sticky top-18 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
              <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
                <button
                  onClick={() => {
                    setPollState((prev) => ({ ...prev, isStarted: false }));
                    setView("home");
                  }}
                  className="flex items-center gap-2 text-slate-700 hover:text-black font-extrabold font-mixed transition-colors text-sm cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" /> হোমপেজে ফিরুন
                </button>
                <div className="flex items-center gap-2">
                  <img
                    src="https://raw.githubusercontent.com/shuyaib105/square/refs/heads/main/1536-removebg-preview.png"
                    className="w-8 h-8 object-contain"
                    alt="Logo"
                  />
                  <span className="font-bold font-mixed text-sm hidden sm:inline text-black">
                    Interactive Assessment Center
                  </span>
                </div>
              </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 pt-10 pb-16">
              
              {/* STATE A: POLL SETUP SELECTION FORM */}
              {!pollState.isStarted && (
                <div className="space-y-8 animate-tab-content">
                  <div className="text-center">
                    <span className="bg-blue-50 border border-blue-150 text-blue-600 font-bold px-4 py-1.5 rounded-full text-xs uppercase tracking-wider font-mixed inline-flex items-center gap-2 mb-4 shadow-xs">
                      <BarChart3 className="w-3.5 h-3.5 text-blue-600" /> ইনস্ট্যান্ট সেলফ অ্যাসেসমেন্ট
                    </span>
                    <h1 className="text-2xl md:text-3.5xl font-black font-mixed text-black tracking-tight">
                      স্মার্ট পোল ও এমসিকিউ প্র্যাকটিস
                    </h1>
                    <p className="text-slate-500 font-mixed text-sm mt-3 max-w-xl mx-auto leading-relaxed">
                      যেকোনো বিষয়ের চ্যাপ্টার নির্বাচন করুন, প্রশ্নের ধরন সেট করে রিয়েল-টাইম পোল দিন এবং সমাধানসহ বিস্তারিত সব্যাখ্যা গাণিতিক সমাধান পেয়ে যান নিমিষে।
                    </p>
                  </div>

                  {/* Config settings panel */}
                  <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-200/80 grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* Left settings */}
                    <div className="space-y-5">
                      
                      {/* One: Subject Buttons */}
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest font-mixed mb-2 ml-1">
                          ১. বিষয় নির্বাচন করুন
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => handlePollSubjectChange("physics")}
                            className={`py-3 px-2 rounded-xl text-xs font-black font-mixed transition-all border cursor-pointer ${
                              pollState.subject === "physics"
                                ? "bg-black text-white border-black shadow-md"
                                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            পদার্থবিজ্ঞান
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePollSubjectChange("chemistry")}
                            className={`py-3 px-2 rounded-xl text-xs font-black font-mixed transition-all border cursor-pointer ${
                              pollState.subject === "chemistry"
                                ? "bg-black text-white border-black shadow-md"
                                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            রসায়ন
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePollSubjectChange("math")}
                            className={`py-3 px-2 rounded-xl text-xs font-black font-mixed transition-all border cursor-pointer ${
                              pollState.subject === "math"
                                ? "bg-black text-white border-black shadow-md"
                                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            উচ্চতর গণিত
                          </button>
                        </div>
                      </div>

                      {/* Two: Paper Selector Buttons */}
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest font-mixed mb-2 ml-1">
                          ২. পত্র
                        </label>
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                          <button
                            onClick={() => handlePollPaperChange("1st")}
                            className={`flex-1 py-2.5 rounded-lg text-xs font-black font-mixed transition-all cursor-pointer ${
                              pollState.paper === "1st" ? "bg-white text-black shadow-sm" : "text-slate-500 hover:text-black"
                            }`}
                          >
                            ১ম পত্র
                          </button>
                          <button
                            onClick={() => handlePollPaperChange("2nd")}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-black font-mixed transition-all cursor-pointer ${
                              pollState.paper === "2nd" ? "bg-white text-black shadow-sm" : "text-slate-500 hover:text-black"
                        }`}
                          >
                            ২য় পত্র
                          </button>
                        </div>
                      </div>

                      {/* Three: Chapter Dropdown selection list */}
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest font-mixed mb-2 ml-1 font-semibold">
                          ৩. অধ্যায় সিলেক্ট করুন
                        </label>
                        <div className="relative">
                          <select
                            value={pollState.chapter}
                            onChange={(e) => handlePollChapterChange(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 py-3.5 pl-3 pr-10 rounded-xl font-mixed font-bold focus:outline-none focus:ring-2 focus:ring-black appearance-none cursor-pointer text-sm"
                          >
                            {Object.keys(mcqDatabase[pollState.subject]?.[pollState.paper] || {}).map((key) => (
                              <option key={key} value={key}>
                                {mcqDatabase[pollState.subject][pollState.paper][key].name}
                              </option>
                            ))}
                          </select>
                          <ChevronRight className="w-4 h-4 text-slate-500 absolute right-3 top-4 rotate-90 pointer-events-none" />
                        </div>
                      </div>

                    </div>

                    {/* Right settings selection panel */}
                    <div className="space-y-6">
                      
                      {/* Four: Exam Standards Category selector buttons */}
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest font-mixed mb-2 ml-1">
                          ৪. পরীক্ষার লেভেল ও ক্যাটাগরি
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handlePollStandardChange("board")}
                            className={`py-3.5 rounded-xl text-xs font-black font-mixed transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                              pollState.standard === "board"
                                ? "bg-blue-600 text-white border-blue-600 shadow-md"
                                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            <Award className="w-4 h-4 text-white" /> বোর্ড স্ট্যান্ডার্ড
                          </button>
                          <button
                            onClick={() => handlePollStandardChange("admission")}
                            className={`py-3.5 rounded-xl text-xs font-black font-mixed transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                              pollState.standard === "admission"
                                ? "bg-red-650 text-white border-red-650 shadow-md"
                                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            <Zap className="w-4 h-4 text-white" /> এডমিশন লেভেল
                          </button>
                        </div>
                      </div>

                      {/* Five: Customizable Poll quantity sliders */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest font-mixed ml-1 font-semibold">
                            ৫. প্রশ্ন সংখ্যা সিলেক্ট করুন
                          </label>
                          <span className="text-[11px] font-black text-black font-mixed bg-slate-150 px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs">
                            {toBanglaNumber(pollState.count)} টি পোল
                          </span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max={Math.max(
                            getActiveChapterMcqs(
                              pollState.subject,
                              pollState.paper,
                              pollState.chapter,
                              pollState.standard
                            ).length || 2,
                            2
                          )}
                          value={pollState.count}
                          onChange={(e) => setPollState((prev) => ({ ...prev, count: parseInt(e.target.value, 10) }))}
                          className="w-full accent-black cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
                        />
                        <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1.5">
                          <span>১ টি</span>
                          <span>
                            সর্বোচ্চ:{" "}
                            {toBanglaNumber(
                              Math.max(
                                getActiveChapterMcqs(
                                  pollState.subject,
                                  pollState.paper,
                                  pollState.chapter,
                                  pollState.standard
                                ).length || 2,
                                2
                              )
                            )}
                            টি
                          </span>
                        </div>
                      </div>

                      {/* Status indicator warning alert */}
                      <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0"></div>
                        <div className="text-xs text-emerald-900 font-semibold font-mixed leading-relaxed">
                          ডাটাবেজের সর্বশেষ তথ্যসূত্রে এই সিলেক্টেড অধ্যায়ের অধীনে গুরুত্বপূর্ণ এমসিকিউ সংরক্ষিত আছে।
                        </div>
                      </div>

                    </div>
                  </div>

                  <button
                    onClick={startPollSession}
                    className="w-full bg-black hover:bg-slate-800 text-white py-4 rounded-3xl font-black font-mixed text-lg tracking-wide transition-all transform active:scale-98 shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <PlayCircle className="w-5 h-5 text-white" /> লাইভ পোল প্র্যাকটিস স্টার্ট করুন
                  </button>
                </div>
              )}

              {/* STATE B: ACTIVE POLL SESSION PORTAL */}
              {pollState.isStarted && (
                <div className="space-y-6 animate-tab-content">
                  
                  {/* Banner summary */}
                  <div className="bg-slate-900 text-white rounded-[2rem] p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-850">
                    <div>
                      <span className="text-[10px] uppercase font-black text-slate-400 font-mixed tracking-widest block mb-1">
                        সক্রিয় লাইভ সেশন
                      </span>
                      <h2 className="text-xl font-bold font-mixed text-white">
                        {mcqDatabase[pollState.subject]?.name} -{" "}
                        {mcqDatabase[pollState.subject]?.[pollState.paper]?.[pollState.chapter]?.name || "শিক্ষা বিজ্ঞান ও প্রযুক্তি"}
                      </h2>
                      <p className="text-xs text-slate-400 font-mixed mt-1 font-semibold">
                        ক্যাটাগরি: {pollState.standard === "board" ? "বোর্ড স্ট্যান্ডার্ড" : "এডমিশন স্ট্যান্ডার্ড"} | মোট পোল: {toBanglaNumber(pollState.questions.length)}টি
                      </p>
                    </div>

                    {/* Progress details */}
                    <div className="flex items-center gap-3">
                      <div className="bg-white/10 px-4 py-2.5 rounded-2xl text-center">
                        <span className="text-[9px] text-slate-450 uppercase font-black block">অ্যাসাইনমেন্ট</span>
                        <span className="font-extrabold text-lg text-white font-mixed">
                          {toBanglaNumber(Object.keys(pollState.answers).length)}/{toBanglaNumber(pollState.questions.length)}
                        </span>
                      </div>
                      <div className="bg-emerald-500/15 border border-emerald-500/20 px-4 py-2.5 rounded-2xl text-center">
                        <span className="text-[9px] text-emerald-450 uppercase font-black block">সহীহ উত্তর</span>
                        <span className="font-extrabold text-lg text-emerald-400 font-mixed">
                          {toBanglaNumber(
                            pollState.questions.filter((q, qIndex) => pollState.answers[qIndex] === q.correctIdx).length
                          )}
                          টি
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Active Questions rendering */}
                  <div className="space-y-6">
                    {pollState.questions.map((q, qIdx) => {
                      const userChoice = pollState.answers[qIdx];
                      const isAnswered = userChoice !== undefined;

                      return (
                        <div
                          key={qIdx}
                          className="bg-white rounded-[2rem] p-6 md:p-8 shadow-xs border border-slate-200/80 transition-all"
                        >
                          {/* Heading */}
                          <div className="flex items-start gap-3 mb-6">
                            <span className="bg-slate-100 border border-slate-200 text-slate-800 w-8 h-8 rounded-xl text-xs font-black font-mixed flex items-center justify-center shrink-0 mt-0.5">
                              {toBanglaNumber(qIdx + 1)}
                            </span>
                            <h3 className="font-extrabold font-mixed text-slate-900 text-md md:text-lg leading-relaxed">
                              {q.question}
                            </h3>
                          </div>

                          {/* Options grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-5">
                            {q.options.map((opt, optIdx) => {
                              let btnClass = "bg-slate-50 border-slate-200/60 text-slate-800 hover:bg-slate-100 cursor-pointer";
                              let iconMarkup = (
                                <span className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center text-[10px] font-black shrink-0 text-slate-500 font-mixed">
                                  {toBanglaNumber(optIdx + 1)}
                                </span>
                              );

                              // Color logic after clicking a choice
                              if (isAnswered) {
                                if (optIdx === q.correctIdx) {
                                  btnClass = "bg-emerald-50 border-emerald-500 text-emerald-900 font-black pointer-events-none";
                                  iconMarkup = (
                                    <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                                      <Check className="w-3.5 h-3.5" />
                                    </div>
                                  );
                                } else if (optIdx === userChoice) {
                                  btnClass = "bg-red-50 border-red-500 text-red-900 font-black pointer-events-none";
                                  iconMarkup = (
                                    <div className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0">
                                      <X className="w-3.5 h-3.5" />
                                    </div>
                                  );
                                } else {
                                  btnClass = "bg-slate-50/50 border-slate-100 text-slate-400 pointer-events-none";
                                  iconMarkup = (
                                    <span className="w-5 h-5 rounded-full border border-slate-200 text-slate-300 flex items-center justify-center text-[10px] shrink-0 font-mixed">
                                      {toBanglaNumber(optIdx + 1)}
                                    </span>
                                  );
                                }
                              }

                              return (
                                <button
                                  key={optIdx}
                                  onClick={() => handleAnswerSubmit(qIdx, optIdx)}
                                  disabled={isAnswered}
                                  className={`w-full p-4 border rounded-2xl text-left text-sm font-bold font-mixed flex items-center gap-3 transition-all ${btnClass}`}
                                >
                                  {iconMarkup}
                                  <span className="flex-1 leading-normal">{opt}</span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Expansion Solution and Explanations with MathJax rendering */}
                          {isAnswered && (
                            <div className="bg-indigo-50/55 border border-indigo-110 rounded-2xl p-4.5 animate-tab-content">
                              <div className="flex items-center gap-2 text-indigo-900 font-black text-xs uppercase tracking-wider font-mixed mb-2.5">
                                <HelpCircle className="w-4 h-4 text-indigo-650 animate-pulse shrink-0" />
                                <span>বিশ্লেষণাত্মক ব্যাখ্যা ও সমাধান:</span>
                              </div>
                              <p className="text-xs md:text-sm text-indigo-950 font-mixed font-semibold leading-relaxed whitespace-pre-line pl-6">
                                {q.explanation}
                              </p>
                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>

                  {/* MCQ Footer operations */}
                  <div className="bg-slate-100 border border-slate-200/80 rounded-[2rem] p-6 flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
                    <div className="text-center sm:text-left">
                      <h4 className="font-extrabold font-mixed text-black text-sm">পোল প্র্যাকটিস সেশন শেষ করতে চান?</h4>
                      <p className="text-slate-500 font-mixed text-xs mt-0.5 font-semibold">আপনি চাইলে পুনরায় নতুন প্রশ্ন Shuffled উপায়ে নিয়ে খেলতে পারেন।</p>
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto">
                      <button
                        onClick={() => setPollState((prev) => ({ ...prev, isStarted: false }))}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold font-mixed text-xs px-5 py-3.5 rounded-xl transition-all cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> বিষয়ের ছক পরিবর্তন
                      </button>
                      <button
                        onClick={startPollSession}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-black hover:bg-slate-800 text-white font-bold font-mixed text-xs px-5 py-3.5 rounded-xl transition-all shadow-md cursor-pointer animate-pulse"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> পুনরাবৃত্তি খেলুন (Shuffle)
                      </button>
                    </div>
                  </div>

                </div>
              )}

            </div>
          </div>
        )}
        {/* VIEW 6.5: FREE BOARD & MODEL TEST EXAMS */}
        {view === "free-exams" && (
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 animate-tab-content font-mixed">
            {/* Header section with back navigation */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setView("home");
                    setFreeExamStarted(false);
                    setActiveFreeExamId(null);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-black mb-2 transition-colors cursor-pointer"
                >
                  ← হোমপেইজে ফিরে যান
                </button>
                <h1 className="text-2xl md:text-3.5xl font-extrabold text-black">
                  বোর্ড ও ফ্রী উইকলি এক্সাম রুম
                </h1>
                <p className="text-slate-500 text-xs md:text-sm font-semibold">
                  এইচএসসি ও ইঞ্জিনিয়ারিং ভর্তি প্রস্তুতির অংশ হিসেবে ফ্রী পরীক্ষার মাধ্যমে নিজের দক্ষতাকে যাচাই করুন।
                </p>
              </div>
              
              {!freeExamStarted && (
                <button 
                  type="button"
                  onClick={() => setView("home")}
                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-black text-xs font-black rounded-2xl transition-all cursor-pointer shadow-sm flex items-center gap-2"
                >
                  <Layout className="w-4 h-4" />
                  অন্যান্য ফিচারে ফিরুন
                </button>
              )}
            </div>

            {/* CASE 1: EXAM RUNNING */}
            {freeExamStarted && !freeExamScore?.submitted ? (
              <div className="space-y-8 animate-tab-content">
                {/* Immersive high contrast timer HUD header */}
                <div className="sticky top-18 z-40 bg-white border border-slate-200 rounded-[2rem] p-6 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-red-50 text-red-650 rounded-2xl">
                      <Clock className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-black text-sm">
                        {freeExams.find(e => e.id === activeFreeExamId)?.title || "সাপ্তাহিক স্পেশাল মডেল টেস্ট"}
                      </h4>
                      <p className="text-slate-500 text-xs font-semibold mt-0.5">
                        {toBanglaNumber(freeExamQuestions.length)} টি প্রশ্নের মধ্যে {toBanglaNumber(Object.keys(freeExamAnswers).length)} টির উত্তর দেওয়া হয়েছে
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-5">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">অবশিষ্ট সময়</span>
                      <span className={`text-2xl font-black font-mono transition-colors ${freeExamTimeLeft <= 60 ? "text-red-500 animate-pulse" : "text-black"}`}>
                        {formatTimeLeft(freeExamTimeLeft)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm("আপনি কি সত্যিই এখন পরীক্ষা সাবমিট করতে চান? আর কোনো পরিবর্তন করা যাবে না।")) {
                          handleFreeExamSubmit(false);
                        }
                      }}
                      className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
                    >
                      পরীক্ষা জমা দিন (Submit)
                    </button>
                  </div>
                </div>

                {/* Question sheets */}
                <div className="max-w-4xl mx-auto space-y-6">
                  {freeExamQuestions.map((q, idx) => {
                    const selectedIdx = freeExamAnswers[idx];
                    return (
                      <div key={idx} className="bg-white border border-slate-200 p-6 md:p-8 rounded-[2rem] shadow-xs space-y-6">
                        <div className="flex items-start gap-4">
                          <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-extrabold text-xs text-black shrink-0">
                            {toBanglaNumber(idx + 1)}
                          </span>
                          <span className="text-sm md:text-md font-bold text-black pt-1 leading-relaxed">
                            {q.question}
                          </span>
                        </div>

                        {/* Options list */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-12">
                          {[q.option1, q.option2, q.option3, q.option4].map((opt, optIdx) => {
                            const isChosen = selectedIdx === optIdx;
                            return (
                              <button
                                key={optIdx}
                                type="button"
                                onClick={() => {
                                  setFreeExamAnswers(prev => ({
                                    ...prev,
                                    [idx]: optIdx
                                  }));
                                }}
                                className={`p-4 text-left rounded-2xl border text-xs font-semibold font-mixed transition-all cursor-pointer flex items-center gap-3 active:scale-99 ${
                                  isChosen
                                    ? "bg-indigo-50 border-indigo-505 text-indigo-700 shadow-xs"
                                    : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800"
                                }`}
                              >
                                <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] shrink-0 ${
                                  isChosen ? "border-indigo-505 bg-indigo-600 text-white" : "border-slate-350 bg-white"
                                }`}>
                                  {toBanglaNumber(optIdx + 1)}
                                </span>
                                <span>{opt}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom floating submit bar for mobile */}
                <div className="max-w-4xl mx-auto pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("আপনি কি সত্যিই এখন পরীক্ষা সাবমিট করতে চান? আর কোনো পরিবর্তন করা যাবে না।")) {
                        handleFreeExamSubmit(false);
                      }
                    }}
                    className="w-full py-4.5 bg-black hover:bg-slate-850 text-white font-black text-sm rounded-2xl shadow-xl hover:shadow-2xl transition-all cursor-pointer text-center font-bold"
                  >
                    পরীক্ষা শেষ করুন ও ফলাফল সাবমিট করুন
                  </button>
                </div>
              </div>
            ) : freeExamScore?.submitted ? (
              /* CASE 2: RESULTS AND EXPLANATION KEY SHEETS */
              <div className="space-y-8 animate-tab-content">
                {/* Score panel card */}
                <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 md:p-12 text-center max-w-2xl mx-auto space-y-6 shadow-xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900/40 via-transparent to-red-900/10 pointer-events-none" />
                  
                  <div className="p-4 bg-white/10 w-fit mx-auto rounded-full text-amber-400">
                    <Trophy className="w-10 h-10 animate-bounce" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl md:text-2xl font-black">
                      {freeExamScore.correct >= freeExamScore.total * 0.8
                        ? "চমৎকার ফলাফল হয়েছে!" 
                        : freeExamScore.correct >= freeExamScore.total * 0.5 
                        ? "অনেক ভালো হয়েছে! আর একটু চেষ্টা করুন।" 
                        : "পুনরায় মনোযোগ সহকারে পড়াশোনা করা প্রয়োজন!"}
                    </h3>
                    <p className="text-slate-300 text-xs font-semibold">
                      আপনার সাবমিটকৃত পরীক্ষার রিপোর্ট কার্ড
                    </p>
                  </div>

                  {/* Huge Monospace High Contrast Score Card */}
                  <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 max-w-sm mx-auto">
                    <div className="text-5xl font-black font-mono tracking-tight text-white mb-2">
                      {toBanglaNumber(freeExamScore.correct)} <span className="text-2xl text-slate-400">/ {toBanglaNumber(freeExamScore.total)}</span>
                    </div>
                    <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden mt-4">
                      <div 
                        className="bg-emerald-505 h-full transition-all duration-1000" 
                        style={{ width: `${(freeExamScore.correct / freeExamScore.total) * 100}%` }} 
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-extrabold mt-2 uppercase tracking-wide">
                      <span>প্রাপ্ত স্কিল রেটিং</span>
                      <span>{toBanglaNumber(Math.round((freeExamScore.correct / freeExamScore.total) * 100))}% সঠিক</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFreeExamStarted(false);
                        setFreeExamScore(null);
                        setActiveFreeExamId(null);
                      }}
                      className="px-6 py-3.5 bg-white hover:bg-slate-100 text-black font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-md inline-flex items-center justify-center gap-2"
                    >
                      <List className="w-4 h-4" /> পরীক্ষা তালিকায় ফিরে যান
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const activeExam = freeExams.find(e => e.id === activeFreeExamId);
                        if (activeExam) startExamSession(activeExam);
                      }}
                      className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-md inline-flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" /> পুনরায় চ্যালেঞ্জ করুন
                    </button>
                  </div>
                </div>

                {/* Score explanations list sheet */}
                <div className="max-w-4xl mx-auto space-y-6">
                  <h4 className="text-sm font-black text-black font-mixed flex items-center gap-2 uppercase tracking-wider pl-1 font-semibold">
                    <FileText className="w-4 h-4 text-indigo-650" /> প্রশ্নের সম্পূর্ণ উত্তরমালা ও विश्लेषण
                  </h4>

                  {freeExamQuestions.map((q, idx) => {
                    const selectedIdx = freeExamAnswers[idx];
                    const correctIdx = q.correctIdx;
                    const isCorrect = selectedIdx === correctIdx;

                    return (
                      <div 
                        key={idx} 
                        className={`bg-white border rounded-[2.5rem] p-6 md:p-8 space-y-4 shadow-xs transition-all relative ${
                          isCorrect ? "border-emerald-200 bg-emerald-50/5" : "border-red-100 bg-red-50/5"
                        }`}
                      >
                        <div className="absolute top-6 right-6">
                          {isCorrect ? (
                            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase text-emerald-600 bg-emerald-55 border border-emerald-100 font-mixed">সঠিক</span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase text-red-650 bg-red-50 border border-red-100 font-mixed">ভুল উত্তর</span>
                          )}
                        </div>

                        <div className="flex items-start gap-4">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-xs shrink-0 ${
                            isCorrect ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-750"
                          }`}>
                            {toBanglaNumber(idx + 1)}
                          </span>
                          <span className="text-sm md:text-md font-bold text-black pt-1 leading-relaxed">
                            {q.question}
                          </span>
                        </div>

                        {/* Display choices */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-12">
                          {[q.option1, q.option2, q.option3, q.option4].map((opt, optIdx) => {
                            const chosenHere = selectedIdx === optIdx;
                            const isCorrectHere = correctIdx === optIdx;

                            let choiceClass = "bg-slate-50 border-slate-200 text-slate-800";
                            if (isCorrectHere) {
                              choiceClass = "bg-emerald-50 border-emerald-300 text-emerald-800 font-bold";
                            } else if (chosenHere) {
                              choiceClass = "bg-red-50 border-red-200 text-red-800 font-bold";
                            }

                            return (
                              <div
                                key={optIdx}
                                className={`p-4 rounded-xl border text-xs font-semibold flex items-center gap-3 ${choiceClass}`}
                              >
                                <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] shrink-0 ${
                                  isCorrectHere ? "bg-emerald-500 border-emerald-500 text-white" : chosenHere ? "bg-red-500 border-red-500 text-white" : "bg-white border-slate-250"
                                }`}>
                                  {toBanglaNumber(optIdx + 1)}
                                </span>
                                <span>{opt}</span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Explanation block */}
                        <div className="pl-12 pt-2">
                          <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200/60 text-xs text-slate-600 space-y-1">
                            <span className="font-extrabold text-black font-mixed block">💡 ব্যাখ্যা ও গাণিতিক সমাধান:</span>
                            <p className="font-semibold leading-relaxed">
                              {q.explanation || "সঠিক উত্তর অপশন " + toBanglaNumber(correctIdx + 1) + "। গাণিতিক সূত্রের নিখুঁত ট্র্যাকিং করে কম সময়ে সমাধান করুন।"}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* CASE 3: EXAMS GRID DIRECTORY LISTING */
              <div className="space-y-6 animate-tab-content">
                <div className="bg-white border border-slate-200/80 rounded-[2rem] p-6 md:p-8 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-1 text-center md:text-left">
                    <h3 className="text-md font-black text-black uppercase font-mixed">উপলব্ধ মডেল টেস্টসমূহ ({toBanglaNumber(freeExams.length)} টি)</h3>
                    <p className="text-slate-500 text-xs md:text-sm font-semibold font-mixed">
                      যেকোনো পরীক্ষায় ইচ্ছেমতো মক-বোর্ড সেশন শুরু করুন এবং নিজের দক্ষতা পরিমাপ করুন।
                    </p>
                  </div>
                  <div className="text-xs bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold font-mixed px-4.5 py-2.5 rounded-full">
                    🟢 লাইভ প্ল্যাটফর্ম পরীক্ষার তালিকা
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {freeExams.map((test) => {
                    const defaultTimeMins = test.timeMins || 10;
                    const defaultCount = (test.questions && test.questions.length > 0) ? test.questions.length : (test.questionsCount || 10);
                    
                    return (
                      <div
                        key={test.id}
                        className="bg-white border border-slate-200 hover:border-slate-300 rounded-[2rem] p-6 hover:shadow-lg transition-all group flex flex-col h-full justify-between"
                      >
                        <div className="space-y-4">
                          <div className="flex justify-between items-start">
                            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black tracking-wide uppercase font-mixed">
                              {test.batch || "HSC অল"}
                            </span>
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
                              {test.subject || "পদার্থবিজ্ঞান (Physics)"}
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            <h4 className="text-md font-extrabold text-black group-hover:text-indigo-650 transition-colors leading-snug">
                              {test.title}
                            </h4>
                            <p className="text-slate-400 text-[10px] font-semibold leading-relaxed">
                              সংক্ষিপ্ত চ্যাপ্টার: {test.chapter ? (test.chapter.charAt(0).toUpperCase() + test.chapter.slice(1)) : "সকল চ্যাপ্টার স্পেশাল মডেল টেস্ট"}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pb-2">
                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex flex-col items-center text-center">
                              <span className="text-[9px] text-slate-400 font-bold uppercase">প্রশ্ন</span>
                              <span className="text-xs font-black text-slate-800 mt-0.5">{toBanglaNumber(defaultCount)} টি এমসিকিউ</span>
                            </div>
                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex flex-col items-center text-center">
                              <span className="text-[9px] text-slate-400 font-bold uppercase">সময় সীমা</span>
                              <span className="text-xs font-black text-slate-800 mt-0.5">{toBanglaNumber(defaultTimeMins)} মিনিট</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => startExamSession(test)}
                          className="w-full mt-4 py-3 bg-black group-hover:bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
                        >
                          <PlayCircle className="w-4 h-4" />
                          পরীক্ষায় অংশ নিন (Start Test)
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
        {/* VIEW 5.5: QUIZ FEATURES */}
        {view === "quiz-uploader" && (
          <div className="animate-tab-content">
            <div className="p-4"><button onClick={() => setView("home")} className="flex items-center gap-2 text-slate-700 font-bold"><ArrowLeft className="w-5 h-5"/> মূল মেনুতে ফিরুন</button></div>
            <QuizUploader />
          </div>
        )}
        {view === "quiz-player" && (
          <div className="animate-tab-content">
            <div className="p-4"><button onClick={() => setView("home")} className="flex items-center gap-2 text-slate-700 font-bold"><ArrowLeft className="w-5 h-5"/> মূল মেনুতে ফিরুন</button></div>
            <QuizPlayer />
          </div>
        )}

        {/* VIEW 7: ADMINISTRATIVE PORTAL */}
        {view === "admin" && (
          <div className="animate-tab-content">
            {/* Header sub-nav item */}
            <div className="sticky top-18 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
              <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
                <button
                  onClick={() => setView("home")}
                  className="flex items-center gap-2 text-slate-700 hover:text-black font-extrabold font-mixed transition-colors text-sm cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" /> হোমপেজে ফিরুন
                </button>
                <div className="flex items-center gap-2">
                  <span className="bg-red-100 text-red-700 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
                    Admin Panel
                  </span>
                </div>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
              {!isAdmin ? (
                <div className="bg-white border border-slate-200 rounded-[2rem] p-8 md:p-12 text-center max-w-xl mx-auto space-y-6 shadow-sm">
                  <div className="w-16 h-16 bg-red-150 text-red-650 rounded-full flex items-center justify-center mx-auto text-3xl">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-bold font-mixed text-black">অননুমোদিত প্রবেশ!</h2>
                    <p className="text-slate-500 text-xs font-mixed leading-relaxed">
                      আসসালামু আলাইকুম, এই এডমিন সেকশনটি শুধুমাত্র অনুমোদিত ইনস্ট্রাক্টর ও মেন্টরদের ব্যবহারের জন্য সুরক্ষিত। অনুগ্রহ করে লগইন পেইজ থেকে এডমিন ইমেইল ও পাসওয়ার্ড ব্যবহার করুন।
                    </p>
                  </div>
                  <button
                    onClick={() => setView("login")}
                    className="bg-black text-white hover:bg-slate-800 text-xs font-bold font-mixed px-6 py-3 rounded-xl transition-all cursor-pointer"
                  >
                    লগইন পেইজ এ যান
                  </button>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Glorious Tabbed Selector for different page resources */}
                  <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-2">
                    <button
                      onClick={() => setAdminTab("buttons")}
                      className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-xs font-black font-mixed transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        adminTab === "buttons"
                          ? "bg-black text-white shadow-md"
                          : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <SettingsIcon className="w-4 h-4 shrink-0" />
                      ফিচার বাটনসমূহ
                    </button>
                    <button
                      onClick={() => setAdminTab("courses")}
                      className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-xs font-black font-mixed transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        adminTab === "courses"
                          ? "bg-black text-white shadow-md"
                          : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <BookOpen className="w-4 h-4 shrink-0" />
                      স্পেশাল কোর্সসমূহ
                    </button>
                    <button
                      onClick={() => setAdminTab("routine")}
                      className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-xs font-black font-mixed transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        adminTab === "routine"
                          ? "bg-black text-white shadow-md"
                          : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <Calendar className="w-4 h-4 shrink-0" />
                      পরীক্ষার রুটিন
                    </button>
                    <button
                      onClick={() => setAdminTab("suggestions")}
                      className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-xs font-black font-mixed transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        adminTab === "suggestions"
                          ? "bg-black text-white shadow-md"
                          : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <FileDown className="w-4 h-4 shrink-0" />
                      সাজেশন পিডিএফ
                    </button>
                    <button
                      onClick={() => setAdminTab("exams_mcqs")}
                      className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-xs font-black font-mixed transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        adminTab === "exams_mcqs"
                          ? "bg-black text-white shadow-md"
                          : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <FileText className="w-4 h-4 shrink-0" />
                      এক্সাম ও পোল MCQ
                    </button>
                    <button
                      onClick={() => setAdminTab("reviews")}
                      className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-xs font-black font-mixed transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        adminTab === "reviews"
                          ? "bg-black text-white shadow-md"
                          : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <Star className="w-4 h-4 shrink-0" />
                      সাবজেক্ট রিভিউসমূহ
                    </button>
                  </div>

                  {/* TAB 1: QUICK BUTTONS EDITING */}
                  {adminTab === "buttons" && (
                    <div className="space-y-6 animate-tab-content">
                      <div className="bg-white rounded-[2rem] p-6 md:p-10 border border-slate-200/80 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-6">
                        <div className="space-y-2.5 text-center lg:text-left">
                          <h3 className="text-xl md:text-2xl font-extrabold font-mixed text-black flex items-center gap-2.5 justify-center lg:justify-start">
                            <SettingsIcon className="w-6 h-6 text-indigo-650" />
                            সার্ভিস কিউরেটর ড্যাশবোর্ড
                          </h3>
                          <p className="text-slate-500 text-xs md:text-sm font-mixed leading-relaxed max-w-2xl">
                            হোমপেইজের কুইক অ্যাক্সেস গ্রিডের ৬টি ফিচার বাটন সরাসরি এই প্যানেল থেকে এডিট করুন। আপনার করা প্রতিটি পরিবর্তন রিয়েল-টাইম ফায়ারবেস ক্লাউড স্টোরেজ ডাটাবেজে সংরক্ষণ হবে এবং সকল ইউজারদের ফোনে সাথে সাথে পরিবর্তন প্রতিফলিত হবে।
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <button
                            onClick={async () => {
                              try {
                                await saveQuickFeaturesToFirestore(quickFeatures);
                                localStorage.setItem("firestore_features_cache", JSON.stringify(quickFeatures));
                                showToast("ফায়ারবেস ক্লাউড ডাটাবেজে সমস্ত কিউরেটেড ফিচার সফলভাবে সংরক্ষিত হয়েছে!", "success");
                              } catch (e) {
                                showToast("ফায়ারবেস ক্লাউডে ফিচার বাটন সেভ করতে গিয়ে ত্রুটি ঘটেছে।", "warning");
                              }
                            }}
                            className="bg-black text-white hover:bg-slate-800 font-extrabold font-mixed text-xs px-6 py-4 rounded-2xl cursor-pointer shadow-md transition-all flex items-center justify-center gap-2"
                          >
                            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                            বাটন পরিবর্তন ক্লাউডে সেভ করুন
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm("আপনি কি নিশ্চিতভাবে ৬টি কুইক সার্ভিস বাটনকে পূর্বনির্ধারিত (Default) অবস্থায় রিসেট করতে চান?")) {
                                setQuickFeatures(DEFAULT_QUICK_FEATURES);
                                saveQuickFeaturesToFirestore(DEFAULT_QUICK_FEATURES);
                                showToast("ডিফল্ট বাটনের রূপান্তর সফল হয়েছে!", "info");
                              }
                            }}
                            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-extrabold font-mixed text-xs px-6 py-4 rounded-2xl cursor-pointer transition-all flex items-center justify-center gap-2"
                          >
                            <RefreshCw className="w-4 h-4 text-slate-400" />
                            পুনরায় ডিফল্ট রিসেট করুন
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {quickFeatures.filter(f => !f.adminOnly || isAdmin).map((feat, idx) => (
                          <div key={feat.id} className="bg-white rounded-[2rem] border border-slate-200 p-6 md:p-8 shadow-sm space-y-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-slate-100 text-slate-500 text-[10px] font-black px-4 py-1.5 rounded-bl-xl font-mixed uppercase">
                              ফিচার বাটন নং {toBanglaNumber(idx + 1)}
                            </div>

                            <div className="flex items-center gap-3">
                              <div className={`p-2.5 rounded-xl flex items-center justify-center ${
                                feat.colorTheme === "blue" ? "bg-blue-50 text-blue-600" :
                                feat.colorTheme === "slate" ? "bg-slate-50 text-slate-800" :
                                feat.colorTheme === "purple" ? "bg-purple-50 text-purple-600" :
                                feat.colorTheme === "orange" ? "bg-orange-50 text-orange-600" :
                                feat.colorTheme === "red" ? "bg-red-50 text-red-600" :
                                feat.colorTheme === "indigo" ? "bg-indigo-50 text-indigo-600" :
                                feat.colorTheme === "emerald" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-500"
                              }`}>
                                {getIconComponent(feat.iconName, "w-5 h-5")}
                              </div>
                              <div>
                                <h4 className="font-extrabold text-black font-mixed text-sm leading-none truncate max-w-[150px]">
                                  {feat.title || "নামবিহীন ফিচার বাটন"}
                                </h4>
                                <p className="text-[10px] text-slate-400 font-semibold font-mixed uppercase mt-1">
                                  আইডি: {feat.id}
                                </p>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider font-mixed">বাটনের নাম (Bengali Title)</label>
                              <input
                                type="text"
                                value={feat.title}
                                onChange={(e) => {
                                  const copy = [...quickFeatures];
                                  copy[idx].title = e.target.value;
                                  setQuickFeatures(copy);
                                }}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mixed text-xs text-black focus:outline-none focus:ring-2 focus:ring-slate-300 focus:bg-white transition-all font-semibold"
                                placeholder="বাটনের নাম টাইপ করুন..."
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider font-mixed">আইকন মেকার</label>
                                <select
                                  value={feat.iconName}
                                  onChange={(e) => {
                                    const copy = [...quickFeatures];
                                    copy[idx].iconName = e.target.value;
                                    setQuickFeatures(copy);
                                  }}
                                  className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mixed text-xs text-black focus:outline-none focus:ring-2 focus:ring-slate-300 focus:bg-white font-bold cursor-pointer"
                                >
                                  <option value="BarChart3">BarChart (পোল)</option>
                                  <option value="BookOpen">BookOpen (কোর্স)</option>
                                  <option value="FileText">FileText (এক্সাম)</option>
                                  <option value="Star">Star (রিভিউ)</option>
                                  <option value="FileDown">FileDown (পিডিএফ)</option>
                                  <option value="Calendar">Calendar (ক্যালেন্ডার)</option>
                                  <option value="Award">Award (মেডেল)</option>
                                  <option value="HelpCircle">Help (জিজ্ঞাসা)</option>
                                  <option value="Zap">Zap (বিদ্যুত লাইভ)</option>
                                  <option value="Layout">Layout (ড্যাশবোর্ড)</option>
                                  <option value="BookMarked">BookMarked (বুকমার্ক)</option>
                                  <option value="Clock">Clock (সময় কাউন্টার)</option>
                                  <option value="Sparkles">Sparkles (এআই আইকন)</option>
                                  <option value="SettingsIcon">Settings (সেটিংস)</option>
                                  <option value="Database">Database (ডাটাবেজ)</option>
                                  <option value="Upload">Upload (আপলোড)</option>
                                </select>
                              </div>

                              <div className="space-y-2">
                                <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider font-mixed">কালার থিম</label>
                                <select
                                  value={feat.colorTheme}
                                  onChange={(e) => {
                                    const copy = [...quickFeatures];
                                    copy[idx].colorTheme = e.target.value as any;
                                    setQuickFeatures(copy);
                                  }}
                                  className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mixed text-xs text-black focus:outline-none focus:ring-2 focus:ring-slate-300 focus:bg-white font-bold cursor-pointer"
                                >
                                  <option value="blue">Blue (নীল)</option>
                                  <option value="slate">Slate (ধূসর)</option>
                                  <option value="purple">Purple (বেগুনি)</option>
                                  <option value="orange">Orange (কমলা)</option>
                                  <option value="red">Red (লাল)</option>
                                  <option value="indigo">Indigo (নীলচে বেগুনি)</option>
                                  <option value="emerald">Emerald (সবুজ)</option>
                                  <option value="amber">Amber (হলুদ)</option>
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider font-mixed">অ্যাকশন ধরণ</label>
                                <select
                                  value={feat.actionType}
                                  onChange={(e) => {
                                    const copy = [...quickFeatures];
                                    copy[idx].actionType = e.target.value as any;
                                    setQuickFeatures(copy);
                                  }}
                                  className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mixed text-xs text-black focus:outline-none focus:ring-2 focus:ring-slate-300 focus:bg-white font-bold cursor-pointer"
                                >
                                  <option value="view">View (অ্যাপ পেইজ পরিবর্তন)</option>
                                  <option value="scroll">Scroll (পেইজে স্ক্রোল)</option>
                                  <option value="toast">Toast (ইনফো এলার্ট মেসেজ)</option>
                                  <option value="link">Link (বাহ্যিক লিংক ব্রাউজ)</option>
                                </select>
                              </div>

                              <div className="space-y-2">
                                <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider font-mixed">বাটনের অবস্থা</label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const copy = [...quickFeatures];
                                    copy[idx].isActive = !copy[idx].isActive;
                                    setQuickFeatures(copy);
                                  }}
                                  className={`w-full py-3 rounded-xl border font-mixed text-xs font-black transition-all cursor-pointer ${
                                    feat.isActive 
                                      ? "bg-slate-900 border-slate-950 text-white hover:bg-slate-800" 
                                      : "bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200"
                                  }`}
                                >
                                  {feat.isActive ? "সক্রিয় রয়েছে (Active)" : "নিষ্ক্রিয় রয়েছে (Disabled)"}
                                </button>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-[10px] text-slate-400 font-extrabold uppercase font-mixed">
                                <span>অ্যাকশন টার্গেট ভ্যালু</span>
                                <span className="text-[9px] text-red-650 normal-case font-bold">
                                  {feat.actionType === "view" ? "ভিউ আইডি লিখুন (যেমন: pdf-suggestions)" :
                                   feat.actionType === "scroll" ? "সেকশন আইডি (যেমন: courses-section)" :
                                   feat.actionType === "toast" ? "মেসেজ লিখুন" : "https URL"}
                                </span>
                              </div>
                              <input
                                type="text"
                                value={feat.actionValue}
                                onChange={(e) => {
                                  const copy = [...quickFeatures];
                                  copy[idx].actionValue = e.target.value;
                                  setQuickFeatures(copy);
                                }}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mixed text-xs text-black focus:outline-none focus:ring-2 focus:ring-slate-300 focus:bg-white transition-all font-semibold"
                                placeholder={feat.actionType === "view" ? "ভিউ নাম..." : feat.actionType === "scroll" ? "সেকশন আইডি..." : "ফ্রি টেক্সট বা লিংক..."}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 2: SPECIAL COURSES */}
                  {adminTab === "courses" && (
                    <div className="space-y-8 animate-tab-content">
                      <div className="bg-white rounded-[2rem] p-6 md:p-10 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="space-y-1 text-center md:text-left">
                          <h3 className="text-xl md:text-2xl font-extrabold font-mixed text-black flex items-center gap-2.5 justify-center md:justify-start">
                            <BookOpen className="w-6 h-6 text-indigo-650" />
                            আমাদের স্পেশাল কোর্স পরিচালনা
                          </h3>
                          <p className="text-slate-500 text-xs md:text-sm font-mixed font-semibold leading-relaxed">
                            নতুন কোর্স এড করুন বা বিদ্যমান কোর্স পরিবর্তন করুন। পরিবর্তনগুলো লাইভ দেখতে হোমপেইজের 'আমাদের স্পেশাল কোর্স' অংশে স্ক্রোল করুন।
                          </p>
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              await saveCoursesToFirestore(courses);
                              localStorage.setItem("engr_platform_courses", JSON.stringify(courses));
                              showToast("কোর্সের ডেটাবেজ সফলভাবে ক্লাউডে এবং লোকাল ক্যাশে সেভ হয়েছে!", "success");
                            } catch (err) {
                              showToast("ক্লাউড ডাটাবেজে কোর্স সেভ করতে ব্যর্থ হয়েছে।", "warning");
                            }
                          }}
                          className="bg-black text-white hover:bg-slate-800 font-extrabold font-mixed text-xs px-6 py-4 rounded-2xl flex items-center gap-2.5 shadow-md cursor-pointer shrink-0"
                        >
                          <Database className="w-4 h-4 text-emerald-400" />
                          কোর্স পরিবর্তন ক্লাউডে সেভ করুন
                        </button>
                      </div>

                      {/* Course Adder Form */}
                      <div className="bg-slate-50 rounded-[2rem] border border-slate-200 p-6 md:p-8 space-y-6">
                        <h4 className="text-base font-extrabold text-black font-mixed flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-indigo-650 animate-pulse" />
                          নতুন একটি কোর্স যুক্ত করুন:
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500">কোর্সের শিরোনাম</label>
                            <input
                              type="text"
                              value={newCourse.title}
                              onChange={(e) => setNewCourse({...newCourse, title: e.target.value})}
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-300"
                              placeholder="যেমন: HSC 26 রসায়ন প্রো ব্যাচ"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500">টার্গেট ব্যাচ</label>
                            <select
                              value={newCourse.batch}
                              onChange={(e) => setNewCourse({...newCourse, batch: e.target.value})}
                              className="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-300"
                            >
                              <option value="HSC 26">HSC 26</option>
                              <option value="HSC 27">HSC 27</option>
                              <option value="Admission">Admission</option>
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500">কোর্সের মূল্য (টাকা)</label>
                            <input
                              type="text"
                              value={newCourse.price}
                              onChange={(e) => setNewCourse({...newCourse, price: e.target.value})}
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-300"
                              placeholder="যেমন: ১৫০০"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500">পূর্বের মূল মূল্য (Original Price)</label>
                            <input
                              type="text"
                              value={newCourse.originalPrice}
                              onChange={(e) => setNewCourse({...newCourse, originalPrice: e.target.value})}
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-300"
                              placeholder="যেমন: ২৫০০"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500">ভর্তির শেষ সময় (Bangla Label)</label>
                            <input
                              type="text"
                              value={newCourse.deadlineLabel}
                              onChange={(e) => setNewCourse({...newCourse, deadlineLabel: e.target.value})}
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-300"
                              placeholder="যেমন: ৩০ জুন"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500">শেষ সময় ISO ধরণ (For Countdown)</label>
                            <input
                              type="text"
                              value={newCourse.deadlineISO}
                              onChange={(e) => setNewCourse({...newCourse, deadlineISO: e.target.value})}
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-300"
                              placeholder="जैसे: 2026-06-30T23:59:59"
                            />
                          </div>

                          <div className="space-y-1.5 md:col-span-2 lg:col-span-3">
                            <label className="text-xs font-bold text-slate-500">ব্যানার ইমেজ লিংক (Unsplash URL)</label>
                            <input
                              type="text"
                              value={newCourse.image}
                              onChange={(e) => setNewCourse({...newCourse, image: e.target.value})}
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-300"
                              placeholder="https://images.unsplash.com/photo-..."
                            />
                          </div>
                        </div>

                        {/* Features array entries */}
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-slate-500">কোর্সের আকর্ষণীয় ফিচারসমূহ (Features list - Comma separated)</label>
                          <input
                            type="text"
                            placeholder="যেমন: ১২০+ লাইভ ক্লাস, প্র্যাকটিস শিট, ২৪/৭ মেন্টর সাপোর্ট"
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-300"
                            onChange={(e) => {
                              const list = e.target.value.split(",").map(val => val.trim()).filter(Boolean);
                              setNewCourse({...newCourse, features: list});
                            }}
                          />
                        </div>

                        <button
                          onClick={() => {
                            if (!newCourse.title || !newCourse.price) {
                              showToast("দয়া করে কোর্স শিরোনাম এবং মূল্য প্রদান করুন।", "warning");
                              return;
                            }
                            const added = [...courses, { ...newCourse, id: Date.now() }];
                            setCourses(added);
                            localStorage.setItem("engr_platform_courses", JSON.stringify(added));
                            showToast("নতুন কোর্স যুক্ত করা হয়েছে! লাইভ করার জন্য উপরে 'ক্লাউডে সেভ' বাটনটি ক্লিক করুন।", "success");
                            // reset
                            setNewCourse({
                              batch: "HSC 26",
                              title: "",
                              image: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=600",
                              deadlineLabel: "৩০ জুন",
                              deadlineISO: "2026-06-30T23:59:59",
                              price: "৪৫০০",
                              originalPrice: "৬০০০",
                              features: ["১২০+ লাইভ ক্লাস", "প্রতিদিন প্র্যাকটিস শিট", "সাপ্তাহিক মডেল টেস্ট"]
                            });
                          }}
                          className="w-full py-4 bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold font-mixed text-xs rounded-xl shadow-md transition-all cursor-pointer"
                        >
                          কোর্সটি তালিকায় যুক্ত করুন
                        </button>
                      </div>

                      {/* Course listing table */}
                      <div className="bg-white rounded-[2rem] border border-slate-200 p-6 md:p-8 space-y-4">
                        <h4 className="text-sm font-black text-black uppercase font-mixed">চলতি কোর্সসমূহ ({toBanglaNumber(courses.length)} টি)</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-extrabold uppercase font-mixed">
                                <th className="p-4 rounded-l-xl">থাম্বনেইল</th>
                                <th className="p-4">কোর্স টাইটেল</th>
                                <th className="p-4">ব্যাচ</th>
                                <th className="p-4">মূল্য</th>
                                <th className="p-4">ফিচার সংখ্যা</th>
                                <th className="p-4 text-center rounded-r-xl">অ্যাকশন</th>
                              </tr>
                            </thead>
                            <tbody>
                              {courses.map((c, index) => (
                                <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                                  <td className="p-4">
                                    <img src={c.image} alt="" className="w-12 h-8 rounded-md object-cover border border-slate-200" />
                                  </td>
                                  <td className="p-4">
                                    <input
                                      type="text"
                                      value={c.title}
                                      onChange={(e) => {
                                        const updated = [...courses];
                                        updated[index].title = e.target.value;
                                        setCourses(updated);
                                      }}
                                      className="font-bold text-black font-mixed w-full bg-transparent focus:bg-white border-0 focus:border px-2 py-1.5 rounded-md"
                                    />
                                  </td>
                                  <td className="p-4 font-extrabold text-indigo-700">{c.batch}</td>
                                  <td className="p-4 font-bold text-emerald-700">৳{toBanglaNumber(c.price)}</td>
                                  <td className="p-4 text-slate-500 font-semibold">{toBanglaNumber(c.features?.length || 0)} টি</td>
                                  <td className="p-4 text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (selectedCourseEditId === c.id) {
                                            setSelectedCourseEditId(null);
                                          } else {
                                            setSelectedCourseEditId(c.id);
                                          }
                                        }}
                                        className={`px-3 py-2 text-xs font-bold font-mixed rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                                          selectedCourseEditId === c.id
                                            ? "bg-indigo-600 text-white shadow-sm"
                                            : "bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-650"
                                        }`}
                                      >
                                        <SettingsIcon className="w-3.5 h-3.5" />
                                        রুটিন ও ডিটেইলস
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (window.confirm(`আপনি কি সত্যিই "${c.title}" কোর্সটি ডিলিট করতে চান?`)) {
                                            const filtered = courses.filter(item => item.id !== c.id);
                                            setCourses(filtered);
                                            localStorage.setItem("engr_platform_courses", JSON.stringify(filtered));
                                            if (selectedCourseEditId === c.id) setSelectedCourseEditId(null);
                                            showToast("কোর্সটি রিমুভ করা হয়েছে!", "info");
                                          }
                                        }}
                                        className="p-2 bg-red-50 text-red-650 hover:bg-red-100 rounded-xl transition-colors cursor-pointer inline-flex items-center"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* COURSE DETAIL & ROUTINE EDITOR SUBFORM */}
                      {selectedCourseEditId !== null && (() => {
                        const courseIdx = courses.findIndex(c => c.id === selectedCourseEditId);
                        if (courseIdx === -1) return null;
                        const editingCourse = courses[courseIdx];

                        return (
                          <div className="bg-slate-50 border border-slate-200 p-6 md:p-8 rounded-[1.5rem] mt-6 gap-6 space-y-6">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                              <h4 className="text-sm font-black text-black font-mixed flex items-center gap-2">
                                <SettingsIcon className="w-4 h-4 text-indigo-650 animate-spin-slow" />
                                "{editingCourse.title}" - এর বিস্তারিত ও সাপ্তাহিক রুটিন কাস্টমাইজ করুন
                              </h4>
                              <button 
                                type="button"
                                onClick={() => setSelectedCourseEditId(null)}
                                className="text-slate-400 hover:text-black font-extrabold text-xs px-2 py-1 bg-white hover:bg-slate-100 rounded-lg cursor-pointer transition-colors shadow-xs"
                              >
                                বন্ধ করুন ✕
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500">মোট ক্লাস সংখ্যা (classesCount)</label>
                                <input
                                  type="text"
                                  value={editingCourse.classesCount || ""}
                                  placeholder="যেমন: ১২০+ সেশন"
                                  onChange={(e) => {
                                    const updated = [...courses];
                                    updated[courseIdx] = {
                                      ...editingCourse,
                                      classesCount: e.target.value
                                    };
                                    setCourses(updated);
                                    localStorage.setItem("engr_platform_courses", JSON.stringify(updated));
                                  }}
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-300"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500">মোট পরীক্ষার সংখ্যা (examsCount)</label>
                                <input
                                  type="text"
                                  value={editingCourse.examsCount || ""}
                                  placeholder="যেমন: ১৬টি মডেল টেস্ট"
                                  onChange={(e) => {
                                    const updated = [...courses];
                                    updated[courseIdx] = {
                                      ...editingCourse,
                                      examsCount: e.target.value
                                    };
                                    setCourses(updated);
                                    localStorage.setItem("engr_platform_courses", JSON.stringify(updated));
                                  }}
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-300"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500">কোর্সের মোট মেয়াদ (duration)</label>
                                <input
                                  type="text"
                                  value={editingCourse.duration || ""}
                                  placeholder="যেমন: ০৬ মাস"
                                  onChange={(e) => {
                                    const updated = [...courses];
                                    updated[courseIdx] = {
                                      ...editingCourse,
                                      duration: e.target.value
                                    };
                                    setCourses(updated);
                                    localStorage.setItem("engr_platform_courses", JSON.stringify(updated));
                                  }}
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-300"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500">মেন্টর সাপোর্ট লেবেল (mentorSupport)</label>
                                <input
                                  type="text"
                                  value={editingCourse.mentorSupport || ""}
                                  placeholder="যেমন: ২৪/৭ ওয়ান ওয়ান সাপোর্ট"
                                  onChange={(e) => {
                                    const updated = [...courses];
                                    updated[courseIdx] = {
                                      ...editingCourse,
                                      mentorSupport: e.target.value
                                    };
                                    setCourses(updated);
                                    localStorage.setItem("engr_platform_courses", JSON.stringify(updated));
                                  }}
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-300"
                                />
                              </div>
                            </div>

                            {/* Class/weekly routine editing block */}
                            <div className="border border-slate-200 rounded-2xl p-4 md:p-6 bg-white space-y-4">
                              <h5 className="text-xs font-black text-black font-mixed uppercase tracking-wider">কোর্সের নির্ধারিত সাপ্তাহিক রুটিন</h5>
                              
                              {/* Add Class Form */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-500">বারের নাম</label>
                                  <input 
                                    type="text" 
                                    id="routine_add_day" 
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-indigo-505" 
                                    placeholder="শনিবার" 
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-500">বিষয়</label>
                                  <input 
                                    type="text" 
                                    id="routine_add_subject" 
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-indigo-505" 
                                    placeholder="রসায়ন" 
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-500">সময়</label>
                                  <input 
                                    type="text" 
                                    id="routine_add_time" 
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-indigo-505" 
                                    placeholder="০৮:৩০ PM" 
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-500">নির্ধারিত টপিক/অধ্যায়</label>
                                  <input 
                                    type="text" 
                                    id="routine_add_topic" 
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-indigo-505" 
                                    placeholder="সংকরায়ণ ও সংকর অরবিটাল" 
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const dayEl = document.getElementById("routine_add_day") as HTMLInputElement;
                                    const subEl = document.getElementById("routine_add_subject") as HTMLInputElement;
                                    const timeEl = document.getElementById("routine_add_time") as HTMLInputElement;
                                    const topEl = document.getElementById("routine_add_topic") as HTMLInputElement;

                                    if (!dayEl || !subEl || !dayEl.value || !subEl.value) {
                                      showToast("দয়া করে বার এবং বিষয়ক নাম পূরণ করুন।", "warning");
                                      return;
                                    }

                                    const newSlot = {
                                      day: dayEl.value,
                                      subject: subEl.value,
                                      time: timeEl.value || "০৯:০০ PM",
                                      topic: topEl.value || "থিওরি ও ম্যাথ সমাধান"
                                    };

                                    const currentList = editingCourse.routineList || [];
                                    const updated = [...courses];
                                    updated[courseIdx] = {
                                      ...editingCourse,
                                      routineList: [...currentList, newSlot]
                                    };

                                    setCourses(updated);
                                    localStorage.setItem("engr_platform_courses", JSON.stringify(updated));
                                    showToast("সাপ্তাহিক রুটিনে ক্লাসটি যুক্ত করা হয়েছে!", "success");

                                    // clear
                                    dayEl.value = "";
                                    subEl.value = "";
                                    timeEl.value = "";
                                    topEl.value = "";
                                  }}
                                  className="w-full py-2 bg-black hover:bg-slate-800 text-white font-bold text-xs rounded-lg cursor-pointer h-[38px] transition-all"
                                >
                                  যুক্ত করুন
                                </button>
                              </div>

                              {/* Routine slots mapping table */}
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs custom-scrollbar">
                                  <thead>
                                    <tr className="border-b border-slate-100 text-slate-400 font-extrabold pb-2 uppercase text-left">
                                      <th className="py-2">বার</th>
                                      <th className="py-2">বিষয়</th>
                                      <th className="py-2">সময়</th>
                                      <th className="py-2">টপিক বা অধ্যায়</th>
                                      <th className="py-2 text-center">অ্যাকশন</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 text-left">
                                    {(editingCourse.routineList && editingCourse.routineList.length > 0
                                      ? editingCourse.routineList
                                      : [
                                          { day: "শনিবার", subject: "পদার্থবিজ্ঞান (Physics)", time: "০৯:০০ PM", topic: "ভেক্টর ও গতিবিদ্যা ম্যাথ হ্যাকস" },
                                          { day: "সোমবার", subject: "রসায়ন (Chemistry)", time: "০৮:৩০ PM", topic: "পর্যায়বৃত্ত ধর্ম ও সংকরায়ণ সমীকরণ" },
                                          { day: "বুধবার", subject: "উচ্চতর গণিত (Math)", time: "০৯:০০ PM", topic: "ম্যাট্রিক্স ও ক্রেমার সুত্র সলভিং" },
                                          { day: "শুক্রবার", subject: "উইকলি পরীক্ষা", time: "০৪:০০ PM", topic: "সাপ্তাহিক স্পেশাল এমসিকিউ ও সেশন ট্র্যাকিং" }
                                        ]
                                    ).map((session: any, sIdx: number) => (
                                      <tr key={sIdx} className="hover:bg-slate-50/50">
                                        <td className="py-2.5 font-bold text-black">{session.day}</td>
                                        <td className="py-2.5 font-semibold text-slate-700">{session.subject}</td>
                                        <td className="py-2.5 text-slate-600">{session.time}</td>
                                        <td className="py-2.5 text-slate-500">{session.topic}</td>
                                        <td className="py-2.5 text-center">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const currentList = editingCourse.routineList && editingCourse.routineList.length > 0
                                                ? editingCourse.routineList
                                                : [
                                                    { day: "শনিবার", subject: "পদার্থবিজ্ঞান (Physics)", time: "০৯:০০ PM", topic: "ভেক্টর ও গতিবিদ্যা ম্যাথ হ্যাকস" },
                                                    { day: "সোমবার", subject: "রসায়ন (Chemistry)", time: "০৮:৩০ PM", topic: "পর্যায়বৃত্ত ধর্ম ও সংকরায়ণ সমীকরণ" },
                                                    { day: "বুধবার", subject: "উচ্চতর গণিত (Math)", time: "০৯:০০ PM", topic: "ম্যাট্রিক্স ও ক্রেমার সুত্র সলভিং" },
                                                    { day: "শুক্রবার", subject: "উইকলি পরীক্ষা", time: "০৪:০০ PM", topic: "সাপ্তাহিক স্পেশাল এমসিকিউ ও সেশন ট্র্যাকিং" }
                                                  ];
                                              const filtered = currentList.filter((_: any, idx: number) => idx !== sIdx);
                                              const updated = [...courses];
                                              updated[courseIdx] = {
                                                ...editingCourse,
                                                routineList: filtered
                                              };
                                              setCourses(updated);
                                              localStorage.setItem("engr_platform_courses", JSON.stringify(updated));
                                              showToast("রুটিন স্লট সরানো হয়েছে!", "info");
                                            }}
                                            className="p-1 px-2 bg-red-50 text-red-650 hover:bg-red-100 rounded-md cursor-pointer transition-colors"
                                          >
                                            ✕ সরাও
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* TAB 3: EXAM ROUTINE CALENDAR */}
                  {adminTab === "routine" && (
                    <div className="space-y-8 animate-tab-content">
                      <div className="bg-white rounded-[2rem] p-6 md:p-10 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="space-y-1 text-center md:text-left">
                          <h3 className="text-xl md:text-2xl font-extrabold font-mixed text-black flex items-center gap-2.5 justify-center md:justify-start">
                            <Calendar className="w-6 h-6 text-indigo-650" />
                            পরীক্ষার রুটিন ও ক্যালেন্ডার এডিটর
                          </h3>
                          <p className="text-slate-500 text-xs md:text-sm font-mixed font-semibold leading-relaxed">
                            এইচএসসি রুটিন ক্যালেন্ডারের লাইভ কন্টেন্ট পরিবর্তন করুন। ইউজাররা যাতে সঠিক কাউন্টডাউন টাইমার দেখতে পারে তা নিশ্চিত করুন।
                          </p>
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              const serialized = hscRoutine.map(item => ({
                                ...item,
                                targetDate: item.targetDate ? item.targetDate.toISOString() : undefined
                              }));
                              await saveRoutineToFirestore(serialized);
                              localStorage.setItem("engr_platform_routine", JSON.stringify(serialized));
                              showToast("রুটিন পরিবর্তন সফলভাবে ক্লাউড ডেটাবেজে সংরক্ষিত হয়েছে!", "success");
                            } catch (err) {
                              showToast("ক্লাউড ডাটাবেজে রুটিন সেভ করতে সমস্যা হয়েছে।", "warning");
                            }
                          }}
                          className="bg-black text-white hover:bg-slate-800 font-extrabold font-mixed text-xs px-6 py-4 rounded-2xl flex items-center gap-2.5 shadow-md cursor-pointer shrink-0"
                        >
                          <Database className="w-4 h-4 text-emerald-400" />
                          রুটিন ক্লাউডে সেভ করুন
                        </button>
                      </div>

                      {/* Routine Adder form */}
                      <div className="bg-slate-50 rounded-[2rem] border border-slate-200 p-6 md:p-8 space-y-6">
                        <h4 className="text-base font-extrabold text-black font-mixed flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-indigo-650 animate-pulse" />
                          নতুন বোর্ড পরীক্ষা সময়সূচী যুক্ত করুন:
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500">পরীক্ষার বিষয়</label>
                            <input
                              type="text"
                              value={newRoutineItem.subject}
                              onChange={(e) => setNewRoutineItem({...newRoutineItem, subject: e.target.value})}
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-300"
                              placeholder="যেমন: পদার্থবিজ্ঞান"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500">পত্র</label>
                            <select
                              value={newRoutineItem.paper}
                              onChange={(e) => setNewRoutineItem({...newRoutineItem, paper: e.target.value})}
                              className="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-300"
                            >
                              <option value="১ম পত্র">১ম পত্র</option>
                              <option value="২য় পত্র">২য় পত্র</option>
                              <option value="একক পত্র">একক পত্র</option>
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500">বাংলা তারিখ টেক্সট</label>
                            <input
                              type="text"
                              value={newRoutineItem.date}
                              onChange={(e) => setNewRoutineItem({...newRoutineItem, date: e.target.value})}
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-300"
                              placeholder="যেমন: ০২ জুলাই, ২০২৬"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500">কাউন্টডাউন তারিখ (ISO Format)</label>
                            <input
                              type="text"
                              value={newRoutineItem.targetDateStr}
                              onChange={(e) => setNewRoutineItem({...newRoutineItem, targetDateStr: e.target.value})}
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-300"
                              placeholder="যেমন: 2026-07-02T10:00:00"
                            />
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            if (!newRoutineItem.subject || !newRoutineItem.date) {
                              showToast("দয়া করে বিষয় ও তারিখ সঠিক উপায়ে লিখুন।", "warning");
                              return;
                            }
                            const tDate = newRoutineItem.targetDateStr ? new Date(newRoutineItem.targetDateStr) : new Date();
                            const added = [...hscRoutine, {
                              subject: newRoutineItem.subject,
                              paper: newRoutineItem.paper,
                              date: newRoutineItem.date,
                              targetDate: tDate
                            }];
                            setHscRoutine(added);
                            localStorage.setItem("engr_platform_routine", JSON.stringify(added));
                            showToast("রুটিন যুক্ত করা হয়েছে! লাইভ করার জন্য উপরে 'ক্লাউডে সেভ' বাটনটি চাপুন।", "success");
                            setNewRoutineItem({ subject: "", paper: "১ম পত্র", date: "", targetDateStr: "" });
                          }}
                          className="w-full py-4 bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold font-mixed text-xs rounded-xl shadow-md transition-all cursor-pointer"
                        >
                          রুটিন কার্ড যুক্ত করুন
                        </button>
                      </div>

                      {/* Routine listing rendering */}
                      <div className="bg-white rounded-[2rem] border border-slate-200 p-6 md:p-8 space-y-4">
                        <h4 className="text-sm font-black text-black uppercase font-mixed">বর্তমান বিষয়ভিত্তিক রুটিনসমূহ ({toBanglaNumber(hscRoutine.length)} টি)</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-extrabold uppercase font-mixed">
                                <th className="p-4 rounded-l-xl">বিষয়</th>
                                <th className="p-4">পত্র</th>
                                <th className="p-4">তারিখ</th>
                                <th className="p-4">লব্ধ কাউন্টডাউন অবজেক্ট</th>
                                <th className="p-4 text-center rounded-r-xl">অ্যাকশন</th>
                              </tr>
                            </thead>
                            <tbody>
                              {hscRoutine.map((item, idx) => (
                                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                                  <td className="p-4 font-bold text-slate-900">{item.subject}</td>
                                  <td className="p-4 font-bold text-indigo-700">{item.paper}</td>
                                  <td className="p-4 font-semibold text-slate-600">{item.date}</td>
                                  <td className="p-4 text-slate-400 text-[10px] font-mono leading-none">
                                    {item.targetDate ? item.targetDate.toString() : "No target timer"}
                                  </td>
                                  <td className="p-4 text-center">
                                    <button
                                      onClick={() => {
                                        if (window.confirm(`আপনি কি সত্যিই ${item.subject} এর এই পরীক্ষার পরীক্ষার রুটিন ছকটি বাদ দিতে চান?`)) {
                                          const filtered = hscRoutine.filter((_, i) => i !== idx);
                                          setHscRoutine(filtered);
                                          localStorage.setItem("engr_platform_routine", JSON.stringify(filtered));
                                          showToast("রুটিন ছক বাদ দেওয়া হয়েছে!", "info");
                                        }
                                      }}
                                      className="p-2 bg-red-50 text-red-650 hover:bg-red-100 rounded-xl transition-colors cursor-pointer inline-flex items-center"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: PDF SUGGESTIONS DATABASE */}
                  {adminTab === "suggestions" && (
                    <div className="space-y-8 animate-tab-content">
                      <div className="bg-white rounded-[2rem] p-6 md:p-10 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="space-y-1 text-center md:text-left">
                          <h3 className="text-xl md:text-2xl font-extrabold font-mixed text-black flex items-center gap-2.5 justify-center md:justify-start">
                            <FileDown className="w-6 h-6 text-indigo-650" />
                            সাজেশন পিডিএফ পোর্টাল পরিচালনা
                          </h3>
                          <p className="text-slate-500 text-xs md:text-sm font-mixed font-semibold leading-relaxed">
                            যেকোনো অধ্যায়ের অত্যন্ত গুরুত্বপূর্ণ বিষয়বস্তু (Topics), সিকিউ ও এমসিকিউ টার্গেট সংখ্যা এবং গুগল ড্রাইভের পিডিএফ লিংক এখান থেকে সরাসরি এডিট করুন।
                          </p>
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              await saveSuggestionsToFirestore(suggestionData);
                              localStorage.setItem("engr_platform_suggestions", JSON.stringify(suggestionData));
                              showToast("সাজেশন ড্রাইভ লিংক ও টপিক ডেটাবেজ ক্লাউডে সংরক্ষিত হয়েছে!", "success");
                            } catch (err) {
                              showToast("ক্লাউডে সাজেশন আপডেট করা সম্ভব হয়নি।", "warning");
                            }
                          }}
                          className="bg-black text-white hover:bg-slate-800 font-extrabold font-mixed text-xs px-6 py-4 rounded-2xl flex items-center gap-2.5 shadow-md cursor-pointer shrink-0"
                        >
                          <Database className="w-4 h-4 text-emerald-400" />
                          পিডিএফ ডেটা ক্লাউডে সেভ করুন
                        </button>
                      </div>

                      {/* Selector controls */}
                      <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                          <label className="text-xs font-black uppercase tracking-wider text-slate-500">১. বিষয় নির্বাচন করুন</label>
                          <select
                            value={editingSuggSubject}
                            onChange={(e) => setEditingSuggSubject(e.target.value)}
                            className="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl font-mixed text-sm text-black font-extrabold cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-300"
                          >
                            <option value="physics">পদার্থবিজ্ঞান</option>
                            <option value="chemistry">রসায়ন</option>
                            <option value="math">উচ্চতর গণিত</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-black uppercase tracking-wider text-slate-500">২. পত্র নির্বাচন করুন</label>
                          <select
                            value={editingSuggPaper}
                            onChange={(e) => setEditingSuggPaper(e.target.value as any)}
                            className="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl font-mixed text-sm text-black font-extrabold cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-300"
                          >
                            <option value="1st">১ম পত্র</option>
                            <option value="2nd">২য় পত্র</option>
                          </select>
                        </div>
                      </div>

                      {/* Chapters suggestions editor */}
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-black text-slate-800 uppercase font-mixed">
                            ফিল্টারকৃত অধ্যায়সমূহ ({suggestionData[editingSuggSubject]?.[editingSuggPaper]?.length || "০"} টি)
                          </h4>
                          <button
                            onClick={() => {
                              const existingArr = suggestionData[editingSuggSubject]?.[editingSuggPaper] || [];
                              const newId = `chapter_${Date.now()}`;
                              const updatedChapter = {
                                id: newId,
                                name: "নতুন অধ্যায়",
                                boardUrl: "https://drive.google.com/file/d/1vA5Wwsc7OaLd1O9UvFv59m13jS9mI8vE/preview",
                                admissionUrl: "https://drive.google.com/file/d/1vA5Wwsc7OaLd1O9UvFv59m13jS9mI8vE/preview",
                                impTopics: ["টপিক ১", "টপিক ২"],
                                cqCount: "১০টি",
                                mcqCount: "৮০টি"
                              };
                              const copy = { ...suggestionData };
                              if (!copy[editingSuggSubject]) copy[editingSuggSubject] = {};
                              copy[editingSuggSubject][editingSuggPaper] = [...existingArr, updatedChapter];
                              setSuggestionData(copy);
                              localStorage.setItem("engr_platform_suggestions", JSON.stringify(copy));
                              showToast("একটি নতুন অধ্যায় রুট অবজেক্ট সংযুক্ত করা হয়েছে! নিচে স্ক্রোল করে এডিট করুন।", "success");
                            }}
                            className="bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer"
                          >
                            নতুন অধ্যায় সংযোজন
                          </button>
                        </div>

                        <div className="space-y-6">
                          {(suggestionData[editingSuggSubject]?.[editingSuggPaper] || []).map((ch: any, rawIdx: number) => (
                            <div key={ch.id} className="bg-white rounded-[2rem] border border-slate-200.5 p-6 md:p-8 space-y-6 shadow-sm relative">
                              <button
                                onClick={() => {
                                  if (window.confirm(`আপনি কি নিশ্চিতভাবে "${ch.name}" অধ্যায়টি সাজেশন তালিকা থেকে বাদ দিতে চান?`)) {
                                    const copy = { ...suggestionData };
                                    copy[editingSuggSubject][editingSuggPaper] = copy[editingSuggSubject][editingSuggPaper].filter((item: any) => item.id !== ch.id);
                                    setSuggestionData(copy);
                                    localStorage.setItem("engr_platform_suggestions", JSON.stringify(copy));
                                    showToast("অধ্যায়টি তালিকা থেকে রিমুভ করা হয়েছে!", "info");
                                  }
                                }}
                                className="absolute top-6 right-6 p-2 bg-red-50 text-red-650 hover:bg-red-100 rounded-xl transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>

                              <h5 className="font-extrabold text-indigo-750 text-sm font-mixed">
                                অধ্যায় নং {toBanglaNumber(rawIdx + 1)} : {ch.name} (ID: {ch.id})
                              </h5>

                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="space-y-1.5">
                                  <label className="text-[11px] font-bold text-slate-400 uppercase">অধ্যায়ের নাম (বাংলা)</label>
                                  <input
                                    type="text"
                                    value={ch.name}
                                    onChange={(e) => {
                                      const copy = { ...suggestionData };
                                      copy[editingSuggSubject][editingSuggPaper][rawIdx].name = e.target.value;
                                      setSuggestionData(copy);
                                    }}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none"
                                  />
                                </div>

                                <div className="space-y-1.5">
                                  <label className="text-[11px] font-bold text-slate-400 uppercase">CQ সাজেশন সংখ্যা</label>
                                  <input
                                    type="text"
                                    value={ch.cqCount}
                                    onChange={(e) => {
                                      const copy = { ...suggestionData };
                                      copy[editingSuggSubject][editingSuggPaper][rawIdx].cqCount = e.target.value;
                                      setSuggestionData(copy);
                                    }}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none"
                                    placeholder="গড় যেমন: ১৫টি"
                                  />
                                </div>

                                <div className="space-y-1.5">
                                  <label className="text-[11px] font-bold text-slate-400 uppercase">MCQ সাজেশন সংখ্যা</label>
                                  <input
                                    type="text"
                                    value={ch.mcqCount}
                                    onChange={(e) => {
                                      const copy = { ...suggestionData };
                                      copy[editingSuggSubject][editingSuggPaper][rawIdx].mcqCount = e.target.value;
                                      setSuggestionData(copy);
                                    }}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none"
                                    placeholder="গড় যেমন: ১০০টি"
                                  />
                                </div>

                                <div className="space-y-1.5 md:col-span-2">
                                  <label className="text-[11px] font-bold text-slate-400 uppercase">বোর্ড পরীক্ষার পিডিএফ ড্রাইভ লিংক / আইফ্রেম ভিউ লিংক</label>
                                  <input
                                    type="text"
                                    value={ch.boardUrl}
                                    onChange={(e) => {
                                      const copy = { ...suggestionData };
                                      copy[editingSuggSubject][editingSuggPaper][rawIdx].boardUrl = e.target.value;
                                      setSuggestionData(copy);
                                    }}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-mono leading-none text-blue-600 focus:bg-white focus:outline-none"
                                  />
                                </div>

                                <div className="space-y-1.5">
                                  <label className="text-[11px] font-bold text-slate-400 uppercase">এডমিশন ভিউ পিডিএফ ড্রাইভ লিংক</label>
                                  <input
                                    type="text"
                                    value={ch.admissionUrl}
                                    onChange={(e) => {
                                      const copy = { ...suggestionData };
                                      copy[editingSuggSubject][editingSuggPaper][rawIdx].admissionUrl = e.target.value;
                                      setSuggestionData(copy);
                                    }}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-mono leading-none text-purple-600 focus:bg-white focus:outline-none"
                                  />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <label className="block text-[11px] font-bold text-slate-400 uppercase">অবশ্যই পঠিতব্য গুরুত্বপূর্ণ টপিকসমূহ (Comma separated)</label>
                                <input
                                  type="text"
                                  value={(ch.impTopics || []).join(", ")}
                                  onChange={(e) => {
                                    const parsed = e.target.value.split(",").map(v => v.trim()).filter(Boolean);
                                    const copy = { ...suggestionData };
                                    copy[editingSuggSubject][editingSuggPaper][rawIdx].impTopics = parsed;
                                    setSuggestionData(copy);
                                  }}
                                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none"
                                  placeholder="যেমন: নদী-নৌকা প্রজেক্টাইল, আপেক্ষিক বেগ সূত্রাবলি"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 5: FREE EXAMS & POLL PRACTICE DATABASE */}
                  {adminTab === "exams_mcqs" && (
                    <div className="space-y-8 animate-tab-content">
                      <div className="bg-white rounded-[2rem] p-6 md:p-10 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="space-y-1 text-center md:text-left">
                          <h3 className="text-xl md:text-2xl font-extrabold font-mixed text-black flex items-center gap-2.5 justify-center md:justify-start">
                            <FileText className="w-6 h-6 text-indigo-650" />
                            ফ্রী মডেল টেস্ট ও লাইভ পোল MCQ ডাটাবেজ
                          </h3>
                          <p className="text-slate-500 text-xs md:text-sm font-mixed font-semibold leading-relaxed">
                            অ্যাপের পোল প্র্যাকটিস মেগা ডাটাবেজে নতুন প্রশ্ন যুক্ত করুন, বিদ্যমান প্রশ্ন এডিট করুন এবং ফ্রী কুইজ এক্সামসমূহ কাস্টমাইজ করুন।
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <button
                            onClick={async () => {
                              try {
                                await saveMcqDbToFirestore(mcqDatabase);
                                await saveFreeExamsToFirestore(freeExams);
                                localStorage.setItem("engr_platform_mcqs", JSON.stringify(mcqDatabase));
                                localStorage.setItem("engr_platform_free_exams", JSON.stringify(freeExams));
                                showToast("এমসিকিউ ডাটাবেজ ও মডেল টেস্ট সফলভাবে ক্লাউডে সিঙ্ক করা হয়েছে!", "success");
                              } catch (err) {
                                showToast("ক্লাউড সিঙ্ক্রোনাইজেশনে ত্রুটি পাওয়া গিয়েছে।", "warning");
                              }
                            }}
                            className="bg-black text-white hover:bg-slate-800 font-extrabold font-mixed text-xs px-6 py-4 rounded-2xl flex items-center gap-2.5 shadow-md cursor-pointer shrink-0"
                          >
                            <Database className="w-4 h-4 text-emerald-400" />
                            এমসিকিউ ও টেস্ট ক্লাউডে সেভ করুন
                          </button>
                        </div>
                      </div>

                      {/* PART A: FREE EXAMINATIONS LIST */}
                      <div className="bg-white rounded-[2rem] border border-slate-200 p-6 md:p-8 space-y-6 shadow-sm">
                        <div className="border-b border-slate-100 pb-4">
                          <h4 className="text-base font-black text-black uppercase font-mixed">১. লাইভ মডেল টেস্টসমূহ (Free Exams List)</h4>
                          <p className="text-xs text-slate-400 font-semibold mt-0.5 font-mixed">হোমপেইজে বাটন ক্লিক করলে ইউজাররা যে মডেল টেস্ট দেখতে পাবেন।</p>
                        </div>

                        {/* Adder free exam */}
                        <div className="bg-slate-50 p-6 rounded-2xl space-y-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 border border-slate-150">
                          <div className="space-y-1 md:col-span-2">
                            <label className="text-[11px] font-bold text-slate-500">মডেল টেস্টের শিরোনাম</label>
                            <input
                              type="text"
                              value={newFreeExam.title}
                              onChange={(e) => setNewFreeExam({...newFreeExam, title: e.target.value})}
                              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                              placeholder="যেমন: রসায়ন ১ম পত্র - পর্যায়বৃত্ত ধর্ম মেগা ম্যারাথন টেস্ট"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-500">বিষয়</label>
                            <select
                              value={newFreeExam.subject}
                              onChange={(e) => setNewFreeExam({...newFreeExam, subject: e.target.value})}
                              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                            >
                              <option value="physics">পদার্থবিজ্ঞান</option>
                              <option value="chemistry">রসায়ন</option>
                              <option value="math">উচ্চতর গণিত</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-500">পত্র</label>
                            <select
                              value={newFreeExam.paper}
                              onChange={(e) => setNewFreeExam({...newFreeExam, paper: e.target.value})}
                              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                            >
                              <option value="1st">১ম পত্র</option>
                              <option value="2nd">২য় পত্র</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-500">অধ্যায় টোকেন</label>
                            <input
                              type="text"
                              value={newFreeExam.chapter}
                              onChange={(e) => setNewFreeExam({...newFreeExam, chapter: e.target.value})}
                              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                              placeholder="যেমন: vector বা qualitative"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-500">প্রশ্নসংখ্যা</label>
                            <input
                              type="number"
                              value={newFreeExam.questionsCount}
                              onChange={(e) => setNewFreeExam({...newFreeExam, questionsCount: parseInt(e.target.value) || 5})}
                              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-500">পরীক্ষার সময়সীমা (মিনিট)</label>
                            <input
                              type="number"
                              value={newFreeExam.timeMins}
                              onChange={(e) => setNewFreeExam({...newFreeExam, timeMins: parseInt(e.target.value) || 10})}
                              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                            />
                          </div>

                          <div className="space-y-1 flex items-end">
                            <button
                              onClick={() => {
                                if (!newFreeExam.title) {
                                  showToast("দয়া করে মডেল টেস্টের নাম লিখুন।", "warning");
                                  return;
                                }
                                const added = [...freeExams, { ...newFreeExam, id: Date.now() }];
                                setFreeExams(added);
                                localStorage.setItem("engr_platform_free_exams", JSON.stringify(added));
                                showToast("মডেল টেস্ট যোগ করা হয়েছে! লাইভ করতে ক্লাউডে সেভ করুন।", "success");
                                setNewFreeExam({ title: "", subject: "physics", paper: "1st", chapter: "vector", questionsCount: 5, timeMins: 10, status: "Active" });
                              }}
                              className="w-full py-3 bg-indigo-600 text-white font-extrabold text-xs rounded-xl"
                            >
                              টেস্ট যুক্ত করুন
                            </button>
                          </div>
                        </div>

                        {/* List exams table */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-slate-200 bg-slate-50 font-black">
                                <th className="p-4 rounded-l-xl">পরীক্ষার শিরোনাম</th>
                                <th className="p-4">বিষয়ভিত্তিক কোড</th>
                                <th className="p-4">সময়</th>
                                <th className="p-4 text-center">কোশ্চেন সোর্স (CSV আপলোড)</th>
                                <th className="p-4">টোটাল প্রশ্ন</th>
                                <th className="p-4 text-center rounded-r-xl">অ্যাকশন</th>
                              </tr>
                            </thead>
                            <tbody>
                              {freeExams.map((test, index) => (
                                <tr key={test.id} className="border-b border-slate-100 font-mixed hover:bg-slate-50">
                                  <td className="p-4 font-bold text-black">{test.title}</td>
                                  <td className="p-4 uppercase font-mono text-indigo-750 text-xs">{test.subject} - {test.paper} - {test.chapter}</td>
                                  <td className="p-4 font-bold">{toBanglaNumber(test.timeMins)} মিনিট</td>
                                  <td className="p-4">
                                    <div className="flex flex-col gap-1.5 w-52 font-mixed mx-auto">
                                      {test.questions && test.questions.length > 0 ? (
                                        <div className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg font-black flex items-center justify-center gap-1 text-center">
                                          <span>✅ {toBanglaNumber(test.questions.length)} টি স্পেশাল প্রশ্ন আপলোডকৃত</span>
                                        </div>
                                      ) : (
                                        <div className="text-[10px] text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded-lg font-semibold flex items-center justify-center gap-1 text-center">
                                          <span>⚙️ গ্লোবাল ডাটাবেজ ফলব্যাক সোর্স</span>
                                        </div>
                                      )}
                                      <label className="text-[10px] text-white bg-indigo-650 hover:bg-indigo-700 px-2.5 py-1.5 rounded-xl cursor-pointer text-center font-black transition-colors block shadow-xs select-none">
                                        📁 CSV ফাইল আপলোড করুন
                                        <input
                                          type="file"
                                          accept=".csv"
                                          className="hidden"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            const reader = new FileReader();
                                            reader.onload = (event) => {
                                              const text = event.target?.result as string;
                                              if (text) {
                                                handleCsvUploadForExam(test.id, text);
                                              }
                                            };
                                            reader.readAsText(file);
                                          }}
                                        />
                                      </label>
                                      {test.questions && test.questions.length > 0 && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (window.confirm("আপনি কি আপলোড করা কাস্টম প্রশ্নগুলো মুছে ক্লাউড ডাটাবেজ ফলব্যাকে ফেরত যেতে চান?")) {
                                              const updated = freeExams.map((item: any) => {
                                                if (item.id === test.id) {
                                                   const { questions, ...rest } = item;
                                                   return { ...rest, questionsCount: 5 };
                                                }
                                                return item;
                                              });
                                              setFreeExams(updated);
                                              localStorage.setItem("engr_platform_free_exams", JSON.stringify(updated));
                                              showToast("কাস্টম প্রশ্নগুলো সরিয়ে ফলব্যাকে রিসেট করা হয়েছে।", "success");
                                            }
                                          }}
                                          className="text-[9px] text-red-500 hover:text-red-700 font-bold underline text-center"
                                        >
                                          ✕ কাস্টম প্রশ্ন সরিয়ে ফেলুন
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                  <td className="p-4 font-bold text-emerald-700">{toBanglaNumber(test.questionsCount)} টি</td>
                                  <td className="p-4 text-center">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (window.confirm("আপনি কি নিশ্চিতভাবে এই মডেল টেস্টটি বাঞ্চাল করতে চান?")) {
                                          const filtered = freeExams.filter(item => item.id !== test.id);
                                          setFreeExams(filtered);
                                          localStorage.setItem("engr_platform_free_exams", JSON.stringify(filtered));
                                          showToast("মডেল টেস্ট রিমুভ করা হয়েছে!", "info");
                                        }
                                      }}
                                      className="p-2 bg-red-50 text-red-650 rounded-xl hover:bg-red-100 cursor-pointer"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* PART B: CORE MCQ EXAM DATABASE */}
                      <div className="bg-white rounded-[2rem] border border-slate-200 p-6 md:p-8 space-y-6 shadow-sm">
                        <div className="border-b border-slate-100 pb-4">
                          <h4 className="text-base font-black text-black uppercase font-mixed">২. কুইজ ও পোল প্রশ্ন ডাটাবেজ (MCQ Question Bank)</h4>
                          <p className="text-xs text-slate-400 font-semibold mt-0.5 font-mixed font-bold">নিচের ফিল্টারের সাহায্যে সূক্ষ্ম অধ্যায়ের কুইজ সেটআপ করুন এবং রিয়েলটাইমে প্রশ্ন যুক্ত করুন।</p>
                        </div>

                        {/* Interactive Dropdown filters */}
                        <div className="bg-slate-50 p-6 rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border border-slate-150">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">১. বিষয়</label>
                            <select
                              value={editingMcqSubject}
                              onChange={(e) => setEditingMcqSubject(e.target.value)}
                              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                            >
                              <option value="physics">পদার্থবিজ্ঞান</option>
                              <option value="chemistry">রসায়ন</option>
                              <option value="math">উচ্চতর গণিত</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">২. পত্র</label>
                            <select
                              value={editingMcqPaper}
                              onChange={(e) => setEditingMcqPaper(e.target.value as any)}
                              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                            >
                              <option value="1st">১ম পত্র</option>
                              <option value="2nd">২য় পত্র</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">৩. অধ্যায় কোড</label>
                            <select
                              value={editingMcqChapter}
                              onChange={(e) => setEditingMcqChapter(e.target.value)}
                              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                            >
                              {editingMcqSubject === "physics" && editingMcqPaper === "1st" && (
                                <>
                                  <option value="vector">ভেক্টর</option>
                                  <option value="dynamics">গতিবিদ্যা</option>
                                  <option value="newtonian">নিউটনিয়ান বলবিদ্যা</option>
                                </>
                              )}
                              {editingMcqSubject === "physics" && editingMcqPaper === "2nd" && (
                                <>
                                  <option value="thermo">তাপগতিবিদ্যা</option>
                                  <option value="current">চল তড়িৎ</option>
                                </>
                              )}
                              {editingMcqSubject === "chemistry" && editingMcqPaper === "1st" && (
                                <>
                                  <option value="qualitative">গুণগত রসায়ন</option>
                                  <option value="periodic">পর্যায়বৃত্ত ধর্ম</option>
                                </>
                              )}
                              {editingMcqSubject === "chemistry" && editingMcqPaper === "2nd" && (
                                <>
                                  <option value="environmental">পরিবেশ রসায়ন</option>
                                  <option value="organic">জৈব রসায়ন</option>
                                </>
                              )}
                              {editingMcqSubject === "math" && editingMcqPaper === "1st" && (
                                <>
                                  <option value="matrix">ম্যাট্রিক্স ও নির্ণায়ক</option>
                                  <option value="straight">সরলরেখা</option>
                                </>
                              )}
                              {editingMcqSubject === "math" && editingMcqPaper === "2nd" && (
                                <>
                                  <option value="complex">জটিল সংখ্যা</option>
                                  <option value="polynomial">বহুপদী ও বহুপদী সমীকরণ</option>
                                </>
                              )}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">৪. ক্যাটাগরি</label>
                            <select
                              value={editingMcqCategory}
                              onChange={(e) => setEditingMcqCategory(e.target.value as any)}
                              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                            >
                              <option value="board">বোর্ড প্রশ্ন (Board Standard)</option>
                              <option value="admission">ভর্তি পরীক্ষা (Admission Standard)</option>
                            </select>
                          </div>
                        </div>

                        {/* MCQ Adder Form */}
                        <div className="bg-slate-50 rounded-2xl border border-slate-150 p-6 space-y-4">
                          <h5 className="font-extrabold text-xs text-black uppercase tracking-wider">
                            ✨ নির্বাচিত বিভাগে নতুন MCQ কুইজ যুক্ত করুন:
                          </h5>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400">{"প্রশ্ন (Supports LaTeX Math Jax যেমন: $\\cos \\theta_x = \\frac{1}{\\sqrt{3}}$)"}</label>
                            <input
                              type="text"
                              value={newMcq.question}
                              onChange={(e) => setNewMcq({...newMcq, question: e.target.value})}
                              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              placeholder="যেমন: দুটি সমান মানের ভেক্টরের লব্ধির মান কত?"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {newMcq.options.map((opt, oIdx) => (
                              <div key={oIdx} className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400">অপশন {toBanglaNumber(oIdx + 1)}</label>
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) => {
                                    const opts = [...newMcq.options];
                                    opts[oIdx] = e.target.value;
                                    setNewMcq({...newMcq, options: opts});
                                  }}
                                  className="w-full px-4 py-2 px-3 bg-white border border-slate-100 rounded-xl text-xs font-semibold"
                                  placeholder={`অপশন ${oIdx + 1}`}
                                />
                              </div>
                            ))}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 mb-1">সঠিক অপশন ইনডেক্স</label>
                              <select
                                value={newMcq.correctIdx}
                                onChange={(e) => setNewMcq({...newMcq, correctIdx: parseInt(e.target.value)})}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                              >
                                <option value={0}>অপশন ১</option>
                                <option value={1}>অপশন ২</option>
                                <option value={2}>অপশন ৩</option>
                                <option value={3}>অপশন ৪</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 mb-1">সমাধান ও সঠিক ব্যাখ্যা</label>
                              <input
                                type="text"
                                value={newMcq.explanation}
                                onChange={(e) => setNewMcq({...newMcq, explanation: e.target.value})}
                                className="w-full px-4 py-2.5 bg-white border border-slate-100 rounded-xl text-xs font-semibold"
                                placeholder="ধরি, P = Q = R..."
                              />
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              if (!newMcq.question || !newMcq.options[0]) {
                                showToast("দয়া করে প্রশ্ন ও অপশন টাইপ করুন।", "warning");
                                return;
                              }
                              // Add to existing mcqDatabase structure
                              const updatedDb = { ...mcqDatabase };
                              if (!updatedDb[editingMcqSubject]) updatedDb[editingMcqSubject] = {};
                              if (!updatedDb[editingMcqSubject][editingMcqPaper]) updatedDb[editingMcqSubject][editingMcqPaper] = {};
                              if (!updatedDb[editingMcqSubject][editingMcqPaper][editingMcqChapter]) updatedDb[editingMcqSubject][editingMcqPaper][editingMcqChapter] = {};
                              
                              const currentArray = updatedDb[editingMcqSubject]?.[editingMcqPaper]?.[editingMcqChapter]?.[editingMcqCategory] || [];
                              const updatedArray = [...currentArray, { ...newMcq }];
                              
                              // Write nested
                              updatedDb[editingMcqSubject][editingMcqPaper][editingMcqChapter][editingMcqCategory] = updatedArray;
                              
                              setMcqDatabase(updatedDb);
                              localStorage.setItem("engr_platform_mcqs", JSON.stringify(updatedDb));
                              showToast(" MCQ প্রশ্ন সফলভাবে তালিকায় যুক্ত করা হয়েছে! গ্লোবাল ইউজারদের ফোনে সেভ করতে ক্লাউডে পরিবর্তন সিঙ্ক করুন।", "success");
                              
                              // Reset question input
                              setNewMcq({
                                question: "",
                                options: ["", "", "", ""],
                                correctIdx: 0,
                                explanation: ""
                              });
                            }}
                            className="w-full py-3 bg-slate-900 border border-slate-950 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer"
                          >
                            এআই-সাপোর্টেড ডেটাবেজে MCQ যুক্ত করুন
                          </button>
                        </div>

                        {/* List Question items under selection */}
                        <div className="space-y-4">
                          <h5 className="font-extrabold text-xs text-black uppercase tracking-wider">
                            📋 নির্বাচিত অধ্যায়ের এমসিকিউ তালিকা ({toBanglaNumber((mcqDatabase[editingMcqSubject]?.[editingMcqPaper]?.[editingMcqChapter]?.[editingMcqCategory] || []).length)} টি প্রশ্ন)
                          </h5>

                          <div className="space-y-4">
                            {(mcqDatabase[editingMcqSubject]?.[editingMcqPaper]?.[editingMcqChapter]?.[editingMcqCategory] || []).map((q: any, idx: number) => (
                              <div key={idx} className="bg-slate-50/50 rounded-2xl border border-slate-200/60 p-5.5 space-y-4 relative">
                                <button
                                  onClick={() => {
                                    if (window.confirm("আপনি কি নিশ্চিতভাবে এই প্রশ্নটি ডিলিট করতে চান?")) {
                                      const updatedDb = { ...mcqDatabase };
                                      const array = updatedDb[editingMcqSubject][editingMcqPaper][editingMcqChapter][editingMcqCategory];
                                      const filtered = array.filter((_: any, i: number) => i !== idx);
                                      updatedDb[editingMcqSubject][editingMcqPaper][editingMcqChapter][editingMcqCategory] = filtered;
                                      
                                      setMcqDatabase(updatedDb);
                                      localStorage.setItem("engr_platform_mcqs", JSON.stringify(updatedDb));
                                      showToast("প্রশ্নটি বাতিল কুইজ তালিকা থেকে মুছে দেয়া হয়েছে!", "info");
                                    }
                                  }}
                                  className="absolute top-4 right-4 p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>

                                <div className="space-y-3 pr-10">
                                  <h6 className="font-bold text-black font-mixed text-xs.5 flex items-start gap-2">
                                    <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[9px] font-black shrink-0 mt-0.5">প্রশ্ন {toBanglaNumber(idx + 1)}</span>
                                    <input
                                      type="text"
                                      value={q.question}
                                      onChange={(e) => {
                                        const updatedDb = { ...mcqDatabase };
                                        updatedDb[editingMcqSubject][editingMcqPaper][editingMcqChapter][editingMcqCategory][idx].question = e.target.value;
                                        setMcqDatabase(updatedDb);
                                      }}
                                      className="flex-1 bg-transparent focus:bg-white text-xs font-semibold leading-relaxed border-0 focus:border px-1.5 rounded"
                                    />
                                  </h6>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-4">
                                    {q.options.map((opt: string, optIndex: number) => (
                                      <div key={optIndex} className="flex items-center gap-2">
                                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                                          q.correctIdx === optIndex ? "bg-emerald-100 text-emerald-800 border border-emerald-300" : "bg-slate-200 text-slate-600"
                                        }`}>
                                          {toBanglaNumber(optIndex + 1)}
                                        </span>
                                        <input
                                          type="text"
                                          value={opt}
                                          onChange={(e) => {
                                            const updatedDb = { ...mcqDatabase };
                                            updatedDb[editingMcqSubject][editingMcqPaper][editingMcqChapter][editingMcqCategory][idx].options[optIndex] = e.target.value;
                                            setMcqDatabase(updatedDb);
                                          }}
                                          className="flex-1 bg-transparent text-slate-700 text-xs font-semibold focus:bg-white px-2 py-1 rounded border-0 focus:border"
                                        />
                                      </div>
                                    ))}
                                  </div>

                                  <div className="bg-slate-100/70 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center gap-3 text-xs text-slate-500 font-bold">
                                    <span className="text-[10px] text-slate-400 font-black uppercase shrink-0">ব্যাখ্যা:</span>
                                    <input
                                      type="text"
                                      value={q.explanation}
                                      onChange={(e) => {
                                        const updatedDb = { ...mcqDatabase };
                                        updatedDb[editingMcqSubject][editingMcqPaper][editingMcqChapter][editingMcqCategory][idx].explanation = e.target.value;
                                        setMcqDatabase(updatedDb);
                                      }}
                                      className="flex-1 bg-transparent px-2 py-1 font-semibold focus:bg-white text-[11px]  border-0 focus:border rounded"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 6: SUBJECT REVIEWS */}
                  {adminTab === "reviews" && (
                    <div className="space-y-8 animate-tab-content">
                      <div className="bg-white rounded-[2rem] p-6 md:p-10 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="space-y-1 text-center md:text-left">
                          <h3 className="text-xl md:text-2xl font-extrabold font-mixed text-black flex items-center gap-2.5 justify-center md:justify-start">
                            <Star className="w-6 h-6 text-indigo-650 animate-pulse" />
                            নিখুঁত সাবজেক্ট রিভিউ এডিট পোর্টাল
                          </h3>
                          <p className="text-slate-500 text-xs md:text-sm font-mixed font-semibold leading-relaxed">
                            এইচএসসি পরীক্ষার্থীদের বেস্ট সাজেকশন ও স্ট্রাটেজি নিয়ে সাবজেক্ট রিভিউ পৃষ্ঠা এডিট করুন।
                          </p>
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              await saveReviewsToFirestore(subjectReviews);
                              localStorage.setItem("engr_platform_subject_reviews", JSON.stringify(subjectReviews));
                              showToast("সাবজেক্ট রিভিউর পরিবর্তন সফলভাবে রিয়েল-টাইম ক্লাউড সিস্টেমে সেভ হয়েছে!", "success");
                            } catch (err) {
                              showToast("ক্লাউড ডাটাবেজে ডাটা সংরক্ষণ করতে ব্যর্থ হয়েছে।", "warning");
                            }
                          }}
                          className="bg-black text-white hover:bg-slate-800 font-extrabold font-mixed text-xs px-6 py-4 rounded-2xl flex items-center gap-2.5 shadow-md cursor-pointer shrink-0"
                        >
                          <Database className="w-4 h-4 text-emerald-400" />
                          রিভিউ ক্লাউডে সেভ করুন
                        </button>
                      </div>

                      {/* Review Adder Form */}
                      <div className="bg-slate-50 rounded-[2rem] border border-slate-200 p-6 md:p-8 space-y-6">
                        <h4 className="text-base font-extrabold text-black font-mixed flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-indigo-650" />
                          নতুন কাস্টম সাবজেক্ট রিভিউ সংযুক্ত করুন:
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="space-y-1.5 col-span-2">
                            <label className="text-xs font-bold text-slate-500">রিভিউ বিষয় ও অধ্যায় সমূহ</label>
                            <input
                              type="text"
                              value={newReview.subject}
                              onChange={(e) => setNewReview({...newReview, subject: e.target.value})}
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-300"
                              placeholder="যেমন: রসায়ন ১ম পত্র (পর্যায়বৃত্ত ধর্ম + সংকরায়ণ)"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500">কাঠিন্যের মাত্রা</label>
                            <select
                              value={newReview.difficulty}
                              onChange={(e) => setNewReview({...newReview, difficulty: e.target.value})}
                              className="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                            >
                              <option value="সহজ">সহজ (Easy)</option>
                              <option value="সহজ-মধ্যম">সহজ-মধ্যম</option>
                              <option value="মধ্যম">মধ্যম (Medium)</option>
                              <option value="মধ্যম-কঠিন">মধ্যম-কঠিন</option>
                              <option value="কঠিন">কঠিন (Hard)</option>
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500">রেটিং (১-৫ তারা)</label>
                            <input
                              type="number"
                              min={1}
                              max={5}
                              value={newReview.rating}
                              onChange={(e) => setNewReview({...newReview, rating: parseInt(e.target.value) || 5})}
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500">পঠিতব্য সর্বোত্তম সহায়ক বইসমূহ</label>
                            <input
                              type="text"
                              value={newReview.bestBooks}
                              onChange={(e) => setNewReview({...newReview, bestBooks: e.target.value})}
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                              placeholder="যেমন: তপন স্যার, ইসহাক স্যার ও হাজারী স্যার টেক্সটবুক"
                            />
                          </div>
                          
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500">মূল রিভিউ পরামর্শ ও বিশ্লেষণ কন্টেন্ট</label>
                            <textarea
                              value={newReview.content}
                              onChange={(e) => setNewReview({...newReview, content: e.target.value})}
                              rows={4}
                              className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none font-mixed"
                              placeholder="এই বিষয় বা অধ্যায় নিয়ে আপনার মূল্যবান ছাত্রোপযোগী স্ট্রাটেজি ও দিকনির্দেশনা লিখুন..."
                            />
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            if (!newReview.subject || !newReview.content) {
                              showToast("দয়া করে বিষয়ের নাম এবং রিভিউ টেক্সট প্রদান করুন।", "warning");
                              return;
                            }
                            const added = [...subjectReviews, { ...newReview, id: Date.now() }];
                            setSubjectReviews(added);
                            localStorage.setItem("engr_platform_subject_reviews", JSON.stringify(added));
                            showToast("সাবজেক্ট রিভিউ যুক্ত হয়েছে! লাইভ করার জন্য উপরে 'ক্লাউডে সেভ' চাপুন।", "success");
                            setNewReview({ subject: "", rating: 5, difficulty: "সহজ", bestBooks: "", content: "" });
                          }}
                          className="w-full py-4 bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold font-mixed text-xs rounded-xl shadow-md transition-all cursor-pointer"
                        >
                          পরামর্শ রিভিউ তালিকায় যোগ করুন
                        </button>
                      </div>

                      {/* Display table reviews */}
                      <div className="bg-white rounded-[2rem] border border-slate-200 p-6 md:p-8 space-y-4">
                        <h4 className="text-sm font-black text-black uppercase font-mixed">চলমান সাবজেক্ট রিভিউজ ({toBanglaNumber(subjectReviews.length)} টি)</h4>
                        <div className="space-y-4">
                          {subjectReviews.map((rev, index) => (
                            <div key={rev.id} className="bg-slate-50 p-6 rounded-2xl border border-slate-150 space-y-3 relative font-mixed">
                              <button
                                onClick={() => {
                                  if (window.confirm("আপনি কি নিশ্চিতভাবে এই মেন্টর রিভিউটি ডিলিট করতে চান?")) {
                                    const filtered = subjectReviews.filter(item => item.id !== rev.id);
                                    setSubjectReviews(filtered);
                                    localStorage.setItem("engr_platform_subject_reviews", JSON.stringify(filtered));
                                    showToast("রিভিউটি বাদ দেওয়া হয়েছে!", "info");
                                  }
                                }}
                                className="absolute top-4 right-4 p-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-xl"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                              <h5 className="font-extrabold text-black text-sm pr-10">{rev.subject}</h5>
                              <p className="text-slate-400 text-xs font-bold">প্রস্তাবিত বই: {rev.bestBooks} | কাঠিন্য: <span className="text-red-650 font-black">{rev.difficulty}</span></p>
                              <p className="text-slate-700 text-xs leading-relaxed font-semibold pr-4 font-normal whitespace-pre-line">{rev.content}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* ================= FOOTER ================= */}
      {view !== "login" && (
        <footer
          id="main-footer"
          className="bg-black text-white pt-12 pb-8 border-t border-slate-900 mt-16"
        >
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
              
              <div className="space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-white p-1 rounded-xl">
                    <img
                      src="https://raw.githubusercontent.com/shuyaib105/square/refs/heads/main/1536-removebg-preview.png"
                      alt="Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="text-lg font-black tracking-tight font-mixed">
                    Engr. Platform
                  </span>
                </div>
                <p className="text-slate-450 font-mixed text-xs leading-relaxed italic border-l-2 border-slate-700 pl-3 leading-loose">
                  "শুধু পড়াশোনা নয়, তৈরি করো নিজেকে যুগের সাথে তাল মিলিয়ে। ইঞ্জিনিয়ারিং প্রস্তুতি এবার বাড়ির কাছে।"
                </p>
              </div>

              <div>
                <h4 className="font-mixed text-xs font-black mb-4 text-slate-300 uppercase tracking-widest">
                  সহায়ক রিসোর্স
                </h4>
                <ul className="space-y-3 text-slate-400 font-mixed text-xs font-semibold">
                  <li>
                    <button
                      onClick={() => setView("pdf-suggestions")}
                      className="hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                    >
                      <FileDown className="w-3.5 h-3.5 text-red-500" /> সাজেশন পিডিএফ পোর্টাল
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setView("calendar-timeline")}
                      className="hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                    >
                      <Calendar className="w-3.5 h-3.5 text-indigo-500" /> এইচএসসি ২০২৬ পরীক্ষার দিনপঞ্জি
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setView("poll-practice")}
                      className="hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-blue-500" /> লাইভ পোল ও এমসিকিউ কুইজ
                    </button>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-mixed text-xs font-black mb-4 text-slate-300 uppercase tracking-widest">
                  যোগাযোগ ও সোশ্যাল মিডিয়া
                </h4>
                <ul className="space-y-3 text-slate-400 font-mixed text-xs font-semibold">
                  <li>
                    <a
                      href="https://t.me/shu_yaib"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white flex items-center gap-2.5 transition-colors group cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5 text-sky-400" /> টেলিগ্রাম গ্রুপে যুক্ত হোন
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-white flex items-center gap-2.5 transition-colors group cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5 text-blue-500" /> ফেসবুক সাপোর্ট কমিউনিটি
                    </a>
                  </li>
                </ul>
              </div>

            </div>
            
            <div className="pt-8 border-t border-slate-950 text-center text-slate-650 text-xs font-mixed">
              © {new Date().getFullYear()} Engr. Platform. All rights reserved. Developed with absolute craft & precision.
            </div>
          </div>
        </footer>
      )}

      {/* ================= TOAST NOTIFICATION CONTAINER ================= */}
      {toast?.show && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 border bg-slate-900 border-slate-800 text-white min-w-[280px] max-w-sm animate-tab-content">
          {toast.type === "success" && (
            <div className="bg-emerald-500/20 p-1.5 rounded-full shrink-0">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            </div>
          )}
          {toast.type === "info" && (
            <div className="bg-blue-500/20 p-1.5 rounded-full shrink-0">
              <Sparkles className="w-4 h-4 text-blue-400" />
            </div>
          )}
          {toast.type === "warning" && (
            <div className="bg-yellow-500/20 p-1.5 rounded-full shrink-0">
              <AlertCircle className="w-4 h-4 text-yellow-500" />
            </div>
          )}
          <div className="flex-1">
            <p className="font-mixed text-xs font-extrabold leading-relaxed text-slate-100">
              {toast.message}
            </p>
          </div>
          <button
            onClick={() => setToast((prev) => (prev ? { ...prev, show: false } : null))}
            className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

    </div>
  );
}
