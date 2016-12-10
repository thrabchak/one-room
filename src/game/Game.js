/** @constructor */
OneRoom.Game = function( game )
{
  this.cursorKeys = null;
  this.spaceBar = null;
  this.enterKey = null;
  this.escapeKey = null;

  this.buttonList = [];
  this.exitButton = null;
  this.buttonGroup = null;

  this.modalYesButton = null;
  this.modalNoButton = null;
  this.modalGroup = null;

  this.gamepadList = OneRoom.gamepadList;
  this.gamepadCallbackList =
  {
    onDown: this.gamepadOnDown
  };

  this.circleSprite = null;
  this.targetPoint = new Phaser.Point();
  this.santa = null;
  this.treeSprite = null;
  this.moonSprite = null;

  this.map = null;
  this.layer = null;
  this.objectLayer = null;

  this.bell = null;
  this.soundList = [];

  this.santaFacingLeft = false;

};

OneRoom.Game.stateKey = "Game";

OneRoom.Game.prototype.init = function()
{
  
};

OneRoom.Game.prototype.create = function()
{
  this.physics.startSystem(Phaser.Physics.ARCADE);

  this.stage.backgroundColor = 0x171642; 

  this.setupInput();
  this.setupGraphics();
  this.setupSounds();
};

OneRoom.Game.prototype.setupInput = function()
{
  // Game Controls
  // =========
  // Key                 Normal Action      Special
  // Arrow left          Move left          Run left
  // Arrow right         Move right         Run right
  // Arrow down          Crouch             Slide
  // Space bar           Jump               Double bounce off walls?

  this.escapeKey = this.input.keyboard.addKey( Phaser.Keyboard.ESC );
  this.escapeKey.onDown.add( this.escapeKeyDown, this );

  OneRoom.backButtonCallback = this.escapeKeyDown;

  // Buttons.
  OneRoom.activeButton = null;

  this.exitButton = OneRoom.createTextButton( 0, 32,
                                                "Exit", this.escapeKeyDown, this );

  // Position button based on width.
  // NOTE: Using child label width, as parent button width member is not
  // reliable seemingly after newly created label is added after creating button.
  // Need to file issue with Phaser.
  this.exitButton.position.x = this.game.width - this.exitButton.children[0].width - 16;
  this.exitButton.input.priorityID = 1;

  var mute = OneRoom.getMute();
  var muteText = mute ? "Unmute" : "  Mute";
  var muteButtonStyle = mute ? OneRoom.buttonActiveStyle : OneRoom.buttonStyle;
  this.muteButton = OneRoom.createTextButton( 0, 32,
                                                muteText, this.toggleMute, this, muteButtonStyle );

  this.muteButton.position.x = this.exitButton.position.x - this.muteButton.children[0].width;
  this.muteButton.input.priorityID = 1;

  this.buttonGroup = this.game.add.group();
  this.buttonGroup.add( this.exitButton );
  this.buttonGroup.add( this.muteButton );

  // Modal dialog buttons.
  this.modalYesButton = OneRoom.createTextButton( 0, 0,
                                                    "Yes", this.returnToMainMenu, this );
  this.modalYesButton.position.setTo( this.game.world.centerX, this.game.world.centerY + 48 * 1 );
  this.modalYesButton.input.priorityID = 3;

  this.modalNoButton = OneRoom.createTextButton( 0, 0,
                                                   "No", this.toggleModal, this );
  this.modalNoButton.position.setTo( this.game.world.centerX, this.game.world.centerY + 48 * 2 );
  this.modalNoButton.input.priorityID = 3;

  // Gamepads.
  this.setupGamepads();

  // Movement controls
  this.cursorKeys = this.input.keyboard.createCursorKeys();
  this.spaceBar = this.input.keyboard.addKey( Phaser.Keyboard.SPACEBAR );
  this.spaceBar.onDown.add( this.spacebarKeyDown, this );
};

OneRoom.Game.prototype.setupGamepads = function()
{
  // First reset callbacks.
  this.game.input.gamepad.onDownCallback = null;
  this.game.input.gamepad.onAxisCallback = null;

  // Then set callbacks.
  this.game.input.gamepad.addCallbacks( this, this.gamepadCallbackList );
};

