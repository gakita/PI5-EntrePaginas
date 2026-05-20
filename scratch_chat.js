const { spawn } = require('child_process');
const chat = spawn('node', ['scripts/chat.js', '--email=admin@example.com', '--password=123456']);

chat.stdout.on('data', (data) => {
  console.log(data.toString());
  if (data.toString().includes('Você:')) {
    chat.stdin.write('/sair\n');
  }
});

chat.stderr.on('data', (data) => {
  console.error('stderr:', data.toString());
});

chat.on('close', (code) => {
  console.log(`child process exited with code ${code}`);
});
