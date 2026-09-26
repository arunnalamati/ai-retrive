import React from 'react';
import { Sprout, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <div className="brand-logo footer-logo">
            <Sprout size={20} className="brand-icon" />
            <span>KisanVikas Portal</span>
          </div>
          <p className="footer-desc">
            Empowering agricultural communities with real-time crop monitoring, lifecycle tracking, and smart resource management.
          </p>
        </div>
        <div className="footer-links-group">
          <h4>Portal Modules</h4>
          <ul>
            <li>Farmer Dashboard & Analytics</li>
            <li>Crop Lifecycle Management</li>
            <li>Harvest History & Yield Logs</li>
            <li>Admin & Village Directory</li>
          </ul>
        </div>
        <div className="footer-links-group">
          <h4>MERN Stack Mini Project</h4>
          <p className="tech-badge-container">
            <span className="tech-tag">MongoDB Atlas</span>
            <span className="tech-tag">Express.js</span>
            <span className="tech-tag">React.js</span>
            <span className="tech-tag">Node.js</span>
          </p>
          <p className="project-credit">Designed for academic viva demonstration.</p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} Farmer Crop Information Portal. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
