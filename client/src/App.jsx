import React from 'react'
import Home from './Pages/Home'
import { Route, Routes } from 'react-router-dom'
import Interview from './components/Interview'

const App = () => {
  return (
    <div>
  
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/interview' element={<Interview/>}/>
      </Routes>
    </div>
  )
}

export default App
