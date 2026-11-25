const intro = document.querySelector('#intro')
const startButton = document.querySelector('#start')
const statusPill = document.querySelector('#status')
const sceneRoot = document.querySelector('#scene-root')
const closeButton = document.querySelector('#close')
const errorBox = document.querySelector('#error')

let targetData
let engineReady = false
let sceneStarted = false

function setStatus(message) {
  statusPill.textContent = message
}

function showError(message) {
  errorBox.hidden = false
  errorBox.textContent = message
  startButton.disabled = true
}

async function loadTarget() {
  try {
    const response = await fetch('/image-targets/aura-pack.json')
    if (!response.ok) throw new Error('The processed image target is missing.')
    targetData = await response.json()
    // CLI output uses a local relative path. The generated image is colocated
    // with the target JSON when following the setup instructions.
    if (targetData.imagePath && !/^(https?:|data:|\/)/i.test(targetData.imagePath)) {
      const filename = targetData.imagePath.replaceAll('\\', '/').split('/').pop()
      targetData.imagePath = `/image-targets/${filename}`
    }
    updateReadyState()
  } catch (error) {
    showError('Image target setup is incomplete. Follow the README to process the sample package artwork, then reload this page.')
    console.error(error)
  }
}

function updateReadyState() {
  if (engineReady && targetData) {
    startButton.disabled = false
    startButton.textContent = 'Start camera'
    setStatus('Ready · sample package target loaded')
  }
}

function onEngineLoaded() {
  if (!window.XR8?.XrController) {
    engineReady = false
    startButton.disabled = true
    startButton.textContent = 'AR engine failed to load'
    setStatus('The AR engine did not initialize. Reload this page to retry.')
    return
  }
  engineReady = true
  updateReadyState()
}

window.addEventListener('xrloaded', onEngineLoaded)
if (window.XR8?.XrController) onEngineLoaded()

loadTarget()

startButton.addEventListener('click', () => {
  if (!engineReady || !targetData || sceneStarted) return
  sceneStarted = true
  startButton.disabled = true
  setStatus('Allow camera access, then point at the package')

  // Configure the target before creating the xrweb scene so it is present
  // when the camera pipeline starts.
  window.XR8.XrController.configure({
    imageTargetData: [targetData],
    disableWorldTracking: true,
  })

  sceneRoot.innerHTML = `
    <a-scene
      xrweb="disableWorldTracking: true"
      xrextras-loading
      xrextras-runtime-error
      renderer="colorManagement: true; physicallyCorrectLights: true"
      vr-mode-ui="enabled: false"
      device-orientation-permission-ui="enabled: false">
      <a-camera position="0 0 0" raycaster="objects: .clickable" cursor="fuse: false; rayOrigin: mouse"></a-camera>
      <a-entity light="type: ambient; intensity: 1.1"></a-entity>
      <a-entity light="type: directional; intensity: 1.5" position="1 3 2"></a-entity>

      <a-entity xrextras-named-image-target="name: aura-pack" id="pack-target">
        <a-entity position="0 0.22 0.015" animation="property: position; from: 0 0.20 0.015; to: 0 0.27 0.015; dir: alternate; loop: true; dur: 1400; easing: easeInOutSine">
          <a-torus color="#d5f26b" radius="0.24" radius-tubular="0.008" rotation="0 0 0"></a-torus>
          <a-sphere color="#d5f26b" radius="0.035" position="0.24 0 0" material="emissive: #a7d64f; emissiveIntensity: 0.5"></a-sphere>
        </a-entity>
        <a-cylinder position="0 0.18 0.025" radius="0.19" height="0.035" color="#d5f26b" material="metalness: 0.12; roughness: 0.38"></a-cylinder>
        <a-cylinder position="0 0.16 0.024" radius="0.15" height="0.025" color="#f5f3e9"></a-cylinder>
        <a-text value="AURA" align="center" color="#193323" width="1.3" position="0 0.155 0.04" scale="0.36 0.36 0.36" font="https://cdn.aframe.io/fonts/mozillavr.fnt"></a-text>
        <a-text value="BOTANICALS" align="center" color="#193323" width="1.2" position="0 0.11 0.04" scale="0.13 0.13 0.13" font="https://cdn.aframe.io/fonts/mozillavr.fnt"></a-text>
        <a-text value="A brighter kind of refreshment" align="center" color="#f5f3e9" width="1.6" position="0 -0.16 0.025" scale="0.18 0.18 0.18" font="https://cdn.aframe.io/fonts/mozillavr.fnt"></a-text>
        <a-entity position="-0.26 -0.04 0.02" animation="property: rotation; to: 0 0 360; loop: true; dur: 9000; easing: linear">
          <a-sphere color="#f3a66f" radius="0.045" position="0.48 0.02 0"></a-sphere>
          <a-sphere color="#9dd5a1" radius="0.035" position="0.26 0.28 0.01"></a-sphere>
          <a-sphere color="#d5f26b" radius="0.03" position="0.03 0.24 0"></a-sphere>
        </a-entity>
        <a-plane class="clickable" position="0 -0.38 0.03" width="0.67" height="0.13" color="#d5f26b" material="side: double" onclick="document.querySelector('#status').textContent='Nice. This interaction is anchored to the package.'">
          <a-text value="TAP TO DISCOVER" align="center" color="#172018" width="1.8" position="0 0 0.012" scale="0.15 0.15 0.15" font="https://cdn.aframe.io/fonts/mozillavr.fnt"></a-text>
        </a-plane>
      </a-entity>
    </a-scene>`

  const scene = sceneRoot.querySelector('a-scene')
  scene.addEventListener('realityready', () => {
    setStatus('Scanning · move the package slowly into view')
  })
  scene.addEventListener('xrimagescanning', () => {
    setStatus('Scanning · hold the package in good light')
  })
  scene.addEventListener('xrimagefound', event => {
    if (event.detail.name === 'aura-pack') setStatus('Package recognized · move it to test tracking')
  })
  scene.addEventListener('xrimagelost', event => {
    if (event.detail.name === 'aura-pack') setStatus('Target lost · bring the package back into view')
  })
  scene.addEventListener('realityerror', event => {
    console.error('8th Wall camera error', event.detail)
    showError('The camera could not start. Open this demo over HTTPS in Safari or Chrome, allow camera access, and try again.')
  })

  intro.hidden = true
  closeButton.hidden = false
})

closeButton.addEventListener('click', () => window.location.reload())
