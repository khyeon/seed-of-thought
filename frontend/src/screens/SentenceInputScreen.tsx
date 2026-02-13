import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import styled from 'styled-components/native';
import { theme } from '../styles/theme';
import { ChevronLeft, Camera, Send } from 'lucide-react-native';

const Container = styled.SafeAreaView`
  flex: 1;
  background-color: ${theme.colors.background};
`;

const Header = styled.View`
  flex-direction: row;
  align-items: center;
  padding: ${theme.spacing.md}px ${theme.spacing.lg}px;
`;

const Title = styled.Text`
  font-size: 20px;
  font-weight: bold;
  color: ${theme.colors.text.primary};
  margin-left: ${theme.spacing.md}px;
`;

const Content = styled.ScrollView`
  flex: 1;
  padding: ${theme.spacing.lg}px;
`;

const BookSummary = styled.View`
  background-color: ${theme.colors.secondary};
  padding: ${theme.spacing.md}px;
  border-radius: ${theme.borderRadius.md}px;
  margin-bottom: ${theme.spacing.lg}px;
  opacity: 0.8;
`;

const BookSubtitle = styled.Text`
  font-size: 14px;
  color: ${theme.colors.primary};
  font-weight: bold;
`;

const BookTitleText = styled.Text`
  font-size: 18px;
  color: ${theme.colors.text.primary};
  margin-top: 4px;
`;

const InputLabel = styled.Text`
  font-size: 18px;
  font-weight: bold;
  color: ${theme.colors.text.primary};
  margin-bottom: ${theme.spacing.md}px;
`;

const TextAreaContainer = styled.View`
  background-color: ${theme.colors.white};
  border-radius: ${theme.borderRadius.md}px;
  padding: ${theme.spacing.md}px;
  height: 200px;
  ${theme.shadows.soft};
`;

const StyledTextInput = styled.TextInput`
  flex: 1;
  font-size: 16px;
  color: ${theme.colors.text.primary};
  text-align-vertical: top;
`;

const OCRButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  background-color: ${theme.colors.white};
  border-width: 2px;
  border-color: ${theme.colors.primary};
  border-radius: ${theme.borderRadius.full}px;
  padding: ${theme.spacing.md}px;
  margin-top: ${theme.spacing.lg}px;
`;

const OCRButtonText = styled.Text`
  font-size: 16px;
  font-weight: bold;
  color: ${theme.colors.primary};
  margin-left: ${theme.spacing.sm}px;
`;

const SubmitButton = styled.TouchableOpacity<{ disabled?: boolean }>`
  background-color: ${props => props.disabled ? theme.colors.text.disabled : theme.colors.primary};
  border-radius: ${theme.borderRadius.full}px;
  padding: ${theme.spacing.md}px;
  margin-vertical: ${theme.spacing.xl}px;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  ${theme.shadows.soft};
`;

const SubmitButtonText = styled.Text`
  color: ${theme.colors.white};
  font-size: 18px;
  font-weight: bold;
  margin-right: ${theme.spacing.sm}px;
`;

import axios from 'axios';
import { useUserStore } from '../store/userStore';
import { API_URL } from '../config/apiConfig';

const SentenceInputScreen = ({ route, navigation }: any) => {
  const { book } = route.params;
  const [sentence, setSentence] = useState('');
  const { userId } = useUserStore();
  const [loading, setLoading] = useState(false);

  const handleManualSubmit = async () => {
    if (!sentence.trim()) return;
    setLoading(true);
    console.log('Submitting sentence:', sentence);
    try {
      // Save seed to backend
      const response = await axios.post(`${API_URL}/seeds`, {
        userId,
        bookTitle: book.title,
        author: book.authors ? book.authors[0] : (book.author || '작자미상'),
        coverImage: book.thumbnail,
        sentence: sentence.trim(),
        inputType: 'MANUAL',
      });

      console.log('Seed saved successfully:', response.data);
      const seed = response.data;
      navigation.navigate('AIChat', { seed, book });
    } catch (error: any) {
      console.error('Error saving seed:', error);
      console.error('Error detail:', error.response?.data || error.message);
      Alert.alert('오류', '씨앗을 심는 중에 문제가 발생했어요. 서버가 켜져 있는지 확인해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleOCR = () => {
    // This would trigger Camera and then Vision API
    Alert.alert('안내', 'OCR 기능은 준비 중입니다! 사진에서 글자를 읽어올 거예요.');
  };

  return (
    <Container>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <Header>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ChevronLeft size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Title>씨앗 심기</Title>
        </Header>

        <Content contentContainerStyle={{ paddingBottom: 40 }}>
          <BookSummary>
            <BookSubtitle>함께 읽은 책</BookSubtitle>
            <BookTitleText>{book.title}</BookTitleText>
          </BookSummary>

          <InputLabel>가장 기억에 남는 문장이 무엇인가요?</InputLabel>

          <TextAreaContainer>
            <StyledTextInput
              multiline
              placeholder="여기에 문장을 적어주세요..."
              value={sentence}
              onChangeText={setSentence}
            />
          </TextAreaContainer>

          <OCRButton onPress={handleOCR}>
            <Camera size={20} color={theme.colors.primary} />
            <OCRButtonText>사진 찍어서 문장 가져오기</OCRButtonText>
          </OCRButton>

          <SubmitButton
            disabled={!sentence.trim() || loading}
            onPress={handleManualSubmit}
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.white} />
            ) : (
              <>
                <SubmitButtonText>이 문장으로 결정!</SubmitButtonText>
                <Send size={20} color={theme.colors.white} />
              </>
            )}
          </SubmitButton>
        </Content>
      </KeyboardAvoidingView>
    </Container>
  );
};

export default SentenceInputScreen;
