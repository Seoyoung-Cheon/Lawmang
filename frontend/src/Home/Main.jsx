import React from 'react'
import mainVideo from '../assets/main_video.mp4'
import Youtube from './Youtube'

const Main = () => {
  return (
    <div className='overflow-x-hidden'>
      <div className='relative w-full h-screen'>
        <div className='opacity-30 overlay w-full h-full bg-black left-0 top-0 z-10 absolute'></div>
        <div className='video_container w-screen h-screen absolute top-0 left-0 overflow-hidden'>
          <video src={mainVideo} className='w-full h-full object-cover scale-250' autoPlay muted loop></video>
        </div>
      </div>
      <Youtube />
    </div>
  )
}


export default Main