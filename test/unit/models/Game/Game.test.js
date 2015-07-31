describe('GameModel', function() {

  describe('#find()', function() {
   it('should check find function', function(done) {
     Game.find()
       .then(function(results) {

        done();
     })
     .catch(done);
   });
 });


  describe('#subscribe', function() {
  	it('should subscribe requesting socket to new game', function() {
  		
  	});
  });

});
