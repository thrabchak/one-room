/** @constructor */
OneRoom =
{
  game: null,

  projectInfo: null,

  settings:
  {
    local:
    {
      mute: false
    },
    session:
    {

    }
  },

  screenWidth: 960,
  screenHeight: 540,

  titleStyle: { font: "72px Arial", fill: "#ffffff" },

  buttonTextColor: 0xffffff,
  buttonTextOverColor: 0xffff00,
  buttonStyle: { font: "32px Arial", fill: "#ffffff" },
  buttonActiveStyle: { font: "32px Arial", fill: "#ffffff", fontStyle: "italic" },

  activeButton: null,

  backButtonCallback: null,

  gamepadList: [],
  gamepadMenuCallbackList: [],
  lastGamepadYAxis: 0.0,

  // NW (formerly Node Webkit) container.
  nw:
  {
    gui: null,
    window: null
  },

  //
  numberOfLevels: 0,
  currentLevelNumber: 0
};

OneRoom.run = function()
{
  this.game = new Phaser.Game( this.screenWidth, this.screenHeight,
                               Phaser.CANVAS, "", this );

  this.game.state.add( OneRoom.Boot.stateKey, OneRoom.Boot );
  this.game.state.add( OneRoom.Preloader.stateKey, OneRoom.Preloader );
  this.game.state.add( OneRoom.MainMenu.stateKey, OneRoom.MainMenu );
  this.game.state.add( OneRoom.Game.stateKey, OneRoom.Game );
  this.game.state.add( OneRoom.About.stateKey, OneRoom.About );

  this.game.state.start( OneRoom.Boot.stateKey );

  this.setupPlatform();
};

OneRoom.setupPlatform = function()
{
  // TODO: Abstract differences between using NW JS and Cordova.
  this.setupNw();
  this.setupCordova();
};

OneRoom.setupNw = function()
{
  // Set up NW.
  if( typeof( require ) !== "undefined" )
  {
    try
    {
      this.nw.gui = require( "nw.gui" );
    }
    catch( exception )
    {
      this.nw.gui = null;
      this.nw.window = null;
      
      console.error( "NW is not present." );
      return;
    }

    if( this.nw.gui !== null )
    {
      this.nw.window = this.nw.gui.Window.get();
      this.nw.window.show();
    }
  }
};

OneRoom.setupCordova = function()
{
  if( window.cordova !== undefined )
  {
    document.addEventListener( "deviceready", this.onDeviceReady.bind( this ), false );
  }
};

OneRoom.onDeviceReady = function()
{
  document.addEventListener( "backbutton", this.onBackButton.bind( this ), false );
};

OneRoom.onBackButton = function( event )
{
  if( this.backButtonCallback !== null )
  {
    event.preventDefault();
    this.backButtonCallback.call( this.game.state.getCurrentState() );
  }
};

OneRoom.quit = function()
{
  if( OneRoom.nw.window !== null )
  {
    // Close application window.
    OneRoom.nw.window.close();
  }
  else
  if( window.cordova !== undefined && cordova.platformId !== "browser" )
  {
    // Close application.
    navigator.app.exitApp();
  }
  else
  {
    // Redirect to project website if running in browser.
    if( OneRoom.projectInfo === null ||
        OneRoom.projectInfo.homepage === "" )
    {
      console.warn( "homepage not set in package.json." );
      return;
    }
    
    window.location = OneRoom.projectInfo.homepage;
  }
};

OneRoom.setupButtonKeys = function( state )
{
  state.cursorKeys = state.input.keyboard.createCursorKeys();
  state.cursorKeys.up.onDown.add( OneRoom.upButtonDown, state );
  state.cursorKeys.down.onDown.add( OneRoom.downButtonDown, state );

  state.spaceBar = state.input.keyboard.addKey( Phaser.Keyboard.SPACEBAR );
  state.spaceBar.onDown.add( OneRoom.activateButtonDown, state );
  state.enterKey = state.input.keyboard.addKey( Phaser.Keyboard.ENTER );
  state.enterKey.onDown.add( OneRoom.activateButtonDown, state );
};

OneRoom.clearButtonKeys = function( state )
{
  state.cursorKeys.up.onDown.removeAll();
  state.cursorKeys.down.onDown.removeAll();
  state.cursorKeys = null;
  
  state.spaceBar.onDown.removeAll();
  state.spaceBar = null;
  state.enterKey.onDown.removeAll();
  state.enterKey = null;
};

OneRoom.cycleActiveButton = function( direction )
{
  var state = this.game.state.getCurrentState();

  var index = -1;

  // Cycle active button.
  if( OneRoom.activeButton === null )
  {
    index = 0;
  }
  else
  {
    index = state.buttonList.indexOf( OneRoom.activeButton );
    var currentIndex = index;

    index += direction;
    if( index >= state.buttonList.length )
    {
      index = 0;
    }
    else
    if( index < 0 )
    {
      index = state.buttonList.length - 1;
    }

    if( currentIndex === index )
    {
      // No need to change active buttons.
      return;
    }

    OneRoom.setActiveButton( null );
  }

  OneRoom.setActiveButton( state.buttonList[index] );
};

OneRoom.upButtonDown = function( button )
{
  OneRoom.cycleActiveButton( -1 );
};

OneRoom.downButtonDown = function( button )
{
  OneRoom.cycleActiveButton( 1 );
};

OneRoom.activateButtonDown = function( button )
{
  var activeButton = OneRoom.activeButton;
  if( activeButton === null )
  {
    // Default active button to start button for quick navigation.
    activeButton = this.buttonList[0];
    if( activeButton === undefined )
    {
      activeButton = null;
    }
    
    OneRoom.setActiveButton( activeButton );
  }
  
  // Directly call state's logic for this button.
  activeButton.activate.call( this.game.state.getCurrentState(), activeButton, null );
};

