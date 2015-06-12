/**
 * GameController
 *
 * @description :: Server-side logic for managing games
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
	subscribe: function(req, res) {
		if (req.isSocket) {
			console.log("\nRecieved request to subscribe socket " + req.socket.id + " to game class room");
			Game.watch(req);
			
			Game.find({}).exec(function(err, games) {
				console.log(games);
				res.send(games);
			});
		}

	},

	create: function(req, res) {
		if (req.isSocket) {
			console.log("\nReceived request to create game from socket " + req.socket.id);
			console.log(req.body);
			Game.create({name: req.body.name}).exec(function(err, newGame) {
				if (err || !newGame) {
					console.log("Game not created!\n");
					console.log(err);
				} else {
					console.log(newGame);
					Game.publishCreate({id: newGame.id, newGame: newGame});
				}
			});
		}
	},

	joinGame: function(req, res) {
		if (req.isSocket) {
			console.log("\nReceived request to join game from socket: " + req.socket.id);
			Game.findOne(req.body.id).populateAll().exec(function(err, game) {
				if (err || !game){
					console.log("Game " + req.body + " not found for joinGame");
					res.send(404);
				} else {
					console.log(game);
					switch (game.players.length) {
						case 0:
						console.log("0 players in game");
							Game.subscribe(req.socket, game);
							Player.create( {
								socketId: req.socket.id,
								pNum: game.players.length,
							}).exec(function(er, newPlayer) {
								console.log(newPlayer);
								game.players.add(newPlayer.id);
								game.save();
								res.send({game: game});
							});
							break;
						case 1:
							console.log("1 player in game");
							Game.subscribe(req.socket, game);
							Player.create({
								socketId: req.socket.id,
								pNum: game.players.length
							}).exec(function(er, newPlayer) {
								console.log(newPlayer);
								game.players.add(newPlayer.id);
								game.save();



								//This is causing extremely POOR PERFORMANCE
								for (suit = 0; suit <= 3; suit++) {
									for (rank = 1; rank <= 13; rank++) {
										var path = 'images/cards/card_' + suit + '_' + rank + '.png';

										switch (rank) {
											case 11:
												var str_rank = 'Jack';
												break;
											case 12:
												var str_rank = 'Queen';
												break;
											case 13:
												var str_rank = 'King';
												break;
											default:
												var str_rank = rank;
												break;
										}
										switch (suit) {
											case 0:
												var str_suit = 'Clubs';
												break;
											case 1:
												var str_suit = 'Diamonds';
												break;
											case 2:
												var str_suit = 'Hearts';
												break;
											case 3:
												var str_suit = 'Spades';
												break;
										}
										var txt = str_rank + ' of ' + str_suit;
										Card.create({
											suit: suit,
											rank: rank,
											img: path,
											alt: txt,
											index: 13 * suit + rank - 1,
											deck: game,
										}).exec(
											function(cardError, card) {
												if (cardError || !card) {
													console.log("Card not created for game " + game.id);
												} else {
													game.deck.add(card.id);
												}
											});
									}
								} //End of for loops	
								game.save(function(e, savedGame) {
									res.send({game: savedGame});
									Game.publishUpdate(game.id, {game: savedGame});
								});							
							});
							break;
						default:
							console.log("Player is attempting to join a full game.");
							res.send(404);
							break;
					}

					
					
					

				}
			});

		}
	},
};

