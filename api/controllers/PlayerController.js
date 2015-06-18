/**
 * PlayerController
 *
 * @description :: Server-side logic for managing players
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var sortPlayers = function(players) {
	var sorted = [];

	for (var i = 0; i < players.length; i++) {
		sorted.push(players[i]);
	}

	sorted.sort(function(a, b) {
		return a.pNum - b.pNum
	});

	return sorted;
};

//Checks if one player has won; returns true if so, false otherwise
var winner = function(player) {
	console.log("\nChecking player " + player.socketId + " for a win");
	var kings = 0;
	var points = 0;

	//Check kings for p0
	player.runes.forEach(function(rune, index, runes) {
		if (rune.rank === 13) {
			kings++;
		}
	});

	//Check points for p0
	player.points.forEach(function(point, index, ponits) {
		points += point.rank;
	});

	console.log("Player " + player.id + " has " + kings + " kings and " + points + " points");

	switch (kings) {
		case 0:
			if (points >= 21) {
				console.log("Victory!");
				return true;
			} else {
				return false;
			}
			break;
		case 1:
			if (points >= 14) {
				console.log("Victory!");
				return true;
			} else {
				return false;
			}
			break;
		case 2:
			if(points >= 10) {
				console.log("Victory!");
				return true;
			} else {
				return false;
			}
			break;
		case 3:
			if (points >= 7) {
				console.log("Victory!");
				return true;
			} else {
				return false;
			}
			break;
		case 4:
			if (points >= 5) {
				console.log("Victory!");
				return true;
			} else {
				return false;
			}
			break;
	}
};





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


											player.save(function(e, savedPlayer) {
												//Assign winner if player has won
												var victor = winner(savedPlayer);
												
												if (victor) {
													game.winner = savedPlayer.pNum;
												}

												Player.publishUpdate(savedPlayer.id, {change: 'points', victor: victor, player: savedPlayer});
												res.send({points: true, turn: game.turn % 2 === player.pNum, rank: card.rank <= 10});
												game.turn++;
												game.save();
											});
										} else {
											console.log("not a legal move!");
											res.send({points: false, turn: game.turn % 2 === player.pNum, rank: card.rank <= 10});
										}
									}							
								});
							}
						});
					}

				});
			}
		}
	},

	runes: function(req, res) {
		if (req.isSocket) {
			console.log("\nPlayer " + req.socket.id + " requesting to play rune");
			if (req.body.hasOwnProperty('playerId') && req.body.hasOwnProperty('cardId')) {
				Player.findOne(req.body.playerId).populate('hand').populate('points').populate('runes').exec(function(error, player) {
					if (error || !player) {
						console.log("Player " + req.body.playerId + " not found for runes");
						res.send(404);
					} else {
						Card.findOne(req.body.cardId).exec(function(erro, card) {
							if (erro || !card) {
								console.log("Card " + req.body.cardId + " not found for runes");
								res.send(404);
							} else {
								Game.findOne(player.currentGame).exec(function(err, game) {
									if (err || !game) {
										console.log("Game " + player.currentGame.id + " not found for runes");
										res.send(404);
									} else {
										if (game.turn % 2 === player.pNum && (card.rank === 12 || card.rank === 13)) {

											player.hand.remove(card.id);
											player.runes.add(card.id);

											player.save(function(er, savedPlayer) {
												var victor = winner(savedPlayer);
												console.log("Victory: " + victor);
												if (victor) {
													game.winner = savedPlayer.pNum;
												}

												Player.publishUpdate(savedPlayer.id, {change: 'runes', victor: victor, player: savedPlayer});
												res.send({runes: true, turn: game.turn % 2 === player.pNum, rank: (card.rank === 12 || card.rank === 13)});
												game.turn++;
												game.save();

											});
										} else {
											console.log("Not a legal move!");
											res.send({runes: false, turn: game.turn % 2 === player.pNum, rank: (card.rank === 12 || card.rank === 13)});
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

