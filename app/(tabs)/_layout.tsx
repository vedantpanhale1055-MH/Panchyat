import { Tabs } from 'expo-router';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import { Text } from 'react-native';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>;
}

export default function TabLayout() {
  const { user } = useUser();
  const { colors } = useTheme();
  const isAdmin = user?.role === 'admin';

  const screenOptions = {
    headerShown: false,
    tabBarStyle: {
      backgroundColor: colors.tabBar,
      borderTopColor: colors.border,
      borderTopWidth: 1,
      height: 60,
      paddingBottom: 8,
    },
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.muted,
    tabBarLabelStyle: { fontSize: 11, fontWeight: '600' as const },
  };

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarIcon: ({ focused }) => <TabIcon emoji="💬" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="complaints"
        options={{
          title: 'Complaints',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🔧" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="gate"
        options={{
          title: 'Gate',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🚪" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🛡" focused={focused} />,
          href: isAdmin ? undefined : null, // hidden for residents
        }}
      />
    </Tabs>
  );
}