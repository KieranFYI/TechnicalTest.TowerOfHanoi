
class TowerOfHanoi {
    
    /**
     * @param gameContainer The container the game will be drawn inside of
     * @param totalTowers The total number of towers the game will use
     * @param blockCount The total number of blocks in the game
     */
    constructor(gameContainer, totalTowers, blockCount) {
        this.gameContainer = gameContainer;
        // Create the canvas that we will draw to, Set the background to white due to Edge displaying grey background
        this.canvas = document.createElement('canvas');
        this.canvas.onselectstart = function () { return false; }
        this.canvas.id = 'gameFrame';
        this.canvas.style.backgroundColor = '#FFFFFF';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.cursor = 'pointer'; 
        // Append the canvas to the gameContainer so we can see it
        gameContainer.appendChild(this.canvas);

        // The possible states the game can be in
        this.states = Object.freeze({'Playing': 1, 'Finished': 2});

        // Total number of blocks on a tower
        this.blockCount = parseInt(blockCount, 10);
        // Total number of towers in the game
        this.totalTowers = parseInt(totalTowers, 10);
        var towers = [];
        for (let i = 0; i < this.totalTowers; i++) {
            // Create the tower, specifying the total block count for calculations
            towers.push(new Tower(this.blockCount));
        }
        this.towers = Object.freeze(towers);

        var blocks = [];
        for (var i = this.blockCount; i > 0; i--) {
            blocks[i] = new Block(i, 'rgb(' + (Math.floor(Math.random() * 185) + 55) + ', ' + (Math.floor(Math.random() * 185) + 55) + ', ' + (Math.floor(Math.random() * 185) + 55) + ')');
        }
        this.blocks = Object.freeze(blocks);

        // Define the game so it can be passed into events due to weird qwerks with javascript
        var thisGame = this;
        // If the browser resizes for any reason, Ensure we update the calculations for component sizes
        window.addEventListener('resize', function(e) {
            thisGame.resize(e);
        });
        // Listen for user input and handle appropriately, Block right click and count as a left click 
        this.canvas.onclick = this.canvas.oncontextmenu = function(event) {
            thisGame.handleClick(event);
            event.preventDefault();
        };

        // Define the bounding box for the restart button
        this.restartBounds = new BoundingBox();
        // Define the bounding box for the undo button
        this.undoBounds = new BoundingBox();

        // Reset all variables for a fresh start
        this.reset();
        // Draw the game
        this.draw();
    }

