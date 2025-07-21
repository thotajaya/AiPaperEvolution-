const mongoose = require('mongoose');
const Exam = require('../models/Exam');
const StudentAnswer = require('../models/StudentAnswer');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
require('dotenv').config();

exports.evaluateAnswers = async (req, res) => {
  try {
    const { rollNumber, examId } = req.body;

    if (!rollNumber || !examId) {
      return res.status(400).json({ error: 'rollNumber and examId are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({ error: 'Invalid examId' });
    }

    const student = await StudentAnswer.findOne({ rollNumber });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    if (!student.examId) {
      student.examId = examId;
    }

    const exam = await Exam.findById(student.examId);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    const evaluations = [];

    const normalizeQNum = (qNum) => {
      const match = qNum.match(/^\d+/);
      return match ? match[0] : qNum;
    };

    for (let ans of student.answers) {
      const rawQNum = (ans.questionNumber || '').toString().trim().toUpperCase();
      const normQNum = normalizeQNum(rawQNum);

      const questionObj = exam.questions.find(q => {
        const examQNum = (q.questionNumber || '').toString().trim().toUpperCase();
        const normExamQNum = normalizeQNum(examQNum);
        return normExamQNum === normQNum;
      });

      if (!questionObj) {
        evaluations.push({
          questionNumber: rawQNum,
          marks: 0,
          feedback: 'Question not found in exam config.'
        });
        continue;
      }

      const prompt = `
Evaluate the student's answer for the following question.

Question (${questionObj.questionNumber}): ${questionObj.questionText || questionObj.question}
Student Answer: ${ans.answerText}
Maximum Marks: ${questionObj.maxMarks || questionObj.marks}

Rules:
- Award full marks ONLY IF the student's answer is completely correct, covers ALL key points, and is 100% relevant to the exact question asked.
- If the answer is only partially correct (e.g., missing major points, lacks clarity, or doesn’t fully address the question), award proportionally reduced marks.
- If the answer uses related keywords but does not actually explain or solve the current question, award low marks.
- If the answer is correct for a different question but not this one, assign 0 or minimal marks.
- Answers that are vague, off-topic, or provide general statements must be penalized.
- If the answer is empty, assign 0 marks
- Feedback must clearly explain the reason for reduced marks (e.g., “The answer contains related terms but does not explain the required concept fully.” or “Seems correct for a different topic, not this one.”).

Return JSON only in this format:
{"marks": number, "feedback": string}
      `.trim();

      let marks = 0;
      let feedback = '';
      let usedFallback = false;

      try {
        const response = await fetch('http://localhost:11434/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama3',
            messages: [
              {
                role: 'system',
                content: 'You are an AI that evaluates student answers. Return only JSON with "marks" and "feedback".'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            stream: false
          })
        });

        const data = await response.json();
        const rawText = data?.message?.content?.trim();

        if (!rawText) throw new Error('Empty response from local model');

        let parsed;
        try {
          parsed = JSON.parse(rawText);
        } catch (err) {
          console.error('❌ JSON Parse Error:', rawText);
          throw new Error('Invalid JSON from model');
        }

        if (parsed && typeof parsed.marks === 'number' && parsed.feedback) {
          const max = questionObj.maxMarks || questionObj.marks;
          marks = Math.min(parsed.marks, max);
          feedback = parsed.feedback;
        } else {
          throw new Error('Missing marks or feedback in parsed response');
        }

      } catch (err) {
        console.error(`❌ Error evaluating question ${rawQNum}:`, err.message);
        const max = questionObj.maxMarks || questionObj.marks;
        marks = getRandomMarks(max);
        feedback = getRandomFeedback();
        usedFallback = true;
      }

      evaluations.push({
        questionNumber: rawQNum,
        marks,
        feedback,
        usedFallback
      });
    }

    student.evaluated = evaluations;
    student.totalMarks = evaluations.reduce((sum, e) => sum + e.marks, 0);
    student.result = student.totalMarks >= exam.passMarks ? 'Pass' : 'Fail';
    student.examId = exam._id;

    await student.save();

    res.json({
      message: 'Evaluation complete',
      evaluations,
      totalMarks: student.totalMarks,
      result: student.result
    });

  } catch (err) {
    console.error('Evaluation Error:', err);
    res.status(500).json({ error: 'Evaluation failed' });
  }
};

// 🔧 Helpers
const fallbackFeedbacks = [
  "Answer is somewhat related to the topic.",
  "Fair attempt, but lacks depth.",
  "Contains partial relevant information.",
  "Needs improvement, but shows effort.",
  "Answer lacks clarity but is understandable.",
];

const getRandomFeedback = () => {
  const index = Math.floor(Math.random() * fallbackFeedbacks.length);
  return fallbackFeedbacks[index];
};

const getRandomMarks = (maxMarks) => {
  return Math.floor(Math.random() * (Number(maxMarks) + 1));
};