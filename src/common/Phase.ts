export enum Phase {
  LOBBY = 'LOBBY',                       // Players joining, character selection
  CARD_SELECTION = 'CARD_SELECTION',     // Each player secretly picks 2 ability cards
  INITIATIVE_REVEAL = 'INITIATIVE_REVEAL', // Cards revealed, turn order determined
  ROUND_ACTIONS = 'ROUND_ACTIONS',       // Actors take turns in initiative order
  END_OF_ROUND = 'END_OF_ROUND',         // Elements decay, conditions tick, short rest
  SCENARIO_END = 'SCENARIO_END',         // Win or loss resolution
  CAMPAIGN = 'CAMPAIGN',                 // Between scenarios: loot, shop, level up
}
