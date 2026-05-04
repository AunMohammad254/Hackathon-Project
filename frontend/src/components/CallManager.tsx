"use client";

import React, { useEffect, useState } from 'react';
import { TeleConsultation } from './TeleConsultation';

export function CallManager() {
  const [callData, setCallData] = useState<{ from: string; offer: RTCSessionDescriptionInit } | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleIncomingCall = (event: Event) => {
      const customEvent = event as CustomEvent<{ from: string; offer: RTCSessionDescriptionInit }>;
      setCallData(customEvent.detail);
      setIsOpen(true);
    };

    window.addEventListener('incoming-call', handleIncomingCall);
    return () => window.removeEventListener('incoming-call', handleIncomingCall);
  }, []);

  if (!callData) return null;

  return (
    <TeleConsultation
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) setCallData(null);
      }}
      targetUserId={callData.from}
      isIncoming={true}
      incomingOffer={callData.offer}
    />
  );
}
