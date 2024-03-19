<?php
 /**
  *------
  * BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
  * ForksPD implementation : © Copyright 2024, Philip Davis (mrphilipadavis AT gmail)
  * 
  * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
  * See http://en.boardgamearena.com/#!doc/Studio for more information.
  * -----
  */

require_once(APP_GAMEMODULE_PATH.'module/table/table.game.php');
require_once('modules/forks_logic.php');

define('FORKS_RULESET_STANDARD', 1);
define('FORKS_RULESET_MERGE_VARIANT', 2);

class ForksPD extends Table
{
	function __construct()
	{
        // Your global variables labels:
        //  Here, you can assign labels to global variables you are using for this game.
        //  You can use any number of global variables with IDs between 10 and 99.
        //  If your game has options (variants), you also have to associate here a label to
        //  the corresponding ID in gameoptions.inc.php.
        // Note: afterwards, you can get/set the global variables with getGameStateValue/setGameStateInitialValue/setGameStateValue
        parent::__construct();
        
        self::initGameStateLabels([
            // Use this to determine on the client side whether we need to animate
            // the initial setup of the game.
            "gameStarted" => 10,

            // Game Options
            "mergeVariant" => 100,
        ]);
	}
	
    protected function getGameName()
    {
		// Used for translations and stuff. Please do not modify.
        return "forkspd";
    }	

    //
    // This method is called only once, when a new game is launched.
    // In this method, you must setup the game according to the game
    // rules, so that the game is ready to be played.
    //
    protected function setupNewGame($players, $options = [])
    {    
        // Set the colors of the players with HTML color code
        // The default below is red/green/blue/orange/brown
        // The number of colors defined here must correspond to the maximum number of players allowed for the gams
        $gameinfo = $this->getGameinfos();
        $defaultColors = $gameinfo['player_colors'];
 
        // Create players
        // Note: if you added some extra field on "player" table in the database (dbmodel.sql), you can initialize it there.
        $sql = "INSERT INTO player (player_id, player_color, player_canal, player_name, player_avatar) VALUES ";
        $values = [];
        foreach($players as $playerId => $player)
        {
            $color = array_shift($defaultColors);
            $values[] = "('".$playerId."','$color','".$player['player_canal']."','".addslashes($player['player_name'])."','".addslashes($player['player_avatar'])."')";
        }
        $sql .= implode(',', $values);
        $this->DbQuery($sql);
        $this->reattributeColorsBasedOnPreferences($players, $gameinfo['player_colors']);
        $this->reloadPlayersBasicInfos();
        
        $playerIds = array_keys($players);
        $playerCount = count($playerIds);

        /************ Start the game initialization *****/
        
        // Init game statistics
        $this->initStat('table', 'rounds', 0);
        $this->initStat('player', 'points_grey', 0);
        $this->initStat('player', 'points_blue', 0);
        $this->initStat('player', 'points_green', 0);
        $this->initStat('player', 'points_yellow', 0);
        $this->initStat('player', 'points_red', 0);
        if ($playerCount <= 3)
        {
            $this->initStat('player', 'points_lows_23', 0);
            $this->initStat('player', 'points_mids_23', 0);
            $this->initStat('player', 'points_highs_23', 0);
        }
        else {
            $this->initStat('player', 'points_lows_456', 0);
            $this->initStat('player', 'points_mids_456', 0);
            $this->initStat('player', 'points_highs_456', 0);
        }

        $this->setGameStateInitialValue('gameStarted', 0); // Not "started" until first move is received

        $forksOptions = [
            'allowMerge' => $this->getGameStateValue('mergeVariant') == FORKS_RULESET_MERGE_VARIANT,
        ];
        
        $forks = Forks::newGame($playerIds, $forksOptions);
        $this->initializeGameState($forks);
    }

    //
    // Gather all informations about current game situation (visible by the current player).
    // The method is called each time the game interface is displayed to a player,
    // i.e. when the game starts and when a player refreshes the game page (F5).
    //
    protected function getAllDatas()
    {
        $currentPlayerId = $this->getCurrentPlayerId(); // We must only return information visible to this player!
        $forks = $this->loadGameState();
        return [
            'intro' => !$this->getGameStateValue('gameStarted'),
            'forks' => $forks->getPlayerData($currentPlayerId),
            'round' => $forks->getCurrentRound(),
            'total' => $forks->getTotalRounds(),
        ];
    }

