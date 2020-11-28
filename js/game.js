class Boot extends Phaser.Scene {

    constructor() {
        super('boot');
    }

    init() {
        let element = document.createElement('style');

        document.head.appendChild(element);

        element.sheet.insertRule('@font-face { font-family: "bebas"; src: url("assets/fonts/bebas.ttf") format("truetype"); }', 0);
    }

    preload() {
        this.load.image('bg', 'assets/sky2.png');
        this.load.image('grid', 'assets/grid.png');
        this.load.script('webfont', 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js');

        this.load.audio('place', [
            'assets/audio/place.ogg',
            'assets/audio/place.m4a'
        ]);

        this.load.audio('miss', [
            'assets/audio/miss.ogg',
            'assets/audio/miss.m4a'
        ]);

        this.load.audio('gamelost', [
            'assets/audio/gamelost.ogg',
            'assets/audio/gamelost.m4a'
        ]);

        this.load.audio('gamewon', [
            'assets/audio/gamewon.ogg',
            'assets/audio/gamewon.m4a'
        ]);
    }

    create() {
        let scene = this.scene;

        WebFont.load({
            custom: {
                families: ['bebas']
            },
            active: function () {
                scene.start('instructions');
            }
        });
    }

}

class Instructions extends Phaser.Scene {

    constructor() {
        super('instructions');
    }

    create() {
        this.add.image(0, 0, 'bg').setOrigin(0, 0).setDisplaySize(config.width, config.height);
        this.add.image(0, 0, 'grid').setOrigin(0, 0).setDisplaySize(config.width, config.height);

        this.add.text(config.width / 2, config.height / 2, 'Space or Click to Start', { fontFamily: 'bebas', fontSize: 40, color: '#ffffff' })
            .setShadow(2, 2, "#333333", 2, false, true)
            .setOrigin(0.5, 0.5);

        this.input.keyboard.once('keydown_SPACE', this.start, this);
        this.input.once('pointerdown', this.start, this);
    }

    start() {
        this.scene.start('maingame');
    }

}

class Game extends Phaser.Scene {

    constructor() {
        super('maingame');

        this.grid;
        this.gridWidth = 10;
        this.gridHeight = 15;
        this.gridSize = 32;
        this.timer;
        this.offset = { x: config.width / 2 - this.gridSize * this.gridWidth / 2, y: config.height / 2 - this.gridSize * this.gridHeight / 2 };
    }

    init() {
        this.grid = [];
        this.currentBlocks = new Array(4).fill(0)
        this.board = new Array(this.gridHeight)
        for (let i = 0; i < this.board.length; i++) {
            this.board[i] = new Array(this.gridWidth).fill(null)
        }

        this.MinoShapes = [
            // I
            {
                "color": 0x00ffff, "rot": [
                    [[-1, 0], [0, 0], [1, 0], [2, 0]],
                    [[1, -1], [1, 0], [1, 1], [1, 2]],
                    [[-1, 1], [0, 1], [1, 1], [2, 1]],
                    [[0, -1], [0, 0], [0, 1], [0, 2]],
                ]
            },
            // O
            {
                "color": 0xffff00, "rot": [
                    [[0, -1], [1, -1], [0, 0], [1, 0]]
                ]
            },
            // Z
            {
                "color": 0xff0000, "rot": [
                    [[-1, -1], [0, -1], [0, 0], [1, 0]],
                    [[1, -1], [1, 0], [0, 0], [0, 1]],
                    [[-1, 0], [0, 0], [0, 1], [1, 1]],
                    [[0, -1], [0, 0], [-1, 0], [-1, 1]],
                ]
            },
            // S
            {
                "color": 0x00ff00, "rot": [
                    [[-1, 0], [0, 0], [0, -1], [1, -1]],
                    [[0, -1], [0, 0], [1, 0], [1, 1]],
                    [[-1, 1], [0, 1], [0, 0], [1, 0]],
                    [[-1, -1], [-1, 0], [0, 0], [0, 1]],
                ]
            },
            // J
            {
                "color": 0x0000ff, "rot": [
                    [[-1, 0], [0, 0], [1, 0], [-1, -1]],
                    [[0, -1], [0, 0], [0, 1], [1, -1]],
                    [[-1, 0], [0, 0], [1, 0], [1, 1]],
                    [[0, -1], [0, 0], [0, 1], [-1, 1]],
                ]
            },
            // L
            {
                "color": 0xFF9872, "rot": [
                    [[-1, 0], [0, 0], [1, 0], [1, -1]],
                    [[0, -1], [0, 0], [0, 1], [1, 1]],
                    [[-1, 0], [0, 0], [1, 0], [-1, 1]],
                    [[0, -1], [0, 0], [0, 1], [-1, -1]],
                ]
            },
            // T
            {
                "color": 0xFF00FF, "rot": [
                    [[-1, 0], [0, 0], [1, 0], [0, -1]],
                    [[0, -1], [0, 0], [0, 1], [1, 0]],
                    [[-1, 0], [0, 0], [1, 0], [0, 1]],
                    [[0, -1], [0, 0], [0, 1], [-1, 0]],
                ]
            },
        ]
    }

    create() {
        let ox = this.offset.x;
        let oy = this.offset.y;

        let gw = this.gridWidth;
        let gh = this.gridHeight;

        let size = this.gridSize;

        this.add.image(0, 0, 'bg').setOrigin(0, 0).setDisplaySize(config.width, config.height);
        this.add.image(0, 0, 'grid').setOrigin(0, 0).setDisplaySize(config.width, config.height);

        this.add.grid(ox, oy, gw * size, gh * size, size, size, 0x999999, 1, 0x666666).setOrigin(0);

        this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // this.timer = this.time.addEvent({ delay: this.speed, callback: this.drop, callbackScope: this, loop: true });

        this.createNewMino()
        this.input.keyboard.on('keydown', this.keyCallback, this);
    }
    keyCallback(event) {
        if (event.keyCode === Phaser.Input.Keyboard.KeyCodes.DOWN) {
            this.drop()
        } else {
            if (event.keyCode === Phaser.Input.Keyboard.KeyCodes.LEFT) {
                if (this.isMovable(-1, 0, 0).result) this.currentPos.x--
            } else if (event.keyCode === Phaser.Input.Keyboard.KeyCodes.RIGHT) {
                if (this.isMovable(1, 0, 0).result) this.currentPos.x++
            } else if (event.keyCode === Phaser.Input.Keyboard.KeyCodes.UP) {
                const { result, pos_list } = this.isMovable(0, 0, 1)
                if (result) {
                    this.currentPos.r = (this.currentPos.r + 1) % this.MinoShapes[this.currentShape].rot.length;
                } else {
                    for (let pos of pos_list) {
                        let dx = this.isMovableWithShift(-pos[0])
                        if (dx != 0) {
                            this.currentPos.x += dx
                            this.currentPos.r = (this.currentPos.r + 1) % this.MinoShapes[this.currentShape].rot.length;
                            break
                        }
                    }
                }
            } 
            this.moveCurrentMino()
        }
    }
    isMovableWithShift(dx) {
        const sign = (dx > 0) ? 1 : -1
        const value = dx * sign
        for (let i = 1; i <= value; i++) {
            if (this.isMovable(i * sign, 0, 1).result) return i * sign
        }
        return 0
    }
    moveCurrentMino() {
        let x = this.currentPos.x
        let y = this.currentPos.y
        let rot = this.currentPos.r
        rot = rot % this.MinoShapes[this.currentShape].rot.length
        const currentShape = this.MinoShapes[this.currentShape]
        _.zip(this.currentBlocks, currentShape.rot[rot]).forEach(([block, pos]) => {
            return this.moveRectangleTo(block, pos[0] + x, pos[1] + y)
        })
    }
    moveRectangleTo(block, x, y) {
        let ox = this.offset.x;
        let oy = this.offset.y;
        let size = this.gridSize;
        block.x = ox + size * x
        block.y = oy + size * y
    }
    drop() {
        // this.timer.remove(false);
        if (this.isMovable(0, 1, 0).result) {
            this.currentPos.y++
            this.justCreated = false
            this.moveCurrentMino()
        } else {
            if (this.justCreated) {
                this.gameOver()
                return
            }
            this.fixToBoard()
            this.removeCompletedLines()
            this.createNewMino()
            if (!this.isMovable(0, 0, 0).result) {
                this.moveCurrentMino()
                this.gameOver()
                return
            }
        }
    }
    fixToBoard() {
        let x = this.currentPos.x
        let y = this.currentPos.y
        let r = this.currentPos.r
        const currentShape = this.MinoShapes[this.currentShape]
        _.zip(this.currentBlocks, currentShape.rot[r]).forEach(([block, pos]) => {
            this.board[pos[1] + y][pos[0] + x] = block
        })
        this.sound.play('place');
    }
    createNewMino() {
        const number_of_kind = this.MinoShapes.length
        this.currentShape = Math.floor(Math.random() * number_of_kind)
        this.currentPos = { "x": this.gridWidth / 2 - 1, "y": 1, "r": 0 }
        this.createNewBlocks(this.MinoShapes[this.currentShape].color)
        this.moveCurrentMino()
        this.justCreated = true
    }
    createNewBlocks(color) {
        let size = this.gridSize;
        for (let i = 0; i < this.currentBlocks.length; i++) {
            this.currentBlocks[i] = this.add.rectangle(0, 0, size - 1, size - 1, color).setOrigin(0);
        }
    }
    isMovable(dx, dy, dr) {
        let x = this.currentPos.x + dx
        let y = this.currentPos.y + dy
        let r = this.currentPos.r + dr
        r = r % this.MinoShapes[this.currentShape].rot.length
        const currentShape = this.MinoShapes[this.currentShape]
        const pos_list = []
        for (const pos of currentShape.rot[r]) {
            if (this.blockExists(pos[0] + x, pos[1] + y)) pos_list.push(pos)
        }
        return { "result": pos_list.length === 0, pos_list }
    }
    blockExists(x, y) {
        if (x < 0 || x >= this.gridWidth || y >= this.gridHeight) return true
        return this.board[y][x] !== null
    }
    removeCompletedLines() {
        const completedLines = this.board.map((element, index) => {
            return { "index": index, "complete": element.every((cell) => (cell !== null)) }
        }).filter((element) => element.complete).map((element) => element.index)
        if (completedLines.length) {
            completedLines.forEach(i => this.disappearLine(i))
        }
    }
    disappearLine(lineToDisappear) {
        this.board[lineToDisappear].forEach(block => block.destroy())
        this.board.slice(0, lineToDisappear).forEach(line => {
            this.dropOneLineForEachObj(line)
        })
        this.board.copyWithin(1, 0, lineToDisappear)
        this.board[0] = new Array(this.gridWidth).fill(null)
        this.sound.play('miss');
    }
    dropOneLineForEachObj(objList) {
        objList.forEach(block => {
            if (block !== null) block.y += this.gridSize
        })
    }
    gameOver() {
        //this.timer.remove(false);
        this.input.keyboard.off('keydown', this.keyCallback);
        this.scene.pause();
        this.scene.run('gameOver');
    }
}

class GameOver extends Phaser.Scene {

    constructor() {
        super('gameOver');
    }

    create() {
        this.add.rectangle(config.width / 2, config.height / 2, config.width, config.height, 0x000000, 0.7);
        var title = 'GAME OVER!';
        this.add.text(400, 300, title, { fontFamily: 'bebas', fontSize: 80, color: '#ffffff' }).setShadow(2, 2, "#333333", 2, false, true).setOrigin(0.5);
        this.add.text(400, 500, 'Space or Click to try again', { fontFamily: 'bebas', fontSize: 26, color: '#ffffff' }).setShadow(2, 2, "#333333", 2, false, true).setOrigin(0.5);
        this.input.keyboard.once('keydown_SPACE', this.restart, this);
        this.input.once('pointerdown', this.restart, this);
        this.sound.play('gamelost');
    }

    restart() {
        this.scene.start('maingame');
    }
}

var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 720,
    parent: 'phaser-example',
    scene: [Boot, Instructions, Game, GameOver]
};

var game = new Phaser.Game(config);
