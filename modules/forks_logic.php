<?php
// © Copyright 2024, Philip Davis (mrphilipadavis AT gmail)

class Forks
{
    private $data;

    private static $Cards = [
        1 => [ 'color' => 'grey', 'value' => 3 ],
        2 => [ 'color' => 'grey', 'value' => 4 ],
        3 => [ 'color' => 'grey', 'value' => 5 ],
        4 => [ 'color' => 'grey', 'value' => 6 ],
        5 => [ 'color' => 'grey', 'value' => 7 ],
        6 => [ 'color' => 'grey', 'value' => 8 ],
        7 => [ 'color' => 'grey', 'value' => 8 ],
        8 => [ 'color' => 'grey', 'value' => 9 ],
        9 => [ 'color' => 'grey', 'value' => 10 ],
        10 => [ 'color' => 'grey', 'value' => 11 ],
        11 => [ 'color' => 'grey', 'value' => 12 ],

        12 => [ 'color' => 'blue', 'value' => 3 ],
        13 => [ 'color' => 'blue', 'value' => 4 ],
        14 => [ 'color' => 'blue', 'value' => 5 ],
        15 => [ 'color' => 'blue', 'value' => 6 ],
        16 => [ 'color' => 'blue', 'value' => 7 ],
        17 => [ 'color' => 'blue', 'value' => 7 ],
        18 => [ 'color' => 'blue', 'value' => 8 ],
        19 => [ 'color' => 'blue', 'value' => 9 ],
        20 => [ 'color' => 'blue', 'value' => 10 ],
        21 => [ 'color' => 'blue', 'value' => 11 ],
        22 => [ 'color' => 'blue', 'value' => 12 ],

        23 => [ 'color' => 'yellow', 'value' => 3 ],
        24 => [ 'color' => 'yellow', 'value' => 4 ],
        25 => [ 'color' => 'yellow', 'value' => 5 ],
        26 => [ 'color' => 'yellow', 'value' => 6 ],
        27 => [ 'color' => 'yellow', 'value' => 6 ],
        28 => [ 'color' => 'yellow', 'value' => 7 ],
        29 => [ 'color' => 'yellow', 'value' => 8 ],
        30 => [ 'color' => 'yellow', 'value' => 9 ],
        31 => [ 'color' => 'yellow', 'value' => 10 ],
        32 => [ 'color' => 'yellow', 'value' => 11 ],
        33 => [ 'color' => 'yellow', 'value' => 12 ],

        34 => [ 'color' => 'green', 'value' => 3 ],
        35 => [ 'color' => 'green', 'value' => 4 ],
        36 => [ 'color' => 'green', 'value' => 5 ],
        37 => [ 'color' => 'green', 'value' => 5 ],
        38 => [ 'color' => 'green', 'value' => 6 ],
        39 => [ 'color' => 'green', 'value' => 7 ],
        40 => [ 'color' => 'green', 'value' => 8 ],
        41 => [ 'color' => 'green', 'value' => 9 ],
        42 => [ 'color' => 'green', 'value' => 10 ],
        43 => [ 'color' => 'green', 'value' => 11 ],
        44 => [ 'color' => 'green', 'value' => 12 ],

        45 => [ 'color' => 'red', 'value' => 3 ],
        46 => [ 'color' => 'red', 'value' => 4 ],
        47 => [ 'color' => 'red', 'value' => 4 ],
        48 => [ 'color' => 'red', 'value' => 5 ],
        49 => [ 'color' => 'red', 'value' => 6 ],
        50 => [ 'color' => 'red', 'value' => 7 ],
        51 => [ 'color' => 'red', 'value' => 8 ],
        52 => [ 'color' => 'red', 'value' => 9 ],
        53 => [ 'color' => 'red', 'value' => 10 ],
        54 => [ 'color' => 'red', 'value' => 11 ],
        55 => [ 'color' => 'red', 'value' => 12 ],
    ];

    private static $Colors = [
        'grey',
        'blue',
        'yellow',
        'green',
        'red',
    ];

    private static function CompareColors($colorA, $colorB)
    {
        // Stronger colour comes first. (e.g. Red comes before Green)
        // This is used for tie-breaking
        return array_search($colorB, Forks::$Colors) - array_search($colorA, Forks::$Colors);
    }

    private function __construct($data)
    {
        $this->data = $data;
    }

    static function fromJson($json)
    {
        return new Forks(json_decode($json));
    }
    
