const { initializeOracle, closeOracle } = require('../src/config/oracle');
const authService = require('../src/services/authService');

async function main() {
  await initializeOracle();
  const testEmail = `test_register_${Date.now()}@example.com`;
  console.log(`Starting test with email: ${testEmail}`);

  try {
    // 1. Send code
    console.log('Sending verification code...');
    const sendResult = await authService.sendVerificationCode(testEmail);
    console.log('Send Code Result:', sendResult);

    // Get code from verificationCodes memory cache
    const verificationCodes = require('../src/services/authService').verificationCodes;
    // Wait, verificationCodes is not exported directly, but let's check if we can get it or if we can mock it
  } catch (error) {
    console.error('Error in sendVerificationCode:', error);
  }

  try {
    // Let's manually insert the code to verification cache in authService to test register
    // Wait, since we require('authService'), we don't have direct access to its local variable `verificationCodes` unless it's exported or we simulate it.
    // Wait, is verificationCodes exported or can we inspect it?
    // In authService.js, line 12: `const verificationCodes = new Map();` it is NOT exported.
    // But we can test authService.register directly by mocking or calling sendVerificationCode first.
    // Wait! Let's find out how we can access it or if we can modify the code to check what happens.
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await closeOracle();
  }
}

main();
