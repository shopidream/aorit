// pages/api/templates/match.js - 템플릿 매칭 API
import { verifyToken } from '../../../lib/auth';
import { matchTemplate, logTemplateUsage } from '../../../lib/templateMatcher';
import { processTemplateToContract, processCustomVariables, extractVariables } from '../../../lib/templateProcessor';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 인증 확인
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '인증 토큰이 필요합니다' });
    }

    let userId;
    try {
      const decoded = verifyToken(token);
      userId = decoded.userId;
    } catch (error) {
      return res.status(401).json({ error: '유효하지 않은 토큰입니다' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    });

    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    const { action, quoteId, customVariables } = req.body;

    switch (action) {
      case 'find_templates':
        return await handleFindTemplates(quoteId, user, res);
      
      case 'generate_contract':
        return await handleGenerateContract(req.body, user, res);
      
      case 'preview_clause':
        return await handlePreviewClause(req.body, user, res);
        
      default:
        return res.status(400).json({ error: '유효하지 않은 액션입니다' });
    }

  } catch (error) {
    console.error('템플릿 매칭 API 오류:', error);
    return res.status(500).json({
      error: '서버 오류',
      details: error.message
    });
  } finally {
    await prisma.$disconnect();
  }
}

// 견적서 기반 템플릿 찾기
async function handleFindTemplates(quoteId, user, res) {
  if (!quoteId) {
    return res.status(400).json({ error: 'quoteId가 필요합니다' });
  }

  try {
    // 견적서 조회
    const quote = await prisma.quote.findFirst({
      where: { 
        id: parseInt(quoteId),
        userId: user.id 
      },
      include: {
        client: true
      }
    });

    if (!quote) {
      return res.status(404).json({ error: '견적서를 찾을 수 없습니다' });
    }

    // 견적서 데이터 구성
    const quoteData = {
      ...quote,
      client: quote.client || {
        name: '고객명 없음',
        email: '',
        company: '',
        phone: ''
      }
    };

    // 템플릿 매칭 실행
    const matchResult = await matchTemplate(quoteData);

    if (!matchResult.success) {
      return res.status(500).json({
        error: '템플릿 매칭 실패',
        details: matchResult.error
      });
    }

    return res.status(200).json({
      success: true,
      quoteInfo: {
        id: quote.id,
        title: quote.title,
        amount: quote.amount,
        client: quoteData.client
      },
      ...matchResult
    });

  } catch (error) {
    console.error('템플릿 찾기 오류:', error);
    return res.status(500).json({
      error: '템플릿 찾기 실패',
      details: error.message
    });
  }
}

// 템플릿 기반 계약서 생성
async function handleGenerateContract(requestData, user, res) {
  const { quoteId, selectedTemplates, customVariables = {} } = requestData;

  if (!quoteId || !selectedTemplates || selectedTemplates.length === 0) {
    return res.status(400).json({ 
      error: 'quoteId와 selectedTemplates가 필요합니다' 
    });
  }

  try {
    // 견적서 조회
    const quote = await prisma.quote.findFirst({
      where: { 
        id: parseInt(quoteId),
        userId: user.id 
      },
      include: { client: true }
    });

    if (!quote) {
      return res.status(404).json({ error: '견적서를 찾을 수 없습니다' });
    }

    // 선택된 템플릿들 조회
    const templates = await prisma.contractTemplate.findMany({
      where: {
        id: { in: selectedTemplates },
        isActive: true
      },
      orderBy: { id: 'asc' }
    });

    if (templates.length === 0) {
      return res.status(404).json({ error: '선택된 템플릿을 찾을 수 없습니다' });
    }

    // 계약 데이터 구성
    const contractData = buildContractData(quote, user);

    // 템플릿을 계약서 조항으로 변환
    const clauses = processTemplateToContract(templates, contractData);

    // 사용자 정의 변수 추가 처리
    const finalClauses = clauses.map(clause => ({
      ...clause,
      content: processCustomVariables(clause.content, customVariables)
    }));

    // 계약서 생성
    const contract = await prisma.contract.create({
      data: {
        userId: user.id,
        clientId: quote.clientId,
        quoteId: quote.id,
        title: `${contractData.serviceName} 서비스 계약서`,
        type: 'template_generated',
        status: 'pending',
        amount: contractData.amount,
        content: JSON.stringify({
          contractInfo: {
            title: `${contractData.serviceName} 서비스 계약서`,
            client: contractData.client,
            provider: contractData.provider,
            project: {
              services: contractData.services,
              totalAmount: contractData.amount,
              duration: contractData.duration
            }
          },
          clauses: finalClauses
        }),
        metadata: JSON.stringify({
          generatedBy: 'template-system',
          templateIds: selectedTemplates,
          templateCount: templates.length,
          customVariables,
          generatedAt: new Date().toISOString()
        })
      }
    });

    // 개별 조항들도 저장
    const clausePromises = finalClauses.map((clause, index) => 
      prisma.clause.create({
        data: {
          contractId: contract.id,
          title: clause.title,
          type: clause.category,
          content: clause.content,
          essential: clause.essential,
          order: index + 1
        }
      })
    );

    await Promise.all(clausePromises);

    // 템플릿 사용 로그 기록
    await logTemplateUsage(quote.id, contract.id, { matches: { templates } });

    return res.status(201).json({
      success: true,
      contract: {
        id: contract.id,
        title: contract.title,
        status: contract.status,
        amount: contract.amount,
        createdAt: contract.createdAt
      },
      clauses: finalClauses,
      analytics: {
        templatesUsed: templates.length,
        clausesGenerated: finalClauses.length,
        customVariablesApplied: Object.keys(customVariables).length
      }
    });

  } catch (error) {
    console.error('계약서 생성 오류:', error);
    return res.status(500).json({
      error: '계약서 생성 실패',
      details: error.message
    });
  }
}

