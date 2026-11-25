const intro = document.querySelector('#intro')
const startButton = document.querySelector('#start')
const statusPill = document.querySelector('#status')
const sceneRoot = document.querySelector('#scene-root')
const closeButton = document.querySelector('#close')
const replayButton = document.querySelector('#replay')
const errorBox = document.querySelector('#error')

let targetData
let engineReady = false
let sceneStarted = false
let mob
let crumbs
let rupture

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
    const response = await fetch('/image-targets/chips-ahoy.json')
    if (!response.ok) throw new Error('The Chips Ahoy image target is missing.')
    targetData = await response.json()
    if (targetData.imagePath && !/^(https?:|data:|\/)/i.test(targetData.imagePath)) {
      const filename = targetData.imagePath.replaceAll('\\', '/').split('/').pop()
      targetData.imagePath = `/image-targets/${filename}`
    }
    updateReadyState()
  } catch (error) {
    showError('The Chips Ahoy target is not prepared yet. Follow the README to process the package image, then reload.')
    console.error(error)
  }
}

function updateReadyState() {
  if (engineReady && targetData) {
    startButton.disabled = false
    startButton.textContent = 'Start camera'
    setStatus('Ready · Chips Ahoy target loaded')
  }
}

function onEngineLoaded() {
  if (!window.XR8?.XrController?.configure) {
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
if (window.XR8?.XrController?.configure) onEngineLoaded()
loadTarget()

function registerRupture() {
  const {AFRAME} = window
  if (AFRAME.components['pack-rupture']) return

  // Draw both layers in the marker plane. The inner layer leaves a torn paper rim.
  AFRAME.registerComponent('pack-rupture', {
    init() {
      const {THREE} = AFRAME
      const outline = [
        [-0.27, 0.04], [-0.21, 0.10], [-0.24, 0.17], [-0.11, 0.15],
        [-0.05, 0.24], [0.03, 0.17], [0.15, 0.21], [0.17, 0.12],
        [0.27, 0.10], [0.23, 0.02], [0.26, -0.07], [0.15, -0.09],
        [0.12, -0.17], [0.02, -0.13], [-0.07, -0.19], [-0.12, -0.11],
        [-0.23, -0.13], [-0.21, -0.04],
      ]
      const shape = new THREE.Shape()
      shape.moveTo(...outline[0])
      for (const point of outline.slice(1)) shape.lineTo(...point)
      shape.closePath()

      this.geometry = new THREE.ShapeGeometry(shape)
      this.rim = new THREE.MeshBasicMaterial({color: '#ffdc9b'})
      this.interior = new THREE.MeshBasicMaterial({color: '#171122'})
      const tear = new THREE.Mesh(this.geometry, this.rim)
      const shadow = new THREE.Mesh(this.geometry, this.interior)
      shadow.position.z = 0.003
      shadow.scale.set(0.89, 0.83, 1)
      tear.add(shadow)
      this.el.setObject3D('mesh', tear)
    },

    remove() {
      this.el.removeObject3D('mesh')
      this.geometry.dispose()
      this.rim.dispose()
      this.interior.dispose()
    },
  })
}

function replayBurst() {
  if (!mob || !crumbs || !rupture) return
  rupture.emit('packburst', null, false)
  mob.object3D.scale.setScalar(0.001)
  mob.emit('mobburst', null, false)
  for (const arm of mob.querySelectorAll('[animation__leftarm], [animation__rightarm]')) {
    arm.emit('mobburst', null, false)
  }
  for (const fragment of crumbs.children) {
    const {from} = fragment.getAttribute('animation__fly')
    fragment.object3D.position.copy(window.AFRAME.utils.coordinates.parse(from))
    fragment.emit('crumbburst', null, false)
  }
}

startButton.addEventListener('click', () => {
  if (!engineReady || !targetData || sceneStarted) return
  sceneStarted = true
  startButton.disabled = true
  setStatus('Allow camera access, then point at the package')

  registerRupture()
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
      <a-entity light="type: ambient; intensity: 1.25"></a-entity>
      <a-entity light="type: directional; intensity: 1.4" position="-1 2 3"></a-entity>

      <a-entity xrextras-named-image-target="name: chips-ahoy" id="pack-target">
        <a-entity id="pack-rupture" pack-rupture visible="false" position="0 0 0.018" scale="0.001 0.001 1"
          animation__tear="property: scale; from: 0.001 0.001 1; to: 1 1 1; dur: 190; easing: easeOutBack; startEvents: packburst"></a-entity>
        <a-entity id="crumb-burst" visible="false">
          <a-box position="-0.22 0.08 0.04" scale="0.09 0.025 0.025" color="#f4d39d" animation__fly="property: position; from: -0.22 0.08 0.04; to: -0.42 0.29 0.22; dur: 540; easing: easeOutCubic; delay: 85; startEvents: crumbburst"></a-box>
          <a-box position="0.19 0.03 0.04" scale="0.07 0.035 0.025" color="#4aa8e8" animation__fly="property: position; from: 0.19 0.03 0.04; to: 0.38 0.2 0.12; dur: 490; easing: easeOutCubic; delay: 85; startEvents: crumbburst"></a-box>
          <a-box position="0.08 -0.16 0.04" scale="0.055 0.035 0.025" color="#e9b96d" animation__fly="property: position; from: 0.08 -0.16 0.04; to: 0.32 -0.34 0.19; dur: 610; easing: easeOutCubic; delay: 85; startEvents: crumbburst"></a-box>
          <a-box position="-0.1 -0.18 0.04" scale="0.035 0.08 0.025" color="#1c5ea3" animation__fly="property: position; from: -0.1 -0.18 0.04; to: -0.29 -0.36 0.15; dur: 560; easing: easeOutCubic; delay: 85; startEvents: crumbburst"></a-box>
          <a-box position="0 0 0.025" scale="0.14 0.08 0.014" color="#247ac7"
            animation__fly="property: position; from: 0 0 0.025; to: 0.19 0.36 0.48; dur: 500; easing: easeOutCubic; delay: 85; startEvents: crumbburst"
            animation__spin="property: rotation; from: 0 0 5; to: 260 100 120; dur: 500; easing: easeOutCubic; delay: 85; startEvents: crumbburst"></a-box>
        </a-entity>

        <a-entity id="snack-mob" visible="false" position="0 -0.06 0.024" scale="0.001 0.001 0.001"
          animation__breakout="property: position; from: 0 -0.06 0.024; to: 0 0.12 0.48; delay: 110; dur: 540; easing: easeOutBack; startEvents: mobburst"
          animation__emerge="property: scale; from: 0.001 0.001 0.001; to: 1 1 1; delay: 110; dur: 330; easing: easeOutCubic; startEvents: mobburst"
          animation__twist="property: rotation; from: 24 0 -25; to: 0 0 0; delay: 110; dur: 460; easing: easeOutBack; startEvents: mobburst">
          <!-- Original voxel-style snack creature assembled from primitives. -->
          <a-box position="0 0.25 0" width="0.30" height="0.27" depth="0.22" color="#66b83f" material="roughness: 0.86"></a-box>
          <a-box position="0 0.04 0" width="0.24" height="0.20" depth="0.18" color="#3c8c38" material="roughness: 0.9"></a-box>
          <a-box position="-0.075 0.28 0.116" width="0.052" height="0.07" depth="0.025" color="#f8f4df"></a-box>
          <a-box position="0.075 0.28 0.116" width="0.052" height="0.07" depth="0.025" color="#f8f4df"></a-box>
          <a-box position="-0.075 0.28 0.132" width="0.022" height="0.04" depth="0.012" color="#202a2c"></a-box>
          <a-box position="0.075 0.28 0.132" width="0.022" height="0.04" depth="0.012" color="#202a2c"></a-box>
          <a-box position="0 0.19 0.124" width="0.10" height="0.027" depth="0.018" color="#253829"></a-box>
          <a-box position="0 0.025 0.102" width="0.12" height="0.085" depth="0.02" color="#d9a34c"></a-box>
          <a-box position="-0.045 0.04 0.115" width="0.018" height="0.018" depth="0.012" color="#4b3020"></a-box>
          <a-box position="0.018 0.006 0.115" width="0.02" height="0.02" depth="0.012" color="#4b3020"></a-box>
          <a-box position="0.045 0.055 0.115" width="0.015" height="0.015" depth="0.012" color="#4b3020"></a-box>
          <a-box position="-0.19 0.04 0" width="0.09" height="0.11" depth="0.10" color="#55a83d" animation__leftarm="property: rotation; from: 0 0 -72; to: 0 0 -22; dur: 360; easing: easeOutBack; startEvents: mobburst"></a-box>
          <a-box position="0.19 0.04 0" width="0.09" height="0.11" depth="0.10" color="#55a83d" animation__rightarm="property: rotation; from: 0 0 72; to: 0 0 22; dur: 360; easing: easeOutBack; startEvents: mobburst"></a-box>
          <a-box position="-0.075 -0.13 0" width="0.085" height="0.12" depth="0.11" color="#347c34"></a-box>
          <a-box position="0.075 -0.13 0" width="0.085" height="0.12" depth="0.11" color="#347c34"></a-box>
          <a-text value="SNACK MONSTER!" align="center" color="#fff6d8" width="1.5" position="0 0.49 0.02" scale="0.24 0.24 0.24" font="https://cdn.aframe.io/fonts/mozillavr.fnt"></a-text>
        </a-entity>
      </a-entity>
    </a-scene>`

  const scene = sceneRoot.querySelector('a-scene')
  mob = scene.querySelector('#snack-mob')
  crumbs = scene.querySelector('#crumb-burst')
  rupture = scene.querySelector('#pack-rupture')
  scene.addEventListener('realityready', () => setStatus('Scanning · bring the package into view'))
  scene.addEventListener('xrimagescanning', () => setStatus('Scanning · hold the package in good light'))
  scene.addEventListener('xrimagefound', event => {
    if (event.detail.name !== 'chips-ahoy') return
    mob.setAttribute('visible', true)
    crumbs.setAttribute('visible', true)
    rupture.setAttribute('visible', true)
    replayBurst()
    setStatus('Mob breakout! Keep the pack in view')
    replayButton.hidden = false
  })
  scene.addEventListener('xrimagelost', event => {
    if (event.detail.name !== 'chips-ahoy') return
    mob.setAttribute('visible', false)
    crumbs.setAttribute('visible', false)
    rupture.setAttribute('visible', false)
    replayButton.hidden = true
    setStatus('Target lost · bring the package back into view')
  })
  scene.addEventListener('realityerror', event => {
    console.error('8th Wall camera error', event.detail)
    showError('The camera could not start. Open this demo over HTTPS in Safari or Chrome and allow camera access.')
  })

  intro.hidden = true
  closeButton.hidden = false
})

replayButton.addEventListener('click', replayBurst)
closeButton.addEventListener('click', () => window.location.reload())
