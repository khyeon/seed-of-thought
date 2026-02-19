import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import styled from 'styled-components/native';
import { theme } from '../styles/theme';
import { ChevronLeft, Info } from 'lucide-react-native';
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

const HeaderTitle = styled.Text`
  font-size: 20px;
  font-weight: bold;
  color: ${theme.colors.text.primary};
  margin-left: ${theme.spacing.md}px;
`;

const InstructionContainer = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: ${theme.colors.secondary};
  padding: ${theme.spacing.md}px;
  margin: ${theme.spacing.lg}px;
  border-radius: ${theme.borderRadius.md}px;
  opacity: 0.8;
`;

const InstructionText = styled.Text`
  font-size: 16px;
  color: ${theme.colors.primary};
  font-weight: bold;
  margin-left: ${theme.spacing.sm}px;
`;

const BookCard = styled.TouchableOpacity`
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

const BookSelectionScreen = ({ navigation }: any) => {
    const { userId } = useUserStore();
    const [books, setBooks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReadingBooks();
    }, []);

    const fetchReadingBooks = async () => {
        try {
            const response = await axios.get(`${API_URL}/user-books?userId=${userId}&status=READING`);
            setBooks(response.data);
        } catch (error) {
            console.error('Error fetching reading books:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (userBook: any) => {
        // Map UserBook back to the structure expected by SentenceInput
        const book = {
            title: userBook.bookTitle,
            authors: [userBook.author],
            thumbnail: userBook.coverImage,
            summary: userBook.summary,
        };
        navigation.navigate('SentenceInput', { book });
    };

    return (
        <Container>
            <Header>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
                <HeaderTitle>씨앗 심기</HeaderTitle>
            </Header>

            <InstructionContainer>
                <Info size={20} color={theme.colors.primary} />
                <InstructionText>책을 선택하세요.</InstructionText>
            </InstructionContainer>

            {loading ? (
                <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={books}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <BookCard onPress={() => handleSelect(item)}>
                            <BookCover source={{ uri: item.coverImage || 'https://via.placeholder.com/50x75' }} />
                            <BookInfo>
                                <BookTitle>{item.bookTitle}</BookTitle>
                                <BookAuthor>{item.author}</BookAuthor>
                            </BookInfo>
                        </BookCard>
                    )}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', marginTop: 100 }}>
                            <Text style={{ fontSize: 60 }}>📚</Text>
                            <Text style={{ marginTop: 20, color: theme.colors.text.disabled }}>읽고 있는 책이 없어요.</Text>
                            <TouchableOpacity
                                style={{ marginTop: 20, padding: 10, backgroundColor: theme.colors.primary, borderRadius: 20 }}
                                onPress={() => navigation.navigate('BookSearch')}
                            >
                                <Text style={{ color: 'white', fontWeight: 'bold' }}>책 담으러 가기</Text>
                            </TouchableOpacity>
                        </View>
                    }
                    contentContainerStyle={{ paddingVertical: 10 }}
                />
            )}
        </Container>
    );
};

export default BookSelectionScreen;