    /**
     * Called when the user either interacts with the game or the browser is resized
     */
    draw() {

        // Clear the canvas to stop overlaying graphics
        this.context2D.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // Store the font size scaled to the gameContainer size
        this.fontSize = Math.ceil(30 * this.scale);
        // Define defaults before attempting to draw
        this.context2D.font = this.fontSize + 'pt Arial';
        this.context2D.fillStyle = '#000000';

        switch(this.currentState) {

            case this.states.Playing:

                // For all the available towers, draw to canvas
                for (let i = 0; i < this.towers.length; i++) {
                    // Pass in the current scale to make sure graphics appear correctly
                    this.towers[i].draw(this.context2D, this.scale);
                }
                
                // Display a counter of total moves made by the user
                this.context2D.fillStyle = '#000000';
                var textSize = this.context2D.measureText('Moves');
                var offset = 20 * this.scale;
                this.context2D.fillText('Moves', (this.canvas.width / 2) - (textSize.width / 2), offset + this.fontSize);
                var textSize = this.context2D.measureText(this.moveHistory.length);
                this.context2D.fillText(this.moveHistory.length, (this.canvas.width  - textSize.width) / 2, offset + (this.fontSize * 2));

                
                // Display Undo button to allow user to go back a step
                this.context2D.fillStyle = this.moveHistory.length > 0 ? '#000000' : '#d3d3d3';
                this.context2D.fillRect(this.undoBounds.getPosX(), this.undoBounds.getPosY(), this.undoBounds.getWidth(), this.undoBounds.getHeight());
                this.context2D.fillStyle = '#FFFFFF';
                var textSize = this.context2D.measureText('Undo');
                var offsetX = (this.undoBounds.getWidth() - textSize.width) / 2;
                var offsetY = (this.undoBounds.getHeight() - this.fontSize) / 2;
                this.context2D.fillText('Undo', this.undoBounds.getPosX() + offsetX, this.undoBounds.getPosY() + this.undoBounds.getHeight() - offsetY);

                // Display the restart button to allow the user to restart if they wish
                this.context2D.fillStyle = '#000000';
                this.context2D.fillRect(this.restartBounds.getPosX(), this.restartBounds.getPosY(), this.restartBounds.getWidth(), this.restartBounds.getHeight());
                this.context2D.fillStyle = '#FFFFFF';
                var textSize = this.context2D.measureText('Restart');
                var offsetX = (this.restartBounds.getWidth() - textSize.width) / 2;
                var offsetY = (this.restartBounds.getHeight() - this.fontSize) / 2;
                this.context2D.fillText('Restart', this.restartBounds.getPosX() + offsetX, this.restartBounds.getPosY() + this.restartBounds.getHeight() - offsetY);

            break;

            
            case this.states.Finished:
                
                // Display the total moves made in the game
                this.context2D.fillStyle = '#000000';
                var textSize = this.context2D.measureText('Total Moves');
                this.context2D.fillText('Total Moves', (this.canvas.width / 2) - (textSize.width / 2), (20 * this.scale) + this.fontSize);
                var textSize = this.context2D.measureText(this.moveHistory.length);
                this.context2D.fillText(this.moveHistory.length, (this.canvas.width / 2) - (textSize.width / 2), (20 * this.scale) + (this.fontSize * 2));

                // Display the restart button to allow the user to restart if they wish
                this.context2D.fillStyle = '#000000';
                this.context2D.fillRect(this.restartBounds.getPosX(), this.restartBounds.getPosY(), this.restartBounds.getWidth(), this.restartBounds.getHeight());
                this.context2D.fillStyle = '#FFFFFF';
                var textSize = this.context2D.measureText('Restart');
                var offsetX = (this.restartBounds.getWidth() - textSize.width) / 2;
                var offsetY = (this.restartBounds.getHeight() - this.fontSize) / 2;
                this.context2D.fillText('Restart', this.restartBounds.getPosX() + offsetX, this.restartBounds.getPosY() + this.restartBounds.getHeight() - offsetY);
            break;

            default:
                console.log('Unhandled draw state ' + this.currentState);
            break;
        }
    }

    /**
     *  Called when the browser window resize to allow graphic calculations to be recalculated
     */
    resize() {
        // Update the canvas width/height to meet the gameContainer 
        this.canvas.width = this.gameContainer.clientWidth;
        this.canvas.height = this.gameContainer.clientHeight;
        this.context2D = this.canvas.getContext('2d');
        this.context2D.font = '30px Arial';

        // Determine the scale for width and height, Allows the graphics to scale accordingly
        var scaleW = this.canvas.width / 1200;
        var scaleH = this.canvas.height / 800
        
        // Use the smallest scale to ensure the graphics fit on the screen
        this.scale = scaleH < scaleW ? scaleH : scaleW;
        
        // Calculate the width of each tower base in the canvas width and total towers
        this.towerWidth = this.canvas.width / this.towers.length;
        // Offset the towers from the bottom of the canvas
        this.offsetY = this.canvas.height * 0.8;
        for (let i = 0; i < this.towers.length; i++) {
            var tower = this.towers[i];
            // Scale the design height to meet the display scale
            var height = 360 * this.scale;
            tower.getBounds().updateBounds(this.towerWidth * i, this.offsetY - height, this.towerWidth, height);
        }
        
        // Update the restart button bounding box to be in the correct position
        var width = 150 * this.scale;
        var height = 50 * this.scale;
        this.restartBounds.updateBounds((this.canvas.width - width) / 2, this.canvas.height - (20 * this.scale) - height, width, height);

        // Update the undo button bounding box to be in the correct position
        width = 150 * this.scale;
        height = 50 * this.scale;
        this.undoBounds.updateBounds((this.canvas.width - width) - (20 * this.scale), (20 * this.scale), width, height);

        // Redraw the game with the new scales
        this.draw();
    }

    /**
     * Called on game load and reset button press to reset variables
     */
    reset() {
        // Reset to the playing state
        this.currentState = this.states.Playing;
        // Reset variables
        this.selectedTower = -1;
        this.moveHistory = [];

        // Removes any blocks from all towers
        for (var i = 0; i < this.towers.length; i++) {
            this.towers[i].reset();
        }
        
        // Place all blocks on the first tower
        for (var i = this.blocks.length; i > 0; i--) {
            this.towers[0].addBlock(this.blocks[i - 1]);
        }

        // Call resize to reset all calculations
        this.resize();
    }

