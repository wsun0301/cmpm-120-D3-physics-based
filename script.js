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
        this.load.audio("bounceSound", "assets/soft_bounce.wav");
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

        this.bounceSound = this.sound.add("bounceSound");
        this.mazeObjects = [];
        this.uiObjects = [];

        this.background = addUniversalBackground(this);
        this.uiCamera.ignore(this.background);

        this.started = false;
        this.mazeAngle = 0;
        this.rotateSpeed = 1.2;

        this.lastBounceTime = 0;
        this.prevBallVelocity = new Phaser.Math.Vector2(0, 0);

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

        this.physics.add.collider(this.ball, this.walls, () => {
            this.playBounceSound();
        });

        this.physics.add.overlap(this.ball, this.exit, () => {
            this.finishTutorial();
        });
    }

    playBounceSound() {
        if (!this.started || this.finished) {
            return;
        }

        const body = this.ball.body;
        const currentVelocity = body.velocity;
        const previousVelocity = this.prevBallVelocity;

        const speed = currentVelocity.length();
        const previousSpeed = previousVelocity.length();

        // Ignore slow rolling or tiny bumps
        if (speed < 20 || previousSpeed < 20) {
            return;
        }

        // Check if velocity direction changed a lot.
        // A bounce usually has a strong direction change.
        const currentDir = currentVelocity.clone().normalize();
        const previousDir = previousVelocity.clone().normalize();

        const dot = currentDir.dot(previousDir);

        // dot close to 1 = same direction
        // dot close to 0 = sharp turn
        // dot below 0 = reversed direction
        const bounced = dot < 0.65;

        if (!bounced) {
            return;
        }

        // Cooldown to prevent spam
        if (this.time.now - this.lastBounceTime < 180) {
            return;
        }

        this.lastBounceTime = this.time.now;
        this.bounceSound.play();
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

        this.createWall(400, 250, 500, 20);
        this.createWall(400, 410, 300, 20);
        this.createWall(480-20, 360+30, 50, 20);
        this.createWall(250, 330, 20, 180);
        this.createWall(550, 330, 20, 180);

        this.createWall(350-10, 350+5, 20, 110);
        this.createWall(450-10, 350+5, 20, 110);

        // Create ball as a circle shape
        this.ball = this.add.circle(350-10, 270, 14, 0x0000ff);
        this.physics.add.existing(this.ball);

        this.ball.body.setCircle(14);
        this.ball.body.setBounce(0.5);
        this.ball.body.setDrag(25, 25);
        this.ball.body.setMaxVelocity(350, 350);
        this.ball.body.setCollideWorldBounds(true);

        // Create exit as a green circle shape
        this.exit = this.add.circle(520-10, 385, 14, 0x00aa55);
        this.physics.add.existing(this.exit, true);

        this.exit.body.setCircle(14);

        this.mazeObjects.push(this.ball);
        this.mazeObjects.push(this.exit);

        this.uiCamera.ignore(this.mazeObjects);
    }

    createWall(x, y, width, height) {
        const wall = this.add.rectangle(x, y, width, height, 0x333333);
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
        if (this.ball && this.ball.body) {
                this.prevBallVelocity.set(
                    this.ball.body.velocity.x,
                    this.ball.body.velocity.y
            );
        }
    }

    rotateMaze(degrees) {
        this.mazeAngle += degrees;

        // Keeps the angle between 0 and 360
        this.mazeAngle = Phaser.Math.Wrap(this.mazeAngle, 0, 360);

        const radians = Phaser.Math.DegToRad(this.mazeAngle);

        const gravityPower = 500;

        // Real gameplay tilt
        this.physics.world.gravity.x = Math.sin(radians) * gravityPower;
        this.physics.world.gravity.y = Math.cos(radians) * gravityPower;

        // Visual maze rotation
        this.mazeCamera.rotation = radians;
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

class Level1Scene extends Phaser.Scene {
    constructor() {
        super("Level1Scene");
    }

    create() {
        this.cameras.main.setBackgroundColor("#ffffff");
        this.cameras.main.fadeIn(800, 0, 0, 0);

        this.mazeCamera = this.cameras.main;
        this.mazeCamera.setOrigin(0.5, 0.5);

        this.uiCamera = this.cameras.add(0, 0, this.scale.width, this.scale.height);
        this.uiCamera.setScroll(0, 0);

        this.mazeObjects = [];
        this.uiObjects = [];

        this.background = addUniversalBackground(this);
        this.uiCamera.ignore(this.background);

        this.bounceSound = this.sound.add("bounceSound");

        this.levelStartTime = 0;
        this.started = false;
        this.finished = false;
        this.mazeAngle = 0;
        this.rotateSpeed = 1.2;

        this.finalTime = 0;

        this.lastBounceTime = 0;
        this.prevBallVelocity = new Phaser.Math.Vector2(0, 0);

        this.physics.world.gravity.x = 0;
        this.physics.world.gravity.y = 500;

        this.keys = this.input.keyboard.addKeys({
            left: Phaser.Input.Keyboard.KeyCodes.LEFT,
            right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
            a: Phaser.Input.Keyboard.KeyCodes.A,
            d: Phaser.Input.Keyboard.KeyCodes.D,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE
        });

        this.createUI();
        this.createLevelMaze(); 

        this.physics.add.collider(this.ball, this.walls, () => {
            this.playBounceSound();
        });

        this.physics.add.overlap(this.ball, this.exit, () => {
            this.finishLevel();
        });
    }

    playBounceSound() {
        if (!this.started || this.finished) {
            return;
        }

        const body = this.ball.body;
        const currentVelocity = body.velocity;
        const previousVelocity = this.prevBallVelocity;

        const speed = currentVelocity.length();
        const previousSpeed = previousVelocity.length();

        // Ignore slow rolling or tiny bumps
        if (speed < 20 || previousSpeed < 20) {
            return;
        }

        // Check if velocity direction changed a lot.
        // A bounce usually has a strong direction change.
        const currentDir = currentVelocity.clone().normalize();
        const previousDir = previousVelocity.clone().normalize();

        const dot = currentDir.dot(previousDir);

        // dot close to 1 = same direction
        // dot close to 0 = sharp turn
        // dot below 0 = reversed direction
        const bounced = dot < 0.65;

        if (!bounced) {
            return;
        }

        // Cooldown to prevent spam
        if (this.time.now - this.lastBounceTime < 180) {
            return;
        }

        this.lastBounceTime = this.time.now;
        this.bounceSound.play();
    }

    createUI() {
        this.levelText = this.add.text(400, 45, "LEVEL 1", {
            fontSize: "42px",
            color: "#222222",
            fontFamily: "Arial"
        }).setOrigin(0.5);

        this.timerText = this.add.text(25, 25, "Time: 0.00", {
            fontSize: "26px",
            color: "#222222",
            fontFamily: "Arial"
        });

        this.instructionText = this.add.text(400, 655, "Press SPACE to start Level 1", {
            fontSize: "22px",
            color: "#444444",
            fontFamily: "Arial"
        }).setOrigin(0.5);

        this.uiObjects.push(this.levelText, this.timerText, this.instructionText);

        this.mazeCamera.ignore(this.uiObjects);

        this.uiObjects.forEach((obj, index) => {
            obj.alpha = 0;

            this.tweens.add({
                targets: obj,
                alpha: 1,
                y: obj.y - 8,
                duration: 700,
                delay: index * 100,
                ease: "Power2"
            });
        });
    }

    createLevelMaze() {
        this.mazeCenterX = 400;
        this.mazeCenterY = 350;

        this.wallList = [];
        this.walls = this.physics.add.staticGroup();

        const T = 28; // wall thickness

        // Outer maze border
        this.createWall(400, 150, 520, T); // top
        this.createWall(400, 550, 520, T); // bottom
        this.createWall(140, 350, T, 428); // left
        this.createWall(660, 350, T, 428); // right

        // Inner maze walls
        this.createWall(230, 450,T, 200);
        this.createWall(219, 350, 50, T);
        this.createWall(320, 300, T, 300);
        this.createWall(420 , 400, T, 300);
        this.createWall(456, 250, 100, T);
        this.createWall(580, 350, 150, T);
        this.createWall(510, 411, T, 150);

        // Ball
        this.ball = this.add.circle(190, 400 , 14, 0x0000ff);
        this.physics.add.existing(this.ball);

        this.ball.body.setCircle(14);
        this.ball.body.setBounce(0.5);
        this.ball.body.setDrag(25, 25);
        this.ball.body.setMaxVelocity(340, 340);
        this.ball.body.setCollideWorldBounds(true);

        // Exit
        this.exit = this.add.circle(580, 500, 24, 0x00aa55);
        this.physics.add.existing(this.exit, true);
        this.exit.body.setCircle(24);

        this.mazeObjects.push(this.ball);
        this.mazeObjects.push(this.exit);

        this.uiCamera.ignore(this.mazeObjects);
    }

    createWall(x, y, width, height) {
        const wall = this.add.rectangle(
            Math.round(x),
            Math.round(y),
            Math.round(width),
            Math.round(height),
            0x2b2b2b
        );

        wall.setOrigin(0.5);
        wall.setDepth(5);

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
                this.levelStartTime = this.time.now;
                this.timerText.setText("Time: 0.00");
                this.instructionText.setText("Tilt the maze and guide the ball to the green exit.");
            }

            if (this.background) {
                this.background.rotation = -this.mazeCamera.rotation;
            }

            return;
        }

        const currentTime = (this.time.now - this.levelStartTime) / 1000;
        this.timerText.setText("Time: " + currentTime.toFixed(2));

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

        if (this.ball && this.ball.body) {
            this.prevBallVelocity.set(
                this.ball.body.velocity.x,
                this.ball.body.velocity.y
            );
        }
    }

    rotateMaze(degrees) {
        this.mazeAngle += degrees;

        // Keeps the number from getting huge forever
        this.mazeAngle = Phaser.Math.Wrap(this.mazeAngle, 0, 360);

        const radians = Phaser.Math.DegToRad(this.mazeAngle);

        const gravityPower = 500;

        // Real gameplay tilt
        this.physics.world.gravity.x = Math.sin(radians) * gravityPower;
        this.physics.world.gravity.y = Math.cos(radians) * gravityPower;

        // Visual maze rotation
        this.mazeCamera.rotation = radians;
    }

    finishLevel() {
        if (this.finished) {
            return;
        }

        this.finished = true;
        this.finalTime = (this.time.now - this.levelStartTime) / 1000;

        this.physics.pause();

        this.time.delayedCall(800, () => {
            this.scene.start("Level1SummaryScene", {
                time: this.finalTime
            });
        });
    }
}

