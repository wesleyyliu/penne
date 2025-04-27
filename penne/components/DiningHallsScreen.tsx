import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Platform, SafeAreaView, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../screens/types';
import { supabase } from '../lib/supabase';
import CheckerboardBackground from './CheckerboardBackground';
import { RouteProp } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';

type DiningHallsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'DiningHallsScreen'
>;

type DiningHallsScreenRouteProp = RouteProp<
  RootStackParamList,
  'DiningHallsScreen'
>;

interface DiningHallRating {
  dining_hall_name: string;
  average_score: number;
  rank: number;
  letter: string;
}

// Properly type the component props
type DiningHallsScreenProps = {
  route: DiningHallsScreenRouteProp;
};

const DiningHallsScreen = ({ route }: DiningHallsScreenProps) => {
  const navigation = useNavigation<DiningHallsScreenNavigationProp>();
  const [diningHalls, setDiningHalls] = useState<DiningHallRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState({ dayName: '', monthDay: '' });
  const { session } = route.params || {};

  // Add state to track text measurements
  const [textMeasurements, setTextMeasurements] = useState<{[key: string]: {width: number, height: number}}>({});
  
  // Add state to track card heights
  const [card3Height, setCard3Height] = useState(230);

  const [fontsLoaded] = useFonts({
    'Kumbh-Sans': require('../assets/fonts/Kumbh-Sans.ttf'),
    'Kumbh-Sans-Bold': require('../assets/fonts/Kumbh-Sans-Bold.ttf'),
    'OPTICenturyNova': require('../assets/fonts/OPTICenturyNova.otf'),
  });
  
  // Function to handle text measurement
  const onTextLayout = useCallback((event: any, hallName: string) => {
    const { width, height } = event.nativeEvent.layout;
    // Cap the height to avoid infinite growth
    const cappedHeight = Math.min(height, 100);
    setTextMeasurements(prev => ({
      ...prev,
      [hallName]: { width, height: cappedHeight }
    }));
  }, []);

  // Add a function to handle card 3's height measurement
  const onCard3Layout = useCallback((event: any) => {
    const { height } = event.nativeEvent.layout;
    setCard3Height(height);
  }, []);

  // Navigation function with typed parameters
  const navigateToDetail = useCallback((hallName: string) => {
    // Find the rank of the hall in our data
    const hallData = diningHalls.find(hall => hall.dining_hall_name === hallName);
    const rank = hallData ? hallData.rank : 0;
    
    navigation.navigate('DiningHallDetail', {
      hallName,
      rank,
      session
    });
  }, [navigation, session, diningHalls]);

  // Function to get the day and date
  useEffect(() => {
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'numeric', day: 'numeric' };
    const formattedDate = date.toLocaleDateString('en-US', options).toUpperCase();
    const [dayName, monthDay] = formattedDate.split(', ');
    setCurrentDate({
      dayName,
      monthDay: monthDay.replace('/', '/')
    });
  }, []);

  // Function to determine position-based color
  const getPositionColor = (rank: number) => {
    switch (rank) {
      case 1:
        return '#f8ab7f'; // Quaker Kitchen (orange)
      case 2:
        return '#ffc4a8'; // Lauder (lighter orange/peach)
      case 3:
        return '#e1d090'; // English House (olive/green)
      case 4:
      case 5:
      case 6:
        return '#d5c2d5'; // Purple shades for others
      default:
        return '#d5c2d5';
    }
  };

  // Function to determine initial box background color
  const getInitialBoxColor = (rank: number) => {
    switch (rank) {
      case 1:
        return '#f06d20'; // White for #1
      case 2:
        return '#fe9d6d'; // White for #2
      case 3:
        return '#c8b56f'; // White for #3
      case 4:
      case 5:
      case 6:
        return '#ba9cba'; // White for others
      default:
        return '#ba9cba';
    }
  };

  // Function to determine rank number color
  const getRankNumberColor = (rank: number) => {
    switch (rank) {
      case 1:
        return '#f06d20';
      case 2:
        return '#fe9d6d';
      case 3:
        return '#c8b56f';
      case 4:
      case 5:
      case 6:
        return '#ba9cba'; 
      default:
        return '#ba9cba';
    }
  };

  // Get the initial letter for each dining hall
  const getInitial = (name: string) => {
    // Get first letter, accounting for "1920s Commons" and other edge cases
    const cleanName = name.replace(/[0-9]/g, '').trim();
    return cleanName.charAt(0).toUpperCase();
  };

  // Fetch dining hall data
  useFocusEffect(
    useCallback(() => {
      const fetchDiningHallRatings = async () => {
        try {
          setLoading(true);
          
          // Step 1: Get all dining halls from the dining_halls table first
          const { data: diningHallsData, error: diningHallsError } = await supabase
            .from('dining_halls')
            .select('name');
          
          if (diningHallsError) throw diningHallsError;
          
          if (!diningHallsData) {
            throw new Error('No dining halls found');
          }
          
          // Create initial map of all dining halls with default values
          const hallScores: Record<string, { total: number, count: number, userRated: boolean }> = {};
          
          // Initialize all dining halls with default values
          diningHallsData.forEach(hall => {
            hallScores[hall.name] = { total: 0, count: 0, userRated: false };
          });
          
          // Step 2: Check if user is logged in to get their ratings
          if (session?.user) {
            // First get user's ratings
            const { data: userRatings, error: userRatingsError } = await supabase
              .from('dining_hall_ratings')
              .select('dining_hall_name, score')
              .eq('user_id', session.user.id);
            
            if (userRatingsError) throw userRatingsError;
            
            // Apply user ratings to the map
            if (userRatings && userRatings.length > 0) {
              userRatings.forEach(rating => {
                if (!hallScores[rating.dining_hall_name]) {
                  hallScores[rating.dining_hall_name] = { total: 0, count: 0, userRated: false };
                }
                hallScores[rating.dining_hall_name].total = rating.score;
                hallScores[rating.dining_hall_name].count = 1;
                hallScores[rating.dining_hall_name].userRated = true;
              });
            }
          }
          
          // Step 3: For dining halls not rated by user, get ratings from all users
          const unratedHalls = Object.keys(hallScores).filter(
            hallName => !hallScores[hallName].userRated
          );
          
          if (unratedHalls.length > 0) {
            const { data: globalRatings, error: globalRatingsError } = await supabase
              .from('dining_hall_ratings')
              .select('dining_hall_name, score')
              .in('dining_hall_name', unratedHalls);
            
            if (globalRatingsError) throw globalRatingsError;
            
            if (globalRatings) {
              // Group and calculate average score for unrated dining halls
              globalRatings.forEach(rating => {
                if (!hallScores[rating.dining_hall_name].userRated) {
                  hallScores[rating.dining_hall_name].total += rating.score;
                  hallScores[rating.dining_hall_name].count += 1;
                }
              });
            }
          }
          
          // Calculate average and create sorted array
          const ratingsList = Object.entries(hallScores).map(([name, scores]) => ({
            dining_hall_name: name,
            average_score: scores.count > 0 ? scores.total / scores.count : 0,
            rank: 0,
            letter: getInitial(name)
          }));
          
          // Sort by average score (descending)
          ratingsList.sort((a, b) => b.average_score - a.average_score);
          
          // Assign ranks
          ratingsList.forEach((hall, index) => {
            hall.rank = index + 1;
          });
          
          setDiningHalls(ratingsList);
        } catch (err) {
          console.error('Error fetching dining hall ratings:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchDiningHallRatings();
    }, [session])
  );

  if (!fontsLoaded) {
    return <ActivityIndicator />;
  }

  return (
    <CheckerboardBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
          <View style={styles.container}>
            {/* Header with gradient background */}
            <View style={styles.headerContainer}>
              <LinearGradient
                colors={['rgba(248, 237, 228, 0.7)', 'rgba(248, 237, 228, 1.0)', '#f8ede4']}
                style={styles.headerGradient}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
              />

              {/* Logo and Date */}
              <View style={styles.headerContent}>
                <View style={styles.logoContainer}>
                  <Text style={styles.logoText}>H</Text>
                  <Image
                    source={require('../assets/tomato1.png')}
                    style={[styles.logoImage, { marginTop: -8 }]}
                  />
                  <Text style={styles.logoText}>ME</Text>
                </View>
                <View style={styles.dateContainer}>
                  <Text style={styles.dayNameText}>{currentDate.dayName}</Text>
                  <Text style={styles.monthDayText}>{currentDate.monthDay}</Text>
                </View>
              </View>
            </View>

            {/* Content Card */}
            <View style={styles.contentCard}>
              <Text style={styles.sectionTitle}>Dining Halls</Text>

              <View style={styles.diningHallsGrid}>
                {/* Top row layout: #1 and #2 stacked on left, #3 on right */}
                <View style={styles.topLayout}>
                  {/* Left column: Hall #1 and #2 stacked */}
                  <View style={styles.leftColumn}>
                    {diningHalls.length > 0 && (
                      <TouchableOpacity
                        style={[
                          styles.diningHallCard,
                          styles.hall1Card,
                          { 
                            backgroundColor: getPositionColor(1),
                            height: card3Height / 2 - 7.5, // Half of card3's height minus half the gap
                            borderBottomWidth: 4,
                            borderColor: getInitialBoxColor(1),
                          }
                        ]}
                        onPress={() => navigateToDetail(diningHalls[0].dining_hall_name)}
                      >
                        <View style={[
                          styles.hallInitial,
                          styles.hallInitial1,
                          { backgroundColor: getInitialBoxColor(1) }
                        ]}>
                          <Text style={styles.initialText}>{diningHalls[0].letter}</Text>
                        </View>
                        <View style={styles.hallInfo}>
                          <Text style={[
                            styles.rankNumber,
                            { color: getRankNumberColor(1) }
                          ]}>#1</Text>
                        </View>
                        <Text 
                          style={styles.hallName1}
                          onLayout={(e) => onTextLayout(e, diningHalls[0]?.dining_hall_name)}
                          numberOfLines={2}
                          ellipsizeMode="tail"
                        >
                          {diningHalls[0].dining_hall_name}
                        </Text>
                      </TouchableOpacity>
                    )}

                    {diningHalls.length > 1 && (
                      <TouchableOpacity
                        style={[
                          styles.diningHallCard,
                          styles.hall2Card,
                          { 
                            backgroundColor: getPositionColor(2),
                            height: card3Height / 2 - 7.5, // Half of card3's height minus half the gap
                            borderBottomWidth: 4,
                            borderColor: getInitialBoxColor(2),
                          }
                        ]}
                        onPress={() => navigateToDetail(diningHalls[1].dining_hall_name)}
                      >
                        <View style={[
                          styles.hallInitial,
                          styles.hallInitial2,
                          { backgroundColor: getInitialBoxColor(2) }
                        ]}>
                          <Text style={styles.initialText}>{diningHalls[1].letter}</Text>
                        </View>
                        <View style={styles.hallInfo}>
                          <Text style={[
                            styles.rankNumber,
                            { color: getRankNumberColor(2) }
                          ]}>#2</Text>
                        </View>
                        <Text 
                          style={styles.hallName2}
                          onLayout={(e) => onTextLayout(e, diningHalls[1]?.dining_hall_name)}
                          numberOfLines={2}
                          ellipsizeMode="tail"
                        >
                          {diningHalls[1].dining_hall_name}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Right column: Hall #3 */}
                  <View style={styles.rightColumn}>
                    {diningHalls.length > 2 && (
                      <TouchableOpacity
                        style={[
                          styles.diningHallCard,
                          styles.hall3Card,
                          { 
                            backgroundColor: getPositionColor(3),
                            borderBottomWidth: 4,
                            borderColor: getInitialBoxColor(3),
                          }
                        ]}
                        onPress={() => navigateToDetail(diningHalls[2].dining_hall_name)}
                        onLayout={onCard3Layout}
                      >
                        <View style={[
                          styles.hallInitial,
                          styles.hallInitial3,
                          { backgroundColor: getInitialBoxColor(3) }
                        ]}>
                          <Text style={styles.initialText}>{diningHalls[2].letter}</Text>
                        </View>
                        <View style={styles.hallInfo3}>
                          <Text style={[
                            styles.rankNumber,
                            { color: getRankNumberColor(3) }
                          ]}>#3</Text>
                        </View>
                        <Text 
                          style={styles.hallName3}
                          onLayout={(e) => onTextLayout(e, diningHalls[2]?.dining_hall_name)}
                          numberOfLines={3}
                          ellipsizeMode="tail"
                        >
                          {diningHalls[2].dining_hall_name}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Remaining dining halls */}
                {diningHalls.slice(3).map((hall, index) => (
                  <TouchableOpacity
                    key={hall.dining_hall_name}
                    style={[
                      styles.diningHallCard,
                      styles.fullWidthCard,
                      { 
                        backgroundColor: getPositionColor(index + 4),
                        borderBottomWidth: 4,
                        borderColor: getInitialBoxColor(index + 4),
                      }
                    ]}
                    onPress={() => navigateToDetail(hall.dining_hall_name)}
                  >
                    <View style={[
                      styles.hallInitial,
                      { backgroundColor: getInitialBoxColor(index + 4) }
                    ]}>
                      <Text style={styles.initialText}>{hall.letter}</Text>
                    </View>
                    <Text 
                      style={styles.hallName}
                      onLayout={(e) => onTextLayout(e, hall.dining_hall_name)}
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      {hall.dining_hall_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </CheckerboardBackground>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  headerContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    paddingHorizontal: 16,
    position: 'relative',
    paddingBottom: 50,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  headerTitle: {
    fontSize: 42,
    fontWeight: '500',
    letterSpacing: 2,
    color: '#787b46',
    fontFamily: 'OPTICenturyNova',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  headerContent: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginTop: 15,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 5,
  },
  logoText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#838c58',
    fontFamily: 'OPTICenturyNova',
  },
  logoImage: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  dateContainer: {
    alignItems: 'flex-end',
  },
  dayNameText: {
    fontSize: 30,
    fontWeight: '500',
    color: '#a4a985',
    textAlign: 'right',
    fontFamily: 'OPTICenturyNova',
  },
  monthDayText: {
    fontSize: 30,
    fontWeight: '500',
    color: '#c9bd8b',
    textAlign: 'right',
    fontFamily: 'OPTICenturyNova',
  },
  contentCard: {
    backgroundColor: '#fef8f0',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    flex: 1,
    padding: 20,
    paddingTop: 40,
    marginTop: -20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
    paddingBottom: 60,
  },
  sectionTitle: {
    fontSize: 17,
    color: '#958967',
    marginBottom: 20,
    fontFamily: 'Kumbh-Sans-Bold',
    marginLeft: 10,
  },
  diningHallsGrid: {
    flexDirection: 'column',
    gap: 15,
  },
  topLayout: {
    flexDirection: 'row',
    gap: 15,
    minHeight: 230,
    marginBottom: 15,
  },
  leftColumn: {
    width: '60%',
    flexDirection: 'column',
    gap: 15,
  },
  rightColumn: {
    width: '40%',
    paddingRight: 20,
  },
  diningHallCard: {
    borderRadius: 20,
    padding: 15,
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
  },
  hall1Card: {
    flex: 0,
    minHeight: 110,
    width: '100%',
  },
  hall2Card: {
    flex: 0,
    minHeight: 110,
    width: '100%',
  },
  hall3Card: {
    height: 'auto',
    minHeight: 230,
    width: '100%',
  },
  fullWidthCard: {
    minHeight: 80,
    height: 'auto',
  },
  hallInitial: {
    width: 60,
    height: 60,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 5,
  },
  initialText: {
    fontSize: 36,
    color: 'white',
    fontFamily: 'OPTICenturyNova',
    marginTop: 3,
  },
  hallInfo: {
    position: 'absolute',
    right: 15,
    top: 10,
  },
  rankNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    fontFamily: 'OPTICenturyNova',
    marginTop: 5,
  },
  hallName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    position: 'absolute',
    left: 90,
    top: 35,
    flex: 1,
    flexWrap: 'wrap',
    paddingRight: 10,
    paddingBottom: 10,
    width: '70%',
    fontFamily: 'Kumbh-Sans-Bold',
    marginTop: 5,
  },
  hallInitial1: {
    position: 'absolute',
    left: 15,
    top: 15,
  },
  hallName1: {
    position: 'absolute',
    bottom: 25,
    left: 90,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    width: '60%',
    paddingRight: 10,
    fontFamily: 'Kumbh-Sans-Bold',
  },
  hallInitial2: {
    position: 'absolute',
    left: 15,
    top: 15,
  },
  hallName2: {
    position: 'absolute',
    bottom: 25,
    left: 90,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    width: '60%',
    paddingRight: 10,
    fontFamily: 'Kumbh-Sans-Bold',
  },
  hallInitial3: {
    position: 'absolute',
    right: 15,
    top: 15,
  },
  hallInfo3: {
    position: 'absolute',
    left: 15,
    bottom: 70,
  },
  hallName3: {
    position: 'absolute',
    left: 15,
    bottom: 15,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    width: '80%',
    paddingRight: 10,
    fontFamily: 'Kumbh-Sans-Bold',
  },
});

export default DiningHallsScreen;
