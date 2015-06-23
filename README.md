# cuttleV1

This is a multiplayer card game leveraging sails.js and angularjs.

URGENT!!!!!!!!!!!
-Must do one-offs for sevens

TODO:

-One offs
	-4's to discard 2 cards
	-9's to bounce a card

REFACTORING
-Change id to gameId in get requests
-Change scuttling to find cards on server side, rather than passing them (the full card) from client
	-Must be done for regular and sevenScuttle
-Change 404's into json errors in Controllers (for finds)
-Change conditionals to use temp variables
	-Do this for turn checking

TESTING
-Look up resolve() not a function issue

ONE-OFF RESOLVES FRONT-END:
-Ace: Needs game, both players, can get by with just game potentially
-Two: Needs game, needs ONE player and a target card
-Three: Needs, target card
-Four: Needs game, and player, will require an extra request
-Five: Needs game, and player
-Six: Same as Ace but with runes
	-Will need to be more robust after jacks are added
-Seven: Needs game and player
-Eight: Save for later
-Nine: Needs game, needs player of target, needs target card

BUGS:
- FIXED: Sockets don't always connect properly/subscribe you to the game class room upon page load
-Server crashes if a player clicks 'ready' before opponent joins the game
-FIXED: $scope.game.players[$scope.game.pNum] is sometimes undefined in app.js and this fucks up selection
-Angular some times fails to load a card's picture, or loads it painfully slowly
-Changing the border on one of the cards screws with the edges of the card images to the right of it
-FIXED: Game sometimes crashes upon drawing becasuse game.deck[random] is undefined
	-I believe this is because random was allowed to be as big as game.deck.length, instead of game.deck.length - 1

FUNKY INTERACTIONS/EXCEPTIONS
-3 with nothing in scrap
-7 for 7
-7 with 1/no cards in deck
-5 with 1/no cards in deck