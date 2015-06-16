(function(){
	var app = angular.module('homepage', []);
	console.log('We made an app.js');

	app.controller('homepageController', function($scope, $rootScope){
		this.formTitle = 'Type a name and submit to create a new game!';
		this.gameName = '';
		this.gameList = [];
		this.readyView = false;
		this.gameView = false;

		////////////////////////
		// Controller Methods //
		////////////////////////
		this.makeGame = function() {
			console.log("You remembered how to make a form!");
			console.log($scope.homepage.gameName);
			io.socket.get('/game/create',{name: $scope.homepage.gameName}, function(res) {
				console.log("\nRecieved response from request to create game: ");
				console.log(res);
			});
			$scope.homepage.gameName = '';
		};

		this.joinGame = function(id) {
			console.log("\nRequesting to join game: " + id);

			io.socket.get('/game/joinGame', {id: id}, function(res) {
				console.log("Recieved response to game: ");
				console.log(res);

				if( res.hasOwnProperty('game') ) {
					$scope.homepage.readyView = true;
					$rootScope.$emit('readyView', res.game);

					$scope.$apply();
				}
			});
		};

		///////////////////////////
		// Socket Event Handlers //
		///////////////////////////
		io.socket.on('connect', function(){
			io.socket.get('/game/subscribe',  function(res) {

				res.forEach(function(game, index, list) {
					$scope.homepage.gameList.push(game);
				});

				$scope.$apply();

			});
		});

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
		this.scrap = [];
		this.scrapTop = '';
		this.turn = null;
		this.pNum = null;
		this.glasses = false;
		this.p0Ready = false;
		this.p1Ready = false;
		this.gameView = false;
		this.selCard = null;
		this.selId = null;
		this.selIndex = null;


		this.ready = function() {
			console.log("Player " + $scope.game.pNum + " is ready to play");
			if ($scope.game.pNum === 0) {
				$scope.game.p0Ready = true;
			}
			if ($scope.game.pNum === 1) {
				$scope.game.p1Ready = true;
			}

			io.socket.get('/game/ready', {id: $scope.game.gameId, pNum: $scope.game.pNum}, function(res) {
				console.log(res);
			});
		};

		this.playerTest = function() {
			console.log('clicked playerTest');
			io.socket.get('/game/playerTest', {id: $scope.game.gameId}, function(res){
				console.log(res);
			});
		};

		//Selects a card by changing its class to apply a green border and capturing its id and index in your hand
		//If a card is already selected, use the previous index to find it and revert its class to normal
		//If the requested card was already selected, deselect it
		this.select = function(card, index) {
			console.log(index)
			console.log(card);
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
		};

		//If a card is selected, request to play that card for points
		this.points = function() {
			if ($scope.game.selId !== null) {
				console.log("\nRequesting to play " + $scope.game.players[$scope.game.pNum].hand[$scope.game.selIndex].alt + ' for points');
				io.socket.get('/player/points', {playerId: $scope.game.players[$scope.game.pNum].id, cardId: $scope.game.selId}, function(res) {
					console.log(res);
				});
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
				io.socket.get('/game/draw', {id: $scope.game.gameId, playerId: $scope.game.players[$scope.game.pNum].id, topCard: $scope.game.topCard, secondCard: $scope.game.secondCard}), function(res) {
					console.log(res);
				}
			}
		};

		//Scuttle from your hand to the opponents field
		this.scuttle = function(target) {
			if(this.selId !== null) {
				console.log('\n\nRequesting to scuttle');
				io.socket.get('/game/scuttle', {id: $scope.game.gameId, pNum: $scope.game.pNum, scuttler: $scope.game.selCard, target: target}, function(res) {
					console.log(res);
				});
			}
		}
		

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
							$scope.game.deck = obj.data.game.deck;
							$scope.game.topCard = obj.data.game.topCard;
							$scope.game.secondCard = obj.data.game.secondCard;
							$scope.game.players[obj.data.player.pNum].hand = obj.data.player.hand;
							break;

						case 'ready':
							if ( obj.data.hasOwnProperty('game') ) {
								$scope.game.p0Ready = obj.data.game.p0Ready;
								$scope.game.p1Ready = obj.data.game.p1Ready;
								$scope.game.players = obj.data.game.players;
								$scope.game.deck = obj.data.game.deck;
								$scope.game.scrap = obj.data.game.scrap;
								$scope.game.topCard = obj.data.game.topCard;
								$scope.game.secondCard = obj.data.game.secondCard;
								$scope.game.turn = obj.data.game.turn;

							}
							break;
						case 'scuttle':
							console.log('\nIn scuttle case');
							$scope.game.players = obj.data.players;
							$scope.game.scrap = obj.data.game.scrap;
							$scope.game.scrapTop = obj.data.game.scrapTop;
							break;
					}
					break;

				//Using this case to trigger gameView	
				case 'messaged':
					console.log("\nGame messaged.");
					console.log(obj.data);
					if ( obj.data.hasOwnProperty('game') ) {
						$scope.game.gameView = true;
						$scope.game.players = obj.data.players;
						$scope.game.deck = obj.data.game.deck;
						$scope.game.scrap = obj.data.game.scrap;
						$scope.game.topCard = obj.data.game.topCard;
						$scope.game.secondCard = obj.data.game.secondCard;
						$scope.game.turn = obj.data.game.turn;

						//Request to be subscribed to both player models now that the game is beginning
						//Player model events will be used to handle changes that only involve hands, points and runes.
						io.socket.get('/player/subscribe', {p0Id: $scope.game.players[0].id, p1Id: $scope.game.players[1].id}, function(res) {
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
			switch(obj.verb) {
				case 'updated':
					$scope.game.players[obj.data.player.pNum] = obj.data.player;
					break;
			}

			$scope.$apply();
		});
	
	});	
})();