import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';
import BookSearchScreen from './src/screens/BookSearchScreen';
import SentenceInputScreen from './src/screens/SentenceInputScreen';
import AIChatScreen from './src/screens/AIChatScreen';
import EditDiaryScreen from './src/screens/EditDiaryScreen';
import ArchiveScreen from './src/screens/ArchiveScreen';
import ReportScreen from './src/screens/ReportScreen';
import LoginScreen from './src/screens/LoginScreen';
import DiaryDetailScreen from './src/screens/DiaryDetailScreen';
import BookAddedSuccessScreen from './src/screens/BookAddedSuccessScreen';
import BookSelectionScreen from './src/screens/BookSelectionScreen';
import ReadingListScreen from './src/screens/ReadingListScreen';
import CompletedListScreen from './src/screens/CompletedListScreen';
import GemGardenScreen from './src/screens/GemGardenScreen';
import { useUserStore } from './src/store/userStore';

const Stack = createNativeStackNavigator();

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!isLoggedIn ? (
            <Stack.Screen name="Login" component={LoginScreen} />
          ) : (
            <>
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="BookSearch" component={BookSearchScreen} />
              <Stack.Screen name="SentenceInput" component={SentenceInputScreen} />
              <Stack.Screen name="AIChat" component={AIChatScreen} />
              <Stack.Screen name="EditDiary" component={EditDiaryScreen} />
              <Stack.Screen name="Archive" component={ArchiveScreen} />
              <Stack.Screen name="Report" component={ReportScreen} />
              <Stack.Screen name="DiaryDetail" component={DiaryDetailScreen} />
              <Stack.Screen name="BookAddedSuccess" component={BookAddedSuccessScreen} />
              <Stack.Screen name="BookSelection" component={BookSelectionScreen} />
              <Stack.Screen name="ReadingList" component={ReadingListScreen} />
              <Stack.Screen name="CompletedList" component={CompletedListScreen} />
              <Stack.Screen name="GemGarden" component={GemGardenScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
