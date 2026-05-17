/**
 * @pinecall/zenitel-client — Type definitions
 *
 * All interfaces for the Zenitel HTTP scraper, scanner, and CLI.
 */

// ── Client Options ──────────────────────────────────────────────────────────

export interface ZenitelClientOptions {
  /** IP or hostname of the Zenitel intercom (e.g. "192.168.1.143") */
  host: string;
  /** Web UI username. Default: "admin" */
  user?: string;
  /** Web UI password. Default: "alphaadmin" */
  password?: string;
  /** Protocol. Default: "http" */
  protocol?: 'http' | 'https';
  /** HTTP request timeout in ms. Default: 5000 */
  timeout?: number;
}

// ── Device Discovery ────────────────────────────────────────────────────────

export interface ZenitelDevice {
  ip: string;
  mac: string;              // "00:13:cb:28:35:ca"
  model?: string;           // "TCIV-2+"
  firmware?: string;        // "9.2.3.0"
  hasCamera: boolean;
  hostname?: string;        // "zenitel01"
  mode?: 'sip' | 'edge' | 'pulse';
  serialNumber?: string;
  hardwareType?: string;    // "8801"
}

export interface ScanOptions {
  /** Scan timeout in ms. Default: 5000 */
  timeout?: number;
  /** Subnet CIDR (e.g. "192.168.1.0/24"). Auto-detected if omitted. */
  subnet?: string;
  /** Which strategies to run. Default: all three. */
  strategies?: ('arp-oui' | 'http-probe')[];
}

// ── Device Info ─────────────────────────────────────────────────────────────

export interface DeviceInfo {
  model: string;            // "TCIV-2+"
  firmware: string;         // "9.2.3.0"
  mac: string;              // "00:13:cb:28:35:ca"
  ip: string;
  hostname: string;         // "zenitel01"
  serialNumber: string;     // "22040000"
  hardwareType: string;     // "8801"
  mode: 'sip' | 'edge' | 'pulse';
  hasCamera: boolean;
  sipDomain?: string;       // "testing-mo16m3gw.sip.twilio.com"
  sipRegistered?: boolean;
  sipNumber?: string;       // "zenitel01"
  outboundProxy?: string;
  uptime?: string;
  webcallEnabled: boolean;
  platform: string;         // "turbine"
  systemModelName?: string; // "Turbine Compact - Video Plus"
}

// ── Relay / Door ────────────────────────────────────────────────────────────

export interface RelayOptions {
  /** Relay ID. Default: "relay1". Options: relay1, gpio1-gpio6 */
  relayId?: string;
  /** Timer in seconds. 0 = toggle (stays active until deactivated). Default: 3 */
  timer?: number;
}

export interface RelayStatus {
  relay1: 'Activated' | 'Deactivated';
  gpio1: 'Activated' | 'Deactivated';
  gpio2: 'Activated' | 'Deactivated';
  gpio3: 'Activated' | 'Deactivated';
  gpio4: 'Activated' | 'Deactivated';
  gpio5: 'Activated' | 'Deactivated';
  gpio6: 'Activated' | 'Deactivated';
}

// ── SIP Config ──────────────────────────────────────────────────────────────

export interface SIPConfig {
  domain?: string;
  outboundProxy?: string;
  transport?: 'udp' | 'tcp' | 'tls';
  displayName?: string;
  directoryNumber?: string;
  authUsername?: string;
  authPassword?: string;
}

// ── Call Status ─────────────────────────────────────────────────────────────

export type CallStatus = 'Idle' | 'Calling' | 'Connected' | 'Ringing';

// ── Provisioning ────────────────────────────────────────────────────────────

