// lib/countryManager.js - 다국어 국가별 법적 특성 관리 시스템

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 지원 국가 목록 (20개국)
 */
export const SUPPORTED_COUNTRIES = {
  // 아시아
  kr: { name: 'South Korea', language: 'ko', legalSystem: 'civil_law' },
  jp: { name: 'Japan', language: 'ja', legalSystem: 'civil_law' },
  sg: { name: 'Singapore', language: 'en', legalSystem: 'common_law' },
  hk: { name: 'Hong Kong', language: 'en', legalSystem: 'common_law' },
  
  // 북미
  us: { name: 'United States', language: 'en', legalSystem: 'common_law' },
  ca: { name: 'Canada', language: 'en', legalSystem: 'common_law' },
  
  // 유럽
  uk: { name: 'United Kingdom', language: 'en', legalSystem: 'common_law' },
  au: { name: 'Australia', language: 'en', legalSystem: 'common_law' },
  nz: { name: 'New Zealand', language: 'en', legalSystem: 'common_law' },
  ie: { name: 'Ireland', language: 'en', legalSystem: 'common_law' },
  de: { name: 'Germany', language: 'de', legalSystem: 'civil_law' },
  fr: { name: 'France', language: 'fr', legalSystem: 'civil_law' },
  nl: { name: 'Netherlands', language: 'nl', legalSystem: 'civil_law' },
  be: { name: 'Belgium', language: 'nl', legalSystem: 'civil_law' },
  ch: { name: 'Switzerland', language: 'de', legalSystem: 'civil_law' },
  
  // 북유럽
  se: { name: 'Sweden', language: 'sv', legalSystem: 'civil_law' },
  no: { name: 'Norway', language: 'no', legalSystem: 'civil_law' },
  dk: { name: 'Denmark', language: 'da', legalSystem: 'civil_law' },
  fi: { name: 'Finland', language: 'fi', legalSystem: 'civil_law' },
  
  // 중동
  ae: { name: 'United Arab Emirates', language: 'en', legalSystem: 'mixed_law' }
};

/**
 * 국가별 법적 프로파일 조회
 */
export async function getCountryProfile(countryCode) {
  if (!SUPPORTED_COUNTRIES[countryCode]) {
    throw new Error(`지원하지 않는 국가입니다: ${countryCode}`);
  }

  try {
    let profile = await prisma.countryLegalProfile.findUnique({
      where: { countryCode },
      include: {
        standardClauses: true,
        legalTerms: true
      }
    });

    // 프로파일이 없으면 기본값으로 생성
    if (!profile) {
      profile = await createDefaultCountryProfile(countryCode);
    }

    return profile;
  } catch (error) {
    console.error(`국가 프로파일 조회 실패 (${countryCode}):`, error);
    return null;
  }
}

/**
 * 기본 국가 프로파일 생성
 */
async function createDefaultCountryProfile(countryCode) {
  const countryInfo = SUPPORTED_COUNTRIES[countryCode];
  const defaultProfiles = getDefaultLegalProfiles();
  const defaultProfile = defaultProfiles[countryCode];

  try {
    const profile = await prisma.countryLegalProfile.create({
      data: {
        countryCode,
        countryName: countryInfo.name,
        language: countryInfo.language,
        legalSystem: countryInfo.legalSystem,
        ...defaultProfile
      }
    });

    console.log(`✅ 기본 프로파일 생성: ${countryCode} - ${countryInfo.name}`);
    return profile;
  } catch (error) {
    console.error(`기본 프로파일 생성 실패 (${countryCode}):`, error);
    throw error;
  }
}

/**
 * 국가별 기본 법적 특성 정의
 */
