import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
} from 'react-native';
import styled from 'styled-components/native';
import { theme } from '../styles/theme';
import { ChevronLeft, Save, Star } from 'lucide-react-native';
import axios from 'axios';
import { useUserStore } from '../store/userStore';
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

const Content = styled.ScrollView`
  flex: 1;
  padding: ${theme.spacing.lg}px;
`;

const Card = styled.View`
  background-color: ${theme.colors.white};
  border-radius: ${theme.borderRadius.lg}px;
  padding: ${theme.spacing.lg}px;
  ${theme.shadows.soft};
  margin-bottom: ${theme.spacing.xl}px;
  border-top-width: 6px;
  border-top-color: ${theme.colors.accent};
`;

const BookHeader = styled.View`
  flex-direction: row;
  margin-bottom: ${theme.spacing.lg}px;
`;

const BookCover = styled.Image`
  width: 50px;
  height: 75px;
  border-radius: ${theme.borderRadius.sm}px;
`;

const BookInfo = styled.View`
  margin-left: ${theme.spacing.md}px;
  justify-content: center;
`;

const BookTitle = styled.Text`
  font-size: 16px;
  font-weight: bold;
  color: ${theme.colors.text.primary};
`;

const EmotionTag = styled.View`
  background-color: ${theme.colors.background};
  padding: ${theme.spacing.xs}px ${theme.spacing.sm}px;
  border-radius: ${theme.borderRadius.full}px;
  align-self: flex-start;
  margin-top: 4px;
`;

const EmotionText = styled.Text`
  font-size: 12px;
  color: ${theme.colors.primary};
`;

const DiaryInput = styled.TextInput`
  font-size: 18px;
  line-height: 28px;
  color: ${theme.colors.text.primary};
  min-height: 200px;
  text-align-vertical: top;
`;

const GuideMessage = styled.Text`
  font-size: 15px;
  line-height: 22px;
  color: ${theme.colors.text.secondary};
  margin-bottom: ${theme.spacing.md}px;
  background-color: ${theme.colors.background};
  padding: ${theme.spacing.md}px;
  border-radius: ${theme.borderRadius.md}px;
`;

const BadgeSection = styled.View`
  margin-bottom: ${theme.spacing.lg}px;
`;

const BadgeRow = styled.View`
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: ${theme.spacing.sm}px;
`;

const BadgeLabel = styled.Text`
  font-size: 12px;
  font-weight: bold;
  color: ${theme.colors.text.secondary};
  margin-right: ${theme.spacing.sm}px;
  width: 50px;
`;

const FactBadge = styled.View`
  background-color: #E3F2FD;
  padding: ${theme.spacing.xs}px ${theme.spacing.sm}px;
  border-radius: ${theme.borderRadius.sm}px;
  margin-right: ${theme.spacing.sm}px;
  margin-bottom: 4px;
`;

const FactBadgeText = styled.Text`
  color: #1976D2;
  font-size: 13px;
  font-weight: bold;
`;

const InsightBadge = styled.View`
  background-color: #FFF3E0;
  padding: ${theme.spacing.xs}px ${theme.spacing.sm}px;
  border-radius: ${theme.borderRadius.sm}px;
  margin-right: ${theme.spacing.sm}px;
  margin-bottom: 4px;
`;

const InsightBadgeText = styled.Text`
  color: #F57C00;
  font-size: 13px;
  font-weight: bold;
`;

const CharCounter = styled.Text<{ $isValid: boolean }>`
  text-align: right;
  font-size: 13px;
  margin-top: ${theme.spacing.sm}px;
  color: ${props => props.$isValid ? theme.colors.primary : '#F44336'};
  font-weight: ${props => props.$isValid ? 'bold' : 'normal'};
`;

const SaveButton = styled.TouchableOpacity<{ $isPending?: boolean }>`
  background-color: ${props => props.$isPending ? '#ccc' : theme.colors.primary};
  border-radius: ${theme.borderRadius.full}px;
  padding: ${theme.spacing.md}px;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  margin-bottom: 40px;
  opacity: ${props => props.$isPending ? 0.7 : 1};
  ${props => !props.$isPending && theme.shadows.soft};
`;

const SaveButtonText = styled.Text`
  color: ${theme.colors.white};
  font-size: 18px;
  font-weight: bold;
  margin-left: ${theme.spacing.sm}px;
`;

