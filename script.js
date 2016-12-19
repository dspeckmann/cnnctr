// TODO: Generate actual paths and not just random tiles
// TODO: Improve getOppositeDirection
// TODO: Put fillRect in function
// TODO: Put boundary check in function
// TODO: Prevent non-relevant tiles from being highlighted once a path is complete
// TODO: Display seed so that a level can be shared
// TODO: Split script into multiple files?
// TODO: Allow configuration, e.g. the size of the board or the number of endpoints
// TODO: Improve color scheme
// TODO: Responsive design

// These are the dimensions used for generating and drawing the board.
const dimensions = {
    tileMargin: 2,
    boardWidth: 8,
    boardHeight: 8
}

var tileSize;

// In this enumeration the possible directions in which connections can go are stored.
// Center is used for connecting endpoints to other tiles.
const directions = {
    top: 1,
    right: 2,
    bottom: 3,
    left: 4,
    center: 5
}

// In this enumeration the status of a tile is stored.
// It can be part of a complete path, a partial path or none path at all.
const pathStatus = {
    none: 1,
    partial: 2,
    complete: 3
}

// This is the entry point for our game.
window.onload = function() {
    var canvas = document.getElementById('game-canvas');
    if(canvas.getContext) {
        calculateDimensions();
        var context = canvas.getContext('2d');
        var board = generateBoard();        
        updateBoard(board);
        drawBoard(context, board);

        // When the canvas is clicked we rotate the corresponding tile and update and redraw the board.
        canvas.onclick = function(event) {
            event.preventDefault();
            var x = Math.floor((event.offsetX - dimensions.tileMargin) / (tileSize + dimensions.tileMargin));
            var y = Math.floor((event.offsetY - dimensions.tileMargin) / (tileSize + dimensions.tileMargin));
            if(x >= 0 && x < (dimensions.boardWidth) && y >= 0 && y < (dimensions.boardHeight)) {
                board[x][y].rotate();
            }
            updateBoard(board);
            drawBoard(context, board);
        }

        // To prevent selecting text when double clicking we listen to onselectstart and return false.
        canvas.onselectstart = function() {
            return false;
        }

        // When the window gets resized we need to recalculate the dimensions and redraw the board to match the new window size.
        window.onresize = function() {
            calculateDimensions();
            drawBoard(context, board);
        }

        // Here we resize the canvas to match its parent div's dimensions. After that the new tile size is calculated.
        function calculateDimensions() {
            canvas.width = canvas.parentNode.clientWidth;
            tileSize = Math.floor((canvas.width - dimensions.tileMargin) / dimensions.boardWidth) - dimensions.tileMargin;
            canvas.width = dimensions.tileMargin + (dimensions.boardWidth * (tileSize + dimensions.tileMargin));
            canvas.height = dimensions.tileMargin + (dimensions.boardHeight * (tileSize + dimensions.tileMargin));
        }

        // When the restart link is clicked we generate a new board.
        document.getElementById('restart-link').onclick = function(event) {
            board = generateBoard();
            updateBoard(board);
            drawBoard(context, board);
        }
    }
}

function getRandomConnection() {
    var rand = Math.random();
    if(rand > 0.88) {
        return [directions.top, directions.right];
    } else if(rand > 0.66) {
        return [directions.right, directions.bottom];
    } else if(rand > 0.44) {
        return [directions.bottom, directions.left];
    } else if(rand > 0.22) {
        return [directions.left, directions.top];
    } else {
        return [directions.top, directions.bottom];
    }
}

