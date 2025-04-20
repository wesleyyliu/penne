import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../screens/types';
import { supabase } from '../lib/supabase';
import CheckerboardBackground from './CheckerboardBackground';

type DiningHallsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'DiningHallsScreen'
>;

interface DiningHallRating {
  dining_hall_name: string;
  average_score: number;
  rank: number;
  letter: string;
}

const DiningHallsScreen = ({ route }) => {
  const navigation = useNavigation<DiningHallsScreenNavigationProp>();
  const [diningHalls, setDiningHalls] = useState<DiningHallRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState('');
  const { session } = route.params || {};

  // Function to get the day and date
  useEffect(() => {
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'numeric', day: 'numeric' };
    const formattedDate = date.toLocaleDateString('en-US', options).toUpperCase();
    const [dayName, monthDay] = formattedDate.split(', ');
    setCurrentDate(`${dayName}\n${monthDay.replace('/', '/')}`);
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
          
          // Using the same logic as in LeaderboardScreen
          const { data, error } = await supabase
            .from('dining_hall_ratings')
            .select('dining_hall_name, score');
          
          if (error) throw error;
          
          if (data) {
            // Group and calculate average score for each dining hall
            const hallScores: Record<string, { total: number, count: number }> = {};
            
            data.forEach(rating => {
              if (!hallScores[rating.dining_hall_name]) {
                hallScores[rating.dining_hall_name] = { total: 0, count: 0 };
              }
              hallScores[rating.dining_hall_name].total += rating.score;
              hallScores[rating.dining_hall_name].count += 1;
            });
            
            // Calculate average and create sorted array
            const ratingsList = Object.entries(hallScores).map(([name, scores]) => ({
              dining_hall_name: name,
              average_score: scores.total / scores.count,
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
          }
        } catch (err) {
          console.error('Error fetching dining hall ratings:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchDiningHallRatings();
    }, [])
  );

  return (
    <CheckerboardBackground>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>H</Text>
            <Image
              source={require('../assets/tomato1.png')}
              style={styles.logoImage}
            />
            <Text style={styles.logoText}>ME</Text>
          </View>
          <Text style={styles.dateText}>{currentDate}</Text>
        </View>

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
                      { backgroundColor: getPositionColor(1) }
                    ]}
                    onPress={() => navigation.navigate('DiningHallDetail', { 
                      hallName: diningHalls[0].dining_hall_name,
                      session 
                    })}
                  >
                    <View style={[
                      styles.hallInitial,
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
                    <Text style={[styles.hallName, styles.hallNameFirst]}>
                      {diningHalls[0].dining_hall_name}
                    </Text>
                  </TouchableOpacity>
                )}

                {diningHalls.length > 1 && (
                  <TouchableOpacity
                    style={[
                      styles.diningHallCard,
                      styles.hall2Card,
                      { backgroundColor: getPositionColor(2) }
                    ]}
                    onPress={() => navigation.navigate('DiningHallDetail', { 
                      hallName: diningHalls[1].dining_hall_name,
                      session 
                    })}
                  >
                    <View style={[
                      styles.hallInitial,
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
                    <Text style={[styles.hallName, styles.hallNameSecond]}>
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
                      { backgroundColor: getPositionColor(3) }
                    ]}
                    onPress={() => navigation.navigate('DiningHallDetail', { 
                      hallName: diningHalls[2].dining_hall_name,
                      session 
                    })}
                  >
                    <View style={[
                      styles.hallInitial,
                      { backgroundColor: getInitialBoxColor(3) }
                    ]}>
                      <Text style={styles.initialText}>{diningHalls[2].letter}</Text>
                    </View>
                    <View style={styles.hallInfo}>
                      <Text style={[
                        styles.rankNumber,
                        { color: getRankNumberColor(3) }
                      ]}>#3</Text>
                    </View>
                    <Text style={[styles.hallName, styles.hallNameThird]}>
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
                  { backgroundColor: getPositionColor(index + 4) }
                ]}
                onPress={() => navigation.navigate('DiningHallDetail', { 
                  hallName: hall.dining_hall_name,
                  session 
                })}
              >
                <View style={[
                  styles.hallInitial,
                  { backgroundColor: getInitialBoxColor(index + 4) }
                ]}>
                  <Text style={styles.initialText}>{hall.letter}</Text>
                </View>
                <Text style={styles.hallName}>{hall.dining_hall_name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </CheckerboardBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#635E4A',
  },
  logoImage: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  dateText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#635E4A',
    textAlign: 'right',
  },
  contentCard: {
    backgroundColor: '#fef8f0',
    borderRadius: 30,
    marginTop: 20,
    marginHorizontal: 0,
    marginBottom: 0,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '500',
    color: '#635E4A',
    marginBottom: 20,
  },
  diningHallsGrid: {
    flexDirection: 'column',
    gap: 15,
  },
  topLayout: {
    flexDirection: 'row',
    gap: 15,
    height: 230,
    marginBottom: 15,
  },
  leftColumn: {
    flex: 1,
    flexDirection: 'column',
    gap: 15,
  },
  rightColumn: {
    flex: 1,
  },
  diningHallCard: {
    borderRadius: 20,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  hall1Card: {
    flex: 1,
  },
  hall2Card: {
    flex: 1,
  },
  hall3Card: {
    height: '100%',
  },
  fullWidthCard: {
    height: 80,
  },
  hallInitial: {
    width: 60,
    height: 60,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  initialText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  hallInfo: {
    position: 'absolute',
    right: 15,
    top: 10,
  },
  rankNumber: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  hallName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 10,
    flex: 1,
    flexWrap: 'wrap',
  },
  hallNameFirst: {
    position: 'absolute',
    bottom: 15,
    left: 90,
    width: '60%',
  },
  hallNameSecond: {
    position: 'absolute',
    bottom: 15,
    left: 90,
    width: '60%',
  },
  hallNameThird: {
    position: 'absolute',
    bottom: 15, 
    left: 90,
    width: '60%',
  },
});

export default DiningHallsScreen;
