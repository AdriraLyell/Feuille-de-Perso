
import React from 'react';
import { CharacterProvider } from './context/CharacterContext';
import MainLayout from './components/layout/MainLayout';

function App() {
    return (
        <CharacterProvider>
            <MainLayout />
        </CharacterProvider>
    );
}

export default App;
