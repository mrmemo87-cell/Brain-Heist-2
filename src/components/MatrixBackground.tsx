import React from 'react';

const MatrixBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      {/* your background canvas/animation goes here */}
      <div id="matrix-bg-canvas" className="w-full h-full opacity-60" />
    </div>
  );
};

export default MatrixBackground;
