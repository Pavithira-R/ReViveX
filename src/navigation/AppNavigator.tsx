import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BrowseItemsScreen from '../screens/BrowseItemsScreen';
import ItemDetailsScreen from '../screens/ItemDetailsScreen';
import MyItemsScreen from '../screens/MyItemsScreen';
import PostItemScreen from '../screens/PostItemScreen';

export type RootStackParamList = {
  Main: undefined;
  PostItem: undefined;
  ItemDetails: { itemId: string };
};

export type MainTabParamList = {
  MyItems: undefined;
  Browse: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#2E7D32' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '700' },
        tabBarActiveTintColor: '#2E7D32',
        tabBarInactiveTintColor: '#757575',
      }}
    >
      <Tabs.Screen
        name="MyItems"
        component={MyItemsScreen}
        options={{ title: 'My Items', tabBarLabel: 'My Items' }}
      />
      <Tabs.Screen
        name="Browse"
        component={BrowseItemsScreen}
        options={{ title: 'Browse' }}
      />
    </Tabs.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#2E7D32' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: '#F7F9F7' },
      }}
    >
      <Stack.Screen
        name="Main"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PostItem"
        component={PostItemScreen}
        options={{ title: 'Post Item' }}
      />
      <Stack.Screen
        name="ItemDetails"
        component={ItemDetailsScreen}
        options={{ title: 'Item Details' }}
      />
    </Stack.Navigator>
  );
}
