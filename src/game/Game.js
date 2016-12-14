var Objectives = {
  ENTER_HOUSE: 0,
  PLACE_PRESENTS: 1,
  LEAVE_HOUSE: 2,
  NONE: 3,
};

var ObjectivesDescriptions = {
  0: "Go down the chimney.",
  1: "Find the Christmas tree and place the presents.",
  2: "Leave the house",
  3: "No objectives."
};

/** @constructor */
OneRoom.Game = function( game )
{
  this.debugModeOn = false;

  this.paused = false;

  this.cursorKeys = null;
  this.spaceBar = null;
  this.enterKey = null;
  this.escapeKey = null;
  this.debugKey = null;

  this.buttonList = [];
  this.exitButton = null;
  this.muteButton = null;
  this.buttonGroup = null;

  this.modalYesButton = null;
  this.modalNoButton = null;
  this.modalGroup = null;

  this.nextLevelButton = null;
  this.nextLevelNoButton = null;
  this.nextLevelDialogGroup = null;

  this.gamepadList = OneRoom.gamepadList;
  this.gamepadCallbackList =
  {
    onDown: this.gamepadOnDown
  };

  this.targetPoint = new Phaser.Point();

  this.santa = null;
  this.santaGroundedType = -1;
  this.santaInChimney = false;
  this.santaChinmeyDirection = 0;

  this.treeSprite = null;
  this.moonSprite = null;
  this.fireplaceZone = null;

  this.map = null;
  this.layer = null;
  this.objectLayer = null;
  this.middleGroundTilemapLayer = null;
  
  this.boxDropSound = null;
  this.ahSound = null;
  this.woohooSound = null;
  this.hohohoSound = null;
  this.stepsSound = null;
  this.soundList = [];

  this.santaFacingLeft = false;

  this.objective = Objectives.ENTER_HOUSE;
  this.enteredHouse = false;
  this.deliveredPresents = false;
  this.leftHouse = false;

  this.presentsGroup = null;

  this.jollyometerValue = 0;
  this.jollyometer = null;
  this.jollyIterator = 0;
  this.jollyDepletionFrames = 18;
};

OneRoom.Game.stateKey = "Game";

OneRoom.Game.prototype.init = function()
{
  
};

OneRoom.Game.prototype.create = function()
{
  this.physics.startSystem(Phaser.Physics.ARCADE);
  this.physics.arcade.gravity.y = 850;

  this.stage.backgroundColor = 0x171642; 

  this.objective = Objectives.ENTER_HOUSE;
  this.enteredHouse = false;
  this.deliveredPresents = false;
  this.leftHouse = false;

  this.setJollyometerValue( 85 );

  this.setupInput();
  this.setupGraphics();
  this.setupSounds();

  this.game.debug.reset();
};

