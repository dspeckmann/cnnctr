// TODO: Put boundary check into function
// TODO: Put "direction switch" into its own function
// TODO: Implement split paths (odd number of endpoints)
// TODO: Write function for oddly distributed choices

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
                var connections = [];
                this.board[x][y] = new Tile(x, y, connections);
            }
        }

        // Generate paths.
        var pathCount = document.getElementById('input-paths').value;
        document.getElementById('path-counter-max').innerText = pathCount;
        for(var i = 0; i < pathCount; i++) {
            var length = Math.floor(Math.random() * 10) + 3;
            var x = Math.floor(Math.random() * this.boardWidth);
            var y = Math.floor(Math.random() * this.boardHeight);
            if(this.board[x][y].isEndpoint() || this.board[x][y].isPartOfPath()) {
                i--;
                continue;
            }
            this.generatePath(this.board[x][y], length);
        }

        for(var x = 0; x < this.boardWidth; x++) {
            for(var y = 0; y < this.boardHeight; y++) {
                // We want zero to three connections per tile with 40% probability for one, 30% for two, 10% for three and 20% for none at all.
                // For endpoints we do not want more than one connection.
                var rand = Math.random();
                var count;
                if(this.board[x][y].isEndpoint()) {
                    if(rand > 0.5) {
                        count = 1;
                    } else {
                        count = 0;
                    }
                } else {
                    if(rand > 0.6) {
                        count = 1;
                    } else if(rand > 0.3) {
                        count = 2;
                    } else if(rand > 0.2) {
                        count = 3;
                    } else {
                        count = 0;
                    }
                }
                
                for(var i = 0; i < count; i++) {
                    rand = Math.random();
                    var connection;
                    // If the tile is an endpoint we do not want any crossing paths.
                    if(this.board[x][y].isEndpoint()) {
                        if(rand > 0.75) {
                            connection = new Connection(DIRECTION.TOP, DIRECTION.RIGHT);
                        } else if(rand > 0.5) {
                            connection = new Connection(DIRECTION.RIGHT, DIRECTION.BOTTOM);
                        } else if(rand > 0.25) {
                            connection = new Connection(DIRECTION.BOTTOM, DIRECTION.LEFT);
                        } else {
                            connection = new Connection(DIRECTION.LEFT, DIRECTION.TOP);
                        }
                    } else {
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
                    }

                    // Check if an equal connection already exists so we don't add it again.
                    if(!this.board[x][y].hasConnection(connection)) {
                        this.board[x][y].connections.push(connection);
                    }
                }
            }
        }

        // Randomly rotate all tiles zero to 3 times.
        for(var x = 0; x < this.boardWidth; x++) {
            for(var y = 0; y < this.boardHeight; y++) {
                var rand = Math.floor();
                var rotations;
                if(rand > 0.85) {
                    rotations = 0; // 15%
                } else if(rand > 0.55) {
                    rotations = 1; // 30%
                } else if(rand > 0.30) {
                    rotations = 2; // 25%
                } else {
                    rotations = 3; // 30%
                }
                for(var i = 0; i < rotations; i++) {
                    this.board[x][y].rotate();
                }
            }
        }
    }

    this.generatePath = function(start, length, lastDirection = DIRECTION.CENTER) {
        if(length === 1) {
            start.connections.push(new Connection(lastDirection, DIRECTION.CENTER, true));
            return;
        }

        var newX, newY;
        var tries = 100;
        do {
            if(tries === 0) {
                if(lastDirection !== DIRECTION.CENTER) {
                    start.connections.push(new Connection(lastDirection, DIRECTION.CENTER, true));
                }
                return;
            }
            // We skip one direction because the path cannot go backwards.
            var newDirection = Math.floor(Math.random() * 3) + 1;
            if(newDirection >= lastDirection) {
                newDirection++;
            }
            newX = start.x;
            newY = start.y;
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
            }
            tries--;
        // We check the boundaries once again. The current path must only cross other paths, not endpoints. We also don't put endpoints on existing paths.
        } while (newX < 0 || newX >= this.boardWidth || newY < 0 || newY >= this.boardHeight || this.board[newX][newY].isEndpoint() || (length === 2 && this.board[newX][newY].isPartOfPath()) || start.hasConnection(new Connection(lastDirection, newDirection)));

        start.connections.push(new Connection(lastDirection, newDirection, true));
        this.generatePath(this.board[newX][newY], length - 1, this.getOppositeDirection(newDirection));
    }

    this.getNeighbor = function(currentTile, direction) {
        newX = currentTile.x;
        newY = currentTile.y;
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
        }

        if(newX < 0 || newX >= this.boardWidth || newY < 0 || newY >= this.boardHeight) {
            return false;
        }

        return this.board[newX][newY];
    }

    // This function returns the opposite of the given direction.
    this.getOppositeDirection = function(direction) {
        var opposites = [];
        opposites[DIRECTION.TOP] = DIRECTION.BOTTOM;
        opposites[DIRECTION.RIGHT] = DIRECTION.LEFT;
        opposites[DIRECTION.BOTTOM] = DIRECTION.TOP;
        opposites[DIRECTION.LEFT] = DIRECTION.RIGHT;
        return opposites[direction];
    }

    // This function updates the board by resetting all statuses and calling followPath for all endpoints.
    this.update = function() {
        // This function uses recursion to traverse a path from one endpoint to another, if possible.
        // We also update the statuses of all visited tiles, depending on the completeness of the path.
        this.followPath = function(tile, lastDirection, alreadyVisited = []) {
            for(var i = 0; i < tile.connections.length; i++) {
                // We need to check if this connection has already been visited to prevent endless loops.
                var connection = tile.connections[i];
                if(alreadyVisited.indexOf(connection) !== -1) {
                    continue;
                }
                alreadyVisited.push(connection);

                if(connection.isPartOfPath) {
                    continue;
                }

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
                        connection.isPartOfPath = true;
                        return tile;
                }

                if(newX >= 0 && newX < this.boardWidth && newY >= 0 && newY < this.boardHeight) {
                    var endpoint = this.followPath(this.board[newX][newY], this.getOppositeDirection(newDirection), alreadyVisited);
                    if(endpoint) {
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

                // If the tile is part of a path we sort the connections so the highlighted ones are on top.
                if(this.board[x][y].isPartOfPath()) {
                    this.board[x][y].connections.sort(function(a, b) {
                        if(a.isPartOfPath) {
                            return 1;
                        } else if(b.isPartOfPath) {
                            return -1;
                        }
                        return 0;
                    });
                }
                
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
                    this.context.arc(horizontalOffset + this.tileSize / 2, verticalOffset + this.tileSize / 2, this.tileSize / 8, 0, 2 * Math.PI)

                    // It is not enough to check if the tile is part of a path because there could be another connection next to the endpoint itself.
                    var partOfPath = false;
                    for(var i = 0; i < this.board[x][y].connections.length; i++) {
                        if(this.board[x][y].connections[i].isEndpoint() && this.board[x][y].connections[i].isPartOfPath) {
                            partOfPath = true;
                        }
                    }

                    if(partOfPath) {
                        this.context.fillStyle = '#73d0a6';
                        this.context.strokeStyle = '#73d0a6';
                    } else {
                        this.context.fillStyle = '#ffffff';
                        this.context.strokeStyle = '#4982ab';
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
        var paths = document.getElementById('input-paths').value;

        if(paths < 1) {
            alert('There must be at least one path!')
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
            if(this.connections[i].isEndpoint()) {
                return true;
            }
        }
        return false;
    }

    this.isPartOfPath = function() {
        for(var i = 0; i < this.connections.length; i++) {
            if(this.connections[i].isPartOfPath) {
                return true;
            }
        }
        return false;
    }

    this.isObstacle = function() {
        return this.connections.length === 0;   
    }

    this.hasConnection = function(other) {
        for(var i = 0; i < this.connections.length; i++) {
            if(this.connections[i].equals(other)) {
                return true;
            }
        }
        return false;
    }

    // This function rotates the tile by simply assigning the next enumeration value.
    this.rotate = function() {
        for(var i = 0; i < this.connections.length; i++) {
            this.connections[i].rotate();
        }
    }
}

function Connection(start, end, isPartOfPath = false) {
    this.start = start;
    this.end = end;
    this.isPartOfPath = isPartOfPath;

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