class Level1SummaryScene extends Phaser.Scene {
    constructor() {
        super("Level1SummaryScene");
    }

    init(data) {
        this.levelTime = data.time || 0;
    }

    create() {
        this.cameras.main.setBackgroundColor("#ffffff");
        this.cameras.main.fadeIn(800, 0, 0, 0);

        addUniversalBackground(this);

        let rank = "Bronze";

        if (this.levelTime <= 15) {
            rank = "Gold";
        } else if (this.levelTime <= 25) {
            rank = "Silver";
        }

        this.add.text(400, 160, "LEVEL 1 COMPLETE", {
            fontSize: "48px",
            color: "#222222",
            fontFamily: "Arial"
        }).setOrigin(0.5);

        this.add.text(400, 260, "Time: " + this.levelTime.toFixed(2) + " seconds", {
            fontSize: "34px",
            color: "#222222",
            fontFamily: "Arial"
        }).setOrigin(0.5);

        this.add.text(400, 330, "Score: " + rank, {
            fontSize: "40px",
            color: "#8a6d00",
            fontFamily: "Arial"
        }).setOrigin(0.5);

        this.add.text(400, 430, "Lower time = better score", {
            fontSize: "24px",
            color: "#444444",
            fontFamily: "Arial"
        }).setOrigin(0.5);

        this.add.text(400, 560, "Press SPACE to continue", {
            fontSize: "28px",
            color: "#222222",
            fontFamily: "Arial"
        }).setOrigin(0.5);

        this.keys = this.input.keyboard.addKeys({
            space: Phaser.Input.Keyboard.KeyCodes.SPACE
        });
    }

