const quizService = require('../services/quizService');

async function startQuiz(req, res, next) {
  try {
    const result = await quizService.startQuiz(req.user.email);
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
}

async function answerQuestion(req, res, next) {
  try {
    const { sessionId, questionId, answer } = req.body;

    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ message: 'O campo "sessionId" e obrigatorio.' });
    }

    if (!questionId || typeof questionId !== 'string') {
      return res.status(400).json({ message: 'O campo "questionId" e obrigatorio.' });
    }

    if (!answer || typeof answer !== 'string' || answer.trim().length === 0) {
      return res.status(400).json({ message: 'O campo "answer" e obrigatorio e deve ser texto.' });
    }

    const result = await quizService.answerQuestion(req.user.email, {
      sessionId,
      questionId,
      answer,
    });

    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

async function regenerateQuestion(req, res, next) {
  try {
    const { sessionId } = req.body;

    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ message: 'O campo "sessionId" e obrigatorio.' });
    }

    const result = await quizService.regenerateCurrentQuestion(req.user.email, sessionId);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

async function finishQuiz(req, res, next) {
  try {
    const { sessionId, savePreferences } = req.body;

    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ message: 'O campo "sessionId" e obrigatorio.' });
    }

    const result = await quizService.finishQuiz(req.user.email, {
      sessionId,
      savePreferences: Boolean(savePreferences),
    });

    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  answerQuestion,
  finishQuiz,
  regenerateQuestion,
  startQuiz,
};