/** Full provisioning config for a factory-reset Zenitel */
export interface ProvisionConfig {
  /** SIP registration domain (e.g. "testing-mo16m3gw.sip.twilio.com") */
  sipDomain: string;
  /** SIP auth username (e.g. "zenitel01") */
  sipAuthUser: string;
  /** SIP auth password */
  sipAuthPassword: string;
  /** Outbound proxy address. Defaults to sipDomain if omitted. */
  sipProxy?: string;
  /** SIP transport. Default: "UDP" */
  sipTransport?: 'UDP' | 'TCP' | 'TLS';
  /** Station display name (e.g. "Lobby Intercom"). Defaults to agentNumber. */
  stationName?: string;
  /** The SIP number the call button will dial (e.g. "portia-ae3c") */
  agentNumber: string;
  /** Enable webcall + relay HTTP API. Default: true */
  enableWebcall?: boolean;
  /** Enable auto-answer mode (for AI agent). Default: true */
  autoAnswer?: boolean;
}

// ── Audio Settings ──────────────────────────────────────────────────────────

/** Speaker / Line Out output device */
export interface AudioOutputDevice {
  /** Device identifier: "internal_speaker" or "line_out" */
  kid: string;
  /** Playback gain in dB. Speaker: -10..+13, Line Out: -20..+20 */
  gain: number;
  /** Override gain for priority calls in dB. Speaker: -10..+23, Line Out: -20..+21 */
  overrideGain: number;
  /** Signal source (default: "main_audio_line") */
  signalSource: string;
  /** Output type (e.g. "standard_loudspeaker", "line_out_professional") */
  outputType: string;
}

/** Microphone input device */
export interface AudioInputDevice {
  /** Device identifier: "internal_mic" */
  kid: string;
  /** Mic gain in dB. Range: -10..+10 */
  gain: number;
  /** Input type (e.g. "digital_mic") */
  inputType: string;
}

/** AEC — Acoustic Echo Cancellation */
export interface AECSettings {
  /** Enable echo cancellation */
  enabled: boolean;
  /** Suppression level */
  mode: 'moderate' | 'aggressive';
}

/** ANC — Active Noise Cancellation */
export interface ANCSettings {
  /** Enable noise cancellation */
  enabled: boolean;
  /** Suppression level */
  mode: 'moderate' | 'aggressive';
}

/** FESS — Far-End Signal Squelch */
export interface FESSSettings {
  /** Enable squelch on weak signals */
  enabled: boolean;
  /** Threshold in dBFS (-92..0). Signals below this are silenced. */
  threshold: number;
  /** Activation delay in ms (0..10000) */
  delay: number;
}

/** DRC — Dynamic Range Compression (Loudspeaker) */
export interface DRCSettings {
  /** Enable compression */
  enabled: boolean;
  /** Added gain in dBA (0..20) */
  gain: number;
}

/** AVC — Automatic Volume Control */
export interface AVCSettings {
  /** Enable automatic volume adjustment based on ambient noise */
  enabled: boolean;
  /** Enable digital AVC variant */
  digitalEnabled: boolean;
  /** Ambient noise level (dB) to start adjusting */
  threshold: number;
  /** Maximum noise level (dB) — stops adjusting above this */
  upperThreshold: number;
  /** How fast volume increases (1..100) */
  attackRate: number;
  /** How fast volume decreases (1..100) */
  decayRate: number;
  /** dB margin to prevent volume bouncing */
  hysteresis: number;
  /** Seconds to ignore noise when speaker is active */
  farEndLockoutTime: number;
}

/** Complete audio configuration for the Zenitel intercom */
export interface AudioSettings {
  /** Internal speaker output */
  speaker: AudioOutputDevice;
  /** Line out (auxiliary connector) */
  lineOut: AudioOutputDevice;
  /** Internal microphone */
  mic: AudioInputDevice;
  /** Acoustic Echo Cancellation */
  aec: AECSettings;
  /** Active Noise Cancellation */
  anc: ANCSettings;
  /** Far-End Signal Squelch */
  fess: FESSSettings;
  /** Dynamic Range Compression */
  drc: DRCSettings;
  /** Automatic Volume Control */
  avc: AVCSettings;
  /** Audio mode: "Voice" or "Music" */
  mode: string;
}

