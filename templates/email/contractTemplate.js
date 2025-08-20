// templates/email/contractTemplate.js
export const generateContractEmailTemplate = (contract, user) => {
  const { client, quote, clauses, id, createdAt } = contract;
  const contractUrl = `${process.env.NEXTAUTH_URL}/contracts/${id}`;
  
  return {
    subject: `[계약서] ${quote?.service?.title} - 전자서명 요청`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>계약서 전자서명 요청</title>
        <style>
          body { font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .contract-info { background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981; }
          .clause { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 3px solid #8B5CF6; }
          .button { display: inline-block; background: #10B981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; text-align: center; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
          .warning { background: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 계약서 전자서명</h1>
            <p>Contract #${id}</p>
          </div>
          
          <div class="content">
            <p>안녕하세요, <strong>${client?.name}</strong>님</p>
            <p>프로젝트 계약서가 준비되었습니다. 계약 내용을 확인하시고 전자서명을 진행해주세요.</p>
            
            <div class="contract-info">
              <h3 style="margin-top: 0; color: #10B981;">📄 계약 정보</h3>
              
              <div style="display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #d1fae5;">
                <span><strong>프로젝트명</strong></span>
                <span>${quote?.service?.title}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #d1fae5;">
                <span><strong>계약금액</strong></span>
                <span style="font-weight: bold; color: #10B981;">${quote?.amount?.toLocaleString()}원</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #d1fae5;">
                <span><strong>예상기간</strong></span>
                <span>${quote?.service?.duration}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0;">
                <span><strong>계약일</strong></span>
                <span>${new Date(createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            
            ${clauses?.length > 0 ? `
              <div style="margin: 30px 0;">
                <h4 style="color: #374151;">주요 계약 조항:</h4>
                ${clauses.slice(0, 3).map((clause, index) => `
                  <div class="clause">
                    <strong>제${clause.order}조.</strong> ${clause.content}
                  </div>
                `).join('')}
                ${clauses.length > 3 ? '<p style="text-align: center; color: #6B7280; font-style: italic;">외 ' + (clauses.length - 3) + '개 조항</p>' : ''}
              </div>
            ` : ''}
            
            <div class="warning">
              <h4 style="margin-top: 0; color: #f59e0b;">⚠️ 서명 전 확인사항</h4>
              <ul style="margin: 10px 0;">
                <li>계약 내용을 충분히 검토해주세요</li>
                <li>궁금한 사항은 서명 전에 문의해주세요</li>
                <li>전자서명은 법적 효력을 가집니다</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${contractUrl}" class="button">
                🔗 계약서 확인 및 전자서명
              </a>
              <p style="font-size: 14px; color: #6B7280; margin-top: 10px;">
                위 버튼을 클릭하여 계약서 전문을 확인하고 서명해주세요
              </p>
            </div>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h4 style="margin-top: 0; color: #374151;">📞 문의사항</h4>
              <p>계약 내용에 대해 궁금한 점이 있으시면 언제든 연락해주세요.</p>
              <p>이메일: ${user.email}</p>
            </div>
          </div>
          
          <div class="footer">
            <div style="margin-bottom: 10px;">
              <strong>${user.name}</strong>
            </div>
            <div>
              이 이메일은 계약서 전자서명을 위해 발송되었습니다.<br>
              계약서 링크는 보안을 위해 제한된 시간 동안만 유효합니다.
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
계약서 전자서명 요청

안녕하세요, ${client?.name}님

프로젝트 계약서가 준비되었습니다.

계약 정보:
- 프로젝트: ${quote?.service?.title}
- 계약금액: ${quote?.amount?.toLocaleString()}원
- 예상기간: ${quote?.service?.duration}

아래 링크에서 계약서를 확인하고 전자서명해주세요:
${contractUrl}

궁금한 사항이 있으시면 언제든 연락해주세요.

${user.name}
${user.email}
    `
  };
};