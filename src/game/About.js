/** @constructor */
OneRoom.About = function( game )
{
  this.cursorKeys = null;
  this.spaceBar = null;
  this.enterKey = null;
  this.escapeKey = null;

  this.buttonList = [];
  this.exitButton = null;
  this.buttonGroup = null;

  this.contributorListStyle = { font: "32px Arial", fill: "#ffffff" };
  this.contributorRowList = [];

  this.creditsYPosition = 0;
  this.creditsHeight = 0;
  this.creditsTweenList = [];
};

OneRoom.About.stateKey = "About";

OneRoom.About.prototype.init = function()
{
  
};

OneRoom.About.prototype.preload = function()
{
  
};

OneRoom.About.prototype.create = function()
{
  this.stage.backgroundColor = 0x444444; 

  var contributorListLength = 0;
  if( OneRoom.projectInfo !== null &&
      OneRoom.projectInfo.contributors !== undefined )
  {
    contributorListLength = OneRoom.projectInfo.contributors.length;
  }

  var textStartYPosition = this.game.world.centerY;
  var buttonStartYPosition = textStartYPosition + ( contributorListLength + 1 ) * 48;
  this.setupInput( buttonStartYPosition );
  this.setupGraphics( textStartYPosition );
};

OneRoom.About.prototype.setupInput = function( textStartYPosition )
{
  OneRoom.setupButtonKeys( this );

  this.escapeKey = this.input.keyboard.addKey( Phaser.Keyboard.ESC );
  this.escapeKey.onDown.add( this.escapeKeyDown, this );

  OneRoom.backButtonCallback = this.escapeKeyDown;

  // Buttons.
  this.exitButton = OneRoom.createTextButton( this.game.world.centerX, textStartYPosition - ( ( 48 / 2 ) | 0 ),
                                                "Back", this.returnToMainMenu, this );

  this.buttonList.length = 0;
  this.buttonList.push( this.exitButton );

  this.buttonGroup = this.game.add.group();
  this.buttonGroup.add( this.exitButton );

  OneRoom.activeButton = null;
  OneRoom.setActiveButton( this.exitButton );

  OneRoom.setupGamepadsForMenu();

  return textStartYPosition + 1 * 48;
};

OneRoom.About.prototype.setupGraphics = function( textStartYPosition )
{
  textStartYPosition = this.setupAuthorText( textStartYPosition );

  OneRoom.setupTitleAndText( this );

  return textStartYPosition;
};

OneRoom.About.prototype.escapeKeyDown = function()
{
  OneRoom.setActiveButton( this.exitButton );

  this.returnToMainMenu();
};

OneRoom.About.prototype.returnToMainMenu = function()
{
  this.state.start( OneRoom.MainMenu.stateKey );
};

OneRoom.About.prototype.setupAuthorText = function( textStartYPosition )
{
  this.setupCredits( textStartYPosition );
  
  this.createCreditsScrolling();
  this.resetCreditsScrolling();

  return textStartYPosition + this.creditsHeight;
};

OneRoom.About.prototype.setupCredits = function( textStartYPosition )
{
  this.creditsYPosition = textStartYPosition;

  if( OneRoom.projectInfo === null ||
      OneRoom.projectInfo.contributors === undefined )
  {
    return 0;
  }

  // Create labels and gather total field height.
  var contributorList = OneRoom.projectInfo.contributors;

  // Position the labels based on initial alignment.
  this.contributorRowList.length = 0;

  var gameHorizontalCenter = ( this.game.width / 2 ) | 0;
  var columnOffsetFromCenter = 32;
  var nameColumnXPosition = gameHorizontalCenter - columnOffsetFromCenter;
  var contributionColumnXPosition = gameHorizontalCenter + columnOffsetFromCenter;
  
  var labelYPosition = this.creditsYPosition;
  
  var numberOfContributors = contributorList.length;
  var labelHeight = 48;
  this.creditsHeight = numberOfContributors * labelHeight;
  
  var contributor = null;
  for( var i = 0; i < numberOfContributors; i++ )
  {
    contributor = contributorList[i];

    var contributorRow = this.game.add.group();
    contributorRow.position.setTo( 0, labelYPosition );
    this.contributorRowList.push( contributorRow );

    var labelName = this.game.add.text( 0, 0,
      contributor.name, this.contributorListStyle );

    var nameField = null;
    if( contributor.url !== undefined &&
        contributor.url !== "" )
    {
      var urlButton = this.game.add.button( nameColumnXPosition, 0,
        null, this.navigateToContributorUrl, this );

      urlButton.addChild( labelName );
      nameField = urlButton;
    }
    else
    {
      labelName.position.setTo( nameColumnXPosition, 0 );
      nameField = labelName;
    }

    labelName.anchor.setTo( 1.0, 0.5 );
    contributorRow.add( nameField );

    var contributionField = this.game.add.text( contributionColumnXPosition, 0,
      contributor.contribution, this.contributorListStyle );
    contributionField.anchor.setTo( 0, 0.5 );
    contributionField.tint = 0x888888;
    contributorRow.add( contributionField );

    labelYPosition += labelHeight;
  }
};

