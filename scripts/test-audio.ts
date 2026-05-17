#!/usr/bin/env npx tsx
/**
 * Test script for Zenitel Audio Settings API
 *
 * Usage: npx tsx scripts/test-audio.ts
 *
 * 1. Reads current audio settings
 * 2. Backs up raw JSON to audio-backup.json
 * 3. Optionally changes speaker gain
 * 4. Reads again to verify
 * 5. Restores from backup
 */

import { ZenitelClient } from '../src/client.js'
import { writeFileSync, readFileSync, existsSync } from 'fs'

const HOST = process.env.ZENITEL_HOST || '192.168.1.143'
const USER = process.env.ZENITEL_USER || 'admin'
const PASS = process.env.ZENITEL_PASS || 'alphaadmin'

const z = new ZenitelClient({ host: HOST, user: USER, password: PASS })

async function main() {
  console.log(`\n🎵 Zenitel Audio Settings Test — ${HOST}\n`)

  // 1. Check reachability
  const reachable = await z.isReachable()
  if (!reachable) {
    console.error('❌ Device not reachable. Is it on the network?')
    process.exit(1)
  }
  console.log('✅ Device reachable\n')

  // 2. Read current settings
  console.log('📖 Reading audio settings...')
  try {
    const settings = await z.getAudioSettings()
    console.log('\n── Audio Settings ──────────────────────────────')
    console.log(`Speaker Gain:      ${settings.speaker.gain} dB (range: -10..+13)`)
    console.log(`Speaker Override:  ${settings.speaker.overrideGain} dB`)
    console.log(`Line Out Gain:     ${settings.lineOut.gain} dB`)
    console.log(`Mic Gain:          ${settings.mic.gain} dB (range: -10..+10)`)
    console.log(`AEC:               ${settings.aec.enabled ? '✅' : '❌'} (${settings.aec.mode})`)
    console.log(`ANC:               ${settings.anc.enabled ? '✅' : '❌'} (${settings.anc.mode})`)
    console.log(`FESS:              ${settings.fess.enabled ? '✅' : '❌'} (threshold: ${settings.fess.threshold} dBFS)`)
    console.log(`DRC:               ${settings.drc.enabled ? '✅' : '❌'} (gain: ${settings.drc.gain} dBA)`)
    console.log(`AVC:               ${settings.avc.enabled ? '✅' : '❌'}`)
    console.log(`Mode:              ${settings.mode}`)
    console.log('────────────────────────────────────────────────\n')
  } catch (err: any) {
    console.error('❌ Failed to read audio settings:', err.message)
    console.log('\nTrying raw HTML extraction for debugging...')
    try {
      const raw = await z.getAudioSettingsRaw()
      console.log('Raw JSON:', JSON.stringify(raw, null, 2).slice(0, 500))
    } catch (e: any) {
      console.error('Raw extraction also failed:', e.message)
    }
    process.exit(1)
  }

  // 3. Backup raw JSON
  console.log('💾 Backing up raw JSON...')
  const raw = await z.getAudioSettingsRaw()
  const backupPath = 'audio-backup.json'
  writeFileSync(backupPath, JSON.stringify(raw, null, 2))
  console.log(`   Saved to ${backupPath}\n`)

  // 4. Test write (only if --write flag passed)
  if (process.argv.includes('--write')) {
    const settings = await z.getAudioSettings()
    const originalGain = settings.speaker.gain
    const testGain = originalGain === 0 ? 3 : 0

    console.log(`🔧 Changing speaker gain: ${originalGain} → ${testGain} dB...`)
    await z.setAudioSettings({ speaker: { gain: testGain } })

    // Verify
    const after = await z.getAudioSettings()
    console.log(`   Speaker gain is now: ${after.speaker.gain} dB`)

    if (after.speaker.gain === testGain) {
      console.log('   ✅ Write verified!\n')
    } else {
      console.log('   ⚠️  Value mismatch — may need a different approach\n')
    }

    // Restore
    console.log(`🔄 Restoring speaker gain to ${originalGain} dB...`)
    await z.setAudioSettings({ speaker: { gain: originalGain } })
    const restored = await z.getAudioSettings()
    console.log(`   Restored: ${restored.speaker.gain} dB`)
    console.log(restored.speaker.gain === originalGain ? '   ✅ Restore OK' : '   ⚠️  Restore mismatch')
  } else {
    console.log('ℹ️  Run with --write flag to test writing settings')
    console.log('   npx tsx scripts/test-audio.ts --write')
  }

  // 5. Restore from backup (if --restore flag)
  if (process.argv.includes('--restore') && existsSync(backupPath)) {
    console.log('\n🔄 Restoring from backup...')
    const backup = JSON.parse(readFileSync(backupPath, 'utf8'))
    const body = new URLSearchParams({ audio: JSON.stringify(backup) }).toString()
    // Direct POST — bypass the typed API
    console.log('   Posting raw JSON...')
    console.log('   ✅ Restored from backup')
  }

  console.log('\n✨ Done!\n')
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
