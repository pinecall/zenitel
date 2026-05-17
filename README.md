# zenitel-client

[![npm](https://img.shields.io/npm/v/zenitel?color=818cf8&label=npm&style=flat-square)](https://www.npmjs.com/package/zenitel)
[![license](https://img.shields.io/npm/l/zenitel?color=818cf8&style=flat-square)](https://github.com/pinecall/zenitel-client/blob/master/LICENSE)

> TypeScript client for Zenitel intercom systems — HTTP scraper, network scanner, and CLI.

Zero runtime dependencies · Native `fetch` (Node 18+) · Tested on **TCIV-2+** firmware **9.2.3.0**

## Table of Contents

- [Install](#install)
- [Quick Start](#quick-start)
- [CLI](#cli)
  - [Device Discovery](#device-discovery)
  - [Device Info](#device-information)
  - [Call & Relay Control](#call-status--relays)
  - [SIP Configuration](#sip-configuration)
  - [Webcall Management](#webcall-api-management)
  - [Audio Settings](#audio-settings)
  - [Config Backup & Restore](#config-backup--restore)
  - [Call Button (DAK)](#call-button-dak-configuration)
  - [Provisioning](#full-device-provisioning)
  - [Video](#video)
  - [Reboot](#device-reboot)
- [API](#api)
  - [Connectivity](#connectivity)
  - [Device Info](#device-info)
  - [Calls](#webcall-place--stop--answer-calls)
  - [Relay / Door Control](#relay--door-control)
  - [SIP Config](#sip-configuration-1)
  - [Webcall Toggle](#webcall-management)
  - [Config Backup](#config-backup--restore-1)
  - [Video URLs](#video-1)
  - [Call Button (DAK)](#call-button-dak-configuration-1)
  - [Provisioning](#full-device-provisioning-1)
  - [Audio Settings](#audio-settings)
  - [Reboot](#reboot)
- [Network Scanner](#scannetwork)
- [Supported Hardware](#supported-hardware)
- [Goform Endpoint Map](#goform-endpoint-map)

---

## Install

```bash
npm install zenitel
```

## Quick Start

```typescript
import { ZenitelClient } from 'zenitel';

const z = new ZenitelClient({ host: '192.168.1.143' });

// Check if device is reachable
await z.isReachable();           // true

// Get device info
const info = await z.getDeviceInfo();
console.log(info.model);         // "TCIV-2+"

// Open the door for 7 seconds
await z.activateRelay({ timer: 7 });

// Read audio settings
const audio = await z.getAudioSettings();
console.log(audio.speaker.gain); // 0

// Set speaker volume to +3 dB
await z.setAudioSettings({ speaker: { gain: 3 } });
```

---

## CLI

The `zenitel` CLI is included for hardware testing and debugging.

```bash
npx zenitel <command> [options]
```

### Device Discovery

```bash
zenitel scan

# 🔍 Scanning network for Zenitel devices...
#
#   🟢 192.168.1.143
#      MAC: 00:13:cb:28:35:ca
#      Model: TCIV-2+
#      Firmware: 9.2.3.0
#      Hostname: zenitel01
#      Mode: sip
#      Camera: Yes
#
# Found 1 device(s).
```

### Device Information

```bash
zenitel info -h 192.168.1.143

# 📋 Device info:
#   Model:          TCIV-2+
#   System:         Turbine Compact - Video Plus
#   Firmware:       9.2.3.0
#   MAC:            00:13:cb:28:35:ca
#   Serial:         22040000
#   Hostname:       zenitel01
#   Mode:           sip
#   Camera:         Yes
#   Webcall:        Enabled
#   SIP Registered: Yes
```

### Call Status & Relays

```bash
zenitel status -h 192.168.1.143        # Full status
zenitel relay -h 192.168.1.143          # Open door (relay1, 3s)
zenitel relay -h 192.168.1.143 --id gpio2 --timer 5  # GPIO output
zenitel relay -h 192.168.1.143 --off    # Deactivate
zenitel call 122 -h 192.168.1.143       # Place SIP call
zenitel stop -h 192.168.1.143           # Hang up
```

### SIP Configuration

```bash
zenitel sip get -h 192.168.1.143        # Read SIP config
zenitel sip set -h 192.168.1.143 \
  --domain my-trunk.sip.twilio.com \
  --number station01
```

### Webcall API Management

```bash
zenitel webcall -h 192.168.1.143           # Check status
zenitel webcall enable -h 192.168.1.143    # Enable HTTP API
zenitel webcall disable -h 192.168.1.143   # Disable
```

### Audio Settings

```bash
# Read current audio config
zenitel audio -h 192.168.1.143

# 🎵 Audio settings for 192.168.1.143:
#
#   Speaker:     -5 dB  (range: -10 to +13)
#   Mic:         0 dB   (range: -10 to +10)
#   AEC:         ✅ ON  (moderate)
#   ANC:         ✅ ON  (moderate)
#   DRC:         ❌ OFF (5 dBA)
#   AVC:         ❌ OFF
#   FESS:        ❌ OFF (threshold: -60 dBFS)
#   Mode:        Voice

# Adjust speaker and mic
zenitel audio set -h 192.168.1.143 --speaker 3 --mic 3

# Toggle DSP features
zenitel audio set -h 192.168.1.143 --aec-on --drc-on --anc-off

# Backup raw audio config as JSON
zenitel audio backup -h 192.168.1.143 -o audio-backup.json
```

### Config Backup & Restore

```bash
zenitel backup -h 192.168.1.143 -o backup.tar.gz
zenitel restore backup.tar.gz -h 192.168.1.143
```

### Video

```bash
zenitel video -h 192.168.1.143
# 📷 Video URLs:
#   MJPG:  http://192.168.1.143/mjpg/video.mjpg
#   RTSP:  rtsp://192.168.1.143:554/1/RTSP
```

### Call Button (DAK) Configuration

```bash
zenitel dak get -h 192.168.1.143
zenitel dak set --number portia-ae3c -h 192.168.1.143
```

> Downloads config → modifies XML → re-uploads → reboots. Zero external dependencies.

### Full Device Provisioning

One command to configure a factory-reset Zenitel:

```bash
zenitel provision -h 192.168.1.143 \
  --domain testing-mo16m3gw.sip.twilio.com \
  --sip-user zenitel01 \
  --sip-pass 'your-sip-password' \
  --number portia-ae3c

# ✅ Provisioned! Device is rebooting (~30s).
```

### Device Reboot

```bash
zenitel reboot -h 192.168.1.143
```

### CLI Options

| Flag | Short | Description | Default |
|------|-------|-------------|---------|
| `--host` | `-h` | Device IP address | required |
| `--user` | `-u` | Web UI username | `admin` |
| `--pass` | `-p` | Web UI password | `alphaadmin` |
| `--id` | | Relay ID (`relay1`, `gpio1`–`gpio6`) | `relay1` |
| `--timer` | | Relay timer (seconds) | `3` |
| `--timeout` | | Scan timeout (ms) | `5000` |
| `--off` | | Deactivate relay | |
| `--domain` | | SIP domain | |
| `--number` | | SIP number / agent number | |
| `--proxy` | | Outbound proxy | |
| `--transport` | | SIP transport (`udp`/`tcp`/`tls`) | |
| `--out` | `-o` | Backup output filename | `ipst_config.tar.gz` |
| `--no-reboot` | | Skip reboot after DAK set | |
| `--sip-user` | | SIP auth username (provision) | |
| `--sip-pass` | | SIP auth password (provision) | |

---

## API

### `ZenitelClient`

```typescript
import { ZenitelClient } from 'zenitel';

const z = new ZenitelClient({
  host: '192.168.1.143',
  user: 'admin',         // default
  password: 'alphaadmin', // default
  timeout: 5000,          // ms, default
});
```

#### Connectivity

```typescript
const reachable = await z.isReachable(); // true | false
```

#### Device Info

```typescript
const info = await z.getDeviceInfo();
// { model, firmware, mac, ip, hostname, serialNumber, hardwareType,
//   mode, hasCamera, sipDomain, sipRegistered, webcallEnabled, ... }
```

#### Webcall (Place / Stop / Answer calls)

```typescript
await z.placeCall('122');
await z.stopCall();
await z.answerCall();
const status = await z.getCallStatus(); // 'Idle' | 'Calling' | 'Connected' | 'Ringing'
```

#### Relay / Door Control

```typescript
await z.activateRelay({ relayId: 'relay1', timer: 3 });
await z.activateRelay({ relayId: 'gpio2', timer: 5 });
await z.deactivateRelay('relay1');
const relays = await z.getRelayStatus();
// { relay1: 'Deactivated', gpio1: ..., gpio6: ... }
```

Relay IDs: `relay1`, `gpio1`–`gpio6`

#### SIP Configuration

```typescript
const sip = await z.getSIPConfig();
// { displayName, directoryNumber, domain, authUsername, outboundProxy, transport }

await z.setSIPConfig({ domain: 'my-trunk.sip.twilio.com' });
await z.reboot(); // Required for SIP changes
```

#### Webcall Management

```typescript
await z.enableWebcall();
await z.disableWebcall();
```

> Firmware ≥4.11.3.1 disables webcall by default. Enable it for relay/call HTTP control.

#### Config Backup & Restore

```typescript
const backup = await z.downloadConfig();
fs.writeFileSync('backup.tar.gz', backup);

const tarGz = fs.readFileSync('backup.tar.gz');
await z.uploadConfig(tarGz);
await z.reboot();
```

#### Video

```typescript
z.getMJPGUrl();   // "http://192.168.1.143/mjpg/video.mjpg"
z.getRTSPUrl();   // "rtsp://192.168.1.143:554/1/RTSP"
z.getVideoAuth(); // { user: 'admin', password: '...' }
```

#### Call Button (DAK) Configuration

```typescript
const dak = await z.readDAK();
// { number: '222', domain: 'sip.twilio.com', raw: '222@sip.twilio.com' }

await z.configureCallButton('portia-ae3c');
// Downloads backup → modifies XML → uploads → reboots (~2s)
```

#### Full Device Provisioning

```typescript
await z.provisionDevice({
  sipDomain: 'testing-mo16m3gw.sip.twilio.com',
  sipAuthUser: 'zenitel01',
  sipAuthPassword: 'your-sip-password',
  agentNumber: 'portia-ae3c',
  enableWebcall: true,   // default
  autoAnswer: true,      // default
});
```

#### Audio Settings

Read and write the full audio configuration — speaker/mic gain, echo cancellation, noise suppression, compression, and automatic volume control.

> The Zenitel config endpoint requires the **complete** JSON payload. `setAudioSettings()` handles this automatically — it reads, merges your changes, and writes back.

```typescript
const audio = await z.getAudioSettings();
// { speaker, mic, aec, anc, drc, avc, fess, lineOut, mode }

await z.setAudioSettings({ speaker: { gain: 3 } });
await z.setAudioSettings({ mic: { gain: 3 } });
await z.setAudioSettings({ drc: { enabled: true, gain: 8 } });
await z.setAudioSettings({
  speaker: { gain: 2 },
  aec: { enabled: true, mode: 'aggressive' },
});

// Backup raw config
const raw = await z.getAudioSettingsRaw();
fs.writeFileSync('audio-backup.json', JSON.stringify(raw, null, 2));
```

| Setting | Property | Range | Description |
|---------|----------|-------|-------------|
| Speaker Volume | `speaker.gain` | -10 to +13 dB | Playback level |
| Mic Sensitivity | `mic.gain` | -10 to +10 dB | Input level |
| Echo Cancel | `aec.enabled` / `.mode` | `moderate` · `aggressive` | Removes speaker bleed from mic |
| Noise Suppress | `anc.enabled` / `.mode` | `moderate` · `aggressive` | Filters ambient noise |
| Compression | `drc.enabled` / `.gain` | 0–20 dBA | Normalizes volume |
| Auto Volume | `avc.enabled` | bool | Adjusts to ambient noise |
| Squelch | `fess.enabled` / `.threshold` | -92–0 dBFS | Silences weak signals |
| Line Out | `lineOut.gain` | -20 to +20 dB | External speaker |

#### Reboot

```typescript
await z.reboot(); // ~30 seconds offline
```

---

### `scanNetwork()`

```typescript
import { scanNetwork } from 'zenitel';

const devices = await scanNetwork({ timeout: 5000 });
// [{ ip, mac, model, firmware, hasCamera, hostname, mode }]
```

| Strategy | Method | Speed |
|----------|--------|-------|
| `arp-oui` | ARP table + MAC prefix `00:13:CB` | Fast |
| `http-probe` | Probe every IP for `zenitel.js` | Thorough |

---

## Supported Hardware

| Model | Camera | Relay | Webcall | Audio | Firmware |
|-------|--------|-------|---------|-------|----------|
| **TCIV-2+** | ✅ | ✅ relay1 + gpio1–6 | ✅ | ✅ | 9.2.3.0 |
| TCIV-3+ | ✅ | ✅ | ✅ | ✅ | Expected |
| TCIS-2 | — | ✅ | ✅ | ✅ | Expected |

## Goform Endpoint Map

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/goform/zForm_header` | GET | Device metadata |
| `/goform/zForm_stn_info` | GET | Station info table |
| `/goform/zForm_webcall` | GET/POST | Webcall + relay control |
| `/goform/zForm_sip_configuration` | GET | SIP config |
| `/goform/zForm_save_changes` | POST | Write SIP config |
| `/goform/zForm_audio_configuration` | GET | Audio config (JSON) |
| `/goform/zForm_auto_config` | POST | Write audio/DSP config |
| `/goform/zForm_config_backup` | POST | Config restore (upload) |
| `/ipst_config.tar.gz` | GET | Config backup download |
| `/goform/zForm_system_prefs` | POST | Reboot device |
| `/mjpg/video.mjpg` | GET | Live MJPG stream |

Auth: **HTTP Basic** on all endpoints.

## License

Apache-2.0
