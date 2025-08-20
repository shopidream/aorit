// lib/documentParser.js - PDF/Word 문서 파싱 시스템
import mammoth from 'mammoth';

// 문서 타입 감지
export function detectDocumentType(filename) {
  const ext = filename.toLowerCase().split('.').pop();
  
  const typeMap = {
    'pdf': 'pdf',
    'doc': 'word',
    'docx': 'word',
    'txt': 'text'
  };
  
  return typeMap[ext] || 'unknown';
}

// Word 문서 파싱
export async function parseWordDocument(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return {
      success: true,
      text: result.text,
      messages: result.messages
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// 텍스트를 조항별로 분리
export function extractClauses(text) {
  const clauses = [];
  
  // 한국어 조항 패턴들
  const patterns = [
    /제\s*(\d+)\s*조\s*[(\[]([^)\]]+)[)\]]/g,  // 제1조 (제목)
    /제\s*(\d+)\s*조\s*(.+?)(?=제\s*\d+\s*조|$)/gs,  // 제1조 내용
    /\d+\.\s*([^\n]+)/g,  // 1. 형식
    /[가-힣]{2,}\s*:\s*[^\n]+/g  // 항목명: 내용
  ];
  
  let clauseNumber = 1;
  
  // 제n조 패턴 우선 처리
  const articleMatches = text.match(/제\s*\d+\s*조[\s\S]*?(?=제\s*\d+\s*조|$)/g);
  
  if (articleMatches && articleMatches.length > 0) {
    articleMatches.forEach((match, index) => {
      const titleMatch = match.match(/제\s*(\d+)\s*조\s*[(\[]([^)\]]+)[)\]]/);
      const title = titleMatch ? titleMatch[2].trim() : `조항 ${index + 1}`;
      
      const content = match
        .replace(/제\s*\d+\s*조\s*[(\[]([^)\]]+)[)\]]/, '')
        .trim();
      
      if (content.length > 10) {
        clauses.push({
          number: parseInt(titleMatch?.[1]) || clauseNumber++,
          title,
          content: content.substring(0, 1000), // 길이 제한
          type: 'article',
          confidence: 0.9
        });
      }
    });
  } else {
    // 대체 패턴으로 분리
    const lines = text.split('\n').filter(line => line.trim().length > 5);
    let currentClause = null;
    
    lines.forEach(line => {
      line = line.trim();
      
      // 제목 형태 라인 감지
      if (line.length < 50 && (
        line.includes(':') ||
        line.match(/^\d+\./) ||
        line.match(/^[가-힣\s]{2,15}$/)
      )) {
        if (currentClause) {
          clauses.push(currentClause);
        }
        
        currentClause = {
          number: clauseNumber++,
          title: line.replace(/^\d+\.\s*/, '').replace(/:$/, ''),
          content: '',
          type: 'section',
          confidence: 0.7
        };
      } else if (currentClause && line.length > 10) {
        currentClause.content += line + ' ';
      }
    });
    
    if (currentClause && currentClause.content.trim()) {
      clauses.push(currentClause);
    }
  }
  
  return clauses.filter(clause => 
    clause.content.trim().length >= 20 && 
    clause.title.trim().length >= 2
  );
}

// 메타데이터 추출
export function extractMetadata(text, filename) {
  const metadata = {
    filename,
    length: text.length,
    language: 'ko',
    hasTable: text.includes('┌') || text.includes('│') || text.includes('┐'),
    estimatedPages: Math.ceil(text.length / 2000),
    keywords: []
  };
  
  // 키워드 추출
  const keywordPatterns = [
    /계약서|약정서|협약서/g,
    /용역|서비스|개발|제작|디자인/g,
    /발주자|수행자|갑|을/g,
    /지급|결제|대금|비용/g
  ];
  
  keywordPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      metadata.keywords.push(...matches);
    }
  });
  
  metadata.keywords = [...new Set(metadata.keywords)];
  
  return metadata;
}

// 문서 품질 검증
export function validateDocument(text) {
  const issues = [];
  
  if (text.length < 100) {
    issues.push('문서가 너무 짧습니다');
  }
  
  if (!text.includes('계약') && !text.includes('약정') && !text.includes('협약')) {
    issues.push('계약서 형태가 아닐 수 있습니다');
  }
  
  if (text.split('\n').length < 5) {
    issues.push('문서 구조가 단순합니다');
  }
  
  const koreanRatio = (text.match(/[가-힣]/g) || []).length / text.length;
  if (koreanRatio < 0.3) {
    issues.push('한국어 비율이 낮습니다');
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    score: Math.max(0, 100 - (issues.length * 25))
  };
}

// 메인 파싱 함수
export async function parseDocument(buffer, filename) {
  try {
    const docType = detectDocumentType(filename);
    
    let text = '';
    
    switch (docType) {
      case 'word':
        const wordResult = await parseWordDocument(buffer);
        if (!wordResult.success) {
          throw new Error(wordResult.error);
        }
        text = wordResult.text;
        break;
        
      case 'text':
        text = buffer.toString('utf-8');
        break;
        
      default:
        throw new Error(`지원하지 않는 파일 형식: ${docType}`);
    }
    
    const validation = validateDocument(text);
    if (!validation.isValid) {
      console.warn('문서 품질 경고:', validation.issues);
    }
    
    const clauses = extractClauses(text);
    const metadata = extractMetadata(text, filename);
    
    return {
      success: true,
      document: {
        filename,
        fullText: text,
        clauses,
        metadata,
        validation
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

export default {
  parseDocument,
  extractClauses,
  extractMetadata,
  validateDocument
};