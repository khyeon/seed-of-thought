import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, Image } from 'react-native';
import styled from 'styled-components/native';
import { theme } from '../styles/theme';
import { ChevronLeft, Calendar, Book, Quote } from 'lucide-react-native';

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

const Author = styled.Text`
  font-size: 14px;
  color: ${theme.colors.text.secondary};
  margin-top: 4px;
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

const DiaryContent = styled.Text`
  font-size: 16px;
  color: ${theme.colors.text.primary};
  line-height: 26px;
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

const DiaryDetailScreen = ({ navigation, route }: any) => {
  const { diary } = route.params || {};

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

        <Card>
          <SectionTitle>
            <Quote size={16} color={theme.colors.primary} />
            <SectionLabel>내가 뽑은 문장</SectionLabel>
          </SectionTitle>
          <SentenceBox>
            <SentenceText>"{diary.chatRoom?.seed?.sentence || '선택한 문장이 없습니다.'}"</SentenceText>
          </SentenceBox>

          <SectionTitle>
            <Book size={16} color={theme.colors.primary} />
            <SectionLabel>나의 생각 열매</SectionLabel>
          </SectionTitle>
          <DiaryContent>{diary.content || '작성된 내용이 없습니다.'}</DiaryContent>

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
    </Container>
  );
};

export default DiaryDetailScreen;