    update() {
        if (Phaser.Input.Keyboard.JustDown(this.keys.space)) {
            // Change this to Level2Scene once Level 2 exists
            this.scene.start("Level2Scene");
        }
    }
}

class Level2Scene extends Phaser.Scene {
    constructor() {
        super("Level2Scene");
    }

    create() {
        this.cameras.main.setBackgroundColor("#ffffff");
        this.cameras.main.fadeIn(800, 0, 0, 0);

        this.mazeCamera = this.cameras.main;
        this.mazeCamera.setOrigin(0.5, 0.5);

        this.uiCamera = this.cameras.add(0, 0, this.scale.width, this.scale.height);
        this.uiCamera.setScroll(0, 0);

        this.bounceSound = this.sound.add("bounceSound");

        this.mazeObjects = [];
        this.uiObjects = [];

        this.background = addUniversalBackground(this);
        this.uiCamera.ignore(this.background);

        this.levelStartTime = 0;
        this.started = false;
        this.finished = false;
        this.mazeAngle = 0;
        this.rotateSpeed = 1.2;
        this.spikesHit = 0;

        this.lastBounceTime = 0;
        this.prevBallVelocity = new Phaser.Math.Vector2(0, 0);

        this.finalTime = 0;

        this.physics.world.gravity.x = 0;
        this.physics.world.gravity.y = 500;

        this.keys = this.input.keyboard.addKeys({
            left: Phaser.Input.Keyboard.KeyCodes.LEFT,
            right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
            a: Phaser.Input.Keyboard.KeyCodes.A,
            d: Phaser.Input.Keyboard.KeyCodes.D,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE
        });

        this.createUI();
        this.createLevelMaze(); 

        this.physics.add.collider(this.ball, this.walls, () => {
            this.playBounceSound();
        });

        this.physics.add.overlap(this.ball, this.exit, () => {
            this.finishLevel();
        });

        this.spikes.forEach((spike) => {
            this.physics.add.overlap(this.ball, spike, () => {
                this.hitSpike();
            });
        });
    }

    playBounceSound() {
        if (!this.started || this.finished) {
            return;
        }

        const body = this.ball.body;
        const currentVelocity = body.velocity;
        const previousVelocity = this.prevBallVelocity;

        const speed = currentVelocity.length();
        const previousSpeed = previousVelocity.length();

        // Ignore slow rolling or tiny bumps
        if (speed < 20 || previousSpeed < 20) {
            return;
        }

        // Check if velocity direction changed a lot.
        // A bounce usually has a strong direction change.
        const currentDir = currentVelocity.clone().normalize();
        const previousDir = previousVelocity.clone().normalize();

        const dot = currentDir.dot(previousDir);

        // dot close to 1 = same direction
        // dot close to 0 = sharp turn
        // dot below 0 = reversed direction
        const bounced = dot < 0.65;

        if (!bounced) {
            return;
        }

        // Cooldown to prevent spam
        if (this.time.now - this.lastBounceTime < 180) {
            return;
        }

        this.lastBounceTime = this.time.now;
        this.bounceSound.play();
    }

