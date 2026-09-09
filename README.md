# Boo Motion Lab

Private development repository for the Boo companion-robot simulator. Run up to five sloth-shaped Boos in one scene, select one to control, and let the others continue their movements and sensor reactions.

## Run locally

Install Node.js 24 LTS and npm. From this folder:

```sh
npm ci
npm run dev -- --port 3000
```

Open http://localhost:3000 in a browser with WebGL enabled. The supplied GLB and Draco decoder are included; no GitHub, OpenAI or physical-robot credentials are needed to run the simulation locally.

## Controls

- **Add Boo** adds another robot, up to five. Select its name or interact with it in the scene.
- **Joints** controls two arms, neck yaw/pitch and paired upper eyelids driven by one motor.
- **Body** changes placement and posture, including belly sleeping, sitting and sleeping on the back. Legs are passive.
- **Sensors** simulates touch, MPU6050 orientation, LD2420 human detection and SCS0009 servo states.
- **Scenarios** configures sensor reactions separately for each Boo.
- **Sequence** captures, plays, imports and exports joint movements for the selected Boo.
- The person, target and ball are shared scene objects. Robot-to-robot collisions are not modeled.

Each browser tab has its own scene. This is not a synchronized multiplayer application. Scene state is held in memory and is lost on refresh; use sequence export to keep authored joint movements.

## Validate changes

```sh
npm test
npm run typecheck
npm run build
```

The tests cover joint interpolation, servo and sensor behavior, gravity, ground contact, compressed model loading and five independent CAD model hierarchies. A successful build does not substitute for checking the interactive application in a browser.

## Project layout

- `app/page.tsx`: per-Boo controller state and control interface.
- `app/Scene.tsx`: shared Three.js scene and independent robot simulation loops.
- `app/robotV2.ts`, `app/kinematics.ts`, `app/urdfJoints.ts`: supplied CAD articulation and pivot references.
- `app/hardware.ts`, `app/scenarios.ts`: simulated hardware and sensor-driven reactions.
- `app/contact.ts`, `app/body.ts`: approximate support and drop physics.
- `public/models/boo-v2.glb`: rendering model required by the application.
- `public/draco/`: local decoder for the compressed GLB.

## Privacy and deployment

### Optional browser-only build

`npm run build:pages` creates `dist-pages/`, a standalone static build using the `/boo-motion-lab/` base path. `npm run preview:pages` serves that build locally. The normal development and Sites build commands remain available. No publication is triggered by either command.

GitHub Pages on a personal account serves a public website, even when the source repository is private. Private-repository Pages also requires an eligible GitHub plan. Publishing is intentionally not enabled until the owner confirms the website audience. Private access-controlled Pages requires an eligible Enterprise Cloud organization; a personal private repository is not a website access control.

Keep this repository private. Repository collaborators can download the included application and GLB. Mechanical STEP exports, local CAD tooling, dependency folders, generated builds and environment files are excluded.

`.openai/hosting.json` identifies the existing Sites project for the owner; it contains no authentication credential. Its presence does not grant collaborators permission to publish. The repository does not automatically deploy, enable GitHub Pages or change access to the hosted simulator. Keep credentials out of Git, including commit history. Use platform-managed secrets if future server features require them.

Use branches and pull requests for future changes. Keep the working local project connected to this repository so improvements can be reviewed and synchronized without transferring files manually.

## Modeling limits

This is a concept simulator, not a motor-sizing or safety-validation tool. Servo load and temperature are illustrative. Plush deformation, detailed linkage loads and robot-to-robot collisions are not simulated. The V2 outer CAD is retained at native scale and 1.5 kg is a target mass.

No open-source license is granted for the Boo-specific code or design assets by this repository. Third-party libraries and bundled decoder files retain their respective licenses.

## Voice and hearing simulation

The Voice & Hearing tab sends five scripted phrases or a loud-sound cue from the shared person marker. Use Person X/Z or movement to position the source; each Boo uses distance, yaw, noise and sleep state to evaluate detection independently. Selected-only mode isolates a test. Left/right meters are illustrative, not a model of a specific microphone.

Browser speech synthesis speaks the phrases where available; Web Audio generates six placeholder vocal sounds. No microphone is recorded, no speech is recognized, and no LLM is connected. Touch held during speech produces a contented response. Repeated recognized calls within 15 seconds wake a sleepy Boo. Voice motion temporarily suspends sensor scenarios and restores them after completion; manual joint commands take priority. Audio can be muted, previewed, replayed or stopped independently of the existing movement Pause control.
