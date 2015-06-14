/**
* Game.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {
  	name: {
  		type: 'string',
  		required: true,
  	},

    p0Ready: {
      type: 'boolean',
      defaultsTo: false,
    },

    p1Ready: {
      type: 'boolean',
      defaultsTo: false,
    },
    
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
    turn: {
      type: 'integer',
      defaultsTo: 1
    },
  	log: {
  		type: 'array',
  	},
  }
};

