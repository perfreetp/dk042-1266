import React, { useMemo } from 'react';
import { View, Text, Image, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useApp } from '@/store/AppContext';
import { getCurrentDate } from '@/utils';
import styles from './index.module.scss';

const PrescriptionPage: React.FC = () => {
  const { members, getMemberMedicines } = useApp();

  const membersWithMedicines = useMemo(() => {
    return members
      .map(member => ({
        member,
        medicines: getMemberMedicines(member.id)
      }))
      .filter(x => x.medicines.length > 0);
  }, [members, getMemberMedicines]);

  const handleExport = () => {
    Taro.showToast({ title: '已复制到剪贴板', icon: 'success' });
  };

  const handleShare = () => {
    Taro.showToast({ title: '分享功能开发中', icon: 'none' });
  };

  return (
    <ScrollView className={styles.container} scrollY>
      <View className={styles.header}>
        <Text className={styles.title}>家庭用药清单</Text>
        <Text className={styles.subtitle}>生成日期：{getCurrentDate()}</Text>
      </View>

      <Text className={styles.tip}>
        💡 就医时可向医生展示此清单，帮助医生了解用药情况
      </Text>

      {membersWithMedicines.length > 0 ? (
        membersWithMedicines.map(({ member, medicines }) => (
          <View key={member.id} className={styles.section}>
            <View className={styles.memberHeader}>
              <Image className={styles.avatar} src={member.avatar} mode="aspectFill" />
              <View>
                <Text className={styles.memberName}>
                  {member.name}（{member.relation}）
                </Text>
                <Text className={styles.memberInfo}>
                  {member.gender === 'male' ? '男' : '女'} · {member.age}岁
                  {member.note ? ` · ${member.note}` : ''}
                </Text>
              </View>
            </View>
            <View className={styles.medicineList}>
              {medicines.map(med => (
                <View key={med.id} className={styles.medicineItem}>
                  <Text className={styles.medicineName}>
                    {med.name}（{med.genericName || med.form}）
                  </Text>
                  <Text className={styles.medicineDetail}>
                    规格：{med.dosage}
                  </Text>
                  {med.reminderTimes.length > 0 && (
                    <Text className={styles.medicineDetail}>
                      用法：{med.reminderTimes.map(t => `${t.time} ${t.dosage}`).join('，')}
                    </Text>
                  )}
                  {med.instruction && (
                    <Text className={styles.medicineDetail}>
                      说明：{med.instruction}
                    </Text>
                  )}
                  {med.sideEffect && (
                    <Text className={styles.medicineDetail} style={{ color: '#F59E0B' }}>
                      注意：{med.sideEffect}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        ))
      ) : (
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>📋</Text>
          <Text className={styles.emptyText}>暂无成员用药记录</Text>
        </View>
      )}

      <View className={styles.footer}>
        <Text className={styles.footerText}>
          本清单仅供参考，具体用药请遵医嘱
        </Text>
        <Text className={styles.footerText}>
          如有疑问请咨询医生或药师
        </Text>
      </View>

      <View className={styles.actionRow}>
        <Button className={classnames(styles.actionBtn, styles.btnSecondary)} onClick={handleExport}>
          📋 复制文本
        </Button>
        <Button className={classnames(styles.actionBtn, styles.btnPrimary)} onClick={handleShare}>
          📤 分享给家人
        </Button>
      </View>
    </ScrollView>
  );
};

export default PrescriptionPage;
