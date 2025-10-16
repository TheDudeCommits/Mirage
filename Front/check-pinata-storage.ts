/**
 * Check Pinata IPFS Storage
 * Shows all files you've uploaded and their details
 */

import dotenv from 'dotenv';
import axios from 'axios';

// Load environment variables
dotenv.config({ path: '.env.local' });

const PINATA_API_URL = 'https://api.pinata.cloud';

// Get authentication headers
function getPinataHeaders() {
  if (process.env.PINATA_JWT) {
    return {
      'Authorization': `Bearer ${process.env.PINATA_JWT}`
    };
  } else if (process.env.PINATA_API_KEY && process.env.PINATA_SECRET_API_KEY) {
    return {
      'pinata_api_key': process.env.PINATA_API_KEY,
      'pinata_secret_api_key': process.env.PINATA_SECRET_API_KEY
    };
  } else {
    throw new Error('Pinata credentials not found in .env.local');
  }
}

/**
 * Get all pinned files from Pinata
 */
async function listPinnedFiles() {
  try {
    console.log('📦 Fetching your Pinata storage...\n');

    const response = await axios.get(
      `${PINATA_API_URL}/data/pinList?status=pinned&pageLimit=1000`,
      { headers: getPinataHeaders() }
    );

    const files = response.data.rows;
    const count = response.data.count;

    console.log(`✅ Found ${count} pinned file(s)\n`);
    console.log('═'.repeat(80));

    if (files.length === 0) {
      console.log('\n📭 No files found in your Pinata storage.');
      return;
    }

    files.forEach((file: any, index: number) => {
      console.log(`\n📄 File ${index + 1}:`);
      console.log(`   Name: ${file.metadata?.name || 'Unnamed'}`);
      console.log(`   CID: ${file.ipfs_pin_hash}`);
      console.log(`   Size: ${formatBytes(file.size)}`);
      console.log(`   Uploaded: ${new Date(file.date_pinned).toLocaleString()}`);
      console.log(`   Gateway URL: https://gateway.pinata.cloud/ipfs/${file.ipfs_pin_hash}`);
      
      // Show custom metadata if available
      if (file.metadata?.keyvalues) {
        console.log(`   Metadata:`);
        Object.entries(file.metadata.keyvalues).forEach(([key, value]) => {
          console.log(`     - ${key}: ${value}`);
        });
      }
      
      console.log('   ' + '─'.repeat(76));
    });

    console.log('\n' + '═'.repeat(80));
    
    // Calculate total storage used
    const totalSize = files.reduce((sum: number, file: any) => sum + file.size, 0);
    console.log(`\n📊 Total Storage Used: ${formatBytes(totalSize)}`);
    console.log(`📁 Total Files: ${count}`);

  } catch (error: any) {
    console.error('❌ Error fetching Pinata data:', error.response?.data || error.message);
  }
}

/**
 * Get specific file by CID
 */
async function getFileDetails(cid: string) {
  try {
    console.log(`\n🔍 Fetching details for CID: ${cid}\n`);

    // Fetch metadata from Pinata
    const response = await axios.get(
      `${PINATA_API_URL}/data/pinList?hashContains=${cid}`,
      { headers: getPinataHeaders() }
    );

    if (response.data.count === 0) {
      console.log('❌ File not found in your Pinata storage.');
      return;
    }

    const file = response.data.rows[0];

    console.log('📄 File Details:');
    console.log(`   Name: ${file.metadata?.name || 'Unnamed'}`);
    console.log(`   CID: ${file.ipfs_pin_hash}`);
    console.log(`   Size: ${formatBytes(file.size)}`);
    console.log(`   Uploaded: ${new Date(file.date_pinned).toLocaleString()}`);
    console.log(`   Pin Count: ${file.regions?.length || 1}`);
    
    // Fetch actual content
    console.log('\n📥 Fetching content...\n');
    const contentResponse = await axios.get(`https://gateway.pinata.cloud/ipfs/${cid}`);
    console.log('📄 Content:');
    console.log(JSON.stringify(contentResponse.data, null, 2));

  } catch (error: any) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

/**
 * Get account info and usage stats
 */
async function getAccountInfo() {
  try {
    console.log('👤 Fetching account information...\n');

    const response = await axios.get(
      `${PINATA_API_URL}/data/userPinnedDataTotal`,
      { headers: getPinataHeaders() }
    );

    const data = response.data;

    console.log('📊 Account Statistics:');
    console.log(`   Total Pins: ${data.pin_count}`);
    console.log(`   Total Size: ${formatBytes(data.pin_size_total)}`);
    console.log(`   Total Size with Replications: ${formatBytes(data.pin_size_with_replications_total)}`);

  } catch (error: any) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Main function
 */
async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║          📦 Pinata IPFS Storage Inspector 📦                ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const args = process.argv.slice(2);
  const command = args[0];
  const param = args[1];

  try {
    // Check authentication first
    console.log('🔐 Testing authentication...');
    await axios.get(
      `${PINATA_API_URL}/data/testAuthentication`,
      { headers: getPinataHeaders() }
    );
    console.log('✅ Authentication successful!\n');
    console.log('═'.repeat(80) + '\n');

    // Execute command
    if (command === 'get' && param) {
      await getFileDetails(param);
    } else if (command === 'stats') {
      await getAccountInfo();
    } else {
      // Default: list all files
      await listPinnedFiles();
      console.log('\n💡 Tips:');
      console.log('   - View specific file: npx tsx check-pinata-storage.ts get <CID>');
      console.log('   - View account stats: npx tsx check-pinata-storage.ts stats');
      console.log('   - View all files: npx tsx check-pinata-storage.ts');
    }

    console.log('\n🔗 Pinata Dashboard: https://app.pinata.cloud/pinmanager');
    console.log('');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
main();