OneRoom.Game.prototype.setupInput = function( createNewButtons )
{
  // Game Controls
  // =========
  // Key                 Normal Action      Special
  // Arrow left          Move left          Run left
  // Arrow right         Move right         Run right
  // Arrow down          Crouch             Go down chimney, Slide
  // Space bar           Jump               Double bounce off walls?

  if( createNewButtons === undefined )
  {
    createNewButtons = true;
  }

  this.escapeKey = this.input.keyboard.addKey( Phaser.Keyboard.ESC );
  this.escapeKey.onDown.add( this.escapeKeyDown, this );

  this.debugKey = this.input.keyboard.addKey( Phaser.Keyboard.P );
  this.debugKey.onDown.add( this.debugButtonDown, this );

  OneRoom.backButtonCallback = this.escapeKeyDown;

  // Buttons.
  OneRoom.activeButton = null;

  if( createNewButtons )
  {
    this.exitButton = OneRoom.createTextButton( 0, 32, "Exit", this.escapeKeyDown, this );
  }

  // Position button based on width.
  // NOTE: Using child label width, as parent button width member is not
  // reliable seemingly after newly created label is added after creating button.
  // Need to file issue with Phaser.
  this.exitButton.position.x = this.game.width - this.exitButton.children[0].width - 16;
  this.exitButton.input.priorityID = 1;

  var mute = OneRoom.getMute();
  var muteText = mute ? "Unmute" : "  Mute";
  if( createNewButtons )
  {
    this.muteButton = OneRoom.createTextButton( 0, 32,  muteText, this.toggleMute, null );
  }
  this.muteButton.position.x = this.exitButton.position.x - this.muteButton.children[0].width;

  this.muteButton.input.priorityID = 1;

  if( createNewButtons )
  {
    this.buttonGroup = this.game.add.group();
    this.buttonGroup.add( this.exitButton );
    this.buttonGroup.add( this.muteButton );
  }
  this.buttonGroup.fixedToCamera = true;

  // Modal dialog buttons.
  if( createNewButtons )
  {
    this.modalYesButton = OneRoom.createTextButton( 0, 0, "Yes", this.returnToMainMenu, this );
  }
  this.modalYesButton.position.setTo( this.game.camera.width / 2, this.game.camera.height / 2 + 48 * 1 );
  this.modalYesButton.input.priorityID = 3;

  if( createNewButtons )
  {
    this.modalNoButton = OneRoom.createTextButton( 0, 0, "No", this.toggleModal, this );
  }
  this.modalNoButton.position.setTo( this.game.camera.width / 2, this.game.camera.height / 2 + 48 * 2 );
  this.modalNoButton.input.priorityID = 3;

  // Finished Level dialog buttons.
  if( createNewButtons )
  {
    this.nextLevelButton = OneRoom.createTextButton( 0, 0, "Yes", this.goToNextLevel, this );
  }
  this.nextLevelButton.position.setTo( this.game.camera.width / 2, this.game.camera.height / 2 + 48 * 1 );
  this.nextLevelButton.input.priorityID = 3;

  if( createNewButtons )
  {
    this.nextLevelNoButton = OneRoom.createTextButton( 0, 0, "No", this.returnToMainMenu, this );
  }
  this.nextLevelNoButton.position.setTo( this.game.camera.width / 2, this.game.camera.height / 2 + 48 * 2 );
  this.nextLevelNoButton.input.priorityID = 3;

  // Gamepads.
  if( createNewButtons )
  {
    this.setupGamepads();
  }

  // Movement controls
  this.cursorKeys = this.input.keyboard.createCursorKeys();

  this.spaceBar = this.input.keyboard.addKey( Phaser.Keyboard.SPACEBAR );
  this.spaceBar.onDown.add( this.spacebarKeyDown, this );
};

OneRoom.Game.prototype.setupKeys = function()
{
};

OneRoom.Game.prototype.setupButtons = function()
{

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

  this.game.world.bringToTop( allTextGroup );

  this.buildWorld();
  
  this.setupJollyometer();

  this.setupPresents();

  this.setupExitDialog();

  this.setupLevelEndDialog();

  this.setPaused( false );
};

OneRoom.Game.prototype.setupJollyometer = function()
{
  var rectWidth = this.camera.width / 2;
  var rectHeight = 35;

  var xpos = this.camera.width / 2;
  var ypos = 30;

  // Setup background
  var jollyBackgroundBmd = this.game.add.bitmapData( rectWidth, rectHeight );
  jollyBackgroundBmd.rect(0, 0, rectWidth, rectHeight, "rgba(100,0,0,1)");
  var jollyometerBackground = this.game.add.sprite( xpos, ypos, jollyBackgroundBmd );
  jollyometerBackground.anchor.setTo(.5);
  jollyometerBackground.fixedToCamera = true;

  // Setup foreground
  var jollyForegroundBmd = this.game.add.bitmapData( rectWidth, rectHeight );
  jollyForegroundBmd.rect(0, 0, rectWidth, rectHeight, "rgba(0,100,0,1)");
  this.jollyometer = this.game.add.sprite( xpos, ypos, jollyForegroundBmd );
  this.jollyometer.anchor.setTo(.5);
  this.jollyometer.fixedToCamera = true;

  // Setup text
  var jollyTextValue = "Jolly-ometer";
  var jollyText = this.game.add.bitmapText( 0, 0, "MountainsOfChristmas", jollyTextValue, 32 );
  jollyText.position.setTo( xpos, ypos );
  jollyText.anchor.setTo( 0.5 );
  jollyText.fixedToCamera = true;
};

