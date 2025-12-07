import React from 'react'
import { Line } from 'react-chartjs-2'
import { Chart, LineElement, CategoryScale, LinearScale, PointElement, TimeScale } from 'chart.js'
Chart.register(LineElement, CategoryScale, LinearScale, PointElement, TimeScale)

export default function EngagementChart({points=[]}){
  const labels = points.map(p => new Date(p.ts).toLocaleTimeString())
  const data = {
    labels,
    datasets: [{
      label: 'Engagement',
      data: points.map(p=>p.overall),
      borderColor: '#4b6cff',
      backgroundColor: 'rgba(75,108,255,0.15)',
      tension: 0.3
    }]
  }
  const options = { 
    plugins: { legend: { display: false } }, 
    scales: { y: { min:0, max:100 } },
    responsive: true,
    maintainAspectRatio: false
  }
  return <div style={{height: 200}}><Line data={data} options={options} /></div>
}
