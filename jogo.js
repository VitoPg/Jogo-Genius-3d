import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';

const Game = () => {
  const [sequence, setSequence] = useState([]);
  const [userSequence, setUserSequence] = useState([]);
  const [level, setLevel] = useState(1);
  const [difficulty, setDifficulty] = useState('easy');
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [congratulations, setCongratulations] = useState(false);
  const [activeSquare, setActiveSquare] = useState(null); // Track which square is currently active/blinking
  const [isShowingSequence, setIsShowingSequence] = useState(false);

  // Definindo cores únicas para os quadrados
  const squareColors = [
    '#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#FFD133', 
    '#33FFD1', '#5733FF', '#57FF33', '#FF6333'
  ];

  // Gerar sequência aleatória
  const generateSequence = (maxLength) => {
    const newSequence = [];
    const length = Math.floor(Math.random() * maxLength) + 1;
    for (let i = 0; i < length; i++) {
      newSequence.push(Math.floor(Math.random() * 9));
    }
    return newSequence;
  };

  // Piscar os quadrados na sequência
  const flashSequence = async () => {
    setIsShowingSequence(true);
    const speed = getSpeed();
    
    // Use a for loop with setTimeout to show each square in sequence
    for (let i = 0; i < sequence.length; i++) {
      await new Promise(resolve => {
        setTimeout(() => {
          setActiveSquare(sequence[i]);
          
          // Turn off the square after half the speed duration
          setTimeout(() => {
            setActiveSquare(null);
            resolve();
          }, speed / 2);
        }, i === 0 ? 0 : speed);
      });
    }
    
    // When sequence is done
    setIsShowingSequence(false);
  };

  // Verificar se o jogador acertou a sequência
  const checkSequence = () => {
    if (userSequence.join(',') === sequence.join(',')) {
      setUserSequence([]);
      setLevel(level + 1);
      setCongratulations(true);
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

  // Começar o jogo e mostrar a sequência
  useEffect(() => {
    if (isPlaying && sequence.length > 0 && userSequence.length === 0 && !isShowingSequence) {
      // Small delay before showing sequence
      const timer = setTimeout(() => {
        flashSequence();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isPlaying, sequence, userSequence, isShowingSequence]);

  // Generate sequence when game starts
  useEffect(() => {
    if (isPlaying && sequence.length === 0) {
      const maxLength = getMaxSequenceLength();
      const newSequence = generateSequence(maxLength);
      setSequence(newSequence);
    }
  }, [isPlaying]);

  // Lidar com o toque no quadrado
  const handleSquarePress = (index) => {
    if (!isPlaying || isShowingSequence) return;

    // Visual feedback - flash the pressed square
    setActiveSquare(index);
    setTimeout(() => setActiveSquare(null), 300);
    
    const newUserSequence = [...userSequence, index];
    setUserSequence(newUserSequence);

    // Check for errors
    const hasError = checkError(newUserSequence);
    
    // If no error and sequence complete
    if (!hasError && newUserSequence.length === sequence.length) {
      setTimeout(() => checkSequence(), 300);
    }
  };

  // Iniciar o jogo
  const startGame = () => {
    setIsPlaying(true);
    setLevel(1);
    setUserSequence([]);
    setGameOver(false);
    setCongratulations(false);
    setSequence([]);
  };

  // Reiniciar o jogo após o Game Over ou Parabéns
  const restartGame = () => {
    startGame();
  };

  // Parar o jogo
  const stopGame = () => {
    setIsPlaying(false);
  };

  // Controlar o nível de dificuldade
  const getMaxSequenceLength = () => {
    switch (difficulty) {
      case 'easy':
        return 5;
      case 'medium':
        return 10;
      case 'hard':
        return 15;
      default:
        return 5;
    }
  };

  // Controlar a velocidade dos flashes
  const getSpeed = () => {
    if (difficulty === 'easy') return 1000;
    if (difficulty === 'medium') return 700;
    return 400;
  };

  // Renderizar os quadrados
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
            // When active, make the square brighter or use a different visual effect
            isActive && { opacity: 0.3 }
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
      
      {isShowingSequence && (
        <Text style={styles.status}>Observe a sequência...</Text>
      )}
      
      <View style={styles.grid}>
        {renderSquares()}
      </View>

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
            <Text style={styles.gameOverText}>Parabéns! Você completou a sequência!</Text>
            <TouchableOpacity onPress={restartGame} style={styles.button}>
              <Text style={styles.buttonText}>Próximo Nível</Text>
            </TouchableOpacity>
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
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 10,
    margin: 5,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
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
  },
  gameOverText: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: 'bold',
  },
});

export default Game;
