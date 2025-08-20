import { prisma } from '../../../lib/prisma';
import { getCurrentUser } from '../../../lib/auth';

export default async function handler(req, res) {
  const user = await getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: '로그인이 필요합니다' });
  }

  if (req.method === 'GET') {
    try {
      const profile = await prisma.profile.findUnique({
        where: { userId: user.id }
      });
      
      res.status(200).json(profile);
    } catch (error) {
      console.error('프로필 조회 오류:', error);
      res.status(500).json({ error: '프로필 조회 실패' });
    }
  }

  else if (req.method === 'PATCH') {
    const { 
      // 담당자 정보
      contactName, 
      contactPhone, 
      contactEmail,
      
      // 회사 정보
      companyName,
      ceoName,
      businessNumber,
      companyPhone,
      companyEmail,
      companyAddress,
      businessType,
      businessItem,
      companyFax,
      
      // 계좌 정보
      bankName,
      accountNumber,
      accountHolder,
      
      // 서명 정보
      signatureImage,
      stampImage,
      
      // 기존 필드
      bio, 
      website, 
      youtube, 
      snsLinks, 
      phone, 
      address, 
      profileCard 
    } = req.body;
    
    try {
      const profile = await prisma.profile.upsert({
        where: { userId: user.id },
        update: {
          // 담당자 정보
          contactName,
          contactPhone,
          contactEmail,
          
          // 회사 정보
          companyName,
          ceoName,
          businessNumber,
          companyPhone,
          companyEmail,
          companyAddress,
          businessType,
          businessItem,
          companyFax,
          
          // 계좌 정보
          bankName,
          accountNumber,
          accountHolder,
          
          // 계좌 정보
          bankName,
          accountNumber,
          accountHolder,
          
          // 서명 정보
          signatureImage,
          stampImage,
          
          // 기존 필드
          bio,
          website,
          youtube,
          snsLinks: snsLinks ? JSON.stringify(snsLinks) : null,
          phone,
          address,
          profileCard: profileCard ? JSON.stringify(profileCard) : null
        },
        create: {
          userId: user.id,
          // 담당자 정보
          contactName,
          contactPhone,
          contactEmail,
          
          // 회사 정보
          companyName,
          ceoName,
          businessNumber,
          companyPhone,
          companyEmail,
          companyAddress,
          businessType,
          businessItem,
          companyFax,
          
          // 서명 정보
          signatureImage,
          stampImage,
          
          // 기존 필드
          bio,
          website,
          youtube,
          snsLinks: snsLinks ? JSON.stringify(snsLinks) : null,
          phone,
          address,
          profileCard: profileCard ? JSON.stringify(profileCard) : null
        }
      });
      
      res.status(200).json(profile);
    } catch (error) {
      console.error('프로필 수정 오류:', error);
      res.status(500).json({ error: '프로필 수정 실패' });
    }
  }

  else {
    res.status(405).json({ error: '허용되지 않는 메소드' });
  }
}