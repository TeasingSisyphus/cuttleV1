var Sails = require('sails'),
  sails;

before(function(done) {
  this.timeout(5000);
  Sails.lift({
  }, function(err, server) {
     sails = server;

 // 	Game.create({name: "testGame"}, function(error, newGame) {
 // 		console.log("Created a game");

 //     	Player.create({currentGame: newGame.id, pNum: 0}, function (erro, newP0) {
 //     		console.log("\nCreated p0");
 //     		console.log(newP0);

 //        Player.create({currentGame: newGame.id, pNum: 1}, function (err, newP1) {
 //          console.log("Created new p1:\n");
 //          console.log(newP1);

 //          Card.create({rank: 10, suit: 3}, function (e, newPoints) {
 //            console.log("newPoints");
 //            console.log(newPoints);
 //            Card.create({rank: 11, suit: 3}, function (er, newJack) {
 //              console.log("newJack:");
 //              console.log(newJack);
 //              done();
 //         		});

 //      		});
          
 //        });

 //      });

	// });


     if (err) return done(err);
     done(err, sails); 
  });
});


after(function(done) {
  sails.lower(done);
});
