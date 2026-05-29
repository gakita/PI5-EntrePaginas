const { execSync } = require('child_process');

try {
  const output = execSync('wmic process where "name=\'node.exe\'" get ProcessID, CommandLine').toString();
  console.log(output);
} catch (error) {
  console.error('Error running wmic:', error.message);
}
