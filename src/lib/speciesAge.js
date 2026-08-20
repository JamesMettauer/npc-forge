// Species lifespan metadata and age suggestion logic for Quick NPC Identity.
// Only used to suggest a plausible numeric age for an individual character.
// Never invents species-wide maturation stages or life-stage labels.

const SPECIES_AGE_DATA = {
  Human: { lifespan: 80, adulthood: 18 },
  Dwarf: { lifespan: 350, adulthood: 50 },
  Elf: { lifespan: 750, adulthood: 100 },
  Halfling: { lifespan: 150, adulthood: 20 },
};

const extractLifespan = (customSpeciesData) => {
  if (!customSpeciesData?.lifespan) return null;
  const lifespan = customSpeciesData.lifespan;
  if (typeof lifespan === 'number') return lifespan;
  const match = String(lifespan).match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
};

// Returns { age: number, fromLifespan: boolean }.
// fromLifespan is true when species lifespan data was used to compute the age.
export const suggestAge = (species, customSpeciesData) => {
  const data = SPECIES_AGE_DATA[species];
  if (data) {
    const { lifespan, adulthood } = data;
    const maxAge = Math.floor(lifespan * 0.5);
    const age = Math.floor(Math.random() * (maxAge - adulthood + 1)) + adulthood;
    return { age, fromLifespan: true };
  }
  const lifespan = extractLifespan(customSpeciesData);
  if (lifespan && lifespan > 0) {
    const adulthood = Math.max(Math.floor(lifespan * 0.15), 15);
    const maxAge = Math.floor(lifespan * 0.5);
    const age = Math.floor(Math.random() * (maxAge - adulthood + 1)) + adulthood;
    return { age, fromLifespan: true };
  }
  // No reliable lifespan data — conservative generic adult age (25–40).
  const age = Math.floor(Math.random() * 16) + 25;
  return { age, fromLifespan: false };
};