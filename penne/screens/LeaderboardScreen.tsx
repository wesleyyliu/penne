import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, SafeAreaView, Image } from 'react-native';
import { supabase } from '../lib/supabase';
import { useRoute } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { Session } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import CheckerboardBackground from '../components/CheckerboardBackground';
import { useFonts } from 'expo-font';

// Define route params type
type RouteParams = {
  session?: Session;
};

// Interface for the dining hall ratings
interface DiningHallRating {
  dining_hall_name: string;
  average_score: number;
  rank: number;
}

const LeaderboardScreen = () => {
  const route = useRoute<{
    key: string;
    name: string;
    params: RouteParams;
  }>();
  const { session } = route.params || {};
  const [diningHallRatings, setDiningHallRatings] = useState<DiningHallRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fontsLoaded] = useFonts({
    'Kumbh-Sans': require('../assets/fonts/Kumbh-Sans.ttf'),
    'Kumbh-Sans-Bold': require('../assets/fonts/Kumbh-Sans-Bold.ttf'),
    'GalileoFLF-Bold': require('../assets/fonts/GalileoFLF-Bold.ttf'),
    'GalileoFLF-Roman': require('../assets/fonts/GalileoFLF-Roman.ttf'),
  });


  // Function to get the letter initial from the dining hall name
  const getInitial = (name: string) => {
    const fixed_name = name.replace(/[0-9]/g, '').trim();
    return fixed_name.charAt(0).toUpperCase();
  };

  // Function to determine position-based color
  const getPositionColor = (rank: number) => {
    switch (rank) {
      case 1:
        return '#F8AB7F'; // First place bar color
      case 2:
        return '#FFC4A8'; // Second place bar color
      case 3:
        return '#E1D090'; // Third place bar color
      default:
        return '#CFB8CF'; // Purple color for lower positions
    }
  };

  // Function to determine circle color
  const getCircleColor = (rank: number) => {
    switch (rank) {
      case 1:
        return '#EC732E'; // First place circle color
      case 2:
        return '#FE9D6D'; // Second place circle color
      case 3:
        return '#C8B56F'; // Third place circle color
      default:
        return '#BA9CBA'; // Purple circle for lower positions
    }
  };

  // Fetch dining hall ratings data
  useFocusEffect(
    useCallback(() => {
      const fetchDiningHallRatings = async () => {
        try {
          setLoading(true);
          
          let query = supabase
            .from('dining_hall_ratings')
            .select('dining_hall_name, score');
          
          // Filter by user ID if logged in and we want to show personal ratings
          // this is commented out because leaderboard is for everyone
          // if (session?.user) {
          //   query = query.eq('user_id', session.user.id);
          // }
          
          const { data, error } = await query;
          
          if (error) {
            throw error;
          }
          
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
              rank: 0 // Will be assigned below
            }));
            
            // Sort by average score (descending)
            ratingsList.sort((a, b) => b.average_score - a.average_score);
            
            // Assign ranks
            ratingsList.forEach((hall, index) => {
              hall.rank = index + 1;
              console.log(hall.dining_hall_name, hall.average_score, hall.rank);
            });
            
            setDiningHallRatings(ratingsList);
          }
        } catch (err) {
          console.error('Error fetching dining hall ratings:', err);
          setError('Failed to load dining hall ratings');
        } finally {
          setLoading(false);
        }
      };

      fetchDiningHallRatings();
      
      return () => {
        // Optional cleanup if needed
      };
    }, [session])
  );

  if (loading) {
    return (
      <CheckerboardBackground>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E28D61" />
        </View>
      </CheckerboardBackground>
    );
  }

  if (error) {
    return (
      <CheckerboardBackground>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </CheckerboardBackground>
    );
  }

  return (
    <CheckerboardBackground>
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.title}>LEADERBOARD</Text>
        
        <View style={styles.contentCard}>
          <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
            <View style={{ height: 30 }} />
            {/* Top 3 Section */}
            <View style={styles.topThreeContainer}>
              {diningHallRatings.length >= 3 && (
                <>
                  {/* Background shape that connects all three cards */}
                  <View style={styles.podiumBackground}>
                    {/* Shadows first (underneath) */}
                    {/* Left shadow */}
                    <View style={[styles.podiumShadow, { 
                      backgroundColor: '#E4A590', 
                      left: 0, 
                      width: '33%',
                      borderTopLeftRadius: 40,
                      borderBottomLeftRadius: 40,
                      borderTopRightRadius: 0,
                      borderBottomRightRadius: 0,
                      bottom: -5,
                      height: 225,
                      zIndex: 1,
                    }]} />
                    
                    {/* Middle shadow */}
                    <View style={[styles.podiumShadow, { 
                      backgroundColor: '#E28D61', 
                      left: '33%', 
                      width: '34%',
                      borderTopLeftRadius: 40,
                      borderTopRightRadius: 40,
                      bottom: -5,
                      height: 275,
                      zIndex: 1,
                    }]} />
                    
                    {/* Right shadow */}
                    <View style={[styles.podiumShadow, { 
                      backgroundColor: '#D1C07F', 
                      left: '67%', 
                      width: '33%',
                      borderTopRightRadius: 40,
                      borderBottomRightRadius: 40,
                      borderTopLeftRadius: 0,
                      borderBottomLeftRadius: 0,
                      bottom: -5,
                      height: 225,
                      zIndex: 1,
                    }]} />

                    {/* Left card */}
                    <View style={[styles.podiumSection, { 
                      backgroundColor: getPositionColor(2), 
                      left: 0, 
                      width: '31%',
                      borderTopLeftRadius: 40,
                      borderBottomLeftRadius: 40,
                      borderTopRightRadius: 0,
                      borderBottomRightRadius: 0,
                      bottom: 0,
                      height: 220,
                      zIndex: 2,
                    }]} />
                    
                    {/* Left connection */}
                    <View style={[styles.connector, { 
                      backgroundColor: getPositionColor(2), 
                      left: '31%', 
                      width: '2%',
                      bottom: 0,
                      height: 220,
                      zIndex: 2,
                    }]} />
                    
                    {/* Middle card */}
                    <View style={[styles.podiumSection, { 
                      backgroundColor: getPositionColor(1), 
                      left: '33%', 
                      width: '34%',
                      borderTopLeftRadius: 40,
                      borderTopRightRadius: 40,
                      bottom: 0,
                      height: 270,
                      zIndex: 2,
                    }]} />
                    
                    {/* Right connection */}
                    <View style={[styles.connector, { 
                      backgroundColor: getPositionColor(3), 
                      left: '67%', 
                      width: '2%',
                      bottom: 0,
                      height: 220,
                      zIndex: 2,
                    }]} />
                    
                    {/* Right card */}
                    <View style={[styles.podiumSection, { 
                      backgroundColor: getPositionColor(3), 
                      left: '69%', 
                      width: '31%',
                      borderTopRightRadius: 40,
                      borderBottomRightRadius: 40,
                      borderTopLeftRadius: 0,
                      borderBottomLeftRadius: 0,
                      bottom: 0,
                      height: 220,
                      zIndex: 2,
                    }]} />
                  </View>

                  {/* Names at the bottom of each section - positioned to be centered vertically */}
                  <View style={[styles.hallNameContainer, { left: 0, width: '31%', top: 145 }]}>
                    <Text style={styles.hallName}>{diningHallRatings[1].dining_hall_name.split(' ').join('\n')}</Text>
                  </View>
                  
                  <View style={[styles.hallNameContainer, { left: '33%', width: '34%', top: 140 }]}>
                    <Text style={styles.hallName}>{diningHallRatings[0].dining_hall_name}</Text>
                  </View>
                  
                  <View style={[styles.hallNameContainer, { right: 0, width: '31%', top: 150 }]}>
                    <Text style={styles.hallName}>{diningHallRatings[2].dining_hall_name.split(' ').join('\n')}</Text>
                  </View>

                  {/* 2nd Place (Left) */}
                  <View 
                    key={diningHallRatings[1].dining_hall_name} 
                    style={[
                      styles.topCard,
                      { 
                        backgroundColor: 'transparent',
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        width: '33%',
                        zIndex: 2
                      }
                    ]}
                  >
                    <View style={styles.circleContainer}>
                      <View style={[styles.initialCircle, { backgroundColor: getCircleColor(2) }]}>
                        <Text style={styles.initialText}>{getInitial(diningHallRatings[1].dining_hall_name)}</Text>
                      </View>
                      <View style={styles.rankBadge}>
                        <Text style={styles.rankText}>2</Text>
                      </View>
                    </View>
                  </View>

                  {/* 1st Place (Middle) */}
                  <View 
                    key={diningHallRatings[0].dining_hall_name} 
                    style={[
                      styles.topCard,
                      { 
                        backgroundColor: 'transparent',
                        position: 'absolute',
                        left: '33%',
                        top: 0,
                        width: '34%',
                        zIndex: 3
                      }
                    ]}
                  >
                    <View style={[styles.circleContainer, { top: -10 }]}>
                      <View style={styles.starWrapper}>
                        <View style={[styles.initialCircle, { backgroundColor: getCircleColor(1), width: 90, height: 90, borderRadius: 45 }]}>
                          <Text style={[styles.initialText, { fontSize: 45 }]}>{getInitial(diningHallRatings[0].dining_hall_name)}</Text>
                        </View>
                        <View style={styles.starContainer}>
                          <Image source={require('../assets/star.png')} style={styles.starImage} />
                        </View>
                      </View>
                      <View style={[styles.rankBadge, { bottom: -18, left: '55%' }]}>
                        <Text style={styles.rankText}>1</Text>
                      </View>
                    </View>
                  </View>

                  {/* 3rd Place (Right) */}
                  <View 
                    key={diningHallRatings[2].dining_hall_name} 
                    style={[
                      styles.topCard,
                      { 
                        backgroundColor: 'transparent',
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        width: '33%',
                        zIndex: 2
                      }
                    ]}
                  >
                    <View style={styles.circleContainer}>
                      <View style={[styles.initialCircle, { backgroundColor: getCircleColor(3) }]}>
                        <Text style={styles.initialText}>{getInitial(diningHallRatings[2].dining_hall_name)}</Text>
                      </View>
                      <View style={styles.rankBadge}>
                        <Text style={styles.rankText}>3</Text>
                      </View>
                    </View>
                  </View>
                </>
              )}
            </View>
            
            {/* Add spacing to push rankings below */}
            <View style={{ height: 40 }} />
            
            {/* Rest of the rankings */}
            <View style={styles.rankingsContainer}>
              {diningHallRatings.slice(3).map((hall, index) => {
                const rank = index + 4; // Starting from 4th place
                return (
                  <View 
                    key={hall.dining_hall_name} 
                    style={[styles.rankingRow, { backgroundColor: getPositionColor(rank) }]}
                  >
                    <Text style={styles.rankPosition}>{rank}th</Text>
                    <View style={styles.circleAndTextContainer}>
                      <View style={[styles.rankInitialCircle, { backgroundColor: getCircleColor(rank) }]}>
                        <Text style={styles.rankInitialText}>{getInitial(hall.dining_hall_name)}</Text>
                      </View>
                      <Text style={styles.rankHallName}>{hall.dining_hall_name}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </CheckerboardBackground>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  contentScroll: {
    flex: 1,
  },
  contentCard: {
    backgroundColor: '#fef8f0',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    paddingBottom: 20,
    marginBottom: 20,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  container: {
    flex: 1,
    backgroundColor: '#F8F3EB', // Light cream background
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
  title: {
    fontSize: 42,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 30,
    marginBottom: 50,
    color: '#7E8B5F', // Green color from the image
    fontFamily: 'GalileoFLF-Bold',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  topThreeContainer: {
    height: 250,
    marginTop: 20,
    marginBottom: 0,
    marginHorizontal: 10,
    position: 'relative',
  },
  podiumBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    height: 300,
  },
  podiumSection: {
    position: 'absolute',
  },
  podiumShadow: {
    position: 'absolute',
    zIndex: 1,
  },
  connector: {
    position: 'absolute',
  },
  topCard: {
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  circleContainer: {
    position: 'absolute',
    top: 40,
    alignItems: 'center',
    width: '100%',
    zIndex: 10,
  },
  initialCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
  },
  starWrapper: {
    position: 'relative',
    width: 80,
    height: 80,
  },
  starContainer: {
    position: 'absolute',
    top: -15,
    left: 0,
    backgroundColor: 'transparent',
    width: 45,
    height: 45,
    borderRadius: 22.5,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  starImage: {
    width: 45,
    height: 45,
    resizeMode: 'contain',
    transform: [{ rotate: '15deg' }]
  },
  initialText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
  },
  rankBadge: {
    position: 'absolute',
    bottom: -10,
    backgroundColor: '#FFF9EC',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    left: '50%',
    marginLeft: -12,
  },
  rankText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E28D61',
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
  },
  hallNameContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
    width: '100%',
  },
  hallName: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 5,
    lineHeight: 18,
  },
  rankingsContainer: {
    paddingBottom: 20,
    paddingHorizontal: 15,
    marginTop: 40,
  },
  rankingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 40,
    marginBottom: 25,
    height: 76,
    paddingLeft: 25,
  },
  rankPosition: {
    width: 50,
    fontSize: 24,
    fontWeight: '300',
    color: 'white',
    fontFamily: 'GalileoFLF-Roman',
    marginRight: 10,
    opacity: 0.9,
  },
  circleAndTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankInitialCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  rankInitialText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
  },
  rankHallName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default LeaderboardScreen;