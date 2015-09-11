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

    topCard: {
      model: 'card',
    },

    secondCard: {
      model: 'card',
    },

    deck: {
      collection: 'card',
      via: 'deck',
    },

    scrapTop: {
      model: 'card'
    },

    scrap: {
      collection: 'card',
      via: 'scrap',
    },

    firstEffect: {
      model: 'card',
      defaultsTo: null
    },

    twos: {
      collection: 'card',
      via: 'stackedTwo'
    },

    turn: {
      type: 'integer',
      defaultsTo: 1
    },

    winner: {
      type: 'integer',
      defaultsTo: null
    },

    log: {
      type: 'array',
      defaultsTo: []
    },

    passCount: {
      type: 'integer',
      defaultsTo: 0
    }
  }
};