import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Image,
} from 'react-native';
import styled from 'styled-components/native';
import { theme } from '../styles/theme';
import { ChevronLeft, Calendar as CalendarIcon, Filter } from 'lucide-react-native';
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

const DiaryCard = styled.TouchableOpacity`
  background-color: ${theme.colors.white};
  margin-horizontal: ${theme.spacing.lg}px;
  margin-bottom: ${theme.spacing.md}px;
  padding: ${theme.spacing.md}px;
  border-radius: ${theme.borderRadius.md}px;
  flex-direction: row;
  ${theme.shadows.soft};
`;

const BookCover = styled.Image`
  width: 50px;
  height: 75px;
  border-radius: ${theme.borderRadius.sm}px;
`;

const DiaryInfo = styled.View`
  flex: 1;
  margin-left: ${theme.spacing.md}px;
  justify-content: center;
`;

const DiaryDate = styled.Text`
  font-size: 12px;
  color: ${theme.colors.text.disabled};
`;

const DiaryTitle = styled.Text`
  font-size: 16px;
  font-weight: bold;
  color: ${theme.colors.text.primary};
  margin-vertical: 4px;
`;

const DiaryPreview = styled.Text`
  font-size: 14px;
  color: ${theme.colors.text.secondary};
`;

const ArchiveScreen = ({ navigation, route }: any) => {
    const { userId: currentUserId } = useUserStore();
    const targetUserId = route.params?.targetUserId || currentUserId;
    const targetUserName = route.params?.targetUserName;

    const [diaries, setDiaries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchDiaries();
        });
        return unsubscribe;
    }, [navigation, targetUserId]);

    const fetchDiaries = async () => {
        try {
            const response = await axios.get(`${API_URL}/diaries?userId=${targetUserId}`);
            setDiaries(response.data);
        } catch (error) {
            console.error('Error fetching diaries:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
    };

    return (
        <Container>
            <Header>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
                <Title>{targetUserName ? `${targetUserName}의 ` : ''}기록 보관소</Title>
                <TouchableOpacity>
                    <Filter size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
            </Header>

            {loading ? (
                <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={diaries}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <DiaryCard activeOpacity={0.7} onPress={() => navigation.navigate('DiaryDetail', { diary: item })}>
                            <BookCover source={{ uri: item.imageUrl || 'https://via.placeholder.com/50x75' }} />
                            <DiaryInfo>
                                <DiaryDate>{formatDate(item.createdAt)}</DiaryDate>
                                <DiaryTitle>{item.chatRoom?.seed?.bookTitle || '읽은 책'}</DiaryTitle>
                                <DiaryPreview numberOfLines={1}>{item.content}</DiaryPreview>
                            </DiaryInfo>
                        </DiaryCard>
                    )}
                    contentContainerStyle={{ paddingVertical: 20 }}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', marginTop: 100 }}>
                            <Text style={{ fontSize: 60 }}>🌱</Text>
                            <Text style={{ marginTop: 20, color: theme.colors.text.disabled }}>아직 맺은 열매가 없어요.</Text>
                        </View>
                    }
                />
            )}
        </Container>
    );
};

export default ArchiveScreen;
