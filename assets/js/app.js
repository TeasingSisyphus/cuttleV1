(function() {
	var app = angular.module('homepage', []);
	console.log('We made an app.js');



	app.controller('homepageController', function($scope, $rootScope) {
		this.formTitle = 'Type a name and submit to create a new game!';
		this.gameName = '';
		this.gameList = [];
		this.readyView = false;
		this.gameView = false;

		io.socket.get('/game/subscribe', function(res) {
			res.forEach(function(game, index, list) {
				$scope.homepage.gameList.push(game);
			});
			$scope.$apply();
		});

		////////////////////////
		// Controller Methods //
		////////////////////////
		this.makeGame = function() {
			console.log("You remembered how to make a form!");
			console.log($scope.homepage.gameName);
			io.socket.get('/game/create', {
				name: $scope.homepage.gameName
			}, function(res) {
				console.log("\nRecieved response from request to create game: ");
				console.log(res);
			});
			$scope.homepage.gameName = '';
		};

		this.joinGame = function(id) {
			console.log("\nRequesting to join game: " + id);

			io.socket.get('/game/joinGame', {
				gameId: id
			}, function(res) {
				console.log("Recieved response to game: ");
				console.log(res);

				if (res.hasOwnProperty('game')) {
					$scope.homepage.readyView = true;
					$rootScope.$emit('readyView', res.game);

					$scope.$apply();
				}
			});
		};

		///////////////////////////
		// Socket Event Handlers //
		///////////////////////////

		// io.socket.on('connect', function() {
		// 	io.socket.get('/game/subscribe', function(res) {

		// 		res.forEach(function(game, index, list) {
		// 			$scope.homepage.gameList.push(game);
		// 		});

		// 		$scope.$apply();

		// 	});
		// });

		io.socket.on('game', function(obj) {
			console.log("\nGame event fired. Logging verb: ");
			console.log(obj.verb);
			switch (obj.verb) {
				case 'created':
					$scope.homepage.gameList.push(obj.data.newGame);
					break;

			}

			$scope.$apply();
		});

	});

	app.controller('gameController', function($scope, $rootScope) {
		this.gameId = null;
		this.gameName = '';
		this.players = [];
		this.deck = [];
		this.topCard = null;
		this.secondCard = null;
		this.topTwo = [];
		this.scrap = [];
		this.opJacks = [];
		this.yourJacks = [];
		this.scrapTopImg = '/images/emptyScrap.png';
		this.turn = null;
		this.pNum = null;
		this.glasses = false;
		this.p0Ready = false;
		this.p1Ready = false;
		this.gameView = false;
		this.selCard = null;
		this.selId = null;
		this.selIndex = null;
		this.stacking = false;
		this.scrapPick = false;
		this.topTwoPick = false;
		//Represents which of the top two cards is being chosen during a seven's one off
		this.whichCard = null;
		this.selectTwo = false;
		this.putOnTop = false;
		this.showDeck = false;


		this.ready = function() {
			console.log("Player " + $scope.game.pNum + " is ready to play");
			if ($scope.game.pNum === 0) {
				$scope.game.p0Ready = true;
			}
			if ($scope.game.pNum === 1) {
				$scope.game.p1Ready = true;
			}

			io.socket.get('/game/ready', {
				gameId: $scope.game.gameId,
				pNum: $scope.game.pNum
			}, function(res) {
				console.log(res);
			});
		};

		//Selects a card by changing its class to apply a green border and capturing its id and index in your hand
		//If a card is already selected, use the previous index to find it and revert its class to normal
		//If the requested card was already selected, deselect it
		this.select = function(card, index) {
			if ($scope.game.selectTwo) {
				console.log('Selecting two cards for four discard');
				if (($scope.game.turn + 1) % 2 === $scope.game.pNum) {
					console.log('proper turn');
					if ($scope.game.selCard) {
						if ($scope.game.selCard != card) {
							console.log('\n\nLogging selCard');
							console.log($scope.game.selCard);
							card.class = 'card';
							$scope.game.players[$scope.game.pNum].hand[$scope.game.selIndex].class = 'card';
							io.socket.get('/game/resolveFour', {
								gameId: $scope.game.gameId,
								playerId: $scope.game.players[$scope.game.pNum].id,
								firstDiscard: card.id,
								secondDiscard: $scope.game.selCard.id,
							}, function(res) {
								console.log(res);

								$scope.game.selId = null;
								$scope.game.selIndex = null;
								$scope.game.selCard = null;
							});
						} else {
							//If the same card is clicked twice, deselect it
							card.class = 'card col-xs-4 col-sm-4 col-md-lg-4 img-responsive';
							$scope.game.selId = null;
							$scope.game.selIndex = null;
							$scope.game.selCard = null;
						}
					}
				}
			}
			if ($scope.game.topTwoPick) {
				console.log("Choosing card for 7");
				if ($scope.game.turn % 2 === $scope.game.pNum) {
					console.log("It's your turn");
					$scope.game.whichCard = [$scope.game.topCard, $scope.game.secondCard].indexOf(card);
					if (card.class === 'card col-xs-4 col-sm-4 col-md-lg-4 img-responsive') {
						console.log("Selecting " + card.alt);
						card.class = 'card selected col-xs-4 col-sm-4 col-md-lg-4 img-responsive';
						$scope.game.selId = card.id;
						$scope.game.selIndex = index;
						$scope.game.selCard = card;
						switch ($scope.game.whichCard) {
							case 0:
								$scope.game.secondCard.class = 'card col-xs-4 col-sm-4 col-md-lg-4 img-responsive';
								break;
							case 1:
								$scope.game.topCard.class = 'card col-xs-4 col-sm-4 col-md-lg-4 img-responsive';
								break;
						}
					} else {
						console.log("Deselecting " + card.alt);
						card.class = 'card col-xs-4 col-sm-4 col-md-lg-4 img-responsive';
						$scope.game.selId = null;
						$scope.game.selIndex = null;
						$scope.game.selCard = null;
					};

				}
			} else {
				if (card.class === 'card') {
					if ($scope.game.selId !== null) {
						$scope.game.players[$scope.game.pNum].hand[$scope.game.selIndex].class = 'card';
					}
					card.class = 'card selected';
					$scope.game.selId = card.id;
					$scope.game.selIndex = index;
					$scope.game.selCard = card;
				} else {
					card.class = 'card';
					$scope.game.selId = null;
					$scope.game.selIndex = null;
					$scope.game.selCard = null;
				};
			}
		};

		//If a card is selected, request to play that card for points
		this.points = function() {
			if ($scope.game.topTwoPick) {
				console.log("Playing points from topTwoPick");
				if ($scope.game.selId !== null) {
					if ([$scope.game.topCard, $scope.game.secondCard].indexOf($scope.game.selCard) >= 0) {
						console.log("Requesting to play " + $scope.game.selCard.alt + " as points from a seven");
						io.socket.get('/game/sevenPoints', {
							gameId: $scope.game.gameId,
							playerId: $scope.game.players[$scope.game.pNum].id,
							cardId: $scope.game.selId,
							whichCard: $scope.game.whichCard,
						}, function(res) {
							console.log(res);
							//If the request was denied, deselect the requested card
							if (!res.points) {
								$scope.game.players[$scope.game.pNum].hand[$scope.game.selIndex].class = 'card';
							}
							$scope.game.selId = null;
							$scope.game.selIndex = null;
							$scope.game.selCard = null;
							$scope.game.topTwoPick = false;
							$scope.$apply();
						});
					}
				}
			} else {

				if ($scope.game.selId !== null) {
					console.log("\nRequesting to play " + $scope.game.players[$scope.game.pNum].hand[$scope.game.selIndex].alt + ' for points');
					io.socket.get('/player/points', {
						playerId: $scope.game.players[$scope.game.pNum].id,
						cardId: $scope.game.selId
					}, function(res) {
						console.log(res);
						//If the request was denied, deselect the requested card
						if (!res.points) {
							$scope.game.players[$scope.game.pNum].hand[$scope.game.selIndex].class = 'card';
						}
						$scope.game.selId = null;
						$scope.game.selIndex = null;
						$scope.game.selCard = null;
					});
				}
			}
		};

		//If a card is selected, request to play that card as a rune
		this.runes = function() {
			if ($scope.game.topTwoPick) {
				console.log("\nPlaying rune from topTwoPick");
				if ($scope.game.selId !== null) {
					if ([$scope.game.topCard, $scope.game.secondCard].indexOf($scope.game.selCard) >= 0) {
						console.log("Requesting to play " + $scope.game.selCard.alt + " as runes from a seven");
						io.socket.get('/game/sevenRunes', {
							gameId: $scope.game.gameId,
							playerId: $scope.game.players[$scope.game.pNum].id,
							cardId: $scope.game.selId,
							whichCard: $scope.game.whichCard,
						}, function(res) {
							console.log(res);
							if (res.hasOwnProperty('glasses')) {
								if (res.glasses) {
									$scope.game.glasses = true;
									$scope.$apply();
								}
							}
							//If the request was denied, deselect the requested card
							if (!res.runes) {
								$scope.game.players[$scope.game.pNum].hand[$scope.game.selIndex].class = 'card';
							}
							$scope.game.selId = null;
							$scope.game.selIndex = null;
							$scope.game.selCard = null;
							$scope.game.topTwoPick = false;
							$scope.$apply();
						});
					}
				}
			} else {
				if ($scope.game.selId !== null) {
					console.log("\nRequesting to play " + $scope.game.players[$scope.game.pNum].hand[$scope.game.selIndex].alt + ' as a rune');
					io.socket.get('/player/runes', {
						playerId: $scope.game.players[$scope.game.pNum].id,
						cardId: $scope.game.selId
					}, function(res) {
						console.log(res);

						if (res.hasOwnProperty('glasses')) {
							if (res.glasses) {
								$scope.game.glasses = true;
								$scope.$apply();
							}
						}
						//If the request was denied, deselect the requested card
						if (!res.runes) {
							$scope.game.players[$scope.game.pNum].hand[$scope.game.selIndex].class = 'card';
						}
						$scope.game.selId = null;
						$scope.game.selIndex = null;
						$scope.game.selCard = null;
					});
				}
			}
		};

		//Draw a card from the deck to your hand
		this.draw = function() {
			// Need to start keeping track of hand size
			if ($scope.game.topCard === false) {
				console.log("The deck is empty");
				// Add a pop-up telling the player the deck is empty
				// var deckOut = confirm("The deck is empty, you may either pass or play a card.\n Good Luck");
				// io.socket.get
			} else {
				io.socket.get('/game/draw', {
					gameId: $scope.game.gameId,
					playerId: $scope.game.players[$scope.game.pNum].id,
				}, function(res) {
					console.log(res);
				});
			}
		};

		//Scuttle from your hand to the opponents field
		//MUST BE UPDATED FOR THE SEVEN CASE
		this.scuttle = function(target) {
			if ($scope.game.topTwoPick) {
				console.log("\nScuttling from topTwoPick");
				if ($scope.game.selId !== null) {
					if ([$scope.game.topCard, $scope.game.secondCard].indexOf($scope.game.selCard) >= 0) {
						$scope.game.selCard.class = 'card';
						io.socket.get('/game/sevenScuttle', {
							gameId: $scope.game.gameId,
							scuttledPlayerId: $scope.game.players[($scope.game.pNum + 1) % 2].id,
							scuttlerId: $scope.game.selCard.id,
							targetId: target.id,
							whichCard: $scope.game.whichCard,
						}, function(res) {
							console.log(res);
							//If the request was denied, deselect the requested card
							if (!res.scuttled) {
								$scope.game.players[$scope.game.pNum].hand[$scope.game.selIndex].class = 'card';
							}
							$scope.game.selId = null;
							$scope.game.selIndex = null;
							$scope.game.selCard = null;
							$scope.game.topTwoPick = false;
							$scope.$apply();
						});
					}
				}
			} else {
				if (this.selId !== null) {
					console.log('\n\nRequesting to scuttle');
					io.socket.get('/game/scuttle', {
						gameId: $scope.game.gameId,
						pNum: $scope.game.pNum,
						scuttlerId: $scope.game.selCard.id,
						targetId: target.id
					}, function(res) {
						console.log(res);
						//If the request was denied, deselect the requested card
						if (!res.scuttled) {
							$scope.game.players[$scope.game.pNum].hand[$scope.game.selIndex].class = 'card';
						}
						$scope.game.selId = null;
						$scope.game.selIndex = null;
						$scope.game.selCard = null;
					});
				}
			}
		};

		this.selectPoint = function(card) {
			if ($scope.game.selCard != null) {
				if ($scope.game.selCard.rank === 9) {
					if (card.rank === 10) {
						$scope.game.requestNine(card);
					} else {
						var scuttle = confirm("Do you want to scuttle? Hit 'Okay' to scuttle and 'Cancel' to play your Nine as a one-off");
						if (scuttle) {
							$scope.game.scuttle(card);
						} else {
							$scope.game.requestNine(card);
						}
					}
				} else if ($scope.game.selCard.rank === 11) {
					$scope.game.jack(card);
				} else {
					$scope.game.scuttle(card);
				}

			}
		};

		this.jack = function(card) {
			console.log("Requesting to jack " + card.alt);
			io.socket.get('/game/jack', {
				gameId: $scope.game.gameId,
				pNum: $scope.game.pNum,
				thiefId: $scope.game.players[$scope.game.pNum].id,
				victimId: $scope.game.players[($scope.game.pNum + 1) % 2].id,
				jackId: $scope.game.selId,
				targetId: card.id
			}, function(res) {
				console.log(res);
			});
		};

		this.requestNine = function(card) {
			console.log("Requesting to play nine on a point card");
			io.socket.get('/game/oneOff', {
				gameId: $scope.game.gameId,
				playerId: $scope.game.players[$scope.game.pNum].id,
				cardId: $scope.game.selId,
				targetId: card.id
			}, function(res) {
				console.log(res);
				if (res.change.resolvedTwo) {
					$scope.game.players = res.players;
				} else {
					$scope.game.players[$scope.game.pNum].hand[$scope.game.selIndex].class = 'card'
				}
				$scope.game.selId = null;
				$scope.game.selIndex = null;
				$scope.game.selCard = null
				$scope.$apply();
			});
		};


		this.chooseScrap = function(card) {
			console.log(card);
			io.socket.get('/game/resolveThree', {
				gameId: $scope.game.gameId,
				playerId: $scope.game.players[$scope.game.pNum].id,
				cardId: card.id,
			}, function(res) {
				console.log(res);
			});
		};

		this.placeTopCard = function(card) {
			console.log(card);
			io.socket.get('/game/placeTopCard', {
				gameId: $scope.game.gameId,
				cardId: card.id,
			}, function(res) {
				console.log(res);
			});
		};


		//Used to make request involving selecting a single rune to target
		this.selectRune = function(card) {
			console.log("\nSelecting rune to target");
			console.log("selId: " + $scope.game.selId);
			console.log("stacking: " + $scope.game.stacking);
			if ($scope.game.selId && !$scope.game.stacking) {
				console.log("got id and not stacking");
				if ($scope.game.topTwoPick) {
					console.log("from a seven");
					if ($scope.game.selCard.rank === 2 || $scope.game.selCard.rank === 9) {
						console.log("making request");
						io.socket.get('/game/sevenOneOff', {
							gameId: $scope.game.gameId,
							pNum: $scope.game.pNum,
							cardId: $scope.game.selId,
							targetId: card.id,
							whichCard: $scope.game.whichCard
						}, function(res) {
							console.log(res);
							if (!res.resolvedTwo) {
								$scope.game.players[$scope.game.pNum].hand[$scope.game.selIndex].class = 'card';
							}
							$scope.game.selId = null;
							$scope.game.selIndex = null;
							$scope.game.selCard = null;
							$scope.$apply();
						});
					}
				} else {
					console.log("targeting");
					if ($scope.game.selCard.rank === 2 || $scope.game.selCard.rank === 9) {
						io.socket.get('/game/oneOff', {
							gameId: $scope.game.gameId,
							playerId: $scope.game.players[$scope.game.pNum].id,
							cardId: $scope.game.selId,
							targetId: card.id
						}, function(res) {
							console.log(res);
							if (res.change.resolvedTwo) {
								$scope.game.players = res.players;
							} else {
								$scope.game.players[$scope.game.pNum].hand[$scope.game.selIndex].class = 'card'
							}
							$scope.game.selId = null;
							$scope.game.selIndex = null;
							$scope.game.selCard = null
							$scope.$apply();
						});
					} else if ($scope.game.selCard.rank === 11) {
						console.log("Requesting jackBug");
						io.socket.get('/game/jackBug', {
							gameId: $scope.game.gameId,
							thiefId: $scope.game.players[$scope.game.pNum].id,
							victimId: $scope.game.players[($scope.game.pNum + 1) % 2].id,
							jackId: $scope.game.selId,
							targetId: card.id,
							pNum: $scope.game.pNum
						}, function (res) {
							console.log(res);
						});
					}

				}
			}
		};


		this.oneOff = function() {

			if ($scope.game.selId !== null) {
				if ($scope.game.topTwoPick) {
					//Seven One Offs
					console.log("Playing " + $scope.game.selCard.alt + " for oneOff after seven");

					console.log("\nRequesting to play " + $scope.game.selCard.alt + " as oneOff after seven");
					io.socket.get('/game/sevenOneOff', {
						gameId: $scope.game.gameId,
						playerId: $scope.game.players[$scope.game.pNum].id,
						pNum: $scope.game.pNum,
						cardId: $scope.game.selId,
						whichCard: $scope.game.whichCard
					}, function(res) {
						console.log(res);
						$scope.game.topCard = res.game.topCard;
						$scope.game.secondCard = res.game.secondCard;
						$scope.game.topTwo = [$scope.game.topCard, $scope.game.secondCard];
						///////////////////////////////////////////////////
						//Doesn't this need to update the scrap, as well?//
						///////////////////////////////////////////////////
						if (!res.sevenOneOff) {
							//Then deselect the chosen card from the top two cards
							//$scope.game.players[$scope.game.pNum].hand[$scope.game.selIndex].class = 'card';
						} else {
							$scope.game.topTwoPick = false;
						}
						$scope.$apply();
						$scope.game.selId = null;
						$scope.game.selIndex = null;
						$scope.game.selCard = null;
					});


				} else {
					if ($scope.game.stacking) {
						if ($scope.game.selCard.rank === 2) {
							console.log("Requesting to play " + $scope.game.selCard.alt + " as counter to One Off");
							$scope.game.stacking = false;
							io.socket.get('/game/oneOff', {
								gameId: $scope.game.gameId,
								playerId: $scope.game.players[$scope.game.pNum].id,
								cardId: $scope.game.selId,
							}, function(res) {
								console.log(res);
								if (res.oneOff) {
									$scope.game.players[res.player.pNum] = res.player;
								} else {
									$scope.game.players[$scope.game.pNum].hand[$scope.game.selIndex].class = 'card';
								}
								$scope.game.selId = null;
								$scope.game.selIndex = null;
								$scope.game.selCard = null;
								$scope.$apply();
							});
						} else {
							var conf = confirm("You can only play a two as a reaction to a One Off! Would you like to counter with a two?");
							if (!conf) {
								$scope.game.stacking = false;
								console.log("Declined to counter. Requesting to resolve stack");
								$scope.game.resolve();
							}
						}

					} else {
						switch ($scope.game.selCard.rank) {
							case 1:
							case 3:
							case 4:
							case 7:
								console.log("\nRequesting to play " + $scope.game.selCard.alt + " as oneOff");
								io.socket.get('/game/oneOff', {
									gameId: $scope.game.gameId,
									playerId: $scope.game.players[$scope.game.pNum].id,
									cardId: $scope.game.selId
								}, function(res) {
									console.log(res);
									$scope.game.players[res.player.pNum] = res.player;
									$scope.$apply();
									if (!res.oneOff) {
										$scope.game.players[$scope.game.pNum].hand[$scope.game.selIndex].class = 'card';
									}
									$scope.game.selId = null;
									$scope.game.selIndex = null;
									$scope.game.selCard = null;
								});
								break;
							case 5:
								console.log("Playing 5 to draw two");
								io.socket.get('/game/oneOff', {
									gameId: $scope.game.gameId,
									playerId: $scope.game.players[$scope.game.pNum].id,
									cardId: $scope.game.selId
								}, function(res) {
									$scope.game.players[res.player.pNum] = res.player;
									$scope.$apply();
									if (!res.onOff) {
										$scope.game.players[$scope.game.pNum].hand[$scope.game.selIndex].class = 'card';
									}
									$scope.game.selId = null;
									$scope.game.selIndex = null;
									$scope.game.selCard = null;
								});
								break;
							case 6:
								console.log('\nPlaying 6 to clear the runes');
								io.socket.get('/game/oneOff', {
									gameId: $scope.game.gameId,
									playerId: $scope.game.players[$scope.game.pNum].id,
									cardId: $scope.game.selId,
								}, function(res) {
									console.log(res);
									$scope.game.players[res.player.pNum] = res.player;
									$scope.$apply();
									if (!res.oneOff) {
										$scope.game.players[$scope.game.pNum].hand[$scope.game.selIndex].class = 'card';
									}
									$scope.game.selId = null;
									$scope.game.selIndex = null;
									$scope.game.selCard = null;
								});
								break;
						}
					}
				}
			}

		};

		this.resolve = function() {
			console.log('Resolving');
			io.socket.get('/game/resolve', {
				gameId: $scope.game.gameId,
				pNum: $scope.game.pNum,
				resolvingPlayerId: $scope.game.players[$scope.game.pNum].id,
				otherPlayerId: $scope.game.players[($scope.game.pNum + 1) % 2].id,
			}, function(res) {
				console.log(res);
				if (res.hasOwnProperty('change')) {
					if (res.change === 'fourData') {
						$scope.game.topTwoPick = false;
						$scope.game.turn = res.game.turn;
						$scope.$apply();
						$scope.game.stacking = true;
						$scope.game.selectTwo = true;
						$scope.game.selId = null;
						$scope.game.selIndex = null;
						$scope.game.selCard = null;
						alert('Please pick two cards from your hand to discard to the scrap pile');
					}
				}
			});
		};


		$rootScope.$on('readyView', function(event, game) {
			console.log('\nChanging to readyView');
			$scope.game.gameId = game.id;
			$scope.game.gameName = game.name;
			$scope.game.pNum = game.players.length - 1;
			$scope.game.deck = game.deck;


		});

		///////////////////////////
		// Socket Event Handlers //
		///////////////////////////
		io.socket.on('game', function(obj) {
			switch (obj.verb) {
				case 'updated':
					console.log("\nGame was updated.");
					console.log(obj.data);
					switch (obj.data.change) {
						case 'draw':
							console.log('\nIn draw case');
							$scope.game.stacking = false;
							$scope.game.topTwoPick = false;
							$scope.game.deck = obj.data.game.deck;
							$scope.game.topCard = obj.data.game.topCard;
							$scope.game.secondCard = obj.data.game.secondCard;
							$scope.game.topTwo = [obj.data.game.topCard, obj.data.game.secondCard];
							$scope.game.players[obj.data.player.pNum].hand = obj.data.player.hand;
							$scope.game.turn = obj.data.game.turn;
							break;

						case 'ready':
							if (obj.data.hasOwnProperty('game')) {
								$scope.game.p0Ready = obj.data.game.p0Ready;
								$scope.game.p1Ready = obj.data.game.p1Ready;
								$scope.game.players = obj.data.game.players;
								$scope.game.deck = obj.data.game.deck;
								$scope.game.scrap = obj.data.game.scrap;
								$scope.game.topCard = obj.data.game.topCard;
								$scope.game.secondCard = obj.data.game.secondCard;
								$scope.game.topTwo = [obj.data.game.topCard, obj.data.game.secondCard];
								$scope.game.topTwoPick = false;

							}
							break;
						case 'scuttle':
							console.log('\nIn scuttle case');
							$scope.game.players = obj.data.players;
							$scope.game.scrap = obj.data.game.scrap;
							$scope.game.scrapTopImg = obj.data.game.scrapTop.img;
							$scope.game.turn = obj.data.game.turn;
							$scope.game.topTwoPick = false;
							break;

						case 'oneOff':
							$scope.game.stacking = true;
							console.log('\nOne Off was played');
							var conf = confirm("Your opponent has played the " + obj.data.card.alt + " as a oneOff. Would you like to counter with a two?");
							if (!conf) {
								console.log("Declined to counter. Requesting to resolve stack");
								$scope.game.resolve();
							}
							$scope.game.players[obj.data.player.pNum] = obj.data.player;
							$scope.game.turn = obj.data.game.turn;
							$scope.game.topTwoPick = false;
							break;

						case 'threeData':
							$scope.game.stacking = true;
							$scope.game.scrapPick = true;
							$scope.game.topTwoPick = false;
							alert('Please pick a card from the scrap pile to take to your hand');
							break;

						case 'topCardPickData':
							$scope.game.topTwoPick = false;
							$scope.game.putOnTop = true;
							alert('Select the card you want on the top of the deck for testing');
							break;

						case 'sevenData':
							$scope.game.stacking = false;
							$scope.game.topTwoPick = true;
							$scope.game.players[obj.data.player.pNum].hand = obj.data.player.hand;
							$scope.game.scrap = obj.data.game.scrap;
							$scope.game.scrapTopImg = obj.data.game.scrapTop.img;
							$scope.game.turn = obj.data.game.turn;
							$scope.game.topCard = obj.data.game.topCard;
							$scope.game.secondCard = obj.data.game.secondCard;
							$scope.game.topTwo = [obj.data.game.topCard, obj.data.game.secondCard];
							$scope.game.topCard.class = 'card col-xs-4 col-sm-4 col-md-lg-4 img-responsive';
							$scope.game.secondCard.class = 'card col-xs-4 col-sm-4 col-md-lg-4 img-responsive';
							break;

						case 'sevenScuttled':
							$scope.game.stacking = false;
							$scope.game.topTwoPick = false;
							$scope.game.players[obj.data.player.pNum] = obj.data.player;
							$scope.game.scrap = obj.data.game.scrap;
							$scope.game.scrapTopImg = obj.data.game.scrapTop.img;
							$scope.game.deck = obj.data.game.deck;
							$scope.game.turn = obj.data.game.turn;

							if (obj.data.jacksOnTarget > 0) {
								var youWereTarget = obj.data.player.pNum === $scope.game.pNum;
								if (youWereTarget) {
									$scope.game.yourJacks.forEach(function (jack, index, yourJacks) {
										if (jack.targetAlt === obj.data.target.alt) {
											$scope.game.yourJacks.splice(index, 1);
										}
									});
								} else {
									$scope.game.opJacks.forEach(function (jack, index, opJacks) {
										if (jack.targetAlt === obj.data.target.alt) {
											$scope.game.opJacks.splice(index, 1);
										}
									});
								}
							}
							break;
						case 'sevenOneOff':
							$scope.game.stacking = true;
							var conf = confirm("Your opponent has played the " + obj.data.card.alt + " as a oneOff after a seven. Would you like to counter with a two?");
							if (!conf) {
								console.log("Declined to counter. Requesting to resolve stack");
								$scope.game.resolve();
							}
							$scope.game.turn = obj.data.turn;
							$scope.topTwoPick = false;
							$scope.game.deck = obj.data.game.deck;
							$scope.game.topCard = obj.data.game.topCard;
							$scope.game.secondCard = obj.data.game.secondCard;
							$scope.game.topTwo = [$scope.game.topCard, $scope.game.secondCard];
							break;

						case 'resolvedFizzle':
							if (obj.data.hasOwnProperty('game')) {
								$scope.game.scrap = obj.data.game.scrap;
								$scope.game.scrapTopImg = obj.data.game.scrapTop.img;
								$scope.game.stacking = false;
								$scope.game.turn = obj.data.game.turn;
								$scope.game.topTwoPick = false;
							}
							break;

						case 'resolvedAce':
							$scope.game.scrap = obj.data.game.scrap;
							$scope.game.scrapTopImg = obj.data.game.scrapTop.img;
							$scope.game.players = obj.data.players;
							$scope.game.stacking = false;
							$scope.game.turn = obj.data.game.turn;
							$scope.game.topTwoPick = false;
							$scope.game.opJacks = [];
							$scope.game.yourJacks = [];
							break;

						case 'resolvedTwo':
							$scope.game.topTwoPick = false;
							$scope.game.stacking = false;
							$scope.game.scrap = obj.data.game.scrap;
							$scope.game.scrapTopImg = obj.data.game.scrapTop.img;
							$scope.game.players = obj.data.players;
							$scope.game.turn = obj.data.game.turn;

							var glasses = false;
							$scope.game.players[$scope.game.pNum].runes.forEach(function(rune, index, runes) {
								if (rune.rank === 8) {
									glasses = true;
								}
							});
							$scope.game.glasses = glasses;
							break;

						case 'resolvedThree':
							$scope.game.scrap = obj.data.game.scrap;
							$scope.game.scrapTopImg = obj.data.game.scrapTop.img;
							$scope.game.players[obj.data.player.pNum] = obj.data.player;
							$scope.game.stacking = false;
							$scope.game.scrapPick = false;
							$scope.game.turn = obj.data.game.turn;
							$scope.game.topTwoPick = false;
							break;

						case 'resolvedFour':
							console.log("Resolved four");
							$scope.game.scrap = obj.data.game.scrap;
							$scope.game.scrapTopImg = obj.data.game.scrapTop.img;
							$scope.game.players[obj.data.player.pNum] = obj.data.player;
							$scope.game.stacking = false;
							$scope.game.selectTwo = false;
							$scope.game.turn = obj.data.game.turn;
							$scope.game.topTwoPick = false;
							break;

						case 'resolvedFive':
							$scope.game.stacking = false;
							$scope.game.topTwoPick = false;
							$scope.game.deck = obj.data.game.deck;
							$scope.game.topCard = obj.data.game.topCard;
							$scope.game.secondCard = obj.data.game.secondCard;
							$scope.game.topTwo = [obj.data.game.topCard, obj.data.game.secondCard];
							$scope.game.players[obj.data.player.pNum] = obj.data.player;
							$scope.game.scrap = obj.data.game.scrap;
							$scope.game.scrapTopImg = obj.data.game.scrapTop.img;
							$scope.game.turn = obj.data.game.turn;
							break;

						case 'resolvedSix':
							$scope.game.stacking = false;
							$scope.game.topTwoPick = false;
							$scope.game.glasses = false;
							$scope.game.scrap = obj.data.game.scrap;
							$scope.game.scrapTopImg = obj.data.game.scrapTop.img;
							$scope.game.players = obj.data.players;
							$scope.game.yourJacks = [];
							$scope.game.opJacks = [];
							$scope.game.turn = obj.data.game.turn;
							break;
						case 'resolvedNine':
							$scope.game.stacking = false;
							$scope.game.topTwoPick = false;
							$scope.game.players = obj.data.players;
							var glasses = false;
							$scope.game.players[$scope.game.pNum].runes.forEach(function(rune, index, runes) {
								console.log(rune);
								console.log(rune.rank === 8);
								if (rune.rank === 8) {
									glasses = true;
								}
							});
							$scope.game.glasses = glasses;
							$scope.game.scrap = obj.data.game.scrap;
							$scope.game.scrapTopImg = obj.data.game.scrapTop.img;
							$scope.game.turn = obj.data.game.turn;
							break;

						case 'jack':
							$scope.game.stacking = false;
							$scope.game.topTwoPick = false;
							$scope.game.players = obj.data.players;
							$scope.game.turn = obj.data.turn;
							switch (obj.data.thief === $scope.game.pNum) {
								case true:
									console.log("Your jack");
									obj.data.targetCard.attachments.forEach(function (jack, index, attachments) {
										//Add the attached jacks to your jacks
										if ($scope.game.yourJacks.indexOf(jack) < 0) {
											console.log("pushing jack");
											jack.targetAlt = obj.data.targetCard.alt;
											$scope.game.yourJacks.push(jack);
										}
										console.log(jack);
										console.log($scope.game.opJacks.indexOf(jack));
										//Remove the attached jacks from opponent's jacks
										$scope.game.opJacks.forEach(function (opJack, opJacksIndex, opJacks) {
											if (jack.suit === opJack.suit && jack.rank === 11 && opJack.rank === 11) {
												$scope.game.opJacks.splice(opJacksIndex, 1);
											}
										});

									});
									break;
								case false:
									console.log("Their jack");
									obj.data.targetCard.attachments.forEach(function(jack, index, attachments) {
										//Add the attached jacks to opponent's jacks
										if ($scope.game.opJacks.indexOf(jack) < 0) {
											console.log("pushing jack");
											jack.targetAlt = obj.data.targetCard.alt;											
											$scope.game.opJacks.push(jack);
										}

										console.log(jack);
										console.log($scope.game.yourJacks.indexOf(jack));
										//Remove the attached jacks from your jacks
										$scope.game.yourJacks.forEach(function (yourJack, yourJacksIndex, yourJacks) {
											if (jack.suit === yourJack.suit && jack.rank === 11 && yourJack.rank === 11) {
												$scope.game.yourJacks.splice(yourJacksIndex, 1);
											}
										});
									});
									break;
							}

						case 'topCardChange':
							$scope.game.stacking = false;
							$scope.game.topTwoPick = false;
							$scope.game.topCard = obj.data.game.topCard;
							$scope.game.deck = obj.data.game.deck;
							break;
					}
					break;

					//Using this case to trigger gameView	
				case 'messaged':
					console.log("\nGame messaged.");
					console.log(obj.data);
					if (obj.data.hasOwnProperty('game')) {
						$scope.game.gameView = true;
						$scope.game.players = obj.data.players;
						$scope.game.deck = obj.data.game.deck;
						$scope.game.scrap = obj.data.game.scrap;
						$scope.game.topCard = obj.data.game.topCard;
						$scope.game.secondCard = obj.data.game.secondCard;
						$scope.game.topTwo = [obj.data.game.topCard, obj.data.game.secondCard];
						$scope.game.turn = obj.data.game.turn;

						//Request to be subscribed to both player models now that the game is beginning
						//Player model events will be used to handle changes that only involve hands, points and runes.
						io.socket.get('/player/subscribe', {
							p0Id: $scope.game.players[0].id,
							p1Id: $scope.game.players[1].id
						}, function(res) {
							console.log(res);
						});

					}
					break;
			}
			$scope.$apply();
		});

		//Player Events are used to make changes only involving players' hands, points and runes
		io.socket.on('player', function(obj) {
			console.log("\nPlayer event fired");
			console.log(obj.data);
			switch (obj.verb) {
				case 'updated':
					switch (obj.data.change) {
						case 'points':
							if (obj.data.victor === true) {
								alert("Player " + obj.data.player.pNum + " has won!");
							}
							$scope.game.players[obj.data.player.pNum] = obj.data.player;
							$scope.game.topTwoPick = false;
							$scope.game.turn = obj.data.turn;
							break;
						case 'runes':
							if (obj.data.victor === true) {
								alert("Player " + obj.data.player.pNum + " has won!");
							}
							$scope.game.players[obj.data.player.pNum] = obj.data.player;
							$scope.game.topTwoPick = false;
							$scope.game.turn = obj.data.turn;
					}
					break;
			}

			$scope.$apply();
		});

	});
})();