OneRoom.Game.prototype.setupExitDialog = function()
{
  // Set up modal background.
  var bmd = this.game.add.bitmapData( this.camera.width, this.camera.height );
  bmd.ctx.fillStyle = "rgba(0,0,0,0.5)";
  bmd.ctx.fillRect( 0, 0, this.camera.width, 48 * 3 );
  bmd.ctx.fillRect( 0, 48 * 9, this.camera.width, 48 * 3 );
  bmd.ctx.fillStyle = "rgba(0,0,0,0.95)";
  bmd.ctx.fillRect( 0, 48 * 3, this.camera.width, 48 * 6 );
  var modalBackground = this.game.add.sprite( 0, 0, bmd );
  modalBackground.inputEnabled = true;
  modalBackground.input.priorityID = 2;

  var modalPromptText = "Are you sure you want to exit?";
   var modalPrompt = this.game.add.bitmapText( 0, 0, "MountainsOfChristmas", modalPromptText, 32 );
  modalPrompt.position.setTo( this.camera.width /2 , this.camera.height / 2 - 48 * 1 );
  modalPrompt.anchor.setTo( 0.5, 0.5 );

  this.modalGroup = this.game.add.group();
  this.modalGroup.add( modalBackground );
  this.modalGroup.add( modalPrompt );
  this.modalGroup.add( this.modalYesButton );
  this.modalGroup.add( this.modalNoButton );
  this.modalGroup.visible = false;
  this.modalGroup.fixedToCamera = true;
};

OneRoom.Game.prototype.setupLevelEndDialog = function()
{
  // Set up modal background.
  var bmd = this.game.add.bitmapData( this.camera.width, this.camera.height );
  bmd.ctx.fillStyle = "rgba(0,0,0,0.5)";
  bmd.ctx.fillRect( 0, 0, this.camera.width, 48 * 3 );
  bmd.ctx.fillRect( 0, 48 * 9, this.camera.width, 48 * 3 );
  bmd.ctx.fillStyle = "rgba(0,0,0,0.95)";
  bmd.ctx.fillRect( 0, 48 * 3, this.camera.width, 48 * 6 );
  var modalBackground = this.game.add.sprite( 0, 0, bmd );
  modalBackground.inputEnabled = true;
  modalBackground.input.priorityID = 2;

  var modalPromptText = "You delivered the presents!\n\nGo to next house?";
  var modalPrompt = this.game.add.bitmapText( 0, 0, "MountainsOfChristmas", modalPromptText, 32 );
  modalPrompt.position.setTo( this.game.camera.width /2 , this.game.camera.height / 2 - 48 * 1 );
  modalPrompt.anchor.setTo( 0.5, 0.5 );

  this.nextLevelDialogGroup = this.game.add.group();
  this.nextLevelDialogGroup.add( modalBackground );
  this.nextLevelDialogGroup.add( modalPrompt );
  this.nextLevelDialogGroup.add( this.nextLevelButton );
  this.nextLevelDialogGroup.add( this.nextLevelNoButton );
  this.nextLevelDialogGroup.visible = false;
  this.nextLevelDialogGroup.fixedToCamera = true;
};

OneRoom.Game.prototype.setupPresents = function()
{
  this.presentsGroup = this.game.add.group();
  this.presentsGroup.enableBody = true;

  for (var i = 0; i < 12; i++)
  {
    var randPresFrame = getRandomIntInclusive(0, 8);
    var present = this.presentsGroup.create(0, 0, 'present_sheet', randPresFrame);

    var randPresScale = getRandomFloat(.5, 1);
    present.scale.setTo(randPresScale, randPresScale);
    present.anchor.setTo(.5, .5);
  }

  this.presentsGroup.visible = false;
};

OneRoom.Game.prototype.setupSanta = function()
{
  this.santa = this.add.sprite(0, 0, 'santa');
  this.santaFacingLeft = false;

  fps = 40;
  this.santa.animations.add('idle', [0], fps, true);
  this.santa.animations.add('run_right', [1,2,3,4,5,6,7,8,9,10,11], fps, true);

  this.santa.anchor.setTo( .5, .5 );

  this.game.physics.arcade.enable(this.santa);

  // TODO: This needs to be cleaned up with santa sprite.
  var halfSantaWidth = this.santa.width / 2.0;
  var fourthSantaWidth = halfSantaWidth / 2.0;

  var adjustedSantaHeight = this.santa.height - 14.0;
  this.santa.body.setSize( fourthSantaWidth + 16.0, adjustedSantaHeight, fourthSantaWidth, 0.0 );

  this.game.camera.follow(this.santa, Phaser.Camera.FOLLOW_LOCKON, 0.1, 0.1);

  //this.santa.body.bounce.y = 0.2;
  //this.santa.body.gravity.y = 300;
  //this.santa.body.collideWorldBounds = true;

  this.setSpritePositionFromMap( this.objectLayer, "santa", this.santa );
};

