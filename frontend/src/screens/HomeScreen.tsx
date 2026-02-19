import React from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import styled from 'styled-components/native';
import { theme } from '../styles/theme';
import { Plus, Settings, BookOpen, CheckCircle, List } from 'lucide-react-native';
import { useUserStore } from '../store/userStore';
import axios from 'axios';
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

const DashboardContainer = styled.View`
  padding: ${theme.spacing.lg}px;
`;

const StatRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: ${theme.spacing.lg}px;
`;

const StatCard = styled.TouchableOpacity`
  background-color: ${theme.colors.white};
  width: 48%;
  padding: ${theme.spacing.lg}px;
  border-radius: ${theme.borderRadius.lg}px;
  align-items: center;
  ${theme.shadows.soft};
`;

const StatCount = styled.Text`
  font-size: 32px;
  font-weight: bold;
  color: ${theme.colors.primary};
`;

const StatLabel = styled.Text`
  font-size: 14px;
  color: ${theme.colors.text.secondary};
  margin-top: 4px;
`;

const MainActionCard = styled.TouchableOpacity<{ primary?: boolean }>`
  background-color: ${props => props.primary ? theme.colors.primary : theme.colors.white};
  padding: ${theme.spacing.lg}px;
  border-radius: ${theme.borderRadius.lg}px;
  flex-direction: row;
  align-items: center;
  margin-bottom: ${theme.spacing.md}px;
  border-width: ${props => props.primary ? 0 : 1}px;
  border-color: ${theme.colors.primary};
  ${theme.shadows.soft};
`;

const ActionIconContainer = styled.View<{ primary?: boolean }>`
  width: 50px;
  height: 50px;
  background-color: ${props => props.primary ? 'rgba(255,255,255,0.2)' : theme.colors.secondary};
  border-radius: 25px;
  justify-content: center;
  align-items: center;
`;

const ActionTextContainer = styled.View`
  margin-left: ${theme.spacing.md}px;
  flex: 1;
`;

const ActionTitle = styled.Text<{ primary?: boolean }>`
  font-size: 18px;
  font-weight: bold;
  color: ${props => props.primary ? theme.colors.white : theme.colors.text.primary};
`;

const ActionDesc = styled.Text<{ primary?: boolean }>`
  font-size: 13px;
  color: ${props => props.primary ? 'rgba(255,255,255,0.8)' : theme.colors.text.secondary};
  margin-top: 2px;
`;

const RecentHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.md}px;
`;

const RecentTitle = styled.Text`
  font-size: 20px;
  font-weight: bold;
  color: ${theme.colors.text.primary};
`;

const DiaryCard = styled.View`
  background-color: ${theme.colors.white};
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

const HomeScreen = ({ navigation }: any) => {
  const { userName, role, userId, clearUser } = useUserStore();
  const [children, setChildren] = React.useState<any[]>([]);
  const [counts, setCounts] = React.useState({ READING: 0, COMPLETED: 0 });

  const refineName = (name: string | null) => {
    if (!name) return '';
    if (name.length >= 3) return name.slice(1);
    return name;
  };

  const displayName = React.useMemo(() => refineName(userName), [userName]);

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (role === 'PARENT') {
        fetchFamily();
      } else {
        fetchCounts();
      }
    });
    return unsubscribe;
  }, [navigation, role]);

  const fetchCounts = async () => {
    try {
      const response = await axios.get(`${API_URL}/user-books/counts?userId=${userId}`);
      setCounts(response.data);
    } catch (e) {
      console.error('Failed to fetch counts', e);
    }
  };

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
          <DashboardContainer>
            <StatRow>
              <StatCard onPress={() => navigation.navigate('ReadingList')}>
                <StatCount>{counts.READING}</StatCount>
                <StatLabel>읽고 있는 책</StatLabel>
              </StatCard>
              <StatCard onPress={() => navigation.navigate('CompletedList')}>
                <StatCount>{counts.COMPLETED}</StatCount>
                <StatLabel>다 읽은 책</StatLabel>
              </StatCard>
            </StatRow>

            <MainActionCard primary onPress={() => navigation.navigate('BookSelection')}>
              <ActionIconContainer primary>
                <BookOpen size={24} color={theme.colors.white} />
              </ActionIconContainer>
              <ActionTextContainer>
                <ActionTitle primary>오늘 최고의 문장 심기</ActionTitle>
                <ActionDesc primary>함께 읽은 책에서 보석 같은 문장을 찾아봐요</ActionDesc>
              </ActionTextContainer>
            </MainActionCard>

            <MainActionCard onPress={() => navigation.navigate('BookSearch')}>
              <ActionIconContainer>
                <Plus size={24} color={theme.colors.primary} />
              </ActionIconContainer>
              <ActionTextContainer>
                <ActionTitle>읽을 책 담기</ActionTitle>
                <ActionDesc>새로운 책을 내 서재에 추가해 보세요</ActionDesc>
              </ActionTextContainer>
            </MainActionCard>

            <View style={{ marginTop: 20 }}>
              <RecentHeader>
                <RecentTitle>최근 나의 생각</RecentTitle>
                <TouchableOpacity onPress={() => navigation.navigate('Archive')}>
                  <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>전체보기</Text>
                </TouchableOpacity>
              </RecentHeader>
              <DiaryCard as={TouchableOpacity} activeOpacity={0.7} onPress={() => navigation.navigate('Archive')}>
                <DiaryIcon><Text style={{ fontSize: 24 }}>🍏</Text></DiaryIcon>
                <DiaryInfo>
                  <DiaryTitle>내 생각들이 열매를 맺고 있어요</DiaryTitle>
                  <DiaryDate>보관소에서 확인해봐요!</DiaryDate>
                </DiaryInfo>
              </DiaryCard>
            </View>
          </DashboardContainer>
        ) : (
          <View style={{ marginTop: 20, paddingHorizontal: 20 }}>
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
              <Text style={{ marginTop: 10, color: theme.colors.text.disabled }}>등록된 자녀가 없습니다.</Text>
            )}
          </View>
        )}
      </ScrollView>
    </Container>
  );
};

export default HomeScreen;
