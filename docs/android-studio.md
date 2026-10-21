# Open Jom! in Android Studio

The native project is **`apps/mobile/android`**. It is checked in, generated from Expo SDK 57.0.29, and uses the existing React Native/Expo application. Application ID: `com.aanatidae.jom`. The launcher name is Jom!; the `jom://` deep link is preserved. Opening this folder imports the Gradle project directly; opening the repository root does not import an Android Gradle project.

## First open

1. On a fresh clone, run `npm ci` from the repository root. Gradle resolves Expo, React Native, native modules and the React Native Gradle plugin from the npm workspace. Do not run a separate npm install inside Android.
2. In Android Studio, choose **File > Open**, select `apps/mobile/android`, and trust your local project.
3. Use the **Gradle wrapper** and the project's checked-in **Daemon JVM criteria (Java 17)**. Modern Android Studio reads `gradle/gradle-daemon-jvm.properties`; Gradle selects an installed JDK 17 or provisions Temurin 17 from the official Adoptium endpoint. If Studio asks you to choose a Gradle JDK, select/download **Java 17** in **Settings > Build, Execution, Deployment > Build Tools > Gradle**. Do not select this machine's bundled JBR 25 or system JDK 27 for this build: the first native build reproduced an AGP Prefab/JNA warning-parser failure with Java 25. The criteria avoid it without changing global Java settings.
4. Let Gradle sync. This project uses compile/target SDK 36, build tools 36.0.0, NDK 27.1.12297006 and min SDK 24 (Android 7). Install requested SDK components through SDK Manager if they are not installed. Android Studio manages your local SDK path in `local.properties`; this file stays ignored.
5. Select the **app** configuration, the **debug** build variant and your connected Android phone or emulator, then click **Run**. Debug signing uses the Android Gradle plugin's locally generated debug key; no shared keystore needs to be copied into the repository.

There is no dependency on Expo Go for this native app. The debug app still needs Metro for JavaScript and FastAPI for route calculations.

## Run Metro and the API

From the repository root, start the API in one PowerShell terminal:

```powershell
.\.venv\Scripts\python.exe -m uvicorn services.api.app.main:app --host 127.0.0.1 --port 8000
```

In another root terminal, start Metro:

```powershell
$env:EXPO_PUBLIC_API_BASE_URL = "http://127.0.0.1:8000"
npm run start --workspace mobile -- --port 8081
```

If the debug app stays white or Metro `/status` does not answer after a heavy first native build, stop/restart Metro; use `npm run start --workspace mobile -- --port 8081 --clear` to rebuild its cache if necessary. This host reproduced a stalled server, then a cache-deserialization warning and successful full-crawl recovery on restart. Reload the app after Metro answers `http://127.0.0.1:8081/status` with `packager-status:running`.

Keep the existing `apps/mobile/.env.local` configuration for Supabase. For an explicitly device-only demo, set `$env:EXPO_PUBLIC_DATA_MODE = "local"` before starting Metro; this does not synchronize local content to Supabase. See the main README for Python/npm installation and public environment configuration. Do not copy private keys into Gradle or the app.

For a USB-debuggable phone, enable Developer options/USB debugging, connect it using a data cable and accept its authorization prompt. In a third PowerShell terminal:

```powershell
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
& $adb devices
& $adb -d reverse tcp:8000 tcp:8000
& $adb -d reverse tcp:8081 tcp:8081
```

`-d` targets the physical phone instead of a running emulator. If several physical devices are attached, replace `-d` with `-s YOUR_DEVICE_SERIAL`. For an emulator use `-e`, or its explicit serial, for both reverse commands. You can also choose your physical device in Android Studio. Grant foreground precise location when starting a walk. The merged manifest includes fine/coarse location, with no background-location or foreground-location-service permission. AndroidX WorkManager contributes its generic `FOREGROUND_SERVICE` permission and framework services; these do not implement background walking navigation.

If the device is `unauthorized`, unlock it and accept USB debugging. If it is missing, check the data cable, USB mode and manufacturer ADB driver. When disconnected from USB, these loopback forwards no longer provide a backend connection. `10.0.2.2` is an Android emulator host address, not the address for a physical phone. A phone without USB needs an explicitly reachable computer/server address and the corresponding network configuration.

## Terminal build and APK

From the Android project folder in PowerShell (the SDK path below matches this Windows installation). Java 17 daemon selection is handled by the checked-in criteria:

```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
.\gradlew.bat :app:assembleDebug
```

The installable debug APK is generated at `apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk`. Android Studio Run builds and installs it for the selected device. Alternatively, `npm run android` from the repository root uses Expo's native build/device selector. Only use one build at a time while Gradle sync/build is running.

The default build includes the configured React Native ABIs. To build just a typical arm64 phone and the x86_64 emulator:

```powershell
.\gradlew.bat :app:assembleDebug "-PreactNativeArchitectures=arm64-v8a,x86_64"
```

