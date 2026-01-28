import React, { useRef, useEffect, useState } from 'react'
import * as faceapi from '@vladmandic/face-api'

// Enhanced CameraPreview with face detection, eye tracking, head pose, and gaze detection
export default function CameraPreview({zones=3, rows=2, onMetrics, running=true, anonymize=false, sampleIntervalMs=3000, mode='lecture'}){
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const overlayCanvasRef = useRef(null)
  const prevImageRef = useRef(null)
  const timerRef = useRef(null)
  const streamRef = useRef(null)
  const [error, setError] = useState('')
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [faceDetections, setFaceDetections] = useState([])
  
  // Start with perfect score - only decrease when distracted
  const baselineScoreRef = useRef(100)
  
  // Track eyes closed frames per person (matching Python logic)
  const eyesClosedTimersRef = useRef({}) // { personIndex: frameCount }
  const sleepLoggedRef = useRef({}) // { personIndex: boolean }
  
  // Constants matching Python reference
  const EAR_THRESHOLD = 0.21
  const EYE_WAIT_FRAMES = 30 // 30 frames = ~10 seconds at 3s intervals
  const SLEEP_DECAY = 100 / EYE_WAIT_FRAMES
  
  // Tracking counters
  const [counters, setCounters] = useState({
    eyesClosedCount: 0,
    headPoseWarnings: 0,
    gazeWarnings: 0,
    malpracticeWarnings: 0,
    peopleCount: 0,
    sleepingCount: 0
  })

  // Calculate Eye Aspect Ratio (EAR) - standard method for eye closure detection
  const calculateEAR = (eyePoints) => {
    if (eyePoints.length < 6) return 1.0
    
    // Vertical eye distances
    const A = Math.hypot(eyePoints[1].x - eyePoints[5].x, eyePoints[1].y - eyePoints[5].y)
    const B = Math.hypot(eyePoints[2].x - eyePoints[4].x, eyePoints[2].y - eyePoints[4].y)
    // Horizontal eye distance
    const C = Math.hypot(eyePoints[0].x - eyePoints[3].x, eyePoints[0].y - eyePoints[3].y)
    
    // EAR formula
    return (A + B) / (2.0 * C)
  }

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model'
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
        ])
        setModelsLoaded(true)
        console.log('Face-api models loaded successfully')
      } catch (err) {
        console.error('Failed to load face-api models:', err)
        setError('Failed to load face detection models')
      }
    }
    loadModels()
  }, [])

  const stopCamera = ()=>{
    try{
      if(timerRef.current){ clearInterval(timerRef.current); timerRef.current = null }
      const s = streamRef.current || videoRef.current?.srcObject
      if(s && s.getTracks){
        s.getTracks().forEach(t=>{ try{ t.stop() }catch(e){} })
      }
      if(videoRef.current){
        try{ videoRef.current.srcObject = null }catch(e){}
      }
      streamRef.current = null
      prevImageRef.current = null
    }catch(e){ console.warn('stopCamera error', e) }
  }

  useEffect(()=>{
    let mounted = true
    const start = async ()=>{
      try{
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 360 }, audio: false })
        if(!mounted) { if(stream && stream.getTracks) stream.getTracks().forEach(t=>t.stop()); return }
        streamRef.current = stream
        if(videoRef.current){
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(()=>{})
        }
        setError('')
      }catch(err){
        console.error('camera error', err)
        setError('Unable to access camera. Check browser permissions or close other apps using the camera.')
      }
    }

    start()
    return ()=>{ mounted=false; stopCamera() }
  },[])

  // whenever running toggles, start/stop camera and sampling appropriately
  useEffect(()=>{
    if(!running){
      stopCamera()
      return
    }

    // if running true but no stream, (re)start
    if(!streamRef.current){
      navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 360 }, audio: false })
        .then(stream=>{
          streamRef.current = stream
          if(videoRef.current){ videoRef.current.srcObject = stream; videoRef.current.play().catch(()=>{}) }
          setError('')
        }).catch(err=>{
          console.error('camera start error', err)
          setError('Unable to start camera. Verify permissions and that no other app is using it.')
        })
    }
  },[running])

  // Enhanced sampling with face detection
  useEffect(()=>{
    if(!running || !modelsLoaded) return
    
    const doSample = async ()=>{
      const v = videoRef.current
      if(!v || v.readyState < 2) return
      
      const w = 320, h = 180
      const c = canvasRef.current
      c.width = w; c.height = h
      const ctx = c.getContext('2d')
      ctx.drawImage(v,0,0,w,h)
      
      // Face detection
      let detections = []
      // Reset counters for this sample - only count current state
      let newCounters = {
        peopleCount: 0,
        eyesClosedCount: 0,
        headPoseWarnings: 0,
        gazeWarnings: 0,
        malpracticeWarnings: 0,
        sleepingCount: 0
      }
      let distractionPenalty = 0 // Penalty to subtract from baseline
      
      try {
        detections = await faceapi.detectAllFaces(v, new faceapi.TinyFaceDetectorOptions({
          inputSize: 224,
          scoreThreshold: 0.5
        }))
          .withFaceLandmarks()
          .withFaceExpressions()
        
        setFaceDetections(detections)
        newCounters.peopleCount = detections.length
        
        // If faces detected, person is present - start with good score
        if (detections.length > 0) {
          // Person is present, check for distractions
          detections.forEach((detection, index) => {
            const landmarks = detection.landmarks
            const expressions = detection.expressions
            
            // Eye closure detection using multiple methods
            const leftEye = landmarks.getLeftEye()
            const rightEye = landmarks.getRightEye()
            
            // Method 1: EAR (Eye Aspect Ratio)
            const leftEAR = calculateEAR(leftEye)
            const rightEAR = calculateEAR(rightEye)
            const avgEAR = (leftEAR + rightEAR) / 2.0
            
            // Method 2: Expression-based detection
            // INVERTED: When eyes are OPEN, neutral is high. When CLOSED, neutral is low
            const expressionBasedClosed = expressions.neutral < 0.3 || expressions.sad > 0.5
            
            // EAR: Lower values = closed eyes (this part is correct)
            const eyesClosedByEAR = avgEAR < 0.21
            
            // Combine both methods - eyes closed if EITHER detects it
            const eyesClosed = eyesClosedByEAR || expressionBasedClosed
            
            // Store values for debugging
            detection.earValue = avgEAR.toFixed(3)
            detection.neutralExp = expressions.neutral.toFixed(3)
            detection.sadExp = expressions.sad.toFixed(3)
            
            console.log(`Person ${index}: EAR=${avgEAR.toFixed(3)}, Neutral=${expressions.neutral.toFixed(3)}, Sad=${expressions.sad.toFixed(3)}, Closed=${eyesClosed}`)
            
            // Initialize tracking for this person if not exists
            if (!eyesClosedTimersRef.current[index]) {
              eyesClosedTimersRef.current[index] = 0
            }
            if (!sleepLoggedRef.current[index]) {
              sleepLoggedRef.current[index] = false
            }
            
            // SLEEP CHECK (matching Python logic)
            if (eyesClosed) {
              detection.eyesClosed = true
              eyesClosedTimersRef.current[index] += 1
              distractionPenalty += SLEEP_DECAY
              
              console.log(`Person ${index}: Eyes CLOSED - Timer=${eyesClosedTimersRef.current[index]}`)
              
              if (eyesClosedTimersRef.current[index] > EYE_WAIT_FRAMES) {
                // SLEEPING! (after 30 frames)
                newCounters.sleepingCount++
                distractionPenalty += 20
                detection.status = "SLEEPING!"
                
                if (!sleepLoggedRef.current[index]) {
                  console.log(`Person ${index}: 🚨 SLEEPING! Timer: ${eyesClosedTimersRef.current[index]}`)
                  sleepLoggedRef.current[index] = true
                }
              } else if (eyesClosedTimersRef.current[index] > 1) {
                // Show warning immediately after first frame
                newCounters.eyesClosedCount++
                distractionPenalty += 10
                detection.status = "Eyes Closed..."
                console.log(`Person ${index}: ⚠️ Eyes Closed... Timer: ${eyesClosedTimersRef.current[index]}`)
              }
            } else {
              // Eyes open - decrease timer
              detection.eyesClosed = false
              if (eyesClosedTimersRef.current[index] > 0) {
                eyesClosedTimersRef.current[index] -= 1
                console.log(`Person ${index}: ✅ Eyes OPEN, timer decreasing: ${eyesClosedTimersRef.current[index]}`)
              }
              sleepLoggedRef.current[index] = false
              detection.status = "FOCUSED"
            }
            
            // Head pose estimation (reuse leftEye and rightEye from above)
            const nose = landmarks.getNose()
            
            if (leftEye.length > 0 && rightEye.length > 0 && nose.length > 0) {
              const eyeCenter = {
                x: (leftEye[0].x + rightEye[3].x) / 2,
                y: (leftEye[0].y + rightEye[3].y) / 2
              }
              const noseCenter = {
                x: nose[3].x,
                y: nose[3].y
              }
              
              // Head pose detection - looking away significantly
              const headTurn = Math.abs(eyeCenter.x - noseCenter.x)
              if (headTurn > 25) { // Increased threshold
                newCounters.headPoseWarnings++
                distractionPenalty += 8
              }
              
              // Gaze direction
              const faceCenter = detection.detection.box.x + detection.detection.box.width / 2
              const gazeOffset = Math.abs(eyeCenter.x - faceCenter)
              if (gazeOffset > 30) { // Increased threshold
                newCounters.gazeWarnings++
                distractionPenalty += 5
              }
            }
            
            // Malpractice detection for exam mode
            if (mode === 'exam') {
              if (newCounters.headPoseWarnings > 0 || newCounters.gazeWarnings > 0) {
                newCounters.malpracticeWarnings++
              }
            }
          })
        } else {
          // No face detected - moderate penalty (might be temporary)
          distractionPenalty += 20
        }
        
      } catch (err) {
        console.warn('Face detection error:', err)
        // Don't penalize on detection errors
        distractionPenalty = 0
      }

      // Calculate score: Start at 100, subtract penalties
      const currentScore = Math.max(0, Math.min(100, baselineScoreRef.current - distractionPenalty))
      
      // Zone-based analysis - improved logic
      const img = ctx.getImageData(0,0,w,h)
      const prev = prevImageRef.current
      const zoneResults = {}
      const cols = zones
      const rowsCount = rows
      const zoneW = Math.floor(w/cols)
      const zoneH = Math.floor(h/rowsCount)

      // Initialize zones with current score
      for(let r=0;r<rowsCount;r++){
        for(let cidx=0;cidx<cols;cidx++){
          const key = `${r}-${cidx}`
          // Start zones at current score
          zoneResults[key] = currentScore
        }
      }

      if(prev){
        // Check which zones have faces
        detections.forEach(detection => {
          const box = detection.detection.box
          const faceCenterX = box.x + box.width / 2
          const faceCenterY = box.y + box.height / 2
          
          // Scale to our canvas size
          const scaledX = (faceCenterX / v.videoWidth) * w
          const scaledY = (faceCenterY / v.videoHeight) * h
          
          const colIdx = Math.min(cols-1, Math.floor(scaledX / zoneW))
          const rowIdx = Math.min(rowsCount-1, Math.floor(scaledY / zoneH))
          const key = `${rowIdx}-${colIdx}`
          
          // Zone with face gets the current score
          zoneResults[key] = currentScore
        })

        setCounters(newCounters)

        if(onMetrics){
          onMetrics({ 
            timestamp: Date.now(), 
            overall: Math.round(currentScore), 
            zones: zoneResults, 
            peopleCount: newCounters.peopleCount,
            eyesClosedCount: newCounters.eyesClosedCount,
            headPoseWarnings: newCounters.headPoseWarnings,
            gazeWarnings: newCounters.gazeWarnings,
            malpracticeWarnings: newCounters.malpracticeWarnings,
            sleepingCount: newCounters.sleepingCount,
            mode
          })
        }
      }

      prevImageRef.current = img
    }

    // initial warmup
    doSample()
    timerRef.current = setInterval(doSample, sampleIntervalMs)
    return ()=>{ if(timerRef.current){ clearInterval(timerRef.current); timerRef.current = null } }
  },[running, zones, rows, sampleIntervalMs, onMetrics, modelsLoaded, mode, counters])

  // Draw face detection overlay
  useEffect(() => {
    if (!overlayCanvasRef.current || !videoRef.current) return
    
    const canvas = overlayCanvasRef.current
    const video = videoRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    if (faceDetections.length === 0) return
    
    if (!anonymize) {
      faceDetections.forEach((detection, index) => {
        const box = detection.detection.box
        const eyesClosed = detection.eyesClosed || false
        const earValue = detection.earValue || 'N/A'
        
        // Draw face box
        ctx.strokeStyle = eyesClosed ? '#ff9500' : (mode === 'exam' ? '#ff3b30' : '#30d158')
        ctx.lineWidth = 3
        ctx.strokeRect(box.x, box.y, box.width, box.height)
        
        // Draw background for text
        ctx.fillStyle = eyesClosed ? 'rgba(255,149,0,0.9)' : (mode === 'exam' ? 'rgba(255,59,48,0.9)' : 'rgba(48,209,88,0.9)')
        ctx.fillRect(box.x, box.y - 30, 180, 28)
        
        // Draw person label with EAR value
        ctx.fillStyle = 'white'
        ctx.font = 'bold 16px -apple-system, sans-serif'
        ctx.fillText(`Person ${index + 1} (${earValue})`, box.x + 5, box.y - 10)
        
        // Draw landmarks (eyes)
        const leftEye = detection.landmarks.getLeftEye()
        const rightEye = detection.landmarks.getRightEye()
        
        ctx.fillStyle = eyesClosed ? '#ff9500' : '#30d158'
        leftEye.forEach(point => {
          ctx.beginPath()
          ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI)
          ctx.fill()
        })
        rightEye.forEach(point => {
          ctx.beginPath()
          ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI)
          ctx.fill()
        })
      })
    }
  }, [faceDetections, anonymize, mode])

  return (
    <div className="video-wrap" style={{position: 'relative'}}>
      <video ref={videoRef} playsInline muted style={{filter: anonymize ? 'blur(6px)' : 'none'}} />
      <canvas ref={overlayCanvasRef} style={{position: 'absolute', top: 0, left: 0, pointerEvents: 'none'}} />
      <canvas ref={canvasRef} style={{display:'none'}} />
      
      {error && (
        <div style={{position:'absolute',left:8,bottom:8,right:8,background:'rgba(0,0,0,0.7)',color:'#fff',padding:10,borderRadius:8,fontSize:12}}>
          {error}
        </div>
      )}
      
      {!modelsLoaded && (
        <div style={{position:'absolute',left:8,top:8,background:'rgba(241,196,15,0.9)',color:'#000',padding:8,borderRadius:4,fontSize:12}}>
          Loading face detection models...
        </div>
      )}
    </div>
  )
}
