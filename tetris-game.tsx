"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Tetromino shapes
const TETROMINOES = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    color: "#00f0f0",
  },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: "#f0f000",
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: "#a000f0",
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    color: "#00f000",
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    color: "#f00000",
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: "#0000f0",
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: "#f0a000",
  },
}

const BOARD_WIDTH = 10
const BOARD_HEIGHT = 20
const EMPTY_BOARD = Array(BOARD_HEIGHT)
  .fill(null)
  .map(() => Array(BOARD_WIDTH).fill(0))

type TetrominoType = keyof typeof TETROMINOES
type Board = number[][]
type Position = { x: number; y: number }

interface Piece {
  shape: number[][]
  color: string
  position: Position
}

export default function TetrisGame() {
  const [board, setBoard] = useState<Board>(EMPTY_BOARD)
  const [currentPiece, setCurrentPiece] = useState<Piece | null>(null)
  const [score, setScore] = useState(0)
  const [lines, setLines] = useState(0)
  const [level, setLevel] = useState(1)
  const [gameOver, setGameOver] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const gameLoopRef = useRef<NodeJS.Timeout>()

  // Create a random tetromino
  const createRandomPiece = useCallback((): Piece => {
    const types = Object.keys(TETROMINOES) as TetrominoType[]
    const randomType = types[Math.floor(Math.random() * types.length)]
    const tetromino = TETROMINOES[randomType]

    return {
      shape: tetromino.shape,
      color: tetromino.color,
      position: { x: Math.floor(BOARD_WIDTH / 2) - Math.floor(tetromino.shape[0].length / 2), y: 0 },
    }
  }, [])

  // Check if a position is valid
  const isValidPosition = useCallback(
    (piece: Piece, newPosition: Position, newShape?: number[][]): boolean => {
      const shape = newShape || piece.shape

      for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
          if (shape[y][x]) {
            const newX = newPosition.x + x
            const newY = newPosition.y + y

            if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
              return false
            }

            if (newY >= 0 && board[newY][newX]) {
              return false
            }
          }
        }
      }

      return true
    },
    [board],
  )

  // Rotate a piece 90 degrees clockwise
  const rotatePiece = useCallback((shape: number[][]): number[][] => {
    const rotated = shape[0].map((_, index) => shape.map((row) => row[index]).reverse())
    return rotated
  }, [])

  // Place piece on board
  const placePiece = useCallback(
    (piece: Piece): Board => {
      const newBoard = board.map((row) => [...row])

      for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
          if (piece.shape[y][x]) {
            const boardY = piece.position.y + y
            const boardX = piece.position.x + x
            if (boardY >= 0) {
              newBoard[boardY][boardX] = 1
            }
          }
        }
      }

      return newBoard
    },
    [board],
  )

  // Clear completed lines
  const clearLines = useCallback((board: Board): { newBoard: Board; linesCleared: number } => {
    const newBoard = board.filter((row) => row.some((cell) => cell === 0))
    const linesCleared = BOARD_HEIGHT - newBoard.length

    // Add empty rows at the top
    while (newBoard.length < BOARD_HEIGHT) {
      newBoard.unshift(Array(BOARD_WIDTH).fill(0))
    }

    return { newBoard, linesCleared }
  }, [])

  // Move piece down
  const movePieceDown = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return

    const newPosition = { ...currentPiece.position, y: currentPiece.position.y + 1 }

    if (isValidPosition(currentPiece, newPosition)) {
      setCurrentPiece({ ...currentPiece, position: newPosition })
    } else {
      // Place the piece and create a new one
      const newBoard = placePiece(currentPiece)
      const { newBoard: clearedBoard, linesCleared } = clearLines(newBoard)

      setBoard(clearedBoard)
      setLines((prev) => prev + linesCleared)
      setScore((prev) => prev + linesCleared * 100 * level)

      // Check for game over
      const nextPiece = createRandomPiece()
      if (!isValidPosition(nextPiece, nextPiece.position)) {
        setGameOver(true)
        return
      }

      setCurrentPiece(nextPiece)
    }
  }, [currentPiece, gameOver, isPaused, isValidPosition, placePiece, clearLines, level, createRandomPiece])

  // Handle keyboard input
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (!currentPiece || gameOver || isPaused) return

      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault()
          const leftPosition = { ...currentPiece.position, x: currentPiece.position.x - 1 }
          if (isValidPosition(currentPiece, leftPosition)) {
            setCurrentPiece({ ...currentPiece, position: leftPosition })
          }
          break

        case "ArrowRight":
          event.preventDefault()
          const rightPosition = { ...currentPiece.position, x: currentPiece.position.x + 1 }
          if (isValidPosition(currentPiece, rightPosition)) {
            setCurrentPiece({ ...currentPiece, position: rightPosition })
          }
          break

        case "ArrowDown":
          event.preventDefault()
          movePieceDown()
          break

        case "ArrowUp":
        case " ":
          event.preventDefault()
          const rotatedShape = rotatePiece(currentPiece.shape)
          if (isValidPosition(currentPiece, currentPiece.position, rotatedShape)) {
            setCurrentPiece({ ...currentPiece, shape: rotatedShape })
          }
          break

        case "p":
        case "P":
          event.preventDefault()
          setIsPaused((prev) => !prev)
          break
      }
    },
    [currentPiece, gameOver, isPaused, isValidPosition, movePieceDown, rotatePiece],
  )

  // Start new game
  const startNewGame = useCallback(() => {
    setBoard(EMPTY_BOARD)
    setCurrentPiece(createRandomPiece())
    setScore(0)
    setLines(0)
    setLevel(1)
    setGameOver(false)
    setIsPaused(false)
  }, [createRandomPiece])

  // Game loop
  useEffect(() => {
    if (!gameOver && !isPaused) {
      const speed = Math.max(100, 1000 - (level - 1) * 100)
      gameLoopRef.current = setInterval(movePieceDown, speed)
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
      }
    }
  }, [movePieceDown, gameOver, isPaused, level])

  // Update level based on lines cleared
  useEffect(() => {
    setLevel(Math.floor(lines / 10) + 1)
  }, [lines])

  // Keyboard event listeners
  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [handleKeyPress])

  // Initialize game
  useEffect(() => {
    if (!currentPiece && !gameOver) {
      setCurrentPiece(createRandomPiece())
    }
  }, [currentPiece, gameOver, createRandomPiece])

  // Render the game board
  const renderBoard = () => {
    const displayBoard = board.map((row) => [...row])

    // Add current piece to display board
    if (currentPiece) {
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x]) {
            const boardY = currentPiece.position.y + y
            const boardX = currentPiece.position.x + x
            if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
              displayBoard[boardY][boardX] = 2 // Current piece
            }
          }
        }
      }
    }

    return displayBoard.map((row, y) => (
      <div key={y} className="flex">
        {row.map((cell, x) => (
          <div
            key={x}
            className={`w-6 h-6 border border-gray-600 ${
              cell === 1 ? "bg-gray-400" : cell === 2 ? "bg-blue-500" : "bg-gray-900"
            }`}
          />
        ))}
      </div>
    ))
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="flex gap-6">
        {/* Game Board */}
        <Card className="p-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-center">Tetris</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-gray-800 bg-gray-900 p-2">{renderBoard()}</div>

            {gameOver && (
              <div className="text-center mt-4">
                <p className="text-red-600 font-bold text-xl mb-2">Game Over!</p>
                <Button onClick={startNewGame}>New Game</Button>
              </div>
            )}

            {isPaused && !gameOver && (
              <div className="text-center mt-4">
                <p className="text-yellow-600 font-bold text-xl">Paused</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Game Info */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Score</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{score}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Lines</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{lines}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Level</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{level}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Controls</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-1">
              <p>← → Move</p>
              <p>↓ Soft drop</p>
              <p>↑ / Space Rotate</p>
              <p>P Pause</p>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Button onClick={startNewGame} className="w-full bg-transparent" variant="outline">
              New Game
            </Button>
            <Button onClick={() => setIsPaused(!isPaused)} className="w-full" variant="outline" disabled={gameOver}>
              {isPaused ? "Resume" : "Pause"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