const EditDiaryScreen = ({ route, navigation }: any) => {
  const { chatRoomId, book } = route.params;
  const { userId } = useUserStore();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [diaryData, setDiaryData] = useState<any>(null);

  useEffect(() => {
    fetchDraft();
  }, []);

  const fetchDraft = async () => {
    try {
      const response = await axios.get(`${API_URL}/diaries/draft/${chatRoomId}`);
      setDiaryData(response.data);
      setContent(response.data.content);
    } catch (error) {
      console.error('Error fetching draft:', error);
      Alert.alert('오류', '일기 초안을 불러오지 못했어요.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    console.log('AIChat - handleSave: Start saving process');
    const textLength = content.trim().length;
    if (textLength < 200) {
      Alert.alert('조금만 더!', `멋진 감상문을 완성하기 위해 200자 이상 적어보자! (현재 ${textLength}자)`);
      return;
    }
    setSaving(true);
    try {
      const combinedKeywords = [
        ...(diaryData?.factKeywords || []),
        ...(diaryData?.insightKeywords || [])
      ];

      const savePayload = {
        userId,
        chatRoomId,
        content: content.trim(),
        emotion: diaryData?.emotion,
        keywords: combinedKeywords.length > 0 ? combinedKeywords : diaryData?.keywords,
        summary: diaryData?.summary,
        imageUrl: book.thumbnail,
      };
      console.log('AIChat - handleSave: Sending POST to /diaries', savePayload);

      const response = await axios.post(`${API_URL}/diaries`, savePayload);
      console.log('AIChat - handleSave: Save successful', response.data);

      if (Platform.OS === 'web') {
        const win = window as any;
        win.alert('축하해! 멋진 일기가 저장되었어! 열매를 맺었구나 🍎');
        navigation.navigate('Home');
      } else {
        Alert.alert('축하해!', '멋진 일기가 저장되었어! 열매를 맺었구나 🍎', [
          { text: '확인', onPress: () => navigation.navigate('Home') }
        ]);
      }
    } catch (error: any) {
      console.error('AIChat - handleSave: Error saving diary', error);
      console.error('Error info:', error.response?.data || error.message);
      Alert.alert('오류', '일기를 저장하는 중에 문제가 생겼어. 서버 상태를 확인해줘.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container style={{ justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 20, color: theme.colors.text.secondary }}>열매를 만드는 중...</Text>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Title>열매 맺기</Title>
        <View style={{ width: 24 }} />
      </Header>

      <Content showsVerticalScrollIndicator={false}>
        <Card>
          <BookHeader>
            <BookCover source={{ uri: book.thumbnail }} />
            <BookInfo>
              <BookTitle>{book.title}</BookTitle>
              <EmotionTag>
                <EmotionText>{diaryData?.emotion || '기쁨'} 😊</EmotionText>
              </EmotionTag>
            </BookInfo>
          </BookHeader>

          {diaryData && (<>
            <GuideMessage>
              우와! 오늘 책에 대해 깊게 대화하면서 네가 이렇게 멋진 생각 조각들을 찾아냈어! 이 조각들을 모아서 200자 이상의 진짜 작가 같은 감상문으로 완성해 볼까?
            </GuideMessage>

            <BadgeSection>
              {diaryData.factKeywords && diaryData.factKeywords.length > 0 && (
                <BadgeRow>
                  <BadgeLabel>🔵 사건</BadgeLabel>
                  {diaryData.factKeywords.map((kw: string, index: number) => (
                    <FactBadge key={`fact-${index}`}><FactBadgeText>{kw}</FactBadgeText></FactBadge>
                  ))}
                </BadgeRow>
              )}
              {diaryData.insightKeywords && diaryData.insightKeywords.length > 0 && (
                <BadgeRow>
                  <BadgeLabel>🌟 생각</BadgeLabel>
                  {diaryData.insightKeywords.map((kw: string, index: number) => (
                    <InsightBadge key={`insight-${index}`}><InsightBadgeText>{kw}</InsightBadgeText></InsightBadge>
                  ))}
                </BadgeRow>
              )}
            </BadgeSection>
          </>)}

          <DiaryInput
            multiline
            value={content}
            onChangeText={setContent}
            placeholder="파란색 보석(사건)과 노란색 보석(생각)을 연결해서 진짜 멋진 200자 감상문을 만들어봐!"
          />
          <CharCounter $isValid={content.trim().length >= 200}>
            ( 현재 {content.trim().length} 자 / 목표 200 자 )
          </CharCounter>
        </Card>

        <SaveButton onPress={handleSave} disabled={saving} $isPending={saving || content.trim().length < 200}>
          {saving ? (
            <ActivityIndicator color={theme.colors.white} />
          ) : (
            <>
              <Save size={20} color={theme.colors.white} />
              <SaveButtonText>일기 저장하기</SaveButtonText>
            </>
          )}
        </SaveButton>
      </Content>
    </Container>
  );
};

export default EditDiaryScreen;
