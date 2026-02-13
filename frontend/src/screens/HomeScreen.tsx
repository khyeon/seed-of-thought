import React from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import styled from 'styled-components/native';
import { theme } from '../styles/theme';
import { Plus, Settings } from 'lucide-react-native';
import { API_URL } from '../config/apiConfig';

const Container = styled.SafeAreaView`
  flex: 1;
  background-color: ${theme.colors.background};
`;

const Header = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: ${theme.spacing.lg}px ${theme.spacing.lg}px;
`;

const Greeting = styled.Text`
  font-size: 24px;
  font-weight: bold;
  color: ${theme.colors.text.primary};
`;

const SubGreeting = styled.Text`
  font-size: 16px;
  color: ${theme.colors.text.secondary};
  margin-top: ${theme.spacing.xs}px;
`;

const CharacterContainer = styled.View`
  align-items: center;
  margin-vertical: ${theme.spacing.xxl}px;
`;

const SeedlingPlaceholder = styled.View`
  width: 150px;
  height: 150px;
  background-color: ${theme.colors.secondary};
  border-radius: 75px;
  justify-content: center;
  align-items: center;
`;

const PlantButton = styled.TouchableOpacity`
  background-color: ${theme.colors.primary};
  margin-horizontal: ${theme.spacing.lg}px;
  padding: ${theme.spacing.md}px;
  border-radius: ${theme.borderRadius.full}px;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  ${theme.shadows.soft};
`;

const ButtonText = styled.Text`
  color: ${theme.colors.white};
  font-size: 18px;
  font-weight: bold;
  margin-left: ${theme.spacing.sm}px;
`;

const RecentTitle = styled.Text`
  font-size: 20px;
  font-weight: bold;
  color: ${theme.colors.text.primary};
  margin: ${theme.spacing.lg}px;
`;

const DiaryCard = styled.View`
  background-color: ${theme.colors.white};
  margin-horizontal: ${theme.spacing.lg}px;
  margin-bottom: ${theme.spacing.md}px;
  padding: ${theme.spacing.md}px;
  border-radius: ${theme.borderRadius.md}px;
  flex-direction: row;
  align-items: center;
  ${theme.shadows.soft};
`;

const DiaryIcon = styled.View`
  width: 50px;
  height: 50px;
  background-color: ${theme.colors.background};
  border-radius: ${theme.borderRadius.sm}px;
  justify-content: center;
  align-items: center;
`;

const DiaryInfo = styled.View`
  margin-left: ${theme.spacing.md}px;
  flex: 1;
`;

const DiaryTitle = styled.Text`
  font-size: 16px;
  font-weight: bold;
  color: ${theme.colors.text.primary};
`;

const DiaryDate = styled.Text`
  font-size: 12px;
  color: ${theme.colors.text.disabled};
  margin-top: 2px;
`;

import { useUserStore } from '../store/userStore';
import axios from 'axios';

const HomeScreen = ({ navigation }: any) => {
  const { userName, role, userId, clearUser } = useUserStore();
  const [children, setChildren] = React.useState<any[]>([]);

  // Function to refine name by removing surname
  const refineName = (name: string | null) => {
    if (!name) return '';
    // If name is 3+ chars (like '김승찬'), assume first char is surname
    if (name.length >= 3) {
      return name.slice(1);
    }
    return name;
  };

  const displayName = React.useMemo(() => refineName(userName), [userName]);

  React.useEffect(() => {
    if (role === 'PARENT') {
      fetchFamily();
    }
  }, [role]);

  const fetchFamily = async () => {
    try {
      const response = await axios.get(`${API_URL}/diaries/family/members?userId=${userId}`);
      setChildren(response.data.filter((m: any) => m.role === 'CHILD'));
    } catch (e) {
      console.error('Failed to fetch family', e);
    }
  };

  const handleLogout = () => {
    clearUser();
  };

  return (
    <Container>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Header>
          <View>
            <Greeting>안녕, {displayName}{role === 'PARENT' ? '님' : '아'}!</Greeting>
            <SubGreeting>
              {role === 'CHILD' ? '오늘은 어떤 씨앗을 심어볼까? 🌱' : '아이들의 생각 정원을 둘러보세요. 🍎'}
            </SubGreeting>
          </View>
          <TouchableOpacity onPress={handleLogout}>
            <View style={{ backgroundColor: '#F3F4F6', padding: 8, borderRadius: 20 }}>
              <Text style={{ fontSize: 12, color: theme.colors.text.secondary }}>로그아웃</Text>
            </View>
          </TouchableOpacity>
        </Header>

        {role === 'CHILD' ? (
          <>
            <CharacterContainer>
              <SeedlingPlaceholder>
                <Text style={{ fontSize: 60 }}>🌱</Text>
              </SeedlingPlaceholder>
            </CharacterContainer>

            <PlantButton activeOpacity={0.8} onPress={() => navigation.navigate('BookSearch')}>
              <Plus size={24} color={theme.colors.white} />
              <ButtonText>오늘 최고의 문장 심기</ButtonText>
            </PlantButton>

            <RecentHeader>
              <RecentTitle>나의 일기장</RecentTitle>
              <TouchableOpacity onPress={() => navigation.navigate('Archive')}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>전체보기</Text>
                </View>
              </TouchableOpacity>
            </RecentHeader>

            <DiaryCard as={TouchableOpacity} activeOpacity={0.7} onPress={() => navigation.navigate('Archive')}>
              <DiaryIcon><Text style={{ fontSize: 24 }}>🍏</Text></DiaryIcon>
              <DiaryInfo>
                <DiaryTitle>내 생각들이 열매를 맺고 있어요</DiaryTitle>
                <DiaryDate>아래 '전체보기'에서 확인해봐요!</DiaryDate>
              </DiaryInfo>
            </DiaryCard>
          </>
        ) : (
          <View style={{ marginTop: 20 }}>
            <RecentTitle>자녀 리포트 확인</RecentTitle>
            {children.length > 0 ? (
              children.map(child => (
                <DiaryCard key={child.id} as={TouchableOpacity} activeOpacity={0.7} onPress={() => navigation.navigate('Report', { targetUserId: child.id, targetUserName: refineName(child.name) })}>
                  <DiaryIcon><Text style={{ fontSize: 24 }}>🧒</Text></DiaryIcon>
                  <DiaryInfo>
                    <DiaryTitle>{refineName(child.name)}의 정원</DiaryTitle>
                    <DiaryDate>최근 활동을 확인해보세요</DiaryDate>
                  </DiaryInfo>
                </DiaryCard>
              ))
            ) : (
              <Text style={{ marginHorizontal: 20, color: theme.colors.text.disabled }}>등록된 자녀가 없습니다.</Text>
            )}
          </View>
        )}
      </ScrollView>
    </Container>
  );
};

const RecentHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding-right: ${theme.spacing.lg}px;
`;

const ReportCard = styled.TouchableOpacity`
  background-color: ${theme.colors.secondary};
  margin: ${theme.spacing.lg}px;
  padding: ${theme.spacing.lg}px;
  border-radius: ${theme.borderRadius.lg}px;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  border-left-width: 5px;
  border-left-color: ${theme.colors.primary};
`;

const ReportTitle = styled.Text`
  font-size: 16px;
  font-weight: bold;
  color: ${theme.colors.text.primary};
`;

const ReportDesc = styled.Text`
  font-size: 12px;
  color: ${theme.colors.text.secondary};
  margin-top: 4px;
`;

export default HomeScreen;