OneRoom.Game.prototype.buildWorld = function()
{
  this.loadLevelTilemap( OneRoom.currentLevelNumber );

  this.loadBackgroundImage();

  this.treeSprite = this.add.sprite(0, 0, 'tree');
  this.game.physics.arcade.enable(this.treeSprite);
  this.treeSprite.enableBody = true;
  this.treeSprite.body.allowGravity = false;
  this.treeSprite.body.immovable = true;

  this.setSpritePositionFromMap( this.objectLayer, "tree", this.treeSprite );

  this.moonSprite = this.add.sprite(0,0, 'moon_sheet', 1);
  this.moonSprite.fixedToCamera = true;

  this.setupSanta();

  // Fireplace.
  var rectangleBitmapData = this.game.add.bitmapData( 32 * 4, 32 * 3 );
  rectangleBitmapData.ctx.fillStyle = "#ffffff";
  rectangleBitmapData.ctx.fillRect( 0, 0, rectangleBitmapData.width, rectangleBitmapData.height );
  this.game.cache.addBitmapData( "fireplaceZone", rectangleBitmapData );

  this.fireplaceZone = this.add.sprite( 0, 0, rectangleBitmapData );
  this.fireplaceZone.anchor.set( 0.5 );

  this.game.physics.arcade.enable( this.fireplaceZone );
  this.fireplaceZone.enableBody = true;
  this.fireplaceZone.body.allowGravity = false;
  this.fireplaceZone.body.immovable = true;
  //this.fireplaceZone.visible = false; // TODO: Report phaser bug about when this is true when screen scrolls.
  this.fireplaceZone.alpha = 0.0;
  
  this.setSpritePositionFromMap( this.objectLayer, "fireplace", this.fireplaceZone );
};

