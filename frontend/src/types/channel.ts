export interface ChannelState {
  status?: string; // 'gray', 'green', 'yellow', 'orange', 'red'
  memo?: string;
  moving?: boolean; // 이동중 표시 여부
}

export interface StatusColor {
  name: string;
  label: string;
  value: string;
}

export type MessageType = 
  | 'CHANNEL_CREATE' 
  | 'CHANNEL_DELETE' 
  | 'CHANNEL_SELECT' 
  | 'CHANNEL_LIST' 
  | 'CHANNEL_STATUS' 
  | 'CHANNEL_MEMO' 
  | 'CHANNEL_MOVING'
  | 'STATE_SYNC' 
  | 'STATE_CHANGE';

export interface BossRaidMessage {
  type: MessageType;
  channelId?: string;
  channelName?: string;
  bossType?: string;
  status?: string;
  memo?: string;
  moving?: boolean;
  fullState?: {
    [bossType: string]: {
      [channelId: string]: ChannelState;
    };
  };
  bossChannels?: {
    [bossType: string]: string[] | { [channelId: string]: string };
  };
}
