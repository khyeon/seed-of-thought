import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Image, Alert, Platform } from 'react-native';
import styled from 'styled-components/native';
import { theme } from '../styles/theme';
import { ChevronLeft } from 'lucide-react-native';
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
  padding: ${theme.spacing.md}px ${theme.spacing.lg}px;
`;

const Title = styled.Text`
  font-size: 20px;
  font-weight: bold;
  color: ${theme.colors.text.primary};
  margin-left: ${theme.spacing.md}px;
`;

const BookCard = styled.View`
  background-color: ${theme.colors.white};
  margin-horizontal: ${theme.spacing.lg}px;
  margin-bottom: ${theme.spacing.md}px;
  padding: ${theme.spacing.md}px;
  border-radius: ${theme.borderRadius.md}px;
  flex-direction: row;
  align-items: center;
  ${theme.shadows.soft};
`;

const BookCover = styled.Image`
  width: 50px;
  height: 75px;
  border-radius: ${theme.borderRadius.sm}px;
`;

const BookInfo = styled.View`
  flex: 1;
  margin-left: ${theme.spacing.md}px;
`;

const LinkArea = styled.TouchableOpacity`
  flex: 1;
  flex-direction: row;
  align-items: center;
`;

const BookTitle = styled.Text`
  font-size: 16px;
  font-weight: bold;
  color: ${theme.colors.text.primary};
`;

const BookAuthor = styled.Text`
  font-size: 14px;
  color: ${theme.colors.text.secondary};
  margin-top: 4px;
`;

const ActionButton = styled.TouchableOpacity`
  background-color: ${theme.colors.primary};
  padding: 8px 12px;
  border-radius: 15px;
  align-items: center;
  min-width: 80px;
`;

const ActionText = styled.Text`
  color: ${theme.colors.white};
  font-size: 12px;
  font-weight: bold;
`;

const ButtonContainer = styled.View`
  flex-direction: column;
  gap: 8px;
  margin-left: 10px;
`;

const SecondaryButton = styled.TouchableOpacity`
  background-color: ${theme.colors.accent};
  padding: 8px 12px;
  border-radius: 15px;
  align-items: center;
  min-width: 80px;
`;

const SecondaryText = styled.Text`
  color: ${theme.colors.text.primary};
  font-size: 12px;
  font-weight: bold;
`;

const ReadingListScreen = ({ navigation }: any) => {
    const { userId } = useUserStore();
    const [books, setBooks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBooks();
    }, []);

    const fetchBooks = async () => {
        try {
            const response = await axios.get(`${API_URL}/user-books?userId=${userId}&status=READING`);
            setBooks(response.data);
        } catch (error) {
            console.error('Error fetching books:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: string) => {
        console.log('Update status clicked for book:', id);
        const update = async () => {
            try {
                await axios.patch(`${API_URL}/user-books/${id}/status`, { status: 'COMPLETED' });
                fetchBooks();
            } catch (error) {
                console.error('Error updating status:', error);
                Alert.alert('오류', '상태를 업데이트하지 못했습니다.');
            }
        };

        if (Platform.OS === 'web') {
            if ((window as any).confirm('이 책을 다 읽으셨나요? 다 읽은 책 목록으로 이동합니다.')) {
                update();
            }
        } else {
            Alert.alert(
                '읽기 완료',
                '이 책을 다 읽으셨나요? 다 읽은 책 목록으로 이동합니다.',
                [
                    { text: '취소', style: 'cancel' },
                    { text: '완료', onPress: update }
                ]
            );
        }
    };

    return (
        <Container>
            <Header>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
                <Title>읽고 있는 책</Title>
            </Header>

            {loading ? (
                <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={books}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <BookCard>
                            <LinkArea onPress={() => navigation.navigate('SentenceInput', {
                                book: {
                                    title: item.bookTitle,
                                    authors: [item.author],
                                    thumbnail: item.coverImage,
                                    summary: item.summary
                                }
                            })}>
                                <BookCover source={{ uri: item.coverImage || 'https://via.placeholder.com/50x75' }} />
                                <BookInfo>
                                    <BookTitle numberOfLines={1}>{item.bookTitle}</BookTitle>
                                    <BookAuthor>{item.author}</BookAuthor>
                                </BookInfo>
                            </LinkArea>
                            <ButtonContainer>
                                <ActionButton onPress={() => handleUpdateStatus(item.id)}>
                                    <ActionText>읽기 완료</ActionText>
                                </ActionButton>
                                <SecondaryButton onPress={() => navigation.navigate('Archive', { bookTitle: item.bookTitle })}>
                                    <SecondaryText>열매 보기</SecondaryText>
                                </SecondaryButton>
                            </ButtonContainer>
                        </BookCard>
                    )}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', marginTop: 100 }}>
                            <Text style={{ fontSize: 60 }}>📖</Text>
                            <Text style={{ marginTop: 20, color: theme.colors.text.disabled }}>지금 읽고 있는 책이 없어요.</Text>
                        </View>
                    }
                    contentContainerStyle={{ paddingVertical: 10 }}
                />
            )}
        </Container>
    );
};

export default ReadingListScreen;