function getDefaultLegalProfiles() {
  return {
    // 한국 (기존)
    kr: {
      preferredDispute: 'court',
      arbitrationPreference: false,
      governingLawRequired: true,
      confidentialityRequired: true,
      terminationNoticeRequired: true,
      dataProtectionRequired: false,
      promptTemplate: '한국 계약법 전문가로서 다음 조항들을 분석해주세요...',
      riskWeights: JSON.stringify({
        liability: 0.8,
        termination: 0.7,
        confidentiality: 0.6,
        payment: 0.9
      })
    },

    // 미국
    us: {
      preferredDispute: 'arbitration',
      arbitrationPreference: true,
      governingLawRequired: true,
      confidentialityRequired: true,
      terminationNoticeRequired: true,
      dataProtectionRequired: false,
      promptTemplate: 'As a US contract law expert, analyze the following clauses considering state and federal law requirements...',
      riskWeights: JSON.stringify({
        liability: 0.9,
        termination: 0.8,
        intellectual_property: 0.85,
        confidentiality: 0.7,
        force_majeure: 0.6
      })
    },

    // 영국
    uk: {
      preferredDispute: 'court',
      arbitrationPreference: false,
      governingLawRequired: true,
      confidentialityRequired: true,
      terminationNoticeRequired: true,
      dataProtectionRequired: true, // GDPR
      promptTemplate: 'As a UK contract law expert familiar with English law and GDPR requirements...',
      riskWeights: JSON.stringify({
        data_protection: 0.95,
        liability: 0.8,
        termination: 0.75,
        confidentiality: 0.7
      })
    },

    // 독일
    de: {
      preferredDispute: 'court',
      arbitrationPreference: false,
      governingLawRequired: true,
      confidentialityRequired: true,
      terminationNoticeRequired: true,
      dataProtectionRequired: true, // GDPR
      promptTemplate: 'Als deutscher Vertragsrechtsexperte analysieren Sie die folgenden Klauseln unter Berücksichtigung des deutschen Rechts...',
      riskWeights: JSON.stringify({
        data_protection: 0.95,
        liability: 0.85,
        termination: 0.8,
        employee_rights: 0.9
      })
    },

    // 일본
    jp: {
      preferredDispute: 'court',
      arbitrationPreference: false,
      governingLawRequired: true,
      confidentialityRequired: true,
      terminationNoticeRequired: true,
      dataProtectionRequired: false,
      promptTemplate: '日本の契約法専門家として、以下の条項を民法および商法の観点から分析してください...',
      riskWeights: JSON.stringify({
        liability: 0.8,
        termination: 0.85,
        confidentiality: 0.75,
        force_majeure: 0.7
      })
    },

    // UAE
    ae: {
      preferredDispute: 'arbitration',
      arbitrationPreference: true,
      governingLawRequired: true,
      confidentialityRequired: true,
      terminationNoticeRequired: true,
      dataProtectionRequired: false,
      promptTemplate: 'As a UAE contract law expert familiar with UAE Civil Code and Sharia principles...',
      riskWeights: JSON.stringify({
        liability: 0.8,
        sharia_compliance: 0.9,
        termination: 0.75,
        confidentiality: 0.7
      })
    }
  };
}

/**
 * 국가별 표준 조항 조회
 */
export async function getStandardClauses(countryCode, clauseType = null) {
  try {
    const whereClause = { countryCode };
    if (clauseType) {
      whereClause.clauseType = clauseType;
    }

    const clauses = await prisma.standardClause.findMany({
      where: whereClause,
      orderBy: [
        { isRequired: 'desc' },
        { riskLevel: 'desc' },
        { usageCount: 'desc' }
      ]
    });

    return clauses;
  } catch (error) {
    console.error(`표준 조항 조회 실패 (${countryCode}):`, error);
    return [];
  }
}

/**
 * 국가별 법적 용어 검증
 */
export async function validateLegalTerms(content, countryCode) {
  try {
    const terms = await prisma.legalTermDictionary.findMany({
      where: { countryCode }
    });

    const riskTerms = [];
    const content_lower = content.toLowerCase();

    terms.forEach(term => {
      if (content_lower.includes(term.term.toLowerCase()) && term.riskLevel >= 3) {
        riskTerms.push({
          term: term.term,
          riskLevel: term.riskLevel,
          definition: term.definition,
          alternatives: term.alternatives ? JSON.parse(term.alternatives) : []
        });
      }
    });

    return {
      totalTerms: terms.length,
      riskTermsFound: riskTerms,
      overallRisk: riskTerms.length > 0 ? Math.max(...riskTerms.map(t => t.riskLevel)) : 1
    };
  } catch (error) {
    console.error(`법적 용어 검증 실패 (${countryCode}):`, error);
    return { totalTerms: 0, riskTermsFound: [], overallRisk: 1 };
  }
}

/**
 * 국가별 위험도 계산
 */
export async function calculateCountryRisk(clauses, countryCode) {
  try {
    const profile = await getCountryProfile(countryCode);
    if (!profile || !profile.riskWeights) {
      return { overallRisk: 5, clauseRisks: [] };
    }

    const riskWeights = JSON.parse(profile.riskWeights);
    const clauseRisks = [];
    let totalWeightedRisk = 0;
    let totalWeight = 0;

    clauses.forEach(clause => {
      const clauseType = clause.category || clause.type || 'general';
      const weight = riskWeights[clauseType] || 0.5;
      const baseRisk = clause.riskScore || 3;
      
      const weightedRisk = baseRisk * weight;
      
      clauseRisks.push({
        clauseId: clause.id,
        clauseType,
        baseRisk,
        weight,
        weightedRisk,
        recommendations: generateCountrySpecificRecommendations(clause, countryCode, profile)
      });

      totalWeightedRisk += weightedRisk;
      totalWeight += weight;
    });

    const overallRisk = totalWeight > 0 ? Math.round(totalWeightedRisk / totalWeight) : 5;

    return {
      overallRisk: Math.min(Math.max(overallRisk, 1), 10),
      clauseRisks,
      countrySpecificIssues: await identifyCountrySpecificIssues(clauses, countryCode, profile)
    };
  } catch (error) {
    console.error(`국가별 위험도 계산 실패 (${countryCode}):`, error);
    return { overallRisk: 5, clauseRisks: [] };
  }
}

