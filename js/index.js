window.onload = function () {
    var ball, paddle, bricks, startBtn, gameMsg, score, scoreTxt, live, liveTxt, playing;
    var game = new Phaser.Game(480, 320, Phaser.AUTO, "gameContainer", {
        preload: preload,
        create: create,
        update: update,
        init: init
    });
    var textStyleHUD = {
        font: "bold 18px Arial",
        fill: "white"
    }
    var textStyleMsg = {
        font: "bold 48px Arial",
        fill: "white",
        align: "center"
    }
    function init() {
        game.stage.disableVisibilityChange = false;
        game.scale.pageAlignHorizontally = true;
        game.scale.pageAlignVertically = true;
        game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        game.scale.fullScreenTarget = game.canvas.parent;

        game.physics.startSystem(Phaser.Physics.ARCADE);
        game.physics.arcade.checkCollision.down = false;
        playing = false;
        lives = 0;
        score = 0;
    }

    function preload() {
        var loadBar = document.getElementById("progressBar");
        var loadPercent = document.getElementById("progressPercent");
        var loaderDiv = document.getElementById("loader");

        game.load.onFileComplete.add(function (progress) {
            loadBar.style.width = progress + "%";
            loadPercent.innerText = progress + "%";
        });

        game.load.onLoadComplete.add(function () {
            loaderDiv.style.display = "none";
        });

        game.load.image("ball", "img/ball.png");
        game.load.image("paddle", "img/paddle.png");
        game.load.image("brick", "img/brick.png");
        game.load.spritesheet("ballW", "img/wobble.png", 20, 20);
        game.load.spritesheet("start", "img/button.png", 120, 40);
    }

    function startGame(){
        startBtn.destroy();
        ball.body.velocity.set(100, -100);
        lives = 3;
        score = 0;
    }
    function create() {
        ball = game.add.sprite(game.world.centerX, game.world.height - 25, "ballW");
        ball.anchor.set(0.5);
        ball.animations.add("wobble",[0,1,0,2,0,1,0,2,0], 27);

        game.physics.enable(ball, Phaser.Physics.ARCADE);
        ball.body.collideWorldBounds = true;
        ball.checkWorldBounds = true;
        ball.body.bounce.set(1);
        ball.events.onOutOfBounds.add(ballOutSideScreen, this);

        paddle = game.add.sprite(game.world.centerX, game.world.height - 5, "paddle");
        paddle.anchor.set(0.5, 1);
        game.physics.enable(paddle, Phaser.Physics.ARCADE);
        paddle.body.immovable = true;

        createBricks();
        startBtn = game.add.button(game.world.centerX, game.world.centerY, "start", startGame,this, 1, 0,2);
        startBtn.anchor.set(0.5);

        scoreTxt = game.add.text(5, 5, "Score: "+ score, textStyleHUD);
        scoreTxt.anchor.set(0,0);

        liveTxt = game.add.text(game.world.width - 5, 5, "lives: "+ lives, textStyleHUD);
        liveTxt.anchor.set(1,0);

        gameMsg = game.add.text(game.world.centerX, game.world.centerY, "You just lost a Life.", textStyleMsg);
        gameMsg.anchor.set(0.5,0.5);
        gameMsg.visible = false;
    }

    function createBricks() {
        var brickInfo = {
            width: 50,
            height: 20,
            count: {
                row: 3,
                col: 7
            },
            offset: {
                top: 50,
                left: 50
            },
            padding: 10
        }
        bricks = game.add.group();
        for (var c = 0; c < brickInfo.count.col; c++) {
            for (var r = 0; r < brickInfo.count.row; r++) {
                var bx = (c * (brickInfo.width + brickInfo.padding)) + brickInfo.offset.left;
                var by = (r * (brickInfo.height + brickInfo.padding)) + brickInfo.offset.top;
                var brick = game.add.sprite(bx, by, "brick");
                game.physics.enable(brick, Phaser.Physics.ARCADE);
                brick.body.immovable = true;
                brick.anchor.set(0.5);
                bricks.add(brick);
            }
        }
    }

    function ballOutSideScreen() {
        lives--;
        if(lives) {
            gameMsg.setText("You just lost a life.");
            gameMsg.visible = true;
            game.add.tween(gameMsg).to({alpha:0}, 500, Phaser.Easing.Linear.None, true, 1000).onComplete.addOnce(
                function(){
                    resetGame();
                    gameMsg.visible = false;
                    gameMsg.alpha = 1;
                });
        } else {
            gameEnd("You lost. \n Your Score is "+ score);
        }
    }

    function gameEnd(msg) {
        gameMsg.setText(msg);
        gameMsg.visible = true;
        ball.body.velocity.set(0);
        game.add.tween(gameMsg).to({alpha:0}, 500, Phaser.Easing.Linear.None, true, 1500).onComplete.addOnce(
            function(){
                gameMsg.visible = false;
                gameMsg.alpha = 1;
                game.paused = true;
                window.location.reload();
            });
    }
    function ballHitPaddle(ball, paddle) {
        ball.body.velocity.x = -1 * 10 * (paddle.x - ball.x);
        ball.animations.play("wobble");
    }

    function ballHitBrick(ball, brick) {
        game.add.tween(brick.scale).to({x:0, y:0}, 200, Phaser.Easing.Bounce.In, true).onComplete.addOnce(function(){
            brick.scale.set(1);
            brick.kill();
            score += 10;
        });
        ball.animations.play("wobble");
    }

    function movePaddle() {
        if (game.input.keyboard.isDown(Phaser.Keyboard.LEFT) && paddle.x > paddle.width / 2) {
            paddle.x -= 5;
        } else if (game.input.keyboard.isDown(Phaser.Keyboard.RIGHT) && paddle.x < game.world.width - (paddle.width / 2)) {
            paddle.x += 5;
        }
    }

    function checkBricksLeft() {
        var count_alive = 0;
        bricks && bricks.children.forEach(function(brick){
            if(brick.alive) {
                count_alive++;
            }
        });

        if(count_alive === 0){
            gameEnd("You Win. \n Your Score is "+ score);
        }
    }
    function update() {
        game.physics.arcade.collide(ball, paddle, ballHitPaddle);
        game.physics.arcade.collide(ball, bricks, ballHitBrick);

        movePaddle();
        checkBricksLeft();
        liveTxt.text = "Lives: "+lives;
        scoreTxt.text = "Score: "+score;
    }

    function resetGame(){
        ball.reset(game.world.centerX, game.world.height - 25);
        paddle.reset(game.world.centerX, game.world.height - 5);

        ball.body.velocity.set(100, -100);
    }
}