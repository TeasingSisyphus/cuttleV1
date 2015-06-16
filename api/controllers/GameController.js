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
			console.log(req.body);
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
								console.log("1st random: " + random);
								console.log(game.deck[random]);


								for(var i=0; i<5; i++) {
									while (dealt.indexOf(random) >= 0) {
										random = Math.floor((Math.random() * ((max + 1) - min)) + min);
									}
									console.log("\n\nRandom: " + random);
									console.log(game.deck[random]);
									playerSort[0].hand.add(game.deck[random].id);
									game.deck.remove(game.deck[random].id);
									dealt.push(random);

									while (dealt.indexOf(random) >= 0) {
										random = Math.floor((Math.random() * ((max + 1) - min)) + min);
									}
									console.log("\n\nRandom: " + random);
									console.log(game.deck[random]);

									playerSort[1].hand.add(game.deck[random].id);
									game.deck.remove(game.deck[random].id);
									dealt.push(random);								

								}

								//Assign topCard
								while (dealt.indexOf(random) >= 0)	{
									random = Math.floor((Math.random() * ((max + 1) - min)) + min);
								}
								console.log('\n\nLogging random ' + random);
								dealt.push(random);
								game.topCard = game.deck[random];
								game.deck.remove(game.deck[random].id);


								//Assign secondCard
								while (dealt.indexOf(random) >= 0)	{
									random = Math.floor((Math.random() * ((max + 1) - min)) + min);
								}
								console.log('\n\nLogging random ' + random);
								//dealt.push(random);
								game.secondCard = game.deck[random];
								game.deck.remove(game.deck[random].id);



							}

							game.save(function(er, savedGame) {
								console.log("\nSaving the game");
								console.log(savedGame);
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
		console.log('\n\nDraw test and logging req.body:');
		console.log(req.body);
		//Find the game id
		//Had something funky happen with populate
		Game.findOne(req.body.id).populate('deck').populate('players').populate('scrap').exec(function (err, game){
			console.log('\n\nLogging top card');
			console.log(req.body.topCard);
			console.log('\n\nLogging second card');
			console.log(req.body.secondCard);
			console.log('\n\nLogging game');
			console.log(game);
			//if (req.socket.id === game.players[0].socketId || req.socket.id === game.players[1].socketId);
			//Find the player id
			Player.findOne(req.body.playerId).populate('hand').populate('points').populate('runes').exec(function (error, foundPlayer) {
				console.log('\n\nLogging player');
				console.log(foundPlayer);
				console.log('Player found for draw');
				//Check if it is the current players turn.  If it is add a card to their hand and remove a card from the deck
				//After that, make the second card of the deck the first card of the deck and find a new second card.
				if (game.turn % 2 === foundPlayer.pNum) {
					console.log('Inside the game draw engine')
					game.deck.remove(req.body.topCard.id);
					foundPlayer.hand.add(req.body.topCard.id);
					console.log('\n\nLogging second card');
					console.log(req.body.secondCard.id);
					console.log('\n\nLogging the new top card');
					console.log(game.topCard.id);
					var max = game.deck.length;
					var min = 0;
					var random = Math.floor((Math.random() * ((max + 1) - min)) + min);
					game.topCard = game.secondCard;
					game.secondCard = game.deck[random];
					game.deck.remove(game.deck[random].id);
					game.turn++;
				}
				game.save(function (errrr, savedGame){
					console.log('\n\nSaving Game');
					console.log(savedGame);
					foundPlayer.save(function (errrrr, savedPlayer){
						console.log('\n\nSaving Player');
						console.log(savedPlayer);
						Game.publishUpdate(game.id, {game: savedGame, player: savedPlayer, change: 'draw'});
						});
					});	
			});
		});
	},

	scuttle: function(req, res) {
		if (req.isSocket) {
			console.log('\nSocket ' + req.socket.id + ' is requesting to scuttle');
			console.log(req.body);
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
							console.log('It is your turn');
							if(req.body.scuttler.rank > req.body.target.rank || (req.body.scuttler.rank === req.body.target.rank && req.body.scuttler.suit > req.body.target.suit)){
								var playerSort = sortPlayers(players);
								console.log('\n\nLog playerSort');
								console.log(playerSort);
								playerSort[req.body.pNum].hand.remove(req.body.scuttler.id);
								playerSort[(req.body.pNum + 1) % 2].points.remove(req.body.target.id);
								game.scrap.add(req.body.target.id);
								game.scrap.add(req.body.scuttler.id);
								game.scrapTop = req.body.scuttler;
								game.turn++;

								game.save(function (err, savedGame) {
									console.log('\n\nSaving game');
									console.log(savedGame);
									playerSort[0].save(function (er, savedP0){
										console.log('\n\nSaving player 0');
										console.log(savedP0);
										playerSort[1].save(function (e, savedP1){
											console.log('\n\nSaving player 1');
											console.log(savedP1);
											Game.publishUpdate(game.id, {game: savedGame, players: [savedP0, savedP1], change: 'scuttle'});
										});
									});
								});
							}
						}
					});
				}
			});
		}
	},

	playerTest: function(req, res) {
		console.log("\n\nplayerTest");
		console.log(req.body);
		Game.findOne(req.body.id).populateAll().exec(function(err, game){
			Player.findOne(game.players[0].id).populate('hand').populate('points').populate('runes').exec(function(error, foundPlayer) {
				console.log("\n\nLogging foundPlayer");
				console.log(foundPlayer);
				Card.find({}).populateAll().exec(function(e, cards) {
					foundPlayer.hand.add(cards[0].id);

					foundPlayer.save(function(error, savedPlayer) {
						console.log("\n\nLogging savedPlayer:");
						console.log(savedPlayer);
					});
				});
			});
		});
	}
};

