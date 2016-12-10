/** @constructor */
OneRoom.MainMenu = function( game )
{
  this.cursorKeys = null;
  this.spaceBar = null;
  this.enterKey = null;
  this.escapeKey = null;

  this.buttonList = [];
  this.startButton = null;
  this.aboutButton = null;
  this.exitButton = null;
  this.buttonGroup = null;

  this.modalYesButton = null;
  this.modalNoButton = null;
  this.modalGroup = null;

  this.soundList = [];
};

OneRoom.MainMenu.stateKey = "MainMenu";

OneRoom.MainMenu.prototype.init = function()
{
  
};

OneRoom.MainMenu.prototype.preload = function()
{
  
};

OneRoom.MainMenu.prototype.create = function()
{
  this.stage.backgroundColor = 0x444444; 

  this.setupInput();
  this.setupGraphics();
};

OneRoom.MainMenu.prototype.setupInput = function()
{
  OneRoom.setupButtonKeys( this );

  this.escapeKey = this.input.keyboard.addKey( Phaser.Keyboard.ESC );
  this.escapeKey.onDown.add( this.escapeKeyDown, this );

  OneRoom.backButtonCallback = this.escapeKeyDown;

  // Buttons.
  this.startButton = OneRoom.createTextButton( this.game.world.centerX, this.game.world.centerY + 48 * 0,
                                                 "Play", this.startGame, this );

  this.aboutButton = OneRoom.createTextButton( this.game.world.centerX, this.game.world.centerY + 48 * 1,
                                                 "About", this.goToAboutScreen, this );

  this.exitButton  = OneRoom.createTextButton( this.game.world.centerX, this.game.world.centerY + 48 * 2,
                                                 "Quit", this.escapeKeyDown, this );

  this.buttonList.length = 0;
  this.buttonList.push( this.startButton );
  this.buttonList.push( this.aboutButton );
  this.buttonList.push( this.exitButton );

  this.buttonGroup = this.game.add.group();
  this.buttonGroup.add( this.startButton );
  this.buttonGroup.add( this.aboutButton );
  this.buttonGroup.add( this.exitButton );

  OneRoom.activeButton = null;
  OneRoom.setActiveButton( this.startButton );

  // Modal dialog buttons.
  this.modalYesButton = OneRoom.createTextButton( 0, 0,
                                                    "Yes", this.exitGame, this );
  this.modalYesButton.position.setTo( this.game.world.centerX, this.game.world.centerY + 48 * 1 );
  this.modalYesButton.input.priorityID = 3;

  this.modalNoButton = OneRoom.createTextButton( 0, 0,
                                                   "No", this.toggleModal, this );
  this.modalNoButton.position.setTo( this.game.world.centerX, this.game.world.centerY + 48 * 2 );
  this.modalNoButton.input.priorityID = 3;

  OneRoom.setupGamepadsForMenu();
};

OneRoom.MainMenu.prototype.setupGraphics = function()
{
  OneRoom.setupTitleAndText( this );

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

  var modalPromptText = "Are you sure you want to quit?";
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

OneRoom.MainMenu.prototype.startGame = function()
{
  this.game.sound.stopAll();

  this.state.start( OneRoom.Game.stateKey );
};

OneRoom.MainMenu.prototype.goToAboutScreen = function()
{
  this.state.start( OneRoom.About.stateKey );
};

OneRoom.MainMenu.prototype.escapeKeyDown = function( button )
{
  OneRoom.setActiveButton( this.modalNoButton );

  this.toggleModal();
};

OneRoom.MainMenu.prototype.toggleModal = function()
{
  this.modalGroup.visible = !this.modalGroup.visible;

  this.buttonList.length = 0;

  if( this.modalGroup.visible )
  {
    this.buttonList.push( this.modalYesButton );
    this.buttonList.push( this.modalNoButton );
  }
  else
  {
    this.buttonList.push( this.startButton );
    this.buttonList.push( this.aboutButton );
    this.buttonList.push( this.exitButton );

    OneRoom.setActiveButton( this.exitButton );
  }
};

OneRoom.MainMenu.prototype.exitGame = function()
{
  OneRoom.quit();
};

OneRoom.MainMenu.prototype.update = function()
{
  
};