    /**
     * @param event The event as passed in by the eventListener
     */
    handleClick(event) {
        switch (this.currentState) {

            case this.states.Playing:
                    
                // Loop each tower and check if we are clicking in the area defined by a tower
                for (var i = 0; i < this.towers.length; i++) {
                    var tower = this.towers[i];

                    // Check the click positon against the tower bounds
                    if (!tower.getBounds().inBounds(event.offsetX, event.offsetY)) {
                        continue;
                    }

                    if (this.selectedTower == -1) {
                        // If we don't have a tower yet, only set select if the tower we are clicking has blocks on it.

                        if (tower.blocks.length > 0) {
                            tower.selected = true;
                            this.selectedTower = i;
                        }
                    } else if (this.selectedTower == i) {
                        // Deselect the tower if we are clicking the already selected one
                        tower.selected = false;
                        this.selectedTower = -1;
                    } else {
                        // Get the previously selected tower
                        var oldTower = this.towers[this.selectedTower];
                        // Get the top block of both towers to compare
                        var moveBlock = oldTower.getTopBlock();
                        var newTowerTopBlock = tower.getTopBlock();
                        // If the new tower doesn't have a block or top block of the block to move is less than the top block id for the new tower
                        if (newTowerTopBlock === undefined || moveBlock.id < newTowerTopBlock.id) {
                            // Add the block to the new tower
                            tower.addBlock(moveBlock);
                            // Remove the top block on the old tower
                            oldTower.removeTop();
                            // Add the move into the move history
                            this.moveHistory.push(new Move(this.selectedTower, i));                            
                        }
                        // Deselect the tower
                        oldTower.selected = false;
                        this.selectedTower = -1;
                    }
                    
                    break;
                }

                // Check if the last tower has all the blocks and trigger the win condiction
                if (this.towers[this.towers.length - 1].blocks.length == this.blockCount) {
                    this.currentState = this.states.Finished;
                }
                
                // If the reset button has been clicked, reset the game
                if (this.restartBounds.inBounds(event.offsetX, event.offsetY)) {
                    this.reset();
                }

                // If the undo button has been clicked, undo the last move
                if (this.undoBounds.inBounds(event.offsetX, event.offsetY) && this.moveHistory.length > 0) {
                    console.log(this.selectedTower);
                    if (this.selectedTower != -1) {
                        this.towers[this.selectedTower].selected = false;
                        this.selectedTower = -1;
                    }
                    
                    var lastMove = this.moveHistory.pop();
                    
                    // Get the previously selected tower
                    var oldTower = this.towers[lastMove.getFrom()];
                    var newTower = this.towers[lastMove.getTo()];

                    var blockToMove = newTower.getTopBlock();

                    // Add the block to the new tower
                    oldTower.addBlock(blockToMove);
                    // Remove the top block on the old tower
                    newTower.removeTop();
                }

            break;

            case this.states.Finished:

            
                // If the reset button has been clicked, reset the game
                if (this.restartBounds.inBounds(event.offsetX, event.offsetY)) {
                    this.reset();
                }
            break;

            default:
                console.log('Unhandled click state ' + this.currentState);
            break;
        }

        this.draw();
    }
}

/**
 * The tower stores all the blocks for drawing aswell as providing the correct offsets when drawing blocks
 */
class Tower {

    /**
     * @param totalBlocks The total blocks available in the game
     */
    constructor(totalBlocks) {
        this.totalBlocks = totalBlocks;
        this.blocks = [];
        this.selected = false;
        this.bounds = new BoundingBox();
    }

    /**
     * The bounding box for the towers hitbox
     * @returns BoundingBox 
     */
    getBounds() {
        return this.bounds;
    }

