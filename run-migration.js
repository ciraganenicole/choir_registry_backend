const { exec } = require('child_process');

console.log('Running migration to fix musical_key_enum...');

exec('node_modules\\.bin\\typeorm-ts-node-commonjs migration:run -d src/data-source.ts', (error, stdout, stderr) => {
  if (error) {
    console.error('Error:', error);
    return;
  }
  if (stderr) {
    console.error('Stderr:', stderr);
  }
  console.log('Migration output:', stdout);
});


