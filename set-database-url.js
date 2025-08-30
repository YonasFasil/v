const { exec } = require('child_process');

const databaseUrl = 'postgresql://postgres:ZxOp1029%21%21%25%25@db.yoqtmnlxdqtqnnkzvajb.supabase.co:5432/postgres';

exec(`vercel env add DATABASE_URL production`, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error}`);
    return;
  }
  console.log(`stdout: ${stdout}`);
  console.log(`stderr: ${stderr}`);
});

// Write the database URL to stdin
process.stdout.write(databaseUrl + '\n');