    createUI() {
        this.levelText = this.add.text(400, 45, "LEVEL 2", {
            fontSize: "42px",
            color: "#222222",
            fontFamily: "Arial"
        }).setOrigin(0.5);

        this.timerText = this.add.text(25, 25, "Time: 0.00", {
            fontSize: "26px",
            color: "#222222",
            fontFamily: "Arial"
        });

        this.instructionText = this.add.text(400, 655, "Press SPACE to start Level 2", {
            fontSize: "22px",
            color: "#444444",
            fontFamily: "Arial"
        }).setOrigin(0.5);

        this.spikesText = this.add.text(25, 60, "Spikes Hit: 0", {
            fontSize: "24px",
            color: "#222222",
            fontFamily: "Arial"
        });

        this.uiObjects.push(this.levelText, this.timerText, this.instructionText, this.spikesText);

        this.mazeCamera.ignore(this.uiObjects);

        this.uiObjects.forEach((obj, index) => {
            obj.alpha = 0;

            this.tweens.add({
                targets: obj,
                alpha: 1,
                y: obj.y - 8,
                duration: 700,
                delay: index * 100,
                ease: "Power2"
            });
        });
    }

    createLevelMaze() {
        this.mazeCenterX = 400;
        this.mazeCenterY = 350;

        this.wallList = [];
        this.spikes = [];
        this.walls = this.physics.add.staticGroup();

        const T = 28; // wall thickness

        // Outer maze border
        this.createWall(400, 150, 520, T); // top
        this.createWall(400, 550, 520, T); // bottom
        this.createWall(140, 350, T, 428); // left
        this.createWall(660, 350, T, 428); // right

        // Inner maze walls
        this.createWall(230,250,200,T);
        this.createWall(220 ,430,150,T);
        this.createWall(320, 234, T, 60);
        this.createWall(400, 250,T, 200);
        this.createWall(480, 400, T, 300);
        this.createWall(570, 400, 90, T);

        // Spikes
        this.spikes.push(this.createSpikes(290, 525));
        this.spikes.push(this.createSpikes(320, 525));
        this.spikes.push(this.createSpikes(350, 525));
        this.spikes.push(this.createSpikes(380, 525));
        this.spikes.push(this.createSpikes(410, 525));
        this.spikes.push(this.createSpikes(570, 375));


        // Ball
        this.ball = this.add.circle(200, 200, 14, 0x0000ff);
        this.physics.add.existing(this.ball);

        this.ball.body.setCircle(14);
        this.ball.body.setBounce(0.5);
        this.ball.body.setDrag(25, 25);
        this.ball.body.setMaxVelocity(340, 340);
        this.ball.body.setCollideWorldBounds(true);

        // Exit
        this.exit = this.add.circle(580, 500, 24, 0x00aa55);
        this.physics.add.existing(this.exit, true);
        this.exit.body.setCircle(24);

        this.mazeObjects.push(this.ball);
        this.mazeObjects.push(this.exit);

        this.uiCamera.ignore(this.mazeObjects);
    }

    createWall(x, y, width, height) {
        const wall = this.add.rectangle(
            Math.round(x),
            Math.round(y),
            Math.round(width),
            Math.round(height),
            0x2b2b2b
        );

        wall.setOrigin(0.5);
        wall.setDepth(5);

        this.physics.add.existing(wall, true);

        this.walls.add(wall);
        this.wallList.push(wall);
        this.mazeObjects.push(wall);

        return wall;
    }
    
    createSpikes(x, y, rotation = 0) {
        // Draw spike shape
        const spike = this.add.triangle(
            x,
            y,
            0, 28,
            18, 0,
            36, 28,
            0x2b2b2b
        );

        spike.setOrigin(0.5);
        spike.rotation = rotation;
        spike.setDepth(6);

        // Add static physics body
        this.physics.add.existing(spike, true);

        // Make hitbox smaller than full triangle so it feels fair
        spike.body.setSize(28, 22);
        spike.body.setOffset(4, 6);

        // Add to maze objects so UI camera ignores it
        this.mazeObjects.push(spike);

        return spike;
    }


    update() {

        if (!this.started) {
            if (Phaser.Input.Keyboard.JustDown(this.keys.space)) {
                this.started = true;
                this.levelStartTime = this.time.now;
                this.timerText.setText("Time: 0.00");
                this.instructionText.setText("Tilt the maze and guide the ball to the green exit.");
            }

            if (this.background) {
                this.background.rotation = -this.mazeCamera.rotation;
            }

            return;
        }

        const currentTime = (this.time.now - this.levelStartTime) / 1000;
        this.timerText.setText("Time: " + currentTime.toFixed(2));

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

        if (this.ball && this.ball.body) {
            this.prevBallVelocity.set(
                this.ball.body.velocity.x,
                this.ball.body.velocity.y
            );
        }
    }

    rotateMaze(degrees) {
        this.mazeAngle += degrees;

        // Keeps the number from getting huge forever
        this.mazeAngle = Phaser.Math.Wrap(this.mazeAngle, 0, 360);

        const radians = Phaser.Math.DegToRad(this.mazeAngle);

        const gravityPower = 500;

        // Real gameplay tilt
        this.physics.world.gravity.x = Math.sin(radians) * gravityPower;
        this.physics.world.gravity.y = Math.cos(radians) * gravityPower;

        // Visual maze rotation
        this.mazeCamera.rotation = radians;
    }

