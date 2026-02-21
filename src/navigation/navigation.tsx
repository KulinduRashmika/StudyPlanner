import React from "react";
import { Text, StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import SplashScreen from "../screens/SplashScreen";
import HomeScreen from "../screens/HomeScreen";
import SubjectsScreen from "../screens/SubjectsScreen";
import PlanScreen from "../screens/PlanScreen";
import RescheduleScreen from "../screens/RescheduleScreen";

export type RootStackParamList = {
  Splash: undefined;
  Tabs: undefined;
  Reschedule:
    | {
        dateISO?: string;
        chunkMinutes?: number;
        onRescheduled?: () => void;
      }
    | undefined;
};

export type TabParamList = {
  Home: undefined;
  Subjects: undefined;
  Plan: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function TabsNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarActiveTintColor: "#0B0B0B",
        tabBarInactiveTintColor: "#94A3B8",
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: "HOME",
          tabBarIcon: ({ color }) => (
            <Text style={[styles.icon, { color }]}>⌂</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Subjects"
        component={SubjectsScreen}
        options={{
          tabBarLabel: "SUBJECTS",
          tabBarIcon: ({ color }) => (
            <Text style={[styles.icon, { color }]}>📘</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Plan"
        component={PlanScreen}
        options={{
          tabBarLabel: "PLAN",
          tabBarIcon: ({ color }) => (
            <Text style={[styles.icon, { color }]}>📅</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Tabs" component={TabsNavigator} />
      <Stack.Screen
        name="Reschedule"
        component={RescheduleScreen}
        options={{
          presentation: "transparentModal",
          animation: "fade",
        }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 74,
    paddingBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    backgroundColor: "white",
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  icon: {
    fontSize: 20,
    marginBottom: 2,
  },
});