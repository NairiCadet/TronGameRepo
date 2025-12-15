const canvas = document.querySelector("#game");
const context = canvas.getContext("2d");

// Object to handle the grid and drawing
class Arena {
  constructor(tileSize, gridSize) {
    this.tileSize = tileSize;
    this.gridSize = gridSize;
    this.grid = [];
  }

  // Fills the grid with tiles
  fillGrid(updateCanvas, createBorderWalls = true) {
    let xPos, yPos;

    for (xPos = 0; xPos < this.gridSize; xPos++) {
      for (yPos = 0; yPos < this.gridSize; yPos++) {
        if (createBorderWalls && this.isBorder(xPos, yPos)) {
          this.grid.push(new Tile(xPos, yPos, "Wall", "rgb(0 0 0)"));
        } else {
          this.grid.push(new Tile(xPos, yPos, "Empty", "rgb(222 222 222)"));
        }
      }
    }

    if (updateCanvas) {
      this.updateCanvasSize();
    }
  }

  // Make sure the canvas (drawing area) is the right size
  updateCanvasSize() {
    canvas.width = this.gridSize * this.tileSize;
    canvas.height = this.gridSize * this.tileSize;
  }

  // Check if a position is on the very edge of the board
  isBorder(x, y) {
    if (
      x == 0 ||    // Left edge
      y == 0 ||    // Top edge
      x == this.gridSize - 1 ||   //Right edge
      y == this.gridSize - 1 ||  //Bottom edge
      (x == this.gridSize - 1 && y == this.gridSize - 1) //Corner
    ) {
      return true;
    }

    return false;
  }

  // Draw the whole game or an array of tiles to update
  drawArena(tilesArray = this.grid) {
    let currentTile = 0;
    // Go through each tile and draw it
    for (currentTile; currentTile < tilesArray.length; currentTile++) {

     // What should we draw? Check what's in this square
      switch (tilesArray[currentTile].content) {
        case "Wall":
          context.fillStyle = tilesArray[currentTile].color;

          context.fillRect(
            tilesArray[currentTile].x * this.tileSize,
            tilesArray[currentTile].y * this.tileSize,
            this.tileSize,
            this.tileSize
          );
          break;

        case "Empty":
          context.fillStyle = tilesArray[currentTile].color;

          context.fillRect(
            tilesArray[currentTile].x * this.tileSize,
            tilesArray[currentTile].y * this.tileSize,
            this.tileSize,
            this.tileSize
          );
          break;

        case "Player":
          context.fillStyle = tilesArray[currentTile].linkedPlayer.color;
          context.fillRect(
            tilesArray[currentTile].x * this.tileSize,
            tilesArray[currentTile].y * this.tileSize,
            this.tileSize,
            this.tileSize
          );
      }
      //Draw black lines around each square
      context.strokeStyle = "black";
      context.rect(
        tilesArray[currentTile].x * this.tileSize,
        tilesArray[currentTile].y * this.tileSize,
        this.tileSize,
        this.tileSize
      );
      context.stroke();
    }
  }

  // Get moves next to a given position if they are inside the grid

  //This tells you: "Which squares can I move to?"
  getLegalMoves(x, y, returnCollision = true) {
  // Try moving in 4 directions: right, left, down, up
    let possibleMoves = [
      [x + 1, y], // Move right
      [x - 1, y], // Move left
      [x, y + 1], // Move down
      [x, y - 1], // Move up
    ];

    let currentMove = 0;
    let legalMoves = []; // List of moves we CAN actually do
    let isCollision = false;

    // Check each possible move
    for (currentMove; currentMove < possibleMoves.length; currentMove++) {

      // Is this move inside the board? (not off the edge)
      if (
        this.isValidMove(
          possibleMoves[currentMove][0],
          possibleMoves[currentMove][1]
        )
      ) {
        // Will this move make us crash into a wall?
        isCollision = this.checkCollision(
          possibleMoves[currentMove][0],
          possibleMoves[currentMove][1],
          true
        );
         // Add this move to our list of legal moves
        if (returnCollision || (!isCollision && !returnCollision)) {
          legalMoves.push({
            xMove: possibleMoves[currentMove][0], // X position
            yMove: possibleMoves[currentMove][1], // Y position
            collision: isCollision,
          });
        }
      }
    }

    return legalMoves; // Give back the list of moves we can make
  }

  // Get a line from a pos and a dir, returning the max tile and line length
  // Useful for seeing "how far can I go in this direction?"

