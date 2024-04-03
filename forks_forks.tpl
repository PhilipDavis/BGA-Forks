{OVERALL_GAME_HEADER}

<!-- 
--------
-- BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
-- Forks implementation : © Copyright 2024, Philip Davis (mrphilipadavis AT gmail)
-- 
-- This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
-- See http://en.boardgamearena.com/#!doc/Studio for more information.
-------
-->

<div id="forks_surface">
    <div id="forks_deck"></div>
    <div id="forks_round-info"></div>
    <div id="forks_tie-breaker"></div>
    <div id="forks_marketing-hidden" class="forks_empty"></div>
    <div id="forks_marketing"></div>
    <div id="forks_my-passed" class="forks_empty"></div>
    <div id="forks_my-hand" class="forks_card-stack forks_horizontal"></div>
    <div id="forks_my-dealt">
        <div id="forks_my-dealt-0" class="forks_slot" data-slot="0"></div>
        <div id="forks_my-dealt-1" class="forks_slot" data-slot="1"></div>
        <div id="forks_my-dealt-2" class="forks_slot" data-slot="2"></div>
    </div>
    <div id="forks_my-received">
        <div id="forks_my-received-0" class="forks_slot" data-slot="0"></div>
        <div id="forks_my-received-1" class="forks_slot" data-slot="1"></div>
    </div>
    <div id="forks_my-receiving" class="forks_empty"></div>
</div>

<script type="text/javascript">

const forks_Templates = {
    playerSummaryCounters:
        '<div id="forks_player-${PID}-scores" class="forks_player-scores">' +
        '</div>',

    playerSummaryCounter:
        '<div class="forks_score-${COLOR}">' +
            '<div class="forks_icon forks_icon-${COLOR}"></div>' +
            '<div class="forks_player-score" id="forks_player-${PID}-score-${COLOR}"></div>' +
        '</div>',

    marketingLane:
        '<div id="forks_marketing-${COLOR}" class="forks_marketing-lane">' +
            '<div id="forks_marketing-score-${COLOR}" class="forks_marketing-score">0</div>' +
            '<div class="forks_placeholder">' +
                '<div class="forks_card-head"></div>' +
                '<div class="forks_card-body"></div>' +
            '</div>' +
        '</div>',

    card:
        '<div id="${DIV_ID}" ' +
            'class="forks_card forks_color-${COLOR} ${DOWN}" ' +
            'data-color="${COLOR}" ' +
            'data-value="${VAL}" ' +
            'data-id="${CARD_ID}" ' +
        '>' +
            '<div class="forks_card-front">' +
                '<div class="forks_card-head"></div>' +
                '<div class="forks_card-body"></div>' +
            '</div>' +
            '<div class="forks_card-back"></div>' +
        '</div>',
};

</script>  

{OVERALL_GAME_FOOTER}
