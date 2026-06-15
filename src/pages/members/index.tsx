import React, { useState, useMemo } from 'react';
import { View, Text, Button, ScrollView, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useApp } from '@/store/AppContext';
import MemberCard from '@/components/MemberCard';
import MedicineCard from '@/components/MedicineCard';
import StatCard from '@/components/StatCard';
import styles from './index.module.scss';

const MembersPage: React.FC = () => {
  const { members, getMemberMedicines, getMemberRecords } = useApp();
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const selectedMember = useMemo(
    () => members.find(m => m.id === selectedMemberId),
    [members, selectedMemberId]
  );

  const memberMedicines = useMemo(
    () => (selectedMemberId ? getMemberMedicines(selectedMemberId) : []),
    [selectedMemberId, getMemberMedicines]
  );

  const memberRecords = useMemo(
    () => (selectedMemberId ? getMemberRecords(selectedMemberId, 7) : []),
    [selectedMemberId, getMemberRecords]
  );

  const stats = useMemo(() => {
    const taken = memberRecords.filter(r => r.status === 'taken' || r.status === 'supplemented').length;
    const missed = memberRecords.filter(r => r.status === 'missed').length;
    return { total: memberRecords.length, taken, missed };
  }, [memberRecords]);

  const handleSelectMember = (memberId: string) => {
    setSelectedMemberId(memberId);
  };

  const handleBack = () => {
    setSelectedMemberId(null);
  };

  const handleAddMember = () => {
    Taro.navigateTo({ url: '/pages/member-add/index' });
  };

  const handleMedicineClick = (medicineId: string) => {
    Taro.navigateTo({ url: `/pages/medicine-detail/index?id=${medicineId}` });
  };

  return (
    <ScrollView className={styles.container} scrollY>
      <View className={styles.header}>
        <Text className={styles.title}>{selectedMember ? '成员详情' : '成员用药'}</Text>
        {!selectedMember && (
          <Button className={styles.addBtn} onClick={handleAddMember}>
            + 添加成员
          </Button>
        )}
        {selectedMember && (
          <Button className={styles.backBtn} onClick={handleBack}>
            ← 返回列表
          </Button>
        )}
      </View>

      {!selectedMember ? (
        <>
          <View className={styles.sectionTitle}>家庭成员（{members.length}）</View>
          <View className={styles.memberList}>
            {members.map(member => (
              <View key={member.id} className={styles.memberCard}>
                <MemberCard
                  member={member}
                  medicineCount={getMemberMedicines(member.id).length}
                  onClick={() => handleSelectMember(member.id)}
                />
              </View>
            ))}
          </View>
        </>
      ) : (
        <View className={styles.detailSection}>
          <View className={styles.selectedMember}>
            <Image className={styles.avatar} src={selectedMember.avatar} mode="aspectFill" />
            <View>
              <Text className={styles.name}>{selectedMember.name}</Text>
              <Text className={styles.info}>
                {selectedMember.gender === 'male' ? '男' : '女'} · {selectedMember.age}岁
                {selectedMember.note ? ` · ${selectedMember.note}` : ''}
              </Text>
            </View>
          </View>

          <View className={styles.sectionTitle} style={{ marginTop: 0 }}>近7天用药统计</View>
          <View className={styles.statsRow}>
            <StatCard value={stats.total} label="总记录" />
            <StatCard value={stats.taken} label="按时/补服" variant="default" />
            <StatCard value={stats.missed} label="漏服" variant="danger" />
          </View>

          <View className={styles.sectionTitle}>
            在用药品（{memberMedicines.length}）
          </View>
          {memberMedicines.length > 0 ? (
            memberMedicines.map(med => (
              <MedicineCard
                key={med.id}
                medicine={med}
                onClick={() => handleMedicineClick(med.id)}
              />
            ))
          ) : (
            <View className={styles.emptyState}>
              <Text className={styles.emptyText}>暂无用药记录</Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
};

export default MembersPage;
