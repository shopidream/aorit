// lib/emailService.js
import nodemailer from 'nodemailer';
import { generateContractEmailTemplate } from '../templates/email/contractTemplate';

const createTransporter = () => {
  if (process.env.NODE_ENV === 'production') {
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    return {
      sendMail: async (mailOptions) => {
        console.log('📧 이메일 발송 (개발모드):', mailOptions);
        return { messageId: 'dev-' + Date.now() };
      }
    };
  }
};

export const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.FROM_EMAIL || 'cs@shopidream.com',
    to,
    subject,
    html,
    text: text || html?.replace(/<[^>]*>/g, '')
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log('이메일 발송 성공:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('이메일 발송 실패:', error);
    return { success: false, error: error.message };
  }
};

export const sendQuoteEmail = async (quote, clientEmail) => {
  const subject = `견적서 - ${quote.service?.title}`;
  
  const html = `
    <div style="font-family: 'Malgun Gothic', sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #8B5CF6; text-align: center;">견적서</h2>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>프로젝트 정보</h3>
        <p><strong>서비스:</strong> ${quote.service?.title}</p>
        <p><strong>견적 금액:</strong> ${quote.amount?.toLocaleString()}원</p>
        <p><strong>예상 기간:</strong> ${quote.service?.duration}</p>
        ${quote.notes ? `<p><strong>특이사항:</strong> ${quote.notes}</p>` : ''}
      </div>
      
      <div style="margin: 30px 0;">
        <p>안녕하세요, <strong>ShopIDream</strong>입니다.</p>
        <p>요청해주신 프로젝트에 대한 견적서를 보내드립니다.</p>
        <p>궁금한 사항이 있으시면 언제든 연락 주세요.</p>
      </div>
      
      <div style="border-top: 1px solid #ddd; padding-top: 20px; text-align: center; color: #666;">
        <p>ShopIDream | cs@shopidream.com | 02-1234-5678</p>
      </div>
    </div>
  `;

  return await sendEmail({ to: clientEmail, subject, html });
};

export const sendContractEmail = async (contract, clientEmail) => {
  const userData = { name: 'ShopIDream', email: 'cs@shopidream.com' };
  const template = generateContractEmailTemplate(contract, userData);
  
  return await sendEmail({
    to: clientEmail,
    subject: template.subject,
    html: template.html,
    text: template.text
  });
};