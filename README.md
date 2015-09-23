# cuttleV1

This is a multiplayer card game leveraging sails.js and angularjs.

## Installation
*	Install node
	*	Download [here](https://nodejs.org/en/)
	*	Make sure npm is also installed (usually a default)
*	Install sails.js in your terminal using npm:
	*	npm install -g sails
*	Clone the git repository for the project:
	*	git clone https://github.com/TeasingSisyphus/cuttleV1
*	Install local dependencies
	*	npm install
	
## Use
*	Lift the app from terminal/powershell
	*	sails lift
		*	must be executed from inside project root directory (cuttleV1)
*	Navigate to the app on your browser by entering the following url:
	*	From the machine RUNNING the server:
		*	localHost:1337
	*	From any other machine on the same WIFI network:
		*	yourServersLocalIP:1337
		*	ex) 192.167.1.4:1337
			* In this case, the machine running the server in its terminal has a local ip: 192.167.1.4
*	After opening at least 2 browser tabs to the homepage, you can submit text into the form on the left
	*	to create a new game.
*	You can click an existing game from the list underneath the text bar to join it, then click the 'ready' button to play
*	When two players have joined the same game, and clicked the 'ready' button, both will be taken to the view of their game
*	Within a game, click the card that you wish to play, and then the place that you wish to play it.
*	Click the deck to draw a card (this takes your turn)
*	After selecting a card, 
	*	click an enemy point card to scuttle it
	*	click the scrap pile to play it as a one-off	