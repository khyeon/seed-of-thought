import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    FlatList,
    Image,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import styled from 'styled-components/native';
import { theme } from '../styles/theme';
import { Search, ChevronLeft } from 'lucide-react-native';

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

const SearchBarContainer = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: ${theme.colors.white};
  margin: ${theme.spacing.md}px ${theme.spacing.lg}px;
  padding: ${theme.spacing.sm}px ${theme.spacing.md}px;
  border-radius: ${theme.borderRadius.md}px;
  ${theme.shadows.soft};
`;

const StyledTextInput = styled.TextInput`
  flex: 1;
  height: 40px;
  margin-left: ${theme.spacing.sm}px;
  color: ${theme.colors.text.primary};
`;

const BookItem = styled.TouchableOpacity`
  flex-direction: row;
  background-color: ${theme.colors.white};
  margin-horizontal: ${theme.spacing.lg}px;
  margin-bottom: ${theme.spacing.md}px;
  padding: ${theme.spacing.md}px;
  border-radius: ${theme.borderRadius.md}px;
  ${theme.shadows.soft};
`;

const BookCover = styled.Image`
  width: 60px;
  height: 90px;
  border-radius: ${theme.borderRadius.sm}px;
  background-color: ${theme.colors.secondary};
`;

const BookInfo = styled.View`
  flex: 1;
  margin-left: ${theme.spacing.md}px;
  justify-content: center;
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

import axios from 'axios';
import { API_URL } from '../config/apiConfig';

const BookSearchScreen = ({ navigation }: any) => {
    const [query, setQuery] = useState('');
    const [books, setBooks] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async () => {
        if (!query.trim()) return;
        setLoading(true);
        try {
            const searchUrl = `${API_URL}/books/search?query=${query}`;
            console.log('AIChat - search: Calling URL:', searchUrl);
            const response = await axios.get(searchUrl);
            console.log('AIChat - search: Response received', response.data);

            // Map backend structure to frontend structure if necessary
            const formattedBooks = response.data.map((book: any, index: number) => ({
                id: book.id || index.toString(),
                title: book.title,
                author: book.authors?.join(', ') || '작자미상',
                thumbnail: book.thumbnail || 'https://via.placeholder.com/60x90?text=No+Image',
                summary: book.summary, // Pass the summary from backend
            }));

            setBooks(formattedBooks);
        } catch (error) {
            console.error('Search error:', error);
            // Fallback to mock for demo if backend fails or no API key
            const mockResults = [
                {
                    id: 'm1',
                    title: '어린왕자',
                    author: '생텍쥐페리',
                    thumbnail: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=200',
                },
                {
                    id: 'm2',
                    title: '아낌없이 주는 나무',
                    author: '쉘 실버스타인',
                    thumbnail: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=200',
                },
            ].filter(b => b.title.includes(query));
            setBooks(mockResults);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container>
            <Header>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
                <Title>어떤 책을 읽었나요?</Title>
            </Header>

            <SearchBarContainer>
                <Search size={20} color={theme.colors.text.disabled} />
                <StyledTextInput
                    placeholder="책 제목을 검색해 보세요"
                    value={query}
                    onChangeText={setQuery}
                    onSubmitEditing={handleSearch}
                    returnKeyType="search"
                />
                <TouchableOpacity onPress={handleSearch}>
                    <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>검색</Text>
                </TouchableOpacity>
            </SearchBarContainer>

            {loading ? (
                <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={books}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <BookItem onPress={() => navigation.navigate('SentenceInput', { book: item })}>
                            <BookCover source={{ uri: item.thumbnail }} />
                            <BookInfo>
                                <BookTitle>{item.title}</BookTitle>
                                <BookAuthor>{item.author}</BookAuthor>
                            </BookInfo>
                        </BookItem>
                    )}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    ListEmptyComponent={
                        query.length > 0 && !loading ? (
                            <Text style={{ textAlign: 'center', marginTop: 20, color: theme.colors.text.disabled }}>
                                검색 결과가 없습니다.
                            </Text>
                        ) : null
                    }
                />
            )}
        </Container>
    );
};

export default BookSearchScreen;
