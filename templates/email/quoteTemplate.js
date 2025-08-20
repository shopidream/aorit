// templates/email/quoteTemplate.js - 견적서 이메일 템플릿
export const generateQuoteEmailTemplate = (quote, user) => {
  const { client, amount, notes, createdAt, items, metadata } = quote;
  
  // items와 metadata 파싱
  const quoteItems = items ? JSON.parse(items) : [];
  const quoteMetadata = metadata ? JSON.parse(metadata) : {};
  const quoteOptions = quoteMetadata.options || {};
  
  const formatCurrency = (amount) => amount ? amount.toLocaleString() : '0';
  const generateQuoteNumber = () => {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const day = String(new Date().getDate()).padStart(2, '0');
    return `${year}${month}${day}-${String(quote.id).padStart(4, '0')}`;
  };

  const isModernStyle = quoteOptions.style !== 'formal';

  if (isModernStyle) {
    // 모던 스타일 이메일
    return {
      subject: `[견적서] ${quoteItems.map(item => item.serviceName).join(', ')} - ${user.name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>견적서</title>
          <style>
            body { font-family: 'Malgun Gothic', Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 700px; margin: 0 auto; background: white; }
            .header { background: #333; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; }
            .quote-info { background: #f8f9fa; padding: 20px; margin: 20px 0; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; white-space: nowrap; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .total { background: #333; color: white; padding: 15px; text-align: center; font-size: 18px; font-weight: bold; white-space: nowrap; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
            .amount { white-space: nowrap; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>견적서</h1>
              <p>견적번호: ${generateQuoteNumber()}</p>
            </div>
            
            <div class="content">
              <p>안녕하세요, <strong>${client?.name}</strong>님</p>
              <p>요청해주신 프로젝트에 대한 견적서를 보내드립니다.</p>
              
              <table>
                <thead>
                  <tr>
                    <th>서비스명</th>
                    <th style="width: 60px;">수량</th>
                    <th style="width: 100px;">단가</th>
                    <th style="width: 100px;">금액</th>
                  </tr>
                </thead>
                <tbody>
                  ${quoteItems.map(item => `
                    <tr>
                      <td>
                        <strong>${item.serviceName}</strong>
                        ${quoteOptions.includeServiceDetails && item.serviceDetails ? 
                          `<br><small style="color: #666;">${item.serviceDetails}</small>` : ''
                        }
                      </td>
                      <td style="text-align: center;" class="amount">${item.quantity}</td>
                      <td style="text-align: right;" class="amount">${formatCurrency(item.unitPrice)}원</td>
                      <td style="text-align: right;" class="amount"><strong>${formatCurrency(item.totalPrice)}원</strong></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              
              <div class="total">
                총&nbsp;견적&nbsp;금액:&nbsp;${formatCurrency(amount)}원
              </div>
              
              <div class="quote-info">
                <h3>견적 조건</h3>
                <ul>
                  <li><strong>납품기한:</strong> 계약일로부터 ${quoteOptions.deliveryDays || 30}일 이내</li>
                  <li><strong>결제조건:</strong> 계약금 ${quoteOptions.paymentTerms?.contract || 50}%, 중도금 ${quoteOptions.paymentTerms?.progress || 30}%, 잔금 ${quoteOptions.paymentTerms?.final || 20}%</li>
                  <li><strong>유효기간:</strong> 견적일로부터 ${quoteOptions.validityDays || 30}일간</li>
                </ul>
                
                ${quoteOptions.includedItems ? `
                  <h4>포함사항:</h4>
                  <ul>
                    ${quoteOptions.includedItems.planning ? '<li>기획 및 설계</li>' : ''}
                    ${quoteOptions.includedItems.development ? '<li>개발 및 구현</li>' : ''}
                    ${quoteOptions.includedItems.testing ? '<li>테스트 및 검수</li>' : ''}
                    ${quoteOptions.includedItems.maintenance ? '<li>1개월 무상 A/S</li>' : ''}
                  </ul>
                ` : ''}
              </div>
            </div>
            
            <div class="footer">
              <strong>${user.name}</strong><br>
              ${user.email} | 생성일: ${new Date(createdAt).toLocaleDateString()}
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
견적서 - ${quoteItems.map(item => item.serviceName).join(', ')}

안녕하세요, ${client?.name}님

요청해주신 프로젝트에 대한 견적서입니다.

${quoteItems.map(item => `
- ${item.serviceName}: ${formatCurrency(item.totalPrice)}원 (${item.quantity}개 × ${formatCurrency(item.unitPrice)}원)
`).join('')}

총 견적금액: ${formatCurrency(amount)}원

조건:
- 납품기한: 계약일로부터 ${quoteOptions.deliveryDays || 30}일 이내
- 결제조건: 계약금 ${quoteOptions.paymentTerms?.contract || 50}%, 중도금 ${quoteOptions.paymentTerms?.progress || 30}%, 잔금 ${quoteOptions.paymentTerms?.final || 20}%
- 유효기간: 견적일로부터 ${quoteOptions.validityDays || 30}일간

${user.name}
${user.email}
      `
    };
  } else {
    // 정형 스타일 이메일 (텍스트 기반)
    return {
      subject: `[견적서] ${generateQuoteNumber()} - ${user.name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>견적서</title>
          <style>
            body { font-family: '돋움', Arial, sans-serif; line-height: 1.4; margin: 0; padding: 20px; }
            .formal-doc { max-width: 210mm; margin: 0 auto; background: white; padding: 20mm; border: 1px solid #ccc; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th, td { border: 1px solid #000; padding: 5px; font-size: 11pt; white-space: nowrap; }
            th { background-color: #f5f5f5; font-weight: bold; text-align: center; }
            .header { font-size: 18pt; font-weight: bold; text-align: center; margin-bottom: 20px; }
            .total-box { border: 2px solid #000; padding: 10px; text-align: center; font-size: 14pt; margin: 10px 0; white-space: nowrap; }
            .amount { white-space: nowrap; }
          </style>
        </head>
        <body>
          <div class="formal-doc">
            <div class="header">견&nbsp;적&nbsp;서</div>
            
            <p><strong>${client?.company ? client.company + ' ' : ''}${client?.name}</strong> 귀하</p>
            <p style="text-align: right;">${new Date(createdAt).getFullYear()}년 ${new Date(createdAt).getMonth() + 1}월 ${new Date(createdAt).getDate()}일</p>
            
            <p>아래와 같이 견적합니다.</p>
            
            <table>
              <tr>
                <td style="background: #f5f5f5; font-weight: bold;">견적번호</td>
                <td>${generateQuoteNumber()}</td>
              </tr>
              <tr>
                <td style="background: #f5f5f5; font-weight: bold;">견적명</td>
                <td>${quoteItems.map(item => item.serviceName).join(', ')}</td>
              </tr>
              <tr>
                <td style="background: #f5f5f5; font-weight: bold;">납품기한</td>
                <td>계약일로부터 ${quoteOptions.deliveryDays || 30}일 이내</td>
              </tr>
              <tr>
                <td style="background: #f5f5f5; font-weight: bold;">결제조건</td>
                <td>계약금 ${quoteOptions.paymentTerms?.contract || 50}%, 중도금 ${quoteOptions.paymentTerms?.progress || 30}%, 잔금 ${quoteOptions.paymentTerms?.final || 20}%</td>
              </tr>
            </table>
            
            <div class="total-box">
              <strong>합계금액:&nbsp;${formatCurrency(amount)}원</strong>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>품명</th>
                  <th style="width: 60px;">수량</th>
                  <th style="width: 80px;">단가</th>
                  <th style="width: 80px;">금액</th>
                </tr>
              </thead>
              <tbody>
                ${quoteItems.map(item => `
                  <tr>
                    <td>${item.serviceName}</td>
                    <td style="text-align: center;" class="amount">${item.quantity}</td>
                    <td style="text-align: right;" class="amount">${formatCurrency(item.unitPrice)}</td>
                    <td style="text-align: right;" class="amount">${formatCurrency(item.totalPrice)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div style="margin-top: 20px; text-align: right; font-size: 11pt;">
              <strong>${user.name}</strong><br>
              ${user.email}
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
견적서

${client?.company ? client.company + ' ' : ''}${client?.name} 귀하

아래와 같이 견적합니다.

견적번호: ${generateQuoteNumber()}
납품기한: 계약일로부터 ${quoteOptions.deliveryDays || 30}일 이내
결제조건: 계약금 ${quoteOptions.paymentTerms?.contract || 50}%, 중도금 ${quoteOptions.paymentTerms?.progress || 30}%, 잔금 ${quoteOptions.paymentTerms?.final || 20}%

${quoteItems.map(item => `${item.serviceName}: ${formatCurrency(item.totalPrice)}원`).join('\n')}

합계: ${formatCurrency(amount)}원

${user.name}
${user.email}
      `
    };
  }
};