import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { FeedbackProvider } from './components/Feedback';
import { StoreProvider } from './data/store';
import './styles/app.css';
import './styles/ai-support.css';

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <BrowserRouter>
            <StoreProvider>
                <FeedbackProvider>
                    <App />
                </FeedbackProvider>
            </StoreProvider>
        </BrowserRouter>
    </StrictMode>,
);
