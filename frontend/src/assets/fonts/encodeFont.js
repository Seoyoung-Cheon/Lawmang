// src/fonts/encodeFont.js

const fs = require('fs');
const path = require('path');

// 나눔고딕 폰트 파일 경로
const fontPath = path.join(__dirname, 'NanumGothic.ttf');

try {
  // 폰트 파일 읽기
  const fontFile = fs.readFileSync(fontPath);
  // base64로 변환
  const base64Font = fontFile.toString('base64');

  // 변환된 폰트를 export하는 코드 생성
  const output = `// NanumGothic 폰트 base64
export const NanumGothic = '${base64Font}';\n`;

  // 결과를 파일로 저장
  fs.writeFileSync(
    path.join(__dirname, 'NanumGothic-normal.js'),
    output
  );

  console.log('✅ NanumGothic-normal.js 파일 생성 완료');
} catch (err) {
  console.error('❌ 폰트 변환 실패:', err.message);
}
