// TODO: Generate actual paths and not just random tiles
// TODO: Prevent non-relevant tiles from being highlighted once a path is complete
// TODO: Randomize endpoint orientation

// This constant represents the margin between two tiles.
const MARGIN = 2;

// In this enumeration the possible directions in which connections can go are stored.
// CENTER is used for connecting endpoints to other tiles.
const DIRECTION = {
    TOP: 1,
    RIGHT: 2,
    BOTTOM: 3,
    LEFT: 4,
    CENTER: 5
}

// This is the entry point for our game.
window.onload = function() {
    var canvas = document.getElementById('game-canvas');
    if(!canvas.getContext) {
        return;
    }

    var game = new Game(canvas);
    game.start();

    // When the restart link is clicked we restart the game.
    document.getElementById('restart-link').onclick = function(event) {
        game.start();
    }

    canvas.onclick = function(event) {
        event.preventDefault();
        game.onclick({ x: event.offsetX, y: event.offsetY});
    }

    window.onresize = function(event) {
        game.onresize();
    }
}

// This class represents the game logic.
function Game(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.running = false;
    this.boardWidth;
    this.boardHeight;
    this.tileSize;

    // To start a game we generate a new board based on the user's input and display it.
    this.start = function() {
        if(!this.validateUserInput()) {
            return;
        }
        this.boardWidth = document.getElementById('input-width').value;
        this.boardHeight = document.getElementById('input-height').value;
        this.calculateDimensions();
        this.generateBoard();
        this.update();
        this.draw();
        this.running = true;
        document.getElementById('status-message').style.display = 'block';
        document.getElementById('success-message').style.display = 'none';
    }

    // Here we resize the canvas to match its parent div's dimensions. After that the new tile size is calculated.
    this.calculateDimensions = function() {
        this.canvas.width = this.canvas.parentNode.clientWidth;
        this.tileSize = Math.floor((this.canvas.width - MARGIN) / this.boardWidth) - MARGIN;
        this.canvas.width = MARGIN + (this.boardWidth * (this.tileSize + MARGIN));
        this.canvas.height = MARGIN + (this.boardHeight * (this.tileSize + MARGIN));
    }

    // Here we generate a new board. This function leaves much to desire.
    this.generateBoard = function() {
        this.board = [];
        for(var x = 0; x < this.boardWidth; x++) {
            this.board[x] = [];
            for(var y = 0; y < this.boardHeight; y++) {
                // We want zero to three connections per tile with 40% probability for one, 30% for two, 20% for three and 10% for none at all.
                var rand = Math.random();
                var count;
                if(rand > 0.6) {
                    count = 1;
                } else if(rand > 0.3) {
                    count = 2;
                } else if(rand > 0.1) {
                    count = 3;
                } else {
                    count = 0;
                }
                var connections = [];
                for(var i = 0; i < count; i++) {
                    rand = Math.random();
                    var connection;
                    if(rand > 0.88) {
                        connection = new Connection(DIRECTION.TOP, DIRECTION.RIGHT);
                    } else if(rand > 0.66) {
                        connection = new Connection(DIRECTION.RIGHT, DIRECTION.BOTTOM);
                    } else if(rand > 0.44) {
                        connection = new Connection(DIRECTION.BOTTOM, DIRECTION.LEFT);
                    } else if(rand > 0.22) {
                        connection = new Connection(DIRECTION.LEFT, DIRECTION.TOP);
                    } else {
                        connection = new Connection(DIRECTION.TOP, DIRECTION.BOTTOM);
                    }

                    // Check if an equal connection already exists so we don't add it again.
                    var alreadyExists = false;
                    for(var j = 0; j < connections.length; j++) {
                        if(connections[j].equals(connection)) {
                            alreadyExists = true;
                        }
                    }

                    if(!alreadyExists) {
                        connections.push(connection);
                    }

                }
                this.board[x][y] = new Tile(x, y, connections);
            }
        }

        // Choose random endpoints.
        var endpointCount = document.getElementById('input-endpoints').value;
        for(var i = 0; i < endpointCount; i++) {
            var x = Math.floor(Math.random() * this.boardWidth);
            var y = Math.floor(Math.random() * this.boardHeight);

            if(this.board[x][y].isEndpoint()) {
                i--;
                continue;
            }

            this.board[x][y].connections = [new Connection(DIRECTION.CENTER, DIRECTION.RIGHT)];
        }

        document.getElementById('path-counter-max').innerText = endpointCount / 2;
    }

    // This function updates the board by resetting all statuses and calling followPath for all endpoints.
    this.update = function() {
        // This function uses recursion to traverse a path from one endpoint to another, if possible.
        // We also update the statuses of all visited tiles, depending on the completeness of the path.
        this.followPath = function(tile, lastDirection, alreadyVisited = []) {
            // This function returns the opposite of the given direction.
            this.getOppositeDirection = function(direction) {
                var opposites = [];
                opposites[DIRECTION.TOP] = DIRECTION.BOTTOM;
                opposites[DIRECTION.RIGHT] = DIRECTION.LEFT;
                opposites[DIRECTION.BOTTOM] = DIRECTION.TOP;
                opposites[DIRECTION.LEFT] = DIRECTION.RIGHT;
                return opposites[direction];
            }

            // We need to check if this tile has already been visited to prevent endless loops.
            if(alreadyVisited.indexOf(tile) !== -1) {
                return false;
            }

            alreadyVisited.push(tile);
            for(var i = 0; i < tile.connections.length; i++) {
                var connection = tile.connections[i];
                var newDirection;
                if(connection.start === lastDirection) {
                    newDirection = connection.end;
                } else if(connection.end === lastDirection) {
                    newDirection = connection.start;
                } else {
                    continue;
                }

                var newX = tile.x;
                var newY = tile.y;
                switch(newDirection) {
                    case DIRECTION.TOP:
                        newY--;
                        break;
                    case DIRECTION.RIGHT:
                        newX++;
                        break;
                    case DIRECTION.BOTTOM:
                        newY++;
                        break;
                    case DIRECTION.LEFT:
                        newX--;
                        break;
                    case DIRECTION.CENTER:
                        console.log(tile);
                        connection.isPartOfPath = true;
                        return tile;
                }

                if(newX >= 0 && newX < this.boardWidth && newY >= 0 && newY < this.boardHeight) {
                    var endpoint = this.followPath(this.board[newX][newY], this.getOppositeDirection(newDirection), alreadyVisited);
                    if(endpoint) {
                        console.log(tile);
                        connection.isPartOfPath = true;
                        return endpoint;
                    }
                }
            }

            return false;
        }

        var endpoints = [];
        for(var x = 0; x < this.board.length; x++) {
            for(var y = 0; y < this.board[x].length; y++) {
                for(var i = 0; i < this.board[x][y].connections.length; i++) {
                    this.board[x][y].connections[i].isPartOfPath = false;
                }
                if(this.board[x][y].isEndpoint()) {
                    endpoints.push(this.board[x][y]);
                }
            }
        }
        var checkedEndpoints = [];
        for(var i = 0; i < endpoints.length; i++) {
            if(checkedEndpoints.indexOf(endpoints[i]) === -1) {
                var endpoint = this.followPath(endpoints[i], DIRECTION.CENTER);
                if(endpoint) {
                    checkedEndpoints.push(endpoint);
                }
            }
        }
        document.getElementById('path-counter-current').innerText = checkedEndpoints.length;
        if(checkedEndpoints.length === endpoints.length / 2) {
            this.running = false;
            document.getElementById('status-message').style.display = 'none';
            document.getElementById('success-message').style.display = 'block';
        }
    }

    // This function draws the board with much room for improvements.
    this.draw = function() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for(var x = 0; x < this.board.length; x++) {
            for(var y = 0; y < this.board[x].length; y++) {
                var horizontalOffset = MARGIN + (x * (this.tileSize + MARGIN));
                var verticalOffset = MARGIN + (y * (this.tileSize + MARGIN));

                if(this.board[x][y].isObstacle()) {
                    this.context.fillStyle = '#ff8d63';
                } else {
                    this.context.fillStyle = '#ffffff';
                }

                this.context.fillRect(
                    horizontalOffset,
                    verticalOffset,
                    this.tileSize,
                    this.tileSize
                );
                
                for(var i = 0; i < this.board[x][y].connections.length; i++) {
                    var connection = this.board[x][y].connections[i];

                    if(connection.isPartOfPath) {
                        this.context.strokeStyle = '#73d0a6';
                    } else {
                        this.context.strokeStyle = '#4982ab';
                    }

                    this.context.lineWidth = 4;
                    this.context.beginPath();

                    if((connection.start == DIRECTION.TOP && connection.end == DIRECTION.RIGHT) || (connection.start == DIRECTION.RIGHT && connection.end == DIRECTION.TOP)) {
                        // TOP RIGHT:
                        this.context.arc(horizontalOffset + this.tileSize, verticalOffset, (this.tileSize / 2), 0.5 * Math.PI, Math.PI);
                    } else if((connection.start == DIRECTION.BOTTOM && connection.end == DIRECTION.RIGHT) || (connection.start == DIRECTION.RIGHT && connection.end == DIRECTION.BOTTOM)) {
                        // BOTTOM RIGHT:
                        this.context.arc(horizontalOffset + this.tileSize, verticalOffset + this.tileSize, (this.tileSize / 2), Math.PI, 1.5 * Math.PI);
                    } else if((connection.start == DIRECTION.BOTTOM && connection.end == DIRECTION.LEFT) || (connection.start == DIRECTION.LEFT && connection.end == DIRECTION.BOTTOM)) {
                        // BOTTOM LEFT:
                        this.context.arc(horizontalOffset, verticalOffset + this.tileSize, (this.tileSize / 2), 1.5 * Math.PI, 0);
                    } else if((connection.start == DIRECTION.TOP && connection.end == DIRECTION.LEFT) || (connection.start == DIRECTION.LEFT && connection.end == DIRECTION.TOP)) {
                        // TOP LEFT:
                        this.context.arc(horizontalOffset, verticalOffset, (this.tileSize / 2), 0, 0.5 * Math.PI);
                    } else {
                        this.getStrokePosition = function(direction) {
                            switch(direction) {
                                case DIRECTION.TOP:
                                    return { x: horizontalOffset + (this.tileSize / 2), y: verticalOffset };
                                case DIRECTION.RIGHT:
                                    return { x: horizontalOffset + this.tileSize, y: verticalOffset + (this.tileSize / 2) };
                                case DIRECTION.BOTTOM:
                                    return { x: horizontalOffset + (this.tileSize / 2), y: verticalOffset + this.tileSize };
                                case DIRECTION.LEFT:
                                    return { x: horizontalOffset, y: verticalOffset + (this.tileSize / 2) };
                                case DIRECTION.CENTER:
                                    return { x: horizontalOffset + (this.tileSize / 2), y: verticalOffset + (this.tileSize / 2) };
                                    break;
                            }
                        }

                        var start = this.getStrokePosition(connection.start);
                        var end = this.getStrokePosition(connection.end);

                        this.context.moveTo(start.x, start.y);
                        this.context.lineTo(end.x, end.y);
                    }

                    this.context.stroke();
                }

                if(this.board[x][y].isEndpoint()) {
                    this.context.beginPath();
                    this.context.arc(horizontalOffset + this.tileSize / 2, verticalOffset + this.tileSize / 2, this.tileSize / 5, 0, 2 * Math.PI)
                    if(this.board[x][y].isPartOfPath()) {
                        this.context.fillStyle = '#73d0a6';
                    } else {
                        this.context.fillStyle = '#ffffff';
                    }
                    this.context.fill();
                    this.context.stroke();
                }
            }
        }
    }

    // When we let the user enter values we obviously have to check if they are valid.
    this.validateUserInput = function() {
        var boardWidth = document.getElementById('input-width').value;
        var boardHeight = document.getElementById('input-height').value;
        var endpoints = document.getElementById('input-endpoints').value;

        if(endpoints < 2) {
            alert('There must be at least two endpoints!')
            return false;
        } else if (endpoints > (boardWidth * boardHeight)) {
            alert('There cannot be more endpoints than tiles!');
            return false;
        } else if(endpoints % 2 != 0) {
            alert('There must be an even number of endpoints!');
            return false;
        }

        if(boardWidth < 2) {
            alert('The board must be at least two tiles wide!');
            return false;
        }

        if(boardHeight < 2) {
            alert('The board must be at least two tiles high!');
        }

        return true;
    }

    // When the canvas is clicked we rotate the corresponding tile and update and redraw the board.
    this.onclick = function(location) {
        if(!this.running) {
            return;
        }

        var x = Math.floor((location.x - MARGIN) / (this.tileSize + MARGIN));
        var y = Math.floor((location.y - MARGIN) / (this.tileSize + MARGIN));
        if(x >= 0 && x < (this.boardWidth) && y >= 0 && y < (this.boardHeight)) {
            this.board[x][y].rotate();
        }
        this.update();
        this.draw();
    }

    // When the window gets resized we need to recalculate the dimensions and redraw the board to match the new window size.
    this.onresize = function() {
        this.calculateDimensions();
        this.draw();
    }

    // To prevent selecting text when double clicking we listen to onselectstart and return false.
    canvas.onselectstart = function() {
        return false;
    }
}