    hitSpike() {
        if (this.finished || !this.started) {
            return;
        }

        this.spikesHit++;

    
        this.spikesText.setText("Spikes Hit: " + this.spikesHit);
  

        // Reset ball to Level 2 start position
        this.ball.body.setVelocity(0, 0);
        this.ball.x = 200;
        this.ball.y = 200;
    }

    finishLevel() {
        if (this.finished) {
            return;
        }

        this.finished = true;
        this.finalTime = (this.time.now - this.levelStartTime) / 1000;

        this.physics.pause();

        this.time.delayedCall(800, () => {
            this.scene.start("Level2SummaryScene", {
                time: this.finalTime,
                spikesHit: this.spikesHit
            });
        });
    }
}

class Level2SummaryScene extends Phaser.Scene {
    constructor() {
        super("Level2SummaryScene");
    }

    init(data) {
        this.levelTime = data.time || 0;
        this.spikesHit = data.spikesHit || 0;
    }

    create() {
        this.cameras.main.setBackgroundColor("#ffffff");
        this.cameras.main.fadeIn(800, 0, 0, 0);

        addUniversalBackground(this);

        let rank = "Bronze";

        if (this.levelTime <= 20 && this.spikesHit === 0) {
            rank = "Gold";
        } else if (this.levelTime <= 35 && this.spikesHit <= 2) {
            rank = "Silver";
        }

        const penalty = this.spikesHit * 5;
        const finalScoreTime = this.levelTime + penalty;

        this.add.text(400, 130, "LEVEL 2 COMPLETE", {
            fontSize: "48px",
            color: "#222222",
            fontFamily: "Arial"
        }).setOrigin(0.5);

        this.add.text(400, 230, "Time: " + this.levelTime.toFixed(2) + " seconds", {
            fontSize: "32px",
            color: "#222222",
            fontFamily: "Arial"
        }).setOrigin(0.5);

        this.add.text(400, 290, "Spikes Hit: " + this.spikesHit, {
            fontSize: "32px",
            color: "#aa2222",
            fontFamily: "Arial"
        }).setOrigin(0.5);

        this.add.text(400, 350, "Penalty: +" + penalty + ".00 seconds", {
            fontSize: "28px",
            color: "#444444",
            fontFamily: "Arial"
        }).setOrigin(0.5);

        this.add.text(400, 420, "Final Score Time: " + finalScoreTime.toFixed(2) + " seconds", {
            fontSize: "34px",
            color: "#222222",
            fontFamily: "Arial"
        }).setOrigin(0.5);

        this.add.text(400, 490, "Rank: " + rank, {
            fontSize: "40px",
            color: "#8a6d00",
            fontFamily: "Arial"
        }).setOrigin(0.5);

        this.add.text(400, 600, "Press SPACE to continue", {
            fontSize: "28px",
            color: "#222222",
            fontFamily: "Arial"
        }).setOrigin(0.5);

        this.keys = this.input.keyboard.addKeys({
            space: Phaser.Input.Keyboard.KeyCodes.SPACE
        });
    }

    update() {
        if (Phaser.Input.Keyboard.JustDown(this.keys.space)) {
            // Change this to Level3Scene once Level 3 exists
            this.scene.start("Level3Scene");
        }
    }
}

class Level3Scene extends Phaser.Scene {
    constructor() {
        super("Level3Scene");
    }

    create() {
        this.cameras.main.setBackgroundColor("#ffffff");
        this.cameras.main.fadeIn(800, 0, 0, 0);

        this.mazeCamera = this.cameras.main;
        this.mazeCamera.setOrigin(0.5, 0.5);

        this.uiCamera = this.cameras.add(0, 0, this.scale.width, this.scale.height);
        this.uiCamera.setScroll(0, 0);

        this.mazeObjects = [];
        this.uiObjects = [];

        this.bounceSound = this.sound.add("bounceSound");

        this.background = addUniversalBackground(this);
        this.uiCamera.ignore(this.background);

        this.levelStartTime = 0;
        this.started = false;
        this.finished = false;
        this.checkpointCollected = false;
        this.mazeAngle = 0;
        this.rotateSpeed = 1.2;
        this.spikesHit = 0;

        this.lastBounceTime = 0;
        this.prevBallVelocity = new Phaser.Math.Vector2(0, 0);

        this.finalTime = 0;

        this.physics.world.gravity.x = 0;
        this.physics.world.gravity.y = 500;

        this.keys = this.input.keyboard.addKeys({
            left: Phaser.Input.Keyboard.KeyCodes.LEFT,
            right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
            a: Phaser.Input.Keyboard.KeyCodes.A,
            d: Phaser.Input.Keyboard.KeyCodes.D,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE
        });

        this.createUI();
        this.createLevelMaze(); 

        this.physics.add.collider(this.ball, this.walls, () => {
            this.playBounceSound();
        });

        this.physics.add.overlap(this.ball, this.checkpoint, () => {
            this.collectCheckpoint();
        });

        this.physics.add.overlap(this.ball, this.exit, () => {
            if (this.checkpointCollected) {
                this.finishLevel();
            } else {
                this.showNeedCheckpointText();
            }
        });

        this.spikes.forEach((spike) => {
            this.physics.add.overlap(this.ball, spike, () => {
                this.hitSpike();
            });
        });
    }

