

class botNairi {
  constructor(name, linkedBike) {
    this.name = name;
    this.linkedBike = linkedBike; // Which bike does this bot control?
  }

    // This function decides: "Where should I move?"
    getMove(arena, game) {

    // Get all the moves we CAN make
    let legalMoves = arena.getLegalMoves(this.linkedBike.x, this.linkedBike.y);
    let safeMoves = [];  // Moves that won't make us crash
    let bestMoves = [];  // The best moves (to get hhighest score)
    let randomMove = []; // The final move we'll pick (last round)
    let currentMove = 0;

    let points = 0;       // Score for current move
    let bestPoints = -1; // Best score we've found so far?


    /*Noticing previous matric not smooth enough, weird jumps. New matrix = smoother values.
    */

    let matrix = [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 0,
      0, 9, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 9, 0,
      0, 9, 8, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 8, 9, 0,
      0, 9, 8, 7, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7, 8, 9, 0,
      0, 9, 8, 7, 6, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 6, 7, 8, 9, 0,
      0, 9, 8, 7, 6, 5, 4, 4, 4, 4, 4, 4, 4, 4, 5, 6, 7, 8, 9, 0,
      0, 9, 8, 7, 6, 5, 4, 3, 3, 3, 3, 3, 3, 4, 5, 6, 7, 8, 9, 0,
      0, 9, 8, 7, 6, 5, 4, 3, 2, 2, 2, 2, 3, 4, 5, 6, 7, 8, 9, 0,
      0, 9, 8, 7, 6, 5, 4, 3, 2, 1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0,
      0, 9, 8, 7, 6, 5, 4, 3, 2, 1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0,
      0, 9, 8, 7, 6, 5, 4, 3, 2, 2, 2, 2, 3, 4, 5, 6, 7, 8, 9, 0,
      0, 9, 8, 7, 6, 5, 4, 3, 3, 3, 3, 3, 3, 4, 5, 6, 7, 8, 9, 0,
      0, 9, 8, 7, 6, 5, 4, 4, 4, 4, 4, 4, 4, 4, 5, 6, 7, 8, 9, 0,
      0, 9, 8, 7, 6, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 6, 7, 8, 9, 0,
      0, 9, 8, 7, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7, 8, 9, 0,
      0, 9, 8, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 8, 9, 0,
      0, 9, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 9, 0,
      0, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ];

    
     // Filter out moves that would crash us
    for (currentMove; currentMove < legalMoves.length; currentMove++) {
      if (legalMoves[currentMove].collision == false) {
        safeMoves.push(legalMoves[currentMove]); // Only keep safe moves
      }
    }

     // Score each safe move
    for (currentMove = 0; currentMove < safeMoves.length; currentMove++) {
      // Calculate score: available space + matrix bonus
      points =
        arena.getAvailableTilesNumber(
          safeMoves[currentMove].xMove,
          safeMoves[currentMove].yMove
        ) +
        matrix[
          safeMoves[currentMove].yMove * arena.gridSize +
            safeMoves[currentMove].xMove
        ];
      if (game.turn == 1) {
        console.log(
          safeMoves[currentMove].yMove * arena.gridSize +
            safeMoves[currentMove].xMove
        );
        console.log(
          matrix[
            safeMoves[currentMove].yMove * arena.gridSize +
              safeMoves[currentMove].xMove
          ]
        );
      }

      // This helps to keep track of best moves
      if (points > bestPoints) {
        bestPoints = points;
        bestMoves = [safeMoves[currentMove]];
      } else if (points == bestPoints) {
        bestMoves.push(safeMoves[currentMove]);
      }
    }
    
    // This is to pick the move
    if (bestMoves.length == 0) {
      randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
    } else {
      randomMove = bestMoves[Math.floor(Math.random() * bestMoves.length)];
    }

    return [randomMove.xMove, randomMove.yMove];
  }
}

// Game Initialisation
currentArena = new Arena(30, 20);
currentArena.fillGrid(true);

player1 = new Bike(1, 1, 3, 3, "rgb(15, 28, 125)", "rgb(29, 10, 82)");
player2 = new Bike(
  currentArena.gridSize - 2,
  currentArena.gridSize - 2,
  3,
  3,
  "rgb(161, 18, 32)",
  "rgb(110, 19, 44)"
);

player1.placeBike(player1.x, player1.y, currentArena);
player2.placeBike(player2.x, player2.y, currentArena);

botNairi1 = new botNairi("Blue", player1);
botNairi2 = new botNairi("Red", player2);

currentArena.drawArena();

// Game Loop
currentGame = new Game(botNairi1, botNairi2, botNairi1);

function gameLoop() {
  if (!currentGame.isOver) {
    let moveCoordinates = [];
    moveCoordinates = currentGame.currentPlayer.getMove(
      currentArena,
      currentGame
    );

    currentGame.currentPlayer.linkedBike.moveBike(
      moveCoordinates[0],
      moveCoordinates[1],
      currentArena,
      currentGame
    );
  }
  window.requestAnimationFrame(gameLoop);
}

gameLoop();



