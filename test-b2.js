require('dotenv').config({ path: 'backend/.env.development' });
const B2 = require('backblaze-b2');

const b2 = new B2({
  applicationKeyId: process.env.B2_KEY_ID,
  applicationKey: process.env.B2_APP_KEY
});

async function testB2() {
  try {
    console.log('Authorizing...');
    await b2.authorize();
    console.log('✅ B2 Authorization successful!');
    
    console.log(`Checking bucket: ${process.env.B2_BUCKET_ID}`);
    const response = await b2.getBucket({ bucketName: process.env.B2_BUCKET_NAME });
    console.log('✅ Bucket exists!');
  } catch (error) {
    console.error('❌ B2 Error:', error.message);
  }
}

testB2();