    playBounceSound() {
        if (!this.started || this.finished) {
            return;
        }

        const body = this.ball.body;
        const currentVelocity = body.velocity;
        const previousVelocity = this.prevBallVelocity;

        const speed = currentVelocity.length();
        const previousSpeed = previousVelocity.length();

        // Ignore slow rolling or tiny bumps
        if (speed < 20 || previousSpeed < 20) {
            return;
        }

        // Check if velocity direction changed a lot.
        // A bounce usually has a strong direction change.
        const currentDir = currentVelocity.clone().normalize();
        const previousDir = previousVelocity.clone().normalize();

        const dot = currentDir.dot(previousDir);

        // dot close to 1 = same direction
        // dot close to 0 = sharp turn
        // dot below 0 = reversed direction
        const bounced = dot < 0.65;

        if (!bounced) {
            return;
        }

        // Cooldown to prevent spam
        if (this.time.now - this.lastBounceTime < 180) {
            return;
        }

        this.lastBounceTime = this.time.now;
        this.bounceSound.play();
    }

    createUI() {
        this.levelText = this.add.text(400, 45, "LEVEL 3", {
            fontSize: "42px",
            color: "#222222",
            fontFamily: "Arial"
        }).setOrigin(0.5);

        this.timerText = this.add.text(25, 25, "Time: 0.00", {
            fontSize: "26px",
            color: "#222222",
            fontFamily: "Arial"
        });

        this.instructionText = this.add.text(400, 655, "Press SPACE to start Level 3", {
            fontSize: "22px",
            color: "#444444",
            fontFamily: "Arial"
        }).setOrigin(0.5);

        this.spikesText = this.add.text(25, 60, "Spikes Hit: 0", {
            fontSize: "24px",
            color: "#222222",
            fontFamily: "Arial"
        });
        this.checkpointText = this.add.text(25, 90, "Checkpoint: Needed", {
            fontSize: "22px",
            color: "#222222",
            fontFamily: "Arial"
        });

        this.uiObjects.push(this.levelText, this.timerText, this.instructionText, this.spikesText,this.checkpointText);

        this.mazeCamera.ignore(this.uiObjects);

        this.uiObjects.forEach((obj, index) => {
            obj.alpha = 0;

            this.tweens.add({
                targets: obj,
                alpha: 1,
                y: obj.y - 8,
                duration: 700,
                delay: index * 100,
                ease: "Power2"
            });
        });
    }

    createLevelMaze() {
        this.mazeCenterX = 400;
        this.mazeCenterY = 350;

        this.wallList = [];
        this.spikes = [];
        this.walls = this.physics.add.staticGroup();

        const T = 28; // wall thickness

        // Outer maze border
        this.createWall(400, 150, 520, T); // top
        this.createWall(400, 550, 520, T); // bottom
        this.createWall(140, 350, T, 428); // left
        this.createWall(660, 350, T, 428); // right

        //moving platform
        this.createMovingPlatform(380, 250, 100, T, 0, 150, 3000);

        // Inner maze walls
        this.createWall(230,250,200,T);
        this.createWall(230,400,200,T);
        this.createWall(443, 310, T, 300);
        this.createWall(500, 400 , T, 300);
        this.createWall(560, 230, T, 150);
        this.createWall(557, 400, 90, T);
        this.createWall(600, 384, T, 60);
        // Spikes
        this.spikes.push(this.createSpikes(420, 220, Math.PI / -2));
        this.spikes.push(this.createSpikes(160, 360, Math.PI / 2));
        this.spikes.push(this.createSpikes(500, 175, Math.PI / 1));
        this.spikes.push(this.createSpikes(610, 175, Math.PI / 1));
        this.spikes.push(this.createSpikes(175, 525));
        this.spikes.push(this.createSpikes(175+30, 525));
        this.spikes.push(this.createSpikes(175+30+30, 525));
        this.spikes.push(this.createSpikes(175+30+30+30, 525));
        this.spikes.push(this.createSpikes(175+30+30+30+30, 525));



        // Ball
        this.ball = this.add.circle(200, 200, 14, 0x0000ff);
        this.physics.add.existing(this.ball);

        this.ball.body.setCircle(14);
        this.ball.body.setBounce(0.5);
        this.ball.body.setDrag(25, 25);
        this.ball.body.setMaxVelocity(340, 340);
        this.ball.body.setCollideWorldBounds(true);

        // Checkpoint
        this.checkpoint = this.add.circle(200, 360, 18, 0xffcc00);
        this.physics.add.existing(this.checkpoint, true);
        this.checkpoint.body.setCircle(18);

        this.mazeObjects.push(this.checkpoint);
        // Exit
        this.exit = this.add.circle(580, 500, 24, 0x00aa55);
        this.physics.add.existing(this.exit, true);
        this.exit.body.setCircle(24);

        this.mazeObjects.push(this.ball);
        this.mazeObjects.push(this.exit);

        this.uiCamera.ignore(this.mazeObjects);
    }

