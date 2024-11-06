import React from 'react';
import './Navbar.css'; // Import the Navbar-specific CSS file

const NavigationBar = ({ onPageChange, currentPage }) => {
  const pages = [
    { id: 'crops', title: 'Crop Production', description: 'View global crop production data' },
    { id: 'drought', title: 'Drought Impact', description: 'Analyze drought damage worldwide' },
    { id: 'analysis', title: 'Combined Analysis', description: 'Compare crop yields with drought effects' }
  ];

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div>
          <span className="navbar-title">Agricultural Insights</span>
        </div>
        
        <div className="navbar-buttons">
          {pages.map((page) => (
            <button
              key={page.id}
              onClick={() => onPageChange(page.id)}
              className={`navbar-button ${currentPage === page.id ? 'active' : ''}`}
              title={page.description}
            >
              {page.title}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar;
