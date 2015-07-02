/**
* Card.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {
  	rank: {
  		type: 'integer',
  	},
  	suit: {
  		type: 'integer',
  	},
  	deck: {
  		model: 'game',
  	},
  	scrap: {
  		model: 'game',
  	},
  	hand: {
  		model: 'player',
  	},
  	points: {
  		model: 'player',
  	},
  	runes: {
  		model: 'player',
   	},

    stackedTwo: {
      model: 'game',
    },

    targetId: {
      type: 'integer',
    },

    attachments: {
      collection: 'card',
      via: 'attached'
    },

    attached: {
      model: 'card'
    },
    
    class: {
      type: 'string',
      defaultsTo: 'card',
    },

  }
};

