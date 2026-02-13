import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import styled from 'styled-components/native';
import axios from 'axios';
import { useUserStore } from '../store/userStore';
import { theme } from '../styles/theme';
import { API_URL } from '../config/apiConfig';

const Container = styled.View`
  flex: 1;
  background-color: ${theme.colors.background};
  justify-content: center;
  align-items: center;
  padding: 40px;
`;

const LogoContainer = styled.View`
  align-items: center;
  margin-bottom: 50px;
`;

const LogoText = styled.Text`
  font-size: 32px;
  font-weight: bold;
  color: ${theme.colors.primary};
  margin-top: 10px;
`;

const InputContainer = styled.View`
  width: 100%;
  margin-bottom: 20px;
`;

const Label = styled.Text`
  font-size: 14px;
  color: ${theme.colors.text.secondary};
  margin-bottom: 8px;
`;

const StyledInput = styled.TextInput`
  background-color: ${theme.colors.white};
  padding: 15px;
  border-radius: 12px;
  font-size: 16px;
  color: ${theme.colors.text.primary};
  border: 1px solid #E5E7EB;
`;

const LoginButton = styled.TouchableOpacity`
  background-color: ${theme.colors.primary};
  width: 100%;
  padding: 18px;
  border-radius: 12px;
  align-items: center;
  margin-top: 10px;
  ${theme.shadows.soft};
`;

const ButtonText = styled.Text`
  color: #FFFFFF;
  font-size: 18px;
  font-weight: bold;
`;

const HelperText = styled.Text`
  font-size: 12px;
  color: ${theme.colors.text.disabled};
  margin-top: 20px;
  text-align: center;
`;

const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const setUser = useUserStore((state) => state.setUser);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('알림', '아이디와 패스워드를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      // Updated to use central API_URL
      const response = await axios.post(`${API_URL}/auth/login`, {
        username,
        password,
      });

      console.log('Login successful:', response.data);
      setUser(response.data.user);
    } catch (error: any) {
      console.error('Login error:', error);
      const message = error.response?.data?.message || '로그인에 실패했습니다.';
      Alert.alert('오류', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <LogoContainer>
        <LogoText>생각의 씨앗 🌱</LogoText>
        <Text style={{ color: theme.colors.text.secondary, marginTop: 5 }}>우리아이 독서 일기 친구</Text>
      </LogoContainer>

      <InputContainer>
        <Label>아이디</Label>
        <StyledInput
          placeholder="아이디를 입력하세요"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
      </InputContainer>

      <InputContainer>
        <Label>비밀번호</Label>
        <StyledInput
          placeholder="비밀번호를 입력하세요"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </InputContainer>

      <LoginButton onPress={handleLogin} disabled={loading}>
        <ButtonText>{loading ? '로그인 중...' : '로그인'}</ButtonText>
      </LoginButton>
    </Container>
  );
};

export default LoginScreen;
