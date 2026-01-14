import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Unlock, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

export function ClearanceTest() {
  const { user } = useAuth();
  const [showTest, setShowTest] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  const testQuestions = [
    {
      id: 1,
      question: "What is the mark?",
      options: ["A collectible item", "A key to access", "A symbol of belonging", "All of the above"],
      correct: 3,
      hint: "Think about the manifesto..."
    },
    {
      id: 2,
      question: "How many tiers exist in the collective?",
      options: ["2", "3", "4", "5"],
      correct: 2,
      hint: "Outside, Initiate, Member, Inner Circle..."
    },
    {
      id: 3,
      question: "What happens if you don't engage?",
      options: ["Nothing", "You get banned", "You become dormant", "You get promoted"],
      correct: 2,
      hint: "Inactivity has consequences..."
    },
    {
      id: 4,
      question: "What is the primary way to earn reputation?",
      options: ["Buying marks", "Attending events", "Referring friends", "All of the above"],
      correct: 3,
      hint: "Multiple paths to rise..."
    },
    {
      id: 5,
      question: "What does stratified reality mean?",
      options: ["Different access levels", "Hidden content", "Member-only areas", "All of the above"],
      correct: 3,
      hint: "Some things are only for members..."
    }
  ];

  const handleAnswer = (questionId: number, optionIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex.toString()
    }));
  };

  const handleSubmit = () => {
    let correctCount = 0;
    testQuestions.forEach(q => {
      if (answers[q.id] && parseInt(answers[q.id]) === q.correct) {
        correctCount++;
      }
    });
    const finalScore = Math.round((correctCount / testQuestions.length) * 100);
    setScore(finalScore);
    setSubmitted(true);
  };

  const resetTest = () => {
    setAnswers({});
    setSubmitted(false);
    setScore(null);
    setShowTest(false);
  };

  const isPassed = score !== null && score >= 60;

  return (
    <section className="py-16 px-6 border-t border-[#222222]">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Lock className="w-5 h-5 text-[#9333EA]" />
            <h2 className="text-2xl font-bold text-white">Stratified Reality Test</h2>
            <Lock className="w-5 h-5 text-[#9333EA]" />
          </div>
          <p className="text-sm text-[#666666] max-w-2xl mx-auto">
            Understand the collective. Prove your knowledge. Unlock deeper access to the community.
          </p>
        </motion.div>

        {/* Test not started */}
        {!showTest && !submitted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-[#222222] rounded-lg p-8 text-center"
          >
            <div className="mb-6">
              <Eye className="w-12 h-12 text-[#9333EA] mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Ready to test your knowledge?</h3>
              <p className="text-sm text-[#666666] mb-6">
                Answer 5 questions about the collective. Score 60% or higher to unlock exclusive insights.
              </p>
            </div>
            <button
              onClick={() => setShowTest(true)}
              className="px-8 py-3 bg-[#9333EA] text-white font-mono text-sm tracking-wider rounded-lg hover:bg-[#7e22ce] transition-colors"
            >
              START TEST
            </button>
          </motion.div>
        )}

        {/* Test in progress */}
        {showTest && !submitted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {testQuestions.map((q, idx) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-[#0a0a0a] border border-[#222222] rounded-lg p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-base font-bold text-white flex-1">
                    {q.id}. {q.question}
                  </h3>
                  <span className="text-xs text-[#666666] font-mono ml-4">
                    {q.id}/{testQuestions.length}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  {q.options.map((option, optIdx) => (
                    <label
                      key={optIdx}
                      className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-[#111111] transition-colors"
                    >
                      <input
                        type="radio"
                        name={`q${q.id}`}
                        checked={answers[q.id] === optIdx.toString()}
                        onChange={() => handleAnswer(q.id, optIdx)}
                        className="w-4 h-4 accent-[#9333EA]"
                      />
                      <span className="text-sm text-[#cccccc]">{option}</span>
                    </label>
                  ))}
                </div>

                <p className="text-xs text-[#666666] italic">
                  💡 {q.hint}
                </p>
              </motion.div>
            ))}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex gap-4 justify-center pt-6"
            >
              <button
                onClick={resetTest}
                className="px-6 py-2 border border-[#444444] text-[#cccccc] font-mono text-sm rounded-lg hover:border-[#666666] transition-colors"
              >
                CANCEL
              </button>
              <button
                onClick={handleSubmit}
                disabled={Object.keys(answers).length < testQuestions.length}
                className="px-6 py-2 bg-[#9333EA] text-white font-mono text-sm rounded-lg hover:bg-[#7e22ce] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                SUBMIT ANSWERS
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* Results */}
        <AnimatePresence>
          {submitted && score !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-[#222222] rounded-lg p-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="mb-6"
              >
                {isPassed ? (
                  <CheckCircle className="w-16 h-16 text-[#22c55e] mx-auto" />
                ) : (
                  <XCircle className="w-16 h-16 text-[#ef4444] mx-auto" />
                )}
              </motion.div>

              <h3 className="text-2xl font-bold text-white mb-2">
                {isPassed ? "CLEARANCE GRANTED" : "INSUFFICIENT CLEARANCE"}
              </h3>

              <p className="text-4xl font-bold text-[#9333EA] mb-4">
                {score}%
              </p>

              <p className="text-sm text-[#666666] mb-6 max-w-2xl mx-auto">
                {isPassed
                  ? "You understand the collective. You've earned access to deeper insights and exclusive member content."
                  : "You need 60% to pass. Review the manifesto and try again to unlock member benefits."}
              </p>

              <button
                onClick={resetTest}
                className="px-8 py-3 bg-[#9333EA] text-white font-mono text-sm tracking-wider rounded-lg hover:bg-[#7e22ce] transition-colors"
              >
                {isPassed ? "CONTINUE" : "RETAKE TEST"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
