// require("../../bootstrap.test.js");
var Promise = require('bluebird');
var request = require('supertest');
var assert = require("assert");
var should = require("should");

var agent = request.agent('localhost:1337');

describe('GameController', function() {
	describe('Emulation', function() {
		var game;
		var player0;
		var player1;
		var jack;
		var points;

		before(function instantiateRecords(done) {
			var promiseGame = new Promise(function(resolve, reject){
				Game.create({name: 'temp', turn:0}, function(error, createdGame){
					return resolve(createdGame);
				});
			});
			
			promiseGame.then(function(createdGame){
				game = createdGame;
			});
			
			var promisePlayer0 = new Promise(function(resolve, reject) {
				Player.create({pNum: 0}, function(error, createdPlayer0) {
					resolve(createdPlayer0);
				});
			});

			promisePlayer0.then(function (createdPlayer0) {
				player0 = createdPlayer0;
			});

			var promisePlayer1 = new Promise(function (resolve, reject) {
				Player.create({pNum: 1}, function (error, createdPlayer1) {
					resolve(createdPlayer1);
				});

			});

			promisePlayer1.then(function (createdPlayer1) {
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

			Promise.all([promiseGame, promisePlayer0, promisePlayer1, promiseJack, promisePoints]).then(function (values) {

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

		it('should jack some points', function(done) {

			agent.post('/game/jack').send({gameId: game.id, pNum: 0, thiefId: player0.id, victimId: player1.id, targetId: points.id, jackId: jack.id}).end(function (error, res) {
				res.body.jack.should.equal(true);
				res.body.thief.points.length.should.equal(1); //Thief should have exactly one point card
				res.body.thief.points[0].id.should.equal(points.id); //Thief's point card should be the same as points
				res.body.thief.hand.length.should.equal(0); //Thief should no longer have any cards in hand
				res.body.victim.points.length.should.equal(0); //Victim should no longer have points
				res.body.points.attachments.length.should.equal(1); //Points should now have one attachment
				res.body.points.attachments[0].id.should.equal(jack.id); //That attachment should be the jack
				done();
			});
		});

	});
});