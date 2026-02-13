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

const KeywordContainer = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  margin-top: ${theme.spacing.lg}px;
`;

const Keyword = styled.Text`
  color: ${theme.colors.text.secondary};
  background-color: ${theme.colors.secondary};
  padding: ${theme.spacing.xs}px ${theme.spacing.sm}px;
  border-radius: ${theme.borderRadius.sm}px;
  margin-right: ${theme.spacing.sm}px;
  margin-bottom: ${theme.spacing.sm}px;
  font-size: 12px;
`;

const SaveButton = styled.TouchableOpacity`
  background-color: ${theme.colors.primary};
  border-radius: ${theme.borderRadius.full}px;
  padding: ${theme.spacing.md}px;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  margin-bottom: 40px;
  ${theme.shadows.soft};
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
    if (!content.trim()) {
      Alert.alert('안내', '일기 내용을 입력해 주세요!');
      return;
    }
    setSaving(true);
    try {
      const savePayload = {
        userId,
        chatRoomId,
        content: content.trim(),
        emotion: diaryData?.emotion,
        keywords: diaryData?.keywords,
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

          <DiaryInput
            multiline
            value={content}
            onChangeText={setContent}
            placeholder="여기에 일기 내용을 적어줘..."
          />

          <KeywordContainer>
            {diaryData?.keywords?.map((kw: string, index: number) => (
              <Keyword key={index}>#{kw}</Keyword>
            ))}
          </KeywordContainer>
        </Card>

        <SaveButton onPress={handleSave} disabled={saving}>
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
