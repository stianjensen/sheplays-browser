export type PlayerInfo =
  | {
      score: {
        'round-1'?: number;
        'round-2'?: number;
      } | null;
      club: string;
      country: string;
      name: string;
      injured?: boolean | null;
      number?: number | null;
      points: number;
      DOB: string;
      clubD?: string | null;
      playerId: string;
      fantasyPrice: number;
      position: string;
    }
  | undefined;

export type PlayerRoundInfo = {
  isCaptain?: boolean;
  played?: boolean;
  benched?: boolean;
  points?: number;
};

export type FullPlayerRoundInfo = PlayerInfo & PlayerRoundInfo;
