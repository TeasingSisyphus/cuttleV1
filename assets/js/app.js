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
		this.turn = null;
		this.pNum = null;
		this.glasses = false;
		this.p0Ready = false;
		this.p1Ready = false;
		this.gameView = false;


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
				//Using this case to trigger gameView	
				case 'messaged':
					console.log("\nGame was updated.");
					if ( obj.data.hasOwnProperty('game') ) {
						$scope.game.gameView = true;
						$scope.game.players = obj.data.game.players;
						$scope.game.deck = obj.data.game.deck;
						$scope.game.scrap = obj.data.game.scrap;
						$scope.game.topCard = obj.data.game.topCard;
						$scope.game.secondCard = obj.data.game.secondCard;
						$scope.game.turn = obj.data.game.turn;

					}
					break;						
			}
			$scope.$apply();
		});
	});	
})();