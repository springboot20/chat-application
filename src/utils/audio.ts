export const getAudioBlobDuration = (blob: Blob): Promise<number> => {
  return new Promise((resolve, reject) => {
    const audioContext = new (window.AudioContext || AudioContext)();

    blob
      .arrayBuffer()
      .then((arrayBuffer) => audioContext.decodeAudioData(arrayBuffer))
      .then((decodedData) => {
        resolve(Math.round(decodedData.duration));
        console.log('Audio Duration:', decodedData.duration, 'seconds');
        audioContext.close(); // Optional: close the context if no further audio processing is needed
      })
      .catch((error) => {
        console.error('Error decoding audio:', error);
        reject(error);
      });
  });
};
