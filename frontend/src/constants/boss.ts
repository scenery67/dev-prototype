import { StatusColor } from '../types';

export const BOSS_TYPES = ['용', '해골왕', '수화룡'] as const;

export const STATUS_COLORS: StatusColor[] = [
  { name: 'gray', label: '정보없음', value: '#9e9e9e' },
  { name: 'green', label: '빈방', value: '#4caf50' },
  { name: 'yellow', label: 'CCTV 1~2', value: '#fdd835' },
  { name: 'orange', label: '5명 이상', value: '#ff9800' },
  { name: 'red', label: '불가능, 잡힌곳', value: '#f44336' },
];

// 용 타입
export const DRAGON_TYPES = ['흑', '진', '묵', '감'] as const;