    //
    // Compute and return the current game progression. The number returned must be
    // an integer beween 0 (the game just started) and 100 (the game is finished).
    //
    function getGameProgression()
    {
        $forks = $this->loadGameState();
        return $forks->getGameProgression();
    }


//////////////////////////////////////////////////////////////////////////////
//////////// Database functions
////////////

    protected function initializeGameState($forks)
    {
        $json = $forks->toJson();
        $this->DbQuery("INSERT INTO game_state (doc) VALUES ('$json')");
    }

    protected function loadGameState()
    {
        $json = $this->getObjectFromDB("SELECT id, doc FROM game_state LIMIT 1")['doc'];
        return Forks::fromJson($json);
    }

    protected function saveGameState($forks)
    {
        $json = $forks->toJson();
        $this->DbQuery("UPDATE game_state SET doc = '$json'");
    }

    protected function setPlayerScore($playerId, $score)
    {
        $this->DbQuery("UPDATE player SET player_score = '$score' WHERE player_id = '$playerId'");
    }


//////////////////////////////////////////////////////////////////////////////
//////////// Utility functions
////////////    

    protected function validateCaller()
    {
        // Get the function name of the caller -- https://stackoverflow.com/a/11238046
        $fnName = debug_backtrace(!DEBUG_BACKTRACE_PROVIDE_OBJECT | DEBUG_BACKTRACE_IGNORE_ARGS, 2)[1]['function'];
        $actionName = explode('_', $fnName)[1];
        self::checkAction($actionName);

        // Current player is who made the AJAX call to us
        $currentPlayerId = $this->getCurrentPlayerId();

        // Not checking against Active player ID because all players are always mutually active or inactive.

        return $currentPlayerId;
    }


//////////////////////////////////////////////////////////////////////////////
//////////// Player actions
//////////// 

    function action_passCards($cardIds)
    {
        $playerId = $this->validateCaller();

        $forks = $this->loadGameState();
        if (!$forks->passCards($playerId, $cardIds))
        {
            $refId = uniqid();
            self::trace('Ref #' . $refId . ': passCards failed -- player: ' . $playerId . ', cards ' . json_encode($cardIds) . ', state: ' . $forks->toJson());
            throw new BgaVisibleSystemException("Invalid operation - Ref #" . $refId); // NOI18N
        }
        $this->saveGameState($forks);

        // Mark the game as started (so the client knows not to draw the game setup)
        if (!$this->getGameStateValue("gameStarted"))
            $this->setGameStateValue("gameStarted", 1);

        $this->notifyPlayer($playerId, 'youPassedCards', '', [
            'cards' => $cardIds,
            'preserve' => [ 'cards' ],
        ]);
    
        $this->notifyAllPlayers('cardsPassed', clienttranslate('${playerName} passes cards'), [
            'playerName' => $this->getPlayerNameById($playerId),
            'playerId' => $playerId,
            'preserve' => [ 'playerId' ],
        ]);

        $this->gamestate->setPlayerNonMultiactive($playerId, '');
        $this->giveExtraTime($playerId);
    }

    function action_discardCard($cardId)
    {
        $playerId = $this->validateCaller();

        $forks = $this->loadGameState();
        if (!$forks->discardCard($playerId, $cardId))
        {
            $refId = uniqid();
            self::trace('Ref #' . $refId . ': discardCard failed -- player: ' . $playerId . ', cards ' . json_encode($cardId) . ', state: ' . $forks->toJson());
            throw new BgaVisibleSystemException("Invalid operation - Ref #" . $refId); // NOI18N
        }
        $this->saveGameState($forks);

        $this->notifyPlayer($playerId, 'youDiscardedCard', '', [
            'card' => $cardId,
            'preserve' => [ 'card' ],
        ]);

        // Notify all players about the card played
        $this->notifyAllPlayers('cardDiscarded', clienttranslate('${playerName} discards a card'), [
            'playerName' => $this->getPlayerNameById($playerId),
            'playerId' => $playerId,
            'preserve' => [ 'playerId' ],
        ]);

        $this->gamestate->setPlayerNonMultiactive($playerId, '');
        $this->giveExtraTime($playerId);
    }
    
    
//////////////////////////////////////////////////////////////////////////////
//////////// Game state arguments
////////////



//////////////////////////////////////////////////////////////////////////////
//////////// Game state actions
////////////

