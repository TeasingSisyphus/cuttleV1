# cuttleV1

This is a multiplayer card game leveraging sails.js and angularjs.

## DONE
*	Jack action now has proper test in test/unit/controllers/gameController.test.js
*	Began handling errors using .catch() and reject() in jack action
*	Jacks are now properly moved to the scrap pile when scuttled
*   Jacks now can properly be played for their effects
*	Properly move jacks to scrap pile in SIX
*	Properly move jacks to scrap pile in SEVEN SCUTTLE
*	Jacks now properly remove from the other side when the same card is jacked multiple times
*	Jacks now display the alt text of the stolen card next to the img of the jack

## TODO
*	Jacks
	*	Handle errors for queries and saves using catch() and reject()
		*	Started this process. It generally looks good, but we should be careful to ensure that it's thorough
	*	Playing all 4 jacks on one point card has triggered the selection bug
		*	Cards become unselectable until next turn (ie player must choose to draw to continue game)
	
	*	Properly move jacks to scrap pile in ACE
	*	Return points to original owner using modular arithmetic during SIX
	*	Enable targeting a jack with a TWO
			*Switch control of the point card when the jack is destroyed
	*	Enable targeting a jack with a NINE
		*	Switch control of the point card when the jack is bounced and frozen
	*	Change their display
		*	Maybe Jacks only stack vertically if they steal the same card?
	*	Enable playing a jack from a SEVEN one-off effect

*	Queens
	*	Jacks must check runes for any queens and abort if one if found
	*	9's must count the number of queens, abort if 2 or more are found, and abort if 1 is found and the target isn't the queen
	*	2's must count the number of queens, abort if 2 or more are found, and abort if 1 is found and the target isn't the queen

## TESTING
* OBSERVATIONS/NOTES
	* describe.only('nameOfTestCategory', function() {}) will prevent other tests from running following the given test


## REFACTORING
*	Leverage Promises for handling queries and saves
*	Change id to gameId in get requests
*	Change scuttling to find cards on server side, rather than passing them (the full card) from client
	*	Must be done for regular and sevenScuttle
*	Change 404's into json errors in Controllers (for finds)
*	Change conditionals to use temp variables
	*	Do this for turn checking
*	Flesh out readyView to display the number of players in the game and who is ready
*	Re-order our error arguments to make sense


## ONE-OFF RESOLVES FRONT-END
*	Nine
	*	Needs game, needs player of target, needs target card

## ANGULAR BUGS
*	Angular some times fails to load a card's picture, or loads it painfully slowly
*	Changing the border on one of the cards screws with the edges of the card images to the right of it
*	In app.js $scope.game.players[$scope.game.pNum].hand[$scope.game.selIndex].class = 'card'; is sometimes undefined
	*	This fucks up selecting a card until the next turn

## FIXED BUGS
*   FIXED: Jacks now behave properly and allow stacking of multiple jacks on a single point card
*	FIXED: Sockets don't always connect properly/subscribe you to the game class room upon page load
*	FIXED: Server crashes if a player clicks 'ready' before opponent joins the game
*	FIXED: $scope.game.players[$scope.game.pNum] is sometimes undefined in app.js and this fucks up selection
*	FIXED: Game sometimes crashes upon drawing becasuse game.deck[random] is undefined
	*	I believe this is because random was allowed to be as big as game.deck.length, instead of game.deck.length - 1
*	FIXED: 4's
	*	Clicking the same card twice discards only that card
	*	Front end doesn't permit selecting the same card twice
	*	Back end will still allow the two id's to be identical

## FUNKY INTERACTIONS/EXCEPTIONS
*	3 with nothing in scrap
*	3 for a 3
	*	Remove the one-off three from the game????
*	7 with 1/no cards in deck
*	5 with 1/no cards in deck