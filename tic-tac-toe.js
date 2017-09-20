// TIC-TAC-TOE



// IO

const rl = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  })

console.log('TIC-TAC-TOE\n\n')

start()

function start() {
  return getBoardSize()
    .then(size => play(initModel(size)))
    .then(model => restartOrExit(model))
}

function getBoardSize() {
  return new Promise((resolve) => {
    rl.question('\nWhat size board would you like to play with?\n', (answer) => {
      const size = parseInt(answer, 10)
      if (!isNaN(size) && size == answer && size > 0) {
        resolve(size)
      } else {
        console.log('\nPlease enter a positive integer.\n')
        resolve(getBoardSize())
      }
    })
  })
}

function play(model) {
  return new Promise((resolve) => {
    console.log(`\n${model.player}'s turn`)

    rl.question(`\nPick your x coordinate (1 - ${model.board.length})\n`, x => {
      rl.question(`\nPick your y coordinate (1 - ${model.board.length})\n`, y => {

        const nextModel = updateModel([x, y], model)
        drawBoard(nextModel.board)

        if (nextModel.winner || nextModel.stalemate) {
          resolve(nextModel)
        } else {
          if (nextModel.error) console.log('\n' + nextModel.error)
          resolve(play(nextModel))
        }

      })
    })

  })
}

function drawBoard(board) {
  '\n' + board.forEach(row => console.log(row.join(' ')))
}

function restartOrExit({ winner, stalemate }) {
  return new Promise(resolve => {
    if (winner) console.log(`\n${winner} wins!\n`)
    else console.log('\nStalemate! Nobody wins!\n')

    rl.question('Would you like to play again?\n', (answer) => {
      if (['', 'y', 'yes', 'sure', '1'].includes(answer.toLowerCase())) {
        resolve(start())
      } else {
        console.log('\nGoodbye!\n')
        rl.close()
        resolve()
      }
    })

  })
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
  return new Array(n).fill(new Array(n).fill('_'))
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
  return board[board.length - y][x - 1] !== '_'
}

// Stalemate

function updateStalemate(board) {
  return board.reduce((acc1, row) =>
    row.reduce((acc2, square) => square !== '_' && acc2, true) && acc1
  , true)
}
