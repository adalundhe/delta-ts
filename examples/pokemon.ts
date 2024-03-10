import { create } from "../src";

interface PokemonTrainer {
  trainerName: string;
  favoritePokemon: string;
  pokemonIndexed: number;
  updateTrainerName: (updatedName: string) => void;
  updateFavoritePokemon: (updatedFavorite: string) => void;
  updateIndexedCount: (updatedCount: number) => void;
}

const useUserStore = create<PokemonTrainer>((set) => ({
  trainerName: "Ash",
  favoritePokemon: "Pikachu",
  pokemonIndexed: 40,
  updateTrainerName: (updatedName: string) =>
    set({
      trainerName: updatedName,
    }),
  updateFavoritePokemon: (updatedFavorite: string) =>
    set({
      favoritePokemon: updatedFavorite,
    }),
  updateIndexedCount: (updatedCount: number) =>
    set({
      pokemonIndexed: updatedCount,
    }),
}));
