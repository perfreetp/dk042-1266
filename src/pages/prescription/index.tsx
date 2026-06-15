import React, { useMemo, useState } from 'react';
import { View, Text, Image, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useApp } from '@/store/AppContext';
import { getCurrentDate } from '@/utils';
import styles from './index.module.scss';

const PERIOD_DAYS = 30;

const PrescriptionPage: React.FC = () => {
  const { members, getPrescriptionSummary } = useApp();
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);

  const membersWithSummary = useMemo(() => {
    return members
      .map(member => ({
        member,
        summary: getPrescriptionSummary(member.id, PERIOD_DAYS)
      }))
      .filter(x => x.summary.activeMedicines.length > 0 || x.summary.risks.length > 0);
  }, [members, getPrescriptionSummary]);

  const toggleMember = (memberId: string) => {
    setExpandedMemberId(prev => prev === memberId ? null : memberId);
  };

  const getAdherenceColor = (rate: number) => {
    if (rate >= 90) return '#10B981';
    if (rate >= 70) return '#F59E0B';
    return '#EF4444';
  };

  const handleExport = () => {
    let text = `==== 家庭用药清单 ====\n生成日期：${getCurrentDate()}\n统计周期：近${PERIOD_DAYS}天\n\n`;
    membersWithSummary.forEach(({ member, summary }) => {
      text += `【${member.name}（${member.relation}）】\n`;
      text += `  依从率：${summary.overallAdherence}%\n`;
      summary.activeMedicines.forEach(am => {
        text += `  - ${am.medicine.name}（${am.medicine.dosage}）\n`;
        text += `    用法：${am.medicine.reminderTimes.map(t => `${t.time} ${t.dosage}`).join('，')}\n`;
        text += `    依从率：${am.adherenceRate}%，已服${am.takenCount}次，漏服${am.missedCount}次，补服${am.supplementedCount}次\n`;
      });
      if (summary.missedDates.length > 0) {
        text += `  漏服日期：${summary.missedDates.join('、')}\n`;
      }
      if (summary.adverseReactions.length > 0) {
        text += `  不适反应：\n`;
        summary.adverseReactions.forEach(ar => {
          text += `    - ${ar.date} ${ar.medicineName}：${ar.reaction}\n`;
        });
      }
      if (summary.risks.length > 0) {
        text += `  ⚠️ 注意事项：\n`;
        summary.risks.forEach(r => {
          text += `    - ${r.description}\n`;
        });
      }
      text += '\n';
    });
    text += '\n⚠️ 本清单仅供参考，具体用药请遵医嘱';

    Taro.setClipboardData({
      data: text,
      success: () => Taro.showToast({ title: '已复制到剪贴板', icon: 'success' })
    });
  };

  const handleShare = () => {
    Taro.showToast({ title: '分享功能开发中', icon: 'none' });
  };

  return (
    <ScrollView className={styles.container} scrollY>
      <View className={styles.header}>
        <Text className={styles.title}>家庭用药清单</Text>
        <Text className={styles.subtitle}>
          生成日期：{getCurrentDate()} · 统计周期：近{PERIOD_DAYS}天
        </Text>
      </View>

      <Text className={styles.tip}>
        💡 就医时可向医生展示此清单，帮助医生了解近期用药情况
      </Text>

      {membersWithSummary.length > 0 ? (
        membersWithSummary.map(({ member, summary }) => {
          const isExpanded = expandedMemberId === member.id || expandedMemberId === null;
          return (
            <View key={member.id} className={styles.section}>
              <View
                className={styles.memberHeader}
                onClick={() => toggleMember(member.id)}
              >
                <Image className={styles.avatar} src={member.avatar} mode="aspectFill" />
                <View className={styles.memberHeaderInfo}>
                  <View style={{ display: 'flex', alignItems: 'center' }}>
                    <Text className={styles.memberName}>
                      {member.name}（{member.relation}）
                    </Text>
                    <View
                      className={styles.adherenceBadge}
                      style={{ backgroundColor: `${getAdherenceColor(summary.overallAdherence)}15`, color: getAdherenceColor(summary.overallAdherence) }}
                    >
                      依从率 {summary.overallAdherence}%
                    </View>
                  </View>
                  <Text className={styles.memberInfo}>
                    {member.gender === 'male' ? '男' : '女'} · {member.age}岁
                    {member.note ? ` · ${member.note}` : ''}
                  </Text>
                  <Text className={styles.memberStats}>
                    共 {summary.activeMedicines.length} 种药
                    · 漏服 {summary.missedDates.length} 天
                    {summary.adverseReactions.length > 0 && ` · ${summary.adverseReactions.length} 次不适`}
                    {summary.risks.length > 0 && ` · ⚠️ ${summary.risks.length} 项风险`}
                  </Text>
                </View>
                <Text className={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
              </View>

              {isExpanded && (
                <>
                  {summary.risks.length > 0 && (
                    <View className={styles.warningBox}>
                      <Text className={styles.warningTitle}>⚠️ 用药风险提醒</Text>
                      {summary.risks.map((r, i) => (
                        <Text key={i} className={classnames(styles.warningItem, {
                          [styles.warningDanger]: r.level === 'danger',
                          [styles.warningWarning]: r.level === 'warning',
                        })}>
                          {r.description}
                        </Text>
                      ))}
                    </View>
                  )}

                  {summary.adverseReactions.length > 0 && (
                    <View className={styles.sectionSub}>
                      <Text className={styles.sectionSubTitle}>💊 不适反应记录</Text>
                      {summary.adverseReactions.map((ar, i) => (
                        <Text key={i} className={styles.adverseItem}>
                          {ar.date} · {ar.medicineName}：{ar.reaction}
                        </Text>
                      ))}
                    </View>
                  )}

                  {summary.missedDates.length > 0 && (
                    <View className={styles.sectionSub}>
                      <Text className={styles.sectionSubTitle}>📅 漏服日期</Text>
                      <Text className={styles.missedDates}>
                        {summary.missedDates.join('、')}
                      </Text>
                    </View>
                  )}

                  <View className={styles.sectionSub}>
                    <Text className={styles.sectionSubTitle}>💊 当前用药</Text>
                    <View className={styles.medicineList}>
                      {summary.activeMedicines.map(am => (
                        <View key={am.medicine.id} className={styles.medicineItem}>
                          <View className={styles.medicineHeader}>
                            <Text className={styles.medicineName}>
                              {am.medicine.name}（{am.medicine.genericName || am.medicine.form}）
                            </Text>
                            <View
                              className={styles.medicineAdherence}
                              style={{ color: getAdherenceColor(am.adherenceRate) }}
                            >
                              依从 {am.adherenceRate}%
                            </View>
                          </View>
                          <Text className={styles.medicineDetail}>
                            规格：{am.medicine.dosage}
                          </Text>
                          {am.medicine.reminderTimes.length > 0 && (
                            <Text className={styles.medicineDetail}>
                              用法：{am.medicine.reminderTimes.map(t => `${t.time} ${t.dosage}`).join('，')}
                            </Text>
                          )}
                          <View className={styles.medicineStatsRow}>
                            <Text className={styles.medicineStat}>已服 {am.takenCount}次</Text>
                            <Text className={styles.medicineStat} style={{ color: '#EF4444' }}>漏服 {am.missedCount}次</Text>
                            <Text className={styles.medicineStat} style={{ color: '#3B82F6' }}>补服 {am.supplementedCount}次</Text>
                          </View>
                          {am.medicine.instruction && (
                            <Text className={styles.medicineDetail}>
                              说明：{am.medicine.instruction}
                            </Text>
                          )}
                          {am.medicine.sideEffect && (
                            <Text className={styles.medicineDetail} style={{ color: '#F59E0B' }}>
                              注意：{am.medicine.sideEffect}
                            </Text>
                          )}
                        </View>
                      ))}
                    </View>
                  </View>

                  {(summary.expiredMedicines.length > 0 || summary.expiringMedicines.length > 0 || summary.lowStockMedicines.length > 0) && (
                    <View className={styles.sectionSub}>
                      <Text className={styles.sectionSubTitle}>🚨 需要关注的药品</Text>
                      {summary.expiredMedicines.map(m => (
                        <Text key={m.id} className={styles.riskItem} style={{ color: '#EF4444' }}>
                          ❌ {m.name} 已过期（{m.expireDate}）
                        </Text>
                      ))}
                      {summary.expiringMedicines.map(m => (
                        <Text key={m.id} className={styles.riskItem} style={{ color: '#F59E0B' }}>
                          ⏳ {m.name} 将于 {m.expireDate} 到期
                        </Text>
                      ))}
                      {summary.lowStockMedicines.map(m => (
                        <Text key={m.id} className={styles.riskItem} style={{ color: '#F59E0B' }}>
                          📦 {m.name} 库存不足（剩余{m.stock}）
                        </Text>
                      ))}
                    </View>
                  )}
                </>
              )}
            </View>
          );
        })
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
