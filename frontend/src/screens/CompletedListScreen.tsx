import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
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

const CompletedListScreen = ({ navigation }: any) => {
    const { userId } = useUserStore();
    const [books, setBooks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBooks();
    }, []);

    const fetchBooks = async () => {
        try {
            const response = await axios.get(`${API_URL}/user-books?userId=${userId}&status=COMPLETED`);
            setBooks(response.data);
        } catch (error) {
            console.error('Error fetching books:', error);
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
                <Title>다 읽은 책</Title>
            </Header>

            {loading ? (
                <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={books}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <BookCard onPress={() => navigation.navigate('Archive', { bookTitle: item.bookTitle })}>
                            <BookCover source={{ uri: item.coverImage || 'https://via.placeholder.com/50x75' }} />
                            <BookInfo>
                                <BookTitle>{item.bookTitle}</BookTitle>
                                <BookAuthor>{item.author}</BookAuthor>
                            </BookInfo>
                        </BookCard>
                    )}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', marginTop: 100 }}>
                            <Text style={{ fontSize: 60 }}>🌟</Text>
                            <Text style={{ marginTop: 20, color: theme.colors.text.disabled }}>완주한 책이 아직 없어요. 화이팅!</Text>
                        </View>
                    }
                    contentContainerStyle={{ paddingVertical: 10 }}
                />
            )}
        </Container>
    );
};

export default CompletedListScreen;
