import React, { useState } from 'react';
import { View, Text, Input, Textarea, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useApp } from '@/store/AppContext';
import styles from './index.module.scss';

const RELATIONS = ['爷爷', '奶奶', '爸爸', '妈妈', '儿子', '女儿', '本人', '其他'];

const MemberAddPage: React.FC = () => {
  const { addMember } = useApp();

  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [note, setNote] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) {
      Taro.showToast({ title: '请输入姓名', icon: 'none' });
      return;
    }
    if (!relation) {
      Taro.showToast({ title: '请选择关系', icon: 'none' });
      return;
    }
    if (!age || parseInt(age) <= 0) {
      Taro.showToast({ title: '请输入年龄', icon: 'none' });
      return;
    }

    addMember({
      name: name.trim(),
      relation,
      age: parseInt(age),
      gender,
      note: note.trim() || undefined
    });

    Taro.showToast({ title: '添加成功', icon: 'success' });
    setTimeout(() => Taro.navigateBack(), 1500);
  };

  return (
    <View className={styles.container}>
      <View className={styles.formSection}>
        <Text className={styles.sectionTitle}>基本信息</Text>

        <View className={styles.formItem}>
          <Text className={styles.label}>
            <Text className={styles.required}>*</Text>姓名
          </Text>
          <Input
            className={styles.input}
            placeholder="请输入姓名"
            value={name}
            onInput={e => setName(e.detail.value)}
          />
        </View>

        <View className={styles.formItem}>
          <Text className={styles.label}>
            <Text className={styles.required}>*</Text>关系
          </Text>
          <View className={styles.relationOptions}>
            {RELATIONS.map(r => (
              <View
                key={r}
                className={classnames(styles.relationTag, {
                  [styles.relationTagActive]: relation === r
                })}
                onClick={() => setRelation(r)}
              >
                {r}
              </View>
            ))}
          </View>
        </View>

        <View className={styles.row}>
          <View className={styles.formItem} style={{ flex: 1 }}>
            <Text className={styles.label}>
              <Text className={styles.required}>*</Text>年龄
            </Text>
            <Input
              className={styles.input}
              type="number"
              placeholder="请输入年龄"
              value={age}
              onInput={e => setAge(e.detail.value)}
            />
          </View>
          <View className={styles.formItem} style={{ flex: 1 }}>
            <Text className={styles.label}>
              <Text className={styles.required}>*</Text>性别
            </Text>
            <View className={styles.genderOptions}>
              <View
                className={classnames(styles.genderOption, {
                  [styles.genderOptionActive]: gender === 'male'
                })}
                onClick={() => setGender('male')}
              >
                男
              </View>
              <View
                className={classnames(styles.genderOption, {
                  [styles.genderOptionActive]: gender === 'female'
                })}
                onClick={() => setGender('female')}
              >
                女
              </View>
            </View>
          </View>
        </View>

        <View className={styles.formItem}>
          <Text className={styles.label}>备注（如病史、过敏史等）</Text>
          <Textarea
            className={styles.textarea}
            placeholder="选填，如：高血压、糖尿病、青霉素过敏等"
            value={note}
            onInput={e => setNote(e.detail.value)}
          />
        </View>
      </View>

      <Button className={styles.submitBtn} onClick={handleSubmit}>
        保存成员
      </Button>
    </View>
  );
};

export default MemberAddPage;
