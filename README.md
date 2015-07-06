# cuttleV1

This is a multiplayer card game leveraging sails.js and angularjs.

DONE:
	-Jacks now properly remove from the other side when the same card is jacked multiple times
	-Jacks now display the alt text of the stolen card next to the img of the jack

TODO:
-Jacks
	-Properly move jacks to scrap pile in SCUTTLE
	-Properly move jacks to scrap pile in ACE
	-Properly move jacks to scrap pile in SIX
		-Return points to original owner using modular arithmetic
	-Enable targeting a jack with a TWO
		-Switch control of the point card when the jack is destroyed
	-Enable targeting a jack with a NINE
		-Switch control of the point card when the jack is bounced and frozen
-Queens
	-Jacks must check runes for any queens and abort if one if found
	-9's must count the number of queens, abort if 2 or more are found, and abort if 1 is found and the target isn't the queen
	-2's must count the number of queens, abort if 2 or more are found, and abort if 1 is found and the target isn't the queen


REFACTORING
-Change id to gameId in get requests
-Change scuttling to find cards on server side, rather than passing them (the full card) from client
	-Must be done for regular and sevenScuttle
-Change 404's into json errors in Controllers (for finds)
-Change conditionals to use temp variables
	-Do this for turn checking
-Flesh out readyView to display the number of players in the game and who is ready


ONE-OFF RESOLVES FRONT-END:
-Nine: Needs game, needs player of target, needs target card

BUGS:
-FIXED: Sockets don't always connect properly/subscribe you to the game class room upon page load
-FIXED: Server crashes if a player clicks 'ready' before opponent joins the game
-FIXED: $scope.game.players[$scope.game.pNum] is sometimes undefined in app.js and this fucks up selection
-FIXED: Game sometimes crashes upon drawing becasuse game.deck[random] is undefined
	-I believe this is because random was allowed to be as big as game.deck.length, instead of game.deck.length - 1

-SEMI-FIXED: 4's- Clicking the same card twice discards only that card
	-Front end doesn't permit selecting the same card twice
	-Back end will still allow the two id's to be identical

-Angular some times fails to load a card's picture, or loads it painfully slowly
-Changing the border on one of the cards screws with the edges of the card images to the right of it
-In app.js $scope.game.players[$scope.game.pNum].hand[$scope.game.selIndex].class = 'card'; is sometimes undefined
	-This fucks up selecting a card until the next turn

	
FUNKY INTERACTIONS/EXCEPTIONS
-3 with nothing in scrap
-3 for a 3
	-Remove the one-off three from the game????
-7 with 1/no cards in deck
-5 with 1/no cards in deck