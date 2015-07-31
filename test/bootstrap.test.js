var Sails = require('sails'),
  sails;

before(function(done) {
  Sails.lift({
  }, function(err, server) {
     sails = server;

 	Game.create({name: "testGame"}, function(error, newGame) {
 		console.log("Created a game");

     	// Player.create({currentGame: newGame.id, pNum: 0}, function (erro, newP0) {
     		// console.log("\nCreated p0");
     		// console.log(newP0);

	 		Card.create({rank: 11, suit: 3}, function (er, newJack) {
				console.log("newJack:");
				console.log(newJack);
	 		});
     	// });
     	// Player.create({currentGame: newGame.id, pNum: 1}, function (err, newP1) {
     		// console.log("Created new p1:\n");
     		// console.log(newP1);

			Card.create({rank: 10, suit: 3}, function (e, newPoints) {
				console.log("newPoints");
				console.log(newPoints);

			});
     	// });

	});


     if (err) return done(err);
     done(err, sails); 
  });
});


after(function(done) {
  sails.lower(done);
});
