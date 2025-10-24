import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ChakraProvider, defaultSystem } from '@chakra-ui/react'
import 'leaflet/dist/leaflet.css';
import { Toaster } from './components/ui/toaster.tsx'
import Login from './login.tsx'
import Signup from './signup.tsx'

// eslint-disable-next-line react-refresh/only-export-components
const Main = () => {
  const [session, setSession] = useState(() => localStorage.getItem('session_user'))
  const hasPathName = window.location.pathname.split("/")[1];

  return (
    <ChakraProvider value={defaultSystem}>
      { session ? <App /> : hasPathName === 'signup' ? <Signup/> : <Login onLogin={() => setSession(localStorage.getItem('session_user'))} /> }
      <Toaster />
    </ChakraProvider>
  )
}

const root = createRoot(document.getElementById('root')!)
root.render(
  <StrictMode>
    <Main />
  </StrictMode>
)
