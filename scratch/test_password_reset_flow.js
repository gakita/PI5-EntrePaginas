const { initializeOracle, closeOracle } = require('../src/config/oracle');
const authService = require('../src/services/authService');
const userModel = require('../src/models/userModel');
const passwordResetTokenModel = require('../src/models/passwordResetTokenModel');
const bcrypt = require('bcrypt');

async function main() {
  await initializeOracle();
  const testEmail = `test_reset_${Date.now()}@example.com`;
  const originalPassword = 'password123';
  const newPassword = 'newPassword456';
  const name = 'Reset Test User';

  console.log(`Starting Password Reset verification test for: ${testEmail}`);

  try {
    // 1. Create a temporary user to test with
    console.log('1. Creating temporary test user...');
    const passwordHash = await bcrypt.hash(originalPassword, 10);
    const user = await userModel.createUser({
      name,
      email: testEmail,
      passwordHash,
    });
    console.log('Test user created:', user.email);

    // 2. Request password reset
    console.log('2. Requesting password reset (generating token)...');
    const resetRequestResult = await authService.requestPasswordReset(testEmail);
    console.log('Reset Request Result:', resetRequestResult);

    if (!resetRequestResult.resetToken) {
      throw new Error('No reset token returned in development mode!');
    }

    const token = resetRequestResult.resetToken;
    console.log(`Reset Token: ${token}`);

    // 3. Reset password using the token
    console.log('3. Redefining password using token...');
    const resetResult = await authService.resetPassword(token, newPassword);
    console.log('Reset Password Result (User Object):', resetResult);

    // 4. Verify password change by attempting login
    console.log('4. Verifying new password via login...');
    const loginResult = await authService.login(testEmail, newPassword);
    if (loginResult) {
      console.log('✓ Login with new password succeeded!');
    } else {
      throw new Error('Login with new password failed!');
    }

    // 5. Verify old password no longer works
    console.log('5. Verifying old password no longer works...');
    const oldLoginResult = await authService.login(testEmail, originalPassword);
    if (!oldLoginResult) {
      console.log('✓ Old password rejected successfully!');
    } else {
      throw new Error('Old password still works! Redefinition failed.');
    }

    console.log('\n🎉 PASSWORD RESET FLOW IS WORKING 100% CORRECTLY!');

  } catch (error) {
    console.error('❌ Verification failed with error:', error);
  } finally {
    // Cleanup temporary user
    try {
      console.log('Cleaning up temporary test user and tokens...');
      await userModel.deleteUserByEmail(testEmail);
      await passwordResetTokenModel.deleteByEmail(testEmail);
      console.log('Cleanup completed successfully.');
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError);
    }
    await closeOracle();
  }
}

main();
