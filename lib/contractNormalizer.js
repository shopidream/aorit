// lib/contractNormalizer.js - AI 기반 계약서 구조화

/**
 * JSON 파싱 실패시 간단한 구조 추출
 */
function extractSimpleStructure(aiResponse) {
    const clauses = [];
    
    // "title": "제목" 패턴으로 조항 제목 추출
    const titleMatches = aiResponse.matchAll(/"title":\s*"([^"]+)"/g);
    const titles = [...titleMatches].map(match => match[1]);
    
    // "content": "내용" 패턴으로 조항 내용 추출  
    const contentMatches = aiResponse.matchAll(/"content":\s*"([^"]+)"/g);
    const contents = [...contentMatches].map(match => match[1]);
    
    // 제목과 내용 매칭
    const minLength = Math.min(titles.length, contents.length);
    
    for (let i = 0; i < minLength; i++) {
      if (titles[i] && contents[i] && contents[i].length > 10) {
        clauses.push({
          number: i + 1,
          title: titles[i].replace(/\\"/g, '"').replace(/\\n/g, '\n'),
          content: contents[i].replace(/\\"/g, '"').replace(/\\n/g, '\n'),
          confidence: 0.6,
          type: 'ai_simple_extract'
        });
      }
    }
    
    return clauses;
  }
  
  /**
   * GPT-4o-mini를 사용한 계약서 구조화
   * 원본 내용 보존하면서 조항별로 파싱
   */
  
  export async function normalizeContract(rawText, options = {}) {
    try {
      if (!rawText || typeof rawText !== 'string') {
        throw new Error('유효하지 않은 텍스트입니다');
      }
  
      console.log('AI 기반 계약서 구조화 시작');
      console.log('원본 텍스트 길이:', rawText.length);
  
      // 토큰 길이 체크 (GPT-4o-mini 한계 고려)
      const estimatedTokens = rawText.length / 4;
      
      if (estimatedTokens > 25000) {
        console.log(`텍스트가 너무 깁니다 (${estimatedTokens} 토큰). 청크 단위로 처리합니다.`);
        return await processLongContractInChunks(rawText);
      }
  
      // GPT-4o-mini로 구조화 요청
      const structuredResult = await structureContractWithAI(rawText);
      
      if (!structuredResult.success) {
        console.log('AI 구조화 실패, 정규식 백업 사용');
        return await fallbackToRegexParsing(rawText);
      }
  
      // 결과 정규화
      const normalizedClauses = normalizeClauses(structuredResult.clauses);
      
      // 품질 검증
      const validation = validateNormalizedContract(normalizedClauses);
      
      return {
        success: true,
        original: rawText,
        normalized: {
          clauses: normalizedClauses,
          metadata: {
            originalLength: rawText.length,
            normalizedLength: normalizedClauses.reduce((sum, c) => sum + (c.content?.length || 0), 0),
            clauseCount: normalizedClauses.length,
            processingTime: Date.now(),
            confidence: calculateOverallConfidence(normalizedClauses),
            aiModel: 'gpt-4o-mini'
          }
        },
        validation,
        recommendations: generateBasicRecommendations(normalizedClauses)
      };
      
    } catch (error) {
      console.error('AI 정규화 에러:', error);
      return {
        success: false,
        error: error.message,
        original: rawText
      };
    }
  }
  
  /**
   * GPT-4o-mini를 사용한 계약서 구조화 (개선된 안정적 방식)
   */
  async function structureContractWithAI(rawText) {
    try {
      const openaiApiKey = process.env.OPENAI_API_KEY;
      if (!openaiApiKey) {
        throw new Error('OPENAI_API_KEY가 설정되지 않음');
      }
  
      // 먼저 조항 목록만 추출 (JSON 파싱 안정화)
      const structurePrompt = `다음 계약서에서 조항 구조만 추출하여 간단한 JSON으로 반환해주세요.
  
  계약서:
  ${rawText} // 제한 제거, 전체 텍스트 처리
  
  반환 형식 (조항 제목만):
  {
  "clauses": [
    {"number": n, "title": "조항 제목"}
  ]
}
  
  위 형식의 JSON만 반환:`;
  
      const structureResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: '계약서 전체 조항을 모두 추출하세요. 제한 없이 JSON 배열로 반환하세요.'
            },
            {
              role: 'user',
              content: structurePrompt
            }
          ],
          temperature: 0.1,
          max_tokens: 1000
        })
      });
  
      if (!structureResponse.ok) {
        throw new Error(`OpenAI API 오류: ${structureResponse.status}`);
      }
  
      const structureData = await structureResponse.json();
      const structureContent = structureData.choices?.[0]?.message?.content;
  
      if (!structureContent) {
        throw new Error('구조 추출 응답이 비어있습니다');
      }
  
      // 구조 JSON 파싱
      let clauseStructure;
      try {
        const cleanStructure = structureContent
          .replace(/```json\s*/g, '')
          .replace(/```\s*/g, '')
          .replace(/[""]/g, '"')
          .trim();
          
        const structureMatch = cleanStructure.match(/\{[\s\S]*\}/);
        clauseStructure = structureMatch ? JSON.parse(structureMatch[0]) : JSON.parse(cleanStructure);
      } catch (parseError) {
        console.error('구조 파싱 실패:', parseError);
        throw new Error('조항 구조 추출 실패');
      }
  
      if (!clauseStructure.clauses || !Array.isArray(clauseStructure.clauses)) {
        throw new Error('유효하지 않은 조항 구조');
      }
  
      console.log(`조항 구조 추출 완료: ${clauseStructure.clauses.length}개`);
  
      // 이제 원본 텍스트에서 실제 내용을 정규식으로 추출
      const finalClauses = extractClauseContentFromOriginal(rawText, clauseStructure.clauses);
  
      return {
        success: true,
        clauses: finalClauses.map((clause, index) => ({
          ...clause,
          id: `ai_clause_${index + 1}`,
          original: clause.content,
          confidence: clause.confidence || 0.9
        }))
      };
  
    } catch (error) {
      console.error('AI 구조화 실패:', error);
      throw error;
    }
  }
  
  /**
   * 원본 텍스트에서 조항 내용 추출 (정규식 기반)
   */
  function extractClauseContentFromOriginal(rawText, clauseStructure) {
    const results = [];
    
    for (let i = 0; i < clauseStructure.length; i++) {
      const currentClause = clauseStructure[i];
      const nextClause = clauseStructure[i + 1];
      
      // 현재 조항 시작 패턴
      const currentPattern = new RegExp(`제\\s*${currentClause.number}\\s*조[\\s\\S]*?(?=제\\s*${nextClause ? nextClause.number : '\\d+'}\\s*조|$)`, 'i');
      const match = rawText.match(currentPattern);
      
      if (match) {
        let content = match[0];
        
        // 제목 부분 제거
        content = content.replace(/^제\s*\d+\s*조\s*(?:\[[^\]]+\])?\s*/, '').trim();
        
        if (content.length > 15) {
          results.push({
            number: currentClause.number,
            title: currentClause.title,
            content: content,
            confidence: 0.9,
            type: 'formal',
            hasSubClauses: /[①②③④⑤]|^\d+\./.test(content)
          });
        }
      } else {
        // 매칭 실패시 기본 구조만 생성
        results.push({
          number: currentClause.number,
          title: currentClause.title,
          content: `${currentClause.title} 조항 내용을 확인하세요.`,
          confidence: 0.3,
          type: 'extracted_title_only',
          hasSubClauses: false
        });
      }
    }
    
    return results;
  }
  
  /**
   * 긴 계약서를 청크 단위로 처리 (50,000자 이상)
   */
  async function processLongContractInChunks(rawText) {
    try {
      console.log('긴 계약서 청크 처리 시작');
      
      // 제n조 단위로 미리 분할
      const articleBlocks = rawText.match(/제\s*\d+\s*조[\s\S]*?(?=제\s*\d+\s*조|$)/g);
      
      if (!articleBlocks || articleBlocks.length === 0) {
        return await fallbackToRegexParsing(rawText);
      }
      
      const allClauses = [];
      const chunkSize = 5; // 한 번에 5개 조항씩 처리
      
      for (let i = 0; i < articleBlocks.length; i += chunkSize) {
        const chunk = articleBlocks.slice(i, i + chunkSize).join('\n\n');
        
        console.log(`청크 ${Math.floor(i/chunkSize) + 1} 처리 중 (조항 ${i+1}-${Math.min(i+chunkSize, articleBlocks.length)})`);
        
        try {
          const chunkResult = await structureContractChunk(chunk, i + 1);
          
          if (chunkResult.success && chunkResult.clauses) {
            allClauses.push(...chunkResult.clauses);
          }
        } catch (chunkError) {
          console.error(`청크 ${Math.floor(i/chunkSize) + 1} 처리 실패:`, chunkError);
          // 청크 실패시 해당 청크는 스킵하고 계속 진행
        }
        
        // API 호출 간격 조절 (Rate Limit 방지)
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log(`청크 처리 완료: 총 ${allClauses.length}개 조항 추출`);
      
      return {
        success: true,
        clauses: allClauses,
        chunked: true,
        totalChunks: Math.ceil(articleBlocks.length / chunkSize)
      };
      
    } catch (error) {
      console.error('청크 처리 실패:', error);
      return await fallbackToRegexParsing(rawText);
    }
  }
  
  /**
   * 계약서 청크를 구조화
   */
  async function structureContractChunk(chunkText, startNumber) {
    const prompt = `다음 계약서 조항들을 JSON으로 구조화해주세요.
  
  중요사항:
  1. 원본 텍스트를 절대 수정하지 마세요
  2. 각 조항의 번호, 제목, 전체 내용을 정확히 추출하세요
  3. 하위 조항(①②③, 1.2.3.)도 모두 포함하세요
  
  JSON 형식:
  {
    "success": true,
    "clauses": [
      {
        "number": 조항번호,
        "title": "조항제목",
        "content": "전체 원본 내용",
        "confidence": 0.95,
        "type": "formal"
      }
    ]
  }
  
  조항들:
  ${chunkText}`;
  
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: '계약서 조항 구조화 전문가입니다. 원본을 보존하며 정확한 JSON을 반환하세요.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 3000
        })
      });
  
      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content;
  
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          success: true,
          clauses: parsed.clauses || []
        };
      }
  
      return { success: false, clauses: [] };
  
    } catch (error) {
      console.error(`청크 처리 실패:`, error);
      return { success: false, clauses: [] };
    }
  }
  
  /**
   * AI 실패시 정규식 기반 백업 파서
   */
  async function fallbackToRegexParsing(rawText) {
    console.log('정규식 백업 파서 사용');
    
    const clauses = [];
    
    // 제n조 패턴으로 추출
    const articlePattern = /제\s*(\d+)\s*조\s*(?:\[([^\]]+)\])?\s*([\s\S]*?)(?=제\s*\d+\s*조|$)/g;
    let match;
    
    while ((match = articlePattern.exec(rawText)) !== null) {
      const number = parseInt(match[1]);
      const titleInBrackets = match[2];
      const content = match[3]?.trim();
      
      if (content && content.length > 20) {
        clauses.push({
          number,
          title: titleInBrackets || `제${number}조`,
          content,
          confidence: 0.7,
          type: 'formal_fallback',
          hasSubClauses: /[①②③④⑤]|^\d+\./.test(content)
        });
      }
    }
    
    if (clauses.length === 0) {
      // 단락 기반 분할
      const paragraphs = rawText.split(/\n\s*\n/)
        .map(p => p.trim())
        .filter(p => p.length > 30);
        
      paragraphs.forEach((paragraph, index) => {
        clauses.push({
          number: index + 1,
          title: inferTitle(paragraph),
          content: paragraph,
          confidence: 0.4,
          type: 'paragraph_fallback',
          hasSubClauses: false
        });
      });
    }
    
    return {
      success: true,
      clauses,
      fallback: true
    };
  }
  
  /**
   * 조항 제목 추론 (백업용)
   */
  function inferTitle(content) {
    const titlePatterns = {
      '목적': ['목적', '계약목적', '본 계약'],
      '정의': ['정의', '용어의 정의', '서비스의 정의'],
      '기간': ['기간', '계약기간', '수행기간'],
      '대금': ['대금', '금액', '계약금액', '지급'],
      '의무': ['의무', '책임', '준수사항'],
      '해지': ['해지', '해약', '종료'],
      '기타': ['기타', '부칙', '특약']
    };
    
    const lowerContent = content.toLowerCase();
    
    for (const [title, keywords] of Object.entries(titlePatterns)) {
      if (keywords.some(keyword => lowerContent.includes(keyword.toLowerCase()))) {
        return title;
      }
    }
    
    // 첫 줄에서 추론
    const firstLine = content.split('\n')[0]?.trim();
    if (firstLine && firstLine.length < 50) {
      return firstLine;
    }
    
    return '조항';
  }
  
  /**
   * 조항들을 정규 형식으로 정리
   */
  function normalizeClauses(clauses) {
    return clauses
      .filter(clause => clause.content && clause.content.length > 10)
      .sort((a, b) => (a.number || 0) - (b.number || 0))
      .map((clause, index) => ({
        id: clause.id || `normalized_${index + 1}`,
        number: clause.number || (index + 1),
        title: normalizeTitle(clause.title),
        content: normalizeContent(clause.content),
        essential: isEssentialClause(clause.title, clause.content),
        confidence: clause.confidence || 0.5,
        type: clause.type || 'ai_structured',
        original: clause.original || clause.content,
        hasSubClauses: clause.hasSubClauses || false,
        order: index + 1
      }));
  }
  
  /**
   * 제목 정규화 - 원본 보존
   */
  function normalizeTitle(title) {
    if (!title) return '조항';
    
    let cleanTitle = title.trim();
    
    // 제n조 형식 제거
    cleanTitle = cleanTitle.replace(/^제\s*\d+\s*조\s*[(\[]?/, '');
    cleanTitle = cleanTitle.replace(/[)\]]$/, '');
    
    return cleanTitle.trim() || '조항';
  }
  
  /**
   * 내용 정규화 - 원본 완전 보존
   */
  function normalizeContent(content) {
    if (!content) return '';
    return content.trim();
  }
  
  /**
   * 필수 조항 여부 판단
   */
  function isEssentialClause(title, content) {
    const essentialKeywords = [
      '목적', '대금', '금액', '기간', '납품', '완성', '지급', 
      '계약금액', '용역대금', '서비스 대가', '의무', '책임'
    ];
    
    const combinedText = (title + ' ' + content).toLowerCase();
    return essentialKeywords.some(keyword => 
      combinedText.includes(keyword.toLowerCase())
    );
  }
  
  /**
   * 전체 신뢰도 계산
   */
  function calculateOverallConfidence(clauses) {
    if (!clauses || clauses.length === 0) return 0;
    
    const avgConfidence = clauses.reduce((sum, c) => sum + (c.confidence || 0), 0) / clauses.length;
    const clauseCountBonus = Math.min(clauses.length / 10, 0.2);
    
    return Math.min(avgConfidence + clauseCountBonus, 1.0);
  }
  
  /**
   * 정규화된 계약서 검증
   */
  function validateNormalizedContract(clauses) {
    const issues = [];
    const warnings = [];
    
    if (!clauses || clauses.length === 0) {
      issues.push('조항이 추출되지 않았습니다');
      return { isValid: false, issues, warnings, score: 0 };
    }
    
    if (clauses.length < 3) {
      warnings.push('조항 수가 적습니다 (3개 미만)');
    }
    
    // AI 신뢰도 체크
    const lowConfidenceClauses = clauses.filter(c => c.confidence < 0.6);
    if (lowConfidenceClauses.length > 0) {
      warnings.push(`${lowConfidenceClauses.length}개 조항의 AI 인식 신뢰도가 낮습니다`);
    }
    
    // 필수 조항 체크
    const essentialTypes = ['목적', '대금', '기간'];
    essentialTypes.forEach(type => {
      const hasType = clauses.some(c => 
        c.title.includes(type) || c.content.includes(type)
      );
      if (!hasType) {
        warnings.push(`${type} 관련 조항이 없습니다`);
      }
    });
    
    const score = Math.max(0, 100 - (issues.length * 30) - (warnings.length * 10));
    
    return {
      isValid: issues.length === 0,
      issues,
      warnings,
      score,
      clauseCount: clauses.length,
      avgConfidence: calculateOverallConfidence(clauses),
      aiProcessed: true
    };
  }
  
  /**
   * 기본 개선 권장사항 생성
   */
  function generateBasicRecommendations(clauses) {
    const recommendations = [];
    
    if (!clauses || clauses.length === 0) {
      return [{
        type: 'error',
        message: 'AI가 조항을 인식할 수 없습니다. 계약서 형식을 확인해주세요.'
      }];
    }
    
    // AI 처리 상태 안내
    const aiProcessed = clauses.some(c => c.type?.includes('ai_structured'));
    if (aiProcessed) {
      recommendations.push({
        type: 'info',
        message: 'GPT-4o-mini가 계약서를 자동으로 구조화했습니다. 상세 검토를 위해 AI 분석을 실행하세요.',
        action: 'ai_review'
      });
    }
    
    // 백업 모드 안내
    const fallbackUsed = clauses.some(c => c.type?.includes('fallback'));
    if (fallbackUsed) {
      recommendations.push({
        type: 'warning',
        message: 'AI 처리가 일부 실패하여 규칙 기반 분석을 사용했습니다. 수동 검토를 권장합니다.',
        action: 'manual_review'
      });
    }
    
    // 신뢰도 기반 권장사항
    const lowConfidenceClauses = clauses.filter(c => c.confidence < 0.7);
    if (lowConfidenceClauses.length > 0) {
      recommendations.push({
        type: 'warning',
        message: `${lowConfidenceClauses.length}개 조항의 구조화 신뢰도가 낮습니다. AI 상세 검토를 권장합니다.`,
        action: 'ai_detailed_review'
      });
    }
    
    return recommendations;
  }
  
  // 내보내기
  export default {
    normalizeContract,
    validateNormalizedContract
  };