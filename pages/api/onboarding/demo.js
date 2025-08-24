// pages/api/onboarding/demo.js
import { prisma } from '../../../lib/prisma';
import { getServerSession } from 'next-auth/next';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res);
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { type, data } = req.body;

    switch (type) {
      case 'service':
        const demoService = await createDemoService(session.user.id, data);
        return res.status(200).json(demoService);

      case 'client':
        const demoClient = await createDemoClient(session.user.id, data);
        return res.status(200).json(demoClient);

      case 'quote':
        const demoQuote = await createDemoQuote(session.user.id, data);
        return res.status(200).json(demoQuote);

      case 'contract':
        const demoContract = await createDemoContract(session.user.id, data);
        return res.status(200).json(demoContract);

      default:
        return res.status(400).json({ error: 'Invalid type' });
    }
  } catch (error) {
    console.error('Demo creation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function createDemoService(userId, data) {
  // 카테고리 생성 또는 찾기
  let category = await prisma.category.findFirst({
    where: { name: data.category || 'SaaS' }
  });

  if (!category) {
    category = await prisma.category.create({
      data: {
        id: `demo_category_${Date.now()}`,
        name: data.category || 'SaaS',
        type: 'standard'
      }
    });
  }

  // 데모 서비스 생성
  const service = await prisma.service.create({
    data: {
      userId: userId,
      categoryId: category.id,
      title: data.title || '데모 서비스',
      description: data.description || '온보딩용 데모 서비스입니다.',
      price: data.price || 500000,
      features: JSON.stringify(data.features || ['데모 기능 1', '데모 기능 2']),
      isActive: true,
      isDemo: true
    }
  });

  return service;
}

async function createDemoClient(userId, data) {
  const client = await prisma.client.create({
    data: {
      userId: userId,
      name: data.name || '데모 고객',
      email: data.email || 'demo@example.com',
      phone: data.phone || '010-0000-0000',
      company: data.company || '데모 회사',
      isDemo: true
    }
  });

  return client;
}

async function createDemoQuote(userId, data) {
  const quote = await prisma.quote.create({
    data: {
      userId: userId,
      clientId: data.clientId,
      title: '데모 견적서',
      totalAmount: 750000,
      paymentTerms: data.paymentTerms || '2단계',
      discount: data.discount || 0,
      notes: data.notes || '온보딩용 데모 견적서입니다.',
      status: 'draft',
      isDemo: true
    }
  });

  // 견적서-서비스 연결
  if (data.serviceIds && data.serviceIds.length > 0) {
    await prisma.quoteService.createMany({
      data: data.serviceIds.map(serviceId => ({
        quoteId: quote.id,
        serviceId: serviceId,
        quantity: 1
      }))
    });
  }

  return quote;
}

async function createDemoContract(userId, data) {
  const contract = await prisma.contract.create({
    data: {
      userId: userId,
      quoteId: data.quoteId,
      title: '데모 계약서',
      content: '온보딩용 데모 계약서 내용입니다.',
      status: 'draft',
      templateType: data.templateType || 'basic',
      isDemo: true
    }
  });

  return contract;
}