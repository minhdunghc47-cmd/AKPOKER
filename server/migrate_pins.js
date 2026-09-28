const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');
const fs = require('fs');

const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceAccountStr) {
    console.error("Missing FIREBASE_SERVICE_ACCOUNT environment variable.");
    process.exit(1);
}

const serviceAccount = JSON.parse(serviceAccountStr);
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://\${serviceAccount.project_id}-default-rtdb.asia-southeast1.firebasedatabase.app`
});

const db = admin.database();
const isDryRun = process.argv.includes('--dry-run');

async function runMigration() {
    console.log("==========================================");
    console.log("   AK POKER PIN MIGRATION SCRIPT");
    if (isDryRun) console.log("   *** DRY RUN MODE (No changes saved) ***");
    console.log("==========================================");

    try {
        const staffRef = db.ref('staff');
        const snap = await staffRef.once('value');
        const staffData = snap.val();

        if (!staffData) {
            console.log("No staff data found.");
            process.exit(0);
        }

        let scanned = 0;
        let eligible = 0;
        let migrated = 0;
        let skipped = 0;
        let invalid = 0;
        let errors = 0;

        const updates = {};

        for (const [key, s] of Object.entries(staffData)) {
            scanned++;
            if (!s.pin) {
                invalid++;
                console.log(`[INVALID] Staff \${s.id} (\${s.name}) has no PIN.`);
                continue;
            }

            if (s.pin.startsWith('$2a$') || s.pin.startsWith('$2b$')) {
                skipped++;
                console.log(`[SKIPPED] Staff \${s.id} (\${s.name}) already has a hashed PIN.`);
                continue;
            }

            eligible++;
            try {
                const hashedPin = bcrypt.hashSync(s.pin, 10);
                updates[`\${key}/pin`] = hashedPin;
                migrated++;
                console.log(`[MIGRATED] Staff \${s.id} (\${s.name}): cleartext -> hash`);
            } catch (err) {
                errors++;
                console.error(`[ERROR] Failed to hash PIN for staff \${s.id}: `, err);
            }
        }

        console.log("------------------------------------------");
        console.log(`Scanned:  \${scanned}`);
        console.log(`Eligible: \${eligible}`);
        console.log(`Migrated: \${migrated}`);
        console.log(`Skipped:  \${skipped}`);
        console.log(`Invalid:  \${invalid}`);
        console.log(`Errors:   \${errors}`);
        console.log("------------------------------------------");

        if (Object.keys(updates).length > 0) {
            if (isDryRun) {
                console.log("DRY RUN: Would have updated the following keys:");
                console.log(Object.keys(updates));
            } else {
                console.log("Saving changes to Firebase...");
                await staffRef.update(updates);
                console.log("Successfully updated Firebase.");
            }
        } else {
            console.log("No updates to apply.");
        }

    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        process.exit(0);
    }
}

runMigration();
