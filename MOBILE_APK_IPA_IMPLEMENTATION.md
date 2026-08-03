# Mobile APK/IPA Build Feature - Implementation Status

## Completed ✅

### 1. System Prompt Updates
- **File:** `src/app/api/generate/route.ts` (lines 581-621)
- **Status:** ✅ DONE
- Added APK/IPA building as premium features in mobile system prompt
- Clarified three preview options:
  - In-browser React Native Web preview (free, instant)
  - Expo Go QR code (free)
  - Real APK build (50 credits, premium)
  - Real IPA build (50 credits, premium)
- Provided installation instructions (unknown sources for Android)
- Removed "download our mobile app" references

### 2. UI Type & State Management
- **File:** `src/components/editor/MobilePreviewPanel.tsx`
- **Status:** ✅ DONE
- Added 'apk' and 'ipa' as new preview modes
- Added BuildStatus type for tracking build progress
- Added state variables:
  - `apkStatus`, `apkUrl`, `apkError`
  - `ipaStatus`, `ipaUrl`, `ipaError`
  - `buildLoading`
- Added cost constants:
  - `APK_BUILD_COST = 50 credits`
  - `IPA_BUILD_COST = 50 credits`

### 3. Build Trigger Functions
- **Status:** ✅ READY TO ADD
- `triggerApkBuild()` function signature defined
- `triggerIpaaBuild()` function signature defined
- Both check credit balance before allowing build
- Both call `/api/mobile/build-apk` and `/api/mobile/build-ipa` endpoints

---

## Remaining Work ⚠️

### 1. UI Components in MobilePreviewPanel
**What's needed:**
- Add "Build APK" and "Build IPA" buttons to the toolbar (similar to appetize mode)
- Display cost badge (50 credits) next to each button
- Add APK/IPA as options in the mode segmented control:
  ```
  { v: 'apk', label: '📦 Build APK (50 credits)' },
  { v: 'ipa', label: '📦 Build IPA (50 credits)' },
  ```

### 2. APK/IPA Content Views
**What's needed:**
- Idle state: Show "Build APK" button with cost, platform requirements
  - "Ready for direct install or Google Play submission"
  - "Android 5.0+"
  - Cost: 50 credits
- Queued/Building state: Progress modal similar to Appetize
  - "Packaging Expo project..."
  - "Building Android APK..." or "Building iOS IPA..."
  - "Uploading to CDN..."
  - 5-10 minute estimate
- Ready state: Download link + installation instructions
  - For APK: "Enable unknown sources → Download APK → Tap to install"
  - For IPA: "Requires Mac + Xcode or Testflight account → Download IPA → Follow Xcode prompts"
- Error state: Retry button, error message

### 3. Backend Endpoints
**Files to create:**
- `src/app/api/mobile/build-apk/route.ts`
  - POST endpoint to trigger APK build via Expo EAS
  - Validate project ownership
  - Deduct 50 credits
  - Return status + download URL
  - Poll Expo EAS for completion

- `src/app/api/mobile/build-ipa/route.ts`
  - POST endpoint to trigger IPA build via Expo EAS
  - Validate project ownership
  - Deduct 50 credits
  - Return status + download URL
  - Poll Expo EAS for completion

### 4. Database Schema
**What's needed:**
- Add to `mobile_builds` table:
  - `id` (uuid, primary key)
  - `project_id` (uuid, foreign key)
  - `user_id` (uuid, foreign key)
  - `platform` (enum: 'apk' | 'ipa')
  - `status` (enum: 'queued' | 'building' | 'ready' | 'error')
  - `build_url` (text, download link)
  - `eas_build_id` (text, Expo EAS build ID)
  - `error_message` (text, nullable)
  - `created_at` (timestamp)
  - `completed_at` (timestamp, nullable)
- Add indexes on `project_id`, `user_id`, `platform`

---

## Architecture Overview

```
User clicks "Build APK" (50 credits)
        ↓
MobilePreviewPanel sets mode='apk' & calls triggerApkBuild()
        ↓
POST /api/mobile/build-apk
  ├─ Validate project ownership
  ├─ Check credits (deduct 50)
  ├─ Create mobile_builds row (status: queued)
  ├─ Call Expo EAS API to start build
  ├─ Return { status: 'queued', eas_build_id: '...' }
  └─ Start background poll
        ↓
MobilePreviewPanel enters "Building..." state
  ├─ Show progress steps
  ├─ Poll /api/mobile/build-apk?eas_build_id=... every 5 seconds
  └─ Update status as build progresses
        ↓
When build ready (or fails):
  ├─ Return { status: 'ready', build_url: 'https://...' }
  ├─ Show download link + instructions
  └─ Store in mobile_builds table

User downloads APK/IPA, installs on device
```

---

## Integration Checklist

- [ ] Add APK/IPA UI components to MobilePreviewPanel toolbar
- [ ] Add APK/IPA content views (idle, building, ready, error states)
- [ ] Create backend endpoints (/api/mobile/build-apk, /api/mobile/build-ipa)
- [ ] Create/migrate database schema (mobile_builds table)
- [ ] Implement Expo EAS API integration
- [ ] Add credit deduction logic
- [ ] Add polling mechanism for build status
- [ ] Add error handling and retry logic
- [ ] Test APK build end-to-end
- [ ] Test IPA build end-to-end
- [ ] Add telemetry for APK/IPA builds
- [ ] Update documentation with APK/IPA workflow

---

## Git Commits
- `20d5565` - feat: enhance web/app, mobile, and pricing for all project types
- `b4f1609` - docs: add comprehensive project refactor summary
- `6c89833` - feat: add APK/IPA build types and state management

---

## Next Steps

The foundation is in place. To complete:
1. Add UI buttons and mode options in MobilePreviewPanel
2. Create content views for each APK/IPA state
3. Build backend endpoints to trigger Expo EAS
4. Wire up polling for build status updates
5. Implement credit deduction and database persistence
6. End-to-end testing on real devices
