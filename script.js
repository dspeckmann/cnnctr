// TODO: Generate board by building paths and then randomly rotating tiles
// TODO: Improve getOppositeDirection
// TODO: Put fillRect in function
// TODO: Put boundary check in function
// TODO: Display seed so that a level can be shared
// TODO: Split script into multiple files?

const dimensions = {
    tileWidth: 80,
    tileHeight: 80,
    horizontalMargin: 2,
    verticalMargin: 2,
    boardWidth: 6,
    boardHeight: 6
}

const directions = {
    top: 1,
    right: 2,
    bottom: 3,
    left: 4,
    center: 5
}

const pathStatus = {
    none: 1,
    partial: 2,
    complete: 3
}

window.onload = function() {
    var canvas = document.getElementById('game-canvas');
    if(canvas.getContext) {
        canvas.width = dimensions.horizontalMargin + (dimensions.boardWidth * (dimensions.tileWidth + dimensions.horizontalMargin));
        canvas.height = dimensions.verticalMargin + (dimensions.boardHeight * (dimensions.tileHeight + dimensions.verticalMargin));
        
        var board = generateBoard();

        canvas.onclick = function(event) {
            event.preventDefault();
            var x = Math.floor((event.offsetX - dimensions.horizontalMargin) / (dimensions.tileWidth + dimensions.horizontalMargin));
            var y = Math.floor((event.offsetY - dimensions.verticalMargin) / (dimensions.tileHeight + dimensions.verticalMargin));
            if(x >= 0 && x < (dimensions.boardWidth) && y >= 0 && y < (dimensions.boardHeight)) {
                board[x][y].rotate();
            }
            updateBoard(board);
            drawBoard(context, board);
        }

        // To prevent selecting text with double clicking:
        canvas.onselectstart = function() {
            return false;
        }

        document.getElementById('restart-link').onclick = function(event) {
            board = generateBoard();
            updateBoard(board);
            drawBoard(context, board);
        }

        var context = canvas.getContext('2d');
        updateBoard(board);
        drawBoard(context, board);
    }
}

function generateBoard() {
    var board = [];
    for(var x = 0; x < dimensions.boardWidth; x++) {
        board[x] = [];
        for(var y = 0; y < dimensions.boardHeight; y++) {
            var connections;
            var rand = Math.random();
            if(rand > 0.75) {
                connections = [[directions.top, directions.right]];
            } else if(rand > 0.5) {
                connections = [[directions.right, directions.bottom]];
            } else if(rand > 0.25) {
                connections = [[directions.bottom, directions.left]];
            } else {
                connections = [[directions.top, directions.bottom]];
            }
            board[x][y] = new Tile(x, y, connections);
        }
    }

    board[5][5].connections = [[directions.center, directions.bottom]];
    board[3][3].connections = [[directions.top, directions.right], [directions.bottom, directions.left]];
    board[4][1].connections = [[directions.top, directions.center]];
    board[0][5].connections = [[directions.center, directions.bottom]];
    board[3][4].connections = [[directions.right, directions.center]];

    return board;
}

function drawBoard(context, board) {
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    for(var x = 0; x < board.length; x++) {
        for(var y = 0; y < board[x].length; y++) {
            var horizontalOffset = dimensions.horizontalMargin + (x * (dimensions.tileWidth + dimensions.horizontalMargin));
            var verticalOffset = dimensions.verticalMargin + (y * (dimensions.tileHeight + dimensions.verticalMargin));

            if(board[x][y].pathStatus === pathStatus.partial) {
                context.fillStyle = '#ffc08b';
                context.fillRect(
                    horizontalOffset,
                    verticalOffset,
                    dimensions.tileWidth,
                    dimensions.tileHeight
                );
            } else if(board[x][y].pathStatus === pathStatus.complete) {
                context.fillStyle = '#72d172';
                context.fillRect(
                    horizontalOffset,
                    verticalOffset,
                    dimensions.tileWidth,
                    dimensions.tileHeight
                );
            } else {
                context.fillStyle = '#ffffff';
                context.fillRect(
                    horizontalOffset,
                    verticalOffset,
                    dimensions.tileWidth,
                    dimensions.tileHeight
                );
            }

            if(board[x][y].isEndpoint()) {
                context.fillStyle = '#006363';
                context.fillRect(
                    horizontalOffset + 20,
                    verticalOffset + 20,
                    dimensions.tileWidth - 40,
                    dimensions.tileHeight - 40
                );
            }

            for(var i = 0; i < board[x][y].connections.length; i++) {
                function getStrokePosition(direction) {
                    switch(direction) {
                        case directions.top:
                            return { x: horizontalOffset + (dimensions.tileWidth / 2), y: verticalOffset };
                        case directions.right:
                            return { x: horizontalOffset + dimensions.tileWidth, y: verticalOffset + (dimensions.tileHeight / 2) };
                        case directions.bottom:
                            return { x: horizontalOffset + (dimensions.tileWidth / 2), y: verticalOffset + dimensions.tileHeight };
                        case directions.left:
                            return { x: horizontalOffset, y: verticalOffset + (dimensions.tileHeight / 2) };
                        case directions.center:
                            return { x: horizontalOffset + (dimensions.tileWidth / 2), y: verticalOffset + (dimensions.tileHeight / 2) };
                            break;
                    }
                }

                var connection = board[x][y].connections[i];
                var start = getStrokePosition(connection[0]);
                var end = getStrokePosition(connection[1]);

                context.strokeStyle = '#006363';
                context.lineWidth = 3;
                context.beginPath();
                context.moveTo(start.x, start.y);
                context.lineTo(end.x, end.y);
                context.stroke();
            }
        }
    }
}

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
    document.getElementById('path-counter').innerText = checkedEndpoints.length;
}

function followPath(board, tile, lastDirection) {
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
            var newTile = followPath(board, board[newX][newY], getOppositeDirection(newDirection));
            if(newTile) {
                tile.pathStatus = pathStatus.complete;
            }
            return newTile;
        }
    }

    return false;
}

function getOppositeDirection(direction) {
    var opposites = [];
    opposites[directions.top] = directions.bottom;
    opposites[directions.right] = directions.left;
    opposites[directions.bottom] = directions.top;
    opposites[directions.left] = directions.right;
    return opposites[direction];
}

function Tile(x, y, connections) {
    this.x = x;
    this.y = y;
    this.connections = connections;
    this.pathStatus = pathStatus.none;

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