import React, { useState } from "react";
import Papa from "papaparse";
import { Upload } from "lucide-react";
import { saveQuizQuestionsToFirestore } from "../firebase";

export function QuizUploader() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setMessage("Processing...");

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        let questions: any[] = [];
        if (file.type === "application/json") {
            questions = JSON.parse(e.target?.result as string);
        } else {
            const results = Papa.parse(e.target?.result as string, { header: true });
            questions = results.data;
        }

        await saveQuizQuestionsToFirestore(questions);
        setMessage("Questions uploaded successfully!");
      } catch (error) {
        setMessage("Error processing file: " + (error as Error).message);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Upload Questions</h2>
      <div className="flex items-center gap-4">
        <label className="cursor-pointer flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          <Upload className="w-5 h-5" />
          <span>Upload CSV/JSON</span>
          <input type="file" accept=".csv, .json" className="hidden" onChange={handleFileUpload} />
        </label>
        {loading && <span>Uploading...</span>}
        {message && <span className="text-sm font-medium">{message}</span>}
      </div>
      <p className="mt-2 text-xs text-gray-500">Format: chapter, standard, question, options (comma separated), correctAnswer (index)</p>
    </div>
  );
}
