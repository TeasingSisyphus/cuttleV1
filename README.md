# cuttleV1

This is a multiplayer card game leveraging sails.js and angularjs.

TODO:
-Enable drawing a card
	-Make sure server checks that it is your turn before making allowing the move and that the turn is incrimented after
	-Both the game and one player will need to be updated.
	-Make sure your Game.publishUpdate() is formatted with the data required in our io.socket.on(game) event handler
-Scuttling (FOR MONDAY)

BUGS:
-Sockets don't always connect properly/subscribe you to the game class room upon page load
-Server crashes if a player clicks 'ready' before opponent joins the game
-Angular some times fails to load a card's picture, or loads it painfully slowly
-Changing the border on one of the cards screws with the edges of the card images to the right of it