import React from 'react';
import { CharacterProvider } from './context/CharacterContext';
import { RulesProvider } from './context/RulesContext';
import MainLayout from './components/layout/MainLayout';

function App() {
    return (
        <RulesProvider>
            <CharacterProvider>
                <MainLayout />
            </CharacterProvider>
        </RulesProvider>
    );
}

export default App;