// Here we generate a new board. This function leaves much to desire.
function generateBoard() {
    var board = [];
    for(var x = 0; x < dimensions.boardWidth; x++) {
        board[x] = [];
        for(var y = 0; y < dimensions.boardHeight; y++) {
            // We want one to three connections per tile with 40% probability for one, 35% for two and 25% for three.
            var rand = Math.random();
            var count;
            if(rand > 0.6) {
                count = 1;
            } else if(rand > 0.25) {
                count = 2;
            } else {
                count = 3;
            }
            var connections = [];
            for(var i = 0; i < count; i++) {
                connections.push(getRandomConnection());
            }
            board[x][y] = new Tile(x, y, connections);
        }
    }

    // Choose random endpoints.
    var endpointCount = 6;
    for(var i = 0; i < endpointCount; i++) {
        var x = Math.floor(Math.random() * dimensions.boardWidth);
        var y = Math.floor(Math.random() * dimensions.boardHeight);

        if(board[x][y].connections[0][0] === directions.center) {
            i--;
            continue;
        }

        board[x][y].connections = [[directions.center, board[x][y].connections[0][1]]];
    }

    document.getElementById('path-counter-max').innerText = endpointCount / 2;

    return board;
}

// This function draws the board with much room for improvements.
function drawBoard(context, board) {
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    for(var x = 0; x < board.length; x++) {
        for(var y = 0; y < board[x].length; y++) {
            var horizontalOffset = dimensions.tileMargin + (x * (tileSize + dimensions.tileMargin));
            var verticalOffset = dimensions.tileMargin + (y * (tileSize + dimensions.tileMargin));

            if(board[x][y].pathStatus === pathStatus.partial) {
                context.fillStyle = '#ffe28d';
            } else if(board[x][y].pathStatus === pathStatus.complete) {
                context.fillStyle = '#73d0a6';
            } else {
                context.fillStyle = '#ffffff';
            }

            context.fillRect(
                horizontalOffset,
                verticalOffset,
                tileSize,
                tileSize
            );
            
            context.strokeStyle = '#4982ab';
            
            for(var i = 0; i < board[x][y].connections.length; i++) {
                context.lineWidth = 4;
                context.beginPath();

                var connection = board[x][y].connections[i];

                if((connection[0] == directions.top && connection[1] == directions.right) ||(connection[0] == directions.right && connection[1] == directions.top)) {
                    // Top Right:
                    context.arc(horizontalOffset + tileSize, verticalOffset, (tileSize / 2), 0.5 * Math.PI, Math.PI);
                } else if((connection[0] == directions.bottom && connection[1] == directions.right) ||(connection[0] == directions.right && connection[1] == directions.bottom)) {
                    // Bottom Right:
                    context.arc(horizontalOffset + tileSize, verticalOffset + tileSize, (tileSize / 2), Math.PI, 1.5 * Math.PI);
                } else if((connection[0] == directions.bottom && connection[1] == directions.left) ||(connection[0] == directions.left && connection[1] == directions.bottom)) {
                    // Bottom Left:
                    context.arc(horizontalOffset, verticalOffset + tileSize, (tileSize / 2), 1.5 * Math.PI, 0);
                } else if((connection[0] == directions.top && connection[1] == directions.left) ||(connection[0] == directions.left && connection[1] == directions.top)) {
                    // Top Left:
                    context.arc(horizontalOffset, verticalOffset, (tileSize / 2), 0, 0.5 * Math.PI);
                } else {
                    function getStrokePosition(direction) {
                        switch(direction) {
                            case directions.top:
                                return { x: horizontalOffset + (tileSize / 2), y: verticalOffset };
                            case directions.right:
                                return { x: horizontalOffset + tileSize, y: verticalOffset + (tileSize / 2) };
                            case directions.bottom:
                                return { x: horizontalOffset + (tileSize / 2), y: verticalOffset + tileSize };
                            case directions.left:
                                return { x: horizontalOffset, y: verticalOffset + (tileSize / 2) };
                            case directions.center:
                                return { x: horizontalOffset + (tileSize / 2), y: verticalOffset + (tileSize / 2) };
                                break;
                        }
                    }

                    var start = getStrokePosition(connection[0]);
                    var end = getStrokePosition(connection[1]);

                    context.moveTo(start.x, start.y);
                    context.lineTo(end.x, end.y);  
                }

                context.stroke();
            }

            if(board[x][y].isEndpoint()) {
                context.beginPath();
                context.arc(horizontalOffset + tileSize / 2, verticalOffset + tileSize / 2, tileSize / 5, 0, 2 * Math.PI)
                context.fillStyle = '#ffffff';
                context.fill();
                context.stroke();
            }
        }
    }
}