OneRoom.Game.prototype.loadLevelTilemap = function( levelNumber )
{
  if( levelNumber === undefined )
  {
    levelNumber = 0;
  }

  if( levelNumber >= OneRoom.numberOfLevels )
  {
    levelNumber = OneRoom.numberOfLevels - 1;
  }

  var houseTilemapName = "house" + levelNumber;
  this.map = this.game.add.tilemap( houseTilemapName );

  this.map.addTilesetImage( "Simple" );
  this.map.addTilesetImage( "ForegroundHouse" );
  this.map.smoothed = false;

  this.map.createLayer( "Background" );
  this.middleGroundTilemapLayer = this.map.createLayer( "Middleground" );
  this.map.createLayer( "Decorations" );
  this.layer = this.map.createLayer( "Platforms" );
  this.layer.visible = false;
  
  this.objectLayer = this.map.createLayer( "Objects" );
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

OneRoom.Game.prototype.setSpritePositionFromMap = function( objectLayer, type, sprite )
{
  // Scan this object layer for this type of tile.
  var foundTile = null;

  var layerData = objectLayer.layer.data;
  var tiles = null;
  var x = 0;
  var tile = null;
  for( var y = 0; y < layerData.length; ++y )
  {
    if( foundTile !== null )
    {
      break;
    }

    tiles = layerData[y];

    for( var x = 0; x < tiles.length; ++x )
    {
      tile = tiles[x];

      if( tile.index > -1 )
      {
        if( tile.properties.type !== undefined )
        {
          if( tile.properties.type === type )
          {
            foundTile = tile;
            break;
          }
        }
      }
    }
  }

  // Return non zero and set 0, 0, if this tile type was not found.
  if( foundTile === null )
  {
    sprite.position.set( 0.0 );

    return 1;
  }

  // Get upper left position of tile.
  var tileX = ( foundTile.x * foundTile.width );
  var tileY = ( foundTile.y * foundTile.height );

  // Translate to bottom left.
  tileY += foundTile.height;

  // Translate to anchor point distance of sprite.
  tileX += ( ( sprite.anchor.x ) * sprite.width );
  tileY -= ( ( 1.0 - sprite.anchor.y ) * sprite.height );

  sprite.position.setTo( tileX, tileY );
};

OneRoom.Game.prototype.loadBackgroundImage = function()
{
  var background = this.game.add.sprite( 0, 0, "Night Sky" );
  this.game.world.sendToBack( background );
  background.fixedToCamera = true;
};

OneRoom.Game.prototype.setupSounds = function()
{
  this.game.sound.stopAll();

  this.hohohoSound = this.game.add.audio( "hohoho", 1, false, true );
  this.soundList.push( this.hohohoSound );

  this.stepsSound = this.game.add.audio( "steps", .5, true, true );
  this.soundList.push( this.stepsSound );

  this.woohooSound = this.game.add.audio( "woohoo", 1, false, true );
  this.soundList.push( this.woohooSound );

  this.ahSound = this.game.add.audio( "ah", 1, false, true );
  this.soundList.push( this.ahSound );
};

OneRoom.Game.prototype.update = function()
{
  this.physics.arcade.collide( this.presentsGroup, this.layer);

  this.gamepadUpdate();

  if( !this.santaInChimney )
  {
    this.physics.arcade.collide( this.santa, this.layer, this.handlePlatformCollision, null, this );
  }
  else
  {
    var chinmeyMovementVelocity = 275.0;
    this.santa.body.velocity.y = chinmeyMovementVelocity * this.santaChinmeyDirection;
    
    this.updateSantaGroundedType();
    
    if( this.santaChinmeyDirection > 0 &&
        this.santaGroundedType === 0 ) // Standing, but not on chimney.
    {
      this.enterHouse();
    }
    else
    if( this.santaChinmeyDirection < 0 &&
        this.santaGroundedType === 1 ) // Standing, but on chimney.
    {
      this.leaveHouse();
    }
  }

  if( this.paused )
  {
    return;
  }

  this.objectiveUpdate();

  this.jollyometer.scale.x = this.jollyometerValue / 100;
  this.jollyIterator += 1;
  if( this.jollyIterator == this.jollyDepletionFrames )
  {
    this.setJollyometerValue( this.jollyometerValue - 1 );
    this.jollyIterator = 0;
  }

  this.santaMovementUpdate();
};

OneRoom.Game.prototype.addJollyness = function(x)
{
  this.setJollyometerValue( Math.min(100, this.jollyometerValue + x) );
};

OneRoom.Game.prototype.setJollyometerValue = function( value )
{
  this.jollyometerValue = value;
  if( value <= 0 )
  {
    this.killSanta();
  }
};

OneRoom.Game.prototype.killSanta = function()
{
  // TODO: Give a delay and a message, sound effects?

  this.restartLevel();
}

OneRoom.Game.prototype.enterHouse = function()
{
  this.enteredHouse = true;

  this.removeSantaFromChimney();

  if(!this.deliveredPresents)
  {    
    this.objective = Objectives.PLACE_PRESENTS;
    console.log("next objective: " + ObjectivesDescriptions[this.objective]);
  }
};

OneRoom.Game.prototype.leaveHouse = function()
{
  this.removeSantaFromChimney();

  if(this.deliveredPresents)
  {
    this.leftHouse = true;
    this.objective = Objectives.None;
    console.log("Congrats you finished the level.");

    this.nextLevelDialogGroup.visible = true;
    this.setPaused( true );

    //this.currentLevelNumber++;
  }
};

OneRoom.Game.prototype.objectiveUpdate = function()
{
  if(this.objective == Objectives.ENTER_HOUSE)
  {
    // See OneRoom.Game.prototype.enterHouse
  } else if(this.objective == Objectives.PLACE_PRESENTS)
  {
    var isAtTree = (this.cursorKeys.up.isDown || this.cursorKeys.down.isDown) && this.physics.arcade.collide(this.santa, this.treeSprite) && !this.deliveredPresents;
    if(isAtTree)
    {
      var shouldThrowPresents = this.cursorKeys.up.isDown;
      this.placePresents(shouldThrowPresents);

      this.objective = Objectives.LEAVE_HOUSE;
      console.log("next objective: " + ObjectivesDescriptions[this.objective]);
    }
  } else if(this.objective == Objectives.LEAVE_HOUSE)
  {
    // See OneRoom.Game.prototype.leaveHouse
  }
}

OneRoom.Game.prototype.placePresents = function( throwPresents)
{
  this.deliveredPresents = true;
  this.presentsGroup.visible = true;

  this.presentsGroup.forEach(function(present) {

    present.x = this.santa.x;
    present.y = this.santa.y-125;

    if (!throwPresents)
    {
      present.body.velocity.x = getRandomFloat(-100, 100);
      present.body.velocity.y = -50;
      present.body.bounce.y = getRandomFloat(.2, .45);
      //this.ahSound.play();
    } else {      
      present.body.velocity.x = getRandomFloat(-500, 500);
      present.body.velocity.y = -500;
      present.body.bounce.y = getRandomFloat(.7, 1);
      present.body.rotation = getRandomFloat(-180,180);
      this.woohooSound.play();
      this.addJollyness(100);
    }
    present.body.velocity.y += this.santa.body.velocity.y;
    present.body.drag.x = 200;
    present.body.bounce.y = getRandomFloat(.5, .7);

  }, this, true);
    
};

OneRoom.Game.prototype.santaMovementUpdate = function()
{

    //  Reset the players velocity (movement)
    this.santa.body.velocity.x = 0;

    if( this.santaInChimney )
    {
      // Disable santa controls while in chimney.
      return;
    }
    else
    {
      if( this.cursorKeys.down.isDown && this.santaGroundedType === 1 )
      {
        // Santa is above the chinmey and wishes to go down.
        var chinmeyDirection = 1; // Down.
        this.putSantaInChimney( chinmeyDirection );
        return;
      }
    }

    if (this.cursorKeys.left.isDown)
    {
      this.santa.body.velocity.x = -150;
    }
    else if (this.cursorKeys.right.isDown)
    {
      this.santa.body.velocity.x = 150;
    }

    // TODO: Determine if Santa is colliding or is
    // about to collide with a vertical platform.

    if (this.santa.body.velocity.x === 0.0)
    {
      //  Stand still
      if( this.santa.animations.isLoaded )
      {
        this.santa.animations.play('idle');
      }
      this.stepsSound.pause();
    }
    else
    {
      //  Move to left or right.
      if( this.santa.animations.isLoaded )
      {
        this.santa.animations.play('run_right');
      }

      var shouldBeFacingLeft = ( this.santa.body.velocity.x < 0.0 );

      // Left.
      if( shouldBeFacingLeft !== this.santaFacingLeft )
      {
        this.santa.scale.x *= -1;
      }

      this.santaFacingLeft = shouldBeFacingLeft;

      // Play steps sound
      if(!this.stepsSound.isPlaying)
      {
        this.stepsSound.play();
      }
    }

    //  Allow the this.santa to jump if they are touching the ground.
    if( this.cursorKeys.up.isDown )
    {
      if(this.santa.body.blocked.down)
      {
        if( Phaser.Rectangle.intersects( this.santa.body, this.fireplaceZone.body ) )
        {
          // Send santa up chinmey.
          var chinmeyDirection = -1;
          this.putSantaInChimney( chinmeyDirection );
        }
        else
        {
          // Jump.
          this.santa.body.velocity.y = -450;
        }
      }
    }
};

OneRoom.Game.prototype.updateSantaGroundedType = function()
{
  var isStandingOnChinmey = false;

  if( !this.santa.body.blocked.down &&
      !this.santaInChimney )
  {
    this.santaGroundedType = -1;
    return;
  }
  else
  {
    var halfSantaBodyWidth = this.santa.body.width / 2.0;
    var fourthSantaBodyWidth = halfSantaBodyWidth / 2.0;

    var tiles = this.layer.getTiles( this.santa.body.x + fourthSantaBodyWidth,
                                     this.santa.body.bottom,
                                     halfSantaBodyWidth, 32 );
    for( var index = 0; index < tiles.length; ++index )
    {
      var tile = tiles[index];
      if( tile.index > 0 &&
          tile.properties !== undefined &&
          tile.properties.type !== "normal" )
      {
        if( tile.properties.type === "chimney_top" )
        {
          isStandingOnChinmey =  true;
        }
      }
    }
  }

  if( isStandingOnChinmey )
  {
    this.santaGroundedType = 1;
  }
  else
  {
    this.santaGroundedType = 0;
  }
};

OneRoom.Game.prototype.handlePlatformCollision = function( santa, tile )
{
  this.updateSantaGroundedType();

  var tileType = tile.properties.type;
  if( tileType !== undefined )
  {
    if( tileType === "death" )
    {
      this.setJollyometerValue( 0.0 );
    }
  }
};

OneRoom.Game.prototype.putSantaInChimney = function( chinmeyDirection )
{
  this.santaInChimney = true;

  this.santa.alpha = 0.5;
  this.santa.animations.play('idle');
  this.stepsSound.stop();

  // Adjust santa's X position to be centered in chinmey.
  this.santa.position.setTo( this.fireplaceZone.position.x, this.santa.position.y );
  
  this.santaChinmeyDirection = chinmeyDirection;

  this.cacheSantaWorldIndex = this.game.world.getIndex( this.santa );
  var middleGroundTilemapLayerWorldIndex = this.game.world.getIndex( this.middleGroundTilemapLayer );
  this.game.world.remove( this.santa );
  this.game.world.addAt( this.santa, middleGroundTilemapLayerWorldIndex, true );
};

OneRoom.Game.prototype.removeSantaFromChimney = function()
{
  this.santaInChimney = false;
  this.santa.alpha = 1.0;

  this.game.world.remove( this.santa );
  this.game.world.addAt( this.santa, this.cacheSantaWorldIndex, true );
};

OneRoom.Game.prototype.escapeKeyDown = function( button )
{
  OneRoom.setActiveButton( this.modalNoButton );

  this.toggleModal();
};

OneRoom.Game.prototype.debugButtonDown = function( button )
{
  this.debugModeOn = !this.debugModeOn;
};

OneRoom.Game.prototype.spacebarKeyDown = function( button )
{
  console.log("Spacebar down");
  this.hohohoSound.play();
  this.addJollyness(10);
};

OneRoom.Game.prototype.pointerDown = function( sprite, pointer )
{
  this.targetPoint.copyFrom( pointer );

  var position = this.targetPoint;
  this.makeImpact( position.x, position.y );
};

OneRoom.Game.prototype.gamepadUpdate = function()
{
  // NOTE: This method should not actually affect game stay;
  // just issue events (in case of pause state).

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

    this.setupInput( false );
  }

  this.setPaused( !this.paused );
};

