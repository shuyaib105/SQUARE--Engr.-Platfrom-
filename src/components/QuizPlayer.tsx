import React, { useState, useEffect } from "react";
import { loadQuizQuestionsFromFirestore } from "../firebase";
import { Award, RefreshCw } from "lucide-react";

export function QuizPlayer() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    loadQuizQuestionsFromFirestore().then(setQuestions);
  }, []);

  const handleAnswer = (index: number) => {
    if (index === parseInt(questions[currentIndex].correctAnswer)) {
      setScore(score + 1);
    }
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShowResult(true);
    }
  };

  if (showResult) return (
    <div className="p-8 text-center bg-white rounded-2xl shadow-lg border">
      <Award className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
      <h2 className="text-2xl font-bold">Quiz Finished!</h2>
      <p className="text-lg mt-2">Your Score: {score} / {questions.length}</p>
      <button onClick={() => window.location.reload()} className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg">Restart</button>
    </div>
  );

  if (questions.length === 0) return <div>Loading...</div>;

  const currentQ = questions[currentIndex];
  const options = Array.isArray(currentQ.options) ? currentQ.options : JSON.parse(currentQ.options);

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-lg font-medium text-gray-700 mb-4">{currentQ.question}</h2>
      <div className="space-y-3">
        {options.map((opt: string, idx: number) => (
          <button key={idx} onClick={() => handleAnswer(idx)} className="w-full text-left p-3 border rounded-lg hover:bg-blue-50">
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
