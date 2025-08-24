// scripts/testUSContract.js - 실제 미국 계약서 조항 분석 테스트

import { analyzeContractClauses } from '../lib/contractClauseAnalyzer.js';

// 실제 미국 계약서 샘플
const usContractSample = `
Section 1. Purpose and Scope
This Agreement establishes the terms and conditions for the provision of software development services by Contractor to Client. The services shall include custom software development, system integration, and technical support as specified in the attached Statement of Work.

Section 2. Payment Terms
Client agrees to pay Contractor the fees as set forth in the Statement of Work. Payment is due within thirty (30) days of receipt of invoice. Late payments shall incur interest at the rate of 1.5% per month.

Section 3. Confidentiality
Both parties acknowledge that they may have access to confidential information. Each party agrees to maintain in confidence all confidential information received from the other party and to use such information solely for the purposes of this Agreement.

Section 4. Limitation of Liability
IN NO EVENT SHALL EITHER PARTY BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR USE, ARISING OUT OF OR RELATING TO THIS AGREEMENT.

Section 5. Intellectual Property
All intellectual property rights in the deliverables created under this Agreement shall vest in Client upon full payment of all fees due under this Agreement.

Section 6. Termination
Either party may terminate this Agreement upon thirty (30) days written notice to the other party. Upon termination, all unpaid fees shall become immediately due and payable.

Section 7. Governing Law
This Agreement shall be governed by and construed in accordance with the laws of the State of California, without regard to its conflict of laws principles.

Section 8. Dispute Resolution
Any dispute arising out of or relating to this Agreement shall be resolved through binding arbitration in accordance with the Commercial Arbitration Rules of the American Arbitration Association.
`;

async function main() {
  console.log('🇺🇸 실제 미국 계약서 조항 분석 테스트...\n');
  
  try {
    // 미국 계약서 분석
    const result = await analyzeContractClauses(usContractSample, {
      countryCode: 'us',
      language: 'en',
      industry: 'tech',
      category: 'service_agreement',
      templateName: 'US Software Development Agreement'
    });
    
    if (!result.success) {
      console.error('❌ 분석 실패:', result.error);
      return;
    }
    
    console.log('📊 분석 결과 요약:');
    console.log(`- 추출된 조항: ${result.clauses.length}개`);
    console.log(`- 전체 위험도: ${result.metadata.overallRisk}/10`);
    console.log(`- 평균 신뢰도: ${result.statistics.averageConfidence.toFixed(2)}`);
    console.log(`- 평균 위험도: ${result.statistics.averageRiskScore.toFixed(2)}\n`);
    
    console.log('📋 추출된 조항 목록:');
    result.clauses.forEach((clause, index) => {
      console.log(`${index + 1}. ${clause.title}`);
      console.log(`   카테고리: ${clause.category} (신뢰도: ${clause.confidence.toFixed(2)})`);
      console.log(`   위험도: ${clause.analysis.riskScore}/10 (가중치: ${clause.analysis.weightedRisk.toFixed(1)})`);
      console.log(`   중요도: ${clause.analysis.importance.toUpperCase()}`);
      if (clause.analysis.countryRecommendations.length > 0) {
        clause.analysis.countryRecommendations.forEach(rec => {
          console.log(`   💡 권고: ${rec}`);
        });
      }
      console.log('');
    });
    
    // 국가별 분석 결과
    if (result.countryAnalysis) {
      console.log('🇺🇸 미국 특화 분석:');
      console.log(`- 법계: ${result.countryAnalysis.profile.legalSystem}`);
      console.log(`- 중재 선호: ${result.countryAnalysis.profile.arbitrationPreference ? 'Yes' : 'No'}`);
      console.log(`- 전체 위험도: ${result.countryAnalysis.riskAnalysis.overallRisk}/10`);
      
      if (result.countryAnalysis.countrySpecificIssues.length > 0) {
        console.log('\n⚠️ 미국 특화 이슈:');
        result.countryAnalysis.countrySpecificIssues.forEach(issue => {
          console.log(`  ${issue.severity.toUpperCase()}: ${issue.message}`);
        });
      }
      
      if (result.countryAnalysis.legalValidation.riskTermsFound.length > 0) {
        console.log('\n📚 발견된 위험 용어:');
        result.countryAnalysis.legalValidation.riskTermsFound.forEach(term => {
          console.log(`  - ${term.term} (위험도: ${term.riskLevel}/10)`);
        });
      }
    }
    
    // 카테고리별 통계
    console.log('\n📊 카테고리별 분포:');
    Object.entries(result.statistics.byCategory).forEach(([category, count]) => {
      console.log(`- ${category}: ${count}개`);
    });
    
    console.log('\n✅ 미국 계약서 분석 완료!');
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error);
  }
}

main();