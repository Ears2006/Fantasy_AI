export const openAiTools = [
  {
    type: 'function',
    name: 'player_search',
    description:
      'Search for an NFL fantasy football player by name. Use this when the user mentions a player and you need to identify the correct player before requesting projections, rankings, injuries, or other data.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The player name or partial player name to search for.',
        },
        position: {
          type: ['string', 'null'],
          description: 'Optional NFL fantasy position such as QB, RB, WR, or TE.',
        },
        nflTeam: {
          type: ['string', 'null'],
          description: 'Optional NFL team abbreviation.',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of matching players to return.',
        },
      },
      required: ['query'],
      additionalProperties: false,
    },
  },
];