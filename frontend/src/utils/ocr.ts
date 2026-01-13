/**
 * 이미지에서 채널 번호 추출 (4자리 숫자)
 * 참고: 채널 번호는 항상 4자리로 표시됨 (0001, 0012, 0123, 1234)
 */
export function extractChannelNumbers(text: string): string[] {
  console.log('OCR 원본 텍스트:', text);
  
  // 4자리 숫자 패턴 추출 (단어 경계로 구분된 4자리 숫자)
  // 앞에 0이 붙은 경우도 포함하여 4자리 숫자를 모두 찾음
  const channelNumberPattern = /\b\d{4}\b/g;
  const matches = text.match(channelNumberPattern);
  
  if (!matches || matches.length === 0) {
    console.log('4자리 숫자를 찾을 수 없습니다.');
    return [];
  }
  
  console.log('추출된 매치:', matches);
  
  // 중복 제거 및 유효성 검사
  // 숫자로 변환하여 유효한 범위(1~9999)인지 확인하되, 원본 4자리 형식 유지
  const channelNumbers = Array.from(new Set(matches))
    .map(m => {
      const numInt = parseInt(m, 10);
      // 유효한 채널 번호 범위 (1~9999)
      if (numInt >= 1 && numInt <= 9999) {
        // 4자리 형식 유지 (앞에 0이 있으면 유지)
        return m.padStart(4, '0');
      }
      return null;
    })
    .filter((num): num is string => num !== null);
  
  console.log('최종 채널 번호:', channelNumbers);
  
  return channelNumbers;
}

/**
 * 이미지 전처리 (명암 및 대비 개선)
 */
export function preprocessImage(imageDataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = imageDataUrl;
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context not available');
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        // 이미지 그리기
        ctx.drawImage(img, 0, 0);
        
        // 이미지 전처리: 명암 및 대비 개선
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // 그레이스케일 변환 및 대비 개선
        for (let i = 0; i < data.length; i += 4) {
          const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
          // 대비 강화 (더 강하게)
          const contrast = 2.0;
          const adjusted = ((gray - 128) * contrast) + 128;
          // 이진화 (threshold 적용)
          const threshold = 128;
          const final = adjusted > threshold ? 255 : 0;
          
          data[i] = final;     // R
          data[i + 1] = final; // G
          data[i + 2] = final;  // B
          // data[i + 3]는 alpha, 그대로 유지
        }
        
        ctx.putImageData(imageData, 0, 0);
        const processedImageDataUrl = canvas.toDataURL('image/png');
        resolve(processedImageDataUrl);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = reject;
  });
}
