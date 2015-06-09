/**
* Game.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {
  	// name: {
  	// 	type: 'string',
  	// 	required: true,
  	// },
  	players: {
  		collection: 'player',
  		via: 'currentGame',
  	},
  	deck: {
  		collection: 'card',
  		via: 'deck',
  	},
  	scrap: {
  		collection: 'card',
  		via: 'scrap',
  	},
  	topCard: {
  		model: 'card',
  	},
  	secondCard: {
  		model: 'card',
  	},
  	log: {
  		type: 'array',
  	},
  }
};

