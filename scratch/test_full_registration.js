const { initializeOracle, closeOracle } = require('../src/config/oracle');
const authService = require('../src/services/authService');

async function main() {
  await initializeOracle();
  const testEmail = `test_reg_${Date.now()}@example.com`;
  const password = 'password123';
  const name = 'Test User';
  console.log(`Starting full registration test with email: ${testEmail}`);

  try {
    // 1. Send code
    console.log('1. Sending verification code...');
    await authService.sendVerificationCode(testEmail);

    // Get code from verificationCodes Map (if we export it)
    const codeEntry = authService.verificationCodes.get(testEmail);
    if (!codeEntry) {
      throw new Error('Verification entry not found in memory!');
    }
    const code = codeEntry.code;
    console.log(`Retrieved code: ${code}`);

    // 2. Verify code
    console.log('2. Verifying code...');
    const verifyResult = await authService.verifyCode(testEmail, code);
    console.log('Verify Result:', verifyResult);

    // 3. Register
    console.log('3. Registering user...');
    const registerResult = await authService.register(name, testEmail, password);
    console.log('Register Result:', registerResult);

  } catch (error) {
    console.error('Error during registration flow:', error);
  } finally {
    // Clean up
    try {
      const userModel = require('../src/models/userModel');
      console.log('Cleaning up user...');
      const deleted = await userModel.deleteUserByEmail(testEmail);
      console.log('Cleanup result:', deleted);
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError);
    }
    await closeOracle();
  }
}

main();
