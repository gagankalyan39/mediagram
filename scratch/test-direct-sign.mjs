import fs from 'fs';

async function testDirectSignedUpload() {
  try {
    console.log('1. Fetching signature from /api/media/sign...');
    const signRes = await fetch('http://localhost:3000/api/media/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderType: 'post_image', tags: ['test'], resourceType: 'image' }),
    });

    const signData = await signRes.json();
    console.log('Signature Data:', signData);

    console.log('2. Uploading directly to Cloudinary endpoint...');
    const fileBuffer = fs.readFileSync('public/pics/pic_02.png');
    const blob = new Blob([fileBuffer], { type: 'image/png' });
    const file = new File([blob], 'pic_02.png', { type: 'image/png' });

    const cldFormData = new FormData();
    cldFormData.append('file', file);
    cldFormData.append('api_key', signData.apiKey);
    cldFormData.append('timestamp', String(signData.timestamp));
    cldFormData.append('signature', signData.signature);
    cldFormData.append('folder', signData.folder);
    if (signData.tags) cldFormData.append('tags', signData.tags);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`;
    const cldRes = await fetch(uploadUrl, {
      method: 'POST',
      body: cldFormData,
    });

    console.log('Cloudinary HTTP status:', cldRes.status, cldRes.statusText);
    const result = await cldRes.json();
    console.log('Cloudinary response:', result);
  } catch (err) {
    console.error('Test error:', err);
  }
}

testDirectSignedUpload();
