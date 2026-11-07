export const STRINGS = {
  ko: {
    daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly',
    copyPrompt: '프롬프트 복사', copied: '복사됨 ✓', open: '저장소 바로가기', copyUrl: '레포지토리 링크 복사', showMore: '더 보기',
    toastPrompt: '프롬프트가 클립보드에 복사되었습니다! ✨', toastUrl: '링크가 클립보드에 복사되었습니다! ✨',
    loading: '불러오는 중…', error: '순위를 불러오지 못했어요.', retry: '다시 시도',
  },
  en: {
    daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly',
    copyPrompt: 'Copy prompt', copied: 'Copied ✓', open: 'Open repository', copyUrl: 'Copy repository link', showMore: 'Show more',
    toastPrompt: 'Prompt copied to clipboard! ✨', toastUrl: 'Link copied to clipboard! ✨',
    loading: 'Loading…', error: "Couldn't load trending repos.", retry: 'Retry',
  },
};

export const defaultLang = (uiLang) => (/^ko\b/i.test(uiLang) ? 'ko' : 'en');
