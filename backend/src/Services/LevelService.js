class LevelService {
    /**
     * Calculates the experience required to reach the next level.
     * @param {number} level - The current level.
     * @returns {number} - The experience required for the next level.
     */
    static getExpForNextLevel(level) {
        const baseExperience = 40;
        const minIncrease = 30;
        const growthRate = 1.005;

        const experienceRequired = Math.round(baseExperience + minIncrease * (Math.pow(growthRate, level - 1) - 1) / (growthRate - 1));
        
        return experienceRequired;
    }

    /**
     * Calculates the total experience required to reach a target level.
     * @param {number} targetLevel - The target level.
     * @returns {number} - The total experience required.
     */
    static getTotalExperienceForLevel(targetLevel) {
        let totalExperience = 0;

        for (let i = 1; i < targetLevel; i++) {
            totalExperience += getExpForNextLevel(i);
        }

        return totalExperience;
    }

    /**
     * Calculates the level based on the accumulated experience.
     * @param {number} exp - The accumulated experience.
     * @returns {number} - The calculated level.
     */
    static getLevelFromExp(exp) {
        let level = 0;

        while (exp >= getExpForNextLevel(level)) {
            exp -= getExpForNextLevel(level);
            level++;
        }

        return level;
    }

    /**
     * Calculates the experience gained in a round based on various factors.
     * @param {boolean} outcome - The outcome of the round (win or lose).
     * @param {number} playedCards - The number of cards played in the round.
     * @param {number} numPlayers - The number of players in the game.
     * @param {number} turnsPlayed - The number of turns played in the round.
     * @param {number} roundScore - The score achieved in the round.
     * @returns {number} - The calculated experience for the round.
     */
    static getExpForRound(outcome, playedCards, numPlayers, turnsPlayed, roundScore) {
        const winMultiplier = outcome ? 2 : 1;
        const cardMultiplier = -0.1;
        const playerMultiplier = 0.2;
        const turnsMultiplier = -0.1;
    
        const winExp = winMultiplier * 10;
        const cardExp = cardMultiplier * playedCards;
        const playerExp = playerMultiplier * numPlayers;
        const turnsExp = turnsMultiplier * turnsPlayed;
        let scoreExp = 0;
        
        if (outcome && roundScore < 0) {
            scoreExp = Math.abs(roundScore) * 0.3;
        } else if (outcome && roundScore >= 0) {
            scoreExp = roundScore === 0 ? 0.2 : roundScore * 0.2;
        } else if (!outcome && roundScore < 0) {
            scoreExp = Math.abs(roundScore) * 0.1;
        } else if (!outcome && roundScore >= 0) {
            scoreExp = roundScore === 0 ? 0.1 : roundScore * 0.1;
        }
    
        const totalExp = winExp + cardExp + playerExp + turnsExp + scoreExp;
    
        return Math.round(totalExp);
    }
}