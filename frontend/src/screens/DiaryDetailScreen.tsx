import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Image, Alert, ActivityIndicator, Platform, Modal, TextInput, KeyboardAvoidingView } from 'react-native';
import styled from 'styled-components/native';
import { theme } from '../styles/theme';
import { ChevronLeft, Calendar, Book, Quote, MessageCircle, Sparkles, Edit3 } from 'lucide-react-native';
import axios from 'axios';
import { API_URL } from '../config/apiConfig';

const Container = styled.SafeAreaView`
  flex: 1;
  background-color: ${theme.colors.background};
`;

const Header = styled.View`
  flex-direction: row;
  align-items: center;
  padding: ${theme.spacing.md}px ${theme.spacing.lg}px;
`;

const HeaderTitle = styled.Text`
  font-size: 18px;
  font-weight: bold;
  color: ${theme.colors.text.primary};
  margin-left: ${theme.spacing.md}px;
`;

const Content = styled.ScrollView`
  padding: ${theme.spacing.lg}px;
`;

const Card = styled.View`
  background-color: ${theme.colors.white};
  border-radius: ${theme.borderRadius.lg}px;
  padding: ${theme.spacing.lg}px;
  margin-bottom: ${theme.spacing.lg}px;
  ${theme.shadows.soft};
`;

const BookInfo = styled.View`
  flex-direction: row;
  margin-bottom: ${theme.spacing.lg}px;
`;

const BookCover = styled.Image`
  width: 80px;
  height: 120px;
  border-radius: ${theme.borderRadius.sm}px;
`;

const BookDetails = styled.View`
  flex: 1;
  margin-left: ${theme.spacing.md}px;
  justify-content: center;
`;

const BookTitle = styled.Text`
  font-size: 18px;
  font-weight: bold;
  color: ${theme.colors.text.primary};
`;

const SectionTitle = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: ${theme.spacing.sm}px;
`;

const SectionLabel = styled.Text`
  font-size: 14px;
  font-weight: bold;
  color: ${theme.colors.primary};
  margin-left: 6px;
`;

const SentenceBox = styled.View`
  background-color: ${theme.colors.background};
  padding: ${theme.spacing.md}px;
  border-radius: ${theme.borderRadius.md}px;
  margin-bottom: ${theme.spacing.lg}px;
  border-left-width: 4px;
  border-left-color: ${theme.colors.secondary};
`;

const SentenceText = styled.Text`
  font-size: 16px;
  font-style: italic;
  color: ${theme.colors.text.primary};
  line-height: 24px;
`;

const TagContainer = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  margin-top: ${theme.spacing.md}px;
`;

const Tag = styled.View`
  background-color: ${theme.colors.secondary};
  padding: 4px 12px;
  border-radius: 12px;
  margin-right: 8px;
  margin-bottom: 8px;
`;

const TagText = styled.Text`
  font-size: 12px;
  color: ${theme.colors.primary};
  font-weight: bold;
`;

const ChatContainer = styled.View`
  background-color: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md}px;
  padding: ${theme.spacing.lg}px;
  margin-top: ${theme.spacing.xl}px;
`;

const ChatBubble = styled.View<{ $isAi: boolean }>`
  background-color: ${props => props.$isAi ? theme.colors.white : theme.colors.primary + '20'};
  padding: ${theme.spacing.md}px;
  border-radius: ${theme.borderRadius.lg}px;
  margin-bottom: ${theme.spacing.md}px;
  align-self: ${props => props.$isAi ? 'flex-start' : 'flex-end'};
  max-width: 85%;
  ${theme.shadows.soft};
`;

const ChatText = styled.Text`
  font-size: 15px;
  color: ${theme.colors.text.primary};
  line-height: 24px;
`;

const SegmentContainer = styled.View`
  flex-direction: row;
  background-color: ${theme.colors.secondary}30;
  border-radius: 25px;
  padding: 4px;
  margin-bottom: ${theme.spacing.lg}px;
`;