OneRoom.Game.prototype.returnToMainMenu = function()
{
  this.game.sound.stopAll();
  
  this.state.start( OneRoom.MainMenu.stateKey, true );
};

OneRoom.Game.prototype.restartLevel = function()
{
  this.game.sound.stopAll(); // TODO: Figure out why this line isn't really stopping sounds.

  this.state.start( OneRoom.Game.stateKey, true, false );
};

OneRoom.Game.prototype.goToNextLevel = function()
{
  this.game.sound.stopAll();
  
  ++OneRoom.currentLevelNumber;

  this.state.start( OneRoom.Game.stateKey, true, false );
};

OneRoom.Game.prototype.makeImpact = function( x, y )
{
  
};

OneRoom.Game.prototype.toggleMute = function()
{
  var mute = !OneRoom.getMute();

  OneRoom.setMute( mute );

  var muteText = mute ? "Unmute" : "  Mute";
  //var muteButtonStyle = mute ? OneRoom.buttonActiveStyle : OneRoom.buttonStyle;

  var muteButtonText = this.muteButton.children[0];
  muteButtonText.text = muteText;
  //muteButtonText.setStyle( muteButtonStyle );
};

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

OneRoom.Game.prototype.render = function()
{
  if( !this.debugModeOn )
  {
    return;
  }

  this.game.debug.body( this.santa );
  this.game.debug.bodyInfo( this.santa, 32, 32 );
  this.game.debug.body( this.treeSprite );
  this.game.debug.body( this.fireplaceZone );
  this.game.debug.cameraInfo(this.game.camera, 32, 400);
};

OneRoom.Game.prototype.setPaused = function( paused )
{
  this.paused = paused;

  this.game.physics.arcade.isPaused = paused;
};