OneRoom.Game.prototype.setupGraphics = function()
{
  // All text.
  var allTextGroup = this.game.add.group();
  allTextGroup.add( this.buttonGroup );
  allTextGroup.alpha = 0.0;

  this.game.add.tween( allTextGroup ).to( { alpha: 1 }, 500, Phaser.Easing.Linear.None, true );

  this.circleSprite = this.createCircleSprite();

  this.game.world.bringToTop( allTextGroup );

  var background = this.game.add.sprite( 0, 0 );
  background.fixedToCamera = true;
  background.scale.setTo( this.game.width, this.game.height );
  background.inputEnabled = true;
  background.input.priorityID = 0;
  background.events.onInputDown.add( this.pointerDown, this );

  this.game.world.sendToBack( background );

  this.buildWorld();

  this.setupSanta();

  // Set up modal background.
  var bmd = this.game.add.bitmapData( this.game.width, this.game.height );
  bmd.ctx.fillStyle = "rgba(0,0,0,0.5)";
  bmd.ctx.fillRect( 0, 0, this.game.width, 48 * 3 );
  bmd.ctx.fillRect( 0, 48 * 9, this.game.width, 48 * 3 );
  bmd.ctx.fillStyle = "rgba(0,0,0,0.95)";
  bmd.ctx.fillRect( 0, 48 * 3, this.game.width, 48 * 6 );
  var modalBackground = this.game.add.sprite( 0, 0, bmd );
  modalBackground.fixedToCamera = true;
  modalBackground.inputEnabled = true;
  modalBackground.input.priorityID = 2;

  var modalPromptText = "Are you sure you want to exit?";
  var modalPrompt = this.game.add.text( 0, 0, modalPromptText, OneRoom.buttonStyle );
  modalPrompt.position.setTo( this.game.world.centerX, this.game.world.centerY - 48 * 1 );
  modalPrompt.anchor.setTo( 0.5, 0.5 );

  this.modalGroup = this.game.add.group();
  this.modalGroup.add( modalBackground );
  this.modalGroup.add( modalPrompt );
  this.modalGroup.add( this.modalYesButton );
  this.modalGroup.add( this.modalNoButton );
  this.modalGroup.visible = false;
};

OneRoom.Game.prototype.setupSanta = function()
{
  this.santa = this.add.sprite(250, 0, 'santa');

  fps = 40;
  this.santa.animations.add('idle', [0], fps, true);
  this.santa.animations.add('run_right', [1,2,3,4,5,6,7,8,9,10,11], fps, true);

  this.game.physics.arcade.enable(this.santa);

  this.santa.body.bounce.y = 0.2;
  this.santa.body.gravity.y = 300;
  this.santa.body.collideWorldBounds = true;
};

OneRoom.Game.prototype.buildWorld = function()
{
  this.loadLevelTilemap();

  this.loadBackgroundImage();

  this.treeSprite = this.add.sprite(550, 350, 'tree');
  this.moonSprite = this.add.sprite(0,0, 'moon_sheet', 1);
};

OneRoom.Game.prototype.loadLevelTilemap = function()
{
  this.map = this.game.add.tilemap( "map" );
  this.map.addTilesetImage( "Simple" );
  this.map.addTilesetImage( "ForegroundHouse" );
  this.map.smoothed = false;

  this.map.createLayer( "Background" );
  this.map.createLayer( "Middleground" );
  this.map.createLayer( "Decorations" );
  this.layer = this.map.createLayer( "Platforms" );
  
  this.objectLayer = this.map.createLayer( "Decorations" );
  this.objectLayer.visible = false;

  this.layer.resizeWorld();

  // Build collision list.
  // TODO: Pull tileset names from list rather than hardcode.
  var collisionTileIndexList = [];
  var n = 0
  var tilesets = this.map.tilesets;
  var numberOfTilesets = tilesets.length;
  var tileIndex = 0;

  for( var i = 0; i < numberOfTilesets; i++ )
  {
    var tileset = tilesets[i];
    if( ( tileset.name === "Simple" ) )
    {
      for( var n = 0; n < tileset.total; n++ )
      {
        collisionTileIndexList.push( tileIndex++ );
      }
    }
  }

  this.map.setCollision( collisionTileIndexList, true, this.layer );
};

OneRoom.Game.prototype.loadBackgroundImage = function()
{
  var background = this.game.add.sprite( 0, 0, "Night Sky" );
  this.game.world.sendToBack( background );
};

OneRoom.Game.prototype.setupSounds = function()
{
  this.bell = this.game.add.audio( "bell2" );
  this.soundList.push( this.bell );
};

OneRoom.Game.prototype.update = function()
{
  this.gamepadUpdate();
  this.santaMovementUpdate();
};

OneRoom.Game.prototype.santaMovementUpdate = function( button )
{
    //  Reset the players velocity (movement)
    this.santa.body.velocity.x = 0;

    changedFacingDirection = false;

    if (this.cursorKeys.left.isDown)
    {
        //  Move to the left
        this.santa.body.velocity.x = -150;
        this.santa.animations.play('run_right');

        if(!this.santaFacingLeft){
          changedFacingDirection = true;
        }

        this.santaFacingLeft = true;
    }
    else if (this.cursorKeys.right.isDown)
    {
        //  Move to the right
        this.santa.body.velocity.x = 150;

        this.santa.animations.play('run_right');

        if(this.santaFacingLeft){
          changedFacingDirection = true;
        }
        this.santaFacingLeft = false;
    }
    else
    {
        //  Stand still
        this.santa.animations.play('idle');
    }

    //  Allow the this.santa to jump if they are touching the ground.
    if (this.cursorKeys.up.isDown && this.santa.body.touching.down)
    {
        this.santa.body.velocity.y = -350;
    }

    if(changedFacingDirection)
    {
      this.santa.scale.x *= -1;
    }
};

