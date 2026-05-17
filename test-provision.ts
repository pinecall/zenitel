/**
 * Full Zenitel provision cycle:
 *   1. Factory reset (keep IP)
 *   2. Wait for reboot
 *   3. Configure SIP (credentials + domain)
 *   4. Set DAK (call target)
 *   5. Enable webcall
 *   6. Reboot
 *   7. Wait for reboot
 *   8. Verify SIP registration
 *
 * Usage: npx tsx test-provision.ts
 */

import { TcivClient } from 'tciv-client'

const HOST = '192.168.1.143'
const USER = 'admin'
const PASS = 'alphaadmin'

const SIP = {
  name: 'zenitel01',
  id: 'zenitel01',
  domain: 'testing-mo16m3gw.sip.twilio.com',
  authUser: 'zenitel01',
  authPass: 'Beachway1!Sip',
  proxy: 'testing-mo16m3gw.sip.twilio.com',
}

const DAK_TARGET = 'portia-test@testing-mo16m3gw.sip.twilio.com'

function log(msg: string) {
  const ts = new Date().toISOString().slice(11, 19)
  console.log(`[${ts}] ${msg}`)
}

async function waitOnline(z: TcivClient, label: string, timeoutMs = 90000): Promise<boolean> {
  log(`⏳ Waiting for device (${label})...`)
  const start = Date.now()
  // Give it a few seconds to actually go offline
  await sleep(5000)
  while (Date.now() - start < timeoutMs) {
    if (await z.isReachable()) {
      const elapsed = ((Date.now() - start) / 1000).toFixed(1)
      log(`✅ Device online after ${elapsed}s`)
      return true
    }
    await sleep(3000)
  }
  log(`❌ Timeout after ${timeoutMs / 1000}s`)
  return false
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

async function main() {
  const z = new TcivClient({ host: HOST, user: USER, password: PASS })

  // ── 0. Pre-check ──
  log('0. Checking device...')
  if (!(await z.isReachable())) {
    log('❌ Device not reachable. Aborting.')
    return
  }
  const info = await z.getDeviceInfo()
  log(`   Model: ${info.model} | FW: ${info.firmware} | Mode: ${info.mode}`)

  // ── 1. Factory reset ──
  log('\n1. Factory resetting (keep IP)...')
  await z.factoryReset('keep-ip')
  log('   Reset command sent')

  // ── 2. Wait for reboot ──
  if (!(await waitOnline(z, 'post-reset'))) return

  // After factory reset, give it a moment to fully init
  await sleep(3000)

  // ── 3. Check mode, switch to SIP if needed ──
  log('\n3. Checking mode...')
  const postReset = await z.getDeviceInfo()
  log(`   Mode: ${postReset.mode}`)

  if (postReset.mode !== 'sip') {
    log('   Switching to SIP mode...')
    await z.setMode('sip')
    await z.applyChanges()
    if (!(await waitOnline(z, 'post-mode-switch'))) return
    await sleep(3000)
  } else {
    log('   ✅ Already in SIP mode')
  }

  // ── 4. Configure SIP ──
  log('\n4. Configuring SIP...')
  log(`   Name:     ${SIP.name}`)
  log(`   ID:       ${SIP.id}`)
  log(`   Domain:   ${SIP.domain}`)
  log(`   Auth:     ${SIP.authUser} / ${'*'.repeat(SIP.authPass.length)}`)
  log(`   Proxy:    ${SIP.proxy}`)

  await z.setSIPConfig({
    displayName: SIP.name,
    directoryNumber: SIP.id,
    domain: SIP.domain,
    authUsername: SIP.authUser,
    authPassword: SIP.authPass,
    outboundProxy: SIP.proxy,
    transport: 'udp',
  })
  log('   ✅ SIP config written')

  // Verify it stuck
  const sipCheck = await z.getSIPConfig()
  log(`   Verify → domain="${sipCheck.domain}", id="${sipCheck.directoryNumber}", auth="${sipCheck.authUsername}"`)
  if (sipCheck.domain !== SIP.domain) {
    log('   ❌ SIP domain did NOT persist!')
    return
  }

  // ── 5. Set DAK ──
  log(`\n5. Setting DAK → ${DAK_TARGET}`)
  await z.setDAK(DAK_TARGET)
  const dak = await z.getDAK()
  log(`   Verify → DAK="${dak}"`)

  // ── 6. Enable webcall ──
  log('\n6. Enabling webcall...')
  await z.enableWebcall()
  log('   ✅ Webcall enabled')

  // ── 7. Reboot to apply SIP changes ──
  log('\n7. Rebooting to apply SIP config...')
  await z.reboot()
  if (!(await waitOnline(z, 'post-sip-reboot'))) return

  // Give SIP registration a moment
  log('   Waiting 10s for SIP registration...')
  await sleep(10000)

  // ── 8. Verify SIP registration ──
  log('\n8. Verifying final state...')
  const final = await z.getDeviceInfo()
  const finalSip = await z.getSIPConfig()

  log(`   Mode:           ${final.mode}`)
  log(`   SIP Domain:     ${finalSip.domain}`)
  log(`   SIP ID:         ${finalSip.directoryNumber}`)
  log(`   Auth User:      ${finalSip.authUsername}`)
  log(`   Outbound Proxy: ${finalSip.outboundProxy}`)
  log(`   Webcall:        ${final.webcallEnabled ? '✅' : '❌'}`)
  log(`   SIP Registered: ${final.sipRegistered ? '✅' : '❌'}`)

  const dak2 = await z.getDAK()
  log(`   DAK:            ${dak2}`)

  // ── Summary ──
  console.log('\n' + '═'.repeat(50))
  const allOk = finalSip.domain === SIP.domain
    && finalSip.directoryNumber === SIP.id
    && finalSip.authUsername === SIP.authUser
    && final.webcallEnabled
    && dak2 === DAK_TARGET

  if (allOk && final.sipRegistered) {
    console.log('🎉 FULL SUCCESS — SIP registered and all config correct')
  } else if (allOk) {
    console.log('⚠️  Config correct but SIP NOT registered yet')
    console.log('   This may take 1-2 minutes. Check again shortly.')
  } else {
    console.log('❌ FAILED — some config did not persist')
  }
  console.log('═'.repeat(50))
}

main().catch(err => {
  log(`💥 FATAL: ${err.message}`)
  console.error(err)
})
