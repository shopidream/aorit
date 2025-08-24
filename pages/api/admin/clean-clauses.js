// pages/api/admin/clean-clauses.js - 웹에서 국가별 조항 삭제 API
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// 30개국 지원
const COUNTRIES = {
  // 아시아-태평양
  kr: { name: '한국', flag: '🇰🇷', legalSystem: 'civil_law', language: 'ko' },
  jp: { name: '일본', flag: '🇯🇵', legalSystem: 'civil_law', language: 'ja' },
  tw: { name: '대만', flag: '🇹🇼', legalSystem: 'civil_law', language: 'zh-TW' },
  sg: { name: '싱가포르', flag: '🇸🇬', legalSystem: 'common_law', language: 'en' },
  hk: { name: '홍콩', flag: '🇭🇰', legalSystem: 'common_law', language: 'en' },
  my: { name: '말레이시아', flag: '🇲🇾', legalSystem: 'mixed_law', language: 'en' },
  th: { name: '태국', flag: '🇹🇭', legalSystem: 'civil_law', language: 'th' },
  ph: { name: '필리핀', flag: '🇵🇭', legalSystem: 'common_law', language: 'en' },
  in: { name: '인도', flag: '🇮🇳', legalSystem: 'common_law', language: 'en' },
  au: { name: '호주', flag: '🇦🇺', legalSystem: 'common_law', language: 'en' },
  nz: { name: '뉴질랜드', flag: '🇳🇿', legalSystem: 'common_law', language: 'en' },

  // 북미
  us: { name: '미국', flag: '🇺🇸', legalSystem: 'common_law', language: 'en' },
  ca: { name: '캐나다', flag: '🇨🇦', legalSystem: 'common_law', language: 'en' },
  mx: { name: '멕시코', flag: '🇲🇽', legalSystem: 'civil_law', language: 'es' },

  // 유럽
  uk: { name: '영국', flag: '🇬🇧', legalSystem: 'common_law', language: 'en' },
  ie: { name: '아일랜드', flag: '🇮🇪', legalSystem: 'common_law', language: 'en' },
  de: { name: '독일', flag: '🇩🇪', legalSystem: 'civil_law', language: 'de' },
  fr: { name: '프랑스', flag: '🇫🇷', legalSystem: 'civil_law', language: 'fr' },
  es: { name: '스페인', flag: '🇪🇸', legalSystem: 'civil_law', language: 'es' },
  it: { name: '이탈리아', flag: '🇮🇹', legalSystem: 'civil_law', language: 'it' },
  nl: { name: '네덜란드', flag: '🇳🇱', legalSystem: 'civil_law', language: 'nl' },
  be: { name: '벨기에', flag: '🇧🇪', legalSystem: 'civil_law', language: 'nl' },
  ch: { name: '스위스', flag: '🇨🇭', legalSystem: 'civil_law', language: 'de' },
  se: { name: '스웨덴', flag: '🇸🇪', legalSystem: 'civil_law', language: 'sv' },
  no: { name: '노르웨이', flag: '🇳🇴', legalSystem: 'civil_law', language: 'no' },
  dk: { name: '덴마크', flag: '🇩🇰', legalSystem: 'civil_law', language: 'da' },
  fi: { name: '핀란드', flag: '🇫🇮', legalSystem: 'civil_law', language: 'fi' },
  pl: { name: '폴란드', flag: '🇵🇱', legalSystem: 'civil_law', language: 'pl' },
  ru: { name: '러시아', flag: '🇷🇺', legalSystem: 'civil_law', language: 'ru' },

  // 중동
  ae: { name: 'UAE', flag: '🇦🇪', legalSystem: 'mixed_law', language: 'en' },

  // 남미
  br: { name: '브라질', flag: '🇧🇷', legalSystem: 'civil_law', language: 'pt' },

  // 아프리카
  za: { name: '남아공', flag: '🇿🇦', legalSystem: 'mixed_law', language: 'en' }
};

