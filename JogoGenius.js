import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';

const Game = () => {
  const [sequence, setSequence] = useState([]);
  const [userSequence, setUserSequence] = useState([]);
  const [level, setLevel] = useState(1);
  const [difficulty, setDifficulty] = useState('easy');
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [congratulations, setCongratulations] = useState(false);
  const [activeSquare, setActiveSquare] = useState(null);
  const [isShowingSequence, setIsShowingSequence] = useState(false);
  const [sequenceStep, setSequenceStep] = useState(-1);
  
  // Add refs to track if we've already shown the sequence for this level
  const sequenceShownRef = useRef(false);
  // Add ref to track all timeouts so we can clear them
  const timeoutsRef = useRef([]);

  // Helper to clear all timeouts
  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach(id => clearTimeout(id));
    timeoutsRef.current = [];
  };

  // Add timeout with tracking
  const addTimeout = (callback, delay) => {
    const id = setTimeout(() => {
      // Remove this timeout from the ref array
      timeoutsRef.current = timeoutsRef.current.filter(t => t !== id);
      callback();
    }, delay);
    timeoutsRef.current.push(id);
    return id;
  };

  // Definindo cores únicas para os quadrados
  const squareColors = [
    '#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#FFD133', 
    '#33FFD1', '#5733FF', '#57FF33', '#FF6333'
  ];

  // Gerar sequência aleatória com comprimento fixo baseado na dificuldade
  const generateSequence = () => {
    const newSequence = [];
    let length;
    if (difficulty === 'easy') length = 3;
    else if (difficulty === 'medium') length = 5;
    else length = 7;
    
    for (let i = 0; i < length; i++) {
      newSequence.push(Math.floor(Math.random() * 9));
    }
    return newSequence;
  };

  // Controlar a velocidade dos flashes
  const getSpeed = () => {
    if (difficulty === 'easy') return 1000;
    if (difficulty === 'medium') return 700;
    return 400;
  };

  // This effect handles the sequence animation
  useEffect(() => {
    // Only run if we're showing the sequence and have a valid step
    if (isShowingSequence && sequenceStep >= 0) {
      if (sequenceStep < sequence.length) {
        // Show the current square
        setActiveSquare(sequence[sequenceStep]);
        
        // Schedule hiding the square and moving to next step
        const hideTimer = addTimeout(() => {
          setActiveSquare(null);
          
          // Schedule showing the next square
          addTimeout(() => {
            setSequenceStep(sequenceStep + 1);
          }, 200); // Short pause between squares
        }, getSpeed() / 2); // Show square for half the speed time
      } else {
        // We've shown all squares in the sequence
        setIsShowingSequence(false);
        setSequenceStep(-1);
        sequenceShownRef.current = true; // Mark that we've shown the sequence
      }
    }
  }, [isShowingSequence, sequenceStep, sequence]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimeouts();
    };
  }, []);

  // This effect starts showing the sequence when needed
  useEffect(() => {
    // Only start showing sequence if:
    // 1. Game is playing
    // 2. We have a sequence
    // 3. User hasn't started inputting yet
    // 4. We're not already showing the sequence
    // 5. We haven't already shown the sequence for this level
    if (isPlaying && 
        sequence.length > 0 && 
        userSequence.length === 0 && 
        !isShowingSequence && 
        !sequenceShownRef.current) {
      
      // Delay before showing sequence
      addTimeout(() => {
        setIsShowingSequence(true);
        setSequenceStep(0); // Start at the first square
      }, 1000);
    }
  }, [isPlaying, sequence, userSequence, isShowingSequence]);

  // Generate sequence when game starts or level changes
  useEffect(() => {
    if (isPlaying && sequence.length === 0) {
      // Reset the sequence shown flag when generating a new sequence
      sequenceShownRef.current = false;
      const newSequence = generateSequence();
      console.log("New sequence generated:", newSequence);
      setSequence(newSequence);
    }
  }, [isPlaying, level]);

  // Handler for the "Pronto" button
  const handleReadyClick = () => {
    if (!isPlaying || isShowingSequence) return;
    
    console.log("Ready button clicked. Checking sequence:", {
      user: userSequence.join(','),
      game: sequence.join(','),
      match: userSequence.join(',') === sequence.join(',')
    });
    
    // Check if the user sequence matches the game sequence
    if (userSequence.join(',') === sequence.join(',')) {
      // Level completed successfully - show victory message
      console.log("Sequence matched! Showing victory message");
      setCongratulations(true);
      setIsPlaying(false);
      
      // Reset sequence shown flag for next level
      sequenceShownRef.current = false;
    } else {
      // Sequence doesn't match - game over
      console.log("Sequence doesn't match! Game over");
      setGameOver(true);
      setIsPlaying(false);
    }
  };

  // Verificar se o jogador errou a sequência
  const checkError = (newUserSequence) => {
    const currentIndex = newUserSequence.length - 1;
    if (newUserSequence[currentIndex] !== sequence[currentIndex]) {
      setGameOver(true);
      setIsPlaying(false);
      return true;
    }
    return false;
  };

  // Lidar com o toque no quadrado
  const handleSquarePress = (index) => {
    if (!isPlaying || isShowingSequence) return;

    // Visual feedback - flash the pressed square
    setActiveSquare(index);
    addTimeout(() => setActiveSquare(null), 300);
    
    const newUserSequence = [...userSequence, index];
    setUserSequence(newUserSequence);

    // Check for errors immediately - if wrong square is pressed, game over
    checkError(newUserSequence);
    
    // Note: We no longer automatically check for sequence completion here
    // The player must click the "Pronto" button to check if they've completed the sequence
  };

  // Iniciar o jogo
  const startGame = () => {
    // Clear any existing timeouts
    clearAllTimeouts();
    
    setIsPlaying(true);
    setLevel(1);
    setUserSequence([]);
    setGameOver(false);
    setCongratulations(false);
    setSequence([]);
    setIsShowingSequence(false);
    setActiveSquare(null);
    setSequenceStep(-1);
    
    // Reset sequence shown flag
    sequenceShownRef.current = false;
  };

  // Reiniciar o jogo após o Game Over ou Parabéns
  const restartGame = () => {
    startGame();
  };

  // Continue to next level after winning
  const nextLevel = () => {
    setCongratulations(false);
    setLevel(level + 1);
    setUserSequence([]);
    setSequence([]);
    setIsPlaying(true);
    sequenceShownRef.current = false;
  };

  // Parar o jogo
  const stopGame = () => {
    clearAllTimeouts();
    setIsPlaying(false);
    setIsShowingSequence(false);
    setActiveSquare(null);
    setSequenceStep(-1);
  };

  // Renderizar os quadrados com cores mais contrastantes para o efeito de piscar
  const renderSquares = () => {
    return squareColors.map((color, index) => {
      // Determine if this square should be highlighted
      const isActive = activeSquare === index;
      
      return (
        <TouchableOpacity
          key={index}
          style={[
            styles.square,
            { backgroundColor: color },
            // Make the visual effect more dramatic
            isActive && { backgroundColor: 'white', borderColor: color, borderWidth: 5 }
          ]}
          onPress={() => handleSquarePress(index)}
          disabled={!isPlaying || isShowingSequence}
        />
      );
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Jogo dos Gênios</Text>
      <Text style={styles.level}>Nível: {level}</Text>
      
      {isShowingSequence ? (
        <Text style={styles.status}>Observe a sequência...</Text>
      ) : isPlaying ? (
        <Text style={styles.status}>Sua vez! Repita a sequência.</Text>
      ) : null}
      
      <View style={styles.grid}>
        {renderSquares()}
      </View>
      
      {/* "Pronto" button - always visible during gameplay */}
      {isPlaying && !isShowingSequence && (
        <TouchableOpacity 
          onPress={handleReadyClick} 
          style={styles.readyButton}
          disabled={isShowingSequence}
        >
          <Text style={styles.readyButtonText}>PRONTO</Text>
        </TouchableOpacity>
      )}

      {/* Modal de Game Over */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={gameOver}
        onRequestClose={() => setGameOver(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.gameOverText}>Game Over!</Text>
            <TouchableOpacity onPress={restartGame} style={styles.button}>
              <Text style={styles.buttonText}>Reiniciar Jogo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Parabéns */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={congratulations}
        onRequestClose={() => setCongratulations(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.gameOverText}>Parabéns, você venceu!</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity onPress={nextLevel} style={styles.button}>
                <Text style={styles.buttonText}>Próximo Nível</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={restartGame} style={[styles.button, styles.secondaryButton]}>
                <Text style={styles.buttonText}>Reiniciar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.buttons}>
        {isPlaying ? (
          <TouchableOpacity onPress={stopGame} style={styles.button}>
            <Text style={styles.buttonText}>Parar Jogo</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={startGame} style={styles.button}>
            <Text style={styles.buttonText}>Iniciar Jogo</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.difficulty}>
        <TouchableOpacity 
          onPress={() => setDifficulty('easy')} 
          style={[styles.difficultyButton, difficulty === 'easy' && styles.activeButton]}
          disabled={isPlaying}
        >
          <Text style={styles.difficultyText}>Fácil</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setDifficulty('medium')} 
          style={[styles.difficultyButton, difficulty === 'medium' && styles.activeButton]}
          disabled={isPlaying}
        >
          <Text style={styles.difficultyText}>Médio</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setDifficulty('hard')} 
          style={[styles.difficultyButton, difficulty === 'hard' && styles.activeButton]}
          disabled={isPlaying}
        >
          <Text style={styles.difficultyText}>Difícil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
  },
  header: {
    fontSize: 30,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  level: {
    fontSize: 20,
    marginBottom: 10,
  },
  status: {
    fontSize: 16,
    color: '#FF5733',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 300,
    height: 300,
    marginBottom: 20,
  },
  square: {
    width: '33.33%',
    height: '33.33%',
    borderWidth: 1,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  readyButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  readyButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 10,
    margin: 5,
    borderRadius: 5,
    minWidth: 120,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#FF5733',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  difficulty: {
    flexDirection: 'row',
    marginTop: 20,
  },
  difficultyButton: {
    padding: 10,
    margin: 5,
    backgroundColor: '#CCC',
    borderRadius: 5,
  },
  activeButton: {
    backgroundColor: '#4CAF50',
  },
  difficultyText: {
    color: 'white',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 280,
  },
  gameOverText: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default Game;