    function stDealCards()
    {
        $forks = $this->loadGameState();
        $dealt = $forks->dealCards();
        $this->saveGameState($forks);

        foreach ($dealt as $playerId => $cardIds)
        {
            $this->notifyPlayer($playerId, 'dealt', '', [
                'cards' => $cardIds,
                'preserve' => [ 'cards' ],
            ]);
        }

        $this->setStat($forks->getCurrentRound(), 'rounds');
        
        $this->notifyAllPlayers('allDealt', clienttranslate('Cards have been dealt'), [
            'round' => $forks->getCurrentRound(),
            'total' => $forks->getTotalRounds(),
            'preserve' => [ 'round', 'total' ],
        ]);
        $this->gamestate->nextState('');
    }

    function stPassCards()
    {
        $forks = $this->loadGameState();
        $received = $forks->movePassedCards();
        $this->saveGameState($forks);

        self::trace('After passing cards: ' . $forks->toJson());

        foreach ($received as $playerId => $cardIds)
        {
            $this->notifyPlayer($playerId, 'received', '', [
                'cards' => $cardIds,
                'preserve' => [ 'cards' ],
            ]);
        }

        $this->notifyAllPlayers('allPassed', clienttranslate('Cards have been passed'), []);
        $this->gamestate->nextState('');
    }

    function stRevealMarketing()
    {
        $forks = $this->loadGameState();
        $revealed = $forks->revealMarketing();
        $this->saveGameState($forks);

        self::trace('After revealing discards: ' . $forks->toJson());

        $currentRound = $forks->getCurrentRound();
        $totalRounds = $forks->getTotalRounds();
    
        // Note: in a 2-player game, the last revealed marketing card
        // came from the top of the deck rather than from a player.
        $this->notifyAllPlayers('revealed', clienttranslate('Round ${round} of ${total} has ended'), [
            'cards' => $revealed,
            'round' => $currentRound,
            'total' => $totalRounds,
            'preserve' => [ 'cards' ],
        ]);

        if ($forks->isGameOver())
        {
            $losers = [];
            $playerScores = $forks->getScores($losers);
            $playerCount = count($playerScores);
            foreach ($playerScores as $playerId => $score)
            {
                $this->setPlayerScore($playerId, $score['total']);

                $this->setStat($score['grey'], 'points_grey', $playerId);
                $this->setStat($score['blue'], 'points_blue', $playerId);
                $this->setStat($score['yellow'], 'points_yellow', $playerId);
                $this->setStat($score['green'], 'points_green', $playerId);
                $this->setStat($score['red'], 'points_red', $playerId);
                if ($playerCount <= 3)
                {
                    $this->setStat($score['lows'], 'points_lows_23', $playerId);
                    $this->setStat($score['mids'], 'points_mids_23', $playerId);
                    $this->setStat($score['highs'], 'points_highs_23', $playerId);
                }
                else {
                    $this->setStat($score['lows'], 'points_lows_456', $playerId);
                    $this->setStat($score['mids'], 'points_mids_456', $playerId);
                    $this->setStat($score['highs'], 'points_highs_456', $playerId);
                }
            }

            $this->notifyAllPlayers('losers', '', [
                'losers' => $losers,
                'scores' => array_map(fn($ps) => $ps['total'], $playerScores),
                'preserve' => [ 'losers', 'scores' ],
            ]);
                        
            $this->gamestate->nextState('gameOver');
            return;
        }

        $this->gamestate->nextState('nextRound');
    }


//////////////////////////////////////////////////////////////////////////////
//////////// Zombie
////////////