  getLineSize(x, y, dir) {
    let lineSize = 0;
    let currentX = x;
    let currentY = y;

    currentX += dir[0];
    currentY += dir[1];
    lineSize++;

    // Keep going until we hit a wall
    while (
      this.isValidMove(currentX, currentY) &&
      this.checkCollision(currentX, currentY) == false
    ) {
      currentX += dir[0];
      currentY += dir[1];
      lineSize++;
    }

    return {
      maxX: currentX,  // Where we stopped (X)
      maxY: currentY,  // Where we stopped (Y)
      lineSize: lineSize,  // How far we got
    };
  }

  // Takes two pos and returns a direction that can be used as a set of [x, y] modifiers
  // Figure out which direction to go to get from one spot to another
  getMoveDirection(x, y, xMove, yMove) {
    return [Math.sign(xMove - x), Math.sign(yMove - y)];
  }

  // Get how many tiles are available after a movement
  // This counts: "If I move here, how many squares can I reach after?"
  // More squares = more room to survive = WE GUCCI!
  getAvailableTilesNumber(x, y) {
    let totalMoves = [];
    let newMoves = this.getLegalMoves(x, y, false);
    let isNewMove = true;
    let foundMoves = [];
    let currentMove = 0;
    let currentTotalMove = 0;

    // Keep exploring! Like a flood fill algorithm (like we're in Nemo)
    while (newMoves.length > 0) {
      // From the first new move, find MORE moves cause it ain't enough
      foundMoves = this.getLegalMoves(
        newMoves[0].xMove,
        newMoves[0].yMove,
        false
      );
      newMoves.splice(0, 1); // Remove the first move (we just checked it)

      // Add new moves we haven't seen before
      for (currentMove = 0; currentMove < foundMoves.length; currentMove++) {
        isNewMove = true;

        // Have we already found this square?
        for (
          currentTotalMove = 0;
          currentTotalMove < totalMoves.length;
          currentTotalMove++
        ) {
          if (
            foundMoves[currentMove].xMove ==
              totalMoves[currentTotalMove].xMove &&
            foundMoves[currentMove].yMove == totalMoves[currentTotalMove].yMove
          ) {
            isNewMove = false;   // We already found this one!
            break;
          }
        }

        // If it's new, add it to our lists
        if (isNewMove) {
          totalMoves.push(foundMoves[currentMove]);
          newMoves.push(foundMoves[currentMove]);
        }
      }
    }

    return totalMoves.length; // How many squares total can we reach?
  }

  // Check if a set of coordinate is valid to play (a collision is valid, but being out of the grid isnt for example)
  isValidMove(x, y) {
    if (
      x * this.gridSize + y >= this.gridSize * this.gridSize ||
      x * this.gridSize + y < 0
    ) {
      return false; // Off the board!
    }
    return true; // We are good (reminder it's an actual value)
  }

  // Check if the current tile will result in a collision with a wall or a player
  checkCollision(x, y, getCollisionType = false) {
    if (
      this.grid[x * this.gridSize + y].content == "Wall" ||
      this.grid[x * this.gridSize + y].content == "Player"
    ) {
      if (getCollisionType) {
        return this.grid[x * this.gridSize + y].content;
      }

      return true;
    }

    return false;
  }

  // Get the distance from a tile to another
  distanceTo(x, y, xTarget, yTarget) {
    let distanceTo = x + y - (xTarget + yTarget);

    return Math.abs(distanceTo);
  }
}

// A Tile is just one square on the board
class Tile {
  // Eligible content types are: Empty, Wall, Player
  // Colors format should be a string color code, ex: "rbg(xxx, xxx, xxx)"
  constructor(x, y, content, color) {
    this.x = x; // X position
    this.y = y; // Y position
    this.content = content;  // What's here? "Empty", "Wall", or "Player"
    this.color = color; //What color should it be?
    this.linkedPlayer = undefined; 
    
  }
}

class Bike {
  constructor(x, y, boost, maxBoost, color, wallColor) {
    this.x = x;  // Current X position
    this.y = y;  // Current Y position
    this.boost = boost; // Speed boost (not used in basic version)
    this.maxBoost = maxBoost; // Max boost
    this.color = color; // Player color
    this.wallColor = wallColor; // Color of walls we leave behind
  }

  // Initial placement for the cycles, used at the start of a game
  placeBike(x, y, arena) {
    arena.grid[this.x * arena.gridSize + this.y].content = "Player";
    arena.grid[this.x * arena.gridSize + this.y].linkedPlayer = this;
    arena.grid[this.x * arena.gridSize + this.y].color = this.wallColor;
  }

