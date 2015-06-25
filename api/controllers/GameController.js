/**
 * GameController
 *
 * @description :: Server-side logic for managing games
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */


var sortPlayers = function (players) {
	var sorted = [];

	for (var i = 0; i < players.length; i++) {
		sorted.push(players[i]);
	}

	sorted.sort(function (a, b) {
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
	player.runes.forEach(function (rune, index, runes) {
		if (rune.rank === 13) {
			kings++;
		}
	});

	//Check points for p0
	player.points.forEach(function (point, index, ponits) {
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
			if (points >= 10) {
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

			Game.find({}).exec(function (err, games) {
				res.send(games);
			});
		}

	},

	create: function(req, res) {
		if (req.isSocket) {
			console.log("\nReceived request to create game from socket " + req.socket.id);
			Game.create({
				name: req.body.name
			}).exec(function (err, newGame) {
				if (err || !newGame) {
					console.log("Game not created!\n");
					console.log(err);
				} else {
					console.log(newGame);
					Game.publishCreate({
						id: newGame.id,
						newGame: newGame
					});
				}
			});
		}
	},

	joinGame: function(req, res) {
		if (req.isSocket) {
			console.log("\nReceived request to join game from socket: " + req.socket.id);
			Game.findOne(req.body.id).populateAll().exec(function (err, game) {
				if (err || !game) {
					console.log("Game " + req.body + " not found for joinGame");
					res.send(404);
				} else {
					switch (game.players.length) {
						case 0:
							console.log("0 players in game");
							Game.subscribe(req.socket, game);
							Player.create({
								socketId: req.socket.id,
								pNum: game.players.length,
							}).exec(function (er, newPlayer) {
								game.players.add(newPlayer.id);
								game.save(function (er, savedGame) {
									res.send({
										game: savedGame
									});
								});
							});
							break;
						case 1:
							console.log("1 player in game");
							Game.subscribe(req.socket, game);
							Player.create({
								socketId: req.socket.id,
								pNum: game.players.length
							}).exec(function (er, newPlayer) {
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
										}).exec(function (cardError, card) {
											if (cardError || !card) {
												console.log("Card not created for game " + game.id);
											} else {

												game.deck.add(card.id);
											}
										});
									}
								} //End of for loops	


								game.save(function (e, savedGame) {
									res.send({
										game: savedGame
									});
									Game.publishUpdate(game.id, {
										game: savedGame
									});
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
		if (req.isSocket && req.body.hasOwnProperty('id')) {
			console.log("\nPlayer w/ socket: " + req.socket.id + " is ready to play.");
			var deal = false;

			Game.findOne(req.body.id).populateAll().exec(function (err, game) {
				if (err || !game) {
					console.log("Game " + req.body.id + " not found for ready");
					res.send(404);
				} else {
					console.log("P0 is ready: " + game.p0Ready);
					console.log("P1 is ready: " + game.p1Ready);

					Player.find([game.players[0].id, game.players[1].id]).populate('hand').exec(function (errr, playerList) {

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


							for (var i = 0; i < 5; i++) {
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
							while (dealt.indexOf(random) >= 0) {
								random = Math.floor((Math.random() * ((max + 1) - min)) + min);
							}
							dealt.push(random);
							game.topCard = game.deck[random];
							game.deck.remove(game.deck[random].id);


							//Assign secondCard
							while (dealt.indexOf(random) >= 0) {
								random = Math.floor((Math.random() * ((max + 1) - min)) + min);
							}
							//dealt.push(random);
							game.secondCard = game.deck[random];
							game.deck.remove(game.deck[random].id);



						}

						game.save(function (er, savedGame) {
							if (dealt) {
								playerList[0].save(function (error, savedP0) {

									playerSort[1].save(function (errrrrr, savedP1) {
										var players = [savedP0, savedP1];
										Game.message(savedGame.id, {
											game: savedGame,
											players: players
										});
									});
								});

							} else {

								Game.publishUpdate(game.id, {
									game: savedGame,
									change: 'ready'
								});
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
		Game.findOne(req.body.id).populate('deck').populate('players').populate('scrap').exec(function (err, game) {
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

							foundPlayer.hand.add(game.topCard);
							var max = game.deck.length - 1;
							var min = 0;
							var random = Math.floor((Math.random() * ((max + 1) - min)) + min);
							game.topCard = game.secondCard;
							game.secondCard = game.deck[random];
							game.deck.remove(game.deck[random].id);
							game.turn++;
						}
						game.save(function (errrr, savedGame) {
							foundPlayer.save(function (errrrr, savedPlayer) {
								res.send({
									yourTurn: game.turn % 2 === foundPlayer.pNum,
									handSize: foundPlayer.hand.length !== 8,
									deckSize: game.deck.length !== 0
								});
								Game.publishUpdate(game.id, {
									game: savedGame,
									player: savedPlayer,
									change: 'draw'
								});
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
			Game.findOne(req.body.id).populate('players').populate('deck').populate('scrap').exec(function (error, game) {
				if (error || !game) {
					console.log("Game " + player.currentGame.id + " not found for scuttling");
					res.send(404);
				} else {
					Player.find([game.players[0].id, game.players[1].id]).populate('hand').populate('points').populate('runes').exec(function (erro, players) {
						if (erro || !players) {
							console.log("Player " + req.body.playerId + " not found for scuttling");
							res.send(404);
						} else if (game.turn % 2 === req.body.pNum) {
							if (req.body.scuttler.rank <= 10 && (req.body.scuttler.rank > req.body.target.rank || (req.body.scuttler.rank === req.body.target.rank && req.body.scuttler.suit > req.body.target.suit))) {
								var playerSort = sortPlayers(players);
								playerSort[req.body.pNum].hand.remove(req.body.scuttler.id);
								playerSort[(req.body.pNum + 1) % 2].points.remove(req.body.target.id);
								game.scrap.add(req.body.target.id);
								game.scrap.add(req.body.scuttler.id);
								game.scrapTop = req.body.scuttler;
								game.scrapTop.class = 'card';
								game.turn++;

								game.save(function (err, savedGame) {
									playerSort[0].save(function (er, savedP0) {
										playerSort[1].save(function (e, savedP1) {
											res.send({
												scuttled: true,
												highRank: req.body.scuttler.rank > req.body.target.rank,
												sameRank: req.body.scuttler.rank === req.body.target.rank,
												highSuit: req.body.scuttler.suit > req.body.target.suit
											});
											Game.publishUpdate(game.id, {
												game: savedGame,
												players: [savedP0, savedP1],
												change: 'scuttle'
											});
										});
									});
								});
							} else {
								res.send({
									scuttled: false,
									potentialScuttler: req.body.scuttler.rank <= 10,
									highRank: req.body.scuttler.rank > req.body.target.rank,
									sameRank: req.body.scuttler.rank === req.body.target.rank,
									highSuit: req.body.scuttler.suit > req.body.target.suit
								});
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
									if (firstEffect) {
										var validRank = card.rank <= 9 && card.rank !== 8;
										if (validRank) {
											var yourTurn = game.turn % 2 === player.pNum;
											if (yourTurn) {

												game.firstEffect = card;
												player.hand.remove(card.id);
												//Switch to determine targeting requirements of the oneOff
												switch (card.rank) {
													case 2:
													case 9:
														console.log("Request made to play two or 9");
														if (req.body.hasOwnProperty('targetId')) {
															card.targetId = req.body.targetId;
															card.save();
														} else {
															console.log("No target provided for oneOff requiring it");
															return res.send({
																oneOff: false,
																firstEffect: true,
																validRank: validRank,
																yourTurn: yourTurn,
																game: savedGame,
																player: savedPlayer,
																card: card,
																hadTarget: false
															});
														}
														break;
												}
												game.save(function (er, savedGame) {
													player.save(function (e, savedPlayer) {
														Game.publishUpdate(game.id, {
															change: 'oneOff',
															game: savedGame,
															player: savedPlayer,
															card: card
														}, req);
														res.send({
															oneOff: true,
															firstEffect: true,
															validRank: validRank,
															yourTurn: yourTurn,
															game: savedGame,
															player: savedPlayer,
															card: card
														});
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
													Game.publishUpdate(game.id, {
														change: 'oneOff',
														game: savedGame,
														player: savedPlayer,
														card: card
													}, req);
													res.send({
														oneOff: true,
														firstEffect: false,
														validRank: validRank,
														game: savedGame,
														player: savedPlayer
													});
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
		if (req.isSocket) {
			console.log("\nStack resolution requested from Socket " + req.socket.id);
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
										//Ace played to destroy all points
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
																Game.publishUpdate(game.id, {
																	change: 'resolvedAce',
																	game: savedGame,
																	players: playerSort
																});
															});
														});
													});
												}
											});
											break;
											//Two played to destroy target rune
										case 2:
											console.log('The first effect is a two');
											Player.find([game.players[0].id, game.players[1].id]).populate('hand').populate('points').populate('runes').exec(function (err, players) {
												if (err || !players[0] || !players[1]) {
													console.log("Players not found in game " + req.body.gameId + " for resolve");
													res.send(404);
												} else {
													console.log(req.body);
													var playerSort = sortPlayers(players);
													playerSort[req.body.pNum].runes.remove(card.targetId);
													game.scrap.add(card.targetId);

													//firstEffect will no longer have target now that stack resolves
													card.targetId = null;

													//Move the countering two's to the scrap
													game.twos.forEach(function (two, index, twos) {
														game.twos.remove(two.id);
														game.scrap.add(two.id);
													});

													//Move the firstEffect two to the scrap
													game.scrapTop = card;
													game.scrap.add(card.id);
													game.firstEffect = null;
													game.turn++;
													game.save(function (er, savedGame) {
														console.log("It is now turn: " + savedGame.turn);
														playerSort[0].save(function (e, savedP0) {
															playerSort[1].save(function (e6, savedP1) {
																Game.publishUpdate(game.id, {
																	change: 'resolvedTwo',
																	game: savedGame,
																	players: [savedP0, savedP1]
																});
																res.send({
																	resolvedTwo: true,
																	game: savedGame,
																	players: [savedP0, savedP1]
																}); 
																card.save();
															});
														});
													});

												}
											});
											break;
										case 3:
											console.log("First effect is a three");
											Game.publishUpdate(game.id, {change: 'threeData'}, req);
											break;
										case 5:
											console.log("First effect is a five");
											Player.findOne(req.body.otherPlayerId).populate('hand').populate('points').populate('runes').exec(function (err, player) {
												if (err || !player) {
													console.log("Player " + req.body.otherPlayerId + " not found for 5 effect");
													res.send(404);
												} else {

													var handLength = player.hand.length;
													if (handLength <= 6) {


														player.hand.add(game.topCard);
														player.hand.add(game.secondCard);

														//Assign new top and second cards
														var min = 0;
														var max = game.deck.length - 1;
														var randomTop = Math.floor((Math.random() * ((max + 1) - min)) + min);
														var randomSecond = Math.floor((Math.random() * ((max + 1) - min)) + min);;

														while (randomSecond === randomTop) {
															randomSecond = Math.floor((Math.random() * ((max + 1) - min)) + min);
														}

														game.firstEffect = null;
														game.topCard     = game.deck[randomTop];
														game.secondCard  = game.deck[randomSecond];
														game.scrapTop    = card;
														game.deck.remove(game.topCard.id);
														game.deck.remove(game.secondCard.id);
														game.scrap.add(card.id);
														game.turn++;

														game.save(function (er, savedGame) {
															player.save(function (e, savedPlayer) {
																Game.publishUpdate(savedGame.id, {
																	change : 'resolvedFive',
																	game   : savedGame,
																	player : savedPlayer,
																});
																res.send({
																	resolvedFive : true,
																	yourTurn     : true,
																	validRank    : true,
																	handLength   : handLength
																});
															});
														});
													} else if (handLength === 7) {
														player.hand.add(game.topCard);
														game.topCard     = game.secondCard;
														game.firstEffect = null;

														//Assign new second card card
														var min         = 0;
														var max         = game.deck.length - 1;
														var randomTop   = Math.floor((Math.random() * ((max + 1) - min)) + min);														
														game.secondCard = game.deck[randomTop];
														game.scrapTop   = card;
														game.deck.remove(game.secondCard.id);
														game.scrap.add(card.id);
														game.turn++;

														game.save(function (er, savedGame) {
															console.log("It is now turn: " + savedGame.turn);
															player.save(function (e, savedPlayer) {
																Game.publishUpdate(savedGame.id, {
																	change : 'resolvedFive',
																	game   : savedGame,
																	player : savedPlayer
																});
																res.send({
																	resolvedFive : true,
																	yourTurn     : true,
																	validRank    : true,
																	handLength   : handLength
																});
															});
														});

													} else {
														res.send({
															resolvedFive : false,
															yourTurn     : true,
															validRank    : true,
															handLength   : handLength
														});
													}
												}
											});
											break;
											case 6:
												console.log('First effect is a six');
												Player.find([game.players[0].id, game.players[1].id]).populate('hand').populate('points').populate('runes').exec(function (err, players) {
													if (err || !players[0] || !players[1]) {
														console.log('Players not found in game ' + req.body.gameId + ' for RESOLVE');
														res.send(404);
													} else {
														players[0].runes.forEach(function (card, index, runes) {
															game.scrap.add(card.id);
															players[0].runes.remove(card.id);
														});
														players[1].runes.forEach(function (card, index, runes) {
															game.scrap.add(card.id);
															players[1].runes.remove(card.id);
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
															console.log("It is now turn: " + savedGame.turn);
															players[0].save(function (e, savedP0) {
																players[1].save(function (e6, savedP1) {
																	var playerSort = sortPlayers([savedP0, savedP1]);
																	Game.publishUpdate(game.id, {
																		change: 'resolvedSix',
																		game: savedGame,
																		players: playerSort
																	});
																});
															});
														});
													}
											});
											break;
										case 7:
											console.log("First effect is a seven");
											Player.findOne(req.body.otherPlayerId).populate('hand').populate('points').populate('runes').exec(function (err, player) {
												if (err || !player) {
													console.log("Player " + req.body.otherPlayerId + " not found for 7 resolution");
													res.send(404);
												} else {
													player.hand.remove(card.id);
													game.scrap.add(card.id);
													game.scrapTop = card;
													game.firstEffect = null;

													game.save(function (er, savedGame) {
														console.log("It is now turn: " + savedGame.turn);
														player.save(function (e, savedPlayer) {
															Game.publishUpdate(game.id, {change: 'sevenData', game: savedGame, player: savedPlayer});
														});
													});
												}
											});
											break;
									}
								}
							});
							break;
							//Odd Number of countering twos means the effect fizzles
							//All One Offs are moved to the scrap pile and turn is incrimented
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
									Game.publishUpdate(savedGame.id, {
										change: 'resolvedFizzle',
										game: savedGame
									});
								});
							});
							break;
					}
				}
			});
		}
	},

	resolveThree: function (req, res) {
		console.log("\n\nResolve three");
		console.log(req.body);
		if (req.isSocket && req.body.hasOwnProperty('gameId') && req.body.hasOwnProperty('playerId') && req.body.hasOwnProperty('cardId')) {
			console.log("\nResolve Three requested for game: " + req.body.gameId);
			Game.findOne(req.body.gameId).populate('players').populate('deck').populate('scrap').exec(function (error, game) {
				if (error || !game) {
					console.log("Game not found for reolveThree");
					res.send(404);
				} else {
					Player.findOne(req.body.playerId).populate('hand').populate('points').populate('runes').exec(function (erro, player) {
						player.hand.add(req.body.cardId);
						game.scrap.remove(req.body.cardId);
						game.scrapTop = game.firstEffect;
						//firstEffect is the ID of the three, not the three itself, since the value is unpopulated
						game.scrap.add(game.firstEffect);
						game.firstEffect = null;
						game.turn++;

						game.save(function (err, savedGame) {
							player.save(function (er, savedPlayer) {
								Game.publishUpdate(game.id, {change: 'resolvedThree', game: savedGame, player: savedPlayer});

							});

						});
					});
				}
			});
		}
	},
	//Play points from the top two cards using a seven
	sevenPoints: function (req, res) {
		console.log("\nPlaying points to resolve seven");
		console.log(req.body);
		if (req.isSocket && req.body.hasOwnProperty('gameId') && req.body.hasOwnProperty('playerId') && req.body.hasOwnProperty('cardId')) {
			Game.findOne(req.body.gameId).populate('players').populate('deck').populate('scrap').exec(function (error, game) {
				if (error || !game) {
					console.log("Game not found for seven points");
					res.send(404);
				} else {
					Player.findOne(req.body.playerId).populate('hand').populate('points').populate('runes').exec(function (erro, player) {
						if (erro || !player) {
							console.log("Player not found for seven points");
							res.send(404);
						} else {
							Card.findOne(req.body.cardId).exec(function (err, card) {
								if (err || !card) {
									console.log("Card not found for seven points");
									res.send(404);
								} else {
									if (game.turn % 2 === player.pNum && card.rank <= 10) {
										console.log("topCard: ");
										console.log(game.topCard);
										console.log("\n\nsecondCard: ");
										console.log(game.secondCard);										

										switch (req.body.whichCard) {
											case 0:
												console.log("Case 0");
												var min         = 0;
												var max         = game.deck.length - 1;
												var random      = Math.floor((Math.random() * ((max + 1) - min)) + min);	
												game.topCard    = game.secondCard;
												game.secondCard = game.deck[random];
												game.deck.remove(game.secondCard.id);
												break;
											case 1:
												console.log("Case 1");
												var min         = 0;
												var max         = game.deck.length - 1;
												var random      = Math.floor((Math.random() * ((max + 1) - min)) + min);	
												game.secondCard = game.deck[random];
												game.deck.remove(game.secondCard.id);
												break;
										}
										player.points.add(card.id);


										player.save(function (e, savedPlayer) {
											//Assign winner if player has won
											var victor = winner(savedPlayer);
											
											if (victor) {
												game.winner = savedPlayer.pNum;
											}

											game.turn++;
											game.save(function (e6, savedGame) {
												Player.publishUpdate(savedPlayer.id, {change: 'points', victor: victor, player: savedPlayer, turn: game.turn});
												res.send({points: true, turn: game.turn % 2 === player.pNum, rank: card.rank <= 10});
											});
										});
									}									
								}
							});
						}
					});
				}
			});
		}
	},

	//Play a rune from the top two cards to resolve a seven
	sevenRunes: function (req, res) {
		console.log("\nPlaying rune from seven");
		console.log(req.body);
		if (req.isSocket && req.body.hasOwnProperty('gameId') && req.body.hasOwnProperty('playerId') && req.body.hasOwnProperty('cardId')) {
			Game.findOne(req.body.gameId).populate('players').populate('deck').populate('scrap').exec(function (error, game) {
				if (error || !game) {
					console.log("Game not found for seven runes");
					res.send(404);
				} else {
					Player.findOne(req.body.playerId).populate('hand').populate('points').populate('runes').exec(function (erro, player) {
						if (erro || !player) {
							console.log("Player not found for seven runes");
							res.send(404);
						} else {
							Card.findOne(req.body.cardId).exec(function (err, card) {
								if (err || !card) {
									console.log("Card not found for seven runes");
									res.send(404);
								} else {
									console.log(card.rank);
									console.log(card.rank === 12 || card.rank === 13);
									console.log(game.turn % 2 === player.pNum);
									if (game.turn % 2 === player.pNum && (card.rank === 12 || card.rank === 13)) {
										console.log("Correct turn and rank");
										switch (req.body.whichCard) {
											case 0:
												console.log("Case 0");
												var min         = 0;
												var max         = game.deck.length - 1;
												var random      = Math.floor((Math.random() * ((max + 1) - min)) + min);	
												game.topCard    = game.secondCard;
												game.secondCard = game.deck[random];
												game.deck.remove(game.secondCard.id);
												break;
											case 1:
												console.log("Case 1");
												var min         = 0;
												var max         = game.deck.length - 1;
												var random      = Math.floor((Math.random() * ((max + 1) - min)) + min);	
												game.secondCard = game.deck[random];
												game.deck.remove(game.secondCard.id);
												break;
										}
										player.runes.add(card.id);


										player.save(function (e, savedPlayer) {
											//Assign winner if player has won
											var victor = winner(savedPlayer);
											
											if (victor) {
												game.winner = savedPlayer.pNum;
											}

											game.turn++;
											game.save(function (e6, savedGame) {
												Player.publishUpdate(savedPlayer.id, {change: 'runes', victor: victor, player: savedPlayer, turn: game.turn});
												res.send({runes: true, turn: game.turn % 2 === player.pNum, rank: card.rank <= 10});
											});
										});
									}									
								}
							});
						}
					});
				}
			});
		}		
	},

	sevenScuttle: function (req, res) {
		console.log("\nScuttling from seven");
		if (req.isSocket && req.body.hasOwnProperty('gameId') && req.body.hasOwnProperty('scuttledPlayerId') && req.body.hasOwnProperty('card') && req.body.hasOwnProperty('whichCard') && req.body.hasOwnProperty('target')) {
			console.log("req.body has right properties");
			Game.findOne(req.body.gameId).populate('players').populate('deck').populate('scrap').exec(function (error, game) {
				if (error || !game) {
					console.log("Game not found for sevenScuttle");
					res.send(404);
				} else {
					Player.findOne(req.body.scuttledPlayerId).populate('hand').populate('points').populate('runes').exec(function (erro, player) {
						if (erro || !player) {
							console.log("Player not found for sevenScuttle");
							res.send(404);
						} else {
							var highRank  = req.body.card.rank > req.body.target.rank;
							var highSuit  = req.body.card.rank === req.body.target.rank && req.body.card.suit > req.body.target.suit;
							var validRank = req.body.card.rank <= 10;
							if ((game.turn + 1) % 2 === player.pNum && validRank && (highRank || highSuit)) {
								switch (req.body.whichCard) {
									case 0:
										console.log("Case 0");
										var min         = 0;
										var max         = game.deck.length - 1;
										var random      = Math.floor((Math.random() * ((max + 1) - min)) + min);	
										game.topCard    = game.secondCard;
										game.secondCard = game.deck[random];
										game.deck.remove(game.secondCard.id);
										break;
									case 1:
										console.log("Case 1");
										var min         = 0;
										var max         = game.deck.length - 1;
										var random      = Math.floor((Math.random() * ((max + 1) - min)) + min);	
										game.secondCard = game.deck[random];
										game.deck.remove(game.secondCard.id);
										break;
								}
								game.scrap.add(req.body.card.id);
								game.scrapTop = req.body.card;
								player.points.remove(req.body.target.id);
								game.scrap.add(req.body.target.id);


								player.save(function (e, savedPlayer) {
									//Assign winner if player has won
									var victor = winner(savedPlayer);
									
									if (victor) {
										game.winner = savedPlayer.pNum;
									}

									game.turn++;
									game.save(function (e6, savedGame) {
										Game.publishUpdate(savedGame.id, {change: 'sevenScuttled', victor: victor, game: savedGame, player: savedPlayer});
										res.send({scuttled: true, turn: (game.turn + 1) % 2 === player.pNum, validRank: validRank, highRank: highRank, highSuit: highSuit});
									});
								});
							} else {
								console.log("Scuttle is illigitimate");
								res.send({scuttled: false, turn: (game.turn + 1) % 2 === player.pNum, validRank: validRank, highRank: highRank, highSuit: highSuit});
							}									

						}
					});
				}
			});
		}		
	},

	sevenOneOff: function (req, res){
		if (req.isSocket && req.body.hasOwnProperty('gameId') && req.body.hasOwnProperty('cardId') && req.body.hasOwnProperty('whichCard')) {
			console.log("\n\nsevenOneOff requested from socket " + req.socket.id);
			console.log(req.body);

			Game.findOne(req.body.gameId).populate('players').populate('deck').populate('scrap').exec(function (error, game) {
				if (error || !game) {
					console.log("Game not found for sevenOneOff");
					res.send(404);
				} else {
					var yourTurn = game.turn % 2 === req.body.pNum;
					console.log("Your Turn: " + yourTurn);
					if (yourTurn) {
						switch (req.body.whichCard) {
							case 0:
								var oneOffId = game.topCard;
								break;
							case 1:
								var oneOffId = game.secondCard;
								break;
						}

						Card.findOne(oneOffId).exec(function (erro, card) {
							if (erro || !card) {
								console.log("Card not found for sevenOneOff");
								res.send(404);
							} else {
								console.log("Found Card for sevenOneOff: " + card.alt);
								var validRank = card.rank <= 7 || card.rank === 9;
								if (validRank) {
									if (card.rank === 2 || card.rank === 9) {
										if (req.body.hasOwnProperty('targetId')) {
											card.targetId = req.body.targetId;
											card.save();

										} else {
											res.send({
												oneOff: false,
												firstEffect: true,
												validRank: validRank,
												yourTurn: yourTurn,
												hadTarget: false,						
												card: card
											});
										}						
									}
									//sevenOneOff must always be the first effect on the stack
									game.firstEffect = card;

									//Remove oneOff from top two cards in deck, then replace it with a card from the deck
									var max = game.deck.length - 1;
									var min = 0;
									var random = Math.floor((Math.random() * ((max + 1) - min)) + min);		
									//If topCard was played, the card that was secondCard is now topCard					
									if (req.body.whichCard === 0) {
										game.topCard    = game.secondCard;
									}
									//Either way, get a new secondCard and remove it from the deck
									game.secondCard = game.deck[random];
									game.deck.remove(game.deck[random].id);

									///////////////////////////////////////
									// Handle Targets for Twos and Nines //
									///////////////////////////////////////
									game.save(function (err, savedGame) {
										//Socket event sent to opponent to request counter to this oneOff
										Game.publishUpdate(game.id, {
											change   : 'sevenOneOff',
											game     : savedGame,
											card     : card,
											whichCard: req.body.whichCard},
											req);
										//Response to requesting socket
										res.send({
											sevenOneOff : true,
											validRank   : validRank,
											yourTurn    : yourTurn,
											game        : savedGame,
											card        : card,
											whichCard   : req.body.whichCard
										});
									});

								}
							}
						});
					}					
					
				}
			});


		}
	},

};