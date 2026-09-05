import React, { useEffect, useRef, useState } from "react";
import AgoraRTC, { IAgoraRTCClient, IRemoteAudioTrack, IRemoteVideoTrack } from "agora-rtc-sdk-ng";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Radio, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Ban, 
  AlertTriangle, 
  Loader2, 
  User,
  Tv2
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

// Configure Agora logging level for cleaner console
AgoraRTC.setLogLevel(2);

interface LiveStreamPlayerDialogProps {
  streamId: string | null;
  streamTitle?: string | undefined;
  broadcasterName?: string | undefined;
  broadcasterAvatar?: string | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStreamEnded?: (() => void) | undefined;
}

export function LiveStreamPlayerDialog({
  streamId,
  streamTitle,
  broadcasterName,
  broadcasterAvatar,
  open,
  onOpenChange,
  onStreamEnded,
}: LiveStreamPlayerDialogProps) {
  const [status, setStatus] = useState<"connecting" | "live" | "waiting" | "error">("connecting");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  const videoContainerRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const audioTrackRef = useRef<IRemoteAudioTrack | null>(null);
  const videoTrackRef = useRef<IRemoteVideoTrack | null>(null);

  useEffect(() => {
    if (!open || !streamId) {
      return;
    }

    let isMounted = true;
    setStatus("connecting");
    setErrorMessage(null);

    const initAgora = async () => {
      try {
        // 1. Fetch token & connection details from NestJS backend
        const res = await api.get(`/broadcasts/${streamId}/token`);
        const { token, uid, channelName, appId } = res.data;

        if (!isMounted) return;

        if (!appId || !token || !channelName) {
          throw new Error("بيانات الاتصال بـ Agora غير مكتملة من الخادم");
        }

        // 2. Initialize Agora Web Client
        const client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
        clientRef.current = client;

        // 3. Set audience role for admin monitoring
        await client.setClientRole("audience");

        // 4. Register event handlers
        client.on("user-published", async (remoteUser, mediaType) => {
          if (!isMounted) return;
          try {
            await client.subscribe(remoteUser, mediaType);

            if (mediaType === "video") {
              videoTrackRef.current = remoteUser.videoTrack || null;
              if (videoContainerRef.current && remoteUser.videoTrack) {
                remoteUser.videoTrack.play(videoContainerRef.current);
                setStatus("live");
              }
            }

            if (mediaType === "audio") {
              audioTrackRef.current = remoteUser.audioTrack || null;
              if (remoteUser.audioTrack) {
                remoteUser.audioTrack.play();
                if (isMuted) {
                  remoteUser.audioTrack.setVolume(0);
                }
              }
            }
          } catch (err: any) {
            console.error("Failed to subscribe to remote track:", err);
          }
        });

        client.on("user-unpublished", (_remoteUser, mediaType) => {
          if (mediaType === "video") {
            setStatus("waiting");
          }
        });

        client.on("user-left", () => {
          setStatus("waiting");
        });

        client.on("connection-state-change", (curState) => {
          if (curState === "DISCONNECTED") {
            setStatus("waiting");
          }
        });

        // 5. Join Channel
        await client.join(appId, channelName, token, uid);

        if (!isMounted) return;

        // If no remote user is currently publishing video yet
        if (client.remoteUsers.length === 0) {
          setStatus("waiting");
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.error("Agora join error:", err);
        setStatus("error");
        setErrorMessage(
          err.response?.data?.message || err.message || "فشل الاتصال بالبث المباشر"
        );
      }
    };

    initAgora();

    // Clean up on modal close or unmount
    return () => {
      isMounted = false;
      if (clientRef.current) {
        clientRef.current.leave().catch(() => {});
        clientRef.current.removeAllListeners();
        clientRef.current = null;
      }
      audioTrackRef.current = null;
      videoTrackRef.current = null;
    };
  }, [open, streamId]);

  // Toggle Mute Audio
  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (audioTrackRef.current) {
      audioTrackRef.current.setVolume(nextMuted ? 0 : 100);
    }
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!videoContainerRef.current) return;
    if (!document.fullscreenElement) {
      videoContainerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Force End Stream from Admin Watcher
  const handleForceEnd = async () => {
    if (!streamId) return;
    try {
      setIsEnding(true);
      await api.patch(`/broadcasts/admin/${streamId}/end`);
      toast.success("تم إنهاء البث بنجاح");
      if (onStreamEnded) onStreamEnded();
      onOpenChange(false);
    } catch {
      toast.error("فشل في إنهاء البث");
    } finally {
      setIsEnding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-xl sm:max-w-2xl bg-zinc-950 border-zinc-800 text-zinc-100 p-0 overflow-hidden shadow-2xl">
        {/* Header Bar */}
        <DialogHeader className="p-4 border-b border-zinc-800/80 bg-zinc-900/50 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            {broadcasterAvatar ? (
              <img
                src={broadcasterAvatar}
                alt={broadcasterName || "Broadcaster"}
                className="size-10 rounded-full border border-zinc-700 object-cover"
              />
            ) : (
              <div className="size-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400">
                <User className="size-5" />
              </div>
            )}
            <div>
              <DialogTitle className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <span>{streamTitle || "بث مباشر"}</span>
                {status === "live" && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded-full">
                    <span className="size-1.5 rounded-full bg-red-500 animate-ping" />
                    مباشر
                  </span>
                )}
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-400">
                المذيع: <span className="text-zinc-300 font-medium">{broadcasterName || "غير معروف"}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Video Player Canvas */}
        <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
          {/* Agora Video Render Div */}
          <div
            ref={videoContainerRef}
            className="w-full h-full [&>div]:!w-full [&>div]:!h-full [&_video]:!object-contain"
          />

          {/* Status Overlays */}
          {status === "connecting" && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 text-zinc-300">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm font-medium">جاري الاتصال بخادم البث المباشر...</p>
            </div>
          )}

          {status === "waiting" && (
            <div className="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center gap-2 text-zinc-400">
              <Tv2 className="size-10 text-zinc-600 animate-pulse" />
              <p className="text-sm font-medium">بانتظار تدفق الفيديو من المذيع...</p>
              <p className="text-xs text-zinc-500">قد يكون المذيع غير متصل أو البث متوقف مؤقتاً</p>
            </div>
          )}

          {status === "error" && (
            <div className="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center gap-3 text-center p-6 text-red-400">
              <AlertTriangle className="size-10 text-red-500" />
              <p className="text-sm font-semibold">{errorMessage || "تعذر بدء تشغيل البث"}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="mt-2 border-zinc-800 text-zinc-200"
              >
                إغلاق النافذة
              </Button>
            </div>
          )}

          {/* Quick Floating Controls (Visible when Live or Waiting) */}
          {status !== "error" && (
            <div className="absolute bottom-3 right-3 left-3 flex items-center justify-between pointer-events-auto z-10">
              <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-white/10">
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8 text-white hover:bg-white/10"
                  onClick={toggleMute}
                  title={isMuted ? "تشغيل الصوت" : "كتم الصوت"}
                >
                  {isMuted ? <VolumeX className="size-4 text-red-400" /> : <Volume2 className="size-4" />}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8 text-white hover:bg-white/10"
                  onClick={toggleFullscreen}
                  title="ملء الشاشة"
                >
                  <Maximize className="size-4" />
                </Button>
              </div>

              {/* Admin Moderation Button */}
              <Button
                variant="destructive"
                size="sm"
                className="shadow-lg font-bold gap-1.5 bg-red-600 hover:bg-red-700"
                onClick={handleForceEnd}
                disabled={isEnding}
              >
                {isEnding ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Ban className="size-4" />
                )}
                إنهاء البث إجبارياً
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