/**
 * 국가별 맞춤 권고사항 생성
 */
function generateCountrySpecificRecommendations(clause, countryCode, profile) {
  const recommendations = [];
  const content = clause.content.toLowerCase();

  // 국가별 특화 권고사항
  switch (countryCode) {
    case 'us':
      if (content.includes('governing law') && !content.includes('state')) {
        recommendations.push('미국의 경우 주별 법 적용을 명시해야 합니다.');
      }
      if (profile.arbitrationPreference && !content.includes('arbitration')) {
        recommendations.push('미국에서는 중재 조항 추가를 권장합니다.');
      }
      break;

    case 'uk':
    case 'de':
    case 'fr':
      if (!content.includes('gdpr') && !content.includes('data protection')) {
        recommendations.push('EU GDPR 준수 조항이 필요합니다.');
      }
      break;

    case 'ae':
      if (content.includes('interest') && !content.includes('sharia')) {
        recommendations.push('UAE에서는 샤리아 법 준수를 고려해야 합니다.');
      }
      break;

    case 'jp':
      if (content.includes('termination') && !content.includes('notice')) {
        recommendations.push('일본에서는 계약 해지 시 상세한 통지 절차가 중요합니다.');
      }
      break;
  }

  return recommendations;
}

/**
 * 국가별 특화 이슈 식별
 */
async function identifyCountrySpecificIssues(clauses, countryCode, profile) {
  const issues = [];

  // 필수 조항 누락 체크
  if (profile.governingLawRequired) {
    const hasGoverningLaw = clauses.some(c => 
      c.content.toLowerCase().includes('governing law') || 
      c.content.toLowerCase().includes('준거법')
    );
    if (!hasGoverningLaw) {
      issues.push({
        type: 'missing_required_clause',
        severity: 'high',
        message: '준거법 조항이 누락되었습니다.',
        countryCode
      });
    }
  }

  if (profile.dataProtectionRequired) {
    const hasDataProtection = clauses.some(c => 
      c.content.toLowerCase().includes('data protection') || 
      c.content.toLowerCase().includes('gdpr') ||
      c.content.toLowerCase().includes('개인정보')
    );
    if (!hasDataProtection) {
      issues.push({
        type: 'missing_data_protection',
        severity: 'high',
        message: 'GDPR/개인정보보호 조항이 필요합니다.',
        countryCode
      });
    }
  }

  return issues;
}

/**
 * 지원 국가 목록 조회
 */
export function getSupportedCountries() {
  return Object.keys(SUPPORTED_COUNTRIES).map(code => ({
    code,
    ...SUPPORTED_COUNTRIES[code]
  }));
}

/**
 * 국가별 조항 카테고리 조회 (다국어)
 */
export async function getCountryClauseCategories(countryCode) {
  try {
    const categories = await prisma.clauseCategory.findMany({
      where: {
        countryCode,
        isActive: true
      },
      orderBy: [
        { level: 'asc' },
        { name: 'asc' }
      ],
      include: {
        children: {
          where: { isActive: true },
          orderBy: { name: 'asc' }
        }
      }
    });

    return categories;
  } catch (error) {
    console.error(`국가별 조항 카테고리 조회 실패 (${countryCode}):`, error);
    
    // 기본 한국어 카테고리 반환
    return await prisma.clauseCategory.findMany({
      where: {
        countryCode: 'kr',
        isActive: true
      },
      orderBy: [{ level: 'asc' }, { name: 'asc' }]
    });
  }
}

/**
 * 국가별 통계 조회
 */
export async function getCountryStats(countryCode) {
  try {
    const stats = await Promise.all([
      prisma.contractTemplate.count({ where: { countryCode } }),
      prisma.sourceContract.count({ where: { countryCode } }),
      prisma.clauseCandidate.count({ where: { countryCode } }),
      prisma.standardClause.count({ where: { countryCode } })
    ]);

    return {
      countryCode,
      templates: stats[0],
      sourceContracts: stats[1],
      clauseCandidates: stats[2],
      standardClauses: stats[3],
      lastUpdated: new Date()
    };
  } catch (error) {
    console.error(`국가별 통계 조회 실패 (${countryCode}):`, error);
    return {
      countryCode,
      templates: 0,
      sourceContracts: 0,
      clauseCandidates: 0,
      standardClauses: 0,
      lastUpdated: new Date()
    };
  }
}

/**
 * 모든 지원 국가의 기본 프로파일 초기화
 */
export async function initializeAllCountryProfiles() {
  const results = [];
  
  for (const countryCode of Object.keys(SUPPORTED_COUNTRIES)) {
    try {
      const existing = await prisma.countryLegalProfile.findUnique({
        where: { countryCode }
      });

      if (!existing) {
        const profile = await createDefaultCountryProfile(countryCode);
        results.push({ countryCode, status: 'created', profile });
      } else {
        results.push({ countryCode, status: 'exists', profile: existing });
      }
    } catch (error) {
      results.push({ countryCode, status: 'error', error: error.message });
    }
  }

  return results;
}