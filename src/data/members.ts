import { Member } from '@/types';

export const mockMembers: Member[] = [
  {
    id: 'm1',
    name: '张爷爷',
    avatar: 'https://picsum.photos/id/64/200/200',
    relation: '爷爷',
    age: 72,
    gender: 'male',
    note: '高血压患者，需长期服药'
  },
  {
    id: 'm2',
    name: '李奶奶',
    avatar: 'https://picsum.photos/id/91/200/200',
    relation: '奶奶',
    age: 68,
    gender: 'female',
    note: '糖尿病患者'
  },
  {
    id: 'm3',
    name: '小明',
    avatar: 'https://picsum.photos/id/177/200/200',
    relation: '儿子',
    age: 8,
    gender: 'male',
    note: '过敏性体质'
  },
  {
    id: 'm4',
    name: '小红',
    avatar: 'https://picsum.photos/id/338/200/200',
    relation: '女儿',
    age: 5,
    gender: 'female',
    note: ''
  },
  {
    id: 'm5',
    name: '爸爸',
    avatar: 'https://picsum.photos/id/1027/200/200',
    relation: '本人',
    age: 38,
    gender: 'male',
    note: ''
  }
];
