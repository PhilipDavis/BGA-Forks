<?php
/**
 *------
 * BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
 * ForksPD implementation : © Copyright 2024, Philip Davis (mrphilipadavis AT gmail)
 *
 * This code has been produced on the BGA studio platform for use on https://boardgamearena.com.
 * See http://en.doc.boardgamearena.com/Studio for more information.
 * -----
 */

class action_forkspd extends APP_GameAction
{ 
    // Constructor: please do not modify
   	public function __default()
  	{
  	    if (self::isArg('notifwindow'))
  	    {
            $this->view = "common_notifwindow";
  	        $this->viewArgs['table'] = self::getArg("table", AT_posint, true);
  	    }
  	    else
  	    {
            $this->view = "forkspd_forkspd";
            self::trace("Complete reinitialization of board game");
        }
  	}
  	

    public function passCards()
    {
        self::setAjaxMode();     
        
        $cardId1 = intval(self::getArg('card1', AT_posint, true));
        $cardId2 = intval(self::getArg('card2', AT_posint, true));
        $this->game->passCards([ $cardId1, $cardId2 ]);

        self::ajaxResponse();
    }

    public function discardCard()
    {
        self::setAjaxMode();     

        $cardId = intval(self::getArg('card', AT_posint, true));
        $this->game->discardCard($cardId);

        self::ajaxResponse();
    }
}
