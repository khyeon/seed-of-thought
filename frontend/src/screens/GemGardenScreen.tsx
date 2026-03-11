import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Dimensions } from 'react-native';
import styled from 'styled-components/native';
import { theme } from '../styles/theme';
import { ChevronLeft, Info, Trophy } from 'lucide-react-native';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';
import axios from 'axios';
import { API_URL } from '../config/apiConfig';
import { useUserStore } from '../store/userStore';

const { width } = Dimensions.get('window');

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
  color: ${theme.colors.primary};
`;

const GardenContainer = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
`;

const StatsGrid = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  padding: ${theme.spacing.lg}px;
  justify-content: space-between;
  background-color: ${theme.colors.white};
  border-top-left-radius: ${theme.borderRadius.lg}px;
  border-top-right-radius: ${theme.borderRadius.lg}px;
  ${theme.shadows.soft};
`;

const StatItem = styled.View`
  width: 30%;
  align-items: center;
  margin-bottom: ${theme.spacing.md}px;
`;

const StatValue = styled.Text`
  font-size: 16px;
  font-weight: bold;
  color: ${theme.colors.primary};
`;

const StatLabel = styled.Text`
  font-size: 12px;
  color: ${theme.colors.text.secondary};
`;

const GemGardenScreen = ({ navigation }: any) => {
    const { userId, userName } = useUserStore();
    const [treeState, setTreeState] = useState<any>(null);
    const [userStat, setUserStat] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [treeRes, statRes] = await Promise.all([
                axios.get(`${API_URL}/chat/tree/${userId}`),
                axios.get(`${API_URL}/chat/stats/${userId}`)
            ]);
            setTreeState(treeRes.data);
            setUserStat(statRes.data);
        } catch (error) {
            console.error('Error fetching garden data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Container style={{ justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </Container>
        );
    }

    // 점수 차트 대신, 아이를 응원하는 감성적 요소 렌더링
    const renderGemVisual = () => {
        return (
            <View style={{ alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                {/* 반짝이는 보석 일러스트 (SVG) */}
                <Svg height="200" width="200" viewBox="0 0 100 100">
                    <Path
                        d="M50 5 L90 35 L75 90 L25 90 L10 35 Z"
                        fill={theme.colors.secondary}
                        opacity={0.3}
                    />
                    <Circle cx="50" cy="50" r="30" fill={theme.colors.primary} opacity={0.6} />
                    <Path
                        d="M50 20 L60 40 L85 45 L65 60 L70 85 L50 70 L30 85 L35 60 L15 45 L40 40 Z"
                        fill={theme.colors.accent}
                    />
                </Svg>

                <View style={{ marginTop: 30, alignItems: 'center' }}>
                    <Text style={{
                        fontSize: 22,
                        fontWeight: 'bold',
                        color: theme.colors.text.primary,
                        textAlign: 'center',
                        lineHeight: 32
                    }}>
                        반짝반짝! ✨{"\n"}
                        {userName || '어린이'}의 생각 보석이{"\n"}
                        정말 예쁘게 빛나고 있어!
                    </Text>

                    <Text style={{
                        fontSize: 16,
                        color: theme.colors.text.secondary,
                        marginTop: 15,
                        textAlign: 'center'
                    }}>
                        책을 읽고 대화를 담을 때마다{"\n"}
                        너만의 보석은 더 단단해질 거야.
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <Container>
            <Header>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ChevronLeft size={28} color={theme.colors.text.primary} />
                </TouchableOpacity>
                <Title>나의 성장 보석</Title>
                <TouchableOpacity onPress={() => fetchData()}>
                    <Trophy size={24} color={theme.colors.accent} />
                </TouchableOpacity>
            </Header>

            <GardenContainer>
                <View style={{ alignItems: 'center', marginBottom: 20 }}>
                    <Text style={{ fontSize: 16, color: theme.colors.text.secondary }}>나의 생각 역량이 보석처럼 빛나고 있어요!</Text>
                </View>
                {renderGemVisual()}
                <View style={{ position: 'absolute', bottom: 40, alignItems: 'center' }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.colors.primary }}>
                        Lv.{userStat?.totalLevel || 1} 반짝이는 원석
                    </Text>
                    <Text style={{ color: theme.colors.text.disabled, marginTop: 5 }}>보석 대화를 통해 더 단단한 보석을 만들어봐요!</Text>
                </View>
            </GardenContainer>

            <StatsGrid>
                <StatItem>
                    <StatValue>{userStat?.selfEfficacyXP || 0}</StatValue>
                    <StatLabel>자아</StatLabel>
                </StatItem>
                <StatItem>
                    <StatValue>{userStat?.emotionalIQXP || 0}</StatValue>
                    <StatLabel>감정</StatLabel>
                </StatItem>
                <StatItem>
                    <StatValue>{userStat?.logicalFrameXP || 0}</StatValue>
                    <StatLabel>논리</StatLabel>
                </StatItem>
                <StatItem>
                    <StatValue>{userStat?.socialValueXP || 0}</StatValue>
                    <StatLabel>사회</StatLabel>
                </StatItem>
                <StatItem>
                    <StatValue>{userStat?.creativeInsightXP || 0}</StatValue>
                    <StatLabel>창의</StatLabel>
                </StatItem>
                <StatItem>
                    <StatValue>Lv.{userStat?.totalLevel || 1}</StatValue>
                    <StatLabel>나의 레벨</StatLabel>
                </StatItem>
            </StatsGrid>
        </Container>
    );
};

export default GemGardenScreen;
