// require("../../bootstrap.test.js");
var Promise = require('bluebird');
describe('GameController', function() {
	describe('Emulation', function() {

		var player0;
		var player1;
		var jack;
		var point;

		before(function instantiateRecords(done) {
			var promisePlayer0 = new Promise(function(resolve, reject) {
				Player.create({pNum: 0}, function(error, createdPlayer0) {
					resolve(createdPlayer0);
				});
			});

			promisePlayer0.then(function (createdPlayer0) {
				// console.log("\ncreatedPlayer0:");
				// console.log(createdPlayer0);
				player0 = createdPlayer0;
			});

			var promisePlayer1 = new Promise(function (resolve, reject) {
				Player.create({pNum: 1}, function (error, createdPlayer1) {
					resolve(createdPlayer1);
				});

			});

			promisePlayer1.then(function (createdPlayer1) {
				// console.log("\ncreatedPlayer1:");
				// console.log(createdPlayer1);
				player1 = createdPlayer1;
			});

			var promiseJack = new Promise(function (resolve, reject) {
				Card.create({suit: 3, rank: 11}, function (error, createdJack) {
					resolve(createdJack);
				});
			});

			promiseJack.then(function (createdJack) {
				jack = createdJack;
			});

			var promisePoints = new Promise(function (resolve, reject) {
				Card.create({suit: 3, rank: 10}, function (error, createdPoints) {
					resolve(createdPoints);
				});
			});

			promisePoints.then(function (createdPoints) {
				points = createdPoints;
			});

			Promise.all([promisePlayer0, promisePlayer1, promiseJack, promisePoints]).then(function (createdPlayer0, createdPlayer1, createdJack, createdPoints) {
				player0.hand.add(jack.id);
				player1.points.add(points.id);

				player0.save(function (error, savedPlayer0) {
					player1.save(function (erro, savedPlayer1) {
						player0 = savedPlayer0;
						player1 = savedPlayer1
						done();
					});
				});
				
			});

		});

		it('should jack points', function() {
			console.log("Inside should jack points test. Logging players:");
			console.log(player0);
			console.log(player1);
			console.log("\nLogging cards");
			console.log(jack);
			console.log(points);
		});

	});
});