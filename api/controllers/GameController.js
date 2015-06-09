/**
 * GameController
 *
 * @description :: Server-side logic for managing games
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

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
};