    /**
     * Draws the tower and the blocks placed on it
     * @param context2D The 2D context of the canvas used for drawing
     * @param scale The scaling factor to use when drawing components 
     */
    draw(context2D, scale) {
        // The center of the tower for alignment
        var centerX = this.getBounds().getPosX() + (this.getBounds().getWidth() / 2);

        // Draw the tower green if it is selected else default to black
        var towerColour = this.selected ? '#00FF00' : this.blocks.length > 0 ? '#529bd2' : '#000000';
        context2D.fillStyle = towerColour
        var thickness = Math.ceil(10 * scale);
        // The minimum size of the top block Including offsets for the base
        var blockWidth = (this.getBounds().getWidth() - (thickness * 2)) / (this.totalBlocks + 1);

        // Draw the tower
        var towerWidth = Math.min(thickness, blockWidth * 0.8);
        context2D.fillRect(centerX - (towerWidth / 2), this.getBounds().getPosY(), towerWidth, this.getBounds().getHeight() - thickness);

        // Calculate the offset in height for the blocks to start at and the height of each block
        var blockHeight = (this.getBounds().getHeight() - (10 * scale)) / (this.totalBlocks + 1);
        var blockY = this.getBounds().getPosY() + this.getBounds().getHeight() - thickness - (blockHeight * (this.totalBlocks + 2));
        for (let i = this.totalBlocks; i >= 0; i--) {
            // Move the block up in high depending on the thickness of the lines being drawn
            blockY += blockHeight;

            if (this.blocks[i] !== undefined) {
                // Draw the block with the offsets
                this.blocks[i].draw(context2D, blockWidth, centerX, blockY, blockHeight);
            }
        }
        
        context2D.fillStyle = towerColour;
        // Draw the tower base with offsets on either side
        context2D.fillRect(this.getBounds().getPosX() + thickness, this.getBounds().getPosY() + this.getBounds().getHeight() - thickness, this.getBounds().getWidth() - (thickness * 2), thickness);
    }

    /**
     * Adds a block onto the tower
     * @param block The block to place on top of the tower
     */
    addBlock(block) {
        for (let i = 0; i < this.totalBlocks; i++) {
            if (this.blocks[i] === undefined) {
                this.blocks.push(block);
                break;
            }
        }
    }

    /**
     * Returns the block at the top of the tower or undefined is none
     * @returns Block 
     */
    getTopBlock() {
        for (let i = this.blocks.length; i >= 0; i--) {
            // Start from the top of the stack and work down to find the top block
            if (this.blocks[i] !== undefined) {
                return this.blocks[i];
            }
        }
        
        return undefined;
    }

    /**
     * Removes the block at the top of the tower
     */
    removeTop() {
        if (this.blocks.length > 0) {
            this.blocks.length = this.blocks.length - 1
        }
    }

    /**
     * Reset the tower back to new state
     */
    reset() {
        this.blocks.length = 0;
        this.selected = false;
    }
}


/**
 * The blocks placed on towers
 */
class Block {

    /**
     * @param id The id of the block used for rendering the width and detecting if a block can be placed on it
     * @param colour The colour to draw the block
     */
    constructor(id, colour) {
        this.id = id;
        this.colour = colour;
    }

    /**
     * 
     * @param context2D The 2D context provided by the canvas
     * @param blockWidth The block width to use in combination with the block id
     * @param centerX The center of the tower width
     * @param yPos The height offset the block should be drawn at
     * @param height The height of the block to draw
     */
    draw(context2D, blockWidth, centerX, yPos, height) {
        context2D.fillStyle = this.colour;
        var width = blockWidth * this.id;
        context2D.fillRect(centerX - (width / 2), yPos, width, height + 1);
    }
}

/**
 * Provides functions for click detection
 */
class BoundingBox {

    /**
     * Checks the mouse click position against the bounds defined
     * @param posX The x Position of the click
     * @param posY The y Position of the click
     * @returns boolean
     */
    inBounds(posX, posY) {
        return (this.posX < posX && posX < (this.posX + this.width))
            && (this.posY < posY && posY < (this.posY + this.height));
    }

    /**
     * 
     * @param posX The x position of the bounds
     * @param posY The y position of the bounds
     * @param width The width of the bounds
     * @param height The height of the bounds
     */
    updateBounds(posX, posY, width, height) {
        this.posX = posX;
        this.posY = posY;
        this.width = width;
        this.height = height;
    }

    /**
     * The x position of the bounds
     * @returns number
     */
    getPosX() {
        return this.posX;
    }

    /**
     * The y position of the bounds
     * @returns number
     */
    getPosY() {
        return this.posY;
    }

    /**
     * The width of the bounds
     * @returns number
     */
    getWidth() {
        return this.width;
    }

    /**
     * The height of the bounds
     * @returns number
     */
    getHeight() {
        return this.height;
    }

}

/**
 * Contains the data for the players moves
 */
class Move {
    constructor(from, to) {
        this.from = from;
        this.to = to;
    }

    /**
     * The tower the block was moved from
     * @returns number
     */
    getFrom() {
        return this.from;
    }

    /**
     * The tower the block was moved to
     * @returns number
     */
    getTo() {
        return this.to;
    }
}