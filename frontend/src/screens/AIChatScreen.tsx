import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    FlatList,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
} from 'react-native';
import styled from 'styled-components/native';
import { theme } from '../styles/theme';
import { ChevronLeft, Send, Mic } from 'lucide-react-native';
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
  border-bottom-width: 1px;
  border-bottom-color: ${theme.colors.secondary};
`;

const BookInfo = styled.View`
  margin-left: ${theme.spacing.md}px;
`;

const BookTitle = styled.Text`
  font-size: 16px;
  font-weight: bold;
  color: ${theme.colors.text.primary};
`;

const MessageBubble = styled.View<{ isUser: boolean }>`
  align-self: ${props => props.isUser ? 'flex-end' : 'flex-start'};
  background-color: ${props => props.isUser ? theme.colors.primary : theme.colors.white};
  padding: ${theme.spacing.md}px;
  border-radius: ${theme.borderRadius.md}px;
  margin-bottom: ${theme.spacing.md}px;
  max-width: 80%;
  ${theme.shadows.soft};
`;

const MessageText = styled.Text<{ isUser: boolean }>`
  font-size: 16px;
  color: ${props => props.isUser ? theme.colors.white : theme.colors.text.primary};
`;

const InputContainer = styled.View`
  flex-direction: row;
  align-items: center;
  padding: ${theme.spacing.md}px;
  background-color: ${theme.colors.white};
  border-top-width: 1px;
  border-top-color: ${theme.colors.secondary};
`;

const StyledInput = styled.TextInput`
  flex: 1;
  background-color: ${theme.colors.background};
  border-radius: ${theme.borderRadius.full}px;
  padding-horizontal: ${theme.spacing.md}px;
  padding-vertical: ${theme.spacing.sm}px;
  margin-horizontal: ${theme.spacing.sm}px;
  color: ${theme.colors.text.primary};
`;

const IconButton = styled.TouchableOpacity<{ $primary?: boolean }>`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  justify-content: center;
  align-items: center;
  background-color: ${props => props.$primary ? theme.colors.primary : 'transparent'};
`;

const AIChatScreen = ({ route, navigation }: any) => {
    const { seed, book } = route.params;
    const { userId } = useUserStore();
    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const [chatRoomId, setChatRoomId] = useState<string | null>(null);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        startChat();
    }, []);

    const startChat = async () => {
        console.log('AIChatScreen: startChat called', { userId, seedId: seed.id });
        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/chat/start`, {
                userId,
                seedId: seed.id,
                bookContext: book?.summary, // Pass the plot context here
            });
            console.log('AIChatScreen: chat started successfully', response.data);
            setChatRoomId(response.data.chatRoomId);
            setMessages([{
                id: response.data.message.id,
                text: response.data.message.content,
                isUser: false,
            }]);
        } catch (error: any) {
            console.error('AIChatScreen: Error starting chat:', error);
            console.error('Error detail:', error.response?.data || error.message);
            Alert.alert('오류', '대화를 시작하지 못했어요. 서버 상태를 확인해 주세요.');
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!inputText.trim() || !chatRoomId || loading) return;

        const userMsgText = inputText.trim();
        const newUserMessage = {
            id: Date.now().toString(),
            text: userMsgText,
            isUser: true,
        };

        const updatedMessages = [...messages, newUserMessage];
        setMessages(updatedMessages);
        setInputText('');
        setLoading(true);

        try {
            // Map messages to the history format for the AI (excluding the last one which is sent separately or included)
            // The backend expects history to be the PREVIOUS messages.
            const apiHistory = messages.map(msg => ({
                role: msg.isUser ? 'user' : 'assistant' as 'user' | 'assistant',
                content: msg.text
            }));

            const response = await axios.post(`${API_URL}/chat/${chatRoomId}/message`, {
                message: userMsgText,
                history: apiHistory,
                sentence: seed.sentence,
                plot: book?.summary
            });

            setMessages(prev => [...prev, {
                id: response.data.id,
                text: response.data.content,
                isUser: false,
            }]);
        } catch (error) {
            console.error('Error sending message:', error);
            Alert.alert('오류', '메시지를 보내지 못했어요.');
        } finally {
            setLoading(false);
        }
    };

    const renderDiaryButton = () => {
        if (messages.length >= 4) {
            return (
                <TouchableOpacity
                    style={{
                        backgroundColor: theme.colors.accent,
                        padding: 15,
                        borderRadius: 30,
                        margin: 20,
                        alignItems: 'center',
                        ...theme.shadows.soft
                    }}
                    onPress={() => navigation.navigate('EditDiary', { chatRoomId, book, messages })}
                >
                    <Text style={{ fontWeight: 'bold', fontSize: 18, color: theme.colors.text.primary }}>✨ 일기 만들기</Text>
                </TouchableOpacity>
            );
        }
        return null;
    };

    return (
        <Container>
            <Header>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
                <BookInfo>
                    <BookTitle>{book.title}</BookTitle>
                </BookInfo>
            </Header>

            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={item => item.id}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                renderItem={({ item }) => (
                    <MessageBubble isUser={item.isUser}>
                        <MessageText isUser={item.isUser}>{item.text}</MessageText>
                    </MessageBubble>
                )}
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
                ListFooterComponent={loading ? <ActivityIndicator color={theme.colors.primary} /> : null}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                {renderDiaryButton()}
                <InputContainer>
                    <IconButton onPress={() => Alert.alert('안내', 'STT 기능은 준비 중입니다!')}>
                        <Mic size={24} color={theme.colors.primary} />
                    </IconButton>
                    <StyledInput
                        placeholder="AI 친구에게 말해보세요"
                        value={inputText}
                        onChangeText={setInputText}
                        onSubmitEditing={handleSend}
                        autoFocus={true}
                    />
                    <IconButton $primary onPress={handleSend} disabled={loading || !inputText.trim()}>
                        <Send size={20} color={theme.colors.white} />
                    </IconButton>
                </InputContainer>
            </KeyboardAvoidingView>
        </Container>
    );
};

export default AIChatScreen;