// 조항 미리보기
async function handlePreviewClause(requestData, user, res) {
  const { templateId, quoteId, customVariables = {} } = requestData;

  if (!templateId || !quoteId) {
    return res.status(400).json({ 
      error: 'templateId와 quoteId가 필요합니다' 
    });
  }

  try {
    // 템플릿 조회
    const template = await prisma.contractTemplate.findUnique({
      where: { id: templateId }
    });

    if (!template) {
      return res.status(404).json({ error: '템플릿을 찾을 수 없습니다' });
    }

    // 견적서 조회
    const quote = await prisma.quote.findFirst({
      where: { 
        id: parseInt(quoteId),
        userId: user.id 
      },
      include: { client: true }
    });

    if (!quote) {
      return res.status(404).json({ error: '견적서를 찾을 수 없습니다' });
    }

    // 계약 데이터 구성
    const contractData = buildContractData(quote, user);

    // 템플릿 처리
    const processedClauses = processTemplateToContract([template], contractData);
    
    // 사용자 정의 변수 적용
    const finalClause = {
      ...processedClauses[0],
      content: processCustomVariables(processedClauses[0].content, customVariables)
    };

    return res.status(200).json({
      success: true,
      preview: {
        original: template.content,
        processed: finalClause.content,
        variables: extractVariables(template.content),
        template: {
          id: template.id,
          title: template.title,
          category: template.category,
          type: template.type
        }
      }
    });

  } catch (error) {
    console.error('조항 미리보기 오류:', error);
    return res.status(500).json({
      error: '미리보기 생성 실패',
      details: error.message
    });
  }
}

// 계약 데이터 구성 헬퍼 함수
function buildContractData(quote, user) {
  const services = JSON.parse(quote.items || '[]');
  const metadata = JSON.parse(quote.metadata || '{}');
  
  // 지급조건 파싱
  let paymentTerms = {};
  if (metadata.paymentTerms && metadata.paymentTerms.schedule) {
    const schedule = metadata.paymentTerms.schedule.sort((a, b) => a.order - b.order);
    
    schedule.forEach((item, index) => {
      if (index === 0) {
        paymentTerms.contractPercentage = item.percentage;
      } else if (index === 1) {
        paymentTerms.progressPercentage = item.percentage;
      } else if (index === 2) {
        paymentTerms.finalPercentage = item.percentage;
      }
    });
    
    // 지급 타이밍
    paymentTerms.contractTiming = metadata.options?.paymentTerms?.contractTiming || '계약과 동시';
    paymentTerms.progressTiming = metadata.options?.paymentTerms?.progressTiming || '중간 납품 시';
    paymentTerms.finalTiming = metadata.options?.paymentTerms?.finalTiming || '검수완료시';
  }

  return {
    client: {
      name: quote.client?.name || '발주자',
      email: quote.client?.email || '',
      phone: quote.client?.phone || '',
      company: quote.client?.company || ''
    },
    provider: {
      name: user.name || user.profile?.companyName || '수행자',
      email: user.email || '',
      phone: user.profile?.phone || user.profile?.companyPhone || '',
      company: user.profile?.companyName || ''
    },
    amount: metadata.pricing?.total || quote.amount || 0,
    duration: metadata.duration || '30일',
    deliveryDays: metadata.options?.deliveryDays || 30,
    inspectionDays: metadata.options?.inspectionDays || 10,
    services: services.map(item => ({
      serviceName: item.name || item.serviceName || '서비스',
      serviceDescription: item.description || item.serviceDescription || '',
      price: item.totalPrice || item.price || 0,
      quantity: item.quantity || 1
    })),
    serviceName: services.length > 1 
      ? `${services.length}개 서비스 통합 패키지`
      : services[0]?.name || services[0]?.serviceName || '서비스',
    paymentTerms
  };
}