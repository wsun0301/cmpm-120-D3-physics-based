function addUniversalBackground(scene) {
    scene.background = scene.add.image(400, 350, "graphBackground");
    scene.background.setDisplaySize(800, 700);
    scene.background.setDepth(-1000);

    return scene.background;
}

class PreloadScene extends Phaser.Scene {
    constructor() {
        super("PreloadScene");
    }

    preload() {
        this.load.image("graphBackground", "assets/d3 background.png");
    }

    create() {
        this.scene.start("IntroScene");
    }
}

class IntroScene extends Phaser.Scene {
    constructor() {
        super("IntroScene");
    }

    create() {
        this.cameras.main.setBackgroundColor("#1e1e1e");
        this.cameras.main.fadeIn(800, 0, 0, 0);

        this.mazeCamera = this.cameras.main;
        this.mazeCamera.setOrigin(0.5, 0.5);

        this.uiCamera = this.cameras.add(0, 0, this.scale.width, this.scale.height);
        this.uiCamera.setScroll(0, 0);

        this.mazeObjects = [];
        this.uiObjects = [];

        this.background = addUniversalBackground(this);
        this.uiCamera.ignore(this.background);

        this.started = false;
        this.mazeAngle = 0;
        this.rotateSpeed = 1.2;

        this.physics.world.gravity.y = 500;

        this.keys = this.input.keyboard.addKeys({
            left: Phaser.Input.Keyboard.KeyCodes.LEFT,
            right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
            a: Phaser.Input.Keyboard.KeyCodes.A,
            d: Phaser.Input.Keyboard.KeyCodes.D,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE
        });

        this.createTitleText();
        this.createTutorialMaze();

        this.physics.add.collider(this.ball, this.walls);

        this.physics.add.overlap(this.ball, this.exit, () => {
            this.finishTutorial();
        });
    }

    createTitleText() {
        const title = this.add.text(400, 70, "TILT", {
            fontSize: "64px",
            color: "#222222",
            fontFamily: "Arial"
        }).setOrigin(0.5);

        const subtitle = this.add.text(400, 130, "Rotate the maze. Guide the ball to the exit.", {
            fontSize: "22px",
            color: "#444444",
            fontFamily: "Arial"
        }).setOrigin(0.5);

        this.controlsText = this.add.text(
            400,
            540,
            "A / LEFT = Tilt Left\nD / RIGHT = Tilt Right\nReach the green exit as fast as possible.",
            {
                fontSize: "22px",
                color: "#222222",
                fontFamily: "Arial",
                align: "center"
            }
        ).setOrigin(0.5);

        this.startText = this.add.text(400, 620, "Press SPACE to begin", {
            fontSize: "26px",
            color: "#8a6d00",
            fontFamily: "Arial"
        }).setOrigin(0.5);

        this.uiObjects.push(title, subtitle, this.controlsText, this.startText);

        this.mazeCamera.ignore(this.uiObjects);

        this.uiObjects.forEach((obj, index) => {
            obj.alpha = 0;

            this.tweens.add({
                targets: obj,
                alpha: 1,
                y: obj.y - 10,
                duration: 800,
                delay: index * 120,
                ease: "Power2"
            });
        });
    }

    createTutorialMaze() {
        this.mazeCenterX = 400;
        this.mazeCenterY = 330;

        this.wallList = [];
        this.walls = this.physics.add.staticGroup();

        this.createWall(400, 250, 300, 20);
        this.createWall(400, 410, 300, 20);
        this.createWall(250, 330, 20, 180);
        this.createWall(550, 330, 20, 180);

        this.createWall(350, 330, 20, 80);
        this.createWall(450, 290, 20, 100);

        // Create ball as a circle shape
        this.ball = this.add.circle(300, 330, 14, 0x0000ff);
        this.physics.add.existing(this.ball);

        this.ball.body.setCircle(14);
        this.ball.body.setBounce(0.1);
        this.ball.body.setDrag(40, 40);
        this.ball.body.setMaxVelocity(350, 350);
        this.ball.body.setCollideWorldBounds(true);

        // Create exit as a green circle shape
        this.exit = this.add.circle(510, 370, 24, 0x00ff66);
        this.physics.add.existing(this.exit, true);

        this.exit.body.setCircle(24);

        this.mazeObjects.push(this.ball);
        this.mazeObjects.push(this.exit);

        this.uiCamera.ignore(this.mazeObjects);
    }

    createWall(x, y, width, height) {
        const wall = this.add.rectangle(x, y, width, height, 0x888888);
        this.physics.add.existing(wall, true);
        this.walls.add(wall);
        this.wallList.push(wall);
        this.mazeObjects.push(wall);
        return wall;
    }

    update() {
        if (!this.started) {
            if (Phaser.Input.Keyboard.JustDown(this.keys.space)) {
                this.started = true;
                this.startText.setText("Guide the ball into the green exit!");
            }

            return;
        }

        let rotationAmount = 0;

        if (this.keys.left.isDown || this.keys.a.isDown) {
            rotationAmount = -this.rotateSpeed;
        } else if (this.keys.right.isDown || this.keys.d.isDown) {
            rotationAmount = this.rotateSpeed;
        }

        if (rotationAmount !== 0) {
            this.rotateMaze(rotationAmount);
        }

        if (this.background) {
            this.background.rotation = -this.mazeCamera.rotation;
        }
    }

    rotateMaze(degrees) {
        const newAngle = Phaser.Math.Clamp(this.mazeAngle + degrees, -35, 35);

        if (newAngle === this.mazeAngle) {
            return;
        }

        this.mazeAngle = newAngle;

        const radians = Phaser.Math.DegToRad(this.mazeAngle);

        const gravityPower = 500;

        this.physics.world.gravity.x = Math.sin(radians) * gravityPower;
        this.physics.world.gravity.y = Math.cos(radians) * gravityPower;

        this.mazeCamera.rotation = Phaser.Math.DegToRad(this.mazeAngle * 0.5);

    }

    finishTutorial() {
        if (this.finished) {
            return;
        }

        this.finished = true;
        this.physics.pause();

        const finishText = this.add.text(400, 330, "Nice!\nNow escape the real mazes.", {
            fontSize: "36px",
            color: "#ffffff",
            fontFamily: "Arial",
            align: "center",
            backgroundColor: "#000000",
            padding: {
                x: 20,
                y: 20
            }
        }).setOrigin(0.5);

        // Put the finish text on the UI layer only
        this.uiObjects.push(finishText);
        this.mazeCamera.ignore(finishText);

        finishText.alpha = 0;

        this.tweens.add({
            targets: finishText,
            alpha: 1,
            y: finishText.y - 10,
            duration: 600,
            ease: "Power2"
        });

        this.time.delayedCall(1500, () => {
            this.scene.start("Level1Scene");
        });
    }
}

const config = {
    type: Phaser.AUTO,

    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 800,
        height: 700
    },

    backgroundColor: "#1e1e1e",

    physics: {
        default: "arcade",
        arcade: {
            gravity: {
                y: 500
            },
            debug: false
        }
    },

    scene: [
        PreloadScene,
        IntroScene
    ]
};

const game = new Phaser.Game(config);