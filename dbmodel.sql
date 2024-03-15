
-- ------
-- BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
-- ForksPD implementation : © Copyright 2024, Philip Davis (mrphilipadavis AT gmail)
-- 
-- This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
-- See http://en.boardgamearena.com/#!doc/Studio for more information.
-- -----

-- Note that the database itself and the standard tables ("global", "stats", "gamelog" and "player") are
-- already created and must not be created here


CREATE TABLE IF NOT EXISTS game_state (
    id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    doc JSON NOT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1;
