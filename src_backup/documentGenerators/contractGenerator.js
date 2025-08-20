// 📁 documentGenerators/contractGenerator.js - 계약서 생성기

import serviceManager from '../data/serviceManager.js';

const contractGenerator = {
  // 계약서 유효성 검사
  validateContract: function(contractData) {
    const errors = [];
    
    if (!contractData.formData.clientCompany?.trim()) {
      errors.push('갑(발주자) 회사명을 입력해주세요');
    }
    
    if (!contractData.formData.clientRepresentative?.trim()) {
      errors.push('갑(발주자) 대표자명을 입력해주세요');
    }
    
    if (!contractData.formData.clientPhone?.trim()) {
      errors.push('갑(발주자) 연락처를 입력해주세요');
    }
    
    if (!contractData.formData.clientEmail?.trim()) {
      errors.push('갑(발주자) 이메일을 입력해주세요');
    }
    
    if (!contractData.selectedServices || contractData.selectedServices.length === 0) {
      errors.push('최소 1개 이상의 서비스를 선택해주세요');
    }
    
    if (!contractData.formData.contractDate) {
      errors.push('계약일을 입력해주세요');
    }
    
    if (!contractData.formData.deliveryDate) {
      errors.push('완료 예정일을 입력해주세요');
    }
    
    return errors;
  },

  // 계약서 생성
  generateContract: function(contractData) {
    const {
      selectedServices,
      formData,
      paymentStructure,
      socialLoginCount = 0,
      customizationHours = 0,
      consultingHours = 0
    } = contractData;

    // 계약서 제목 생성
    const contractTitle = serviceManager.generateContractTitle(selectedServices);
    
    // 금액 계산
    const totalAmount = serviceManager.calculateTotalAmount(
      selectedServices, 
      socialLoginCount, 
      customizationHours, 
      consultingHours
    );

    // 서비스 설명 생성
    const serviceDescription = serviceManager.generateServiceDescription(selectedServices);
    const serviceDetails = serviceManager.generateServiceDetails(selectedServices);
    const deliverables = serviceManager.generateDeliverables(selectedServices);
    const serviceBreakdown = serviceManager.generateServiceBreakdown(selectedServices);

    // 결제 일정 계산
    const paymentSchedule = this.calculatePaymentSchedule(totalAmount, paymentStructure);

    // 계약서 내용 생성
    const contractContent = this.generateContractContent(formData, serviceDescription, totalAmount, paymentSchedule);

    return {
      id: this.generateContractId(),
      title: contractTitle,
      content: contractContent,
      formData,
      selectedServices,
      amounts: {
        totalAmountNumber: totalAmount,
        basePlanAmount: totalAmount,
        additionalServicesAmount: 0,
        paymentStructure,
        paymentAmounts: paymentSchedule
      },
      serviceInfo: {
        description: serviceDescription,
        details: serviceDetails,
        deliverables: deliverables,
        breakdown: serviceBreakdown
      },
      createdAt: new Date().toISOString(),
      status: 'draft'
    };
  },

  // 계약서 ID 생성
  generateContractId: function() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  },

  // 결제 일정 계산
  calculatePaymentSchedule: function(totalAmount, paymentStructure) {
    if (paymentStructure === '3-stage') {
      return {
        stage1: Math.round(totalAmount * 0.4), // 계약금 40%
        stage2: Math.round(totalAmount * 0.3), // 중도금 30%
        stage3: Math.round(totalAmount * 0.3)  // 잔금 30%
      };
    } else {
      return {
        stage1: Math.round(totalAmount * 0.7), // 계약금 70%
        stage2: Math.round(totalAmount * 0.3)  // 잔금 30%
      };
    }
  },

  // 계약서 내용 생성
  generateContractContent: function(formData, serviceDescription, totalAmount, paymentSchedule) {
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
    };

    const formatAmount = (amount) => {
      return amount.toLocaleString();
    };

    return `
<div style="max-width: 800px; margin: 0 auto; padding: 40px; font-family: 'Malgun Gothic', sans-serif; line-height: 1.6;">

<h1 style="text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px;">
용역계약서
</h1>

<p style="margin-bottom: 20px;">
아래 갑과 을은 다음 조건으로 용역계약을 체결한다.
</p>

<h2 style="font-size: 18px; font-weight: bold; margin: 30px 0 15px 0; color: #333;">제1조 (계약 당사자)</h2>

<table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
<tr>
<td style="width: 10%; font-weight: bold; padding: 8px; border: 1px solid #ddd; background-color: #f9f9f9;">갑</td>
<td style="padding: 8px; border: 1px solid #ddd;">
<strong>회사명:</strong> ${formData.clientCompany}<br>
<strong>대표자:</strong> ${formData.clientRepresentative}<br>
<strong>사업자등록번호:</strong> ${formData.clientBusiness || '개인'}<br>
<strong>주소:</strong> ${formData.clientAddress || '별도 기재'}<br>
<strong>연락처:</strong> ${formData.clientPhone}<br>
<strong>이메일:</strong> ${formData.clientEmail}
</td>
</tr>
<tr>
<td style="font-weight: bold; padding: 8px; border: 1px solid #ddd; background-color: #f9f9f9;">을</td>
<td style="padding: 8px; border: 1px solid #ddd;">
<strong>회사명:</strong> ${formData.supplierCompany}<br>
<strong>대표자:</strong> ${formData.supplierRepresentative}<br>
<strong>사업자등록번호:</strong> ${formData.supplierBusiness}<br>
<strong>주소:</strong> ${formData.supplierAddress}<br>
<strong>연락처:</strong> ${formData.supplierPhone}<br>
<strong>이메일:</strong> ${formData.supplierEmail}
</td>
</tr>
</table>

<h2 style="font-size: 18px; font-weight: bold; margin: 30px 0 15px 0; color: #333;">제2조 (용역의 내용)</h2>
<p style="margin-bottom: 15px;">을은 갑에게 다음의 용역을 제공한다:</p>
<div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin-bottom: 20px;">
${serviceDescription.replace(/\n/g, '<br>')}
</div>

<h2 style="font-size: 18px; font-weight: bold; margin: 30px 0 15px 0; color: #333;">제3조 (계약금액 및 지급조건)</h2>
<p><strong>총 계약금액:</strong> 금 ${formatAmount(totalAmount)}원정 (부가세 포함)</p>

<p><strong>지급조건:</strong></p>
<ul style="margin-left: 20px;">
${paymentSchedule.stage3 ? 
  `<li>계약금: ${formatAmount(paymentSchedule.stage1)}원 (${Math.round((paymentSchedule.stage1/totalAmount)*100)}%) - 계약 체결 시</li>
   <li>중도금: ${formatAmount(paymentSchedule.stage2)}원 (${Math.round((paymentSchedule.stage2/totalAmount)*100)}%) - 작업 진행률 50% 시</li>
   <li>잔금: ${formatAmount(paymentSchedule.stage3)}원 (${Math.round((paymentSchedule.stage3/totalAmount)*100)}%) - 작업 완료 시</li>` :
  `<li>계약금: ${formatAmount(paymentSchedule.stage1)}원 (${Math.round((paymentSchedule.stage1/totalAmount)*100)}%) - 계약 체결 시</li>
   <li>잔금: ${formatAmount(paymentSchedule.stage2)}원 (${Math.round((paymentSchedule.stage2/totalAmount)*100)}%) - 작업 완료 시</li>`
}
</ul>

<p><strong>계좌정보:</strong> ${formData.supplierAccount}</p>

<h2 style="font-size: 18px; font-weight: bold; margin: 30px 0 15px 0; color: #333;">제4조 (이행기간)</h2>
<p>본 계약의 이행기간은 ${formatDate(formData.contractDate)}부터 ${formatDate(formData.deliveryDate)}까지로 한다.</p>

<h2 style="font-size: 18px; font-weight: bold; margin: 30px 0 15px 0; color: #333;">제5조 (기타사항)</h2>
<ul style="margin-left: 20px;">
<li>본 계약서에 명시되지 않은 사항은 관련 법령 및 일반 관례에 따른다.</li>
<li>계약 이행 중 분쟁이 발생할 경우 상호 협의하여 해결한다.</li>
<li>본 계약의 변경은 양 당사자의 서면 합의에 의해서만 가능하다.</li>
</ul>

<div style="margin-top: 50px; text-align: center;">
<p><strong>${formatDate(formData.contractDate)}</strong></p>
</div>

<table style="width: 100%; margin-top: 30px; border-collapse: collapse;">
<tr>
<td style="width: 50%; text-align: center; padding: 20px; border: 1px solid #ddd;">
<strong>갑 (발주자)</strong><br><br>
${formData.clientCompany}<br>
대표이사 ${formData.clientRepresentative}<br><br>
(인)
</td>
<td style="width: 50%; text-align: center; padding: 20px; border: 1px solid #ddd;">
<strong>을 (수급자)</strong><br><br>
${formData.supplierCompany}<br>
대표이사 ${formData.supplierRepresentative}<br><br>
(인)
</td>
</tr>
</table>

</div>
    `.trim();
  }
};

export default contractGenerator;