OneRoom.createTextButton = function( x, y, text, callback, callbackContext, style )
{
  var button = this.game.add.button( x, y, null, callback, callbackContext );
  button.anchor.setTo( 0.5, 0.5 );

  if( style === undefined )
  {
    style = this.buttonStyle;
  }
  
  var label = new Phaser.Text( this.game, 0, 0, text, style );
  label.anchor.setTo( 0.5, 0.5 );

  label.tint = this.buttonTextColor;

  button.addChild( label );
  button.texture.baseTexture.skipRender = false; // TODO: Remove when Phaser 2.4.5 releases with fix.

  button.events.onInputOver.add( OneRoom.textButtonOnInputOver, callbackContext );
  button.events.onInputOut.add( OneRoom.textButtonOnInputOut, callbackContext );

  button.activate = callback;

  return button;
};

OneRoom.setActiveButton = function( button )
{
  if( OneRoom.activeButton !== null )
  {
    OneRoom.activeButton.children[0].tint = OneRoom.buttonTextColor;
    this.game.add.tween( OneRoom.activeButton.scale ).to( { x: 1.0, y: 1.0 }, 125, Phaser.Easing.Linear.None, true );
  }

  OneRoom.activeButton = button;

  if( button !== null )
  {
    button.children[0].tint = OneRoom.buttonTextOverColor;
    this.game.add.tween( button.scale ).to( { x: 1.125, y: 1.125 }, 125, Phaser.Easing.Linear.None, true );
  }
};

OneRoom.textButtonOnInputOver = function( button, pointer )
{
  OneRoom.setActiveButton( button );
};

OneRoom.textButtonOnInputOut = function( button, pointer )
{
  OneRoom.setActiveButton( null );
};

OneRoom.setupGamepadsForMenu = function()
{
  this.gamepadMenuCallbackList.length = 0;
  this.gamepadMenuCallbackList.onDown = this.gamepadOnDown;
  this.gamepadMenuCallbackList.onAxis = this.gamepadOnAxis;

  this.game.input.gamepad.addCallbacks( this, this.gamepadMenuCallbackList );
};

OneRoom.gamepadOnDown = function( buttonIndex, buttonValue, gamepadIndex )
{
  console.log( buttonIndex, buttonValue, gamepadIndex );

  var cycleDirection = 0;

  switch( buttonIndex )
  {
    case Phaser.Gamepad.XBOX360_DPAD_UP:
    {
      cycleDirection = -1;
      break;
    }

    case Phaser.Gamepad.XBOX360_DPAD_DOWN:
    {
      cycleDirection = 1;
      break;
    }
  }

  if( cycleDirection !== 0 )
  {
    this.cycleActiveButton( cycleDirection );
  }
  else
  {
    if( buttonIndex === Phaser.Gamepad.XBOX360_B )
    {
      this.activateButtonDown( this.activeButton );
    }
  }
};

OneRoom.gamepadOnAxis = function( gamepad, axisIndex, axisValue )
{
  console.log( axisIndex, axisValue );

  if( axisIndex === Phaser.Gamepad.XBOX360_STICK_LEFT_Y )
  {
    var cycleDirection = 0;

    if( axisValue < -0.1 && this.lastGamepadYAxis >= -0.1 )
    {
      cycleDirection = -1;
    }
    else
    if( axisValue > 0.1 && this.lastGamepadYAxis <= 0.1 )
    {
      cycleDirection = 1;
    }

    this.lastGamepadYAxis = axisValue;

    if( cycleDirection !== 0 )
    {
      this.cycleActiveButton( cycleDirection );
    }
  }
};

OneRoom.setupTitleAndText = function( state )
{
  // Title.
  var titleTextX = state.world.centerX;
  var titleTextY = ( state.world.height * ( 1 - 0.67 ) ) | 0;
  
  var titleText = state.add.text( titleTextX, titleTextY,
                                  OneRoom.projectInfo.window.title, OneRoom.titleStyle );

  titleText.anchor.setTo( 0.5 );

  // All text.
  var allTextGroup = state.game.add.group();
  allTextGroup.add( titleText );
  allTextGroup.add( state.buttonGroup );
  allTextGroup.alpha = 0.0;

  this.game.add.tween( allTextGroup ).to( { alpha: 1 }, 500, Phaser.Easing.Linear.None, true );
};

OneRoom.stopSounds = function( soundList )
{
  if( soundList === undefined )
  {
    this.game.sound.stopAll();
    return;
  }

  var sound = null;
  for( var i = 0; i < soundList.length; i++ )
  {
    sound = soundList[i];
    sound.stop();
  }
};

OneRoom.getMute = function()
{
  return this.settings.local.mute;
};

OneRoom.setMute = function( mute )
{
  if( this.settings.local.mute !== mute )
  {
    this.settings.local.mute = mute;

    this.storeLocalSettings();
  }

  this.game.sound.mute = mute;
};

OneRoom.retrieveLocalSettings = function()
{
  if( typeof( Storage ) === undefined )
  {
    console.warn( "Local Storage not supported." );
    return;
  }

  var settingsLocal = localStorage.getItem( "localSettings" );
  if( settingsLocal === null )
  {
    // No local settings saved yet.
    return;
  }
  
  this.settings.local = JSON.parse( settingsLocal );

  // Do any actions that should come out of potentially changing
  // any local settings.
  this.setMute( this.settings.local.mute );
};

OneRoom.storeLocalSettings = function()
{
  if( typeof( Storage ) === undefined )
  {
    console.warn( "Local Storage not supported." );
    return;
  }

  localStorage.setItem( "localSettings", JSON.stringify( this.settings.local ) );
};
