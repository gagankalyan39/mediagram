import fs from 'fs';

async function testUpload() {
  try {
    console.log('Testing Cloudinary upload via Next.js API route...');
    const fileBuffer = fs.readFileSync('public/pics/pic_01.jpg');
    const blob = new Blob([fileBuffer], { type: 'image/jpeg' });
    const file = new File([blob], 'pic_01.jpg', { type: 'image/jpeg' });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folderType', 'post_image');
    formData.append('userId', 'usr_test');
    formData.append('tags', 'test,fashion');

    const res = await fetch('http://localhost:3000/api/media/upload', {
      method: 'POST',
      body: formData,
    });

    console.log('Status:', res.status, res.statusText);
    const data = await res.json();
    console.log('Result:', JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error during test:', e);
  }
}

testUpload();
