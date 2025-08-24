// scripts/testUSAnalysis.js - 미국 계약서 분석 테스트

import { getCountryProfile, calculateCountryRisk, validateLegalTerms } from '../lib/countryManager.js';

// 테스트용 미국 계약서 조항들
const testClauses = [
  {
    id: 1,
    title: 'Governing Law',
    content: 'This Agreement shall be governed by the laws of California',
    category: 'governing_law',
    riskScore: 3
  },
  {
    id: 2,
    title: 'Limitation of Liability',
    content: 'In no event shall either party be liable for any indirect damages',
    category: 'liability',
    riskScore: 7
  },
  {
    id: 3,
    title: 'Confidentiality',
    content: 'Both parties agree to maintain confidentiality of all information',
    category: 'confidentiality',
    riskScore: 4
  },
  {
    id: 4,
    title: 'Termination',
    content: 'Either party may terminate this agreement with 30 days notice',
    category: 'termination',
    riskScore: 5
  }
];

async function main() {
  console.log('🇺🇸 미국 계약서 분석 테스트 시작...\n');
  
  try {
    // 1. 미국 프로파일 조회
    console.log('1️⃣ 미국 법적 프로파일 조회:');
    const profile = await getCountryProfile('us');
    console.log(`- 국가: ${profile.countryName}`);
    console.log(`- 법계: ${profile.legalSystem}`);
    console.log(`- 중재 선호: ${profile.arbitrationPreference ? 'Yes' : 'No'}`);
    console.log(`- GDPR 필요: ${profile.dataProtectionRequired ? 'Yes' : 'No'}\n`);
    
    // 2. 조항별 위험도 계산
    console.log('2️⃣ 조항별 위험도 분석:');
    const riskAnalysis = await calculateCountryRisk(testClauses, 'us');
    console.log(`- 전체 위험도: ${riskAnalysis.overallRisk}/10`);
    
    riskAnalysis.clauseRisks.forEach(clause => {
      console.log(`  📋 ${clause.clauseType}: 위험도 ${clause.weightedRisk.toFixed(1)} (가중치: ${clause.weight})`);
      if (clause.recommendations.length > 0) {
        clause.recommendations.forEach(rec => {
          console.log(`    💡 권고: ${rec}`);
        });
      }
    });
    
    // 3. 특화 이슈 확인
    if (riskAnalysis.countrySpecificIssues.length > 0) {
      console.log('\n3️⃣ 미국 특화 이슈:');
      riskAnalysis.countrySpecificIssues.forEach(issue => {
        console.log(`  ⚠️ ${issue.severity.toUpperCase()}: ${issue.message}`);
      });
    }
    
    // 4. 법적 용어 검증
    const contractText = testClauses.map(c => c.content).join(' ');
    console.log('\n4️⃣ 법적 용어 검증:');
    const termValidation = await validateLegalTerms(contractText, 'us');
    console.log(`- 총 용어 수: ${termValidation.totalTerms}`);
    console.log(`- 위험 용어 발견: ${termValidation.riskTermsFound.length}개`);
    console.log(`- 전체 위험도: ${termValidation.overallRisk}/10`);
    
    console.log('\n✅ 미국 계약서 분석 테스트 완료!');
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error);
  }
}

main();