OneRoom.About.prototype.createCreditsScrolling = function()
{
  if( OneRoom.projectInfo === null ||
      OneRoom.projectInfo.contributors === undefined )
  {
    return;
  }

  this.resetCreditsScrolling();

  var contributorList = OneRoom.projectInfo.contributors;

  // Set up tweens to scroll and fade credits.
  var labelHeight = 48;
  var scrollDistance = 0;
  var scrollTime = 0;
  var scrollSpeed = 0.025;

  var creditsBelowBottomYPosition = this.creditsYPosition + this.creditsHeight;
  var creditsBottomYPosition = creditsBelowBottomYPosition - labelHeight;
  var creditsAboveTopYPosition = this.creditsYPosition - labelHeight;

  this.creditsTweenList.length = 0;

  for( var i = 0; i < contributorList.length; i++ )
  {
    var contributorRow = this.contributorRowList[i];

    var tween = this.game.add.tween( contributorRow );

    scrollDistance = contributorRow.position.y - creditsBottomYPosition;
    scrollTime = ( scrollDistance / scrollSpeed ) | 0;
    tween.to( { alpha: 1.0, y: creditsBottomYPosition },
      scrollTime, Phaser.Easing.Linear.None, false, scrollTime * i );

    scrollDistance = creditsBottomYPosition - this.creditsYPosition;
    scrollTime = ( scrollDistance / scrollSpeed ) | 0;
    tween.to( { y: this.creditsYPosition },
      scrollTime, Phaser.Easing.Linear.None, false );

    scrollDistance = this.creditsYPosition - creditsAboveTopYPosition;
    scrollTime = ( scrollDistance / scrollSpeed ) | 0;
    tween.to( { alpha: 0.0, y: creditsAboveTopYPosition },
      scrollTime, Phaser.Easing.Linear.None, false );
    
    this.creditsTweenList.push( tween );
  }

  // When the last credit goes out of view, restart scrolling.
  var lastTween = this.creditsTweenList[this.creditsTweenList.length - 1];
  if( lastTween !== undefined )
  {
    lastTween.onComplete.add( this.resetCreditsScrolling, this );
  }
};

OneRoom.About.prototype.resetCreditsScrolling = function()
{
  if( OneRoom.projectInfo === null ||
      OneRoom.projectInfo.contributors === undefined )
  {
    return;
  }
  
  var contributorList = OneRoom.projectInfo.contributors;

  var creditsBelowBottomYPosition = this.creditsYPosition + this.creditsHeight;

  // Reset the position of the credits rows.
  for( var i = 0; i < contributorList.length; i++ )
  {
    var contributorRow = this.contributorRowList[i];
    
    contributorRow.position.setTo( 0, creditsBelowBottomYPosition );
    contributorRow.alpha = 0.0;
  }

  // Start tweens.
  for( var tweenIndex = 0; tweenIndex < this.creditsTweenList.length; tweenIndex++ )
  {
    this.creditsTweenList[tweenIndex].start();
  }
};

OneRoom.About.prototype.navigateToContributorUrl = function( button )
{
  var buttonContributorName = button.children[0].text;

  var contributorList = OneRoom.projectInfo.contributors;

  var numberOfContributors = contributorList.length;
  var contributor = null;
  for( var i = 0; i < numberOfContributors; i++ )
  {
    contributor = contributorList[i];
    if( buttonContributorName === contributor.name )
    {
      window.location = contributor.url;
      return;
    }
  }

  console.error( "Contributor name not found from button press: " + buttonContributorName );
};
