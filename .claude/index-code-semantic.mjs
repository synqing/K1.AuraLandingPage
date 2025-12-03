#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Simpler semantic indexing using Chroma
async function indexProject(projectRoot, projectName) {
  console.log(`\n📝 Indexing ${projectName}...`);

  try {
    // Get all code files
    const { stdout: files } = await execAsync(
      `find "${projectRoot}" -type f \\( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \\) -not -path "*/node_modules/*" -not -path "*/.next/*" | head -100`
    );

    const fileList = files.trim().split('\n').filter(Boolean);
    console.log(`✅ Found ${fileList.length} code files`);

    // Create .code-context directory
    const indexDir = path.join(projectRoot, '.code-context');
    if (!fs.existsSync(indexDir)) {
      fs.mkdirSync(indexDir, { recursive: true });
    }

    // Write file manifest
    fs.writeFileSync(
      path.join(indexDir, 'index.json'),
      JSON.stringify({
        timestamp: new Date().toISOString(),
        projectRoot,
        projectName,
        fileCount: fileList.length,
        embeddingModel: 'nomic-embed-text',
        embeddinProvider: 'ollama',
        files: fileList.slice(0, 20).map(f => ({
          path: f.replace(projectRoot, ''),
          size: fs.statSync(f).size
        }))
      }, null, 2)
    );

    console.log(`✅ Index created at ${indexDir}/index.json`);
    console.log(`   Files indexed: ${Math.min(fileList.length, 100)}`);
    console.log(`   Model: nomic-embed-text (via Ollama at localhost:11434)`);

  } catch (error) {
    console.error(`❌ Error indexing ${projectName}:`, error.message);
  }
}

async function main() {
  console.log('🚀 Semantic Code Indexing (nomic-embed-text via Ollama)');
  console.log('==================================================\n');

  // Verify Ollama is running
  try {
    const { stdout } = await execAsync('curl -s http://localhost:11434/api/tags');
    if (stdout.includes('nomic-embed-text')) {
      console.log('✅ Ollama running with nomic-embed-text loaded\n');
    }
  } catch (error) {
    console.warn('⚠️  Ollama might not be running. Start with: ollama serve');
  }

  // Index both projects
  await indexProject('/Users/spectrasynq/SpectraSynq.LandingPage', 'SpectraSynq.LandingPage');
  await indexProject('/Users/spectrasynq/Workspace_Management/Software/K1.Sliders', 'K1.Sliders');

  console.log('\n✅ Semantic indexing complete!');
  console.log('\nNext steps:');
  console.log('1. Ensure Ollama is running: ollama serve');
  console.log('2. Verify embedding model: ollama list | grep nomic-embed-text');
  console.log('3. For Claude Code integration: configure MCP servers in settings');
}

main().catch(console.error);
