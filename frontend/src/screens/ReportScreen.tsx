import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import styled from 'styled-components/native';
import { theme } from '../styles/theme';
import { ChevronLeft, Share2, Download } from 'lucide-react-native';
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

const Content = styled.ScrollView`
  flex: 1;
  padding: ${theme.spacing.lg}px;
`;

const Section = styled.View`
  background-color: ${theme.colors.white};
  border-radius: ${theme.borderRadius.lg}px;
  padding: ${theme.spacing.lg}px;
  margin-bottom: ${theme.spacing.lg}px;
  ${theme.shadows.soft};
`;

const SectionTitle = styled.Text`
  font-size: 18px;
  font-weight: bold;
  color: ${theme.colors.text.primary};
  margin-bottom: ${theme.spacing.md}px;
`;

const KeywordContainer = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
`;

const KeywordTag = styled.View<{ size: number }>`
  background-color: ${theme.colors.secondary};
  padding: ${theme.spacing.sm}px ${theme.spacing.md}px;
  border-radius: ${theme.borderRadius.full}px;
  margin-right: ${theme.spacing.sm}px;
  margin-bottom: ${theme.spacing.sm}px;
`;

const KeywordText = styled.Text<{ size: number }>`
  color: ${theme.colors.primary};
  font-size: ${props => props.size}px;
  font-weight: bold;
`;

const EmotionItem = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: ${theme.spacing.sm}px;
`;

const EmotionLabel = styled.Text`
  width: 60px;
  font-size: 14px;
  color: ${theme.colors.text.primary};
`;

const ProgressBar = styled.View`
  flex: 1;
  height: 8px;
  background-color: ${theme.colors.background};
  border-radius: 4px;
  overflow: hidden;
`;

const ProgressFill = styled.View<{ width: string }>`
  width: ${props => props.width};
  height: 100%;
  background-color: ${theme.colors.primary};
`;

const EmotionCount = styled.Text`
  width: 30px;
  text-align: right;
  font-size: 12px;
  color: ${theme.colors.text.disabled};
`;

const InsightBox = styled.View`
  background-color: ${theme.colors.accent};
  padding: ${theme.spacing.md}px;
  border-radius: ${theme.borderRadius.md}px;
  opacity: 0.9;
`;

const InsightText = styled.Text`
  font-size: 14px;
  color: ${theme.colors.text.primary};
  line-height: 22px;
`;

const MonthSelector = styled.ScrollView`
  margin-bottom: ${theme.spacing.lg}px;
`;

const MonthChip = styled.TouchableOpacity<{ active: boolean }>`
  background-color: ${props => props.active ? theme.colors.primary : theme.colors.white};
  padding: ${theme.spacing.sm}px ${theme.spacing.md}px;
  border-radius: ${theme.borderRadius.full}px;
  margin-right: ${theme.spacing.sm}px;
  border-width: 1px;
  border-color: ${props => props.active ? theme.colors.primary : theme.colors.secondary};
`;

const MonthText = styled.Text<{ active: boolean }>`
  color: ${props => props.active ? theme.colors.white : theme.colors.text.secondary};
  font-weight: bold;
`;

const ReportScreen = ({ navigation, route }: any) => {
  const { userId, userName: currentUserName } = useUserStore();
  const targetUserId = route.params?.targetUserId || userId;
  const targetUserName = route.params?.targetUserName || currentUserName;

  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(2);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  useEffect(() => {
    fetchReport();
  }, [targetUserId, selectedYear, selectedMonth]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/diaries/report?userId=${targetUserId}&requesterId=${userId}&year=${selectedYear}&month=${selectedMonth}`);
      setReport(response.data);
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !report) {
    return (
      <Container style={{ justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Title>{targetUserName}의 {selectedMonth}월 성장 리포트</Title>
        <TouchableOpacity>
          <Share2 size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
      </Header>

      <Content showsVerticalScrollIndicator={false}>
        <MonthSelector horizontal showsHorizontalScrollIndicator={false}>
          {months.map(m => (
            <MonthChip
              key={m}
              active={selectedMonth === m}
              onPress={() => setSelectedMonth(m)}
            >
              <MonthText active={selectedMonth === m}>{m}월</MonthText>
            </MonthChip>
          ))}
        </MonthSelector>

        {report && report.totalDiaries > 0 ? (
          <>
            <Section>
              <SectionTitle>주요 관심 키워드</SectionTitle>
              <KeywordContainer>
                {report.topKeywords.map((kw: any, index: number) => (
                  <KeywordTag key={index} size={14 + kw.value * 2}>
                    <KeywordText size={14 + kw.value * 2}>#{kw.text}</KeywordText>
                  </KeywordTag>
                ))}
              </KeywordContainer>
            </Section>

            <Section>
              <SectionTitle>마음 온도 (감정 기록)</SectionTitle>
              {report.emotionStats.map((stat: any, index: number) => {
                const percentage = report.totalDiaries > 0 ? (stat.count / report.totalDiaries) * 100 : 0;
                return (
                  <EmotionItem key={index}>
                    <EmotionLabel>{stat.name}</EmotionLabel>
                    <ProgressBar>
                      <ProgressFill width={`${percentage}%`} />
                    </ProgressBar>
                    <EmotionCount>{stat.count}</EmotionCount>
                  </EmotionItem>
                );
              })}
            </Section>

            <Section>
              <SectionTitle>부모님을 위한 가이드</SectionTitle>
              <InsightBox>
                <InsightText>
                  "{targetUserName}는 최근 '{report.topKeywords[0]?.text || '다양한'}' 주제에 대해 많은 생각을 나누었네요.
                  아이가 대화 중에 언급한 '{report.recentSummary}' 같은 생각들을 따뜻하게 격려해 주세요!"
                </InsightText>
              </InsightBox>
            </Section>
          </>
        ) : (
          <View style={{ alignItems: 'center', padding: 40, backgroundColor: 'white', borderRadius: 20 }}>
            <Text style={{ fontSize: 50 }}>🍂</Text>
            <Text style={{ marginTop: 20, color: theme.colors.text.secondary, fontWeight: 'bold' }}>
              {selectedMonth}월에는 아직 기록이 없어요.
            </Text>
            <Text style={{ marginTop: 8, color: theme.colors.text.disabled }}>
              아이와 함께 책을 읽고 씨앗을 심어보세요!
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={{
            backgroundColor: theme.colors.primary,
            padding: 15,
            borderRadius: 30,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 20,
            marginBottom: 40,
            ...theme.shadows.soft
          }}
          onPress={() => Alert.alert('안내', 'PDF 저장 기능은 준비 중입니다! 예쁜 카드 뉴스로 만들어 드릴게요.')}
        >
          <Download size={20} color={theme.colors.white} />
          <Text style={{ color: theme.colors.white, fontWeight: 'bold', marginLeft: 10 }}>리포트 PDF로 저장하기</Text>
        </TouchableOpacity>
      </Content>
    </Container>
  );
};

export default ReportScreen;
