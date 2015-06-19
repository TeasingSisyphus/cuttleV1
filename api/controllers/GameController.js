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
	subscribe: function(req, res) {
		if (req.isSocket) {
			console.log("\nRecieved request to subscribe socket " + req.socket.id + " to game class room");
			Game.watch(req);
			
			Game.find({}).exec(function(err, games) {
				res.send(games);
			});
		}

	},

	create: function(req, res) {
		if (req.isSocket) {
			console.log("\nReceived request to create game from socket " + req.socket.id);
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

	ready: function(req, res) {
		if ( req.isSocket && req.body.hasOwnProperty('id') ) {
			console.log("\nPlayer w/ socket: " + req.socket.id + " is ready to play.");
			var deal = false;

			Game.findOne(req.body.id).populateAll().exec(function(err, game) {
				if (err || !game) {
					console.log("Game " + req.body.id + " not found for ready");
					res.send(404);
				} else {
					console.log("P0 is ready: " + game.p0Ready);
					console.log("P1 is ready: " + game.p1Ready);

					Player.find([game.players[0].id, game.players[1].id]).populate('hand').exec(function(errr, playerList) {

						var playerSort = sortPlayers(playerList);

						switch (req.body.pNum) {
							case 0:
								game.p0Ready = true;
								if (game.p1Ready) {
									console.log("Both players ready. Firing gameView");
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



								playerSort[0].hand.add(game.deck[random].id);
								game.deck.remove(game.deck[random].id);
								dealt.push(random);	


								for(var i=0; i<5; i++) {
									while (dealt.indexOf(random) >= 0) {
										random = Math.floor((Math.random() * ((max + 1) - min)) + min);
									}
									playerSort[0].hand.add(game.deck[random].id);
									game.deck.remove(game.deck[random].id);
									dealt.push(random);

									while (dealt.indexOf(random) >= 0) {
										random = Math.floor((Math.random() * ((max + 1) - min)) + min);
									}

									playerSort[1].hand.add(game.deck[random].id);
									game.deck.remove(game.deck[random].id);
									dealt.push(random);								

								}

								//Assign topCard
								while (dealt.indexOf(random) >= 0)	{
									random = Math.floor((Math.random() * ((max + 1) - min)) + min);
								}
								dealt.push(random);
								game.topCard = game.deck[random];
								game.deck.remove(game.deck[random].id);


								//Assign secondCard
								while (dealt.indexOf(random) >= 0)	{
									random = Math.floor((Math.random() * ((max + 1) - min)) + min);
								}
								//dealt.push(random);
								game.secondCard = game.deck[random];
								game.deck.remove(game.deck[random].id);



							}

							game.save(function(er, savedGame) {
								if (dealt) {
									playerList[0].save(function(error, savedP0) {

										playerSort[1].save(function(errrrrr, savedP1) {
											var players = [savedP0, savedP1];
											Game.message(savedGame.id, {game: savedGame, players: players});
										});
									});

								}else{

									Game.publishUpdate(game.id, {game: savedGame, change: 'ready'});
								}
							});
					});

				}
			});
		}
	},

	draw: function(req, res) {
		//Find the game id
		//Had something funky happen with populate
		Game.findOne(req.body.id).populate('deck').populate('players').populate('scrap').exec(function (err, game){
			if (err || !game) {
					console.log("Game " + req.body.id + " not found for scuttling");
					res.send(404);
				} else {
				//if (req.socket.id === game.players[0].socketId || req.socket.id === game.players[1].socketId);
				//Find the player id
				Player.findOne(req.body.playerId).populate('hand').populate('points').populate('runes').exec(function (error, foundPlayer) {
					if (error || !foundPlayer) {
						console.log("Player " + req.body.playerId + " not found for scuttling");
						res.send(404);
					} else {
						//Check if it is the current players turn.  If it is add a card to their hand and remove a card from the deck
						//After that, make the second card of the deck the first card of the deck and find a new second card.
						//Add back && foundPlayer.hand.length !== 8
						if (game.turn % 2 === foundPlayer.pNum && game.deck.length !== 0) {
							game.deck.remove(req.body.topCard.id);
							foundPlayer.hand.add(req.body.topCard.id);
							var max = game.deck.length;
							var min = 0;
							var random = Math.floor((Math.random() * ((max + 1) - min)) + min);
							game.topCard = game.secondCard;
							game.secondCard = game.deck[random];
							game.deck.remove(game.deck[random].id);
							game.turn++;
						} 
						game.save(function (errrr, savedGame){
							foundPlayer.save(function (errrrr, savedPlayer){
								res.send({yourTurn: game.turn % 2 === foundPlayer.pNum, handSize: foundPlayer.hand.length !== 8, deckSize: game.deck.length !==0});
								Game.publishUpdate(game.id, {game: savedGame, player: savedPlayer, change: 'draw'});
								});
							});	
						}
				});
			}
		});
	},

	drawAnything: function(req, res) {
		console.log('Logging req.body');
		console.log(req.body);
	},

	scuttle: function(req, res) {
		if (req.isSocket) {
			console.log('\nSocket ' + req.socket.id + ' is requesting to scuttle');
			Game.findOne(req.body.id).populate('players').populate('deck').populate('scrap').exec(function (error, game){
				if (error || !game) {
					console.log("Game " + player.currentGame.id + " not found for scuttling");
					res.send(404);
				} else {
					Player.find([game.players[0].id, game.players[1].id]).populate('hand').populate('points').populate('runes').exec(function (erro, players) {
						if (erro || !players) {
							console.log("Player " + req.body.playerId + " not found for scuttling");
							res.send(404);
						} else if (game.turn % 2 === req.body.pNum) {
							if(req.body.scuttler.rank <= 10 && (req.body.scuttler.rank > req.body.target.rank || (req.body.scuttler.rank === req.body.target.rank && req.body.scuttler.suit > req.body.target.suit))){
								var playerSort = sortPlayers(players);
								playerSort[req.body.pNum].hand.remove(req.body.scuttler.id);
								playerSort[(req.body.pNum + 1) % 2].points.remove(req.body.target.id);
								game.scrap.add(req.body.target.id);
								game.scrap.add(req.body.scuttler.id);
								game.scrapTop = req.body.scuttler;
								game.turn++;

								game.save(function (err, savedGame) {
									playerSort[0].save(function (er, savedP0){
										playerSort[1].save(function (e, savedP1){
											res.send({scuttled: true, highRank: req.body.scuttler.rank > req.body.target.rank, sameRank: req.body.scuttler.rank === req.body.target.rank, highSuit: req.body.scuttler.suit > req.body.target.suit});
											Game.publishUpdate(game.id, {game: savedGame, players: [savedP0, savedP1], change: 'scuttle'});
										});
									});
								});
							} else {
								res.send({scuttled: false, potentialScuttler: req.body.scuttler.rank <= 10, highRank: req.body.scuttler.rank > req.body.target.rank, sameRank: req.body.scuttler.rank === req.body.target.rank, highSuit: req.body.scuttler.suit > req.body.target.suit});
							}
						}
					});
				}
			});
		}
	},

	oneOff: function(req, res) {
		if (req.isSocket) {
			console.log("\nSocket " + req.socket.id + ' is requesting to play oneOff to stack');
			Game.findOne(req.body.gameId).populate('players').populate('deck').populate('scrap').populate('twos').exec(function (error, game) {
				if (error || !game) {
					console.log("Game " + req.body.gameId + " not found for oneOff");
					res.send(404);
				} else {
					Player.findOne(req.body.playerId).populate('hand').populate('points').populate('runes').exec(function (erro, player) {
						if (erro || !player) {
							console.log("Player " + req.body.playerId + " not found for oneOff");
							res.send(404);
						} else {
							Card.findOne(req.body.cardId).exec(function (err, card) {
								if (err || !card) {
									console.log("Card " + req.body.cardId + " not found for oneOff");
									res.send(404);
								} else {
									var firstEffect = game.firstEffect === null;
									if(firstEffect) {
										var validRank = card.rank <= 9 && card.rank !== 8;
										if (validRank) {
											var yourTurn = game.turn % 2 === player.pNum;
											if (yourTurn) {
												game.firstEffect = card;
												player.hand.remove(card.id);
												game.save(function (er, savedGame) {
													player.save(function (e, savedPlayer) {
														Game.publishUpdate(game.id, {change: 'oneOff', game: savedGame, player: savedPlayer, card: card}, req);
														res.send({oneOff: true, firstEffect: true, validRank: validRank, yourTurn: yourTurn, game: savedGame, player: savedPlayer, card: card});
													});
												});
											}
										} 
									//Otherwise the requested card must be a two played as a counter
									} else {
										console.log("This better be a two");
										var validRank = card.rank === 2;
										if (validRank) {
											console.log("'s a two");
											game.twos.add(card.id);
											player.hand.remove(card.id);

											game.save(function (er, savedGame) {
												player.save(function (e, savedPlayer) {
													Game.publishUpdate(game.id, {change: 'oneOff', game: savedGame, player: savedPlayer, card: card}, req);
													res.send({oneOff: true, firstEffect: false, validRank: validRank, game: savedGame, player: savedPlayer});
												});
											});
										}
									}

								}
							});
						}
					});
				}
			});
		}
	},

	resolve: function(req, res) {
		console.log("Logging req.body");
		console.log(req.body);
		if(req.isSocket) {
			console.log("\nSocket " + req.socket.id + ' is requesting to resolve a one off');
			Game.findOne(req.body.gameId).populate('players').populate('deck').populate('scrap').populate('twos').exec(function (error, game) {
				if (error || !game) {
					console.log("Game " + req.body.gameId + " not found for RESOLVING a one off");
					res.send(404);
				} else if (game.firstEffect) {
					console.log('There is a first effect and we are checking the number of twos');
					switch (game.twos.length % 2) {
						case 0:
							console.log('There is an even amount of twos');
							Card.findOne(game.firstEffect).exec(function (erro, card) {
								if (erro || !card) {
									console.log('Card is not found for RESOLVING a one off');
									res.send(404);
								} else {
									switch (card.rank) {
										case 1:
											console.log('The first effect is an Ace');
											Player.find([game.players[0].id, game.players[1].id]).populate('hand').populate('points').populate('runes').exec(function (err, players) {
												if (err || !players[0] || !players[1]) {
													console.log('Players not found in game ' + req.body.gameId + ' for RESOLVE');
													res.send(404);
												} else {
													players[0].points.forEach(function (card, index, points) {
														game.scrap.add(card.id);
														players[0].points.remove(card.id);
													});
													players[1].points.forEach(function (card, index, points) {
														game.scrap.add(card.id);
														players[1].points.remove(card.id);
													});
												game.twos.forEach(function (two, index, twos) {
													game.twos.remove(two.id);
													game.scrap.add(two.id);
												});
												game.scrapTop = game.firstEffect;
												game.scrap.add(game.firstEffect);
												game.firstEffect = null;
												game.turn++;
												game.save(function (er, savedGame) {
													players[0].save(function (e, savedP0) {
														players[1].save(function (e6, savedP1) {
															var playerSort = sortPlayers([savedP0, savedP1]);
															Game.publishUpdate(game.id, {change: 'resolvedAce', game: savedGame, players: playerSort});
														});
													});
												});
												}
											});
											break;
										case 2:
											console.log('The first effect is a two');
											break;
									}
								}
							});
							break;
						case 1:
							console.log('There is an odd number twos');
							game.twos.forEach(function (two, index, twos) {
								game.scrap.add(two.id);
								game.twos.remove(two.id);
							});
							Card.findOne(game.firstEffect).exec(function (err, card) {
								game.scrapTop = card;
								game.scrap.add(card.id);
								game.firstEffect = null;
								game.turn++;

								game.save(function (er, savedGame) {
									Game.publishUpdate(savedGame.id, {change: 'resolvedFizzle', game: savedGame});
								});
							}); 
							break;
					}
				}
			});
		}
	},
};

