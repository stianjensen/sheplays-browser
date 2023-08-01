export type Position = 'GK' | 'DF' | 'MF' | 'FW';

export type PlayerInfo =
  | {
      score?: {
        'round-1'?: number;
        'round-2'?: number;
      } | null;
      club?: string;
      country?: string;
      name?: string;
      injured?: boolean | null;
      number?: number | null;
      points?: number;
      DOB?: string;
      clubD?: string | null;
      playerId: string;
      fantasyPrice?: number;
      position?: Position;
    }
  | undefined;

export type PlayerRoundInfo = {
  isCaptain?: boolean; // Is the player actually acting captain per now? (Highest ranking playing player)
  played?: boolean;
  benched?: boolean;
  points?: number;
  isDesignatedCaptain?: boolean; // Is the player selected as captain? (Tops the list, will be captain if she plays)
  isDesignatedViceCaptain?: boolean; // Selected in position 2, right behind the captain
};

export type FullPlayerRoundInfo = PlayerInfo & PlayerRoundInfo;