    static function newGame($playerIds, $options)
    {
        $playerCount = count($playerIds);

        // 55 Cards in total
        $deck = range(1, 55);

        // If playing with 2 or 3 players, remove cards with value 10, 11, and 12.
        $removed = [];
        if ($playerCount < 4) {
            $removed = [
                9, 10, 11, // grey
               20, 21, 22, // blue
               31, 32, 33, // yellow
               42, 43, 44, // green
               53, 54, 55, // red
            ];
            $deck = array_values(array_diff($deck, $removed));
        }

        shuffle($deck);

        // Remove cards depending on how many players
        $cardsToRemove = [
            2 => 9,
            3 => 1,
            4 => 4, // Documentation says to remove 5... but removing 4 divides the cards evenly
            5 => 7,
            6 => 1,
        ][$playerCount];
        for ($i = 0; $i < $cardsToRemove; $i++)
            array_push($removed, array_pop($deck));

        // For 2 - 5 players, start with three marketing destination cards; 6 players starts with none.
        $marketing = [];
        if ($playerCount < 6)
        {
            array_push($marketing, array_pop($deck));
            array_push($marketing, array_pop($deck));
            array_push($marketing, array_pop($deck));
        }
        
        return new Forks((object)[
            'version' => 1, // Only need to increment for breaking changes after beta release
            'ed' => 2, // 2nd edition
            'options' => $options,
            'order' => $playerIds,
            'players' =>
                array_combine(
                    $playerIds,
                    array_map(fn($id) => [
                        'hand' => [],
                        'dealt' => [],
                        'passing' => [],
                        'received' => [],
                    ], $playerIds)
                ),
            'deck' => $deck,
            'marketing' => $marketing,
            'marketingHidden' => [],
            'removed' => $removed,
        ]);
    }

    public function getCurrentRound()
    {
        $cardsRemaining = count($this->data->deck);
        $playerCount = count($this->data->order);
        $roundsRemaining =
            $playerCount == 2  // An extra card is dealt to marketing each round in a 2-player game
                ? round($cardsRemaining / (($playerCount * 3) + 1)) // round in case marketing card hasn't been revealed yet
                : $cardsRemaining / ($playerCount * 3);
        return $this->getTotalRounds() - $roundsRemaining;
    }

    public function getTotalRounds()
    {
        $playerCount = count($this->data->order);
        return $playerCount <= 4 ? 4 : 3;
    }

    public function dealCards()
    {
        if (!count($this->data->deck))
            throw new BgaVisibleSystemException("Game over"); // NOI18N
        $dealt = [];
        foreach ($this->data->players as $playerId => &$player)
        {
            $dealt[$playerId] = [];
            array_push($dealt[$playerId], array_pop($this->data->deck));
            array_push($dealt[$playerId], array_pop($this->data->deck));
            array_push($dealt[$playerId], array_pop($this->data->deck));
            $player->dealt = $dealt[$playerId];
        }
        return $dealt;
    }

    public function passCards($playerId, $cardIds)
    {
        // Does the player exist?
        $player = $this->data->players->$playerId;
        if (!$player)
            return false;

        // Are there two cards in the set?
        if (count($cardIds) != 2)
            return false;
    
        // Had the player been dealt these cards?
        if (array_search($cardIds[0], $player->dealt) === false || array_search($cardIds[1], $player->dealt) === false)
        {
            // In merge variant, cards can also come from the player's hand
            $merged = array_merge($player->hand, $player->dealt);
            if ($this->data->options->allowMerge)
            {
                if (array_search($cardIds[0], $merged) === false || array_search($cardIds[1], $merged) === false)
                    return false;
            }
            return false;
        }

        // Keep the card and pass the remaining cards
        $player->passing = $cardIds;
        $player->hand = array_values(array_diff(array_merge($player->hand, $player->dealt), $cardIds));
        $player->dealt = [];
        $this->data->players->$playerId = $player;
        return true;
    }
    
    public function discardCard($playerId, $cardId)
    {
        // Does the player exist?
        $player = $this->data->players->$playerId;
        if (!$player)
            return false;

        // Had the player received this card?
        if (array_search($cardId, $player->received) === false)
        {
            // Merge Variant: Or is the card in the player hand?
            if ($this->data->options->allowMerge)
            {
                if (array_search($cardId, $player->hand) === false)
                    return false;
                // else allow discard to continue
            }
            else
                return false;
        }

        // Keep the card and discard the remaining card
        $player->hand = array_values(array_diff(array_merge($player->hand, $player->received), [ $cardId ]));
        array_push($this->data->marketingHidden, $cardId);
        $player->received = [];
        $this->data->players->$playerId = $player;
        return true;
    }

    public function haveAllPlayersPassed()
    {
        foreach ($this->data->players as $player)
        {
            if (count($player->passing) < 2)
                return false;
        }
        return true;
    }

    public function movePassedCards()
    {
        $receiving = [];
        $order = $this->data->order;
        $playerCount = count($order);
        foreach ($this->data->players as $playerId => $player)
        {
            $nextIndex = (array_search($playerId, $order) + 1) % $playerCount;
            $nextPlayerId = $order[$nextIndex];
            $receiving[$nextPlayerId] = $player->passing;
            $this->data->players->$nextPlayerId->received = $player->passing;
            $this->data->players->$playerId->passing = [];
        }
        return $receiving;
    }

    public function haveAllPlayersDiscarded()
    {
        foreach ($this->data->players as $player)
        {
            if (count($player->received) > 0)
                return false;
        }
        return true;
    }

    public function revealMarketing()
    {
        $revealed = $this->data->marketingHidden;

        // In two-player games, also add the top card from the deck
        $playerCount = count($this->data->order);
        if ($playerCount == 2)
            array_push($revealed, array_pop($this->data->deck));

        foreach ($revealed as $cardId)
            $this->data->marketing[] = $cardId;
        $this->data->marketingHidden = [];
        return $revealed;
    }

