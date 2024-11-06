import React, { useState } from 'react';
import NavigationBar from './Navbar.js';
import CropVisualization from './crop.js';
import DroughtVisualization from './drought.js';
import InteractiveCropDroughtChart from './compare';

const App = () => {
  const [currentPage, setCurrentPage] = useState('crops');

  const renderPage = () => {
    switch (currentPage) {
      case 'crops':
        return <CropVisualization />;
      case 'drought':
        return <DroughtVisualization />;
      case 'analysis':
        return <InteractiveCropDroughtChart />;
      default:
        return <CropVisualization />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationBar 
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
      <main className="max-w-7xl mx-auto py-6 px-4">
        {renderPage()}
      </main>
    </div>
  );
};

export default App;