    collectCheckpoint() {
        if (this.checkpointCollected || !this.started || this.finished) {
            return;
        }

        this.checkpointCollected = true;

        // Hide checkpoint after collection
        this.checkpoint.setVisible(false);
        this.checkpoint.body.enable = false;

        if (this.checkpointText) {
            this.checkpointText.setText("Checkpoint: Collected");
        }

        const collectedText = this.add.text(400, 115, "Checkpoint collected!", {
            fontSize: "26px",
            color: "#8a6d00",
            fontFamily: "Arial"
        }).setOrigin(0.5);

        this.uiObjects.push(collectedText);
        this.mazeCamera.ignore(collectedText);

        collectedText.alpha = 0;

        this.tweens.add({
            targets: collectedText,
            alpha: 1,
            y: collectedText.y - 10,
            duration: 400,
            ease: "Power2",
            yoyo: true,
            hold: 700,
            onComplete: () => {
                collectedText.destroy();
            }
        });
    }

    showNeedCheckpointText() {
        if (this.needCheckpointText || this.finished || !this.started) {
            return;
        }

        this.needCheckpointText = this.add.text(400, 115, "Collect the yellow checkpoint first!", {
            fontSize: "26px",
            color: "#aa2222",
            fontFamily: "Arial"
        }).setOrigin(0.5);

        this.uiObjects.push(this.needCheckpointText);
        this.mazeCamera.ignore(this.needCheckpointText);

        this.needCheckpointText.alpha = 0;

        this.tweens.add({
            targets: this.needCheckpointText,
            alpha: 1,
            y: this.needCheckpointText.y - 10,
            duration: 400,
            ease: "Power2",
            yoyo: true,
            hold: 700,
            onComplete: () => {
                this.needCheckpointText.destroy();
                this.needCheckpointText = null;
            }
        });
    }

    createWall(x, y, width, height) {
        const wall = this.add.rectangle(
            Math.round(x),
            Math.round(y),
            Math.round(width),
            Math.round(height),
            0x2b2b2b
        );

        wall.setOrigin(0.5);
        wall.setDepth(5);

        this.physics.add.existing(wall, true);

        this.walls.add(wall);
        this.wallList.push(wall);
        this.mazeObjects.push(wall);

        return wall;
    }

    createMovingPlatform(x, y, width, height, moveX = 0, moveY = 100, duration = 2000) {
        const platform = this.add.rectangle(x, y, width, height, 0x2b2b2b);
        platform.setOrigin(0.5);
        platform.setDepth(6);

        this.physics.add.existing(platform, true);

        this.walls.add(platform);
        this.wallList.push(platform);
        this.mazeObjects.push(platform);

        platform.startX = x;
        platform.startY = y;

        this.tweens.add({
            targets: platform,
            x: x + moveX,
            y: y + moveY,
            duration: duration,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",

            onUpdate: () => {
                platform.body.updateFromGameObject();
            }
        });

        return platform;
    }
    
    createSpikes(x, y, rotation = 0) {
        // Draw spike shape
        const spike = this.add.triangle(
            x,
            y,
            0, 28,
            18, 0,
            36, 28,
            0x2b2b2b
        );

        spike.setOrigin(0.5);
        spike.rotation = rotation;
        spike.setDepth(6);

        // Add static physics body
        this.physics.add.existing(spike, true);

        // Make hitbox smaller than full triangle so it feels fair
        spike.body.setSize(28, 22);
        spike.body.setOffset(4, 6);

        // Add to maze objects so UI camera ignores it
        this.mazeObjects.push(spike);

        return spike;
    }


    update() {

        if (!this.started) {
            if (Phaser.Input.Keyboard.JustDown(this.keys.space)) {
                this.started = true;
                this.levelStartTime = this.time.now;
                this.timerText.setText("Time: 0.00");
                this.instructionText.setText("Collect the yellow checkpoint first, then guide the ball to the green exit.");
            }

            if (this.background) {
                this.background.rotation = -this.mazeCamera.rotation;
            }

            return;
        }

        const currentTime = (this.time.now - this.levelStartTime) / 1000;
        this.timerText.setText("Time: " + currentTime.toFixed(2));

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

        if (this.ball && this.ball.body) {
            this.prevBallVelocity.set(
                this.ball.body.velocity.x,
                this.ball.body.velocity.y
            );
        }
    }

    rotateMaze(degrees) {
        this.mazeAngle += degrees;

        // Keeps the number from getting huge forever
        this.mazeAngle = Phaser.Math.Wrap(this.mazeAngle, 0, 360);

        const radians = Phaser.Math.DegToRad(this.mazeAngle);

        const gravityPower = 500;

        // Real gameplay tilt
        this.physics.world.gravity.x = Math.sin(radians) * gravityPower;
        this.physics.world.gravity.y = Math.cos(radians) * gravityPower;

        // Visual maze rotation
        this.mazeCamera.rotation = radians;
    }

    hitSpike() {
        if (this.finished || !this.started) {
            return;
        }

        this.spikesHit++;

    
        this.spikesText.setText("Spikes Hit: " + this.spikesHit);
  

        // Reset ball to Level 2 start position
        this.ball.body.setVelocity(0, 0);
        this.ball.x = 200;
        this.ball.y = 200;
    }

    finishLevel() {
        if (this.finished) {
            return;
        }

        this.finished = true;
        this.finalTime = (this.time.now - this.levelStartTime) / 1000;

        this.physics.pause();

        this.time.delayedCall(800, () => {
            this.scene.start("Level3SummaryScene", {
                time: this.finalTime,
                spikesHit: this.spikesHit
            });
        });
    }
}

