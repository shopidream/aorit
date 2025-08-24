// scripts/initCountries.js - 20개국 기본 프로파일 초기화

import { initializeAllCountryProfiles } from '../lib/countryManager.js';

async function main() {
  console.log('🌍 20개국 기본 프로파일 초기화 시작...');
  
  try {
    const results = await initializeAllCountryProfiles();
    
    console.log('\n📊 초기화 결과:');
    results.forEach(result => {
      const status = result.status === 'created' ? '✅ 생성됨' : 
                    result.status === 'exists' ? '📋 이미 존재' : 
                    '❌ 실패';
      console.log(`${result.countryCode}: ${status}`);
    });
    
    const created = results.filter(r => r.status === 'created').length;
    const existing = results.filter(r => r.status === 'exists').length;
    const failed = results.filter(r => r.status === 'error').length;
    
    console.log(`\n🎯 요약: 생성 ${created}개, 기존 ${existing}개, 실패 ${failed}개`);
    
  } catch (error) {
    console.error('❌ 초기화 실패:', error);
  }
}

main();