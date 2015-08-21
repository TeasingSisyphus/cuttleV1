/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes map URLs to views and controllers.
 *
 * If Sails receives a URL that doesn't match any of the routes below,
 * it will check for matching files (images, scripts, stylesheets, etc.)
 * in your assets directory.  e.g. `http://localhost:1337/images/foo.jpg`
 * might match an image file: `/assets/images/foo.jpg`
 *
 * Finally, if those don't match either, the default 404 handler is triggered.
 * See `api/responses/notFound.js` to adjust your app's 404 logic.
 *
 * Note: Sails doesn't ACTUALLY serve stuff from `assets`-- the default Gruntfile in Sails copies
 * flat files from `assets` to `.tmp/public`.  This allows you to do things like compile LESS or
 * CoffeeScript for the front-end.
 *
 * For more information on configuring custom routes, check out:
 * http://sailsjs.org/#/documentation/concepts/Routes/RouteTargetSyntax.html
 */

module.exports.routes = {

  /***************************************************************************
  *                                                                          *
  * Make the view located at `views/homepage.ejs` (or `views/homepage.jade`, *
  * etc. depending on your default view engine) your home page.              *
  *                                                                          *
  * (Alternatively, remove this and add an `index.html` file in your         *
  * `assets` directory)                                                      *
  *                                                                          *
  ***************************************************************************/

  '/': {
    view: 'homepage'
  },

  /***************************************************************************
  *                                                                          *
  * Custom routes here...                                                    *
  *                                                                          *
  *  If a request to a URL doesn't match any of the custom routes above, it  *
  * is matched against Sails route blueprints. See `config/blueprints.js`    *
  * for configuration options and examples.                                  *
  *                                                                          *
  ***************************************************************************/

'/game/subscribe'        :          'GameController.subscribe',
'/game/create'           :          'GameController.create',
'/game/joinGame'         :          'GameController.joinGame',
'/game/ready'            :          'GameController.ready',
'/game/draw'             :          'GameController.draw',
'/game/scuttle'          :          'GameController.scuttle',
'/game/placeTopCard'     :          'GameController.placeTopCard',
'/game/oneOff'           :          'GameController.oneOff',
'/game/resolve'          :          'GameController.resolve',
'/game/resolveThree'     :          'GameController.resolveThree',
'/game/sevenPoints'      :          'GameController.sevenPoints',
'/game/sevenRunes'       :          'GameController.sevenRunes',
'/game/sevenScuttle'     :          'GameController.sevenScuttle',
'/game/sevenOneOff'      :          'GameController.sevenOneOff',
'/game/sevenJack'        :          'GameController.sevenJack',
'/game/jack'             :          'GameController.jack',
'/game/jackBug'          :          'GameController.jackBug',



'/player/subscribe'      :          'PlayerController.subscribe',
'/player/points'         :          'PlayerController.points',
'/player/runes'          :          'PlayerController.runes',


'/test'                  :          'GameController.test',
};
