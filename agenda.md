# cuttleV1

This is a multiplayer card game leveraging sails.js and angularjs.



## TODO
*	Fix Bug where 1off is interrupted by requesting to draw
	*	The player casting original oneOff doesn't get notified that the oneOff is 'pending'
*	Reset Game upon win or stalemate
*	Make oneOff deselect upon casting illegal 3, and 7 into 5/7
*	Make a nice ready screen

## REASEARCH FOR V2
*	Node machines
	*	Passoword encryption
*	ejs syntax for data encapsulation
*	View rendering (pages should be modularized)
	*	Had trouble with res.view() for socket requests. Might be patched?
*	Leverage ng-animate to handle card transitions

## DONE
*	Pass action now checks that the it is the requesting player's turn before passing
*	Deck length counter now adjusts to 1 and no cards in deck
*	Added log to jack and sevenJack actions
*	Updated sevenOneOff to handle ignoring a request to play the last card in the deck as a five
*	Allow drawing the last two cards of the deck
*	Handle 7 with two jacks (illegal case)
*	Handled 4 with two or fewer cards in op's hand
*	Glasses Eights now reset their picture when destroyed by a 2, Or a 6
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
*	Change Jack display
	*	Each Jacks on a given point card should stack vertically
	*	The rest should be horizontally aligned
	*	This means fully populating the cards with their jacks before publishUpdate is called
*	Glasses eights could use a separate rune-img attribute so the image doesn't need changing upon destruction
*	Write find (and possibly save) functions that create and return new promises
*	Write a function that fully populates a game, down through its players' hands/fields and through the attachments on those cards
*	Change id to gameId in get requests
*	Fix the way the "Cards in deck" stat is rendered to account for the only two cards being topCard and secondCard
	*	Build an integer into gameController in app.js, update it with every relevant action and reference that in the HTML	
*	Change 404's into json errors in Controllers (for finds)
	*	Re-order our error arguments to make sense
*	Change conditionals to use temp variables
	*	Do this for turn checking
*	Flesh out readyView to display the number of players in the game and who is ready
*   Make categories for actions with giant comment blocks for easy navigation
*	Make THIS FILE called agenda.md, then make a README.md that has notes on installing and using the app


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