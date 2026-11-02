import React, { useState, useEffect } from 'react';
import FabFanMenu from './FabFanMenu';
import CustomerServiceModal from './CustomerServiceModal';

/**
 * CustomerServiceFloatingButton - Now powered by FabFanMenu ("FAB Fan")
 * Inspired by Instagram Reel (ui_motion_prompts: Menu Part 1 — Option 3 "FAB Fan")
 * Features 5 quick actions fanning out on an arc with animated rotate '+' to 'x'.
 */
export default function CustomerServiceFloatingButton() {
  const [isLegacyModalOpen, setIsLegacyModalOpen] = useState(false);

  useEffect(() => {
    const handleOpenEvent = () => setIsLegacyModalOpen(true);
    window.addEventListener('kostku:open-help', handleOpenEvent);
    return () => window.removeEventListener('kostku:open-help', handleOpenEvent);
  }, []);

  return (
    <>
      <FabFanMenu />
      <CustomerServiceModal isOpen={isLegacyModalOpen} onClose={() => setIsLegacyModalOpen(false)} />
    </>
  );
}