  // Only approved way to move your cycle during a turn
  // Move the bike to a new position
  moveBike(x, y, arena, game) {
    // Check if the move is valid
    if (!arena.isValidMove(x, y)) {
      game.endGame(true);
      return;
    }
    // Check if we're trying to move too far
    if (arena.distanceTo(this.x, this.y, x, y) > 1) {
      console.log("Invalid move, tried to move to a too far away tile");
      game.endGame(true);
      return;
    }

    let isCollision = arena.checkCollision(x, y);

    // Stop the game if a collision is detected
    if (isCollision) {
      game.endGame();
      return;
    }

    arena.grid[this.x * arena.gridSize + this.y].content = "Wall";
    arena.grid[x * arena.gridSize + y].content = "Player";
    arena.grid[x * arena.gridSize + y].linkedPlayer = this;
    arena.grid[x * arena.gridSize + y].color = this.wallColor;
    arena.drawArena([
      arena.grid[this.x * arena.gridSize + this.y],
      arena.grid[x * arena.gridSize + y],
    ]);

    this.x = x;
    this.y = y;

    game.changePlayer();
  }
}

class Game {
  constructor(player1, player2, currentPlayer) {
    this.player1 = player1;
    this.player2 = player2;
    this.currentPlayer = currentPlayer;
    this.winner = undefined;
    this.turn = 1;
    this.isOver = false;
  }

  // Switch the player currently playing
  changePlayer() {
    if (this.currentPlayer == this.player1) {
      this.currentPlayer = this.player2;
    } else {
      this.currentPlayer = this.player1;
    }
    this.turn++;
  }

  // Get the player who isn't playing
  getOtherPlayer() {
    if (this.currentPlayer == this.player1) {
      return this.player2;
    } else {
      return this.player1;
    }
  }

  // End the game and show scores
  endGame(isCrash = false) {
    let winner = this.getOtherPlayer();
    console.log(winner.name + " has won !");
    console.log("It took " + this.turn + " turns to achieve victory");
    if (isCrash) {
      console.log(
        "Victory was obtained because" +
          currentPlayer.name +
          " crashed the game (ex: invalid move)"
      );
    }

    this.isOver = true;
  }
}

class botNairi {
  constructor(name, linkedBike) {
    this.name = name;
    this.linkedBike = linkedBike; // Which bike does this bot control?
  }

    // This function decides: "Where should I move?"
    getMove(arena, game) {

    // STEP 1: Get all the moves we CAN make
    let legalMoves = arena.getLegalMoves(this.linkedBike.x, this.linkedBike.y);
    let safeMoves = [];  // Moves that won't make us crash
    let bestMoves = [];  // The best moves (to get hhighest score)
    let randomMove = []; // The final move we'll pick (last round)
    let currentMove = 0;

    let points = 0;       // Score for current move
    let bestPoints = -1; // Best score we've found so far?


    /*This is a 20x20 grid of numbers (same size as game board)
     Higher numbers = better positions
    The edges get score 9 (GOOD!)
    The center gets score 1 (not as good)
    The very edge walls get 0 (can't go there)
    */

    let matrix = [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9, 9, 9, 9,
      9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 0, 0, 9, 8, 8, 8, 8, 8, 8, 8, 8,
      8, 8, 8, 8, 8, 8, 8, 8, 9, 0, 0, 9, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
      7, 7, 7, 9, 0, 0, 9, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 9, 0,
      0, 9, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 9, 0, 0, 9, 4, 4, 4,
      4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 9, 0, 0, 9, 3, 3, 3, 3, 3, 3, 3, 3,
      3, 3, 3, 3, 3, 3, 3, 3, 9, 0, 0, 9, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
      2, 2, 2, 9, 0, 0, 9, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 9, 0,
      0, 9, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 9, 0, 0, 9, 2, 2, 2,
      2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 9, 0, 0, 9, 3, 3, 3, 3, 3, 3, 3, 3,
      3, 3, 3, 3, 3, 3, 3, 3, 9, 0, 0, 9, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
      4, 4, 4, 9, 0, 0, 9, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 9, 0,
      0, 9, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 9, 0, 0, 9, 7, 7, 7,
      7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 9, 0, 0, 9, 8, 8, 8, 8, 8, 8, 8, 8,
      8, 8, 8, 8, 8, 8, 8, 8, 9, 0, 0, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9,
      9, 9, 9, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ];

    

    for (currentMove; currentMove < legalMoves.length; currentMove++) {
      if (legalMoves[currentMove].collision == false) {
        safeMoves.push(legalMoves[currentMove]); // Only keep safe moves
      }
    }
     // We want to find the move with the HIGHEST score
    for (currentMove = 0; currentMove < safeMoves.length; currentMove++) {
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

      if (points > bestPoints) {
        bestPoints = points;
        bestMoves = [safeMoves[currentMove]];
      } else if (points == bestPoints) {
        bestMoves.push(safeMoves[currentMove]);
      }
    }

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



