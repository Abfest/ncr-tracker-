// One-off backfill: fixes historical NCRs that were left "open"/"overdue"
// even though their linked CAPA had already been closed. This mismatch is
// what was making the Supplier Scorecard and Analytics KPIs show 0 closed
// NCRs and every open NCR as overdue — the CAPA's own status was updated,
// but the parent NCR's status field never was.
//
// Safe to run more than once — it only touches NCRs that are not already
// 'closed' and whose linked CAPA status is 'closed'.
//
// Usage: place a valid service-account.json next to this script, then:
//   npx ts-node scripts/backfill-ncr-capa-sync.ts

import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

if (!getApps().length) {
  initializeApp({ credential: cert('service-account.json') })
}

const db = getFirestore()
const NCR_COLLECTION = 'v2_ncrs'
const CAPA_COLLECTION = 'v2_capas'

async function backfill() {
  console.log('Scanning closed CAPAs for out-of-sync NCRs...')

  const closedCapasSnap = await db
    .collection(CAPA_COLLECTION)
    .where('status', '==', 'closed')
    .get()

  console.log(`Found ${closedCapasSnap.size} closed CAPA(s).`)

  let fixed = 0
  let alreadyOk = 0
  let missingNcr = 0

  for (const capaDoc of closedCapasSnap.docs) {
    const capa = capaDoc.data()
    const ncrId = capa.ncrId as string | undefined
    if (!ncrId) {
      console.warn(`  CAPA ${capaDoc.id} has no ncrId — skipping.`)
      continue
    }

    const ncrRef = db.collection(NCR_COLLECTION).doc(ncrId)
    const ncrSnap = await ncrRef.get()

    if (!ncrSnap.exists) {
      console.warn(`  CAPA ${capaDoc.id} points to missing NCR ${ncrId} — skipping.`)
      missingNcr++
      continue
    }

    const ncr = ncrSnap.data()
    if (ncr?.status === 'closed') {
      alreadyOk++
      continue
    }

    await ncrRef.update({
      status: 'closed',
      closedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      activity: FieldValue.arrayUnion({
        id: `backfill-${Date.now()}-${ncrId}`,
        type: 'status_changed',
        timestamp: new Date(),
        userEmail: 'system@sqs.com',
        fromValue: ncr?.status ?? 'unknown',
        toValue: 'closed',
        message: 'Backfilled: linked CAPA was already closed but NCR status had not synced.',
      }),
    })

    console.log(`  Fixed NCR ${ncr?.ncrNumber ?? ncrId} (was "${ncr?.status}") → closed`)
    fixed++
  }

  console.log('\nDone.')
  console.log(`  Fixed:        ${fixed}`)
  console.log(`  Already OK:   ${alreadyOk}`)
  console.log(`  Missing NCR:  ${missingNcr}`)
}

backfill().catch(err => {
  console.error('Backfill failed:', err)
  process.exit(1)
})
