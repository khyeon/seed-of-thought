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
  background-color: ${theme.colors.accent};
  padding: 8px 12px;
  border-radius: 15px;
  align-items: center;
  min-width: 80px;
`;

const ActionText = styled.Text`
  color: ${theme.colors.text.primary};
  font-size: 12px;
  font-weight: bold;
`;

const ButtonContainer = styled.View`
  flex-direction: column;
  gap: 8px;
  margin-left: 10px;
`;

const SecondaryButton = styled.TouchableOpacity`
  background-color: ${theme.colors.primary};
  padding: 8px 12px;
  border-radius: 15px;
  align-items: center;
  min-width: 80px;
`;

const SecondaryText = styled.Text`
  color: ${theme.colors.white};
  font-size: 12px;
  font-weight: bold;
`;

const StatsContainer = styled.View`
  background-color: ${theme.colors.white};
  margin-horizontal: ${theme.spacing.lg}px;
  margin-top: ${theme.spacing.md}px;
  margin-bottom: ${theme.spacing.lg}px;
  padding: ${theme.spacing.lg}px;
  border-radius: ${theme.borderRadius.lg}px;
  ${theme.shadows.soft};
`;

const StatsHeader = styled.Text`
  font-size: 16px;
  font-weight: bold;
  color: ${theme.colors.text.primary};
  margin-bottom: ${theme.spacing.md}px;
`;

const BarChart = styled.View`
  flex-direction: row;
  align-items: flex-end;
  justify-content: space-between;
  height: 120px;
  padding-bottom: 30px;
`;

const BarWrapper = styled.View`
  align-items: center;
  flex: 1;
`;

const Bar = styled.View<{ height: number }>`
  width: 24px;
  height: ${props => Math.max(props.height, 2)}px;
  background-color: ${theme.colors.primary};
  border-top-left-radius: 6px;
  border-top-right-radius: 6px;
`;

const BarLabel = styled.Text`
  font-size: 11px;
  color: ${theme.colors.text.disabled};
  position: absolute;
  bottom: -25px;
  width: 100%;
  text-align: center;
`;

const BarCount = styled.Text`
  font-size: 13px;
  font-weight: bold;
  color: ${theme.colors.primary};
  margin-bottom: 4px;
`;

const CompletedListScreen = ({ navigation }: any) => {
    const { userId } = useUserStore();
    const [books, setBooks] = useState<any[]>([]);
    const [stats, setStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                await Promise.all([fetchBooks(), fetchStats()]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [userId]);

    const fetchStats = async () => {
        try {
            console.log('Fetching stats for user:', userId);
            const response = await axios.get(`${API_URL}/user-books/stats?userId=${userId}`);
            console.log('Stats response:', response.data);
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchBooks = async () => {
        try {
            console.log('Fetching books for user:', userId);
            const response = await axios.get(`${API_URL}/user-books?userId=${userId}&status=COMPLETED`);
            setBooks(response.data);
        } catch (error) {
            console.error('Error fetching books:', error);
        }
    };

    const renderStats = () => {
        if (loading) return null;
        if (stats.length === 0) return (
            <StatsContainer>
                <StatsHeader>월별 읽은 권수 📚</StatsHeader>
                <Text style={{ color: theme.colors.text.disabled, textAlign: 'center' }}>가져오는 중...</Text>
            </StatsContainer>
        );
        const maxCount = Math.max(...stats.map(s => s.count), 1);

        return (
            <StatsContainer>
                <StatsHeader>월별 읽은 권수 📚</StatsHeader>
                <BarChart>
                    {stats.map((s, index) => {
                        const [year, month] = s.month.split('-');
                        return (
                            <BarWrapper key={index}>
                                <BarCount>{s.count > 0 ? `${s.count}권` : '-'}</BarCount>
                                <Bar height={(s.count / maxCount) * 60} />
                                <BarLabel>{year}년 {parseInt(month)}월</BarLabel>
                            </BarWrapper>
                        );
                    })}
                </BarChart>
            </StatsContainer>
        );
    };

    const handleUpdateStatus = async (id: string) => {
        console.log('Update status clicked for book (completed):', id);
        const update = async () => {
            try {
                await axios.patch(`${API_URL}/user-books/${id}/status`, { status: 'READING' });
                fetchBooks();
            } catch (error) {
                console.error('Error updating status:', error);
                Alert.alert('오류', '상태를 업데이트하지 못했습니다.');
            }
        };

        if (Platform.OS === 'web') {
            if ((window as any).confirm('이 책을 다시 읽고 있는 책 목록으로 옮길까요?')) {
                update();
            }
        } else {
            Alert.alert(
                '다시 읽기',
                '이 책을 다시 읽고 있는 책 목록으로 옮길까요?',
                [
                    { text: '취소', style: 'cancel' },
                    { text: '이동', onPress: update }
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
                <Title>다 읽은 책</Title>
            </Header>

            {loading ? (
                <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={books}
                    keyExtractor={(item) => item.id}
                    ListHeaderComponent={renderStats()}
                    renderItem={({ item }) => (
                        <BookCard>
                            <LinkArea onPress={() => navigation.navigate('Archive', { bookTitle: item.bookTitle })}>
                                <BookCover source={{ uri: item.coverImage || 'https://via.placeholder.com/50x75' }} />
                                <BookInfo>
                                    <BookTitle numberOfLines={1}>{item.bookTitle}</BookTitle>
                                    <BookAuthor>{item.author}</BookAuthor>
                                </BookInfo>
                            </LinkArea>
                            <ButtonContainer>
                                <ActionButton onPress={() => handleUpdateStatus(item.id)}>
                                    <ActionText>다시 읽기</ActionText>
                                </ActionButton>
                                <SecondaryButton onPress={() => navigation.navigate('Archive', { bookTitle: item.bookTitle })}>
                                    <SecondaryText>열매 보기</SecondaryText>
                                </SecondaryButton>
                            </ButtonContainer>
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
