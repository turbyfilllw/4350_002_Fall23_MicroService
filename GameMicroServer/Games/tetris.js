/* 
 * Tetris
 * 
 * Base game created by straker on GitHub
 *  https://gist.github.com/straker/3c98304f8a6a9174efd8292800891ea1
 * 
 * Implemented by Richard Cashion and Dylan Cowell
 * 
 * Fall 2023, ETSU
 * 
 */

// https://tetris.fandom.com/wiki/Tetris_Guideline

// get a random integer between the range of [min,max]
// see https://stackoverflow.com/a/1527820/2124254

let score = 0; //Overall score variable'
let topScores = [];

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);

    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// generate a new tetromino sequence
// see https://tetris.fandom.com/wiki/Random_Generator
function generateSequence() {
    const sequence = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

    while (sequence.length) {
        const rand = getRandomInt(0, sequence.length - 1);
        const name = sequence.splice(rand, 1)[0];
        tetrominoSequence.push(name);
    }
}

// get the next tetromino in the sequence
function getNextTetromino() {
    if (tetrominoSequence.length === 0) {
        generateSequence();
    }

    const name = tetrominoSequence.pop();
    const matrix = tetrominos[name];

    // I and O start centered, all others start in left-middle
    const col = playfield[0].length / 2 - Math.ceil(matrix[0].length / 2);

    // I starts on row 21 (-1), all others start on row 22 (-2)
    const row = name === 'I' ? -1 : -2;

    return {
        name: name,      // name of the piece (L, O, etc.)
        matrix: matrix,  // the current rotation matrix
        row: row,        // current row (starts offscreen)
        col: col         // current col
    };
}

// rotate an NxN matrix 90deg
// see https://codereview.stackexchange.com/a/186834
function rotate(matrix) {
    const N = matrix.length - 1;
    const result = matrix.map((row, i) =>
        row.map((val, j) => matrix[N - j][i])
    );

    return result;
}

// check to see if the new matrix/row/col is valid
function isValidMove(matrix, cellRow, cellCol) {
    for (let row = 0; row < matrix.length; row++) {
        for (let col = 0; col < matrix[row].length; col++) {
            if (matrix[row][col] && (
                // outside the game bounds
                cellCol + col < 0 ||
                cellCol + col >= playfield[0].length ||
                cellRow + row >= playfield.length ||
                // collides with another piece
                playfield[cellRow + row][cellCol + col])
            ) {
                return false;
            }
        }
    }

    return true;
}

// place the tetromino on the playfield
function placeTetromino() {
    for (let row = 0; row < tetromino.matrix.length; row++) {
        for (let col = 0; col < tetromino.matrix[row].length; col++) {
            if (tetromino.matrix[row][col]) {

                // game over if piece has any part offscreen
                if (tetromino.row + row < 0) {
                    return showGameOver();
                }

                playfield[tetromino.row + row][tetromino.col + col] = tetromino.name;
            }
        }
    }

    lineCount = 0; //Counts the number of lines cleared for the current tetronimo

    // check for line clears starting from the bottom and working our way up
    for (let row = playfield.length - 1; row >= 0;) {
        if (playfield[row].every(cell => !!cell)) {

            lineCount++; //Increase the number of cleared lines by one
            // drop every row above this one
            for (let r = row; r >= 0; r--) {
                for (let c = 0; c < playfield[r].length; c++) {
                    playfield[r][c] = playfield[r - 1][c];
                }
            }
        }
        else {
            row--;
        }
    }

    //Increases the score based on the number of lines cleared
    switch (lineCount) {
        case 1:
            score = score + 40;
            break;
        case 2:
            score = score + 100;
            break;
        case 3:
            score = score + 300;
            break;
        case 4:
            score = score + 1200;
            break;
    }

    tetromino = getNextTetromino();
}

// show the game over screen
// Modify showGameOver function to update the leaderboard
function showGameOver() {
    cancelAnimationFrame(rAF);
    gameOver = true;
    const ctx = document.getElementById('game').getContext('2d');
    ctx.fillStyle = "#FFFFFF"; // Text color
    ctx.fillStyle = "#FF0000"; // Button color
    ctx.font = "30px Arial";

    context.fillStyle = 'black';
    context.globalAlpha = 0.75;
    context.fillRect(0, canvas.height / 2 - 30, canvas.width, 60);
    ctx.fillRect(0, canvas.height / 2 - 30, canvas.width, 60); // Button position and size

    context.globalAlpha = 1;
    context.fillStyle = 'white';
    context.font = '20px monospace';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('GAME OVER! Score: ' + score, canvas.width / 2, canvas.height / 2);


    //calling send score function at end of game 
    console.log("game is over with score =" + score)
    var finalScore = score
    sendScore(finalScore)

}

// function to send score to the server via API 
// using fetch to send a POST request to the server
function sendScore(score) {
    fetch('/Games/SaveScore', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ score: score })
    })
        //.then(response => response.json())
        .then(response => {
            if (response.ok) {
                console.log('Score saved successfully');
            } else {
                console.error('Error saving score:', response.statusText);
            }
        })
        .catch((error) => {
            console.error('Error:', error);
        });

    checkForHighScore(score); // Check if the score qualifies for the leaderboard

    drawLeaderboard();
}

// Function to handle user input for name and save score
function saveScore(score) {
    const name = prompt('Congratulations! Enter your name (3 letters):');
    if (name && name.length === 3) {
        topScores.push({ name: name.toUpperCase(), score: score });
        topScores.sort((a, b) => b.score - a.score); // Sort scores in descending order
        topScores = topScores.slice(0, 10); // Keep only the top 10 scores
    } else {
        alert('Invalid name. Please enter exactly 3 letters.');
    }
}