// This prototype represents a single tile on the board.
function Tile(x, y, connections) {
    this.x = x;
    this.y = y;
    this.connections = connections;

    // This function checks if this tile is an endpoint by inspecting all incoming connections.
    this.isEndpoint = function() {
        for(var i = 0; i < this.connections.length; i++) {
            if(this.connections[i].isEndpoint()) return true;
        }
        return false;
    }

    this.isPartOfPath = function() {
        for(var i = 0; i < this.connections.length; i++) {
            if(this.connections[i].isPartOfPath) return true;
        }
        return false;
    }

    this.isObstacle = function() {
        return this.connections.length === 0;   
    }

    // This function rotates the tile by simply assigning the next enumeration value.
    this.rotate = function() {
        for(var i = 0; i < this.connections.length; i++) {
            this.connections[i].rotate();
        }
    }
}

function Connection(start, end) {
    this.start = start;
    this.end = end;
    this.isPartOfPath = false;

    this.isEndpoint = function() {
        return (this.start === DIRECTION.CENTER || this.end === DIRECTION.CENTER);
    }

    this.rotate = function() {
        if(this.start < 4) this.start++;
        else if(this.start === 4) this.start = 1;
        
        if(this.end < 4) this.end++;
        else if(this.end === 4) this.end = 1;
    }

    this.equals = function(other) {
        return (this.start === other.start && this.end === other.end) || (this.start === other.end && this.end === other.start);
    }
}