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

//    !! It is not a good idea to modify this file when a game is running !!

defined('BGA_STATE_START') || define('BGA_STATE_START', 1);
defined('STATE_DEAL') || define('STATE_DEAL', 10);
defined('STATE_PASS_SELECTION') || define('STATE_PASS_SELECTION', 20);
defined('STATE_PASS') || define('STATE_PASS', 30);
defined('STATE_DISCARD_SELECTION') || define('STATE_DISCARD_SELECTION', 40);
defined('STATE_REVEAL') || define('STATE_REVEAL', 50);
defined('BGA_STATE_END') || define('BGA_STATE_END', 99);

 
$machinestates = [

    // The initial state. Please do not modify.
    BGA_STATE_START => [
        'name' => 'gameSetup',
        'description' => '',
        'type' => 'manager',
        'action' => 'stGameSetup',
        'transitions' => [
            '' => STATE_DEAL,
        ],
    ],

    // Players are dealt three cards each
    STATE_DEAL => [
        'name' => 'dealCards',
        'description' => '',
        'type' => 'game',
        'action' => 'stDealCards',
        'transitions' => [
            '' => STATE_PASS_SELECTION,
        ],
    ],
    
    // Players simultaneously choose two cards to pass left
    STATE_PASS_SELECTION => [
        'name' => 'passSelection',
        'description' => clienttranslate('Other players must pass cards'),
        'descriptionmyturn' => clienttranslate('${you} must select two cards to pass'),
        'type' => 'multipleactiveplayer',
        'action' => 'stMakeEveryoneActive',
        'possibleactions' => [ 'passCards' ],
        'transitions' => [
            '' => STATE_PASS,
        ],
    ],

    // The cards are passed to the next player.
    // This is mostly just here to update the game progression.
    STATE_PASS => [
        'name' => 'passCards',
        'description' => '',
        'type' => 'game',
        'action' => 'stPassCards',
        'updateGameProgression' => true,   
        'transitions' => [
            '' => STATE_DISCARD_SELECTION,
        ],
    ],

    // Players simultaneously choose one card to discard
    STATE_DISCARD_SELECTION => [
        'name' => 'discardSelection',
        'description' => clienttranslate('Other players must discard'),
        'descriptionmyturn' => clienttranslate('${you} must select one card to discard'),
        'type' => 'multipleactiveplayer',
        'action' => 'stMakeEveryoneActive',
        'possibleactions' => [ 'discardCard' ],
        'transitions' => [
            '' => STATE_REVEAL,
        ],
    ],

    // The face-down Marketing pile is revealed to all players
    STATE_REVEAL => [
        'name' => 'reveal',
        'description' => '',
        'type' => 'game',
        'action' => 'stRevealMarketing',
        'updateGameProgression' => true,   
        'transitions' => [
            'nextRound' => STATE_DEAL,
            'gameOver' => BGA_STATE_END,
        ],
    ],
    
    // Final state.
    // Please do not modify (and do not overload action/args methods).
    BGA_STATE_END => [
        'name' => 'gameEnd',
        'description' => clienttranslate('End of game'),
        'type' => 'manager',
        'action' => 'stGameEnd',
        'args' => 'argGameEnd'
    ],
];
