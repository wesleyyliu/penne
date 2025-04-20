import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { useRoute } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';

// Interface for the dining hall ratings
interface DiningHallRating {
  dining_hall_name: string;
  average_score: number;
  rank: number;
}

const LeaderboardScreen = () => {
  const route = useRoute();
  const { session } = route.params;
  const [diningHallRatings, setDiningHallRatings] = useState<DiningHallRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to get the letter initial from the dining hall name
  const getInitial = (name: string) => {
    const fixed_name = name.replace(/[0-9]/g, '').trim();
    return fixed_name.charAt(0).toUpperCase();
  };

  // Function to determine position-based color
  const getPositionColor = (rank: number) => {
    switch (rank) {
      case 1:
        return '#E28D61'; // First place (Quaker Kitchen color)
      case 2:
        return '#EBA887'; // Second place (Lauder color)
      case 3:
        return '#CFD0A3'; // Third place (English House color)
      default:
        return '#C3B2CD'; // Other positions
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E28D61" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>LEADERBOARD</Text>
      
      {/* Top 3 Section */}
      <View style={styles.topThreeContainer}>
        {/* We'll manually arrange them in podium order: 2nd, 1st, 3rd */}
        {diningHallRatings.length >= 3 && (
          <>
            {/* 2nd Place (Left) */}
            <View 
              key={diningHallRatings[1].dining_hall_name} 
              style={[
                styles.topCard,
                { 
                  backgroundColor: getPositionColor(2),
                  height: 210,
                  marginTop: 40 // Push down to make room for 1st place
                }
              ]}
            >
              <View style={styles.initialCircle}>
                <Text style={styles.initialText}>{getInitial(diningHallRatings[1].dining_hall_name)}</Text>
                <View style={styles.rankCircle}>
                  <Text style={styles.rankText}>2</Text>
                </View>
              </View>
              <Text style={styles.hallName}>
                {diningHallRatings[1].dining_hall_name}
              </Text>
            </View>

            {/* 1st Place (Middle/Center) */}
            <View 
              key={diningHallRatings[0].dining_hall_name} 
              style={[
                styles.topCard,
                { 
                  backgroundColor: getPositionColor(1),
                  height: 250,
                  marginTop: 0,
                  zIndex: 3 // Ensure it's above the others
                }
              ]}
            >
              <View style={styles.initialCircle}>
                <Text style={styles.crown}>👑</Text>
                <Text style={styles.initialText}>{getInitial(diningHallRatings[0].dining_hall_name)}</Text>
                <View style={styles.rankCircle}>
                  <Text style={styles.rankText}>1</Text>
                </View>
              </View>
              <Text style={styles.hallName}>
                {diningHallRatings[0].dining_hall_name}
              </Text>
            </View>

            {/* 3rd Place (Right) */}
            <View 
              key={diningHallRatings[2].dining_hall_name} 
              style={[
                styles.topCard,
                { 
                  backgroundColor: getPositionColor(3),
                  height: 190,
                  marginTop: 60 // Push down more than 2nd place
                }
              ]}
            >
              <View style={styles.initialCircle}>
                <Text style={styles.initialText}>{getInitial(diningHallRatings[2].dining_hall_name)}</Text>
                <View style={styles.rankCircle}>
                  <Text style={styles.rankText}>3</Text>
                </View>
              </View>
              <Text style={styles.hallName}>
                {diningHallRatings[2].dining_hall_name}
              </Text>
            </View>
          </>
        )}
      </View>
      
      {/* Rest of the rankings */}
      <ScrollView style={styles.rankingsScrollView}>
        {diningHallRatings.slice(3).map((hall, index) => {
          const rank = index + 4; // Starting from 4th place
          return (
            <View 
              key={hall.dining_hall_name} 
              style={[styles.rankingRow, { backgroundColor: getPositionColor(rank) }]}
            >
              <Text style={styles.rankNumber}>{rank}th</Text>
              <View style={styles.rankInitialCircle}>
                <Text style={styles.rankInitialText}>{getInitial(hall.dining_hall_name)}</Text>
              </View>
              <Text style={styles.rankHallName}>{hall.dining_hall_name}</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
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
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#7E8B5F', // Green color from the image
  },
  topThreeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    height: 280, // Increased height to accommodate taller podium
    marginBottom: 20,
  },
  topCard: {
    width: '30%',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 20,
  },
  initialCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  crown: {
    position: 'absolute',
    top: -15,
    fontSize: 24,
  },
  initialText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  rankCircle: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E28D61',
  },
  rankText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E28D61',
  },
  hallName: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    paddingHorizontal: 5,
  },
  rankingsScrollView: {
    flex: 1,
  },
  rankingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 20,
    marginBottom: 10,
  },
  rankNumber: {
    width: 40,
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  rankInitialCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  rankInitialText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  rankHallName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default LeaderboardScreen;