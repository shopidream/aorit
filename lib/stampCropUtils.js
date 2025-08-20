// lib/stampCropUtils.js - 도장 자동 크롭핑 유틸리티

/**
 * 이미지에서 실제 도장 영역을 찾는 함수
 * 흰색/투명 배경을 제외하고 실제 내용이 있는 부분만 감지
 */
export const findStampBounds = (imageData) => {
    const { data, width, height } = imageData;
    let minX = width, minY = height, maxX = 0, maxY = 0;
    let hasContent = false;
  
    // 각 픽셀을 검사해서 흰색이 아닌 부분 찾기
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const a = data[index + 3];
  
        // 흰색이 아니고 투명하지 않은 픽셀인지 확인
        // 임계값을 사용해서 거의 흰색인 부분도 제외
        const isNotWhite = (r < 240 || g < 240 || b < 240) && a > 50;
        
        if (isNotWhite) {
          hasContent = true;
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }
  
    // 내용이 없으면 전체 이미지 반환
    if (!hasContent) {
      return { x: 0, y: 0, width, height };
    }
  
    // 여백 추가 (도장 가장자리가 잘리지 않도록)
    const padding = 10;
    return {
      x: Math.max(0, minX - padding),
      y: Math.max(0, minY - padding),
      width: Math.min(width - Math.max(0, minX - padding), maxX - minX + padding * 2),
      height: Math.min(height - Math.max(0, minY - padding), maxY - minY + padding * 2)
    };
  };
  
  /**
   * 도장 이미지를 자동으로 크롭하고 최적화하는 함수
   */
  export const cropStampImage = (imageFile, targetSize = 60) => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        try {
          // 원본 이미지를 캔버스에 그리기
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          // 픽셀 데이터 분석해서 실제 도장 영역 찾기
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const bounds = findStampBounds(imageData);
          
          // 크롭된 이미지를 위한 새 캔버스
          const croppedCanvas = document.createElement('canvas');
          const croppedCtx = croppedCanvas.getContext('2d');
          
          // 비율 유지하면서 targetSize에 맞춤
          const aspectRatio = bounds.width / bounds.height;
          let newWidth, newHeight;
          
          if (aspectRatio > 1) {
            // 가로가 더 긴 경우
            newWidth = targetSize;
            newHeight = targetSize / aspectRatio;
          } else {
            // 세로가 더 긴 경우
            newWidth = targetSize * aspectRatio;
            newHeight = targetSize;
          }
          
          croppedCanvas.width = newWidth;
          croppedCanvas.height = newHeight;
          
          // 크롭된 영역을 새 캔버스에 그리기
          croppedCtx.drawImage(
            img,
            bounds.x, bounds.y, bounds.width, bounds.height,
            0, 0, newWidth, newHeight
          );
          
          // 이미지 품질 향상
          croppedCtx.filter = 'contrast(1.1) brightness(1.05)';
          
          // base64로 변환해서 반환
          const croppedDataURL = croppedCanvas.toDataURL('image/png', 0.9);
          resolve(croppedDataURL);
          
        } catch (error) {
          console.error('도장 크롭 처리 중 오류:', error);
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error('이미지 로드 실패'));
      };
      
      // 파일을 이미지로 로드
      if (imageFile instanceof File) {
        img.src = URL.createObjectURL(imageFile);
      } else if (typeof imageFile === 'string') {
        img.src = imageFile;
      } else {
        reject(new Error('잘못된 이미지 형식'));
      }
    });
  };
  
  /**
   * 도장 크기를 실제 법인 도장 기준으로 조절하는 함수
   */
  export const resizeStampToLegalSize = (imageDataURL, sizeInPixels = 60) => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      // 법인 도장 크기 기준 검증
      const stampSizes = {
        min: 40,    // 12mm 개인 도장
        default: 60, // 18mm 표준 법인 도장 (가장 일반적)
        max: 80     // 21mm 대형 법인 도장
      };
      
      // 크기 범위 제한
      const targetSize = Math.max(stampSizes.min, Math.min(stampSizes.max, sizeInPixels));
      
      img.onload = () => {
        try {
          // 정사각형으로 캔버스 설정
          canvas.width = targetSize;
          canvas.height = targetSize;
          
          // 이미지를 중앙에 배치하면서 비율 유지
          const scale = Math.min(targetSize / img.width, targetSize / img.height);
          const scaledWidth = img.width * scale;
          const scaledHeight = img.height * scale;
          const x = (targetSize - scaledWidth) / 2;
          const y = (targetSize - scaledHeight) / 2;
          
          // 배경을 투명하게 설정
          ctx.clearRect(0, 0, targetSize, targetSize);
          
          // 이미지 그리기
          ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
          
          // 품질 향상
          ctx.filter = 'contrast(1.1) brightness(1.05)';
          
          const resizedDataURL = canvas.toDataURL('image/png', 0.9);
          resolve({
            dataURL: resizedDataURL,
            actualSize: targetSize,
            mmSize: Math.round((targetSize / 60) * 18), // 60px = 18mm 기준으로 계산
            category: targetSize <= 50 ? '개인 도장' : targetSize <= 70 ? '표준 법인 도장' : '대형 법인 도장'
          });
          
        } catch (error) {
          console.error('도장 크기 조절 중 오류:', error);
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error('이미지 로드 실패'));
      };
      
      img.src = imageDataURL;
    });
  };
  
  /**
   * 법인 도장 크기 정보 반환
   */
  export const getStampSizeInfo = () => {
    return {
      sizes: [
        { px: 40, mm: 12, name: '개인 도장', description: '개인용 소형 도장' },
        { px: 45, mm: 13.5, name: '소형 법인', description: '소규모 법인 도장' },
        { px: 50, mm: 15, name: '법인 각인', description: '정사각형 법인 각인' },
        { px: 60, mm: 18, name: '표준 법인', description: '가장 일반적인 크기 (추천)', recommended: true },
        { px: 65, mm: 19.5, name: '중형 법인', description: '중간 크기 법인 도장' },
        { px: 70, mm: 21, name: '대형 법인', description: '대기업용 대형 도장' },
        { px: 80, mm: 24, name: '특대형', description: '최대 크기 (권장하지 않음)' }
      ],
      defaultSize: 60,
      recommendedSize: 60,
      minSize: 40,
      maxSize: 80
    };
  };
  
  /**
   * 이미지가 도장처럼 보이는지 검증하는 함수
   */
  export const validateStampImage = (imageFile) => {
    return new Promise((resolve) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const bounds = findStampBounds(imageData);
        
        // 검증 조건들
        const hasContent = bounds.width > 0 && bounds.height > 0;
        const isReasonableSize = bounds.width > 20 && bounds.height > 20; // 최소 크기
        const isNotTooElongated = Math.max(bounds.width, bounds.height) / Math.min(bounds.width, bounds.height) < 3; // 너무 길쭉하지 않은지
        
        const isValid = hasContent && isReasonableSize && isNotTooElongated;
        
        resolve({
          isValid,
          bounds,
          suggestions: isValid ? [] : [
            !hasContent && '이미지에서 도장을 찾을 수 없습니다.',
            !isReasonableSize && '도장이 너무 작습니다. 더 큰 이미지를 사용해주세요.',
            !isNotTooElongated && '이미지 비율이 적절하지 않습니다. 정사각형에 가까운 도장 이미지를 사용해주세요.'
          ].filter(Boolean)
        });
      };
      
      img.onerror = () => {
        resolve({ isValid: false, suggestions: ['이미지를 읽을 수 없습니다.'] });
      };
      
      if (imageFile instanceof File) {
        img.src = URL.createObjectURL(imageFile);
      } else {
        img.src = imageFile;
      }
    });
  };