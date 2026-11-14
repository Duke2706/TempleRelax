// All user-visible copy, Korean source. Shaped like the future i18n resources (one group per Place).

export interface PlaceCopy {
  name: string;
  sceneLabel: string;
  hint: [string, string];
  action: string;
  inputLabel: string;
  keep: string;
  counter: (n: number) => string;
  closingLines: string[];
  weatherNotes: Partial<Record<string, string>>;
}

export interface Copy {
  title: string;
  placeGroupLabel: string;
  weatherGroupLabel: string;
  weatherNames: Record<string, string>;
  /** Fallback Weather notes for Places that define none. */
  weatherNotes: Partial<Record<string, string>>;
  soundOn: string;
  soundOff: string;
  placeholder: string;
  share: string;
  places: Record<string, PlaceCopy>;
}

export const ko: Copy = {
  title: '한 줄 사색',
  placeGroupLabel: '장소',
  weatherGroupLabel: '날씨',
  weatherNames: { clear: '맑음', rain: '비', snow: '눈' },
  weatherNotes: {
    rain: '빗소리가 들려요.',
    snow: '눈이 조용히 내려요.',
  },
  soundOn: '소리 켜기',
  soundOff: '소리 끄기',
  placeholder: '예: 그때 그 말이 자꾸 생각나요',
  share: '내 글도 지금 함께 있는 사람에게 별빛으로 보여주기 (끄면 글 없이 별빛만)',
  places: {
    forest: {
      name: '숲 불멍',
      sceneLabel: '밤 숲속에서 타오르는 모닥불',
      hint: ['마음에 걸린 생각을 한 줄 적어 불에 던져 보세요.', '타닥타닥 타는 동안 잠깐 멍하니 있어도 좋아요.'],
      action: '태우기',
      inputLabel: '태울 생각 한 줄',
      keep: '쓴 글은 어디에도 저장되지 않고, 다 타면 사라져요.',
      counter: (n) => '태운 생각 ' + n + '개',
      closingLines: ['다 타서 가벼워졌어요.', '재가 되어 밤하늘로 올라가요.', '이제 불만 바라봐요.', '한결 조용해졌어요.', '잘 태웠어요. 천천히 숨 쉬어요.'],
      weatherNotes: {
        rain: '비가 와도 불은 꺼지지 않아요.',
        snow: '눈 내리는 밤이에요. 불빛이 더 따뜻해 보여요.',
      },
    },
    beach: {
      name: '바닷가',
      sceneLabel: '달빛이 비치는 밤바다',
      hint: ['마음에 걸린 생각을 한 줄 적어 유리병에 담아 보내세요.', '파도 소리를 들으며 멀어지는 병을 바라봐요.'],
      action: '띄우기',
      inputLabel: '띄울 생각 한 줄',
      keep: '쓴 글은 어디에도 저장되지 않고, 병이 멀리 떠나면 사라져요.',
      counter: (n) => '띄운 생각 ' + n + '개',
      closingLines: ['병이 파도를 타고 멀어져요.', '수평선 너머로 흘러갔어요.', '바다가 가져갔어요.', '한결 조용해졌어요.', '잘 보냈어요. 천천히 숨 쉬어요.'],
      weatherNotes: {},
    },
  },
};
