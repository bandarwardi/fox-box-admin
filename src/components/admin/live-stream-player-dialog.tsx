import React, { useEffect, useRef, useState, useMemo } from "react";
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
  Tv2,
  Swords
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
  pkData?: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStreamEnded?: (() => void) | undefined;
  onPkEnded?: (() => void) | undefined;
}

export function LiveStreamPlayerDialog({
  streamId,
  streamTitle,
  broadcasterName,
  broadcasterAvatar,
  pkData,
  open,
  onOpenChange,
  onStreamEnded,
  onPkEnded,
}: LiveStreamPlayerDialogProps) {
  const [status, setStatus] = useState<"connecting" | "live" | "waiting" | "error">("connecting");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [opponentStatus, setOpponentStatus] = useState<"connecting" | "live" | "waiting" | "error">("connecting");
  const [opponentErrorMessage, setOpponentErrorMessage] = useState<string | null>(null);
  const [opponentProfile, setOpponentProfile] = useState<{ name: string; avatarUrl?: string } | null>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [isEndingPk, setIsEndingPk] = useState(false);
  const [isPkEndedLocally, setIsPkEndedLocally] = useState(false);

  const isMutedRef = useRef(isMuted);
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  const playerWrapperRef = useRef<HTMLDivElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const opponentVideoContainerRef = useRef<HTMLDivElement>(null);

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const opponentClientRef = useRef<IAgoraRTCClient | null>(null);

  const audioTrackRef = useRef<IRemoteAudioTrack | null>(null);
  const videoTrackRef = useRef<IRemoteVideoTrack | null>(null);

  const opponentAudioTrackRef = useRef<IRemoteAudioTrack | null>(null);
  const opponentVideoTrackRef = useRef<IRemoteVideoTrack | null>(null);

  const opponentStreamId = useMemo(() => {
    if (!pkData?.opponentBroadcastId) return null;
    if (typeof pkData.opponentBroadcastId === "object" && pkData.opponentBroadcastId !== null) {
      return pkData.opponentBroadcastId._id?.toString() || null;
    }
    return pkData.opponentBroadcastId.toString();
  }, [pkData?.opponentBroadcastId]);

  const isPkActive = !isPkEndedLocally && pkData?.status === "active" && !!opponentStreamId;

  // Reset local state on dialog open or streamId change
  useEffect(() => {
    if (open) {
      setIsPkEndedLocally(false);
      setOpponentProfile(null);
    }
  }, [open, streamId]);

  // If a new PK battle starts while the dialog is open, clear local ended state
  useEffect(() => {
    if (pkData?.status === "active") {
      setIsPkEndedLocally(false);
    }
  }, [pkData?.status]);

  // 1. Main Broadcaster Agora Connection Lifecycle (Independent of PK status)
  useEffect(() => {
    if (!open || !streamId) {
      return;
    }

    let isMounted = true;
    setStatus("connecting");
    setErrorMessage(null);

    const initMainBroadcaster = async () => {
      try {
        const res = await api.get(`/broadcasts/${streamId}/token`);
        const { token, uid, channelName, appId } = res.data;

        if (!isMounted) return;

        if (!appId || !token || !channelName) {
          throw new Error("بيانات الاتصال بـ Agora غير مكتملة من الخادم");
        }

        const client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
        clientRef.current = client;

        await client.setClientRole("audience");

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
                if (isMutedRef.current) {
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

        await client.join(appId, channelName, token, uid);

        if (!isMounted) return;

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

    initMainBroadcaster();

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

  // 2. Opponent Broadcaster Agora Connection Lifecycle (Tied directly to isPkActive)
  useEffect(() => {
    if (!open || !isPkActive || !opponentStreamId) {
      return;
    }

    let isMounted = true;
    setOpponentStatus("connecting");
    setOpponentErrorMessage(null);

    // Fetch opponent profile info
    api.get(`/broadcasts/${opponentStreamId}`)
      .then((res) => {
        if (!isMounted) return;
        const oppBroadcaster = res.data?.broadcaster;
        if (oppBroadcaster) {
          setOpponentProfile({
            name: oppBroadcaster.displayName || oppBroadcaster.username || "الخصم",
            avatarUrl: oppBroadcaster.avatarUrl,
          });
        }
      })
      .catch(() => {});

    const initOpponentBroadcaster = async () => {
      try {
        const res = await api.get(`/broadcasts/${opponentStreamId}/token`);
        const { token, uid, channelName, appId } = res.data;

        if (!isMounted) return;

        if (!appId || !token || !channelName) {
          throw new Error("بيانات الاتصال بقناة الخصم غير مكتملة");
        }

        const oppClient = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
        opponentClientRef.current = oppClient;

        await oppClient.setClientRole("audience");

        oppClient.on("user-published", async (remoteUser, mediaType) => {
          if (!isMounted) return;
          try {
            await oppClient.subscribe(remoteUser, mediaType);

            if (mediaType === "video") {
              opponentVideoTrackRef.current = remoteUser.videoTrack || null;
              if (opponentVideoContainerRef.current && remoteUser.videoTrack) {
                remoteUser.videoTrack.play(opponentVideoContainerRef.current);
                setOpponentStatus("live");
              }
            }

            if (mediaType === "audio") {
              opponentAudioTrackRef.current = remoteUser.audioTrack || null;
              if (remoteUser.audioTrack) {
                remoteUser.audioTrack.play();
                if (isMutedRef.current) {
                  remoteUser.audioTrack.setVolume(0);
                }
              }
            }
          } catch (err: any) {
            console.error("Failed to subscribe to opponent remote track:", err);
          }
        });

        oppClient.on("user-unpublished", (_remoteUser, mediaType) => {
          if (mediaType === "video") {
            setOpponentStatus("waiting");
          }
        });

        oppClient.on("user-left", () => {
          setOpponentStatus("waiting");
        });

        oppClient.on("connection-state-change", (curState) => {
          if (curState === "DISCONNECTED") {
            setOpponentStatus("waiting");
          }
        });

        await oppClient.join(appId, channelName, token, uid);

        if (!isMounted) return;

        if (oppClient.remoteUsers.length === 0) {
          setOpponentStatus("waiting");
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.error("Opponent Agora join error:", err);
        setOpponentStatus("error");
        setOpponentErrorMessage(
          err.response?.data?.message || err.message || "فشل الاتصال ببث الخصم"
        );
      }
    };

    initOpponentBroadcaster();

    return () => {
      isMounted = false;
      if (opponentClientRef.current) {
        opponentClientRef.current.leave().catch(() => {});
        opponentClientRef.current.removeAllListeners();
        opponentClientRef.current = null;
      }
      opponentAudioTrackRef.current = null;
      opponentVideoTrackRef.current = null;
    };
  }, [open, isPkActive, opponentStreamId]);

  // Toggle Mute Audio for both streams
  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (audioTrackRef.current) {
      audioTrackRef.current.setVolume(nextMuted ? 0 : 100);
    }
    if (opponentAudioTrackRef.current) {
      opponentAudioTrackRef.current.setVolume(nextMuted ? 0 : 100);
    }
  };

  // Toggle Fullscreen on the entire player wrapper
  const toggleFullscreen = () => {
    if (!playerWrapperRef.current) return;
    if (!document.fullscreenElement) {
      playerWrapperRef.current.requestFullscreen().catch(() => {});
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

  // Force End PK Battle from Admin Watcher
  const handleForceEndPk = async () => {
    if (!streamId) return;
    try {
      setIsEndingPk(true);
      await api.patch(`/broadcasts/admin/${streamId}/end-pk`);
      toast.success("تم إنهاء معركة PK بنجاح");
      // Changing local flag triggers opponent useEffect cleanup automatically
      setIsPkEndedLocally(true);

      if (onPkEnded) onPkEnded();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "فشل في إنهاء معركة PK");
    } finally {
      setIsEndingPk(false);
    }
  };

  const scoreA = pkData?.scores?.hostA || 0;
  const scoreB = pkData?.scores?.hostB || 0;
  const totalScore = Math.max(scoreA + scoreB, 1);
  const percentA = Math.round((scoreA / totalScore) * 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={`w-[calc(100%-2rem)] bg-zinc-950 border-zinc-800 text-zinc-100 p-0 overflow-hidden shadow-2xl transition-all duration-300 ${
          isPkActive 
            ? "max-w-2xl sm:max-w-3xl lg:max-w-4xl" 
            : "max-w-xl sm:max-w-2xl"
        }`}
      >
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
              <DialogTitle className="text-base font-bold text-zinc-100 flex items-center gap-2 flex-wrap">
                <span>{streamTitle || "بث مباشر"}</span>
                {status === "live" && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded-full">
                    <span className="size-1.5 rounded-full bg-red-500 animate-ping" />
                    مباشر
                  </span>
                )}
                {isPkActive && (
                  <span className="flex items-center gap-1 text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full shadow-sm">
                    ⚔️ معركة PK (بث مزدوج)
                  </span>
                )}
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-400 flex items-center gap-2 flex-wrap mt-0.5">
                <span>
                  المضيف: <span className="text-sky-400 font-semibold">{broadcasterName || "غير معروف"}</span>
                </span>
                {isPkActive && (
                  <>
                    <span className="text-zinc-600 font-bold">•</span>
                    <span>
                      الخصم: <span className="text-rose-400 font-semibold">{opponentProfile?.name || "جارٍ التحميل..."}</span>
                    </span>
                  </>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Video Player Canvas */}
        <div 
          ref={playerWrapperRef}
          className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden"
        >
          {/* PK Battle Live Score Tug-of-war Bar */}
          {isPkActive && (
            <div className="absolute top-3 left-3 right-3 z-20 bg-zinc-950/85 backdrop-blur-md rounded-xl p-2.5 border border-zinc-800/90 shadow-xl pointer-events-none">
              <div className="flex items-center justify-between text-xs font-bold mb-1.5 px-1">
                <span className="text-sky-400 flex items-center gap-1.5 font-black">
                  <span className="size-2 rounded-full bg-sky-400 shadow-sm shadow-sky-400" />
                  {broadcasterName || "المضيف"}: {scoreA.toLocaleString()}
                </span>
                <span className="text-amber-400 text-[11px] font-black bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                  ⚔️ VS
                </span>
                <span className="text-rose-400 flex items-center gap-1.5 font-black">
                  {opponentProfile?.name || "الخصم"}: {scoreB.toLocaleString()}
                  <span className="size-2 rounded-full bg-rose-400 shadow-sm shadow-rose-400" />
                </span>
              </div>
              <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden flex border border-zinc-700/60 shadow-inner">
                <div
                  className="bg-gradient-to-r from-sky-600 to-sky-400 transition-all duration-500"
                  style={{ width: `${percentA}%` }}
                />
                <div
                  className="bg-gradient-to-r from-rose-400 to-rose-600 flex-1 transition-all duration-500"
                />
              </div>
            </div>
          )}

          {/* Video Containers wrapper - Single/Dual layout with permanent Main container */}
          <div className="w-full h-full flex relative overflow-hidden">
            {/* Host A Video Container (Permanent, never destroyed on PK toggle) */}
            <div
              className={`relative h-full flex items-center justify-center bg-zinc-950 overflow-hidden transition-all duration-300 ${
                isPkActive ? "w-1/2" : "w-full"
              }`}
            >
              <div
                ref={videoContainerRef}
                className="w-full h-full [&>div]:!w-full [&>div]:!h-full [&_video]:!object-contain"
              />

              {/* Host A Label Badge in PK */}
              {isPkActive && (
                <div className="absolute top-14 right-3 z-10 bg-sky-950/80 backdrop-blur-sm border border-sky-500/30 px-2 py-0.5 rounded text-[11px] font-bold text-sky-400 flex items-center gap-1 shadow">
                  <span className="size-1.5 rounded-full bg-sky-400" />
                  {broadcasterName || "المضيف"}
                </div>
              )}

              {/* Status Overlays for Host A */}
              {status === "connecting" && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-zinc-300">
                  <Loader2 className="size-6 sm:size-8 animate-spin text-sky-400" />
                  <p className="text-xs sm:text-sm font-medium">
                    {isPkActive ? "جاري الاتصال بالمضيف..." : "جاري الاتصال بخادم البث المباشر..."}
                  </p>
                </div>
              )}

              {status === "waiting" && (
                <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center gap-1.5 text-zinc-400">
                  <Tv2 className="size-8 sm:size-10 text-zinc-600 animate-pulse" />
                  <p className="text-xs sm:text-sm font-medium">بانتظار فيديو المضيف...</p>
                  {!isPkActive && (
                    <p className="text-xs text-zinc-500">قد يكون المذيع غير متصل أو البث متوقف مؤقتاً</p>
                  )}
                </div>
              )}

              {status === "error" && (
                <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center gap-2 p-4 text-center text-red-400">
                  <AlertTriangle className="size-6 sm:size-8 text-red-500" />
                  <p className="text-xs sm:text-sm font-semibold">{errorMessage || "تعذر بدء فيديو المضيف"}</p>
                  {!isPkActive && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onOpenChange(false)}
                      className="mt-2 border-zinc-800 text-zinc-200"
                    >
                      إغلاق النافذة
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Host B (Opponent) Video Container - Conditionally mounted when PK is active */}
            {isPkActive && (
              <div className="relative w-1/2 h-full flex items-center justify-center bg-zinc-950 overflow-hidden border-r border-zinc-800 transition-all duration-300">
                <div
                  ref={opponentVideoContainerRef}
                  className="w-full h-full [&>div]:!w-full [&>div]:!h-full [&_video]:!object-contain"
                />

                {/* Host B Label Badge */}
                <div className="absolute top-14 left-3 z-10 bg-rose-950/80 backdrop-blur-sm border border-rose-500/30 px-2 py-0.5 rounded text-[11px] font-bold text-rose-400 flex items-center gap-1 shadow">
                  <span className="size-1.5 rounded-full bg-rose-400" />
                  {opponentProfile?.name || "الخصم"}
                </div>

                {/* Status Overlays for Host B */}
                {opponentStatus === "connecting" && (
                  <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-zinc-300">
                    <Loader2 className="size-6 animate-spin text-rose-400" />
                    <p className="text-xs font-medium">جاري الاتصال بالخصم...</p>
                  </div>
                )}
                {opponentStatus === "waiting" && (
                  <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center gap-1.5 text-zinc-400">
                    <Tv2 className="size-8 text-zinc-600 animate-pulse" />
                    <p className="text-xs font-medium">بانتظار فيديو الخصم...</p>
                  </div>
                )}
                {opponentStatus === "error" && (
                  <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center gap-2 p-4 text-center text-red-400">
                    <AlertTriangle className="size-6 text-red-500" />
                    <p className="text-xs font-semibold">{opponentErrorMessage || "تعذر بدء فيديو الخصم"}</p>
                  </div>
                )}
              </div>
            )}
          </div>

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

              {/* Admin Moderation Buttons */}
              <div className="flex items-center gap-2">
                {isPkActive && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="shadow-lg font-bold gap-1.5 border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 hover:text-amber-200"
                    onClick={handleForceEndPk}
                    disabled={isEndingPk || isEnding}
                  >
                    {isEndingPk ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Swords className="size-4" />
                    )}
                    إنهاء PK إجبارياً
                  </Button>
                )}

                <Button
                  variant="destructive"
                  size="sm"
                  className="shadow-lg font-bold gap-1.5 bg-red-600 hover:bg-red-700"
                  onClick={handleForceEnd}
                  disabled={isEnding || isEndingPk}
                >
                  {isEnding ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Ban className="size-4" />
                  )}
                  إنهاء البث إجبارياً
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
