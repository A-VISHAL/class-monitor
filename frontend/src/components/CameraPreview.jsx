import React, { useRef, useEffect, useState } from 'react'

// CameraPreview captures video, computes per-zone motion-based activity, and calls onMetrics periodically.
export default function CameraPreview({zones=3, rows=2, onMetrics, running=true, anonymize=false, sampleIntervalMs=3000}){
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const prevImageRef = useRef(null)
  const timerRef = useRef(null)
  const streamRef = useRef(null)

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
      }catch(err){ console.error('camera error', err) }
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
        }).catch(err=> console.error('camera start error', err))
    }
  },[running])

  // sampling
  useEffect(()=>{
    if(!running) return
    const doSample = async ()=>{
      const v = videoRef.current
      if(!v || v.readyState < 2) return
      const w = 320, h = 180
      const c = canvasRef.current
      c.width = w; c.height = h
      const ctx = c.getContext('2d')
      ctx.drawImage(v,0,0,w,h)
      const img = ctx.getImageData(0,0,w,h)

      // compute per-zone motion by comparing to prevImage
      const prev = prevImageRef.current
      const zoneResults = {}
      const cols = zones
      const rowsCount = rows
      const zoneW = Math.floor(w/cols)
      const zoneH = Math.floor(h/rowsCount)

      for(let r=0;r<rowsCount;r++){
        for(let cidx=0;cidx<cols;cidx++){
          const key = `${r}-${cidx}`
          zoneResults[key]=0
        }
      }

      if(prev){
        // sum absolute difference in luminance
        for(let y=0;y<h;y++){
          for(let x=0;x<w;x++){
            const i = (y*w + x)*4
            const l = 0.2126*img.data[i] + 0.7152*img.data[i+1] + 0.0722*img.data[i+2]
            const pl = prev.data[i]
            const diff = Math.abs(l - pl)
            const colIdx = Math.min(cols-1, Math.floor(x/zoneW))
            const rowIdx = Math.min(rowsCount-1, Math.floor(y/zoneH))
            const key = `${rowIdx}-${colIdx}`
            zoneResults[key] += diff
          }
        }
        // normalize per-zone
        const normalized = {}
        Object.entries(zoneResults).forEach(([k,v])=>{
          // max possible per-pixel diff ~255; zone size = zoneW*zoneH
          const maxVal = 255 * zoneW * zoneH
          let score = 100 - Math.min(100, Math.round((v / maxVal) * 100))
          // we invert (less motion => lower attention); tune as needed
          normalized[k] = score
        })

        // compute overall average
        const overall = Math.round(Object.values(normalized).reduce((s,n)=>s+n,0) / Object.values(normalized).length)

        if(onMetrics){
          onMetrics({ timestamp: Date.now(), overall, zones: normalized, facesDetected: 0 })
        }
      }

      prevImageRef.current = img
    }

    // initial warmup
    doSample()
    timerRef.current = setInterval(doSample, sampleIntervalMs)
    return ()=>{ if(timerRef.current){ clearInterval(timerRef.current); timerRef.current = null } }
  },[running, zones, rows, sampleIntervalMs, onMetrics])

  return (
    <div className="video-wrap">
      <video ref={videoRef} playsInline muted style={{filter: anonymize ? 'blur(6px)' : 'none'}} />
      <canvas ref={canvasRef} style={{display:'none'}} />
    </div>
  )
}
