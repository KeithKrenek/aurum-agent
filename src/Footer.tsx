import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-dark-gray text-bone py-2">
      <div className="container mx-auto px-4 text-center h-6">
        <p>&copy; {(new Date().getFullYear())} Elementsist. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;