// Updated drawLeaderboard function
function drawLeaderboard() {
    context.clearRect(0, canvas.height / 2 + 30, canvas.width, 180);

    context.fillStyle = 'black';
    context.font = '15px monospace';
    context.textAlign = 'center';
    context.textBaseline = 'top';
    context.fillText('LEADERBOARD', canvas.width / 2, canvas.height / 2 + 35); // Centered leaderboard title

    const x = canvas.width / 2 - 90; // Adjusted x-coordinate for leaderboard entries
    const y = canvas.height / 2 + 60;

    for (let i = 0; i < topScores.length; i++) {
        const { name, score } = topScores[i];

        context.fillText(`${i + 1}. ${name}`, x, y + 20 * i);
        context.fillText(`Score: ${score}`, x + 150, y + 20 * i); // Adjusted x-coordinate for score display
    }
}

function checkForHighScore(score) {
    if (topScores.length < 10 || score > topScores[topScores.length - 1].score) {
        saveScore(score);
    }
}


// draws the score while the game is playing
function drawScore() {
    context.fillStyle = 'black';
    context.font = '20px monospace';
    context.textAlign = 'left';
    context.textBaseline = 'top';
    context.fillText('Score: ' + Math.floor(score), 10, 10);
}

const canvas = document.getElementById('game');
const context = canvas.getContext('2d');
const grid = 32;
const tetrominoSequence = [];

// keep track of what is in every cell of the game using a 2d array
// tetris playfield is 10x20, with a few rows offscreen
const playfield = [];

// populate the empty state
for (let row = -2; row < 20; row++) {
    playfield[row] = [];

    for (let col = 0; col < 10; col++) {
        playfield[row][col] = 0;
    }
}

// how to draw each tetromino
// see https://tetris.fandom.com/wiki/SRS
const tetrominos = {
    'I': [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    'J': [
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0],
    ],
    'L': [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0],
    ],
    'O': [
        [1, 1],
        [1, 1],
    ],
    'S': [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0],
    ],
    'Z': [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0],
    ],
    'T': [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0],
    ]
};

// color of each tetromino
const colors = {
    'I': 'cyan',
    'O': 'yellow',
    'T': 'purple',
    'S': 'green',
    'Z': 'red',
    'J': 'blue',
    'L': 'orange'
};

let count = 0;
let tetromino = getNextTetromino();
let rAF = null;  // keep track of the animation frame so we can cancel it
let gameOver = false;

// game loop
function loop() {
    rAF = requestAnimationFrame(loop);
    context.clearRect(0, 0, canvas.width, canvas.height);

    // draw the playfield
    for (let row = 0; row < 20; row++) {
        for (let col = 0; col < 10; col++) {
            if (playfield[row][col]) {
                const name = playfield[row][col];
                context.fillStyle = colors[name];

                // drawing 1 px smaller than the grid creates a grid effect
                context.fillRect(col * grid, row * grid, grid - 1, grid - 1);
            }
        }
    }

    // draw the active tetromino
    if (tetromino) {

        // tetromino falls every 35 frames
        if (++count > 35) {
            tetromino.row++;
            count = 0;

            // place piece if it runs into anything
            if (!isValidMove(tetromino.matrix, tetromino.row, tetromino.col)) {
                tetromino.row--;
                placeTetromino();
            }
        }

        context.fillStyle = colors[tetromino.name];

        for (let row = 0; row < tetromino.matrix.length; row++) {
            for (let col = 0; col < tetromino.matrix[row].length; col++) {
                if (tetromino.matrix[row][col]) {

                    // drawing 1 px smaller than the grid creates a grid effect
                    context.fillRect((tetromino.col + col) * grid, (tetromino.row + row) * grid, grid - 1, grid - 1);
                }
            }
        }
    }

    // draw the score at the top
    drawScore();
}

// listen to keyboard events to move the active tetromino
document.addEventListener('keydown', function (e) {
    if (gameOver) return;

    // left and right arrow keys (move)
    if (e.which === 37 || e.which === 39) {
        const col = e.which === 37
            ? tetromino.col - 1
            : tetromino.col + 1;

        if (isValidMove(tetromino.matrix, tetromino.row, col)) {
            tetromino.col = col;
        }
    }

    // up arrow key (rotate)
    if (e.which === 38) {
        e.preventDefault(); // prevents the "default" action from happening, in this case, scrolling down.
        const matrix = rotate(tetromino.matrix);
        if (isValidMove(matrix, tetromino.row, tetromino.col)) {
            tetromino.matrix = matrix;
        }
    }

    // spacebar(instant drop)
    if (e.which == 32) {
        e.preventDefault(); // prevents the "default" action from happening, in this case, scrolling down.
        let row = tetromino.row;
        while (isValidMove(tetromino.matrix, row + 1, tetromino.col)) {
            row++;
        }
        tetromino.row = row;
        placeTetromino();
    }

    // down arrow key (drop)
    if (e.which === 40) {
        e.preventDefault(); // prevents the "default" action from happening, in this case, scrolling down.
        const row = tetromino.row + 1;
        if (!isValidMove(tetromino.matrix, row, tetromino.col)) {
            tetromino.row = row - 1;

            placeTetromino();
            return;
        }

        tetromino.row = row;
    }
});

// start the game
document.getElementById('game').addEventListener('click', function(event) {
    const rect = this.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Check if the click was within the button's area
    if (x >= 100 && x <= 220 && y >= 200 && y <= 260) {
        // The button was clicked, refresh the page
        location.reload();
    }
});
rAF = requestAnimationFrame(loop);