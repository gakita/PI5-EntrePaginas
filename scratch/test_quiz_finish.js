const quizService = require('../src/services/quizService');
const { initializeOracle, closeOracle } = require('../src/config/oracle');

async function testQuizFinish() {
  try {
    // We need a real user email from the database
    const userEmail = 'tester@example.com';
    
    console.log('Testing quiz start...');
    await initializeOracle();
    const startResult = await quizService.startQuiz(userEmail);
    const sessionId = startResult.sessionId;
    console.log('Session ID:', sessionId);

    console.log('Answering 3 questions...');
    await quizService.answerQuestion(userEmail, { sessionId, questionId: 'preferred_type', answer: 'Livro' });
    await quizService.answerQuestion(userEmail, { sessionId, questionId: 'reading_mood', answer: 'Emocionante' });
    await quizService.answerQuestion(userEmail, { sessionId, questionId: 'favorite_theme', answer: 'Fantasia' });

    console.log('Finishing quiz...');
    const result = await quizService.finishQuiz(userEmail, { sessionId, savePreferences: true });
    
    console.log('Quiz finished successfully!');
    console.log('Message:', result.message);
    console.log('Recommendations count:', result.recommendations.length);
    console.log('Recommendations:', JSON.stringify(result.recommendations, null, 2));

  } catch (error) {
    console.error('Test failed:', error.message);
    if (error.stack) console.error(error.stack);
  } finally {
    await closeOracle();
  }
}

testQuizFinish();
