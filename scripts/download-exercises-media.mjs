import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';

const ROOT_DIR = path.resolve(process.cwd());
const PUBLIC_MEDIA_DIR = path.join(ROOT_DIR, 'apps/web/public/exercise-media/bstrainer');
const MIGRATION_FILE = path.join(ROOT_DIR, 'supabase/migrations/20260715170000_import_hasaneyldrm_exercises.sql');
const DATASET_URL = 'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/master/data/exercises.json';
const BASE_MEDIA_URL = 'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/master/';

const CONCURRENCY_LIMIT = 5;

async function fetchExercises() {
  console.log('Fetching exercises.json from GitHub...');
  const response = await fetch(DATASET_URL);
  if (!response.ok) throw new Error(`Failed to fetch dataset: ${response.statusText}`);
  return response.json();
}

async function downloadFile(url, destPath) {
  if (fsSync.existsSync(destPath)) {
    // Skip if already exists and size > 0
    const stats = await fs.stat(destPath);
    if (stats.size > 0) return true;
  }
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Failed to download ${url}: ${response.statusText}`);
      return false;
    }
    
    // We'll write directly using pipeline to a temp file, then rename to avoid corrupted partial downloads
    const tempPath = destPath + '.tmp';
    const fileStream = fsSync.createWriteStream(tempPath);
    
    if (response.body.pipe) {
      await pipeline(response.body, fileStream);
      await fs.rename(tempPath, destPath);
    } else {
      fileStream.close(); // Close the unused stream since we'll use writeFile
      await fs.unlink(tempPath).catch(() => {});
      const buffer = await response.arrayBuffer();
      await fs.writeFile(destPath, Buffer.from(buffer));
    }
    
    return true;
  } catch (error) {
    console.error(`Error downloading ${url}:`, error.message);
    return false;
  }
}

async function main() {
  await fs.mkdir(PUBLIC_MEDIA_DIR, { recursive: true });
  
  const exercises = await fetchExercises();
  console.log(`Found ${exercises.length} exercises. Starting download...`);
  
  let downloadedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  
  // Create a queue for concurrency control
  const queue = exercises.map(ex => async () => {
    // Determine the media URL to download
    const mediaPath = ex.gif_url || ex.image;
    if (!mediaPath) {
      console.log(`Exercise ${ex.id} has no media. Skipping.`);
      skippedCount++;
      return;
    }
    
    const url = BASE_MEDIA_URL + mediaPath;
    const extension = path.extname(mediaPath) || '.gif';
    const filename = `${ex.id}${extension}`; // eg: 0001.gif
    const destPath = path.join(PUBLIC_MEDIA_DIR, filename);
    
    const success = await downloadFile(url, destPath);
    if (success) {
      downloadedCount++;
      if (downloadedCount % 50 === 0) {
        console.log(`Progress: Downloaded ${downloadedCount}/${exercises.length} files...`);
      }
    } else {
      errorCount++;
    }
  });
  
  // Execute queue with concurrency limit
  for (let i = 0; i < queue.length; i += CONCURRENCY_LIMIT) {
    const chunk = queue.slice(i, i + CONCURRENCY_LIMIT);
    await Promise.all(chunk.map(fn => fn()));
  }
  
  console.log(`\nDownload completed!`);
  console.log(`Downloaded: ${downloadedCount}`);
  console.log(`Skipped: ${skippedCount}`);
  console.log(`Errors: ${errorCount}`);
  
  // Now, update the migration file
  console.log('\nUpdating SQL migration file...');
  let sqlContent = await fs.readFile(MIGRATION_FILE, 'utf8');
  
  // Replace: null, 'hasaneyldrm', '0001'
  // With: '/exercise-media/bstrainer/0001.gif', 'hasaneyldrm', '0001'
  // Note: the SQL currently has `, null, 'hasaneyldrm', 'ID')`
  const regex = /(null)(\s*,\s*'hasaneyldrm'\s*,\s*'(\d+)')/g;
  const replacedContent = sqlContent.replace(regex, (match, p1, p2, id) => {
    return `'/exercise-media/bstrainer/${id}.gif'${p2}`;
  });
  
  await fs.writeFile(MIGRATION_FILE, replacedContent, 'utf8');
  console.log('Migration file updated successfully!');
}

main().catch(console.error);
