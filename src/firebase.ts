import { initializeApp } from "firebase/app";
import { initializeFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, listAll } from "firebase/storage";
import fbConfig from "../firebase-applet-config.json";
import { QuickFeature } from "./types";

// Initialize Firebase
export const firebaseApp = initializeApp(fbConfig);
export const firestore = initializeFirestore(firebaseApp, {
  experimentalForceLongPolling: true,
});
export const storage = getStorage(firebaseApp);

export const DEFAULT_QUICK_FEATURES: QuickFeature[] = [
  {
    id: "poll",
    title: "লাইভ পোল ও পরীক্ষা",
    iconName: "BarChart3",
    actionType: "view",
    actionValue: "poll-practice",
    isActive: true,
    colorTheme: "blue",
  },
  {
    id: "courses",
    title: "আমাদের স্পেশাল কোর্স",
    iconName: "BookOpen",
    actionType: "scroll",
    actionValue: "courses-section",
    isActive: true,
    colorTheme: "slate",
  },
  {
    id: "exam",
    title: "বোর্ড ও ফ্রী এক্সাম",
    iconName: "FileText",
    actionType: "view",
    actionValue: "free-exams",
    isActive: true,
    colorTheme: "purple",
  },
  {
    id: "review",
    title: "নিখুঁত সাবজেক্ট রিভিউ",
    iconName: "Star",
    actionType: "toast",
    actionValue: "সাবজেক্ট রিভিউ ফিচারটি ডেভলপমেন্ট প্রক্রিয়ায় রয়েছে!",
    isActive: true,
    colorTheme: "orange",
  },
  {
    id: "suggestion",
    title: "সাজেশন পিডিএফ পোর্টাল",
    iconName: "FileDown",
    actionType: "view",
    actionValue: "pdf-suggestions",
    isActive: true,
    colorTheme: "red",
  },
  {
    id: "calendar",
    title: "পরীক্ষার ক্যালেন্ডার",
    iconName: "Calendar",
    actionType: "view",
    actionValue: "calendar-timeline",
    isActive: true,
    colorTheme: "indigo",
  },
  {
    id: "quiz-uploader",
    title: "নতুন কুইজ আপলোড",
    iconName: "Upload",
    actionType: "view",
    actionValue: "quiz-uploader",
    isActive: true,
    colorTheme: "emerald",
    adminOnly: true,
  },
];


/**
 * Storage Helpers
 */

// Upload PDF suggestions to Firebase Storage
export async function uploadPdfToFirebase(
  file: File,
  subject: string,
  paper: string,
  chapterId: string,
  standard: "board" | "admission"
): Promise<string> {
  const fileExt = file.name.split(".").pop();
  if (fileExt?.toLowerCase() !== "pdf") {
    throw new Error("Only PDF files are supported for suggestion uploads.");
  }

  // Create highly structured folder hierarchy matching the subject, paper, and chapter
  const storagePath = `suggestions/${subject}/${paper}/${chapterId}_${standard}_${Date.now()}.pdf`;
  const storageRef = ref(storage, storagePath);

  // Upload the file
  await uploadBytes(storageRef, file, {
    contentType: "application/pdf",
  });

  // Get download URL
  const downloadUrl = await getDownloadURL(storageRef);
  return downloadUrl;
}

/**
 * Firestore Helpers for suggestion database persistence
 */

const SUGGESTIONS_DOC_ID = "suggestions_db";
const COLLECTION_NAME = "app_data";