// This function updates the board by resetting all statuses and calling followPath for all endpoints.
function updateBoard(board) {
    var endpoints = [];
    for(var x = 0; x < board.length; x++) {
        for(var y = 0; y < board[x].length; y++) {
            board[x][y].pathStatus = pathStatus.none;
            if(board[x][y].isEndpoint()) {
                endpoints.push(board[x][y]);
            }
        }
    }

    var checkedEndpoints = [];
    for(var i = 0; i < endpoints.length; i++) {
        if(checkedEndpoints.indexOf(endpoints[i]) === -1) {
            var endpoint = followPath(board, endpoints[i], directions.center);
            if(endpoint) {
                checkedEndpoints.push(endpoint);
            }
        }
    }
    document.getElementById('path-counter-current').innerText = checkedEndpoints.length;
}

// This function uses recursion to traverse a path from one endpoint to another, if possible.
// We also update the statuses of all visited tiles, depending on the completeness of the path.
function followPath(board, tile, lastDirection, alreadyVisited = []) {
    // We need to check if this tile has already been visited to prevent endless loops.
    if(alreadyVisited.indexOf(tile) !== -1) {
        return false;
    }

    alreadyVisited.push(tile);
    for(var i = 0; i < tile.connections.length; i++) {
        var connection = tile.connections[i];
        var newDirection;
        if(connection[0] == lastDirection) {
            newDirection = connection[1];
        } else if(connection[1] == lastDirection) {
            newDirection = connection[0];
        } else {
            continue;
        }

        tile.pathStatus = pathStatus.partial;

        var newX = tile.x;
        var newY = tile.y;
        switch(newDirection) {
            case directions.top:
                newY--;
                break;
            case directions.right:
                newX++;
                break;
            case directions.bottom:
                newY++;
                break;
            case directions.left:
                newX--;
                break;
            case directions.center:
                tile.pathStatus = pathStatus.complete;
                return tile;
        }

        if(newX >= 0 && newX < dimensions.boardWidth && newY >= 0 && newY < dimensions.boardHeight) {
            var endpoint = followPath(board, board[newX][newY], getOppositeDirection(newDirection), alreadyVisited);
            if(endpoint) {
                tile.pathStatus = pathStatus.complete;
                return endpoint;
            }
        }
    }

    return false;
}

// This function returns the opposite of the given direction.
function getOppositeDirection(direction) {
    var opposites = [];
    opposites[directions.top] = directions.bottom;
    opposites[directions.right] = directions.left;
    opposites[directions.bottom] = directions.top;
    opposites[directions.left] = directions.right;
    return opposites[direction];
}

// This prototype represents a single tile on the board.
function Tile(x, y, connections) {
    this.x = x;
    this.y = y;
    this.connections = connections;
    this.pathStatus = pathStatus.none;

    // This function checks if this tile is an endpoint by inspecting all incoming connections.
    this.isEndpoint = function() {
        for(var i = 0; i < this.connections.length; i++) {
            for(var j = 0; j < this.connections[i].length; j++) {
                if(this.connections[i][j] == directions.center) {
                    return true;
                }
            }
        }
        return false;
    }

    // This function rotates the tile by simply assigning the next enumeration value.
    this.rotate = function() {
        for(var i = 0; i < this.connections.length; i++) {
            for(var j = 0; j < this.connections[i].length; j++) {
                if(this.connections[i][j] < 4) {
                    this.connections[i][j]++;
                } else if(this.connections[i][j] == 4) {
                    this.connections[i][j] = 1;
                }
            }
        }
    }
}