class Level3SummaryScene extends Phaser.Scene {
    constructor() {
        super("Level3SummaryScene");
    }

    init(data) {
        this.levelTime = data.time || 0;
        this.spikesHit = data.spikesHit || 0;
    }

    create() {
        this.cameras.main.setBackgroundColor("#ffffff");
        this.cameras.main.fadeIn(800, 0, 0, 0);

        addUniversalBackground(this);

        const penalty = this.spikesHit * 5;
        const finalScoreTime = this.levelTime + penalty;

        let rank = "Bronze";

        if (finalScoreTime <= 30 && this.spikesHit === 0) {
            rank = "Gold";
        } else if (finalScoreTime <= 45 && this.spikesHit <= 2) {
            rank = "Silver";
        }

        this.add.text(400, 120, "LEVEL 3 COMPLETE", {
            fontSize: "48px",
            color: "#222222",
            fontFamily: "Arial"
        }).setOrigin(0.5);

        this.add.text(400, 220, "Time: " + this.levelTime.toFixed(2) + " seconds", {
            fontSize: "32px",
            color: "#222222",
            fontFamily: "Arial"
        }).setOrigin(0.5);

        this.add.text(400, 285, "Spikes Hit: " + this.spikesHit, {
            fontSize: "32px",
            color: "#aa2222",
            fontFamily: "Arial"
        }).setOrigin(0.5);

        this.add.text(400, 350, "Spike Penalty: +" + penalty.toFixed(2) + " seconds", {
            fontSize: "28px",
            color: "#444444",
            fontFamily: "Arial"
        }).setOrigin(0.5);

        this.add.text(400, 420, "Final Score Time: " + finalScoreTime.toFixed(2) + " seconds", {
            fontSize: "34px",
            color: "#222222",
            fontFamily: "Arial"
        }).setOrigin(0.5);

        this.add.text(400, 490, "Rank: " + rank, {
            fontSize: "40px",
            color: "#8a6d00",
            fontFamily: "Arial"
        }).setOrigin(0.5);

        this.add.text(400, 610, "Press SPACE to play again", {
            fontSize: "28px",
            color: "#222222",
            fontFamily: "Arial"
        }).setOrigin(0.5);

        this.keys = this.input.keyboard.addKeys({
            space: Phaser.Input.Keyboard.KeyCodes.SPACE
        });
    }

    update() {
        if (Phaser.Input.Keyboard.JustDown(this.keys.space)) {
            this.scene.start("OutroScene");
        }
    }
}

class OutroScene extends Phaser.Scene {
    constructor() {
        super("OutroScene");
    }

    create() {
        this.cameras.main.setBackgroundColor("#ffffff");
        this.cameras.main.fadeIn(800, 0, 0, 0);

        addUniversalBackground(this);

        // Reset important game variables back to default
        this.registry.set("level1Time", 0);
        this.registry.set("level2Time", 0);
        this.registry.set("level3Time", 0);
        this.registry.set("totalTime", 0);
        this.registry.set("spikesHit", 0);
        this.registry.set("checkpointCollected", false);

        this.add.text(400, 150, "THANKS FOR PLAYING", {
            fontSize: "48px",
            color: "#222222",
            fontFamily: "Arial"
        }).setOrigin(0.5);

        this.add.text(400, 240, "You completed all 3 maze levels.", {
            fontSize: "30px",
            color: "#333333",
            fontFamily: "Arial"
        }).setOrigin(0.5);

        this.add.text(400, 310, "Tilt, roll, retry, escape.", {
            fontSize: "28px",
            color: "#444444",
            fontFamily: "Arial"
        }).setOrigin(0.5);

        this.add.text(400, 440, "Press SPACE to play again", {
            fontSize: "32px",
            color: "#8a6d00",
            fontFamily: "Arial"
        }).setOrigin(0.5);

        this.add.text(400, 500, "Press ESC to return to the intro", {
            fontSize: "24px",
            color: "#444444",
            fontFamily: "Arial"
        }).setOrigin(0.5);

        this.keys = this.input.keyboard.addKeys({
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,
            esc: Phaser.Input.Keyboard.KeyCodes.ESC
        });
    }

    update() {
        if (Phaser.Input.Keyboard.JustDown(this.keys.space)) {
            this.resetGameState();
            this.scene.start("Level1Scene");
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.esc)) {
            this.resetGameState();
            this.scene.start("IntroScene");
        }
    }

    resetGameState() {
        this.registry.set("level1Time", 0);
        this.registry.set("level2Time", 0);
        this.registry.set("level3Time", 0);
        this.registry.set("totalTime", 0);
        this.registry.set("spikesHit", 0);
        this.registry.set("checkpointCollected", false);

        this.physics.world.gravity.x = 0;
        this.physics.world.gravity.y = 500;
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

    render: {
        antialias: true,
        roundPixels: true
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
        IntroScene, 
        Level1Scene,
        Level1SummaryScene,
        Level2Scene,
        Level2SummaryScene,
        Level3Scene,
        Level3SummaryScene,
        OutroScene
    ]
};

const game = new Phaser.Game(config);