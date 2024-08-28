import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {BrowserRouter} from "react-router-dom"
import {QueryClientProvider} from "@tanstack/react-query";
import {ReactQueryDevtools} from "@tanstack/react-query-devtools"
import { ChakraProvider } from '@chakra-ui/react'
import App from './App.jsx'
import queryClient from './config/queryClient.js';
import theme from "./theme/index.js";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ChakraProvider theme={theme}>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <ReactQueryDevtools position="bottom-right" initialIsOpen={false} />
      </BrowserRouter>
    </QueryClientProvider>
    </ChakraProvider>
  </StrictMode>,
)
