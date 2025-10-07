// utils/playApiAudio.ts
export async function playApiAudio(url: string, audioData?: Blob) {
  let blob: Blob;
  
  if (audioData) {
    // If audio data is already provided as a blob
    const ct = audioData.type || 'audio/mpeg';
    console.log('Using provided audio blob, Content-Type:', ct);
    blob = audioData;
  } else {
    // Fetch from URL
    const res = await fetch(url);
    const ct = res.headers.get('Content-Type') || 'audio/mpeg';
    console.log('Fetched audio, Content-Type:', ct);
    
    if (ct.includes('application/json')) {
      const { audio_base64 } = await res.json();
      const binary = atob(audio_base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const mime = /ogg|opus/.test(audio_base64) ? 'audio/ogg; codecs=opus' : 'audio/mpeg';
      blob = new Blob([bytes], { type: mime });
    } else {
      const buf = await res.arrayBuffer();
      blob = new Blob([buf], { type: ct });
    }
  }
  
  const urlObj = URL.createObjectURL(blob);
  const audio = new Audio(urlObj);
  
  audio.addEventListener('error', (e) => {
    console.error('HTMLMediaElement error', audio.error);
    console.error('Audio error details:', {
      code: audio.error?.code,
      message: audio.error?.message
    });
  });
  
  audio.addEventListener('loadeddata', () => {
    console.log('Audio loaded successfully');
  });
  
  audio.addEventListener('canplay', () => {
    console.log('Audio can play');
  });
  
  try {
    await audio.play();
    console.log('Audio playback started successfully');
    return audio;
  } catch (error) {
    console.error('Audio play() failed:', error);
    throw error;
  }
}