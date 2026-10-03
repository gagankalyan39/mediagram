import fs from 'fs';

async function testSignedUpload() {
  try {
    const signRes = await fetch('http://localhost:3000/api/media/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderType: 'post_image', tags: [] }),
    });
    const signData = await signRes.json();
    console.log('signData:', signData);

    const fileBuffer = fs.readFileSync('public/pics/pic_01.jpg');
    const blob = new Blob([fileBuffer], { type: 'image/jpeg' });

    const cldFormData = new FormData();
    cldFormData.append('file', blob, 'pic_01.jpg');
    cldFormData.append('api_key', signData.apiKey);
    cldFormData.append('timestamp', String(signData.timestamp));
    cldFormData.append('signature', signData.signature);
    cldFormData.append('folder', signData.folder);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`;
    const cldRes = await fetch(uploadUrl, { method: 'POST', body: cldFormData });
    console.log('Cloudinary status:', cldRes.status);
    const json = await cldRes.json();
    console.log('Cloudinary result:', json);
  } catch (err) {
    console.error('Error:', err);
  }
}

testSignedUpload();
