#!/usr/bin/env node

/**
 * Get B2 Bucket ID Script
 * Uses provided credentials to get the bucket ID for the bucket name
 */

const B2 = require('backblaze-b2');

async function getBucketId() {
  console.log('\ud83d\udd0d Getting B2 Bucket ID...\\n');

  const b2 = new B2({
    applicationKeyId: 'cf3e755aee14',
    applicationKey: '003795017f9064034fe33409ee2aa9cbdaf48c725d'
  });

  try {
    // Authorize with B2
    console.log('1\ufe0f\u20e3 Authorizing with B2...');
    await b2.authorize();
    console.log('\u2705 Authorization successful\\n');

    // List buckets to find the one with name 'dev-profiles'
    console.log('2\ufe0f\u20e3 Listing buckets...');
    const { data: buckets } = await b2.listBuckets();
    
    const targetBucket = buckets.buckets.find(bucket => bucket.bucketName === 'dev-profiles');
    
    if (targetBucket) {
      console.log('\u2705 Found bucket:', targetBucket.bucketName);
      console.log('\ud83d\udccb Bucket ID:', targetBucket.bucketId);
      console.log('\ud83d\udccb Bucket Type:', targetBucket.bucketType);
      console.log('\ud83d\udccb Bucket Info:', targetBucket.bucketInfo);
      
      console.log('\n\ud83c\udfaf Environment Variables to add to .env.development:');
      console.log('B2_KEY_ID=cf3e755aee14');
      console.log('B2_APP_KEY=003795017f9064034fe33409ee2aa9cbdaf48c725d');
      console.log(`B2_BUCKET_ID=${targetBucket.bucketId}`);
      console.log('B2_BUCKET_NAME=dev-profiles');
      
    } else {
      console.log('\u274c Bucket "dev-profiles" not found');
      console.log('\ud83d\udccb Available buckets:');
      buckets.buckets.forEach(bucket => {
        console.log(`   - ${bucket.bucketName} (${bucket.bucketId})`);
      });
    }

  } catch (error) {
    console.error('\u274c Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Run the script
getBucketId().catch(console.error); 
