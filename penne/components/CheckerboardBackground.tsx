import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type CheckerboardBackgroundProps = {
  children: React.ReactNode;
};

const CheckerboardBackground: React.FC<CheckerboardBackgroundProps> = ({ children }) => {
  // Get screen dimensions
  const { width } = Dimensions.get('window');
  
  // Calculate how many squares to generate (8x16 grid)
  const numColumns = 10;
  const squareSize = Math.ceil(width / numColumns);
  const numRows = 22;
  
  // Generate checkerboard pattern
  const renderCheckerboard = () => {
    const squares = [];
    
    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numColumns; col++) {
        // Alternate square colors
        const isEvenSquare = (row + col) % 2 === 0;
        
        squares.push(
          <View
            key={`${row}-${col}`}
            style={{
              position: 'absolute',
              width: squareSize,
              height: squareSize,
              backgroundColor: isEvenSquare ? '#e9dfd0' : '#f5eee0',
              top: row * squareSize,
              left: col * squareSize,
            }}
          />
        );
      }
    }
    
    return squares;
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.checkerboard}>
        {renderCheckerboard()}
      </View>
      
      {/* Peach to gray gradient overlay */}
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.57)', 'rgba(210, 183, 159, 0.71)', 'rgba(36, 27, 16, 0.63)']}
        style={styles.gradient}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      
      {/* Content */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  checkerboard: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    position: 'relative',
    zIndex: 2,
  },
});

export default CheckerboardBackground;