/**
 * GameController
 *
 * @description :: Server-side logic for managing games
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var Promise = require('bluebird');

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

//When URLs are requested, the actions are handled here
module.exports = {
        //Initial subscription function. Sends user a list of current games and signs them up to notified of future games
	subscribe: function(req, res) {
		if (req.isSocket) {
			console.log("\nRecieved request to subscribe socket " + req.socket.id + " to game class room");
			Game.watch(req);

			Game.find({}).exec(function(err, games) {
				res.send(games);
			});
		}

	},

        //Creates a new game upon request
	create: function(req, res) {
		if (req.isSocket) {
			console.log("\nReceived request to create game from socket " + req.socket.id);
			Game.create({
				name: req.body.name
			}).exec(function(err, newGame) {
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

        //Subscribe user to a specific game an sends them to the readyView
	joinGame: function(req, res) {
		if (req.isSocket) {
			console.log("\nReceived request to join game from socket: " + req.socket.id);
			Game.findOne(req.body.gameId).populateAll().exec(function(err, game) {
				if (err || !game) {
					console.log("Game " + req.body + " not found for joinGame");
					res.send(404);
				} else {
                                        //Check number of players already in game
                                        //Once full, initialze deck construction 
					switch (game.players.length) {
						case 0:
							console.log("0 players in game");
							Game.subscribe(req.socket, game);
							Player.create({
								socketId: req.socket.id,
								pNum: game.players.length,
							}).exec(function(er, newPlayer) {
								game.players.add(newPlayer.id);
								game.save(function(er, savedGame) {
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
							}).exec(function(er, newPlayer) {
								game.players.add(newPlayer.id);
							        //Deck Construction
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

							        //The game must be saved in order to persist changes
								game.save(function(e, savedGame) {
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

        //Handles a user becoming ready to play
        //If both players are ready, game fires
	ready: function(req, res) {
		if (req.isSocket && req.body.hasOwnProperty('gameId')) {
			console.log("\nPlayer w/ socket: " + req.socket.id + " is ready to play.");
			var deal = false;

			Game.findOne(req.body.gameId).populateAll().exec(function(err, game) {
				if (err || !game) {
					console.log("Game " + req.body.gameId + " not found for ready");
					res.send(404);
				} else {
					console.log("P0 is ready: " + game.p0Ready);
					console.log("P1 is ready: " + game.p1Ready);

					if (game.players.length === 1) {
						game.p0Ready = true;
						game.save(function(erro, savedGame) {
							Game.publishUpdate(game.id, {
								game: savedGame,
								change: 'ready'
							});
						});
					} else {

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

							game.save(function(er, savedGame) {
								if (dealt) {
									playerList[0].save(function(error, savedP0) {

										playerSort[1].save(function(errrrrr, savedP1) {
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


				}
			});
		}
	},

        //Handles a player drawing a card from the deck
	draw: function(req, res) {
		Game.findOne(req.body.gameId).populate('deck').populate('players').populate('scrap').exec(function(err, game) {
			if (err || !game) {
				console.log("Game " + req.body.gameId + " not found for scuttling");
				res.send(404);
			} else {
				//Find the player object of the player that is drawing a card
				Player.findOne(req.body.playerId).populate('hand').populate('points').populate('runes').exec(function(error, foundPlayer) {
					if (error || !foundPlayer) {
						console.log("Player " + req.body.playerId + " not found for scuttling");
						res.send(404);
					} else {
						//Check if it is the current players turn.  If it is add a card to their hand and remove a card from the deck
						//After that, make the second card of the deck the first card of the deck and find a new second card.
						//Add back && foundPlayer.hand.length !== 8
						if (game.turn % 2 === foundPlayer.pNum && game.deck.length !== 0 && foundPlayer.hand.length <= 7) {

							foundPlayer.hand.add(game.topCard);
							foundPlayer.frozenId = null;
							var max = game.deck.length - 1;
							var min = 0;
							var random = Math.floor((Math.random() * ((max + 1) - min)) + min);
							game.topCard = game.secondCard;
							game.secondCard = game.deck[random];
							game.deck.remove(game.deck[random].id);
							game.turn++;

							var log = "Player " + foundPlayer.pNum + " has drawn a card";
							game.log.push(log);
						}
						game.save(function(errrr, savedGame) {
							foundPlayer.save(function(errrrr, savedPlayer) {
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

    //DEBUGGING METHOD
    //place a card on top of the deck
	placeTopCard: function(req, res) {
		console.log('\nLogging req.body of placeTopCard');
		console.log(req.body);
		if (req.isSocket) {
			console.log('\nSocket ' + req.socket.id + ' is requesting to place a top card');
			Game.findOne(req.body.gameId).populate('players').populate('deck').populate('scrap').exec(function(error, game) {
				if (error || !game) {
					console.log('Game ' + req.body.gameId + ' not found for placeTopCard');
					res.send(404);
				} else {
					game.deck.add(game.topCard);
					game.topCard = req.body.cardId;
					game.deck.remove(req.body.cardId);
					game.save(function(erro, savedGame) {
						Game.publishUpdate(game.id, {
							game: savedGame,
							change: 'topCardChange'
						});
					});
				}
			});
		}
	},

        //Handles cards being played for scuttled
	scuttle: function(req, res) {
		if (req.isSocket) {
			console.log('\nSocket ' + req.socket.id + ' is requesting to scuttle');
			Game.findOne(req.body.gameId).populate('players').populate('deck').populate('scrap').exec(function(error, game) {
				if (error || !game) {
					console.log("Game " + player.currentGame.id + " not found for scuttling");
					res.send(404);
				} else {
					Player.find([game.players[0].id, game.players[1].id]).populate('hand').populate('points').populate('runes').exec(function(erro, players) {
						if (erro || !players) {
							console.log("Player " + req.body.playerId + " not found for scuttling");
							res.send(404);
						} else if (game.turn % 2 === req.body.pNum) {
							Card.find([req.body.scuttlerId, req.body.targetId]).populate('attachments').exec(function (e6, cards) {
								if (e6 || !cards[0] || !cards[1]) {
									console.log("Card(s) not found for scuttle in game " + game.id);
									res.send(404);
								} else {

									if (cards[0].id === req.body.scuttlerId) {
										var scuttler = cards[0];
										var target = cards[1];
									} else {
										var scuttler = cards[1];
										var target = cards[0];
									}
									if (scuttler.rank <= 10 && (scuttler.rank > target.rank || (scuttler.rank === target.rank && scuttler.suit > target.suit))) {
										var playerSort = sortPlayers(players);
										var cardIsFrozen = playerSort[req.body.pNum].frozenId === scuttler.id;
										if (!cardIsFrozen) {
											var attachLen = target.attachments.length;
											var attached = [];
											if (attachLen > 0) {
												target.attachments.forEach(function (jack, index, attachments) {
													game.scrap.add(jack.id);
													target.attachments.remove(jack.id);
													attached.push(jack);
												});
												target.save(function (e9, savedTarget) {

												});
											}

											playerSort[req.body.pNum].hand.remove(scuttler.id);
											playerSort[(req.body.pNum + 1) % 2].points.remove(target.id);
											game.scrap.add(target.id);
											game.scrap.add(scuttler.id);
											game.scrapTop = scuttler;
											game.scrapTop.class = 'card';
											playerSort[req.body.pNum].frozenId = null;
											game.turn++;

											var log = "Player " + req.body.pNum + " has scuttled Player " + (req.body.pNum + 1) % 2 + "'s " + target.alt + " with the " + scuttler.alt;
											game.log.push(log);

											game.save(function(err, savedGame) {
												playerSort[0].save(function(er, savedP0) {
													playerSort[1].save(function(e, savedP1) {
														res.send({
															scuttled: true,
															highRank: scuttler.rank > target.rank,
															sameRank: scuttler.rank === target.rank,
															highSuit: scuttler.suit > target.suit,
															frozen: cardIsFrozen
														});
														Game.publishUpdate(game.id, {
															game: savedGame,
															players: [savedP0, savedP1],
															change: 'scuttle',
															attachedLen: attachLen,
															attached: attached,
															victimPnum: (req.body.pNum + 1) % 2
														});
													});
												});
											});
										} else {
											console.log("Card was frozen. Doing nothing");
											res.send({
												scuttled: false,
												potentialScuttler: scuttler.rank <= 10,
												highRank: scuttler.rank > target.rank,
												sameRank: scuttler.rank === target.rank,
												highSuit: scuttler.suit > target.suit,
												frozen: cardIsFrozen
											});
										}
									} else {
										res.send({
											scuttled: false,
											potentialScuttler: scuttler.rank <= 10,
											highRank: scuttler.rank > target.rank,
											sameRank: scuttler.rank === target.rank,
											highSuit: scuttler.suit > target.suit,
											frozen: cardIsFrozen
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

        //Handles cards being played one-off effects
	oneOff: function(req, res) {
		if (req.isSocket) {
			console.log("\nSocket " + req.socket.id + ' is requesting to play oneOff to stack');
			Game.findOne(req.body.gameId).populate('players').populate('deck').populate('scrap').populate('twos').exec(function(error, game) {
				if (error || !game) {
					console.log("Game " + req.body.gameId + " not found for oneOff");
					res.send(404);
				} else {
					Player.findOne(req.body.playerId).populate('hand').populate('points').populate('runes').exec(function(erro, player) {
						if (erro || !player) {
							console.log("Player " + req.body.playerId + " not found for oneOff");
							res.send(404);
						} else {
							Card.findOne(req.body.cardId).exec(function(err, card) {
								if (err || !card) {
									console.log("Card " + req.body.cardId + " not found for oneOff");
									res.send(404);
								} else {
                                   //Checks if a one-off request has already been made
									var firstEffect = game.firstEffect === null;
									if (firstEffect) {
										var validRank = card.rank <= 9 && card.rank !== 8;
										if (validRank) {
											var yourTurn = game.turn % 2 === player.pNum;
											if (yourTurn) {
												var cardIsFrozen = player.frozenId === card.id;
												if (!cardIsFrozen) {



													var sortUnpopulatedPlayers = sortPlayers(game.players);
													var queenCount = 0;
													if (sortUnpopulatedPlayers[0].id === player.id) {
														var victimId = sortUnpopulatedPlayers[1].id;
													} else {
														var victimId = sortUnpopulatedPlayers[0].id;
													}
													Player.findOne(victimId).populateAll().exec(function (errorz, victim) {
														if (errorz || !victim) {
															console.log("victim not found for playing one_off");
															res.send(404);
														} else {
															victim.runes.forEach(function (rune, index, runes) {
																if (rune.rank === 12) {
																	queenCount++;
																}
															});
															//Switch to determine targeting requirements of the oneOff
															switch (card.rank) {
																case 1:
																case 3:
																case 4:
																case 5:
																case 6:
																case 7:
																	var log = "Player " + player.pNum + " has played the " + card.alt + " for its one off effect.";
																	game.log.push(log);
																	game.firstEffect = card;
																	player.hand.remove(card.id);																			
																	card.save();
																	game.save(function(er, savedGame) {
																		player.save(function(e, savedPlayer) {
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
																				card: card,
																				hadTarget: null
																			});
																		});
																	});																	
																	break;
																case 2:
																case 9:
																	console.log("Request made to play two or nine");	
																	switch (queenCount) {
																		case 0:
																			if (req.body.hasOwnProperty('targetId')) {
																				var log = "Player " + player.pNum + " has played the " + card.alt + " for its one off effect.";
																				game.log.push(log);
																				game.firstEffect = card;
																				player.hand.remove(card.id);																			
																				card.targetId = req.body.targetId;
																				card.save();
																				game.save(function(er, savedGame) {
																					player.save(function(e, savedPlayer) {
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
																							card: card,
																							hadTarget: true
																						});
																					});
																				});																				
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
																		case 1:
																			if (req.body.hasOwnProperty('targetId')) {
																				Card.findOne(req.body.targetId).exec(function (errories, targetCard) {
																					if (targetCard.rank === 12) {
																						var log = "Player " + player.pNum + " has played the " + card.alt + " for its one off effect.";
																						game.log.push(log);
																						game.firstEffect = card;
																						player.hand.remove(card.id);
																						card.targetId = req.body.targetId;
																						card.save();

																						game.save(function(er, savedGame) {
																							player.save(function(e, savedPlayer) {
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
																									card: card,
																									hadTarget: true
																								});
																							});
																						});			
																																									
																					} else {
																						console.log("Attempted to Nine an invalid target");
																						res.send({
																							oneOff: false,
																							firstEffect: true,
																							validRank: false,
																							card: card,
																							hadTarget: true
																						});
																					}
																				});
																			} else {
																				console.log("No target provided for oneOff requiring it");
																				return res.send({
																					oneOff: false,
																					firstEffect: true,
																					validRank: validRank,
																					yourTurn: yourTurn,
																					card: card,
																					hadTarget: false
																				});
																			}
																			break;
																		case 2:
																		case 3:
																		case 4:
																			res.send({
																				oneOff: false,
																				firstEffect: true,
																				validRank: null,
																				yourTurn: yourTurn,
																				card: card,
																				hadTarget: null
																			});
																			break;

																	}
																	break;
															}
														}
													});

												} else {
													console.log("Card was frozen for playing firstEffect");
													res.send({
														oneOff: false,
														firstEffect: true,
														validRank: validRank,
														game: game,
														player: player
													});
												}

											}
										}
									//Otherwise the requested card must be a two played as a counter
									} else {
										//Find opponent player, then count QUEEN's
										console.log("This better be a two");
										var validRank = card.rank === 2;
										if (validRank) {
											console.log("'s a two");
											game.twos.add(card.id);
											player.hand.remove(card.id);

											var log = "Player " + player.pNum + " has played the " + card.alt + " to counter.";
											game.log.push(log);

											game.save(function(er, savedGame) {
												player.save(function(e, savedPlayer) {
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

        //Function to handle one-off effect resolution
	resolve: function(req, res) {
		if (req.isSocket) {
			console.log("\nStack resolution requested from Socket " + req.socket.id);
			Game.findOne(req.body.gameId).populate('players').populate('deck').populate('scrap').populate('twos').exec(function(error, game) {
				if (error || !game) {
					console.log("Game " + req.body.gameId + " not found for RESOLVING a one off");
					res.send(404);
				} else if (game.firstEffect) {
					console.log('There is a first effect and we are checking the number of twos');
					switch (game.twos.length % 2) {
						case 0:
							console.log('There is an even amount of twos');
							Card.findOne(game.firstEffect).exec(function(erro, card) {
								if (erro || !card) {
									console.log('Card is not found for RESOLVING a one off');
									res.send(404);
								} else {
									var log = "The " + card.alt + " resolves successfully.";
									game.log.push(log);
									switch (card.rank) {
										//Ace played to destroy all points
										case 1:
											console.log('The first effect is an Ace');
											Player.find([game.players[0].id, game.players[1].id]).populate('hand').populate('points').populate('runes').exec(function(err, players) {
												if (err || !players[0] || !players[1]) {
													console.log('Players not found in game ' + req.body.gameId + ' for RESOLVE');
													res.send(404);
												} else {
													players[0].points.forEach(function(card, index, points) {
														game.scrap.add(card.id);
														players[0].points.remove(card.id);
													});
													players[1].points.forEach(function(card, index, points) {
														game.scrap.add(card.id);
														players[1].points.remove(card.id);
													});
													game.twos.forEach(function(two, index, twos) {
														game.twos.remove(two.id);
														game.scrap.add(two.id);
													});
													game.scrapTop = game.firstEffect;
													game.scrap.add(game.firstEffect);
													game.firstEffect = null;
													players[0].frozenId = null;
													players[1].frozenId = null;
													game.turn++;

													var pointIds = [];
													players[0].points.forEach(function (point, index, points) {
														pointIds.push(point.id);
													});

													players[1].points.forEach(function (point, index, points) {
														pointIds.push(point.id);
													});

													Card.find(pointIds).populate('attachments').exec(function (e7, points) {
														var toSave = [];
														points.forEach(function (point, index, points) {
															if (point.attachments.length > 0) {
																toSave.push(point);
																point.attachments.forEach(function (attachment, aIndex, attachments) {
																	game.scrap.add(attachment.id);
																	point.attachments.remove(attachment.id);
																});
															}
														});

														toSave.forEach(function (saveYa, index, saveList) {
															saveYa.save();
														});

														game.save(function(er, savedGame) {
															players[0].save(function(e, savedP0) {
																players[1].save(function(e6, savedP1) {
																	var playerSort = sortPlayers([savedP0, savedP1]);
																	Game.publishUpdate(game.id, {
																		change: 'resolvedAce',
																		game: savedGame,
																		players: playerSort
																	});
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
											Player.find([game.players[0].id, game.players[1].id]).populate('hand').populate('points').populate('runes').exec(function(err, players) {
												if (err || !players[0] || !players[1]) {
													console.log("Players not found in game " + req.body.gameId + " for resolve");
													res.send(404);
												} else {
													console.log(req.body);
													var playerSort = sortPlayers(players);
													playerSort[req.body.pNum].runes.remove(card.targetId);
													game.scrap.add(card.targetId);

													Card.findOne(card.targetId).populate('attachments').exec(function (e7, targetCard) {
														console.log("Logging target with " + targetCard.attachments.length + " attachments");
														console.log(targetCard);

														//firstEffect will no longer have target now that stack resolves
														card.targetId = null;

														//Move the countering two's to the scrap
														game.twos.forEach(function(two, index, twos) {
															game.twos.remove(two.id);
															game.scrap.add(two.id);
														});

														//Move the firstEffect two to the scrap
														game.scrapTop = card;
														game.scrap.add(card.id);
														game.firstEffect = null;
														players[0].frozenId = null;
														players[1].frozenId = null;
														game.turn++;

														if (targetCard.rank === 11) {
															Card.findOne(targetCard.attached).populate('attached').exec(function (e8, stolenPoints){
																if (e8 || !stolenPoints) {
																	console.log("Can't find stolen point card with id: " + targetCard.attached + " for two effect");
																	res.send(404);
																} else {
																	stolenPoints.attachments.remove(targetCard.id);
																	// playerSort[req.body.pNum].points.remove(stolenPoints.id);
																	playerSort[(req.body.pNum + 1) % 2].points.add(stolenPoints.id);

																	var promiseSavedGame = new Promise(function (resolve, reject){
																		game.save(function (e9, savedGame) {
																			if (e9 || !savedGame) {
																				return reject(e9);
																			} else {
																				return resolve(savedGame);
																			}
																		});
																	});

																	var promiseSavedP0 = new Promise(function (resolve, reject) {
																		playerSort[0].save(function (e9, savedP0) {
																			if (e9 || !savedP0) {
																				return reject(e9);
																			} else {
																				return resolve(savedP0);
																			}
																		});
																	});

																	var promiseSavedP1 = new Promise(function (resolve, reject) {
																		playerSort[1].save(function (e9, savedP1) {
																			if (e9 || !savedP1) {
																				return reject(e9);
																			} else {
																				return resolve(savedP1)
																			}
																		});
																	});

																	var promiseSavedTargetCard = new Promise(function (resolve, reject) {
																		targetCard.save(function (e9, savedTargetCard) {
																			if (e9 || !savedTargetCard) {
																				return reject (e9);
																			} else {
																				return resolve(savedTargetCard);
																			}
																		});
																	});

																	var promiseSavedStolenPoints = new Promise(function (resolve, reject) {
																		stolenPoints.save(function (e9, savedStolenPoints) {
																			if (e9 || !savedStolenPoints) {
																				return reject(e9);
																			} else {
																				return resolve(savedStolenPoints)
																			}
																		});
																	});
																	
																	Promise.all([promiseSavedGame, promiseSavedP0, promiseSavedP1, promiseSavedTargetCard, promiseSavedStolenPoints]).then(
																		function (values) {
																			console.log('\nInside two resolve promise.all. Logging values');
																			console.log(values);
																			console.log('PromiseSavedTargetCard below')
																			console.log(values[3]);
																			Game.publishUpdate(game.id, {
																				change: 'resolvedTwo',
																				game: values[0],
																				players: [values[1], values[2]],
																				target: values[3],
																				stolenPoints: values[4],
																				victimPNum: req.body.pNum,
																			});
																			res.send({
																				resolvedTwo: true,
																				game: values[0],
																				players: [values[1], values[2]],
																				target: values[3],
																				stolenPoints: values[4],
																				victimPNum: req.body.pNum,
																			});
																		}, function (reason) {
																			console.log('Saving promise in two was rejected for reason: ');
																			console.log(reason);
																			res.send(reason);
																		});
																}
															});
														} else {
															
															game.save(function(er, savedGame) {
																console.log("It is now turn: " + savedGame.turn);
																playerSort[0].save(function(e, savedP0) {
																	playerSort[1].save(function(e6, savedP1) {
																		Game.publishUpdate(game.id, {
																			change: 'resolvedTwo',
																			game: savedGame,
																			players: [savedP0, savedP1],
																			target: targetCard
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


												}
											});
											break;
										case 3:
											console.log("First effect is a three");
											Game.publishUpdate(game.id, {
												change: 'threeData'
											}, req);
											break;
										case 4:
											console.log('First effect is a four');
											Player.findOne(req.body.otherPlayerId).populate('hand').populate('points').populate('runes').exec(function(err, player) {
												if (err || !player) {
													console.log("Player " + req.body.otherPlayerId + " not found for 4 resolution");
													res.send(404);
												} else {
													player.hand.remove(card.id);
													game.scrap.add(card.id);
													game.scrapTop = card;

													game.save(function(er, savedGame) {
														player.save(function(e, savedPlayer) {
															res.send({
																change: 'fourData',
																game: savedGame,
																player: savedPlayer
															});
														});
													});
												}
											});
											break;
										case 5:
											console.log("First effect is a five");
											Player.findOne(req.body.otherPlayerId).populate('hand').populate('points').populate('runes').exec(function(err, player) {
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
														game.topCard = game.deck[randomTop];
														game.secondCard = game.deck[randomSecond];
														game.scrapTop = card;
														game.deck.remove(game.topCard.id);
														game.deck.remove(game.secondCard.id);
														game.scrap.add(card.id);
														player.frozenId = null;
														game.turn++;

														game.save(function(er, savedGame) {
															player.save(function(e, savedPlayer) {
																Game.publishUpdate(savedGame.id, {
																	change: 'resolvedFive',
																	game: savedGame,
																	player: savedPlayer,
																});
																res.send({
																	resolvedFive: true,
																	yourTurn: true,
																	validRank: true,
																	handLength: handLength
																});
															});
														});
													} else if (handLength === 7) {
														player.hand.add(game.topCard);
														game.topCard = game.secondCard;
														game.firstEffect = null;

														//Assign new second card card
														var min = 0;
														var max = game.deck.length - 1;
														var randomTop = Math.floor((Math.random() * ((max + 1) - min)) + min);
														game.secondCard = game.deck[randomTop];
														game.scrapTop = card;
														game.deck.remove(game.secondCard.id);
														game.scrap.add(card.id);
														game.turn++;

														game.save(function(er, savedGame) {
															console.log("It is now turn: " + savedGame.turn);
															player.save(function(e, savedPlayer) {
																Game.publishUpdate(savedGame.id, {
																	change: 'resolvedFive',
																	game: savedGame,
																	player: savedPlayer
																});
																res.send({
																	resolvedFive: true,
																	yourTurn: true,
																	validRank: true,
																	handLength: handLength
																});
															});
														});

													} else {
														res.send({
															resolvedFive: false,
															yourTurn: true,
															validRank: true,
															handLength: handLength
														});
													}
												}
											});
											break;
										case 6:
											console.log('First effect is a six');
											Player.find([game.players[0].id, game.players[1].id]).populate('hand').populate('points').populate('runes').exec(function(err, players) {
												if (err || !players[0] || !players[1]) {
													console.log('Players not found in game ' + req.body.gameId + ' for RESOLVE');
													res.send(404);
												} else {
													players[0].runes.forEach(function(card, index, runes) {
														game.scrap.add(card.id);
														players[0].runes.remove(card.id);
													});
													players[1].runes.forEach(function(card, index, runes) {
														game.scrap.add(card.id);
														players[1].runes.remove(card.id);
													});
													game.twos.forEach(function(two, index, twos) {
														game.twos.remove(two.id);
														game.scrap.add(two.id);
													});
													game.scrapTop = game.firstEffect;
													game.scrap.add(game.firstEffect);
													game.firstEffect = null;
													players[0].frozenId = null;
													players[1].frozenId = null;
													game.turn++;



													var p0PointIds = [];
													players[0].points.forEach(function (point, index, points) {
															p0PointIds.push(point.id);
													});

													var p1PointIds = [];
													players[1].points.forEach(function (point, index, points) {
															p1PointIds.push(point.id);
													});		

													Card.find(p0PointIds).populate('attachments').exec(function (e7, p0Points) {
														Card.find(p1PointIds).populate('attachments').exec(function (e8, p1Points) {
															var toSave = [];
															p0Points.forEach(function  (point, index, p0Puntos) {
																if (point.attachments.length > 0) {
																	var numberAttached = 0;
																	toSave.push(point);
																	point.attachments.forEach(function (attachment, aIndex, attachments) {
																		numberAttached++;
																		point.attachments.remove(attachment.id);
																		game.scrap.add(attachment.id);
																	});

																	if (numberAttached % 2 === 1) {
																		players[0].points.remove(point.id);
																		players[1].points.add(point.id);
																	}
																	
																}

															});

															p1Points.forEach(function (point, index, p1Puntos) {
																if (point.attachments.length > 0) {												
																	var numberAttached = 0;
																	toSave.push(point);
																	point.attachments.forEach(function (attachment, aIndex, attachments) {
																		numberAttached++;
																		point.attachments.remove(attachment.id);
																		game.scrap.add(attachment.id);
																	});

																	if (numberAttached % 2 === 1) {
																		players[1].points.remove(point.id);
																		players[0].points.add(point.id);
																	}
																}
															});

															toSave.forEach(function (saveYa, index, saveList) {
																saveYa.save();
															});	
															game.save(function(er, savedGame) {
																console.log("It is now turn: " + savedGame.turn);
																players[0].save(function(e, savedP0) {
																	players[1].save(function(e6, savedP1) {
																		var playerSort = sortPlayers([savedP0, savedP1]);
																		Game.publishUpdate(game.id, {
																			change: 'resolvedSix',
																			game: savedGame,
																			players: playerSort
																		});
																	});
																});
															});

														});	
													});	
																							
												}
											});
											break;
										case 7:
											console.log("First effect is a seven");
											Player.findOne(req.body.otherPlayerId).populate('hand').populate('points').populate('runes').exec(function(err, player) {
												if (err || !player) {
													console.log("Player " + req.body.otherPlayerId + " not found for 7 resolution");
													res.send(404);
												} else {
													player.hand.remove(card.id);
													game.scrap.add(card.id);
													game.scrapTop = card;
													game.firstEffect = null;

													game.save(function(er, savedGame) {
														console.log("It is now turn: " + savedGame.turn);
														player.save(function(e, savedPlayer) {
															Game.publishUpdate(game.id, {
																change: 'sevenData',
																game: savedGame,
																player: savedPlayer
															});
														});
													});
												}
											});
											break;

										case 9:
											console.log("First effect is a nine");
											Player.find([game.players[0].id, game.players[1].id]).populate('hand').populate('points').populate('runes').exec(function(err, players) {
												if (err || !players[0] || !players[1]) {
													console.log("Player(s) not found for 9 resolution");
													res.send(404);
												} else {
													var playerSort = sortPlayers(players);

													playerSort[req.body.pNum].hand.add(card.targetId);
													playerSort[req.body.pNum].points.remove(card.targetId);
													playerSort[req.body.pNum].runes.remove(card.targetId);
													playerSort[req.body.pNum].frozenId = card.targetId;

													playerSort[(req.body.pNum + 1) % 2].hand.remove(card.id);
													game.scrap.add(card.id);
													game.scrapTop = card;
													game.firstEffect = null;
													game.turn++;

													Card.findOne(card.targetId).populate('attachments').exec(function(e7, targetCard) {
														console.log("Logging target with " + targetCard.attachments.length + " attachments");
														console.log(targetCard);
														if (targetCard.rank === 8) {
															var path = 'images/cards/card_' + targetCard.suit + '_' + targetCard.rank + '.png';
															targetCard.img = path;


															game.save(function(er, savedGame) {
																targetCard.save(function(e8, savedTargetCard) {
																	playerSort[0].save(function(e, savedP0) {
																		playerSort[1].save(function(e6, savedP1) {
																			Game.publishUpdate(game.id, {
																				change: 'resolvedNine',
																				game: savedGame,
																				players: [savedP0, savedP1],
																				target: targetCard,
																				stolenPoints: null,
																				victimPNum: req.body.pNum,
																				targetHadAttachments: false
																			});
																		});
																	});
																});
															});
														} else if (targetCard.rank === 11) {
															Card.findOne(targetCard.attached).populate('attachments').exec(function (e8, stolenPoints){
																if (e8 || !stolenPoints) {
																	console.log("Can't find stolen point card with id: " + targetCard.attached + " for nine effect");
																	res.send(404);
																} else {
																	stolenPoints.attachments.remove(targetCard.id);
																	// playerSort[req.body.pNum].points.remove(stolenPoints.id);
																	playerSort[(req.body.pNum + 1) % 2].points.add(stolenPoints.id);

																	var promiseSavedGame = new Promise(function (resolve, reject){
																		game.save(function (er, savedGame) {
																			if (er || !savedGame) {
																				return reject(er);
																			} else {
																				return resolve(savedGame);
																			}
																		});
																	});

																	var promiseSavedP0 = new Promise(function (resolve, reject) {
																		playerSort[0].save(function (er, savedP0) {
																			if (er || !savedP0) {
																				return reject(er)
																			} else {
																				return resolve(savedP0);
																			}
																		});
																	});

																	var promiseSavedP1 = new Promise(function (resolve, reject) {
																		playerSort[1].save(function (er, savedP1) {
																			if (er || !savedP1) {
																				return reject(er);
																			} else {
																				return resolve(savedP1);
																			}
																		});
																	});

																	var promiseSavedTargetCard = new Promise(function (resolve, reject) {
																		targetCard.save(function (er, savedTargetCard) {
																			if (er || !savedTargetCard) {
																				return reject (er)
																			} else {
																				return resolve(savedTargetCard);
																			}
																		});
																	});
																	var promiseSavedStolenPoints = new Promise(function (resolve, reject) {
																		stolenPoints.save(function (er, savedStolenPoints) {
																			if (er || !savedStolenPoints) {
																				return reject(er);
																			} else {
																				return resolve(savedStolenPoints);
																			}
																		});
																	});
																	Promise.all([promiseSavedGame, promiseSavedP0, promiseSavedP1, promiseSavedTargetCard, promiseSavedStolenPoints]).then(
																		function (values) {
																			console.log("\nInside promise.all. Logging values");
																			console.log(values);
																			Game.publishUpdate(game.id, {
																				change: 'resolvedNine',
																				game: values[0],
																				players: [values[1], values[2]],
																				target: values[3],
																				stolenPoints: values[4],
																				victimPNum: req.body.pNum,
																				targetHadAttachments: false
																			});
																		}, function (reason) {
																			console.log("Saving promise was rejected for reason:");
																			console.log(reason);
																			res.send(reason);
																		});
																	// game.save(function (er, savedGame) {
																	// 	targetCard.save(function (e9, savedTargetCard) {
																	// 		playerSort[0].save(function (e10, savedP0) {
																	// 			playerSort[1].save(function (e11, savedP1) {
																	// 				console.log("Logging p0:");
																	// 				console.log(savedP0);
																	// 				console.log("\nLogging p1");
																	// 				console.log(savedP1);
																	// 				Game.publishUpdate(game.id, {
																	// 					change: 'resolvedNine',
																	// 					game: savedGame,
																	// 					players: [savedP0, savedP1],
																	// 					target: targetCard,
																	// 					stolenPoints: stolenPoints,
																	// 					victimPNum: req.body.pNum,
																	// 					targetHadAttachments: false
																	// 				});
																	// 			});
																	// 		});
																	// 	});
																	// });
																}
															});
														} else if (targetCard.attachments.length > 0) {
															console.log("Bounced card had attachments");
															for (i=0; i < targetCard.attachments.length; i++) {
																console.log("Moving attached jack with id " + targetCard.attachments[i].id + " to scrap:");
																targetCard.attachments.remove(targetCard.attachments[i].id);
																game.scrap.add(targetCard.attachments[i].id);
															}
																	var promiseSavedGame = new Promise(function (resolve, reject){
																		game.save(function (er, savedGame) {
																			if (er || !savedGame) {
																				return reject(er);
																			} else {
																				return resolve(savedGame);
																			}
																		});
																	});

																	var promiseSavedP0 = new Promise(function (resolve, reject) {
																		playerSort[0].save(function (er, savedP0) {
																			if (er || !savedP0) {
																				return reject(er)
																			} else {
																				return resolve(savedP0);
																			}
																		});
																	});

																	var promiseSavedP1 = new Promise(function (resolve, reject) {
																		playerSort[1].save(function (er, savedP1) {
																			if (er || !savedP1) {
																				return reject(er);
																			} else {
																				return resolve(savedP1);
																			}
																		});
																	});

																	var promiseSavedTargetCard = new Promise(function (resolve, reject) {
																		targetCard.save(function (er, savedTargetCard) {
																			if (er || !savedTargetCard) {
																				return reject (er)
																			} else {
																				return resolve(savedTargetCard);
																			}
																		});
																	});


																	Promise.all([promiseSavedGame, promiseSavedP0, promiseSavedP1, promiseSavedTargetCard]).then(
																		function (values) {
																			console.log("\nInside promise.all. Logging values");
																			console.log(values);
																			Game.publishUpdate(game.id, {
																				change: 'resolvedNine',
																				game: values[0],
																				players: [values[1], values[2]],
																				target: values[3],
																				stolenPoints: null,
																				victimPNum: req.body.pNum,
																				targetHadAttachments: true
																			});
																		}, function (reason) {
																			console.log("Saving promise was rejected for reason:");
																			console.log(reason);
																			res.send(reason);
																		});															
															// game.save(function(er, savedGame) {
															// 		playerSort[0].save(function(e, savedP0) {
															// 			playerSort[1].save(function(e6, savedP1) {
															// 				targetCard.save(function (e7, savedTargetCard) {

															// 					Game.publishUpdate(game.id, {
															// 						change: 'resolvedNine',
															// 						game: savedGame,
															// 						players: [savedP0, savedP1],
															// 						target: savedTargetCard,
															// 						stolenPoints: null,
															// 						victimPNum: req.body.pNum,
															// 						targetHadAttachments: true
															// 					});
															// 				});
															// 			});
															// 		})
															// 	});																												
														} else {
															game.save(function(er, savedGame) {
																playerSort[0].save(function(e, savedP0) {
																	playerSort[1].save(function(e6, savedP1) {
																		Game.publishUpdate(game.id, {
																			change: 'resolvedNine',
																			game: savedGame,
																			players: [savedP0, savedP1],
																			target: targetCard,
																			stolenPoints: null,
																			victimPNum: req.body.pNum,
																			targetHadAttachments: false
																		});
																	});
																})
															});
														}
													});

													///////////////////////////////////////////////////////////////////////////////////////////////////
													// Populate Enchantments and deal with case where point card being bounced was previously jacked //
													///////////////////////////////////////////////////////////////////////////////////////////////////



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
							game.twos.forEach(function(two, index, twos) {
								game.scrap.add(two.id);
								game.twos.remove(two.id);
							});
							Card.findOne(game.firstEffect).exec(function(err, card) {
								game.scrapTop = card;
								game.scrap.add(card.id);
								game.firstEffect = null;
								game.turn++;

								var log = "The " + card.alt + " is countered and has no effect.";
								game.log.push(log);


								game.save(function(er, savedGame) {
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

        //Handles the three one-off effect since resolve does not because three one-off effect requires additional data to resolve
	resolveThree: function(req, res) {
		console.log("\n\nResolve three");
		console.log(req.body);
		if (req.isSocket && req.body.hasOwnProperty('gameId') && req.body.hasOwnProperty('playerId') && req.body.hasOwnProperty('cardId')) {
			console.log("\nResolve Three requested for game: " + req.body.gameId);
			Game.findOne(req.body.gameId).populate('players').populate('deck').populate('scrap').exec(function(error, game) {
				if (error || !game) {
					console.log("Game not found for resolveThree");
					res.send(404);
				} else {
					Player.findOne(req.body.playerId).populate('hand').populate('points').populate('runes').exec(function(erro, player) {
						player.hand.add(req.body.cardId);
						player.frozenId = null;
						game.scrap.remove(req.body.cardId);
						game.scrapTop = game.firstEffect;
						//firstEffect is the ID of the three, not the three itself, since the value is unpopulated
						game.scrap.add(game.firstEffect);
						game.firstEffect = null;
						game.turn++;

						game.save(function(err, savedGame) {
							player.save(function(er, savedPlayer) {
								Game.publishUpdate(game.id, {
									change: 'resolvedThree',
									game: savedGame,
									player: savedPlayer
								});
							});
						});
					});
				}
			});
		}
	},

        //Handles resolution of four one-off effect since resolve does not because the effect requires additional information
	resolveFour: function(req, res) {
		console.log('\n\nResolve four');
		console.log(req.body);
		if (req.isSocket && req.body.hasOwnProperty('gameId') && req.body.hasOwnProperty('playerId') && req.body.hasOwnProperty('firstDiscard') && req.body.hasOwnProperty('secondDiscard')) {
			console.log("\nResolve Four requested for game: " + req.body.gameId);
			Game.findOne(req.body.gameId).populate('players').populate('deck').populate('scrap').exec(function(error, game) {
				if (error || !game) {
					console.log("Game not found for resolveFour");
					res.send(404);
				} else {
					Player.findOne(req.body.playerId).populate('hand').populate('points').populate('runes').exec(function(erro, player) {
						if (erro || !player) {
							console.log('Game not found for resolveFour');
						} else {
							player.hand.remove(req.body.firstDiscard);
							player.hand.remove(req.body.secondDiscard);
							player.frozenId = null;
							game.scrap.add(req.body.firstDiscard);
							game.scrap.add(req.body.secondDiscard);
							game.scrap.add(game.firstEffect);
							game.scrapTop = game.firstEffect;
							game.firstEffect = null;
							game.turn++;

							game.save(function(err, savedGame) {
								console.log('Saving game');
								player.save(function(er, savedPlayer) {
									Game.publishUpdate(game.id, {
										change: 'resolvedFour',
										game: savedGame,
										player: savedPlayer
									});

									res.send({
										resolvedFour: true,
										frozen: false
									});
								});
							});
						}
					});
				}
			});
		}
	},

	//Play points from the top two cards using a seven
	sevenPoints: function(req, res) {
		console.log("\nPlaying points to resolve seven");
		console.log(req.body);
		if (req.isSocket && req.body.hasOwnProperty('gameId') && req.body.hasOwnProperty('playerId') && req.body.hasOwnProperty('cardId')) {
			Game.findOne(req.body.gameId).populate('players').populate('deck').populate('scrap').exec(function(error, game) {
				if (error || !game) {
					console.log("Game not found for seven points");
					res.send(404);
				} else {
					Player.findOne(req.body.playerId).populate('hand').populate('points').populate('runes').exec(function(erro, player) {
						if (erro || !player) {
							console.log("Player not found for seven points");
							res.send(404);
						} else {
							Card.findOne(req.body.cardId).exec(function(err, card) {
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
												var min = 0;
												var max = game.deck.length - 1;
												var random = Math.floor((Math.random() * ((max + 1) - min)) + min);
												game.topCard = game.secondCard;
												game.secondCard = game.deck[random];
												game.deck.remove(game.secondCard.id);
												break;
											case 1:
												console.log("Case 1");
												var min = 0;
												var max = game.deck.length - 1;
												var random = Math.floor((Math.random() * ((max + 1) - min)) + min);
												game.secondCard = game.deck[random];
												game.deck.remove(game.secondCard.id);
												break;
										}
										player.points.add(card.id);
										player.frozenId = null;

										var log = "Player " + player.pNum + " has played the " + card.alt + " for points after playing a seven.";
										game.log.push(log);

										player.save(function(e, savedPlayer) {
											//Assign winner if player has won
											var victor = winner(savedPlayer);

											if (victor) {
												game.winner = savedPlayer.pNum;
											}

											game.turn++;
											game.save(function(e6, savedGame) {
												Player.publishUpdate(savedPlayer.id, {
													change: 'points',
													victor: victor,
													player: savedPlayer,
													turn: game.turn
												});
												res.send({
													points: true,
													turn: game.turn % 2 === player.pNum,
													rank: card.rank <= 10
												});
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
	sevenRunes: function(req, res) {
		console.log("\nPlaying rune from seven");
		console.log(req.body);
		if (req.isSocket && req.body.hasOwnProperty('gameId') && req.body.hasOwnProperty('playerId') && req.body.hasOwnProperty('cardId')) {
			Game.findOne(req.body.gameId).populate('players').populate('deck').populate('scrap').exec(function(error, game) {
				if (error || !game) {
					console.log("Game not found for seven runes");
					res.send(404);
				} else {
					Player.findOne(req.body.playerId).populate('hand').populate('points').populate('runes').exec(function(erro, player) {
						if (erro || !player) {
							console.log("Player not found for seven runes");
							res.send(404);
						} else {
							Card.findOne(req.body.cardId).exec(function(err, card) {
								if (err || !card) {
									console.log("Card not found for seven runes");
									res.send(404);
								} else {
									console.log(card.rank);
									console.log(card.rank === 12 || card.rank === 13);
									console.log(game.turn % 2 === player.pNum);
									if (game.turn % 2 === player.pNum && (card.rank === 12 || card.rank === 13 || card.rank === 8)) {
										var glasses = card.rank === 8;
										if (glasses) {
											switch (card.suit) {
												case 0:
													card.img = '/images/cards/Glasses_Clubs.jpg';
													break;
												case 1:
													card.img = '/images/cards/Glasses_Diamonds.jpg';
													break;
												case 2:
													card.img = '/images/cards/Glasses_Hearts.jpg';
													break;
												case 3:
													card.img = '/images/cards/Glasses_Spades.jpg';
													break;
											}
											card.save();
										}
										switch (req.body.whichCard) {
											case 0:
												console.log("Case 0");
												var min = 0;
												var max = game.deck.length - 1;
												var random = Math.floor((Math.random() * ((max + 1) - min)) + min);
												game.topCard = game.secondCard;
												game.secondCard = game.deck[random];
												game.deck.remove(game.secondCard.id);
												break;
											case 1:
												console.log("Case 1");
												var min = 0;
												var max = game.deck.length - 1;
												var random = Math.floor((Math.random() * ((max + 1) - min)) + min);
												game.secondCard = game.deck[random];
												game.deck.remove(game.secondCard.id);
												break;
										}
										player.runes.add(card.id);
										player.frozenId = null;

										var log = "Player " + player.pNum + " has played the " + card.alt + " as a rune after playing a seven.";
										game.log.push(log);

										player.save(function(e, savedPlayer) {
											//Assign winner if player has won
											var victor = winner(savedPlayer);

											if (victor) {
												game.winner = savedPlayer.pNum;
											}

											game.turn++;
											game.save(function(e6, savedGame) {
												Player.publishUpdate(savedPlayer.id, {
													change: 'runes',
													victor: victor,
													player: savedPlayer,
													turn: game.turn
												});
												res.send({
													runes: true,
													glasses: glasses,
													turn: game.turn % 2 === player.pNum,
													rank: card.rank <= 10
												});
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

        //Handles a scuttle being played off of a seven one-off effect
	sevenScuttle: function(req, res) {
		console.log("\nScuttling from seven");
		if (req.isSocket && req.body.hasOwnProperty('gameId') && req.body.hasOwnProperty('scuttledPlayerId') && req.body.hasOwnProperty('scuttlerId') && req.body.hasOwnProperty('whichCard') && req.body.hasOwnProperty('targetId')) {
			console.log("req.body has right properties");
			Game.findOne(req.body.gameId).populate('players').populate('deck').populate('scrap').exec(function(error, game) {
				if (error || !game) {
					console.log("Game not found for sevenScuttle");
					res.send(404);
				} else {
					Player.findOne(req.body.scuttledPlayerId).populate('hand').populate('points').populate('runes').exec(function(erro, player) {
						if (erro || !player) {
							console.log("Player not found for sevenScuttle");
							res.send(404);
						} else {
							Card.find([req.body.scuttlerId, req.body.targetId]).populate('attachments').exec(function (e10, cards) {
								if (e10 || !cards[0] || !cards[1]) {
									console.log("Card(s) not found for sevenScuttle in game " + game.id);
									res.send(404);
								} else {
									if (cards[0].id === req.body.scuttlerId) {
										var scuttler = cards[0];
										var target = cards[1];
									} else {
										var scuttler = cards[1];
										var target = cards[0];
									}					
									var highRank = scuttler.rank > target.rank;
									var highSuit = scuttler.rank === target.rank && scuttler.suit > target.suit;
									var validRank = scuttler.rank <= 10;
									var attachLen = 0;

									if ((game.turn + 1) % 2 === player.pNum && validRank && (highRank || highSuit)) {
										console.log("scuttle is valid");

										attachLen = target.attachments.length;
										console.log(attachLen);
										if (attachLen > 0) {
											target.attachments.forEach(function (jack, index, attachments) {
												game.scrap.add(jack.id);
												target.attachments.remove(jack.id);
											});
											target.save();
										}
										switch (req.body.whichCard) {
											case 0:
												console.log("Case 0");
												var min = 0;
												var max = game.deck.length - 1;
												var random = Math.floor((Math.random() * ((max + 1) - min)) + min);
												game.topCard = game.secondCard;
												game.secondCard = game.deck[random];
												game.deck.remove(game.secondCard.id);
												break;
											case 1:
												console.log("Case 1");
												var min = 0;
												var max = game.deck.length - 1;
												var random = Math.floor((Math.random() * ((max + 1) - min)) + min);
												game.secondCard = game.deck[random];
												game.deck.remove(game.secondCard.id);
												break;
										}

										var playerId = null;
										if (game.players[0].id === player.id) {
											playerId = game.players[1].id;
										}
										if (game.players[1].id === player.id) {
											playerId = game.players[0].id;
										}
										if (playerId) {
											Player.findOne(playerId).populate('hand').populate('points').populate('runes').exec(function(e7, scuttlingPlayer) {
												if (e7 || !scuttlingPlayer) {
													console.log("Couldn't find player to unfreeze for sevenScuttle");
													res.send(404);
												} else {
													scuttlingPlayer.frozenId = null;
													scuttlingPlayer.save();
												}
											});
										}


										game.scrap.add(scuttler.id);
										game.scrapTop = scuttler;
										player.points.remove(target.id);
										game.scrap.add(target.id);

										var log = "Player " + (player.pNum + 1) % 2 + " has scuttled the " + target.alt + " with the " + scuttler.alt + " after playing a seven";
										game.log.push(log);

										player.save(function(e, savedPlayer) {
											//Assign winner if player has won
											var victor = winner(savedPlayer);

											if (victor) {
												game.winner = savedPlayer.pNum;
											}

											game.turn++;
											game.save(function(e6, savedGame) {
												Game.publishUpdate(savedGame.id, {
													change: 'sevenScuttled',
													victor: victor,
													game: savedGame,
													player: savedPlayer,
													jacksOnTarget: attachLen,
													target: target
												});
												res.send({
													scuttled: true,
													turn: (game.turn + 1) % 2 === player.pNum,
													validRank: validRank,
													highRank: highRank,
													highSuit: highSuit,
													jacksOnTarget: attachLen
												});
											});
										});
									} else {
										console.log("Scuttle is illigitimate");
										res.send({
											scuttled: false,
											turn: (game.turn + 1) % 2 === player.pNum,
											validRank: validRank,
											highRank: highRank,
											highSuit: highSuit
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

        //Handles a one-off effect that is played off of a seven one-off effect
	sevenOneOff: function(req, res) {
		if (req.isSocket && req.body.hasOwnProperty('gameId') && req.body.hasOwnProperty('cardId') && req.body.hasOwnProperty('whichCard')) {
			console.log("\n\nsevenOneOff requested from socket " + req.socket.id);

			Game.findOne(req.body.gameId).populate('players').populate('deck').populate('scrap').exec(function(error, game) {
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

						Card.findOne(oneOffId).exec(function(erro, card) {
							if (erro || !card) {
								console.log("Card not found for sevenOneOff");
								res.send(404);
							} else {
								console.log("Found Card for sevenOneOff: " + card.alt);
								var validRank = card.rank <= 7 || card.rank === 9;
								if (validRank) {
									console.log("validRank");
									Player.findOne(req.body.enemyPlayerId).populateAll().exec(function (datError, victim) {
										console.log("Logging enemy player:");
										console.log(victim);

										if (card.rank === 2 || card.rank === 9) {
											console.log("played a 2, or 9");
											var queenCount = 0;
											victim.runes.forEach(function (rune, index, runes) {
												console.log(rune);
												console.log(rune.rank === 12);
												if (rune.rank === 12) {
													queenCount++;
												}
											});
											console.log("QueenCount: " + queenCount);
											if (req.body.hasOwnProperty('targetId')) {
												switch (queenCount) {
													case 0:
														card.targetId = req.body.targetId;
														card.save();
														//sevenOneOff must always be the first effect on the stack
														game.firstEffect = card;

														//Remove oneOff from top two cards in deck, then replace it with a card from the deck
														var max = game.deck.length - 1;
														var min = 0;
														var random = Math.floor((Math.random() * ((max + 1) - min)) + min);
														//If topCard was played, the card that was secondCard is now topCard					
														if (req.body.whichCard === 0) {
															game.topCard = game.secondCard;
														}
														//Either way, get a new secondCard and remove it from the deck
														game.secondCard = game.deck[random];
														game.deck.remove(game.deck[random].id);


														var log = "Player " + req.body.pNum + " has played the " + card.alt + " for its one off effect after playing a seven";
														game.log.push(log);

														game.save(function(err, savedGame) {
															//Socket event sent to opponent to request counter to this oneOff
															Game.publishUpdate(game.id, {
																	change: 'sevenOneOff',
																	game: savedGame,
																	card: card,
																	whichCard: req.body.whichCard
																},
																req);
															//Response to requesting socket
															res.send({
																sevenOneOff: true,
																validRank: validRank,
																yourTurn: yourTurn,
																game: savedGame,
																card: card,
																whichCard: req.body.whichCard,
																queenCount: queenCount
															});
														});
														break;

													case 1:
														Card.findOne(req.body.targetId).populateAll().exec(function (anError, targetCard) {
															if (targetCard.rank === 12) {
																card.targetId = req.body.targetId;
																card.save();
																//sevenOneOff must always be the first effect on the stack
																game.firstEffect = card;

																//Remove oneOff from top two cards in deck, then replace it with a card from the deck
																var max = game.deck.length - 1;
																var min = 0;
																var random = Math.floor((Math.random() * ((max + 1) - min)) + min);
																//If topCard was played, the card that was secondCard is now topCard					
																if (req.body.whichCard === 0) {
																	game.topCard = game.secondCard;
																}
																//Either way, get a new secondCard and remove it from the deck
																game.secondCard = game.deck[random];
																game.deck.remove(game.deck[random].id);


																var log = "Player " + req.body.pNum + " has played the " + card.alt + " for its one off effect after playing a seven";
																game.log.push(log);

																game.save(function(err, savedGame) {
																	//Socket event sent to opponent to request counter to this oneOff
																	Game.publishUpdate(game.id, {
																			change: 'sevenOneOff',
																			game: savedGame,
																			card: card,
																			whichCard: req.body.whichCard
																		},
																		req);
																	//Response to requesting socket
																	res.send({
																		sevenOneOff: true,
																		validRank: validRank,
																		yourTurn: yourTurn,
																		game: savedGame,
																		card: card,
																		whichCard: req.body.whichCard,
																		queenCount: queenCount
																	});
																});																
															} else {
																	res.send({
																		sevenOneOff: false,
																		validRank: validRank,
																		yourTurn: yourTurn,
																		game: game,
																		card: card,
																		whichCard: req.body.whichCard,
																		queenCount: queenCount
																	});																
															}
														});
														break;
													case 2:
													case 3:
													case 4:
													console.log
														res.send({
															sevenOneOff: false,
															validRank: validRank,
															yourTurn: yourTurn,
															whichCard: req.body.whichCard,
															queenCount: queenCount,
															game: game
														});
														break;
												}

											} else {
												res.send({
													sevenOneOff: false,
													firstEffect: true,
													validRank: validRank,
													yourTurn: yourTurn,
													hadTarget: false,
													whichCard: req.body.whichCard,
													card: card,
													game: game
												});
											}
										} else {
											card.targetId = req.body.targetId;
											card.save();
											//sevenOneOff must always be the first effect on the stack
											game.firstEffect = card;

											//Remove oneOff from top two cards in deck, then replace it with a card from the deck
											var max = game.deck.length - 1;
											var min = 0;
											var random = Math.floor((Math.random() * ((max + 1) - min)) + min);
											//If topCard was played, the card that was secondCard is now topCard					
											if (req.body.whichCard === 0) {
												game.topCard = game.secondCard;
											}
											//Either way, get a new secondCard and remove it from the deck
											game.secondCard = game.deck[random];
											game.deck.remove(game.deck[random].id);


											var log = "Player " + req.body.pNum + " has played the " + card.alt + " for its one off effect after playing a seven";
											game.log.push(log);

											game.save(function(err, savedGame) {
												//Socket event sent to opponent to request counter to this oneOff
												Game.publishUpdate(game.id, {
														change: 'sevenOneOff',
														game: savedGame,
														card: card,
														whichCard: req.body.whichCard
													},
													req);
												//Response to requesting socket
												res.send({
													sevenOneOff: true,
													validRank: validRank,
													yourTurn: yourTurn,
													game: savedGame,
													card: card,
													whichCard: req.body.whichCard,
													queenCount: queenCount
												});
											});											
										}


									});

								}
							}
						});
					}

				}
			});


		}
	},

	sevenJack: function(req, res) {
		console.log("sevenJack requested for game " + req.body.gameId);
		var promiseGame = new Promise(function (resolve, reject) {
			Game.findOne(req.body.gameId).populateAll().exec(function (error, game) {
				if(error || !game) {
					return reject(error);
				}else{
					return resolve(game);
				}
			});
		}).catch(function(e) {
			console.log(e);
			res.send(e);
		});

		var promiseThief = new Promise(function (resolve, reject) {
			Player.findOne(req.body.thiefId).populateAll().exec(function (error, thief) {
				if(error || !thief) {
					return reject(error);
				}else{
					return resolve(thief);
				}
			});
		}).catch(function(e) {
			console.log(e);
			res.send(e);
		});

		var promiseVictim = new Promise(function (resolve, reject) {
			Player.findOne(req.body.victimId).populateAll().exec(function (error, victim) {
				if(error || !victim) {
					return reject(error);
				}else{
					return resolve(victim);
				}	
			});
		}).catch(function(e) {
			console.log(e);
			res.send(e);
		});

		var promisePoints = new Promise(function (resolve, reject) {
			Card.findOne(req.body.targetId).populateAll().exec(function (error, points) {
				if(error || !points) {
					return reject(error);
				}else{
					return resolve(points);
				}
			})
		}).catch(function(e) {
			console.log(e);
			res.send(e);
		});

		Promise.all([promiseGame, promiseThief, promiseVictim, promisePoints]).then(function (values) {
			var game = values[0];
			var thief = values[1];
			var victim = values[2];
			var points = values[3];
			var max = game.deck.length-1;
			var random = Math.floor(Math.random() * ((max + 1)));
			switch (req.body.whichCard) {
				case 0:
					console.log("Case 0");
					game.topCard = game.secondCard;
					game.secondCard = game.deck[random];
					game.deck.remove(game.secondCard.id);
					break;
				case 1:
					console.log("Case 1");
					game.secondCard = game.deck[random];
					game.deck.remove(game.secondCard.id);
					break;
			}			
			if (game && thief && victim && points){
				var yourTurn = thief.pNum === game.turn % 2;
				if (yourTurn) {
					var validRank = points.rank <= 10;
					if (validRank) {
						var hasQueen = false;
						victim.runes.forEach(function (rune, index, runes) {
							if (rune.rank === 12) {
								hasQueen = true;
							}
						});				
						if (!hasQueen) {
							thief.points.add(points.id);
							thief.hand.remove(req.body.jackId);
							points.attachments.add(req.body.jackId);
							game.turn++;
						
							return [game.save(), thief.save(), victim.save(), points.save()];
						} else {return [Promise.reject("Opponent has Queen")];}		
					} else {return [Promise.reject("Invalid Rank")];}
				} else {return [Promise.reject("Not this player's turn")];}				
			} else {
				console.log("Missing record");
				var reason;
				if (!game) {
					reason = "Game " + req.body.gameId + " not found";
				} else if(!thief) {
					reason = "Thief " + req.body.thiefId + " not found";
				} else if (!victim) {
					reason = "Victim " + req.body.victimId + " not found";
				} else if (!points) {
					reason = "Points " + req.body.targetId + " not found";
				}
				console.log(reason);
				return[Promise.reject(reason)];
			}

			}).catch(function(reason){
				console.log("Error in Promise.all()");
				console.log(reason);
			}).spread(function(savedGame, savedThief, savedVictim, savedPoints){ //handle errors
		        var victor = winner(savedThief);
		    
	            if (victor) {
			    	savedGame.winnner = savedThief.pNum;
		        }  
	            Game.update({id: savedGame.id}, savedGame);

				var playerSort = sortPlayers([savedThief, savedVictim]);
				Game.publishUpdate(savedGame.id, {
					change: 'sevenJack',
					game: savedGame,
					players: playerSort,
				    victor: victor,
					thief: savedThief,
					victim: savedVictim,
					targetCard: savedPoints
				});
				res.send({jack: true, thief: savedThief, victim: savedVictim, points: savedPoints});
				
			}, function(reason){
				console.log("Spread was passed a rejected promise");
				console.log(reason);
			}).catch(function(reason){
				console.log("Error in spread()");
				console.log(reason);
			});			
		},
	//Handles the jack rune effect
	jack: function (req, res) {
		if (req.body.hasOwnProperty('gameId') && req.body.hasOwnProperty('pNum') && req.body.hasOwnProperty('thiefId') && req.body.hasOwnProperty('jackId') && req.body.hasOwnProperty('targetId')) {
			console.log("\nJack requested for game " + req.body.gameId);
			
			var promiseGame = new Promise(function (resolve, reject) {
				Game.findOne(req.body.gameId).exec(function (error, game) {
					if (error || !game) {
						return reject(error); 
					} else{
						return resolve(game);				
					}
				});
			}).catch(function(e){
				console.log("Error finding game: " + req.body.gameId + " for jack");
				console.log(e);
				res.send(e);
			}); 
			
			var promiseThief = new Promise(function (resolve, reject) {
				Player.findOne(req.body.thiefId).populateAll().exec(function (error, thief) {
					if (error || !thief) {
						return reject(error);
					} else{
						return resolve(thief);
					}
				});
			}).catch(function(e){
				console.log("Error finding thief: " + req.body.thiefId + " for jack");
				console.log(e);
				res.send(e);
			}); 
			
			var promiseVictim = new Promise(function (resolve, reject) {
				Player.findOne(req.body.victimId).populateAll().exec(function (error, victim) {
					if (error || !victim) {
						return reject(error);
					} else{
						return resolve(victim);
					}
				});
			}).catch(function(e){
				console.log("Error finding victim: " + req.body.victimId + " for jack");
				console.log(e);
				res.send(e);
			}); 
			
			var promisePoints = new Promise(function (resolve, reject) {
				Card.findOne(req.body.targetId).populate('attachments').exec(function (error, points) {
					if (error || !points) {
						return reject(error);
					} else{
						return resolve(points);
					}
				});
			}).catch(function(e){
				console.log("Error finding points: " + req.body.targetId + " for jack");
				console.log(e);
				res.send(e);
			}); 
			
			Promise.all([promiseGame, promiseThief, promiseVictim, promisePoints]).then(function (values) {
				var game = values[0];
				var thief = values[1];
				var victim = values[2];
				var points = values[3];				
				if (game && thief && victim && points){
					var yourTurn = thief.pNum === game.turn % 2;
					if (yourTurn) {
						var cardIsFrozen = thief.frozenId === req.body.jackId;
						if (!cardIsFrozen) {
						
							var validRank = points.rank <= 10;
							if (validRank) {
								var hasQueen = false;
								victim.runes.forEach(function (rune, index, runes) {
									if (rune.rank === 12) {
										hasQueen = true;
									}
								});

								if (!hasQueen) {
									thief.points.add(points.id);
									thief.hand.remove(req.body.jackId);
									points.attachments.add(req.body.jackId);
									game.turn++;
									return [game.save(), thief.save(), victim.save(), points.save()];
								} else {return [Promise.reject("Opponent has Queen")];}
							} else {return [Promise.reject("Invalid Rank")];}
						} else {return [Promise.reject("Jack was frozen")];}
					} else {return [Promise.reject("Not this player's turn")];}				
				} else {
					console.log("Missing record");
					var reason;
					if (!game) {
						reason = "Game " + req.body.gameId + " not found";
					} else if(!thief) {
						reason = "Thief " + req.body.thiefId + " not found";
					} else if (!victim) {
						reason = "Victim " + req.body.victimId + " not found";
					} else if (!points) {
						reason = "Points " + req.body.targetId + " not found";
					}
					console.log(reason);
					return[Promise.reject(reason)];
				}

			}).catch(function(reason){
				console.log("Error in Promise.all()");
				console.log(reason);
			}).spread(function(savedGame, savedThief, savedVictim, savedPoints){ //handle errors
			        var victor = winner(savedThief);
			    
		                if (victor) {
				    savedGame.winnner = savedThief.pNum;
			        }  
		                Game.update({id: savedGame.id}, savedGame);

				var playerSort = sortPlayers([savedThief, savedVictim]);
				Game.publishUpdate(savedGame.id, {
					change: 'jack',
					players: playerSort,
				        victor: victor,
					thief: savedThief,
					victim: savedVictim,
					targetCard: savedPoints
				});
				res.send({jack: true, thief: savedThief, victim: savedVictim, points: savedPoints});
				
			}, function(reason){
				console.log("Spread was passed a rejected promise");
				console.log(reason);
			}).catch(function(reason){
				console.log("Error in spread()");
				console.log(reason);
			});
		}
	},

	test: function (req, res) {
		console.log("\nTesting!");
		res.send({foob: "JASON"});
	},
};
