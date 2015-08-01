require("../../bootstrap.test.js");

describe('GameController', function() {
	describe('Emulation', function() {

		// before(function instantiateRecords(done) {
		// 	done();
		// });

		it('should jack points', function() {
			console.log('goshDarnit');
			Player.find({}).sort("pNum ASC").exec(function (error, players) {
				console.log("inside player find");
				Card.find({}).sort("rank ASC").exec(function (erro, cards) {
					console.log("Logging cards");
					console.log(cards);
				});
				console.log('inside should');
				console.log(players);

			});
		});

	});
});