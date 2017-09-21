// TIC-TAC-TOE


const reset = '\x1b[0m'
const underscore = '\x1b[4m'
const red = '\x1b[31m'
const green = '\x1b[32m'
const yellow = '\x1b[33m'
const blue = '\x1b[34m'
const magenta = '\x1b[35m'
const cyan = '\x1b[36m'
const white = '\x1b[37m'
const bgWhite = '\x1b[47m'

const logStyle = (...styles) => (content) => ([
  console.log([...styles, content, reset].join(''))
])


const logGreen = logStyle(green)
const logMagenta = logStyle(magenta)
const logTurn = logStyle(underscore, yellow)
const logError = logStyle(red)
const logWinner = logStyle(bgWhite, magenta)
const linebreak = () => console.log('')



// IO

const rl = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  })

logGreen('TIC-TAC-TOE')
linebreak()
start()

function start() {
  return getBoardSize()
    .then(size => play(initModel(size)))
    .then(model => restartOrExit(model))
}

function getBoardSize() {
  return new Promise((resolve) => {
    logGreen('What size board would you like to play with?')
    rl.question('', (answer) => {
      const size = parseInt(answer, 10)
      if (!isNaN(size) && size == answer && size > 0) {
        resolve(size)
      } else {
        linebreak()
        logError('Please enter a positive integer.')
        resolve(getBoardSize())
      }
    })
  })
}

function play(model) {
  return new Promise((resolve) => {
    linebreak()
    drawBoard(model.board)
    linebreak()
    logTurn(`${model.player}'s turn`)
    linebreak()
    console.log('Pick a square (ex: \'1, 2\')')

    rl.question('', input => {
      const nextModel = updateModel(processInput(input), model)
      linebreak()

      if (nextModel.winner || nextModel.stalemate) {
        drawBoard(nextModel.board)
        resolve(nextModel)
      } else {
        if (nextModel.error) logError(nextModel.error)
        resolve(play(nextModel))
      }

    })

  })
}


function restartOrExit({ winner, stalemate }) {
  return new Promise(resolve => {
    linebreak()
    if (winner) logWinner(`${winner} wins!`)
    else logMagenta('Stalemate! Nobody wins!')
    linebreak()
    logGreen('Would you like to play again?')
    rl.question('', (answer) => {
      if (['', 'y', 'yes', 'sure', '1'].includes(answer.toLowerCase())) {
        resolve(start())
      } else {
        linebreak()
        logGreen('Goodbye!')
        rl.close()
        resolve()
      }
    })

  })
}

function processInput(input) {
  return input
    .split(/[,\s]+/)
    .map(v => v.replace(/\s*/, ''))
    .map(v => /\D/.test(v) ? '' : v)
}

function drawBoard(board) {
  board
    .map(row =>
      row.map(v => {
        switch (true) {
          case v === 'X': return cyan + v + reset
          case v === 'O': return yellow + v + reset
          default: return v
        }
      })
    )
    .forEach(row => console.log(row.join(' ')))
}



// MODEL

function initModel(n) {
  return {
    board: initBoard(n),
    player: 'X',
    score: initScore(n),
    winner: null,
    error: null,
    stalemate: false
  }
}

function initScore(n) {
  return {
    horizontal: new Array(n).fill(0),
    vertical: new Array(n).fill(0),
    diagonal: [0, 0]
  }
}

function initBoard(n) {
  return new Array(n).fill(new Array(n).fill('·'))
}



// UPDATE

function updateModel([x, y], { board, player, score, winner, stalemate }) {
  const error = updateError([x, y], board)
  if (error) {
    return { board, player, score, winner, error }
  } else {
    const updatedScore = updateScore([x, y], board.length, player, score)
    const updatedBoard = updateBoard([x, y], player, board)
    return {
      board: updateBoard([x, y], player, board),
      player: updatePlayer(player),
      score: updatedScore,
      winner: updateWinner(updatedScore, board.length),
      error: null,
      stalemate: updateStalemate(updatedBoard)
    }
  }
}

// BOARD

function updateBoard([x, y], player, board) {
  return board.map((row, idx) => (
    idx === (board.length - y) ? updateRow(x, player, row) : row
  ))
}

function updateRow(x, player, row) {
  return row.map((v, idx) => (idx === x - 1 ? player : v))
}

// PLAYER

function updatePlayer(player) {
  return player === 'X' ? 'O' : 'X'
}

// SCORE

function updateScore([x, y], size, player, {horizontal, vertical, diagonal}) {
  return {
    horizontal: updateDirectScore(y, changeValue(player), horizontal),
    vertical: updateDirectScore(x, changeValue(player), vertical),
    diagonal: updateDiagonalScore([x, y], size, changeValue(player), diagonal)
  }
}

function updateDirectScore(x, changeValue, direction) {
  return direction.map((v, idx) => (idx === x - 1 ? v + changeValue : v))
}

function updateDiagonalScore([x, y], size, changeValue, [a, b]) {
  const nextA = y == x ? a + changeValue : a
  const nextB = y == -x + size + 1 ? b + changeValue : b
  return [nextA, nextB]
}

function changeValue(player) {
  return player === 'X' ? 1 : -1
}

// WINNER

function updateWinner(score, size) {
  return Object.keys(score).reduce((acc, direction) => (
    acc || getDirectionWinner(score[direction], size)
  ), null)
}


function getDirectionWinner(direction, size) {
  return direction.reduce((acc, place) => {
    switch (true) {
      case acc !== null: return acc
      case size === place: return 'X'
      case size === -place: return 'O'
      default: return null
    }
  }, null)
}

// ERROR

function updateError([x, y], board) {
  switch (true) {
    case !(validInt(x) && validInt(y)):
    case !(onBoard(x, board.length) && onBoard(y, board.length)):
      return `Please enter two valid integers between 1 and ${board.length}.`
    case alreadyGuessed([x, y], board):
      return 'Someone has alread marked this square.'
    default:
      return null
  }
}

function validInt(n) {
  return parseInt(n, 10) == n
}

function onBoard(x, n) {
  return x > 0 && x <= n
}

function alreadyGuessed([x, y], board) {
  return board[board.length - y][x - 1] !== '·'
}

// Stalemate

function updateStalemate(board) {
  return board.reduce((acc1, row) =>
    row.reduce((acc2, square) => square !== '·' && acc2, true) && acc1
  , true)
}