OneRoom.Game.prototype.escapeKeyDown = function( button )
{
  OneRoom.setActiveButton( this.modalNoButton );

  this.toggleModal();
};

OneRoom.Game.prototype.spacebarKeyDown = function( button )
{
  console.log("Spacebar down");
};

OneRoom.Game.prototype.pointerDown = function( sprite, pointer )
{
  this.targetPoint.copyFrom( pointer );

  var position = this.targetPoint;
  this.makeImpact( position.x, position.y );
};

OneRoom.Game.prototype.gamepadUpdate = function()
{
  /*if( this.game.input.gamepad.supported && this.game.input.gamepad.active )
  {
    for( var i = 0; i < this.gamepadList.length; i++ )
    {
      var gamepad = this.gamepadList[i];
      if( gamepad.connected )
      {
        if( gamepad.isDown( Phaser.Gamepad.XBOX360_DPAD_UP, 0 ) ||
            gamepad.axis( Phaser.Gamepad.XBOX360_STICK_LEFT_Y ) < -0.1 )
        {
          
        }
        else
        if( gamepad.isDown( Phaser.Gamepad.XBOX360_DPAD_DOWN, 0 ) ||
            gamepad.axis( Phaser.Gamepad.XBOX360_STICK_LEFT_Y ) > 0.1 )
        {
          
        }
      }
    }
  }*/
};

OneRoom.Game.prototype.gamepadOnDown = function( buttonIndex, buttonValue, gamepadIndex )
{
  this.makeImpact( ( this.game.width / 2 ) | 0, ( this.game.height / 2 ) | 0 );
};

OneRoom.Game.prototype.toggleModal = function()
{
  this.modalGroup.visible = !this.modalGroup.visible;

  this.buttonList.length = 0;

  if( this.modalGroup.visible )
  {
    OneRoom.setupButtonKeys( this );

    this.buttonList.push( this.modalYesButton );
    this.buttonList.push( this.modalNoButton );
  }
  else
  {
    OneRoom.clearButtonKeys( this );
  }
};

OneRoom.Game.prototype.returnToMainMenu = function()
{
  this.game.sound.stopAll();
  
  this.state.start( OneRoom.MainMenu.stateKey );
};

OneRoom.Game.prototype.makeImpact = function( x, y )
{
  if( !!this.bell._sound )
  {
    this.adjustBellPitch();
  }
  else
  {
    this.bell.onPlay.add( this.adjustBellPitch, this );
  }

  //this.bell.play();

  //this.resetCircleSprite( this.circleSprite, x, y );
};

OneRoom.Game.prototype.createCircleSprite = function()
{
  var bmd = this.game.add.bitmapData( 128, 128 );

  bmd.ctx.fillStyle = "#999999";
  bmd.ctx.beginPath();
  bmd.ctx.arc( 64, 64, 64, 0, Math.PI * 2, true ); 
  bmd.ctx.closePath();
  bmd.ctx.fill();

  var sprite = this.game.add.sprite( 0, 0, bmd );
  sprite.anchor.set( 0.5 );

  sprite.alpha = 0.0;

  return sprite;
};

OneRoom.Game.prototype.adjustBellPitch = function()
{
  var verticalScale = 4.0 * ( 1.0 - ( this.targetPoint.y / this.game.world.height ) );
  this.bell._sound.playbackRate.value = verticalScale;
};

OneRoom.Game.prototype.resetCircleSprite = function( circleSprite, x, y )
{
  circleSprite.position.set( x, y );

  circleSprite.scale.set( 0.5 );
  circleSprite.alpha = 1.0;

  var verticalScale = ( 1.0 - ( y / this.game.world.height ) );
  var colorAdjustment = ( verticalScale * 255 ) | 0;
  
  var r = 255 - colorAdjustment;
  var g = 63;
  var b = 0 + colorAdjustment;

  if( colorAdjustment < 128 )
  {
    g += b;
  }
  else
  {
    g += r;
  }

  circleSprite.tint = ( r << 16 ) + ( g << 8 ) + b;

  this.game.add.tween( circleSprite.scale ).to( { x: 4.0, y: 4.0 }, 500, Phaser.Easing.Sinusoidal.InOut, true );
  this.game.add.tween( circleSprite ).to( { alpha: 0.0 }, 500, Phaser.Easing.Sinusoidal.InOut, true );
};

OneRoom.Game.prototype.toggleMute = function()
{
  var mute = !OneRoom.getMute();

  OneRoom.setMute( mute );

  var muteText = mute ? "Unmute" : "  Mute";
  var muteButtonStyle = mute ? OneRoom.buttonActiveStyle : OneRoom.buttonStyle;

  var muteButtonText = this.muteButton.children[0];
  muteButtonText.text = muteText;
  muteButtonText.setStyle( muteButtonStyle );
};
