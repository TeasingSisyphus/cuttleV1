# cuttleV1

This is a multiplayer card game leveraging sails.js and angularjs.

TODO:
-Enable drawing a card
	-Add the errors after findOnes
-Scuttling
	-Look to refactor errors to send one JSON with all possible error booleans

BUGS:
-Sockets don't always connect properly/subscribe you to the game class room upon page load
-Server crashes if a player clicks 'ready' before opponent joins the game
-$scope.game.players[$scope.game.pNum] is sometimes undefined in app.js and this fucks up selection
-Angular some times fails to load a card's picture, or loads it painfully slowly
-Changing the border on one of the cards screws with the edges of the card images to the right of it