    public function isPlayer($playerId)
    {
        return array_key_exists($playerId, $this->data->players);
    }

    public function getGameProgression()
    {
        // We'll use the general logic of
        // Progression = # of cards in hands & marketing / # of all cards in play
        // TODO: can be more granular... like showing an increment after the passing phase
        $cardsInDeck = count($this->data->deck);
        $cardsInHand = array_reduce((array)$this->data->players, fn($sum, $p) => $sum + count($p->hand), 0); 
        $cardsDealt = array_reduce((array)$this->data->players, fn($sum, $p) => $sum + count($p->dealt), 0); 
        $cardsPassing = array_reduce((array)$this->data->players, fn($sum, $p) => $sum + count($p->passing), 0); 
        $cardsReceived = array_reduce((array)$this->data->players, fn($sum, $p) => $sum + count($p->received), 0); 
        $cardsInMarketing = count($this->data->marketing);
        $cardsInMarketingHidden = count($this->data->marketingHidden);
        $totalCardsInPlay = $cardsInDeck + $cardsDealt + $cardsInHand + $cardsPassing + $cardsReceived + $cardsInMarketing + $cardsInMarketingHidden;
        return intval(100 * ($cardsInHand + $cardsInMarketing) / $totalCardsInPlay);
    }

    public function getScores(&$losers)
    {
        //
        // Collect the value sum of cards in each lane
        //
        $laneScores = [];
        foreach ($this->data->marketing as $cardId)
        {
            $cardData = Forks::$Cards[$cardId];
            $color = $cardData['color'];
            $value = $cardData['value'];
            $laneScores[$color] = $value + (array_key_exists($color, $laneScores) ? $laneScores[$color] : 0);
        }

        //
        // Sort based on final lane score and use colour for tie-breaker
        //
        uksort($laneScores, function($colorA, $colorB) use ($laneScores) {
            $delta = $laneScores[$colorB] - $laneScores[$colorA];
            if ($delta != 0) return $delta;
            return Forks::CompareColors($colorA, $colorB);
        });
        $orderedColors = array_keys($laneScores);
        $colorModifier = array_merge(...array_map(fn($color) => [ $color => array_search($color, $orderedColors) <= 2 ? 1 : -1 ], $orderedColors));
        $losers = array_values(array_filter($orderedColors, fn($color) => array_search($color, $orderedColors) > 2));

        //
        // Determine player score based on colour modifiers
        //
        $playerCount = count($this->data->order);
        $playerScores = [];
        foreach ($this->data->players as $playerId => $player)
        {
            $playerScores[$playerId] = array_reduce($player->hand, function($playerScore, $cardId) use ($colorModifier, $playerCount)
            {
                $cardData = Forks::$Cards[$cardId];
                $value = $cardData['value'];
                $color = $cardData['color'];
                $modifier = $colorModifier[$color];
                $playerScore[$color] = $playerScore[$color] + $modifier * $value;
                $playerScore['total'] = $playerScore['total'] + $modifier * $value;

                if ($playerCount <= 3)
                {
                    if ($value <= 4)
                        $playerScore['lows'] = $playerScore['lows'] + $modifier * $value;
                    else if ($value <= 7)
                        $playerScore['mids'] = $playerScore['mids'] + $modifier * $value;
                    else
                        $playerScore['highs'] = $playerScore['highs'] + $modifier * $value;
                }
                else
                {
                    if ($value <= 5)
                        $playerScore['lows'] = $playerScore['lows'] + $modifier * $value;
                    else if ($value <= 9)
                        $playerScore['mids'] = $playerScore['mids'] + $modifier * $value;
                    else
                        $playerScore['highs'] = $playerScore['highs'] + $modifier * $value;
                }

                return $playerScore;
            }, [ "grey" => 0, "blue" => 0, "yellow" => 0, "green" => 0, "red" => 0, "total" => 0, "lows" => 0, "mids" => 0, "highs" => 0 ]);
        }

        return $playerScores;
    }

    // Return only the public data and the data private to the given player 
    public function getPlayerData($playerId)
    {
        $data = json_decode(json_encode($this->data));
        foreach ($this->data->players as $id => $player)
        {
            // Only return array counts instead of the card IDs (private data)
            if ($id != $playerId)
            {
                foreach ($player as $key => $array)
                    $data->players->$id->$key = count($array);
            }
        }

        // Remove private information about the cards in the deck and face-down marketing piles
        $data->deck = count($data->deck);
        $data->marketingHidden = count($data->marketingHidden);

        return $data;
    }

    public function isGameOver()
    {
        if (count($this->data->deck)) return false;
        if (count($this->data->marketingHidden)) return false;

        foreach ($this->data->players as $player)
        {
            if (count($player->dealt)) return false;
            if (count($player->passing)) return false;
            if (count($player->received)) return false;
        }
        return true;
    }

    function toJson()
    {
        return json_encode($this->data);
    }
}
