const { execSync } = require('child_process');

try {
  const output = execSync('wmic process where "name=\'node.exe\'" get ProcessID, CommandLine').toString();
  const lines = output.split('\n');
  
  let killedCount = 0;
  for (const line of lines) {
    if (!line.trim()) continue;
    
    // Parse PID and command line
    const match = line.match(/(.+?)\s+(\d+)\s*$/);
    if (match) {
      const commandLine = match[1].trim();
      const pid = parseInt(match[2].trim(), 10);
      
      // Avoid killing ourselves
      if (pid === process.pid) continue;
      
      const shouldKill = commandLine.includes('server.js') || 
                         commandLine.includes('npm-cli.js" run dev') || 
                         commandLine.includes('npm run dev');
                         
      if (shouldKill) {
        console.log(`Killing orphaned node backend process PID: ${pid} (${commandLine})`);
        try {
          execSync(`taskkill /f /pid ${pid}`);
          killedCount++;
        } catch (killError) {
          console.error(`Failed to kill PID ${pid}:`, killError.message);
        }
      }
    }
  }
  
  console.log(`Finished killing orphaned node processes. Killed: ${killedCount}`);
} catch (error) {
  console.error('Error running clean up script:', error.message);
}