export async function saveSuggestionsToFirestore(data: any): Promise<void> {
  try {
    // Cache locally first for high responsiveness and offline support
    localStorage.setItem("firestore_suggestions_cache", JSON.stringify(data));
    const docRef = doc(firestore, COLLECTION_NAME, SUGGESTIONS_DOC_ID);
    await setDoc(docRef, { data, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.warn("Soft warning: Firestore save fell back to local cache:", error);
  }
}

export async function loadSuggestionsFromFirestore(): Promise<any | null> {
  try {
    const docRef = doc(firestore, COLLECTION_NAME, SUGGESTIONS_DOC_ID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const cloudData = docSnap.data().data;
      if (cloudData) {
        localStorage.setItem("firestore_suggestions_cache", JSON.stringify(cloudData));
        return cloudData;
      }
    }
  } catch (error) {
    console.warn("Offline or failed connection: Loading from local suggestions cache.", error);
  }

  // Attempt to restore from persistent cache
  try {
    const cached = localStorage.getItem("firestore_suggestions_cache");
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {
    // Suppress caching parsing errors
  }
  return null;
}

// ---------------- COURSES PERSISTENCE ----------------
const COURSES_DOC_ID = "courses_db";

export async function saveCoursesToFirestore(data: any[]): Promise<void> {
  try {
    localStorage.setItem("engr_platform_courses_cache", JSON.stringify(data));
    const docRef = doc(firestore, COLLECTION_NAME, COURSES_DOC_ID);
    await setDoc(docRef, { data, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.warn("Firestore courses save fallback:", error);
  }
}

export async function loadCoursesFromFirestore(): Promise<any[] | null> {
  try {
    const docRef = doc(firestore, COLLECTION_NAME, COURSES_DOC_ID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const cloudData = docSnap.data().data;
      if (cloudData && Array.isArray(cloudData)) {
        localStorage.setItem("engr_platform_courses_cache", JSON.stringify(cloudData));
        return cloudData;
      }
    }
  } catch (error) {
    console.warn("Firestore load courses failed:", error);
  }
  try {
    const cached = localStorage.getItem("engr_platform_courses_cache");
    if (cached) return JSON.parse(cached);
  } catch (e) {}
  return null;
}

// ---------------- EXAM ROUTINE PERSISTENCE ----------------
const ROUTINE_DOC_ID = "routine_db";

export async function saveRoutineToFirestore(data: any[]): Promise<void> {
  try {
    localStorage.setItem("engr_platform_routine_cache", JSON.stringify(data));
    const docRef = doc(firestore, COLLECTION_NAME, ROUTINE_DOC_ID);
    await setDoc(docRef, { data, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.warn("Firestore routine save fallback:", error);
  }
}

export async function loadRoutineFromFirestore(): Promise<any[] | null> {
  try {
    const docRef = doc(firestore, COLLECTION_NAME, ROUTINE_DOC_ID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const cloudData = docSnap.data().data;
      if (cloudData && Array.isArray(cloudData)) {
        localStorage.setItem("engr_platform_routine_cache", JSON.stringify(cloudData));
        return cloudData;
      }
    }
  } catch (error) {
    console.warn("Firestore load routine failed:", error);
  }
  try {
    const cached = localStorage.getItem("engr_platform_routine_cache");
    if (cached) return JSON.parse(cached);
  } catch (e) {}
  return null;
}

// ---------------- MCQ DATABASE PERSISTENCE ----------------
const MCQ_DOC_ID = "mcqs_db";

export async function saveMcqDbToFirestore(data: any): Promise<void> {
  try {
    localStorage.setItem("engr_platform_mcqs_cache", JSON.stringify(data));
    const docRef = doc(firestore, COLLECTION_NAME, MCQ_DOC_ID);
    await setDoc(docRef, { data, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.warn("Firestore mcqs save fallback:", error);
  }
}

export async function loadMcqDbFromFirestore(): Promise<any | null> {
  try {
    const docRef = doc(firestore, COLLECTION_NAME, MCQ_DOC_ID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const cloudData = docSnap.data().data;
      if (cloudData) {
        localStorage.setItem("engr_platform_mcqs_cache", JSON.stringify(cloudData));
        return cloudData;
      }
    }
  } catch (error) {
    console.warn("Firestore load mcqs failed:", error);
  }
  try {
    const cached = localStorage.getItem("engr_platform_mcqs_cache");
    if (cached) return JSON.parse(cached);
  } catch (e) {}
  return null;
}

// ---------------- FREE EXAMS PERSISTENCE ----------------
const FREE_EXAMS_DOC_ID = "free_exams_db";

export async function saveFreeExamsToFirestore(data: any[]): Promise<void> {
  try {
    localStorage.setItem("engr_platform_free_exams_cache", JSON.stringify(data));
    const docRef = doc(firestore, COLLECTION_NAME, FREE_EXAMS_DOC_ID);
    await setDoc(docRef, { data, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.warn("Firestore free exams save fallback:", error);
  }
}

export async function loadFreeExamsFromFirestore(): Promise<any[] | null> {
  try {
    const docRef = doc(firestore, COLLECTION_NAME, FREE_EXAMS_DOC_ID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const cloudData = docSnap.data().data;
      if (cloudData && Array.isArray(cloudData)) {
        localStorage.setItem("engr_platform_free_exams_cache", JSON.stringify(cloudData));
        return cloudData;
      }
    }
  } catch (error) {
    console.warn("Firestore load free exams failed:", error);
  }
  try {
    const cached = localStorage.getItem("engr_platform_free_exams_cache");
    if (cached) return JSON.parse(cached);
  } catch (e) {}
  return null;
}

// ---------------- QUIZ DATABASE PERSISTENCE ----------------
const QUIZ_DOC_ID = "quiz_db";

export async function saveQuizQuestionsToFirestore(data: any[]): Promise<void> {
  try {
    localStorage.setItem("engr_platform_quiz_cache", JSON.stringify(data));
    const docRef = doc(firestore, COLLECTION_NAME, QUIZ_DOC_ID);
    await setDoc(docRef, { data, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.warn("Firestore quiz save fallback:", error);
  }
}

export async function loadQuizQuestionsFromFirestore(): Promise<any[]> {
  try {
    const docRef = doc(firestore, COLLECTION_NAME, QUIZ_DOC_ID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const cloudData = docSnap.data().data;
      if (cloudData && Array.isArray(cloudData)) {
        localStorage.setItem("engr_platform_quiz_cache", JSON.stringify(cloudData));
        return cloudData;
      }
    }
  } catch (error) {
    console.warn("Firestore load quiz failed:", error);
  }
  try {
    const cached = localStorage.getItem("engr_platform_quiz_cache");
    if (cached) return JSON.parse(cached);
  } catch (e) {}
  return [];
}

// ---------------- SUBJECT REVIEWS PERSISTENCE ----------------
const REVIEWS_DOC_ID = "reviews_db";

export async function saveReviewsToFirestore(data: any[]): Promise<void> {
  try {
    localStorage.setItem("engr_platform_reviews_cache", JSON.stringify(data));
    const docRef = doc(firestore, COLLECTION_NAME, REVIEWS_DOC_ID);
    await setDoc(docRef, { data, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.warn("Firestore reviews save fallback:", error);
  }
}

export async function loadReviewsFromFirestore(): Promise<any[] | null> {
  try {
    const docRef = doc(firestore, COLLECTION_NAME, REVIEWS_DOC_ID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const cloudData = docSnap.data().data;
      if (cloudData && Array.isArray(cloudData)) {
        localStorage.setItem("engr_platform_reviews_cache", JSON.stringify(cloudData));
        return cloudData;
      }
    }
  } catch (error) {
    console.warn("Firestore load reviews failed:", error);
  }
  try {
    const cached = localStorage.getItem("engr_platform_reviews_cache");
    if (cached) return JSON.parse(cached);
  } catch (e) {}
  return null;
}


const QUICK_FEATURES_DOC_ID = "quick_features_db";

export async function saveQuickFeaturesToFirestore(data: QuickFeature[]): Promise<void> {
  try {
    localStorage.setItem("firestore_features_cache", JSON.stringify(data));
    const docRef = doc(firestore, COLLECTION_NAME, QUICK_FEATURES_DOC_ID);
    await setDoc(docRef, { data, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.warn("Soft warning: Firestore features save fell back to local cache:", error);
  }
}

export async function loadQuickFeaturesFromFirestore(): Promise<QuickFeature[]> {
  try {
    const docRef = doc(firestore, COLLECTION_NAME, QUICK_FEATURES_DOC_ID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const cloudData = docSnap.data().data;
      if (cloudData && Array.isArray(cloudData)) {
        localStorage.setItem("firestore_features_cache", JSON.stringify(cloudData));
        return cloudData;
      }
    }
  } catch (error) {
    console.warn("Offline or failed connection: Loading features from cache.", error);
  }

  try {
    const cached = localStorage.getItem("firestore_features_cache");
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {
    // Suppress caching errors
  }
  return DEFAULT_QUICK_FEATURES;
}

