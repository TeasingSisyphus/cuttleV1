(function(){
	var app = angular.module('homepage', []);
	console.log('We made an app.js');

	app.controller('homepageController', function($scope){
		this.formTitle = 'Type a name and submit to create a new game!';
		this.gameName = '';
		this.gameList = [];

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
		})
	});
})();