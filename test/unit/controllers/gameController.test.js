// require("../../bootstrap.test.js");
var Promise = require('bluebird');
var request = require('supertest');

var agent = request.agent('localhost:1337');

describe('GameController', function() {
	describe('Emulation', function() {

		var player0;
		var player1;
		var jack;
		var rune;

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

			var promiseRune = new Promise(function (resolve, reject) {
				Card.create({suit: 3, rank: 10}, function (error, createdRune) {
					resolve(createdRune);
				});
			});

			promiseRune.then(function (createdRune) {
				rune = createdRune;
			});

			Promise.all([promisePlayer0, promisePlayer1, promiseJack, promiseRune]).then(function (values) {

				player0.hand.add(jack.id);
				player1.runes.add(rune.id);

				player0.save(function (error, savedPlayer0) {
					player1.save(function (erro, savedPlayer1) {
						player0 = savedPlayer0;
						player1 = savedPlayer1
						done();
					});
				});
				
			});

		});

		it('should jack a rune', function(done) {

			agent.post('/game/jackBug').send({thiefId: player0.id, victimId: player1.id, targetId: rune.id}).end(function (error, res) {
				console.log(res.body);
				done();
			});
		});

	});
});