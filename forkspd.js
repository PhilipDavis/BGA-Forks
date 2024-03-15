/**
 *------
 * BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
 * ForksPD implementation : © Copyright 2024, Philip Davis (mrphilipadavis AT gmail)
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 */

define([
    "dojo","dojo/_base/declare",
    "ebg/core/gamegui",
    "ebg/counter",
],
function (dojo, declare) {
    const BgaGameId = `forkspd`;
    const BasePath = `${BgaGameId}/${BgaGameId}`;

    const Cards = [
        {}, // blank entry to adjust for 1-based indexes of cards
        { color: 'grey', value: 3 },
        { color: 'grey', value: 4 },
        { color: 'grey', value: 5 },
        { color: 'grey', value: 6 },
        { color: 'grey', value: 7 },
        { color: 'grey', value: 8 },
        { color: 'grey', value: 8 },
        { color: 'grey', value: 9 },
        { color: 'grey', value: 10 },
        { color: 'grey', value: 11 },
        { color: 'grey', value: 12 }, // #11

        { color: 'blue', value: 3 },
        { color: 'blue', value: 4 },
        { color: 'blue', value: 5 },
        { color: 'blue', value: 6 },
        { color: 'blue', value: 7 },
        { color: 'blue', value: 7 },
        { color: 'blue', value: 8 },
        { color: 'blue', value: 9 },
        { color: 'blue', value: 10 },
        { color: 'blue', value: 11 },
        { color: 'blue', value: 12 }, // #22

        { color: 'yellow', value: 3 },
        { color: 'yellow', value: 4 },
        { color: 'yellow', value: 5 },
        { color: 'yellow', value: 6 },
        { color: 'yellow', value: 6 },
        { color: 'yellow', value: 7 },
        { color: 'yellow', value: 8 },
        { color: 'yellow', value: 9 },
        { color: 'yellow', value: 10 },
        { color: 'yellow', value: 11 },
        { color: 'yellow', value: 12 }, // #33

        { color: 'green', value: 3 },
        { color: 'green', value: 4 },
        { color: 'green', value: 5 },
        { color: 'green', value: 5 },
        { color: 'green', value: 6 },
        { color: 'green', value: 7 },
        { color: 'green', value: 8 },
        { color: 'green', value: 9 },
        { color: 'green', value: 10 },
        { color: 'green', value: 11 },
        { color: 'green', value: 12 }, // #44

        { color: 'red', value: 3 },
        { color: 'red', value: 4 },
        { color: 'red', value: 4 },
        { color: 'red', value: 5 },
        { color: 'red', value: 6 },
        { color: 'red', value: 7 },
        { color: 'red', value: 8 },
        { color: 'red', value: 9 },
        { color: 'red', value: 10 },
        { color: 'red', value: 11 },
        { color: 'red', value: 12 }, // #55
    ];

    const Preference = {
        ShowColumnSums: 300,
    };

    // How many milliseconds a card-flipping animation should take
    const FlipDuration = 500;

    return declare(`bgagame.${BgaGameId}`, ebg.core.gamegui, {
        constructor() {
            console.log(`${BgaGameId} constructor`);
            this.clientStartArgs = {
                // Which cards have been selected by the player.
                // This is a map of playerId => timestamp
                selected: {},
            };

            this.scoreCounter = {};

            // An incrementing number that we'll use to ensure a
            // unique name when we create animations dynamically.
            this.uniqueSeq = 0;

            Object.defineProperties(this, {
                currentState: {
                    get() {
                        return this.gamedatas.gamestate.name;
                    },
                },
                amIActive: {
                    get() {
                        return this.gamedatas.gamestate.multiactive.some(id => id == this.myPlayerId);
                    },
                },
            });
        },
        
        async setup(gamedata) {
            console.log('Starting game setup', gamedata);

            this.initPreferencesObserver();

            const { forks } = gamedata;
            this.forks = forks;

            if (this.forks.options.allowMerge) {
                document.getElementById('forks_surface').classList.add('forks_merge-variant');
            }

            const playerCount = forks.order.length;
            this.nextPlayerId = forks.order[(forks.order.indexOf(this.player_id) + 1) % playerCount];
            this.myPlayerId = this.player_id;
            this.previousPlayerId = forks.order[(forks.order.indexOf(this.player_id) + playerCount - 1) % playerCount];

            for (const playerId of Object.keys(forks.players))
            {
                this.scoreCounter[playerId] = new ebg.counter();
                this.scoreCounter[playerId].create(`player_score_${playerId}`);
                this.scoreCounter[playerId].setValue(0);
            }

            this.createMarketingLane('grey');
            this.createMarketingLane('blue');
            this.createMarketingLane('yellow');
            this.createMarketingLane('green');
            this.createMarketingLane('red');

            if (!forks.deck) {
                document.getElementById('forks_deck').classList.add('forks_empty');
            }

            this.setRoundInformation(parseInt(gamedata.round, 10), parseInt(gamedata.total, 10));

            if (forks.marketingHidden) {
                document.getElementById('forks_marketing-hidden').classList.remove('forks_empty');
            }

            const tieBreakDiv = document.getElementById('forks_tie-breaker');
            tieBreakDiv.addEventListener('click', () => this.onClickTieBreaker());
            tieBreakDiv.addEventListener('mouseout', () => tieBreakDiv.classList.remove('forks_touching'));

            if (gamedata.intro) {
                const player = forks.players[this.myPlayerId];
                // Note: for 6-players, there are no cards dealt here.
                await Promise.all(
                    forks.marketing.map(async (cardId, i) => {
                        await this.delayAsync(i * 400);
                        await this.animateDealMarketingCardAsync(cardId, !forks.deck);
                    }),
                );
                await this.delayAsync(200);
                await Promise.all(
                    player.dealt.map(async (cardId, i) => {
                        await this.delayAsync(i * 400);
                        await this.animateDealCardAsync(cardId, i, false);
                    }),
                );
            }
            else {
                // Setting up player boards -- we only set up one player board: for the owning player
                for (const [ playerId, player ] of Object.entries(forks.players))
                {
                    if (playerId == this.myPlayerId) {
                        const myHandDiv = document.getElementById('forks_my-hand');

                        // In Merge Variant, combine player.received with player.hand
                        const cardsInHand =
                            forks.options.allowMerge
                                ? [ ...player.hand, ...player.received ]
                                : player.hand;

                        for (const cardId of cardsInHand.sort((a, b) => a - b)) {
                            const cardDiv =
                                this.forks.options.allowMerge
                                    ? this.createClickableCard(cardId, myHandDiv)
                                    : this.createCard(cardId, true, myHandDiv);
                            cardDiv.style.zIndex = cardId;
                        }
                        for (let i = 0; i < player.dealt.length; i++) {
                            const cardId = player.dealt[i];
                            this.createClickableCard(cardId, `forks_my-dealt-${i}`);
                        }
                        if (!forks.options.allowMerge) {
                            for (let i = 0; i < player.received.length; i++) {
                                const cardId = player.received[i];
                                this.createClickableCard(cardId, `forks_my-received-${i}`);
                            }
                        }
                        if (player.passing.length) {
                            document.getElementById('forks_my-passed').classList.remove('forks_empty');
                        }
                    }

                    if (playerId == this.previousPlayerId && player.passing > 0) {
                        document.getElementById('forks_my-receiving').classList.remove('forks_empty');
                    }
                }

                for (const cardId of forks.marketing) {
                    this.createCard(cardId, true, `forks_marketing-${Cards[cardId].color}`);
                    this.adjustMarketingScore(cardId);
                }
            }

            this.setupNotifications();
        },

        initPreferencesObserver() {      
            dojo.query('.preference_control').on('change', e => {
                const match = e.target.id.match(/^preference_[cf]ontrol_(\d+)$/);
                if (!match) {
                    return;
                }
                const prefId = match[1];
                const { value } = e.target;
                this.prefs[prefId].value = parseInt(value, 10);
                this.onPreferenceChange(this.prefs[prefId]);
            });
        },
        
        onPreferenceChange(pref) {
            // Apply the CSS of the chosen preference value
            // (Unless it's a default pref, which appears to be
            // delivered as an array and without CSS class names)
            if (typeof pref.values === 'object' && typeof pref.values.length === 'number') return;
            const html = document.getElementsByTagName('html')[0];
            for (const [ value, settings ] of Object.entries(pref.values)) {
                if (typeof settings.cssPref !== 'string') continue;
                if (value == pref.value) {
                    html.classList.add(settings.cssPref);
                }
                else {
                    html.classList.remove(settings.cssPref);
                }
            }
        },


        ///////////////////////////////////////////////////
        //// Game & client states

        onEnteringState(stateName, args) {
            console.log(`Entering state: ${stateName}`, args);

            document.getElementById('forks_surface').classList.add(`forks_state-${stateName}`);
            
            switch (stateName) {
            }
        },

        onLeavingState(stateName) {
            console.log(`Leaving state: ${stateName}`);
            
            document.getElementById('forks_surface').classList.remove(`forks_state-${stateName}`);

            switch (stateName) {
            }
        }, 

        onUpdateActionButtons(stateName, args) {
            console.log(`onUpdateActionButtons: ${stateName}`, args);
            
            if (!this.isCurrentPlayerActive()) return;

            switch (stateName) {
                case 'client_confirmPass':
                    this.addActionButton('forks_confirm-pass-button', _('Confirm'), this.onClickConfirmPass.bind(this));
                    if (Object.keys(this.clientStartArgs.selected).length !== 2) {
                        document.getElementById('forks_confirm-pass-button').classList.add('disabled');
                    }
                    break;

                case 'client_confirmDiscard':
                    this.addActionButton('forks_confirm-discard-button', _('Confirm'), this.onClickConfirmDiscard.bind(this)); 
                    if (Object.keys(this.clientStartArgs.selected).length !== 1) {
                        document.getElementById('forks_confirm-discard-button').classList.add('disabled');
                    }
                    break;
            }
        },        


        ///////////////////////////////////////////////////
        //// Utility methods

        invokeServerActionAsync(actionName, args) {
            return new Promise((resolve, reject) => {
                try {
                    if (!this.checkAction(actionName)) {
                        console.error(`Action '${actionName}' not allowed in ${this.currentState}`, args);
                        return reject('Invalid');
                    }
                    if (!this.amIActive) {
                        console.error(`Action '${actionName}' not allowed for inactive player`, args);
                        return reject('Invalid');
                    }
                    this.ajaxcall(`${BasePath}/${actionName}.html`, { lock: true, ...args }, () => {}, result => {
                        result?.valid ? resolve() : reject(`${actionName} failed`);
                    });
                }
                catch (err) {
                    reject(err);
                }
            });
        },

        reflow(element = document.documentElement) {
            void(element.offsetHeight);
        },

        getUniqueNumber() {
            return this.uniqueSeq++;
        },

        setRoundInformation(currentRound, totalRounds) {
            const roundsLeft = totalRounds - currentRound;
            const template =
                roundsLeft <= 0
                    ? _('Last round!')
                    : roundsLeft === 1
                        ? _('One more round!')
                        : _('{n} more rounds');
            const message = template.replace(/\{n\}/ig, roundsLeft);
            document.getElementById('forks_round-info').innerText = message;
        },

        createMarketingLane(color) {
            dojo.place(this.format_block('forks_Templates.marketingLane', {
                COLOR: color,
            }), 'forks_marketing');
        },

        createCardPlaceholder(parentDivOrId) {
            const parentDiv = typeof parentDivOrId === 'string' ? document.getElementById(parentDivOrId) : parentDivOrId;
            const placeholderDiv = document.createElement('div');
            placeholderDiv.classList.add('forks_card');
            parentDiv.appendChild(placeholderDiv);
            return placeholderDiv
        },

        createCard(cardId, faceUp, parentDivId = 'forks_surface') {
            const divId = `forks_card-${cardId}`;
            const cardData = Cards[cardId];
            if (faceUp && !cardData) {
                throw new Error('Invalid card');
            }
            dojo.place(this.format_block('forks_Templates.card', {
                DIV_ID: divId,
                CARD_ID: cardId,
                DOWN: faceUp ? '' : 'forks_card-face-down',
                COLOR: faceUp ? cardData.color : '',
                VAL: faceUp ? cardData.value : '',
            }), parentDivId);
            return document.getElementById(divId);
        },

        createMyHandPlaceholder(cardId) {
            const placeholderDiv = document.createElement('div');
            placeholderDiv.style.zIndex = cardId;
            placeholderDiv.classList.add('forks_card');
            placeholderDiv.classList.add(`forks_color-${Cards[cardId].color}`);
            const myHandDiv = document.getElementById('forks_my-hand');
            for (const cardDiv of myHandDiv.children) {
                if (cardId < Number(cardDiv.dataset.id)) {
                    myHandDiv.insertBefore(placeholderDiv, cardDiv);
                    return placeholderDiv;
                }
            }
            myHandDiv.appendChild(placeholderDiv);
            return placeholderDiv;
        },

        createClickableCard(cardId, parentDivId) {
            const cardDiv = this.createCard(cardId, true, parentDivId);
            cardDiv.addEventListener('click', e => this.onClickCard(cardDiv, cardId));
            return cardDiv;
        },

        delayAsync(duration) {
            return new Promise(resolve => setTimeout(resolve, duration));
        },

        async performCardAnimationAsync(cardDiv, destDiv, fnKeyframes, options = {}) {
            const srcRect = cardDiv.getBoundingClientRect();
            const srcMidX = Math.round(srcRect.x + srcRect.width / 2);
            const srcMidY = Math.round(srcRect.y + srcRect.height / 2);

            const destRect = destDiv.getBoundingClientRect();
            const destMidX = Math.round(destRect.x + destRect.width / 2);
            const destMidY = Math.round(destRect.y + destRect.height / 2);

            //
            // Calculate the duration of the slide based on the distance.
            // TODO: could take a Game Preference multiplier to speed up / slow down
            //
            const deltaX = destMidX - srcMidX;
            const deltaY = destMidY - srcMidY;
            const pxDistance = Math.round(Math.sqrt(deltaX * deltaX + deltaY * deltaY));
            const desiredVelocity = 300 / 1; // 300 pixels per second (300px ~= 3 inches at 96 PPI)
            let msDuration = Math.round(pxDistance / desiredVelocity * 1000 / (options.speedMultiplier || 1));
            let flipPercent = 0;
            if (options.cardFlip) {
                // Add extra time for a card flip (assuming card flips in
                // place rather than at the same time as it is sliding).
                msDuration += FlipDuration;

                // Calculate the percentage of time that the card is flipping
                // so the keyframe percentages can be accurate.
                flipPercent = Math.round(100 * FlipDuration / msDuration);
            }

            const keyframes = fnKeyframes(deltaX, deltaY, flipPercent);

            //
            // Create the animation keyframes and CSS rule
            //
            const uniqueNumber = this.getUniqueNumber();
            const style = document.createElement('style');
            style.id = `forks_style-${uniqueNumber}`;
            style.innerHTML =
                `.forks_animated-${uniqueNumber} {` +
                    `animation: ${msDuration}ms forks_animation-${uniqueNumber};` +
                    `animation-fill-mode: forwards;` +
                    `z-index: 100;` +
                `}` +
                `@keyframes forks_animation-${uniqueNumber} {` +
                    Object.entries(keyframes).reduce((result, [ percent, css ]) => {
                        return result + `${percent}% { ${css}; }`;
                    }, '') +
                `}`;
            document.head.appendChild(style);

            const _this = this;
            await new Promise(resolve => {
                // Set a timeout to cleanup just in case something bad happens
                // and the animation doesn't end/cancel for whatever reason.
                const timeout = setTimeout(done, msDuration + 500);
                function done() {
                    destDiv.classList.remove('forks_empty');
                    cardDiv.classList.remove(`forks_animated-${uniqueNumber}`);

                    if (options.deleteAfter) {
                        cardDiv.style.visibility = 'hidden';
                        cardDiv.style.opacity = 0;
                        cardDiv.classList.remove(`forks_animated-${uniqueNumber}`);
                        cardDiv.parentElement?.removeChild(cardDiv);
                    }
                    else if (options.replaceAfter) {
                        cardDiv.style.visibility = 'hidden';
                        cardDiv.style.opacity = 0;
                        cardDiv.classList.remove(`forks_animated-${uniqueNumber}`);
                        destDiv.replaceWith(cardDiv);
                        _this.resetPosition(cardDiv);
                        cardDiv.style.visibility = '';
                    }
                    else {
                        cardDiv.style.visibility = 'hidden';
                        cardDiv.classList.remove(`forks_animated-${uniqueNumber}`);
                        _this.placeInElement(cardDiv, destDiv);
                        cardDiv.style.visibility = '';
                    }
                    clearTimeout(timeout);
                    cardDiv.removeEventListener('animationend', done);
                    cardDiv.removeEventListener('animationcancel', done);
                    try {
                        document.head.removeChild(style);
                    }
                    catch (err) {}
                    _this.reflow(); // KILL/KEEP? (didn't seem to fix the jump-back animation issue)
                    resolve();
                }
                cardDiv.addEventListener('animationend', done.bind(this), { once: true });
                cardDiv.addEventListener('animationcancel', done.bind(this), { once: true });
                cardDiv.classList.add(`forks_animated-${uniqueNumber}`);
                this.reflow(); // KILL/KEEP?
            });
        },

        //
        // Some animations we need to do backwards -- like sliding a card
        // between some other cards... for this, we need the z-indexes to
        // be stacked correctly and the card sliding in needs to be child
        // to the parent destination already.  I'm calling this a reverse
        // slide.
        //
        async performCardReverseAnimationAsync(cardDiv, destDiv, fnKeyframes, options = {}) {
            const srcRect = cardDiv.getBoundingClientRect();
            const srcMidX = Math.round(srcRect.x + srcRect.width / 2);
            const srcMidY = Math.round(srcRect.y + srcRect.height / 2);

            const destRect = destDiv.getBoundingClientRect();
            const destMidX = Math.round(destRect.x + destRect.width / 2);
            const destMidY = Math.round(destRect.y + destRect.height / 2);

            //
            // Calculate the duration of the slide based on the distance.
            // TODO: could take a Game Preference multiplier to speed up / slow down
            //
            const deltaX = destMidX - srcMidX;
            const deltaY = destMidY - srcMidY;
            const pxDistance = Math.round(Math.sqrt(deltaX * deltaX + deltaY * deltaY));
            const desiredVelocity = 300 / 1; // 300 pixels per second (300px ~= 3 inches at 96 PPI)
            let msDuration = Math.round(pxDistance / desiredVelocity * 1000);
            let flipPercent = 0;
            if (options.cardFlip) {
                // Add extra time for a card flip (assuming card flips in
                // place rather than at the same time as it is sliding).
                msDuration += FlipDuration;

                // Calculate the percentage of time that the card is flipping
                // so the keyframe percentages can be accurate.
                flipPercent = Math.round(100 * FlipDuration / msDuration);
            }

            const keyframes = fnKeyframes(deltaX, deltaY, flipPercent);

            //
            // Create the animation keyframes and CSS rule
            //
            const uniqueNumber = this.getUniqueNumber();
            const style = document.createElement('style');
            style.id = `forks_style-${uniqueNumber}`;
            style.innerHTML =
                `.forks_animated-${uniqueNumber} {` +
                    `animation: ${msDuration}ms forks_animation-${uniqueNumber};` +
                    `animation-fill-mode: forwards;` +
                `}` +
                `@keyframes forks_animation-${uniqueNumber} {` +
                    Object.entries(keyframes).reduce((result, [ percent, css ]) => {
                        return result + `${percent}% { ${css}; }`;
                    }, '') +
                `}`;
            document.head.appendChild(style);

            cardDiv.style.opacity = 0;
            this.placeInElement(cardDiv, destDiv);
            cardDiv.style = keyframes['0'];
            this.reflow();

            const _this = this;
            await new Promise(resolve => {
                // Set a timeout to cleanup just in case something bad happens
                // and the animation doesn't end/cancel for whatever reason.
                const timeout = setTimeout(done, msDuration + 500);
                function done() {
                    clearTimeout(timeout);
                    cardDiv.removeEventListener('animationend', done);
                    cardDiv.removeEventListener('animationcancel', done);
                    if (options.replaceAfter) {
                        cardDiv.style.visibility = 'hidden';
                        destDiv.replaceWith(cardDiv);
                    }
                    else {
                        cardDiv.classList.remove(`forks_animated-${uniqueNumber}`);
                    }
                    _this.resetPosition(cardDiv);
                    _this.reflow(); // KILL?
                    try {
                        document.head.removeChild(style);
                    }
                    catch (err) {}
                    resolve();
                }
                cardDiv.addEventListener('animationend', done.bind(this), { once: true });
                cardDiv.addEventListener('animationcancel', done.bind(this), { once: true });
                cardDiv.classList.add(`forks_animated-${uniqueNumber}`);
            });
        },

        async animateDealMarketingCardAsync(cardId, isLastCardInDeck) {
            const cardData = Cards[cardId];
            const laneDivId = `forks_marketing-${cardData.color}`;
            const placeholderDiv = this.createCardPlaceholder(laneDivId);
            const cardDiv = this.createCard(cardId, true, 'forks_deck');

            if (isLastCardInDeck) {
                document.getElementById('forks_deck').classList.add('forks_empty');
            }

            await this.performCardAnimationAsync(cardDiv, placeholderDiv, (deltaX, deltaY, flipPercent) => {
                return {
                    '0': `transform: translate(0, 0) rotateY(-180deg) rotateZ(0deg);`,
                    [flipPercent]:
                        `transform: translate(0, 0) rotateY(0deg) rotateZ(0deg);`,
                    [flipPercent + 5]: // angle the card towards the destination
                        `transform: translate(0, 0) rotateY(0deg) rotateZ(-10deg);`,
                    '100': `transform: translate(${deltaX}px, ${deltaY}px) rotateY(0deg) rotateZ(0);`,
                };
            }, { cardFlip: true, replaceAfter: true });

            this.adjustMarketingScore(cardId);
        },
        
        async animateDealCardAsync(cardId, slotIndex, isLastCard) {
            //
            // Create a card on the deck (we'll start it face down with the animation)
            //
            const cardDiv = this.createClickableCard(cardId, 'forks_deck');
            if (isLastCard) {
                document.getElementById('forks_deck').classList.add('forks_empty');
            }

            const destDiv = document.getElementById(`forks_my-dealt-${slotIndex}`);

            await this.performCardAnimationAsync(cardDiv, destDiv, (deltaX, deltaY, flipPercent) => {
                const finalRotation = slotIndex === 0 ? -10 : slotIndex === 1 ? 0 : 10;
                return {
                    '0': `transform: translate(0, 0) rotateY(-180deg) rotateZ(-720deg);` +
                        `z-index: ${100 + slotIndex};`,
                    [100 - flipPercent]:
                        `transform: translate(${deltaX}px, ${deltaY}px) rotateY(-180deg) rotateZ(${-finalRotation}deg) scale(1.5);` +
                        `z-index: ${100 + slotIndex};`,
                    '100': `transform: translate(${deltaX}px, ${deltaY}px) rotateY(-360deg) rotateZ(${finalRotation}deg) scale(1.5);` +
                        `z-index: ${100 + slotIndex};`,
                };
            }, { cardFlip: true });
        },

        // KILL/KEEP? Quite often I see the second pass card snap back into the
        // original position in the my-dealt area... I've spent a lot of time on
        // this and haven't figured it out yet. Leaving this in here for now...
        // but using the older animation algorithm because it works better.
        async animatePassCardAsync_new_not_working_100_percent(cardId) {
            const cardDiv = document.getElementById(`forks_card-${cardId}`);
            const slotDiv = cardDiv.parentElement;
            const slotIndex = Number(slotDiv.dataset.slot);

            const destDiv = document.getElementById('forks_my-passed');

            await this.performCardAnimationAsync(cardDiv, destDiv, (deltaX, deltaY, flipPercent) => {
                // final rotation needs to compensate for the orignal rotation of the dealt slot
                const finalRotation = slotIndex === 0 ? 2 : slotIndex === 1 ? 0 : -2; 
                // TODO: also calculate intermediate rotation based on slope of the motion vector
                return {
                    '0':
                        `border: dashed 0.2em rgba(226,0,0,.67);` +
                        `transform: translate(0, 0) rotateZ(0);` +
                        `z-index: ${100 + slotIndex};`,
                    '10':
                        `border: dashed 0.2em rgba(226,0,0,0);` +
                        `transform: translate(0, 0) rotateZ(40deg);` +
                        `z-index: ${100 + slotIndex};`,
                    [100 - flipPercent]:
                        `border: dashed 0.2em rgba(226,0,0,0);` +
                        `transform: translate(${deltaX}px, ${deltaY}px) rotateZ(${finalRotation}deg) rotateY(0deg) scale(0.667);` +
                        `z-index: ${100 + slotIndex};`,
                    '100':
                        `border: dashed 0.2em rgba(226,0,0,0);` +
                        `transform: translate(${deltaX}px, ${deltaY}px) rotateZ(-${finalRotation}deg) rotateY(-180deg) scale(0.667);` +
                        `z-index: ${100 + slotIndex};`,
                };
            }, { cardFlip: true, deleteAfter: true });
        },

        // KILL/KEEP? But this animation works better than the one above... so using this for now
        async animatePassCardAsync(cardId) {
            const cardDiv = document.getElementById(`forks_card-${cardId}`);
            const slotDiv = cardDiv.parentElement;
            const slotIndex = Number(slotDiv.dataset.slot);

            //
            // Determine where the card currently is
            //
            const srcRect = cardDiv.getBoundingClientRect();
            const srcMidX = Math.round(srcRect.x + srcRect.width / 2);
            const srcMidY = Math.round(srcRect.y + srcRect.height / 2);

            //
            // Determine where the card is going to end up
            //
            const destDiv = document.getElementById('forks_my-passed');
            this.placeInElement(cardDiv, destDiv);
            const destRect = destDiv.getBoundingClientRect();
            const destMidX = Math.round(destRect.x + destRect.width / 2);
            const destMidY = Math.round(destRect.y + destRect.height / 2);

            //
            // Calculate the duration of the slide based on the distance.
            // TODO: could take a Game Preference multiplier to speed up / slow down
            //
            const deltaX = destMidX - srcMidX;
            const deltaY = destMidY - srcMidY;
            const pxDistance = Math.round(Math.sqrt(deltaX * deltaX + deltaY * deltaY));
            const desiredVelocity = 300 / 1; // 300 pixels per second (300px ~= 3 inches at 96 PPI)
            const msDuration = Math.round(pxDistance / desiredVelocity * 1000);

            const startingRotation = slotIndex === 0 ? '-10deg' : slotIndex === 1 ? '0deg' : '10deg'; 
            // TODO: also calculate intermediate rotation based on slope of the motion vector

            //
            // Create the animation keyframes and CSS rule
            //
            const style = document.createElement('style');
            style.id = `forks_css-keep-${cardId}`;
            document.head.appendChild(style);
            style.innerHTML =
                `#forks_card-${cardId}.forks_animated {` +
                    `animation: ${msDuration}ms forks_keep-anim-card-${cardId};` +
                    `z-index: ${100 + slotIndex};` +
                `}` +
                `@keyframes forks_keep-anim-card-${cardId} {` +
                    // TODO: should probably flip the src and dest to keep the
                    // zindex ordering of the cards in the player dealt area
                    `0% {` +
                        `transform: translate(${-deltaX}px, ${-deltaY}px) rotateZ(${startingRotation}) scale(1.5);` +
                    `}` +
                    `10% {` +
                        `border: dashed 0.2em rgba(226,0,0,0);` +
                        `transform: translate(${-deltaX}px, ${-deltaY}px) rotateZ(40deg) scale(1.5);` +
                    `}` +
                    `80% {` +
                        `border: dashed 0.2em rgba(226,0,0,0);` +
                        `transform: translate(0, 0) rotateZ(0) rotateY(0deg);` +
                    `}` +
                    `100% {` +
                        `border: dashed 0.2em rgba(226,0,0,0);` +
                        `transform: translate(0, 0) rotateZ(0) rotateY(-180deg);` +
                    `}` +
                `}`;

            return new Promise(resolve => {
                const timeout = setTimeout(done, msDuration + 500);
                function done() {
                    clearTimeout(timeout);
                    cardDiv.removeEventListener('animationend', done);
                    cardDiv.removeEventListener('animationcancel', done);
                    document.getElementById('forks_my-passed').classList.remove('forks_empty');
                    cardDiv.parentElement.removeChild(cardDiv);
                    try {
                        document.head.removeChild(style);
                    }
                    catch (err) {}
                    resolve();
                }
                cardDiv.addEventListener('animationend', done, { once: true });
                cardDiv.addEventListener('animationcancel', done, { once: true });
                cardDiv.classList.add('forks_animated');
            });
        },

        async animateDealtCardToHandAsync(cardId) {
            const cardDiv = document.getElementById(`forks_card-${cardId}`);
            const slotDiv = cardDiv.parentElement;
            const slotIndex = Number(slotDiv.dataset.slot);

            const placeholderDiv = this.createMyHandPlaceholder(cardId);

            await this.performCardReverseAnimationAsync(cardDiv, placeholderDiv, (deltaX, deltaY) => {
                const startingRotation = slotIndex === 0 ? -2 : slotIndex === 1 ? 0 : 2;
                // TODO: also calculate intermediate rotation based on slope of the motion vector
                return {
                    '0': `transform: translate(${-deltaX}px, ${-deltaY}px) scale(1.5) rotateZ(${startingRotation}deg);` +
                        `z-index: ${cardId};`,
                    '100': `transform: translate(0, 0) scale(1) rotateZ(0);` +
                        `z-index: ${cardId};`,
                };
            }, { replaceAfter: true });

            cardDiv.style.zIndex = cardId;
        },

        async animateCardFromReceivingAsync(cardId, slotIndex) {
            const cardDiv = this.createClickableCard(cardId, 'forks_my-receiving');
            if (slotIndex === 1) {
                document.getElementById('forks_my-receiving').classList.add('forks_empty');
            }
            const destDiv = document.getElementById(`forks_my-received-${slotIndex}`);

            await this.performCardAnimationAsync(cardDiv, destDiv, (deltaX, deltaY, flipPercent) => {
                const finalRotation = slotIndex === 0 ? -5 : 5; 
                // TODO: calculate intermediate rotation based on slope of the motion vector
                return {
                    '0':
                        `transform: translate(0, 0) rotateY(-180deg) rotateZ(0);`,
                    '5':
                        `transform: translate(0, 0) rotateY(-180deg) rotateZ(-40deg);`,
                    [100 - flipPercent]:
                        `transform: translate(${deltaX}px, ${deltaY}px) rotateY(-180deg) rotateZ(${-finalRotation}deg) scale(1.5);`,
                    '100':
                        `transform: translate(${deltaX}px, ${deltaY}px) rotateY(0deg) rotateZ(${finalRotation}deg) scale(1.5);`,
                };
            }, { cardFlip: true });
        },

        async animateReceivedCardToHandAsync(cardId) {
            const cardDiv = document.getElementById(`forks_card-${cardId}`);
            const slotDiv = cardDiv.parentElement;
            const slotIndex = Number(slotDiv.dataset.slot);

            const placeholderDiv = this.createMyHandPlaceholder(cardId);

            await this.performCardReverseAnimationAsync(cardDiv, placeholderDiv, (deltaX, deltaY) => {
                const startingRotation = slotIndex === 0 ? '-5deg' : '5deg'; 
                // TODO: also calculate intermediate rotation based on slope of the motion vector
                // TODO: fix this animation so we're sliding the placeholder (or clone) from the received set -- 
                //       because we want the z-index to make the card appear to slide in place
                return {
                    '0': `transform: translate(${-deltaX}px, ${-deltaY}px) rotateZ(${startingRotation}) scale(1.5);` +
                        `z-index: ${cardId};`,
                    '100': `transform: translate(0, 0) rotateZ(0) scale(1);` +
                        `z-index: ${cardId};`,
                };
            }, { replaceAfter: true });

            cardDiv.style.zIndex = cardId;

            if (!this.forks.options.allowMerge) {
                cardDiv.addEventListener('click', e => this.onClickCard(cardDiv, cardId));
            }
        },

        async animateDiscardCardAsync(cardId) {
            const cardDiv = document.getElementById(`forks_card-${cardId}`);
            const isFirstSlot = Number(cardDiv.parentElement.dataset.slot) === 0;

            const destDiv = document.getElementById('forks_marketing-hidden');

            await this.performCardAnimationAsync(cardDiv, destDiv, (deltaX, deltaY, flipPercent) => {
                const finalRotation = isFirstSlot ? 2 : -2;
                return {
                    '0':
                        `border: dashed 0.2em rgba(226,0,0,.67);` +
                        `transform: translate(0, 0) rotateY(0deg) rotateZ(0);`,
                    '10':
                        `border: dashed 0.2em rgba(226,0,0,0);` +
                        `transform: translate(0, 0) rotateY(0deg) rotateZ(-40deg);`,
                    [100 - flipPercent]:
                        `border: dashed 0.2em rgba(226,0,0,0);` +
                        `transform: translate(${deltaX}px, ${deltaY}px) rotateY(0deg) rotateZ(${finalRotation}deg) scale(0.667);`,
                    '100':
                        `border: dashed 0.2em rgba(226,0,0,0);` +
                        `transform: translate(${deltaX}px, ${deltaY}px) rotateY(-180deg) rotateZ(${-finalRotation}deg) scale(0.667);`,
                };
            }, { cardFlip: true, deleteAfter: true });
        },

        // This is for the Merge Variant
        async animateDiscardCardFromHandAsync(cardId) {
            const cardDiv = document.getElementById(`forks_card-${cardId}`);
            const destDiv = document.getElementById('forks_marketing-hidden');
            
            await this.performCardAnimationAsync(cardDiv, destDiv, (deltaX, deltaY, flipPercent) => {
                // Choose the angle based on the vector to the discard pile
                const intermediateRotation = deltaY ? -Math.atan(deltaX / deltaY) / Math.PI * 180 : 0;
                return {
                    '0':
                        `border: dashed 0.2em rgba(226,0,0,.67);` +
                        `transform: translate(0, 0) rotateY(0deg) rotateZ(0);`,
                    '10':
                        `border: dashed 0.2em rgba(226,0,0,0);` +
                        `transform: translate(0, 0) rotateY(0deg) rotateZ(${intermediateRotation}deg);`,
                    [100 - flipPercent]:
                        `border: dashed 0.2em rgba(226,0,0,0);` +
                        `transform: translate(${deltaX}px, ${deltaY}px) rotateY(0deg) rotateZ(0deg);`,
                    '100':
                        `border: dashed 0.2em rgba(226,0,0,0);` +
                        `transform: translate(${deltaX}px, ${deltaY}px) rotateY(-180deg) rotateZ(0deg);`,
                };
            }, { cardFlip: true, deleteAfter: true });
        },

        async animateRevealMarketingCard(cardId, isLastCard) {
            const cardData = Cards[cardId];
            const laneDivId = `forks_marketing-${cardData.color}`;
            const cardDiv = this.createCard(cardId, true, laneDivId);
            if (isLastCard) {
                document.getElementById('forks_marketing-hidden').classList.add('forks_empty');
            }

            //
            // Determine where the card currently is in the
            // marketing lane. (this will be our destination)
            //
            const destRect = cardDiv.getBoundingClientRect();
            const destMidX = Math.round(destRect.x + destRect.width / 2);
            const destMidY = Math.round(destRect.y + destRect.height / 2);

            //
            // Determine where the hidden marketing pile is
            //
            const srcDiv = document.getElementById('forks_marketing-hidden');
            const srcRect = srcDiv.getBoundingClientRect();
            const srcMidX = Math.round(srcRect.x + srcRect.width / 2);
            const srcMidY = Math.round(srcRect.y + srcRect.height / 2);


            //
            // Calculate the duration of the slide based on the distance.
            // TODO: could take a Game Preference multiplier to speed up / slow down
            //
            const deltaX = destMidX - srcMidX;
            const deltaY = destMidY - srcMidY;
            const pxDistance = Math.round(Math.sqrt(deltaX * deltaX + deltaY * deltaY));
            const desiredVelocity = 300 / 1; // 300 pixels per second (300px ~= 3 inches at 96 PPI)
            const msDuration = Math.round(pxDistance / desiredVelocity * 1000);

            //
            // Create the animation keyframes and CSS rule
            //
            const style = document.createElement('style');
            style.id = `forks_css-reveal-${cardId}`;
            document.head.appendChild(style);
            style.innerHTML =
                `#forks_card-${cardId}.forks_animated {` +
                    `animation: ${msDuration}ms forks_reveal-anim-card-${cardId};` +
                `}` +
                `@keyframes forks_reveal-anim-card-${cardId} {` +
                    `0% {` +
                        // Face down in the hidden marketing pile
                        `transform: translate(${-deltaX}px, ${-deltaY}px) rotateY(-180deg) rotateZ(0deg);` +
                    `}` +
                    `20% {` +
                        // Face up in the hidden marketing pile
                        `transform: translate(${-deltaX}px, ${-deltaY}px) rotateY(0deg) rotateZ(0deg);` +
                    `}` +
                    `25% {` +
                        // Head tilted towards the direction of motion
                        `transform: translate(${-deltaX}px, ${-deltaY}px) rotateY(0deg) rotateZ(10deg);` +
                    `}` +
                    `100% {` +
                        // In place at the destination marketing lane 
                        `transform: translate(0, 0) rotateY(0deg) rotateZ(0);` +
                    `}` +
                `}`;

            const _this = this;
            return new Promise(resolve => {
                const timeout = setTimeout(done, msDuration + 500);
                function done() {
                    clearTimeout(timeout);
                    cardDiv.removeEventListener('animationend', done);
                    cardDiv.removeEventListener('animationcancel', done);
                    try {
                        document.head.removeChild(style);
                    }
                    catch (err) {}
                    cardDiv.classList.remove('forks_animated');
                    _this.adjustMarketingScore(cardId);
                    resolve();
                }
                cardDiv.addEventListener('animationend', done.bind(this), { once: true });
                cardDiv.addEventListener('animationcancel', done.bind(this), { once: true });
                cardDiv.classList.add('forks_animated');
            });
        },

        // Similar to placeOnObject, except it sets the child of
        // the parent instead of just setting the coordinates.
        placeInElement(childIdOrElement, parentIdOrElement) {
            const child = typeof childIdOrElement === 'string' ? document.getElementById(childIdOrElement) : childIdOrElement;
            const parent = typeof parentIdOrElement=== 'string' ? document.getElementById(parentIdOrElement) : parentIdOrElement;
            child.style.position = '';
            child.style.left = '';
            child.style.top = '';
            child.style.bottom = '';
            child.style.right = '';
            child.style.zIndex = '';
            parent.appendChild(child);
        },

        resetPosition(div) {
            div.style = '';
        },

        setMarketingScore(color, score) {
            const scoreDiv = document.getElementById(`forks_marketing-score-${color}`);
            scoreDiv.innerHTML = score;
        },

        adjustMarketingScore(cardId) {
            const { color, value } = Cards[cardId];
            const scoreDiv = document.getElementById(`forks_marketing-score-${color}`);
            scoreDiv.innerHTML = Number(scoreDiv.innerHTML) + value;
        },


        ///////////////////////////////////////////////////
        //// Player's action

        onClickTieBreaker() {
            console.log('onClickTieBreaker()');
            const tieBreakDiv = document.getElementById('forks_tie-breaker');
            if (tieBreakDiv.classList.contains('forks_touching')) {
                tieBreakDiv.classList.remove('forks_touching');
            }
            else {
                tieBreakDiv.classList.add('forks_touching');
            }
        },

        onClickCard(cardDiv, cardId) {
            if (!this.amIActive) return;
            if (this.currentState !== 'passSelection' && 
                this.currentState !== 'client_confirmPass' &&
                this.currentState !== 'discardSelection' &&
                this.currentState !== 'client_confirmDiscard') return;
            console.log(`onClickCard(${cardId})`);

            // Add/remove a CSS class to animate the card
            if (cardDiv.classList.contains('forks_selected')) {
                cardDiv.classList.remove('forks_selected');
                delete this.clientStartArgs.selected[cardId];
            }
            else {
                cardDiv.classList.add('forks_selected');
                this.clientStartArgs.selected[cardId] = Date.now();
            }

            // Automatically deselect the first selected if there are too many selected
            const allowedCount = /pass/i.test(this.currentState) ? 2 : 1;
            const selectedCardIds = Object.entries(this.clientStartArgs.selected)
                .sort(([ , t1 ], [ , t2 ]) => t1 - t2)
                .map(([ id, ]) => id);
            while (selectedCardIds.length > allowedCount) {
                const cardId = selectedCardIds.shift();
                const div = document.getElementById(`forks_card-${cardId}`);
                div?.classList.remove('forks_selected');
                delete this.clientStartArgs.selected[cardId];
            }

            // Enable the confirm button if when the correct number of cards are selected
            const isConfirmAllowed = allowedCount === selectedCardIds.length;
            const confirmDiv =
                /pass/i.test(this.currentState)
                    ? document.getElementById('forks_confirm-pass-button')
                    : document.getElementById('forks_confirm-discard-button');
            if (isConfirmAllowed) {
                confirmDiv && confirmDiv.classList.remove('disabled');
            }
            else {
                confirmDiv && confirmDiv.classList.add('disabled');
            }

            if (this.currentState === 'passSelection' && selectedCardIds.length === 2) {
                this.setClientState('client_confirmPass');
            }
            else if (this.currentState === 'discardSelection') {
                this.setClientState('client_confirmDiscard');
            }
        },

        async onClickConfirmPass() {
            const { selected } = this.clientStartArgs;
            if (!selected) return;
            const cardIds = Object.keys(selected).map(s => Number(s));
            if (cardIds.length !== 2) return;

            this.forks.players[this.myPlayerId].passing = cardIds;

            await this.invokeServerActionAsync('passCards', {
                card1: cardIds[0],
                card2: cardIds[1],
            });

            this.clientStartArgs.selected = {};
        },

        async onClickConfirmDiscard() {
            const { selected } = this.clientStartArgs;
            if (!selected) return;
            const cardIds = Object.keys(selected).map(id => Number(id));
            if (cardIds.length !== 1) return;

            this.clientStartArgs.cardToDiscard = cardIds[0];
            
            await this.invokeServerActionAsync('discardCard', {
                card: cardIds[0],
            });

            this.clientStartArgs.selected = {};
        },
  

        ///////////////////////////////////////////////////
        //// Reaction to cometD notifications

        __eventNotifyPromise: null,
        setupNotifications() {
            console.log('notifications subscriptions setup');
            const eventNames = [
                'dealt',
                'allDealt',
                'cardsPassed',
                'received',
                'cardDiscarded',
                'revealed',
                'losers',
            ];
            for (const eventName of eventNames) {
                dojo.subscribe(eventName, this, async data => {
                    const fnName = `notify_${eventName}`;
                    if (!this[fnName]) {
                        throw new Error (`Missing notification function named ${fnName}`);
                    }
                    console.log(`Entering ${fnName}`, data.args);
                    await this[fnName].call(this, data.args);
                    console.log(`Exiting ${fnName}`);
                    this.notifqueue.setSynchronousDuration(0);
                });
                this.notifqueue.setSynchronous(eventName);
            }
        },

        async notify_dealt({ cards }) {
            // Update the internal game state
            const playerCount = this.forks.order.length;
            this.forks.deck -= playerCount * cards.length;
            this.forks.players[this.myPlayerId].dealt = cards;
            
            // Deal the cards to the player
            await Promise.all(
                cards.map(async (cardId, i) => {
                    await this.delayAsync(i * 400);
                    await this.animateDealCardAsync(cardId, i, !this.forks.deck && i === cards.length - 1);
                }),
            );
        },

        async notify_allDealt({ round, total }) {
            this.setRoundInformation(round, total);
        },

        async notify_cardsPassed({ playerId }) {
            if (playerId == this.previousPlayerId) {
                // Animate two cards from the player board into the receiving area
                const incomingCards = [ 0, 1 ].map(i => {
                    const cardDiv = this.createCard(`incoming-${i}`, false, `player_board_${playerId}`)
                    cardDiv.style.transform = 'scaleZ(.667);';
                    return cardDiv;
                });
                const destDiv = document.getElementById('forks_my-receiving');
                const promises = incomingCards.map(async (cardDiv, i) => {
                    await this.delayAsync(100 * i);
                    await this.performCardAnimationAsync(cardDiv, destDiv, (deltaX, deltaY) => {
                        return {
                            '0': `transform: translate(0, 0) rotateY(-180deg) scaleZ(.667);`,
                            '100': `transform: translate(${deltaX}px, ${deltaY}px) rotateY(-180deg) scaleZ(1);`,
                        };
                    }, { deleteAfter: true, speedMultiplier: 2 });
                });
                await Promise.all(promises);
            }
            else if (playerId == this.myPlayerId) {
                // Update the internal game state
                const player = this.forks.players[this.myPlayerId];
                const cardsToPass = player.passing;
                player.dealt = player.dealt.filter(id => cardsToPass.indexOf(id) === -1);
                const keepCardId = player.dealt[0];
                player.hand.push(keepCardId);
                player.dealt = [];
                player.passing = [];

                await Promise.all(
                    cardsToPass.map(async (cardId, i) => {
                        await this.delayAsync(i * 400);
                        await this.animatePassCardAsync(cardId);
                    })
                );

                await this.delayAsync(100);
                await this.animateDealtCardToHandAsync(keepCardId);
            }
        },

        async notify_received({ cards }) {
            // Update the internal game state
            this.forks.players[this.myPlayerId].received = cards;

            // Send these cards to the player board
            const outgoingCards = [ 0, 1 ].map(i => {
                const cardDiv = this.createCard(`outgoing-${i}`, false, 'forks_my-passed')
                return cardDiv;
            });
            document.getElementById('forks_my-passed').classList.add('forks_empty');
            const destDiv = document.getElementById(`player_board_${this.nextPlayerId}`);
            const myPassingPromises = outgoingCards.map(async (cardDiv, i) => {
                await this.delayAsync(100 * i);
                await this.performCardAnimationAsync(cardDiv, destDiv, (deltaX, deltaY) => {
                    return {
                        '0': `transform: translate(0, 0) rotateY(-180deg) scaleZ(1);`,
                        '100': `transform: translate(${deltaX}px, ${deltaY}px) rotateY(-180deg) scaleZ(.667);`,
                    };
                }, { deleteAfter: true, speedMultiplier: 2 });
            });

            await Promise.all([
                ...myPassingPromises,
                ...cards.map(async (cardId, i) => {
                    await this.delayAsync(i * 400);
                    await this.animateCardFromReceivingAsync(cardId, i);
                }),
            ]);

            // In Merge Variant, put the received cards into player's hand right away.
            // We want to remove confusion about where to draw the discard from.
            if (this.forks.options.allowMerge) {
                await Promise.all(
                    cards.map(async (cardId, i) => {
                        await this.delayAsync(i * 400);
                        await this.animateReceivedCardToHandAsync(cardId, i);
                    })
                );
            }
        },

        async notify_cardDiscarded({ playerId }) {
            // Update the internal game state
            this.forks.marketingHidden++;

            // Animate card being discarded to hidden marketing pile, remove
            // info from the card, and animate card kept into the player hand
            if (playerId == this.myPlayerId) {
                const { cardToDiscard } = this.clientStartArgs;

                // Update the internal game state
                const player = this.forks.players[this.myPlayerId];
                const keepCardId = player.received.filter(id => id !== cardToDiscard)[0]; // NOT for Merge Variant
                player.hand.push(...player.received);
                player.hand = player.hand.filter(id => id !== cardToDiscard);
                player.received = [];
                
                // In merge variant, player can discard from any card in player's hand
                if (this.forks.options.allowMerge) {
                    await this.animateDiscardCardFromHandAsync(cardToDiscard);
                }
                else {
                    await this.animateDiscardCardAsync(cardToDiscard);
                    await this.delayAsync(200);
                    await this.animateReceivedCardToHandAsync(keepCardId);
                }

                delete this.clientStartArgs.cardToDiscard;
            }
            else {
                // Animate a card from the player's board to the discard pile
                const cardDiv = this.createCard(`discard-${playerId}`, false, `player_board_${playerId}`);
                const destDiv = document.getElementById('forks_marketing-hidden');
                await this.performCardAnimationAsync(cardDiv, destDiv, (deltaX, deltaY) => {
                    return {
                        '0': `transform: translate(0, 0) rotateY(-180deg) scaleZ(.667);`,
                        '100': `transform: translate(${deltaX}px, ${deltaY}px) rotateY(-180deg) scaleZ(1);`,
                    };
                }, { deleteAfter: true, speedMultiplier: 2 });
            }
        },

        async notify_revealed({ cards, round, total }) {
            // Update the internal game state
            this.forks.marketing.push(...cards);
            this.forks.marketingHidden = 0;

            this.setRoundInformation(round, total);

            // In 2-player game, there will be three cards here.
            // The last card actually came from the top of the deck.
            const playerCount = this.forks.order.length;
            const cardFromDeck = playerCount === 2 ? cards.pop() : null;

            // Animate hidden marketing cards into the marketing piles
            await Promise.all(
                cards.map(async (cardId, i) => {
                    await this.delayAsync(i * 500);
                    await this.animateRevealMarketingCard(cardId, i === cards.length - 1);
                })
            );

            if (playerCount == 2) {
                await this.delayAsync(500);
                this.forks.deck--;

                // Last card in the cards array is the one from the deck
                await this.animateDealMarketingCardAsync(cardFromDeck, !this.forks.deck);
                await this.delayAsync(500);
            }
        },

        async notify_losers({ losers, scores }) {
            // Display the final lane scores
            const scoresByColor = this.forks.marketing.reduce((result, cardId) => {
                const { color, value } = Cards[cardId];
                result[color] = (result[color] || 0) + value;
                return result;
            }, {});
            for (const [ color, score ] of Object.entries(scoresByColor)) {
                this.setMarketingScore(color, score);
            }
            
            // Update the player boards
            for (const [ playerId, score ] of Object.entries(scores)) {
                this.scoreCounter[playerId].incValue(score);
            }
            // Animate the losing stacks downward
            const surfaceDiv = document.getElementById('forks_surface');
            for (const color of losers) {
                surfaceDiv.classList.add(`forks_loser-${color}`);
            }

            await this.delayAsync(1000);
        },
    });
});
