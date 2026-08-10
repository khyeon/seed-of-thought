import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import styled from 'styled-components/native';
import { theme } from '../styles/theme';
import { ChevronLeft, ChevronRight, Save, ArrowRight, Sparkles, Check } from 'lucide-react-native';
import axios from 'axios';
import { API_URL } from '../config/apiConfig';

const Container = styled.SafeAreaView`
  flex: 1;
  background-color: ${theme.colors.background};
`;

const Header = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: ${theme.spacing.md}px ${theme.spacing.lg}px;
`;

const Title = styled.Text`
  font-size: 20px;
  font-weight: bold;
  color: ${theme.colors.text.primary};
`;

const Content = styled.KeyboardAvoidingView`
  flex: 1;
`;

const ScrollWrapper = styled.ScrollView`
  flex: 1;
  padding: ${theme.spacing.lg}px;
`;

const ProgressContainer = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${theme.spacing.lg}px;
`;

const ProgressBarOuter = styled.View`
  flex: 1;
  height: 8px;
  background-color: ${theme.colors.secondary}40;
  border-radius: 4px;
  margin-right: 12px;
  overflow: hidden;
`;

const ProgressBarInner = styled.View<{ progress: number }>`
  height: 100%;
  width: ${props => props.progress * 100}%;
  background-color: ${theme.colors.primary};
  border-radius: 4px;
`;

const ProgressText = styled.Text`
  font-size: 14px;
  font-weight: bold;
  color: ${theme.colors.primary};
`;

const Card = styled.View`
  background-color: ${theme.colors.white};
  border-radius: ${theme.borderRadius.lg}px;
  padding: ${theme.spacing.lg}px;
  margin-bottom: ${theme.spacing.lg}px;
  ${theme.shadows.soft};
  border-top-width: 6px;
  border-top-color: ${theme.colors.accent};
`;

const TypeTag = styled.View<{ type: string }>`
  background-color: ${props => 
    props.type === 'CONTEXT' ? '#E3F2FD' : 
    props.type === 'LOGIC' ? '#FFF3E0' : '#ECEFF1'
  };
  padding: 6px 12px;
  border-radius: ${theme.borderRadius.full}px;
  align-self: flex-start;
  margin-bottom: ${theme.spacing.md}px;
`;

const TypeTagText = styled.Text<{ type: string }>`
  font-size: 12px;
  font-weight: bold;
  color: ${props => 
    props.type === 'CONTEXT' ? '#1E88E5' : 
    props.type === 'LOGIC' ? '#F57C00' : '#455A64'
  };
`;

const Label = styled.Text`
  font-size: 14px;
  font-weight: bold;
  color: ${theme.colors.text.secondary};
  margin-bottom: 8px;
`;

const OriginalSentenceBox = styled.View`
  background-color: ${theme.colors.background};
  padding: ${theme.spacing.md}px;
  border-radius: ${theme.borderRadius.md}px;
  margin-bottom: ${theme.spacing.lg}px;
`;

const OriginalSentenceText = styled.Text`
  font-size: 16px;
  color: ${theme.colors.text.primary};
  line-height: 24px;
  font-style: italic;
`;

const PromptBox = styled.View`
  background-color: #E8F5E9;
  padding: ${theme.spacing.md}px;
  border-radius: ${theme.borderRadius.md}px;
  margin-bottom: ${theme.spacing.lg}px;
  border-left-width: 4px;
  border-left-color: ${theme.colors.primary};
`;

const IssueText = styled.Text`
  font-size: 15px;
  color: ${theme.colors.text.primary};
  line-height: 22px;
  font-weight: bold;
  margin-bottom: 6px;
`;

const QuestionText = styled.Text`
  font-size: 15px;
  color: ${theme.colors.primary};
  line-height: 22px;
`;

const CustomInput = styled.TextInput`
  border-width: 1px;
  borderColor: ${theme.colors.secondary};
  border-radius: ${theme.borderRadius.md}px;
  padding: ${theme.spacing.md}px;
  font-size: 16px;
  line-height: 24px;
  color: ${theme.colors.text.primary};
  background-color: ${theme.colors.white};
  min-height: 80px;
  text-align-vertical: top;
  margin-bottom: ${theme.spacing.lg}px;
`;

const SuggestionSection = styled.View`
  margin-bottom: ${theme.spacing.lg}px;
`;

const SuggestionChip = styled.TouchableOpacity`
  background-color: ${theme.colors.secondary}20;
  border-width: 1px;
  border-color: ${theme.colors.secondary};
  padding: 12px;
  border-radius: ${theme.borderRadius.sm}px;
  margin-bottom: ${theme.spacing.sm}px;
`;

const SuggestionText = styled.Text`
  font-size: 15px;
  color: ${theme.colors.primary};
  line-height: 22px;
`;

const NavRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: 40px;
`;

const NavButton = styled.TouchableOpacity<{ secondary?: boolean }>`
  flex: 1;
  background-color: ${props => props.secondary ? theme.colors.white : theme.colors.primary};
  border-width: 1px;
  border-color: ${theme.colors.primary};
  border-radius: ${theme.borderRadius.full}px;
  padding: ${theme.spacing.md}px;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  margin-horizontal: 6px;
  ${theme.shadows.soft};
`;

const NavButtonText = styled.Text<{ secondary?: boolean }>`
  color: ${props => props.secondary ? theme.colors.primary : theme.colors.white};
  font-size: 16px;
  font-weight: bold;
  margin-horizontal: 6px;
