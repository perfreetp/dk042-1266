import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import { Member } from '@/types';
import styles from './index.module.scss';

interface MemberCardProps {
  member: Member;
  medicineCount: number;
  onClick?: () => void;
}

const MemberCard: React.FC<MemberCardProps> = ({ member, medicineCount, onClick }) => {
  return (
    <View className={styles.memberCard} onClick={onClick}>
      <Image className={styles.avatar} src={member.avatar} mode="aspectFill" />
      <View className={styles.info}>
        <View className={styles.nameRow}>
          <Text className={styles.name}>{member.name}</Text>
          <Text className={styles.relation}>{member.relation}</Text>
        </View>
        <Text className={styles.detail}>
          {member.gender === 'male' ? '男' : '女'} · {member.age}岁
          {member.note ? ` · ${member.note}` : ''}
        </Text>
        <Text className={styles.medicineCount}>{medicineCount} 种用药</Text>
      </View>
    </View>
  );
};

export default MemberCard;
