/**
 * GameController
 *
 * @description :: Server-side logic for managing games
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
					switch (game.players.length) {
						case 0:
						console.log("0 players in game");
							Game.subscribe(req.socket, game);
							Player.create( {
								socketId: req.socket.id,
								pNum: game.players.length,
							}).exec(function(er, newPlayer) {
								game.players.add(newPlayer.id);
								game.save(function(er, savedGame) {
									res.send({game: savedGame});
								});
							});
							break;
						case 1:
							console.log("1 player in game");
							Game.subscribe(req.socket, game);
							Player.create({
								socketId: req.socket.id,
								pNum: game.players.length
							}).exec(function(er, newPlayer) {
								game.players.add(newPlayer.id);

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
												deck: game,
											}).exec(function(cardError, card) {
													if (cardError || !card) {
														console.log("Card not created for game " + game.id);
													} else {
														console.log("\nLogging card as it is creatd");
														console.log(card);
														game.deck.add(card.id);
													}
												});
										}
									} //End of for loops	


									// var dealt = [];


									// var min = 0;
									// var max = 51;

									// var random = Math.floor((Math.random() * ((max + 1) - min)) + min);

									// console.log("\nRandom is " + random);


									// game.players[0].hand.add(tempDeck[random].id);
									// game.deck.remove(tempDeck[random].id);
									// dealt.push(random);

									// for (var i=0; i<5; i++) {
									// 	while (random in dealt) {
									// 		random = Math.floor((Math.random() * ((max + 1) - min)) + min);
									// 		console.log("Random is " + random);
									// 	}


									// 	newPlayer.hand.add(tempDeck[random].id);
									// 	game.deck.remove(tempDeck[random].id);
									// 	dealt.push(random);

									// 	while (random in dealt) {
									// 		random = Math.floor((Math.random() * ((max + 1) - min)) + min);
									// 		console.log("Random is " + random);

									// 	}

									// 	game.players[0].hand.add(tempDeck[random].id);
									// 	game.deck.remove(tempDeck[random].id);
									// 	dealt.push(random);
									// }
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

	ready: function(req, res) {
		if ( req.isSocket && req.body.hasOwnProperty('id') ) {
			console.log("\nPlayer w/ socket: " + req.socket.id + " is ready to play.");
			console.log(req.body);
			var deal = false;

			Game.findOne(req.body.id).populateAll().exec(function(err, game) {
				if (err || !game) {
					console.log("Game " + req.body.id + " not found for ready");
					res.send(404);
				} else {
					console.log("P0 is ready: " + game.p0Ready);
					console.log("P1 is ready: " + game.p1Ready);

					Player.find([game.players[0].id, game.players[1].id]).populateAll().exec(function(errr, playerList) {
						var playerSort = sortPlayers(playerList);
						console.log("\nLogging playerSort: ");
						console.log(playerSort);

					switch (req.body.pNum) {
						case 0:
							game.p0Ready = true;
							if (game.p1Ready) {
								consoele.log("Both players ready. Firing gameView");
								deal = true;
							}
							break;
						case 1:
							game.p1Ready = true;
							if (game.p0Ready) {
								console.log("Both players ready. Firing gameView");
								deal = true;
							}
							break;
					}

						if (deal) {
							var dealt = [];
							var min = 0;
							var max = 51;

							var random = Math.floor((Math.random() * ((max + 1) - min)) + min);

							console.log("\nRandom is " + random);


							playerSort[0].hand.add(game.deck[random].id);
							game.deck.remove(game.deck[random].id);
							dealt.push("1st random: " + random);	


							for(var i=0; i<5; i++) {
								while (dealt.indexOf(random) >=0) {
									var random = Math.floor((Math.random() * ((max + 1) - min)) + min);
								}
								console.log("Random: " + random);

								playerSort[0].hand.add(game.deck[random].id);
								game.deck.remove(game.deck[random].id);
								dealt.push(random);

								while (dealt.indexOf(random) >=0) {
									var random = Math.floor((Math.random() * ((max + 1) - min)) + min);
								}
								console.log("Random: " + random);

								playerSort[1].hand.add(game.deck[random].id);
								game.deck.remove(game.deck[random].id);
								dealt.push(random);								

							}	


						}

						game.save(function(er, savedGame) {
							console.log("Saving the game");
							if (dealt) {
								playerSort[0].save(function(e, savedP0) {
									// playerSort[1].save(function(errrrrr, savedP1) {

										Game.message(savedGame.id, {game: savedGame});
									// });
								});
							}else{

								Game.publishUpdate(game.id, {game: savedGame});
							}
						});
					});

				}
			});
		}
	}
};

