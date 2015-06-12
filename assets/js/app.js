(function(){
	var app = angular.module('homepage', []);
	console.log('We made an app.js');

	app.controller('homepageController', function($scope, $rootScope){
		this.formTitle = 'Type a name and submit to create a new game!';
		this.gameName = '';
		this.gameList = [];
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

				console.log(res.hasOwnProperty('game'));

				if( res.hasOwnProperty('game') ) {
					$scope.homepage.gameView = true;
					$rootScope.$emit('gameView', res.game);

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
		this.turn = null;
		this.pNum = null;
		this.glasses = false;

		this.buns = function(){console.log('buns')};

		$rootScope.$on('gameView', function(event, game) {
			console.log('\nChanging to gameView');
			$scope.game.gameId = game.id;
			$scope.game.gameName = game.name;
			$scope.game.pNum = game.players.length;
			$scope.game.deck = game.deck;


		});

		///////////////////////////
		// Socket Event Handlers //
		///////////////////////////
		io.socket.on('game', function(obj) {
			switch (obj.verb) {
				case 'updated':
					console.log("\nGame was updated.");
					if ( obj.data.hasOwnProperty('game') ) {
						$scope.game.players = obj.data.game.players;
						$scope.game.deck = obj.data.game.deck;
						$scope.game.scrap = obj.data.game.scrap;
						$scope.game.topCard = obj.data.game.topCard;
						$scope.game.secondCard = obj.data.game.secondCard;
						$scope.game.turn = obj.data.game.turn;

						$scope.$apply();
					}
					break;						
			}
		});
	});	
})();