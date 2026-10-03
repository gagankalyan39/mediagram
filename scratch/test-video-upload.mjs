import fs from 'fs';

async function testVideoUpload() {
  try {
    console.log('Testing Cloudinary video upload via Next.js API route...');
    // Use reel_03.mp4 which is small
    const fileBuffer = fs.readFileSync('public/videos/reel_03.mp4');
    const blob = new Blob([fileBuffer], { type: 'video/mp4' });
    const file = new File([blob], 'reel_03.mp4', { type: 'video/mp4' });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folderType', 'post_video');
    formData.append('userId', 'usr_test');
    formData.append('tags', 'coconut,beach,tropical');

    const res = await fetch('http://localhost:3000/api/media/upload', {
      method: 'POST',
      body: formData,
    });

    console.log('Video Status:', res.status, res.statusText);
    const data = await res.json();
    console.log('Video Result:', JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error during video test:', e);
  }
}

testVideoUpload();
