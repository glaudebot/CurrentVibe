export const STRINGS = {
  ko: {
    daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly',
    copyPrompt: '프롬프트 복사', copied: '복사됨 ✓', open: '열기', copyUrl: '주소 복사',
    loading: '불러오는 중…', error: '순위를 불러오지 못했어요.', retry: '다시 시도',
  },
  en: {
    daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly',
    copyPrompt: 'Copy prompt', copied: 'Copied ✓', open: 'Open', copyUrl: 'Copy URL',
    loading: 'Loading…', error: "Couldn't load trending repos.", retry: 'Retry',
  },
};

export const defaultLang = (uiLang) => (/^ko\b/i.test(uiLang) ? 'ko' : 'en');
