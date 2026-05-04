"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Mic, MicOff, PhoneOff, Video, Loader2 } from 'lucide-react';
import { getSocket } from '@/services/socket';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface TeleConsultationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUserId: string; // The user ID to call
  isIncoming?: boolean;
  incomingOffer?: RTCSessionDescriptionInit;
}

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export function TeleConsultation({ open, onOpenChange, targetUserId, isIncoming, incomingOffer }: TeleConsultationProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const socket = getSocket();

  const startCall = async () => {
    try {
      setIsConnecting(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket?.emit('webrtc-ice-candidate', { to: targetUserId, candidate: event.candidate });
        }
      };

      if (isIncoming && incomingOffer) {
        await pc.setRemoteDescription(new RTCSessionDescription(incomingOffer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket?.emit('webrtc-answer', { to: targetUserId, answer });
      } else {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket?.emit('webrtc-offer', { to: targetUserId, offer });
      }

      setIsConnecting(false);
    } catch (err) {
      console.error('Failed to start call:', err);
      toast.error('Could not access camera or microphone');
      onOpenChange(false);
    }
  };

  useEffect(() => {
    if (!socket) return;

    socket.on('webrtc-answer', async ({ answer }) => {
      if (pcRef.current) {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.on('webrtc-ice-candidate', async ({ candidate }) => {
      if (pcRef.current) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('Error adding ice candidate', err);
        }
      }
    });

    return () => {
      socket.off('webrtc-answer');
      socket.off('webrtc-ice-candidate');
    };
  }, [socket]);

  const endCall = () => {
    localStream?.getTracks().forEach((track) => track.stop());
    pcRef.current?.close();
    pcRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setIsConnecting(false);
  };

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      startCall();
    } else {
      endCall();
    }

    return () => endCall();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => (track.enabled = isAudioMuted));
      setIsAudioMuted(!isAudioMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => (track.enabled = isVideoOff));
      setIsVideoOff(!isVideoOff);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 overflow-hidden bg-slate-900 border-slate-800">
        <DialogHeader className="p-4 bg-slate-800 border-b border-slate-700">
          <DialogTitle className="text-white flex items-center gap-2">
            <Video className="text-indigo-400" />
            Tele-consultation
            {isConnecting && <span className="text-xs font-normal text-slate-400 ml-2 animate-pulse">Connecting...</span>}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 relative bg-black flex items-center justify-center">
          {/* Remote Video (Main) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          {!remoteStream && !isConnecting && (
            <div className="absolute inset-0 flex items-center justify-center text-slate-500 flex-col gap-2">
              <Loader2 className="animate-spin h-8 w-8" />
              <p>Waiting for participant...</p>
            </div>
          )}

          {/* Local Video (PIP) */}
          <div className="absolute bottom-4 right-4 w-48 h-32 rounded-lg border-2 border-slate-700 overflow-hidden shadow-2xl bg-slate-800">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            {isVideoOff && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-800 text-slate-400">
                <CameraOff size={24} />
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-800/80 backdrop-blur-md p-3 rounded-full border border-slate-700">
            <Button
              variant={isAudioMuted ? "destructive" : "secondary"}
              size="icon"
              className="rounded-full h-12 w-12"
              onClick={toggleAudio}
            >
              {isAudioMuted ? <MicOff /> : <Mic />}
            </Button>
            <Button
              variant={isVideoOff ? "destructive" : "secondary"}
              size="icon"
              className="rounded-full h-12 w-12"
              onClick={toggleVideo}
            >
              {isVideoOff ? <CameraOff /> : <Camera />}
            </Button>
            <Button
              variant="destructive"
              size="icon"
              className="rounded-full h-12 w-12"
              onClick={() => onOpenChange(false)}
            >
              <PhoneOff />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

