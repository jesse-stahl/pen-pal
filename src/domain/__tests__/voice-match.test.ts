import { hasVoiceFor, voiceStatus } from '../voice-match';

const voices = [{ language: 'en-US' }, { language: 'th_TH' }, { language: 'zh-CN' }];

describe('hasVoiceFor', () => {
  test('matches on the primary language subtag', () => {
    expect(hasVoiceFor(voices, 'th')).toBe(true);
    expect(hasVoiceFor(voices, 'en')).toBe(true);
    expect(hasVoiceFor(voices, 'zh')).toBe(true);
  });

  test('is case-insensitive and accepts full tags', () => {
    expect(hasVoiceFor(voices, 'TH-th')).toBe(true);
  });

  test('false when no voice speaks the language', () => {
    expect(hasVoiceFor(voices, 'ja')).toBe(false);
    expect(hasVoiceFor(voices, '')).toBe(false);
  });
});

describe('voiceStatus', () => {
  test('unknown when the engine reports no voices at all', () => {
    expect(voiceStatus([], 'th')).toBe('unknown');
  });

  test('available / missing based on the voice list', () => {
    expect(voiceStatus(voices, 'th')).toBe('available');
    expect(voiceStatus(voices, 'ko')).toBe('missing');
  });
});
