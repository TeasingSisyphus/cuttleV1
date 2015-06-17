/**
 * PlayerController
 *
 * @description :: Server-side logic for managing players
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
	//Subscribes the requesting socket to the two player models in their game
	subscribe: function(req, res) {
		if (req.isSocket) {
			console.log("\nPlayer Subscription requested from socket: " + req.socket.id);
			if (req.body.hasOwnProperty('p0Id') && req.body.hasOwnProperty('p1Id')) {
				console.log("Subscribing");
				Player.subscribe(req.socket, [req.body.p0Id, req.body.p1Id]);
			}
		}
	},

	//Moves a card from a player's hand to that player's points
	points: function(req, res) {
		if (req.isSocket) {
			console.log("\nPlayer " + req.socket.id + " requesting to play points");
			if (req.body.hasOwnProperty('playerId') && req.body.hasOwnProperty('cardId')) {
				Player.findOne(req.body.playerId).populate('hand').populate('points').populate('runes').exec(function(err, player) {
					if (err || !player) {
						console.log("Player " + req.body.playerId + " not found for points");
						res.send(404);
					} else {
						Card.findOne(req.body.cardId).exec(function(er, card) {
							if (er || !card) {
								console.log("Card " + req.body.cardId + " not found for points.");
								res.send(404);
							} else {
								//Use the player's current game attribute to find the containing game to check the turn
								//Server crashed when I tried populating the game here
								Game.findOne(player.currentGame).exec(function(error, game){
									if (err || !game) {
										console.log("Game " + player.currentGame.id + " not found for points");
										res.send(404);
									} else {
										if (game.turn % 2 === player.pNum && card.rank <= 10) {

											player.hand.remove(card.id);
											player.points.add(card.id);
											game.turn++;

											///////////////////
											// Check for win //
											///////////////////

											player.save(function(e, savedPlayer) {
												Player.publishUpdate(savedPlayer.id, {player: savedPlayer});
												//The save was causing the server to crash when I populated the game in the find
												game.save();
											});
										} else {
											console.log("not a legal move!");
											res.send("Not a legal move!");
										}
									}							
								});
							}
						});
					}

				});
			}
		}
	}
	
};

