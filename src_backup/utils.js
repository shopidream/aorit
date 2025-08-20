// 📁 utils.js - 공통 유틸리티 함수들

// 날짜 포맷팅
export const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}년 ${month}월 ${day}일`;
  };
  
  // 금액 포맷팅 (3자리마다 콤마)
  export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(parseInt(amount) || 0);
  };
  
  // 숫자를 한글로 변환
  export const numberToKorean = (number) => {
    const units = ['', '만', '억', '조'];
    const digits = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
    const smallUnits = ['', '십', '백', '천'];
    
    if (number === 0) return '영';
    
    let result = '';
    let unitIndex = 0;
    
    while (number > 0) {
      const chunk = number % 10000;
      if (chunk > 0) {
        let chunkStr = '';
        let tempChunk = chunk;
        let smallUnitIndex = 0;
        
        while (tempChunk > 0) {
          const digit = tempChunk % 10;
          if (digit > 0) {
            if (digit === 1 && smallUnitIndex > 0) {
              chunkStr = smallUnits[smallUnitIndex] + chunkStr;
            } else {
              chunkStr = digits[digit] + smallUnits[smallUnitIndex] + chunkStr;
            }
          }
          tempChunk = Math.floor(tempChunk / 10);
          smallUnitIndex++;
        }
        
        result = chunkStr + units[unitIndex] + result;
      }
      number = Math.floor(number / 10000);
      unitIndex++;
    }
    
    return result;
  };
  
  // 결제 단계별 금액 계산
  export const calculatePaymentAmounts = (totalAmount, paymentStructure) => {
    const total = parseInt(totalAmount) || 0;
    
    if (paymentStructure === '2-stage') {
      return {
        stage1: Math.floor(total * 0.7), // 계약금 70%
        stage2: total - Math.floor(total * 0.7) // 잔금 30%
      };
    } else if (paymentStructure === '3-stage') {
      const stage1 = Math.floor(total * 0.4); // 계약금 40%
      const stage2 = Math.floor(total * 0.3); // 중도금 30%
      const stage3 = total - stage1 - stage2; // 잔금 30%
      return { stage1, stage2, stage3 };
    }
    
    return { stage1: total, stage2: 0, stage3: 0 };
  };
  
  // 계약서 ID 생성
  export const generateContractId = () => {
    return 'contract_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  };
  
  // 로컬스토리지 유틸리티
  export const storage = {
    save: (key, data) => {
      try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
      } catch (error) {
        console.error('저장 실패:', error);
        return false;
      }
    },
    
    load: (key) => {
      try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
      } catch (error) {
        console.error('로드 실패:', error);
        return null;
      }
    },
    
    remove: (key) => {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (error) {
        console.error('삭제 실패:', error);
        return false;
      }
    }
  };
  
  // 이메일 링크 생성
  export const generateEmailLink = (to, subject, body) => {
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);
    return `mailto:${to}?subject=${encodedSubject}&body=${encodedBody}`;
  };