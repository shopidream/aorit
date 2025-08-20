// pages/api/contact/send.js
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { name, email, company, phone, subject, message } = req.body;

  // 필수 필드 검증
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ 
      message: '이름, 이메일, 제목, 내용은 필수 입력 항목입니다.' 
    });
  }

  // 이메일 형식 검증
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ 
      message: '올바른 이메일 형식을 입력해주세요.' 
    });
  }

  try {
    // 이메일 설정 (환경변수 사용)
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // 현재 시간
    const now = new Date();
    const kstTime = new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(now);

    // 관리자에게 보낼 이메일 내용
    const adminEmailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
        <div style="background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1f2937; margin: 0; font-size: 24px;">🔔 새로운 문의가 도착했습니다</h1>
            <p style="color: #6b7280; margin: 10px 0 0 0;">Aorit 웹사이트 Contact 폼</p>
          </div>
          
          <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #374151; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">📋 문의 정보</h2>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: bold; width: 120px;">이름</td>
                <td style="padding: 8px 0; color: #1f2937;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">이메일</td>
                <td style="padding: 8px 0; color: #1f2937;">
                  <a href="mailto:${email}" style="color: #3b82f6; text-decoration: none;">${email}</a>
                </td>
              </tr>
              ${company ? `
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">회사명</td>
                <td style="padding: 8px 0; color: #1f2937;">${company}</td>
              </tr>
              ` : ''}
              ${phone ? `
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">연락처</td>
                <td style="padding: 8px 0; color: #1f2937;">
                  <a href="tel:${phone}" style="color: #3b82f6; text-decoration: none;">${phone}</a>
                </td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">문의시간</td>
                <td style="padding: 8px 0; color: #1f2937;">${kstTime}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #eff6ff; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 16px;">📝 문의 제목</h3>
            <p style="color: #1f2937; margin: 0; font-weight: bold;">${subject}</p>
          </div>

          <div style="background-color: #f0fdf4; border-radius: 8px; padding: 20px;">
            <h3 style="color: #166534; margin: 0 0 15px 0; font-size: 16px;">💬 문의 내용</h3>
            <div style="color: #1f2937; line-height: 1.6; white-space: pre-wrap;">${message}</div>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; margin: 0; font-size: 14px;">
              빠른 답변으로 고객 만족도를 높여보세요! 😊
            </p>
          </div>
        </div>
      </div>
    `;

    // 관리자에게 이메일 발송
    await transporter.sendMail({
      from: `"Aorit Contact" <${process.env.SMTP_USER}>`,
      to: 'cs@shopidream.com',
      subject: `[Aorit 문의] ${subject}`,
      html: adminEmailContent,
      replyTo: email, // 답장 시 고객 이메일로 설정
    });

    // 고객에게 자동 확인 이메일 발송
    const customerEmailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
        <div style="background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1f2937; margin: 0; font-size: 24px;">✅ 문의가 접수되었습니다</h1>
            <p style="color: #6b7280; margin: 10px 0 0 0;">Aorit에 문의해주셔서 감사합니다</p>
          </div>
          
          <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #374151; margin: 0 0 15px 0; font-size: 18px;">안녕하세요, ${name}님!</h2>
            <p style="color: #6b7280; line-height: 1.6; margin: 0;">
              Aorit에 소중한 문의를 남겨주셔서 진심으로 감사드립니다.<br>
              접수하신 문의는 담당자가 검토 후 <strong>24시간 내</strong>에 답변드릴 예정입니다.
            </p>
          </div>

          <div style="background-color: #eff6ff; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 16px;">📋 접수된 문의 내용</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 5px 0; color: #6b7280; font-weight: bold; width: 80px;">제목</td>
                <td style="padding: 5px 0; color: #1f2937;">${subject}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #6b7280; font-weight: bold;">접수시간</td>
                <td style="padding: 5px 0; color: #1f2937;">${kstTime}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #f0fdf4; border-radius: 8px; padding: 20px; text-align: center;">
            <h3 style="color: #166534; margin: 0 0 15px 0; font-size: 16px;">📞 추가 문의</h3>
            <p style="color: #1f2937; margin: 0 0 10px 0;">
              급한 문의사항이 있으시면 아래 이메일로 직접 연락주세요.
            </p>
            <a href="mailto:cs@shopidream.com" style="color: #3b82f6; text-decoration: none; font-weight: bold;">
              cs@shopidream.com
            </a>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; margin: 0; font-size: 14px;">
              감사합니다.<br>
              <strong>Aorit 팀</strong>
            </p>
          </div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Aorit Team" <${process.env.SMTP_USER}>`,
      to: email,
      subject: '[Aorit] 문의가 접수되었습니다',
      html: customerEmailContent,
    });

    res.status(200).json({ 
      message: '문의가 성공적으로 전송되었습니다.',
      timestamp: kstTime 
    });

  } catch (error) {
    console.error('Contact email error:', error);
    res.status(500).json({ 
      message: '이메일 전송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' 
    });
  }
}