    /*
        zombieTurn:
        
        This method is called each time it is the turn of a player who has quit the game (= "zombie" player).
        You can do whatever you want in order to make sure the turn of this player ends appropriately
        (ex: pass).
        
        Important: your zombie code will be called when the player leaves the game. This action is triggered
        from the main site and propagated to the gameserver from a server, not from a browser.
        As a consequence, there is no current player associated to this action. In your zombieTurn function,
        you must _never_ use getCurrentPlayerId() or getCurrentPlayerName(), otherwise it will fail with a "Not logged" error message. 
    */

    function zombieTurn($state, $zombiePlayerId)
    {
    	$stateName = $state['name'];

        if ($state['type'] !== "multipleactiveplayer")
            throw new feException("Zombie mode not supported at this game state: " . $stateName); // NOI18N

        $forks = $this->loadGameState();

        switch ($stateName)
        {
            case 'passSelection':
                // Randomly choose two cards to pass
                $data = $forks->getPlayerData($zombiePlayerId);
                $cardIds = $data->players->$zombiePlayerId->dealt;
                shuffle($cardIds);
                array_pop($cardIds);
                if (!$forks->passCards($zombiePlayerId, $cardIds))
                {
                    $refId = uniqid();
                    self::trace('Ref #' . $refId . ': passCards failed -- zombie player: ' . $zombiePlayerId . ', cards ' . json_encode($cardIds) . ', state: ' . $forks->toJson());
                    throw new BgaSystemException("Invalid operation - Ref #" . $refId); // NOI18N
                }
                $this->saveGameState($forks);
        
                $this->notifyAllPlayers('cardsPassed', clienttranslate('${playerName} passes cards'), [
                    'playerName' => $this->getPlayerNameById($zombiePlayerId),
                    'playerId' => $zombiePlayerId,
                    'preserve' => [ 'playerId' ],
                ]);
                break;

            case 'discardSelection':
                // Randomly choose one cards to discard
                $data = $forks->getPlayerData($zombiePlayerId);
                $cardIds = $data->players->$zombiePlayerId->received;
                shuffle($cardIds);
                $discardCardId = array_pop($cardIds);
                if (!$forks->discardCard($zombiePlayerId, $discardCardId))
                {
                    $refId = uniqid();
                    self::trace('Ref #' . $refId . ': discardCard failed -- zombie player: ' . $zombiePlayerId . ', card ' . json_encode($discardCardId) . ', state: ' . $forks->toJson());
                    throw new BgaSystemException("Invalid operation - Ref #" . $refId); // NOI18N
                }
                $this->saveGameState($forks);
        
                $this->notifyAllPlayers('cardDiscarded', clienttranslate('${playerName} discards a card'), [
                    'playerName' => $this->getPlayerNameById($zombiePlayerId),
                    'playerId' => $zombiePlayerId,
                    'preserve' => [ 'playerId' ],
                ]);
                break;
        }

        // Make sure player is in a non blocking status
        $this->gamestate->setPlayerNonMultiactive($zombiePlayerId, '');
        return;
    }

    
///////////////////////////////////////////////////////////////////////////////////:
////////// DB upgrade
//////////

    /*
        upgradeTableDb:
        
        You don't have to care about this until your game has been published on BGA.
        Once your game is on BGA, this method is called everytime the system detects a game running with your old
        Database scheme.
        In this case, if you change your Database scheme, you just have to apply the needed changes in order to
        update the game database and allow the game to continue to run with your new version.
    
    */
    
    function upgradeTableDb($from_version)
    {
        // $from_version is the current version of this game database, in numerical form.
        // For example, if the game was running with a release of your game named "140430-1345",
        // $from_version is equal to 1404301345
        
        // Example:
//        if($from_version <= 1404301345)
//        {
//            // ! important ! Use DBPREFIX_<table_name> for all tables
//
//            $sql = "ALTER TABLE DBPREFIX_xxxxxxx ....";
//            self::applyDbUpgradeToAllDB($sql);
//        }
//        if($from_version <= 1405061421)
//        {
//            // ! important ! Use DBPREFIX_<table_name> for all tables
//
//            $sql = "CREATE TABLE DBPREFIX_xxxxxxx ....";
//            self::applyDbUpgradeToAllDB($sql);
//        }
//        // Please add your future database scheme changes here
    }    
}
