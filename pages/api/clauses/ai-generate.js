// pages/api/clauses/ai-generate.js
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { concerns, contractType, industry, clientInfo } = req.body;

  if (!concerns || concerns.trim().length === 0) {
    return res.status(400).json({ error: '걱정되는 부분을 입력해주세요.' });
  }

  try {
    const prompt = `
당신은 한국 법률 전문가입니다. 프리랜서 계약서에 포함할 맞춤형 조항을 생성해주세요.

계약 정보:
- 계약 유형: ${contractType || '서비스 계약'}
- 업종: ${industry || '일반'}
- 클라이언트 정보: ${clientInfo || '미제공'}

사용자 우려사항: "${concerns}"

위 우려사항을 해결하는 2개의 구체적인 계약 조항을 JSON 형태로 생성해주세요.
조항 제목은 "수정제한", "범위한정", "지급조건", "납기보장", "손해배상" 등 계약서에 적합한 간결한 명칭으로 작성하세요.

응답 형식:
{
  "clauses": [
    {
      "id": "ai_clause_1",
      "title": "수정제한|범위한정|지급조건|납기보장|손해배상|기밀유지|하자보수 중 하나",
      "content": "구체적인 조항 내용 (법적 효력을 가지는 명확한 문장)",
      "category": "payment|delivery|modification|liability|termination",
      "riskLevel": "high|medium|low",
      "explanation": "이 조항이 왜 필요한지 간단한 설명"
    },
    {
      "id": "ai_clause_2", 
      "title": "수정제한|범위한정|지급조건|납기보장|손해배상|기밀유지|하자보수 중 하나",
      "content": "구체적인 조항 내용",
      "category": "payment|delivery|modification|liability|termination",
      "riskLevel": "high|medium|low",
      "explanation": "이 조항이 왜 필요한지 간단한 설명"
    }
  ]
}

한국어로 작성하고, 법적 구속력을 가지는 명확한 문장으로 작성해주세요.`;

    // 복잡한 조항이나 높은 정확성이 필요한 경우 gpt-4.1 사용
    // 단순한 조항이나 반복적인 작업은 gpt-4.1-mini 사용
    const isComplexCase = concerns.length > 100 || 
                         contractType === '복잡계약' || 
                         industry === '법무' || 
                         industry === '금융';
    
    const modelToUse = isComplexCase ? "gpt-4.1-2025-04-14" : "gpt-4.1-mini-2025-04-14";
    
    const completion = await openai.chat.completions.create({
      model: modelToUse,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3, // 정확성 중심으로 낮춤
      max_tokens: 2000
    });

    const aiResponse = completion.choices[0].message.content;
    
    // JSON 파싱 시도
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch (parseError) {
      // JSON 파싱 실패시 fallback
      console.error('AI 응답 파싱 실패:', parseError);
      parsedResponse = {
        clauses: [
          {
            id: "ai_clause_fallback_1",
            title: "AI 생성 조항 1",
            content: "사용자 우려사항에 대한 보호 조항이 생성되었습니다.",
            category: "liability",
            riskLevel: "medium",
            explanation: "AI 응답 처리 중 오류가 발생했습니다."
          },
          {
            id: "ai_clause_fallback_2", 
            title: "AI 생성 조항 2",
            content: "추가 보호 조항이 생성되었습니다.",
            category: "termination",
            riskLevel: "medium",
            explanation: "AI 응답 처리 중 오류가 발생했습니다."
          }
        ]
      };
    }

    res.status(200).json(parsedResponse);

  } catch (error) {
    console.error('AI 조항 생성 오류:', error);
    res.status(500).json({ 
      error: 'AI 조항 생성에 실패했습니다.',
      details: error.message 
    });
  }
}