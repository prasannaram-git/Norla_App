/**
 * Norla — Android Signing Keystore Generator
 *
 * Run this ONCE to create your release signing keystore.
 *  
 * ⚠️  IMPORTANT: Keep the generated .keystore file SAFE.
 *     If you lose it, you can NEVER update your app on Play Store.
 *     Back it up to Google Drive / USB drive.
 *
 * Prerequisites: Java/JDK must be installed (comes with Android Studio)
 *
 * Run from the nureli/ directory:
 *   node scripts/generate-keystore.js
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

const KEYSTORE_PATH = path.join(__dirname, '..', '..', 'norla-release.keystore');

function question(rl, prompt) {
  return new Promise((resolve) => rl.question(prompt, resolve));
}

async function generateKeystore() {
  console.log('');
  console.log('═══════════════════════════════════════════════');
  console.log('  Norla — Android Release Keystore Generator  ');
  console.log('═══════════════════════════════════════════════');
  console.log('');

  if (fs.existsSync(KEYSTORE_PATH)) {
    console.log('⚠️  Keystore already exists at:', KEYSTORE_PATH);
    console.log('   Delete it first if you want to regenerate.');
    return;
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log('Please provide the following information for your keystore:');
  console.log('(Press Enter to use the default value shown in brackets)');
  console.log('');

  const storePass = await question(rl, 'Store password (min 6 chars): ');
  const keyPass = await question(rl, 'Key password (min 6 chars, or same as store): ');
  const firstName = await question(rl, 'Your first and last name [Norla Developer]: ') || 'Norla Developer';
  const org = await question(rl, 'Organization [Norla]: ') || 'Norla';
  const city = await question(rl, 'City [Chennai]: ') || 'Chennai';
  const state = await question(rl, 'State [Tamil Nadu]: ') || 'Tamil Nadu';
  const country = await question(rl, 'Country code [IN]: ') || 'IN';

  rl.close();

  if (!storePass || storePass.length < 6) {
    console.error('❌ Store password must be at least 6 characters');
    process.exit(1);
  }

  const finalKeyPass = keyPass || storePass;
  const dname = `CN=${firstName}, OU=${org}, O=${org}, L=${city}, S=${state}, C=${country}`;

  const cmd = [
    'keytool -genkey -v',
    `-keystore "${KEYSTORE_PATH}"`,
    `-alias norla`,
    `-keyalg RSA`,
    `-keysize 2048`,
    `-validity 10000`,
    `-storepass "${storePass}"`,
    `-keypass "${finalKeyPass}"`,
    `-dname "${dname}"`,
  ].join(' ');

  console.log('');
  console.log('🔑 Generating keystore...');

  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch {
    console.error('❌ keytool command failed.');
    console.error('   Make sure Java/JDK is installed (comes with Android Studio).');
    console.error('   Or find keytool at: C:\\Program Files\\Android\\Android Studio\\jbr\\bin\\keytool.exe');
    process.exit(1);
  }

  console.log('');
  console.log('✅ Keystore generated at:', KEYSTORE_PATH);
  console.log('');
  console.log('📋 Now add this to android/app/build.gradle signingConfigs:');
  console.log('');
  console.log('   signingConfigs {');
  console.log('     release {');
  console.log(`       storeFile file('../../../norla-release.keystore')`);
  console.log(`       storePassword '${storePass}'`);
  console.log(`       keyAlias 'norla'`);
  console.log(`       keyPassword '${finalKeyPass}'`);
  console.log('     }');
  console.log('   }');
  console.log('');
  console.log('⚠️  BACKUP THIS FILE: norla-release.keystore');
  console.log('   Without it, you cannot update your app on Play Store ever!');
}

generateKeystore().catch(console.error);