`;

const DiaryCorrectionScreen = ({ route, navigation }: any) => {
  const { diary, correction } = route.params;
  const [items, setItems] = useState<any[]>(correction.items || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctedText, setCorrectedText] = useState('');
  const [saving, setSaving] = useState(false);

  const currentItem = items[currentIndex];

  useEffect(() => {
    if (currentItem) {
      setCorrectedText(currentItem.correctedSentence || currentItem.originalSentence || '');
    }
  }, [currentIndex, items]);

  const handleApplySuggestion = (text: string) => {
    setCorrectedText(text);
  };

  const handleSaveItem = async (status: 'RESOLVED' | 'SKIPPED') => {
    if (!currentItem) return false;

    try {
      const response = await axios.patch(
        `${API_URL}/diaries/${diary.id}/correction/items/${currentItem.id}`,
        {
          correctedSentence: status === 'RESOLVED' ? correctedText.trim() : null,
          status,
        }
      );

      // Update local state
      const updatedItems = [...items];
      updatedItems[currentIndex] = response.data;
      setItems(updatedItems);
      return true;
    } catch (e) {
      console.error('Error saving correction item:', e);
      Alert.alert('오류', '저장에 실패했습니다.');
      return false;
    }
  };

  const handleNext = async () => {
    const success = await handleSaveItem('RESOLVED');
    if (!success) return;

    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = async () => {
    const success = await handleSaveItem('SKIPPED');
    if (!success) return;

    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      await axios.post(`${API_URL}/diaries/${diary.id}/correction/complete`);
      Alert.alert('성공', '생각 다듬기가 완료되어 완성본 일기가 저장되었습니다! 🍎', [
        {
          text: '확인',
          onPress: () => {
            // Navigate back and pop or go to Home to refresh
            navigation.navigate('Home');
          },
        },
      ]);
    } catch (e) {
      console.error(e);
      Alert.alert('오류', '완료 처리에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (items.length === 0) {
    return (
      <Container>
        <Header>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ChevronLeft size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Title>생각 다듬기</Title>
          <View style={{ width: 24 }} />
        </Header>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Sparkles size={48} color={theme.colors.primary} style={{ marginBottom: 16 }} />
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.colors.text.primary, marginBottom: 8 }}>
            다듬을 문장이 없어요!
          </Text>
          <Text style={{ fontSize: 14, color: theme.colors.text.secondary, textAlign: 'center', marginBottom: 24 }}>
            이미 멋진 일기를 완성하셨거나, 분석 대상 문장이 존재하지 않습니다.
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: theme.colors.primary, padding: 12, paddingHorizontal: 24, borderRadius: 20 }}
            onPress={() => navigation.goBack()}
          >
            <Text style={{ color: 'white', fontWeight: 'bold' }}>돌아가기</Text>
          </TouchableOpacity>
        </View>
      </Container>
    );
  }

  const suggestions: string[] = currentItem?.aiSuggestions
    ? JSON.parse(currentItem.aiSuggestions)
    : [];

  const progress = (currentIndex + 1) / items.length;

  return (
    <Container>
      <Header>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Title>생각 다듬기 ✏️</Title>
        <View style={{ width: 24 }} />
      </Header>

      <Content
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollWrapper showsVerticalScrollIndicator={false}>
          <ProgressContainer>
            <ProgressBarOuter>
              <ProgressBarInner progress={progress} />
            </ProgressBarOuter>
            <ProgressText>{currentIndex + 1} / {items.length}</ProgressText>
          </ProgressContainer>

          <Card>
            <TypeTag type={currentItem.correctionType}>
              <TypeTagText type={currentItem.correctionType}>
                {currentItem.correctionType === 'CONTEXT' ? '🔵 원인/맥락 부족' : 
                 currentItem.correctionType === 'LOGIC' ? '🟠 논리 비약' : '✏️ 내가 지정한 문장'}
              </TypeTagText>
            </TypeTag>

            <Label>원래 문장</Label>
            <OriginalSentenceBox>
              <OriginalSentenceText>"{currentItem.originalSentence}"</OriginalSentenceText>
            </OriginalSentenceBox>

            <PromptBox>
              <IssueText>{currentItem.issueDescription}</IssueText>
              <QuestionText>{currentItem.aiQuestion}</QuestionText>
            </PromptBox>

            <Label>다듬을 문장 쓰기</Label>
            <CustomInput
              multiline
              value={correctedText}
              onChangeText={setCorrectedText}
              placeholder="직접 고쳐 쓰거나 예시 카드를 터치해 보세요."
            />

            {suggestions.length > 0 && (
              <SuggestionSection>
                <Label>💡 이렇게 써보는 건 어떨까요?</Label>
                {suggestions.map((suggestion, sIdx) => (
                  <SuggestionChip
                    key={`sug-${sIdx}`}
                    onPress={() => handleApplySuggestion(suggestion)}
                  >
                    <SuggestionText>{suggestion}</SuggestionText>
                  </SuggestionChip>
                ))}
              </SuggestionSection>
            )}
          </Card>

          <NavRow>
            {currentIndex > 0 && (
              <NavButton secondary onPress={handlePrev} style={{ flex: 0.5 }}>
                <ChevronLeft size={18} color={theme.colors.primary} />
                <NavButtonText secondary>이전</NavButtonText>
              </NavButton>
            )}
            
            <NavButton secondary onPress={handleSkip} style={{ flex: 0.5 }}>
              <NavButtonText secondary>넘어가기</NavButtonText>
            </NavButton>

            <NavButton onPress={handleNext} disabled={saving}>
              {saving ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <NavButtonText>
                    {currentIndex === items.length - 1 ? '완료하기 🍎' : '적용 후 다음'}
                  </NavButtonText>
                  {currentIndex < items.length - 1 && <ChevronRight size={18} color="white" />}
                </>
              )}
            </NavButton>
          </NavRow>
        </ScrollWrapper>
      </Content>
    </Container>
  );
};

export default DiaryCorrectionScreen;
