import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import styled from 'styled-components/native';
import { theme } from '../styles/theme';
import { CheckCircle, BookOpen, Home } from 'lucide-react-native';

const Container = styled.SafeAreaView`
  flex: 1;
  background-color: ${theme.colors.background};
`;

const Content = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: ${theme.spacing.xl}px;
`;

const SuccessIcon = styled.View`
  width: 100px;
  height: 100px;
  background-color: ${theme.colors.secondary};
  border-radius: 50px;
  justify-content: center;
  align-items: center;
  margin-bottom: ${theme.spacing.xl}px;
`;

const Title = styled.Text`
  font-size: 24px;
  font-weight: bold;
  color: ${theme.colors.text.primary};
  text-align: center;
`;

const Subtitle = styled.Text`
  font-size: 16px;
  color: ${theme.colors.text.secondary};
  text-align: center;
  margin-top: ${theme.spacing.md}px;
  margin-bottom: ${theme.spacing.xxl}px;
`;

const Button = styled.TouchableOpacity<{ primary?: boolean }>`
  background-color: ${props => props.primary ? theme.colors.primary : theme.colors.white};
  width: 100%;
  padding: ${theme.spacing.md}px;
  border-radius: ${theme.borderRadius.full}px;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  margin-bottom: ${theme.spacing.md}px;
  ${theme.shadows.soft};
  border-width: ${props => props.primary ? 0 : 1}px;
  border-color: ${theme.colors.primary};
`;

const ButtonText = styled.Text<{ primary?: boolean }>`
  color: ${props => props.primary ? theme.colors.white : theme.colors.primary};
  font-size: 18px;
  font-weight: bold;
  margin-left: ${theme.spacing.sm}px;
`;

const BookAddedSuccessScreen = ({ navigation, route }: any) => {
    const { book } = route.params;

    return (
        <Container>
            <Content>
                <SuccessIcon>
                    <CheckCircle size={60} color={theme.colors.primary} />
                </SuccessIcon>
                <Title>책 추가 완료!</Title>
                <Subtitle>
                    "{book.title}" 도서를 내 서재에 담았어요.{"\n"}지금 바로 이야기를 나눠볼까요?
                </Subtitle>

                <Button primary onPress={() => navigation.navigate('SentenceInput', { book })}>
                    <BookOpen size={20} color={theme.colors.white} />
                    <ButtonText primary>오늘 최고의 문장 심기</ButtonText>
                </Button>

                <Button onPress={() => navigation.navigate('Home')}>
                    <Home size={20} color={theme.colors.primary} />
                    <ButtonText>홈으로 가기</ButtonText>
                </Button>
            </Content>
        </Container>
    );
};

export default BookAddedSuccessScreen;