const SegmentButton = styled.TouchableOpacity<{ active: boolean }>`
  flex: 1;
  background-color: ${props => props.active ? theme.colors.white : 'transparent'};
  padding: 10px;
  border-radius: 20px;
  align-items: center;
  ${props => props.active && theme.shadows.soft};
`;

const SegmentText = styled.Text<{ active: boolean }>`
  font-size: 15px;
  font-weight: bold;
  color: ${props => props.active ? theme.colors.primary : theme.colors.text.disabled};
`;

const ReportCard = styled.View`
  background-color: #E8F5E9;
  border-radius: ${theme.borderRadius.md}px;
  padding: ${theme.spacing.lg}px;
  margin-bottom: ${theme.spacing.lg}px;
  border-left-width: 6px;
  border-left-color: ${theme.colors.primary};
  flex-direction: row;
  align-items: flex-start;
`;

const ReportText = styled.Text`
  font-size: 15px;
  color: #2E7D32;
  line-height: 24px;
  flex: 1;
  margin-left: 8px;
  font-weight: bold;
`;

const DiaryDetailScreen = ({ navigation, route }: any) => {
  const { diary } = route.params || {};
  const [correctionData, setCorrectionData] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'original' | 'corrected'>('original');
  const [loadingCorrection, setLoadingCorrection] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedSentence, setSelectedSentence] = useState<{ text: string; index: number }>({ text: '', index: 0 });
  const [manualInput, setManualInput] = useState('');
  const [savingManual, setSavingManual] = useState(false);
  const [fullContentModalVisible, setFullContentModalVisible] = useState(false);
  const [fullContentInput, setFullContentInput] = useState('');
  const [savingFullContent, setSavingFullContent] = useState(false);

  useEffect(() => {
    fetchCorrection();
  }, []);

  const fetchCorrection = async () => {
    try {
      const response = await axios.get(`${API_URL}/diaries/${diary.id}/correction`);
      setCorrectionData(response.data);
      if (response.data?.status === 'COMPLETED') {
        setViewMode('corrected');
      }
    } catch (e) {
      console.log('No correction data yet');
    }
  };

  const handleStartCorrection = async () => {
    setLoadingCorrection(true);
    try {
      const response = await axios.post(`${API_URL}/diaries/${diary.id}/correction/analyze`);
      navigation.navigate('DiaryCorrection', { diary, correction: response.data });
    } catch (error) {
      console.error(error);
      if (Platform.OS === 'web') {
        window.alert('생각 분석을 시작하지 못했습니다.');
      } else {
        Alert.alert('오류', '생각 분석을 시작하지 못했습니다.');
      }
    } finally {
      setLoadingCorrection(false);
    }
  };

  const startCorrectionProcess = async (sentence: string, index: number) => {
    try {
      // Ensure correction object is analyzed/created
      await axios.post(`${API_URL}/diaries/${diary.id}/correction/analyze`);
      // Create manual correction item
      await axios.post(`${API_URL}/diaries/${diary.id}/correction/manual`, {
        sentenceIndex: index,
        originalSentence: sentence,
        userHint: '스스로 다듬고 싶어 터치한 문장입니다.'
      });
      // Fetch latest correction items
      const latestCorrection = await axios.get(`${API_URL}/diaries/${diary.id}/correction`);
      navigation.navigate('DiaryCorrection', { diary, correction: latestCorrection.data });
    } catch (error) {
      console.error(error);
      if (Platform.OS === 'web') {
        window.alert('문장 다듬기 준비에 실패했습니다.');
      } else {
        Alert.alert('오류', '문장 다듬기 준비에 실패했습니다.');
      }
    }
  };

  const openDirectEditModal = (sentence: string, index: number) => {
    setSelectedSentence({ text: sentence, index });
    setManualInput(sentence);
    setEditModalVisible(true);
  };

  const handleSaveManualDirectEdit = async () => {
    if (!manualInput.trim()) return;
    setSavingManual(true);
    try {
      await axios.post(`${API_URL}/diaries/${diary.id}/correction/analyze`);
      const manualRes = await axios.post(`${API_URL}/diaries/${diary.id}/correction/manual`, {
        sentenceIndex: selectedSentence.index,
        originalSentence: selectedSentence.text,
        userHint: '직접 수정한 문장입니다.'
      });
      await axios.patch(`${API_URL}/diaries/${diary.id}/correction/items/${manualRes.data.id}`, {
        correctedSentence: manualInput.trim(),
        status: 'RESOLVED'
      });
      await axios.post(`${API_URL}/diaries/${diary.id}/correction/complete`);
      await fetchCorrection();
      setEditModalVisible(false);
      if (Platform.OS === 'web') {
        window.alert('문장 수정이 완료되었습니다! 🍎');
      } else {
        Alert.alert('저장 완료', '문장 수정이 완료되었습니다! 🍎');
      }
    } catch (err) {
      console.error(err);
      if (Platform.OS === 'web') {
        window.alert('문장 수정에 실패했습니다.');
      } else {
        Alert.alert('오류', '문장 수정에 실패했습니다.');
      }
    } finally {
      setSavingManual(false);
    }
  };

  const handleSaveFullContentEdit = async () => {
    if (!fullContentInput.trim()) return;
    setSavingFullContent(true);
    try {
      const res = await axios.patch(`${API_URL}/diaries/${diary.id}`, {
        content: fullContentInput.trim(),
      });
      diary.content = res.data.content;
      setCorrectionData(null);
      setViewMode('original');
      setFullContentModalVisible(false);

      if (Platform.OS === 'web') {
        window.alert('열매 전체 글이 수정되었습니다! 이전 다듬기 정보는 초기화되었으며, 필요할 때 언제든 다시 다듬을 수 있습니다. 🍎');
      } else {
        Alert.alert('수정 완료', '열매 전체 글이 수정되었습니다!\n이전 다듬기 정보는 초기화되었으며, 필요할 때 언제든 다시 다듬을 수 있습니다. 🍎');
      }
    } catch (err) {
      console.error(err);
      if (Platform.OS === 'web') {
        window.alert('전체 글 수정에 실패했습니다.');
      } else {
        Alert.alert('오류', '전체 글 수정에 실패했습니다.');
      }
    } finally {
      setSavingFullContent(false);
    }
  };

  const handleSentencePress = (sentence: string, index: number) => {
    if (Platform.OS === 'web') {
      const choice = window.confirm(
        `[문장 다듬기 및 수정]\n\n"${sentence}"\n\n[확인]: AI와 함께 다듬기 화면으로 이동\n[취소]: 내가 직접 문장 고치기`
      );
      if (choice) {
        startCorrectionProcess(sentence, index);
      } else {
        openDirectEditModal(sentence, index);
      }
    } else {
      Alert.alert(
        '문장 다듬기 및 수정',
        `"${sentence}"\n\n원하시는 방식을 선택해 주세요.`,
        [
          { text: '닫기', style: 'cancel' },
          {
            text: '📝 내가 직접 고치기',
            onPress: () => openDirectEditModal(sentence, index)
          },
          {
            text: '✏️ AI와 함께 다듬기',
            onPress: () => startCorrectionProcess(sentence, index)
          }
        ]
      );
    }
  };

  const handleCorrectedSentencePress = (corrected: string, original: string) => {
    const message = `[다듬기 전 원래 문장]\n"${original}"\n\n[다듬은 후 현재 문장]\n"${corrected}"`;
    if (Platform.OS === 'web') {
      window.alert(message);
    } else {
      Alert.alert('원래 문장 보기', message);
    }
  };

  const splitIntoSentences = (text: string): string[] => {
    if (!text) return [];
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    return sentences.map(s => s.trim()).filter(Boolean);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  if (!diary) {
    return (
      <Container>
        <Header>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ChevronLeft size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <HeaderTitle>오류</HeaderTitle>
        </Header>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>일기 데이터를 불러올 수 없습니다.</Text>
        </View>
      </Container>
    );
  }

  const originalSentences = splitIntoSentences(diary.content);
  
  // Find which original index mapped to what original/corrected content
  const originalItemsMap = new Map<number, { original: string; corrected: string }>();
  if (correctionData?.items) {
    correctionData.items.forEach((item: any) => {
      if (item.status === 'RESOLVED' && item.correctedSentence) {
        originalItemsMap.set(item.sentenceIndex, {
          original: item.originalSentence,
          corrected: item.correctedSentence
        });
      }
    });
  }

  const renderDiaryContent = () => {
    if (viewMode === 'corrected' && correctionData?.correctedContent) {
      const fullText = correctionData.correctedContent;
      const resolvedItems = correctionData.items?.filter((item: any) => item.status === 'RESOLVED' && item.correctedSentence) || [];
      
      if (resolvedItems.length === 0) {
        return (
          <Text style={{ fontSize: 16, color: theme.colors.text.primary, lineHeight: 26 }}>
            {fullText}
          </Text>
        );
      }

      // Sort by length descending to replace larger chunks first
      const sortedItems = [...resolvedItems].sort((a, b) => b.correctedSentence.length - a.correctedSentence.length);
      let tempText = fullText;
      const itemMap = new Map<string, any>();

      sortedItems.forEach((item) => {
        const token = `__CORRECTION_ITEM_${item.id}__`;
        itemMap.set(token, item);
        const escaped = item.correctedSentence.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        tempText = tempText.replace(new RegExp(escaped, 'g'), token);
      });

      const tokens = Array.from(itemMap.keys());
      const regex = new RegExp(`(${tokens.join('|')})`, 'g');
      const parts = tempText.split(regex);

      return (
        <View style={{ width: '100%', flexDirection: 'column' }}>
          {parts.map((part, index) => {
            if (itemMap.has(part)) {
              const item = itemMap.get(part);
              return (
                <TouchableOpacity 
                  key={`corr-touch-${index}`}
                  onPress={() => handleCorrectedSentencePress(item.correctedSentence, item.originalSentence)}
                  style={{
                    backgroundColor: '#FFF9C4',
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                    marginVertical: 4,
                    borderRadius: 8,
                    width: '100%',
                    alignSelf: 'stretch',
                  }}
                >
                  <Text style={{ fontSize: 16, color: theme.colors.text.primary, fontWeight: 'bold', textDecorationLine: 'underline', lineHeight: 24, flexWrap: 'wrap' }}>
                    {item.correctedSentence}
                  </Text>
                </TouchableOpacity>
              );
            }
            return (
              <Text key={`corr-flat-${index}`} style={{ fontSize: 16, color: theme.colors.text.primary, lineHeight: 26, marginVertical: 2 }}>
                {part}{' '}
              </Text>
            );
          })}
        </View>
      );
    }

    // Original Mode (clickable sentences)
    return (
      <View style={{ width: '100%', flexDirection: 'column' }}>
        {originalSentences.map((sentence, index) => (
          <TouchableOpacity
            key={`orig-touch-${index}`}
            onPress={() => handleSentencePress(sentence, index)}
            style={{
              backgroundColor: '#ECEFF1',
              paddingHorizontal: 10,
              paddingVertical: 8,
              marginVertical: 4,
              borderRadius: 8,
              width: '100%',
              alignSelf: 'stretch',
            }}
          >
            <Text style={{ fontSize: 16, color: theme.colors.text.primary, lineHeight: 24, flexWrap: 'wrap' }}>
              {sentence}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <Container>
      <Header>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <HeaderTitle>열매 보기</HeaderTitle>
      </Header>

      <Content showsVerticalScrollIndicator={false}>
        <BookInfo>
          <BookCover source={{ uri: diary.imageUrl || 'https://via.placeholder.com/80x120' }} />
          <BookDetails>
            <BookTitle>{diary.chatRoom?.seed?.bookTitle || '읽은 책'}</BookTitle>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
              <Calendar size={14} color={theme.colors.text.disabled} />
              <Text style={{ fontSize: 13, color: theme.colors.text.disabled, marginLeft: 4 }}>
                {formatDate(diary.createdAt)}
              </Text>
            </View>
          </BookDetails>
        </BookInfo>

        {correctionData?.status === 'COMPLETED' && (
          <SegmentContainer>
            <SegmentButton active={viewMode === 'original'} onPress={() => setViewMode('original')}>
              <SegmentText active={viewMode === 'original'}>원문 보기</SegmentText>
            </SegmentButton>
            <SegmentButton active={viewMode === 'corrected'} onPress={() => setViewMode('corrected')}>
              <SegmentText active={viewMode === 'corrected'}>완성본 보기</SegmentText>
            </SegmentButton>
          </SegmentContainer>
        )}

        {viewMode === 'corrected' && correctionData?.aiReport && (
          <ReportCard>
            <Sparkles size={20} color="#2E7D32" style={{ marginTop: 2 }} />
            <ReportText>{correctionData.aiReport}</ReportText>
          </ReportCard>
        )}

        <Card>
          <SectionTitle>
            <Quote size={16} color={theme.colors.primary} />
            <SectionLabel>내가 뽑은 문장</SectionLabel>
          </SectionTitle>
          <SentenceBox>
            <SentenceText>"{diary.chatRoom?.seed?.sentence || '선택한 문장이 없습니다.'}"</SentenceText>
          </SentenceBox>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 8 }}>
            <SectionTitle style={{ marginBottom: 0 }}>
              <Book size={16} color={theme.colors.primary} />
              <SectionLabel>나의 생각 열매</SectionLabel>
            </SectionTitle>
            <TouchableOpacity
              onPress={() => {
                setFullContentInput(diary.content || '');
                setFullContentModalVisible(true);
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#F1F8E9',
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: '#C8E6C9'
              }}
            >
              <Edit3 size={13} color={theme.colors.primary} style={{ marginRight: 4 }} />
              <Text style={{ fontSize: 13, color: theme.colors.primary, fontWeight: 'bold' }}>전체 글 수정</Text>
            </TouchableOpacity>
          </View>
          {renderDiaryContent()}

          {viewMode === 'original' && (
            <Text style={{ fontSize: 13, color: theme.colors.text.disabled, marginTop: 12, fontStyle: 'italic' }}>
              💡 문장을 터치하여 직접 다듬거나 수정할 수 있습니다.
            </Text>
          )}
          {viewMode === 'corrected' && (
            <Text style={{ fontSize: 13, color: theme.colors.text.disabled, marginTop: 12, fontStyle: 'italic' }}>
              💡 노란색 문장을 터치하면 다듬기 전 원래 문장을 볼 수 있습니다.
            </Text>
          )}

          <TagContainer>
            {diary.keywords && Array.isArray(diary.keywords) && diary.keywords.map((keyword: string, index: number) => (
              <Tag key={index}>
                <TagText>#{keyword}</TagText>
              </Tag>
            ))}
            {diary.emotion && (
              <Tag style={{ backgroundColor: theme.colors.primary }}>
                <TagText style={{ color: 'white' }}>{diary.emotion}</TagText>
              </Tag>
            )}
          </TagContainer>
        </Card>

        {(!correctionData || correctionData.status !== 'COMPLETED') && (
          <TouchableOpacity
            style={{
              backgroundColor: theme.colors.primary,
              padding: 16,
              borderRadius: 12,
              alignItems: 'center',
              marginBottom: 16,
              flexDirection: 'row',
              justifyContent: 'center',
              ...theme.shadows.soft,
            }}
            onPress={handleStartCorrection}
            disabled={loadingCorrection}
          >
            {loadingCorrection ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Sparkles size={18} color="white" style={{ marginRight: 6 }} />
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                  생각 다듬으러 가기 🍎
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {diary.chatRoom?.messages && diary.chatRoom.messages.length > 0 && (
          <Card style={{ marginTop: 0 }}>
            <SectionTitle>
              <MessageCircle size={16} color={theme.colors.primary} />
              <SectionLabel>이날 나눈 대화</SectionLabel>
            </SectionTitle>

            <ChatContainer>
              {diary.chatRoom.messages.map((msg: any, index: number) => (
                <ChatBubble key={`msg-${index}`} $isAi={msg.sender === 'AI'}>
                  <ChatText>{msg.content}</ChatText>
                </ChatBubble>
              ))}
            </ChatContainer>
          </Card>
        )}

        <TouchableOpacity
          style={{
            backgroundColor: theme.colors.background,
            padding: 16,
            borderRadius: 12,
            alignItems: 'center',
            marginBottom: 40,
            borderWidth: 1,
            borderColor: theme.colors.secondary
          }}
          onPress={() => navigation.goBack()}
        >
          <Text style={{ color: theme.colors.text.secondary, fontWeight: 'bold' }}>목록으로 돌아가기</Text>
        </TouchableOpacity>
      </Content>

      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}
        >
          <View style={{ width: '100%', maxWidth: 450, backgroundColor: 'white', borderRadius: 16, padding: 20, ...theme.shadows.soft }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.colors.text.primary, marginBottom: 12 }}>
              문장 직접 고치기 📝
            </Text>
            <Text style={{ fontSize: 13, color: theme.colors.text.disabled, marginBottom: 6 }}>
              원래 쓴 문장:
            </Text>
            <View style={{ backgroundColor: '#ECEFF1', padding: 12, borderRadius: 8, marginBottom: 16 }}>
              <Text style={{ fontSize: 14, color: theme.colors.text.secondary, fontStyle: 'italic', lineHeight: 20 }}>
                "{selectedSentence.text}"
              </Text>
            </View>
            <Text style={{ fontSize: 14, color: theme.colors.text.primary, fontWeight: 'bold', marginBottom: 8 }}>
              어떻게 고치고 싶나요?
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: theme.colors.secondary,
                borderRadius: 8,
                padding: 12,
                fontSize: 15,
                lineHeight: 22,
                minHeight: 90,
                textAlignVertical: 'top',
                marginBottom: 20,
                color: theme.colors.text.primary,
                backgroundColor: '#FAFAFA'
              }}
              multiline
              value={manualInput}
              onChangeText={setManualInput}
              placeholder="수정할 내용을 자유롭게 입력하세요."
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                style={{ paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, marginRight: 8 }}
              >
                <Text style={{ color: theme.colors.text.secondary, fontWeight: 'bold' }}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveManualDirectEdit}
                disabled={savingManual}
                style={{ backgroundColor: theme.colors.primary, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 }}
              >
                {savingManual ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={{ color: 'white', fontWeight: 'bold' }}>저장하기</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={fullContentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFullContentModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}
        >
          <View style={{ width: '100%', maxWidth: 500, backgroundColor: 'white', borderRadius: 16, padding: 20, ...theme.shadows.soft }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.colors.text.primary, marginBottom: 8 }}>
              열매 전체 글 수정하기 📝
            </Text>
            <Text style={{ fontSize: 12, color: '#E65100', backgroundColor: '#FFF3E0', padding: 10, borderRadius: 6, marginBottom: 14, lineHeight: 18 }}>
              💡 전체 글을 수정하여 저장하면 이전의 AI 다듬기 이력은 초기화됩니다. 필요할 때 언제든 '생각 다듬으러 가기'를 통해 새로 AI 다듬기를 시작하실 수 있습니다.
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: theme.colors.secondary,
                borderRadius: 8,
                padding: 12,
                fontSize: 15,
                lineHeight: 24,
                minHeight: 160,
                textAlignVertical: 'top',
                marginBottom: 20,
                color: theme.colors.text.primary,
                backgroundColor: '#FAFAFA'
              }}
              multiline
              value={fullContentInput}
              onChangeText={setFullContentInput}
              placeholder="생각 열매 전체 내용을 입력하세요."
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => setFullContentModalVisible(false)}
                style={{ paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, marginRight: 8 }}
              >
                <Text style={{ color: theme.colors.text.secondary, fontWeight: 'bold' }}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveFullContentEdit}
                disabled={savingFullContent}
                style={{ backgroundColor: theme.colors.primary, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 }}
              >
                {savingFullContent ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={{ color: 'white', fontWeight: 'bold' }}>전체 글 저장하기</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Container>
  );
};

export default DiaryDetailScreen;
