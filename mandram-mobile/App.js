import 'react-native-gesture-handler';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppProvider, useApp } from './src/context/AppContext';
import { colors, spacing } from './src/theme';

import ServerScreen from './src/screens/ServerScreen';
import LoginScreen from './src/screens/LoginScreen';
import MeetingsScreen from './src/screens/MeetingsScreen';
import MembersScreen from './src/screens/MembersScreen';
import LedgerScreen from './src/screens/LedgerScreen';
import LoansScreen from './src/screens/LoansScreen';
import PersonalLoansScreen from './src/screens/PersonalLoansScreen';
import ExpendituresScreen from './src/screens/ExpendituresScreen';
import InvestmentsScreen from './src/screens/InvestmentsScreen';
import ChitsScreen from './src/screens/ChitsScreen';
import SummaryScreen from './src/screens/SummaryScreen';
import JoiningScreen from './src/screens/JoiningScreen';
import UsersScreen from './src/screens/UsersScreen';

const Drawer = createDrawerNavigator();

/**
 * A drawer rather than bottom tabs: there are eleven sections, which is far more
 * than a tab bar can carry legibly on a phone.
 */
function MainDrawer() {
  const { isAdmin, signOut } = useApp();

  return (
    <Drawer.Navigator
      initialRouteName="Member Ledger"
      screenOptions={{
        headerStyle: { backgroundColor: colors.headerBg },
        headerTintColor: '#fff',
        headerTitleStyle: { fontSize: 17 },
        drawerActiveTintColor: colors.primary,
        drawerLabelStyle: { fontSize: 14 },
        headerRight: () => (
          <Pressable onPress={signOut} style={{ paddingHorizontal: spacing.lg }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Logout</Text>
          </Pressable>
        ),
      }}
    >
      <Drawer.Screen name="Meetings" component={MeetingsScreen} />
      <Drawer.Screen name="Members" component={MembersScreen} />
      <Drawer.Screen name="Member Ledger" component={LedgerScreen} />
      <Drawer.Screen name="EMI Loans" component={LoansScreen} />
      <Drawer.Screen name="Personal Loans" component={PersonalLoansScreen} />
      <Drawer.Screen name="Expenditures" component={ExpendituresScreen} />
      <Drawer.Screen name="Chit & Savings" component={InvestmentsScreen} />
      <Drawer.Screen name="Chit Management" component={ChitsScreen} />
      <Drawer.Screen name="Monthly Summary" component={SummaryScreen} />
      {isAdmin ? <Drawer.Screen name="Joining Contributions" component={JoiningScreen} /> : null}
      {isAdmin ? <Drawer.Screen name="Users" component={UsersScreen} /> : null}
      <Drawer.Screen name="Server Settings">
        {() => <ServerScreen embedded />}
      </Drawer.Screen>
    </Drawer.Navigator>
  );
}

/**
 * Three states, in order: no server address yet, not signed in, signed in.
 * The server gate comes first because nothing else can work without it.
 */
function Root() {
  const { ready, serverUrl, user } = useApp();
  const [forceServer, setForceServer] = useState(false);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!serverUrl || forceServer) {
    return <ServerScreen onDone={() => setForceServer(false)} />;
  }

  if (!user) {
    return <LoginScreen onNeedServer={() => setForceServer(true)} />;
  }

  return (
    <NavigationContainer>
      <MainDrawer />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <StatusBar style="light" />
          <Root />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
