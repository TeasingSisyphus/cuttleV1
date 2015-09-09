# cuttleV1

This is a multiplayer card game leveraging sails.js and angularjs.

## TODO
*	David
	*	Prevent playing a 3 when there is no scrap pile
*	Sam
	*	Prevent playing a 5 with no deck and handle playing a 5 with one card in deck
*	Ryan
	*	Handle 7 for two jacks in ILLEgal case
	*	Handle playing a 4 for two and fewer cards in opponent's hand
*	Queens
	*	Prevent playing a Two on any One Off effect played by someone with a QUEEN
*	Jacks
	*	Make case in seven for when both top cards are jacks: put one in scrap and alert both players what happened
	*	Change their display
		*	Maybe Jacks only stack vertically if they steal the same card?

## DONE
*	QUEENS
	*	FIXED BUG: Playing a oneOff illegally after a seven messes up the selection, so you can't immediately play the card without re-clicking it	
	*	Jacks and sevenJacks are now stopped by an enemy QUEEN
	*	2's and 9's are now properly inhibited by QUEENS
*	The selection bug should no longer fire from playing any number of JACKS
*	JACKS may now be played from a SEVEN
	*	They may not be played on one's own points
*	Properly move jacks to scrap pile in ACE
*	Return points to original owner using modular arithmetic during SIX
*	Enable targeting a jack with a TWO	
*	NINES may now be played upon JACK's, and upon POINT cards that have attached JACKS
*	Handling error cases in jack action, without sending json responses
*	Jack action now has proper test in test/unit/controllers/gameController.test.js
*	Began handling errors using .catch() and reject() in jack action
*	Jacks are now properly moved to the scrap pile when scuttled
*   Jacks now can properly be played for their effects
*	Properly move jacks to scrap pile in SIX
*	Properly move jacks to scrap pile in SEVEN SCUTTLE
*	Jacks now properly remove from the other side when the same card is jacked multiple times
*	Jacks now display the alt text of the stolen card next to the img of the jack




## TESTING
* OBSERVATIONS/NOTES
	* Describe.only('nameOfTestCategory', function() {}) will prevent other tests from running following the given test
* LATENCY
	* Tests take longer than wanted, not an immediate issue, but something to look towards
* DATA CHECKED
	* Turn increments should be tested, along with other cogs of the game


## REFACTORING
*	Write find (and possibly save) functions that create and return new promises
*	Leverage Promises for handling queries and saves
*	Change id to gameId in get requests
*	Change scuttling to find cards on server side, rather than passing them (the full card) from client
	*	Must be done for regular and sevenScuttle
*	Change 404's into json errors in Controllers (for finds)
*	Change conditionals to use temp variables
	*	Do this for turn checking
*	Flesh out readyView to display the number of players in the game and who is ready
*	Re-order our error arguments to make sense
*   Make categories for actions with giant comment blocks for easy navigation



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