export default async function handler(req, res) {
  try {
    // JWT 토큰 검증
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '인증이 필요합니다' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ error: '유효하지 않은 토큰입니다' });
    }

    // 관리자 권한 확인
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: '관리자 권한이 필요합니다' });
    }

    const { method } = req;

    switch (method) {
      case 'GET':
        // 국가별 현황 조회
        const stats = await getCountryTemplateStats();
        return res.status(200).json({
          success: true,
          countryStats: stats,
          countries: COUNTRIES
        });

      case 'DELETE':
        // 선택된 국가들 삭제
        const { countries } = req.body;
        
        if (!countries || !Array.isArray(countries) || countries.length === 0) {
          return res.status(400).json({ error: '삭제할 국가를 선택해주세요' });
        }

        // 유효한 국가 코드 검증
        const validCountries = countries.filter(country => COUNTRIES[country]);
        if (validCountries.length === 0) {
          return res.status(400).json({ error: '유효한 국가 코드가 없습니다' });
        }

        const result = await cleanSelectedCountries(validCountries);
        return res.status(200).json({
          success: true,
          message: `${validCountries.length}개 국가 데이터 삭제 완료`,
          deletedCountries: validCountries,
          deletedData: result
        });

      default:
        res.setHeader('Allow', ['GET', 'DELETE']);
        return res.status(405).json({ error: '지원하지 않는 메소드입니다' });
    }

  } catch (error) {
    console.error('❌ Clean Clauses API 오류:', error);
    return res.status(500).json({ 
      error: '서버 오류가 발생했습니다',
      details: error.message 
    });
  }
}

/**
 * 국가별 템플릿 통계 조회
 */
async function getCountryTemplateStats() {
  const [templates, candidates, sources] = await Promise.all([
    prisma.contractTemplate.findMany({
      select: { countryCode: true }
    }),
    prisma.clauseCandidate.findMany({
      select: { countryCode: true }
    }),
    prisma.sourceContract.findMany({
      select: { countryCode: true }
    })
  ]);

  const stats = {};

  // 템플릿 카운트
  templates.forEach(template => {
    const code = template.countryCode;
    if (code && code.trim() !== '') {
      if (!stats[code]) stats[code] = {};
      stats[code].templates = (stats[code].templates || 0) + 1;
    }
  });

  // 조항 후보 카운트
  candidates.forEach(candidate => {
    const code = candidate.countryCode;
    if (code && code.trim() !== '') {
      if (!stats[code]) stats[code] = {};
      stats[code].candidates = (stats[code].candidates || 0) + 1;
    }
  });

  // 원본 계약서 카운트
  sources.forEach(source => {
    const code = source.countryCode;
    if (code && code.trim() !== '') {
      if (!stats[code]) stats[code] = {};
      stats[code].sources = (stats[code].sources || 0) + 1;
    }
  });

  return stats;
}

/**
 * 선택된 국가들의 데이터 삭제
 */
async function cleanSelectedCountries(selectedCountries) {
  const result = await prisma.$transaction(async (tx) => {
    // 1. 조항 후보 삭제
    const deletedCandidates = await tx.clauseCandidate.deleteMany({
      where: { countryCode: { in: selectedCountries } }
    });

    // 2. 원본 계약서 삭제
    const deletedSources = await tx.sourceContract.deleteMany({
      where: { countryCode: { in: selectedCountries } }
    });

    // 3. 템플릿 참조 정리
    const templateIds = await tx.contractTemplate.findMany({
      where: { countryCode: { in: selectedCountries } },
      select: { id: true }
    });

    const templateIdList = templateIds.map(t => t.id);

    let affectedContracts = 0;
    if (templateIdList.length > 0) {
      const contractsUsing = await tx.contract.findMany({
        where: { templateId: { in: templateIdList } },
        select: { id: true }
      });

      affectedContracts = contractsUsing.length;

      if (affectedContracts > 0) {
        await tx.contract.updateMany({
          where: { templateId: { in: templateIdList } },
          data: { templateId: null }
        });
      }
    }

    // 4. 템플릿 삭제
    const deletedTemplates = await tx.contractTemplate.deleteMany({
      where: { countryCode: { in: selectedCountries } }
    });

    return {
      templates: deletedTemplates.count,
      candidates: deletedCandidates.count,
      sources: deletedSources.count,
      affectedContracts
    };
  });

  return result;
}