This is a development APK requiring Metro. Release signing/distribution and a hosted routing API are separate work; the release variant is intentionally not signed with a debug key.

## Native configuration and regeneration

- Native Android sources, launcher resources, manifests, Gradle files and wrapper are tracked. Build output, `.gradle`, `.cxx`, IDE state, local SDK paths, debug/release keystores and APK/AAB output are ignored.
- The Java 17 daemon criteria and provisioning URLs are generated by the same config plugin, so regeneration retains the working native toolchain. The first automatic download needs internet; downloaded JDKs remain in the local Gradle cache.
- App CMake intermediates use the ignored repository `.local/cxx/app` directory. The default nested Android `.cxx` path reproduced Ninja's Windows 260-character failure for generated Gesture Handler code; the shorter staging directory lets CMake hash that object path successfully. Keep a short checkout path on Windows (this workspace is `C:\Codex\Jom! - SimeDarby`). No registry or global long-path settings are changed.
- Set app identity/permissions in `apps/mobile/app.json`, plugin wiring in `app.config.js`, and portable Gradle customizations in `plugins/withAndroidStudio.js`.
- Run `npm run android:prebuild` from the root after changing native app configuration. This uses installed Expo 57 and `--platform android --no-install`; review generated differences and any script edits before committing. Regeneration may replace generated Android files; do not keep unique manual native changes outside config plugins. It does not need to run just to open Android Studio.
- The default Leaflet map needs no key. Optional native Google Maps uses a `${GOOGLE_MAPS_ANDROID_API_KEY}` manifest placeholder. Supply `GOOGLE_MAPS_ANDROID_API_KEY` in your **user-local** `~/.gradle/gradle.properties` or the build environment and restrict it by package/signing certificate. Never replace the tracked placeholder with a real key. Set `EXPO_PUBLIC_MAP_RENDERER=native` for Metro only when testing that optional renderer.
- Expo's existing `userInterfaceStyle` warning recommends the optional `expo-system-ui` module. No unrelated dependency was added for this warning; Jom!'s existing UI tokens remain unchanged.

## Verification

Verified on Windows, 2026-10-21:

- Final `:app:assembleDebug "-PreactNativeArchitectures=arm64-v8a,x86_64" --max-workers=2` succeeds: 392 tasks, 6m20s for the final run after correcting two first-build failures. The APK contains both ABIs and is 143,088,785 bytes. Gradle wrapper 9.3.1 automatically selects cached Temurin 17.0.20.1 even when launched by JBR 25. [Build/ABI/hash evidence](android-studio/build-verification.json).
- First build failed when AGP Prefab interpreted JDK 25/JNA warnings on stderr as errors despite exit 0. Java 17 criteria fix that. Second build failed on a generated Gesture Handler filename longer than 260 characters; shorter app CMake staging fixes that. No dependency source patches or global registry changes.
- ADB successfully installed and launched `com.aanatidae.jom/.MainActivity` on the API 37 emulator. Native first-run onboarding, real Leaflet tiles/route preview and FastAPI route response inspected. [Preview](android-studio/native-preview-final.png), [onboarding](android-studio/native-onboarding.png).
- Actual Android precise foreground permission prompt accepted, then native Expo GPS subscription observed. Simulated emulator fixes through the normal location API changed remaining route distance **316 m to 308 m**. Stop removed the app's native GPS request. [Permission](android-studio/native-permission.png), [active](android-studio/native-active.png), [progress](android-studio/native-progress.png), [registration readback](android-studio/location-registration.json). Tracking is stopped; GPS returned to the test's starting point. No hosted submissions or original Expo Go preference changes.
- Final `npm run check`: Expo lint, strict TypeScript and **128 tests / 18 suites pass**. No dependency or lockfile change.
- **Full Android lint is not passing:** `:app:lintDebug` reaches `:react-native-worklets:lintAnalyzeDebug` and the dependency Kotlin UAST/Gradle-script analyzer throws `Cannot find a KaModule for the VirtualFile`. It was not disabled or counted as success. This does not prevent the verified debug APK build/install/run. Raw diagnostics remain in ignored `.local/android-lint-final.log`; no SDK/AGP/library upgrade was forced solely to suppress it.
- Physical phone execution, Android Studio GUI import/sync, signed release distribution and outdoor GPS were not tested. This verifies a real standalone native APK in the emulator, rather than only Expo Go or a JavaScript export. Existing real Night/Step-Free data and foreground-only limits remain in `docs/navigation/results.md`.

Task-owned API and Metro are left running in explicit local persistence mode for review. No push is performed for this new milestone.

Official references: [Expo local Android builds](https://docs.expo.dev/guides/local-app-development/), [Expo native generation](https://docs.expo.dev/workflow/continuous-native-generation/), [Android hardware-device setup](https://developer.android.com/studio/run/device), [Android Gradle JDK configuration](https://developer.android.com/build/jdks), [Gradle daemon criteria and provisioning](https://docs.gradle.org/current/userguide/gradle_daemon.html#sec:daemon_jvm_criteria).
