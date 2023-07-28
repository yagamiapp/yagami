// State Enumeration Names
export const states = {
  0: 'Pick Phase',
  1: 'Ready Phase',
  2: 'Play Phase',
  3: 'Waiting for Match Link',
  4: 'Warmups',
  5: 'Rolling Phase',
  6: 'Roll Winner Selection',
  7: 'Ban Phase',
  8: 'Winner found',
  9: 'Match Closed',
  10: 'Not Started',
};
states[-1] = 'Archived';

export const maxWarmupLength = 300;
export const badWarmupReplacementId = 975342

export const allowedFMMods = ['ez', 'hd', 'hr', 'fl'];
export const maxAborts = 1;

export const timers = {
  0: 120, // Pick Timer
  1: 120, // Ready Timer
  4: 180, // Warmup Selection
  6: 90, // Roll Winner Selection
  7: 120, // Bans
};

export const emotes = {
  loading: `<a:loading:970406520124764200>`,
  success: `<a:verified:970410957710954636>`,
  teams: [":red_square:", ":blue_square:"],
  grades: {
    SSH: "<:rank_SSH:979114277929631764>",
    SS: "<:rank_SS:979114272955179069>",
    SH: "<:rank_SH:979114267850727465>",
    S: "<:rank_S:979114262502973450>",
    A: "<:rank_A:979114140465516645>",
    B: "<:rank_B:979114234233372752>",
    C: "<:rank_C:979114239736299570>",
    D: "<:rank_D:979114244777857096>",
    F: "<:rank_F:979114251337744504>",
  },
}