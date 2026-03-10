import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { socket } from "../utils/socket";
import { api } from "../utils/api";
import "./VideoCall.css";

/* ── Google STUN servers (free, no setup needed) ──────────── */
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

export default function VideoCall() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const iceCandidateQueueRef = useRef([]);
  const cleanedUpRef = useRef(false);

  const [callStatus, setCallStatus] = useState("Checking access…");
  const [accessError, setAccessError] = useState("");
  const [peerName, setPeerName] = useState("");
  const [peerConnected, setPeerConnected] = useState(false);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    if (!peerConnected) return;
    const timer = setInterval(() => setCallDuration((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [peerConnected]);

  const formatDuration = (s) => {
    const m = Math.floor(s / 60)
      .toString()
      .padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();

  const getMediaErrorMessage = (err) => {
    console.error("getUserMedia error:", err);

    if (!err) {
      return "Camera/microphone access failed.";
    }

    switch (err.name) {
      case "NotAllowedError":
        return "Camera/microphone permission was blocked. Please allow access in browser site settings for localhost.";
      case "NotReadableError":
        return "Camera or microphone is already being used by another app or browser tab. Close other apps and try again.";
      case "NotFoundError":
        return "No camera or microphone was found on this device.";
      case "SecurityError":
        return "Browser security blocked camera/microphone access.";
      case "AbortError":
        return "Camera/microphone startup was interrupted. Please try again.";
      case "OverconstrainedError":
        return "Requested camera settings are not supported on this device.";
      default:
        return err.message || "Camera/microphone access failed.";
    }
  };

  const drainIceQueue = useCallback(async () => {
    while (
      iceCandidateQueueRef.current.length > 0 &&
      pcRef.current?.remoteDescription
    ) {
      const c = iceCandidateQueueRef.current.shift();
      try {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(c));
      } catch (e) {
        console.warn("[webrtc] ICE drain error:", e);
      }
    }
  }, []);

  const createPC = useCallback(() => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        socket.emit("video-ice-candidate", { appointmentId, candidate });
      }
    };

    pc.ontrack = ({ streams }) => {
      if (remoteVideoRef.current && streams[0]) {
        remoteVideoRef.current.srcObject = streams[0];
        setPeerConnected(true);
        setCallStatus("Connected ✅");
      }
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log("[webrtc] connection state:", state);

      if (state === "disconnected" || state === "failed") {
        setPeerConnected(false);
        setCallStatus("Peer disconnected");
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("[webrtc] ICE state:", pc.iceConnectionState);
    };

    return pc;
  }, [appointmentId]);

  const doCleanup = useCallback(() => {
    if (cleanedUpRef.current) return;
    cleanedUpRef.current = true;

    socket.emit("leave-video-room", { appointmentId });

    socket.off("video-peer-joined");
    socket.off("video-offer");
    socket.off("video-answer");
    socket.off("video-ice-candidate");
    socket.off("video-peer-left");
    socket.off("video-room-full");

    localStreamRef.current?.getTracks().forEach((t) => t.stop());

    pcRef.current?.close();
  }, [appointmentId]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    let mounted = true;
    cleanedUpRef.current = false;

    const init = async () => {
      try {
        const res = await api.get(`/api/video/check/${appointmentId}`);
        if (!res.data.ok) throw new Error(res.data.error);

        if (mounted) {
          setPeerName(res.data.appointment.peerName || "");
          setCallStatus("Starting camera…");
        }
      } catch (err) {
        if (mounted) {
          setAccessError(err.response?.data?.error || err.message);
        }
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });

        localStreamRef.current = stream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        if (mounted) {
          setAccessError(getMediaErrorMessage(err));
        }
        return;
      }

      const pc = createPC();
      pcRef.current = pc;

      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });

      socket.emit("join-video-room", { appointmentId });

      if (mounted) {
        setCallStatus("Waiting for the other person…");
      }

      socket.on("video-room-full", () => {
        if (mounted) {
          setAccessError("This call is already full (max 2 participants).");
        }
      });

      socket.on("video-peer-joined", async () => {
        if (!mounted) return;
        setCallStatus("Peer joined — connecting…");

        try {
          const offer = await pcRef.current.createOffer();
          await pcRef.current.setLocalDescription(offer);
          socket.emit("video-offer", { appointmentId, offer });
        } catch (e) {
          console.error("[webrtc] createOffer error:", e);
        }
      });

      socket.on("video-offer", async ({ offer }) => {
        if (!mounted) return;
        setCallStatus("Incoming call — connecting…");

        try {
          await pcRef.current.setRemoteDescription(
            new RTCSessionDescription(offer)
          );
          await drainIceQueue();

          const answer = await pcRef.current.createAnswer();
          await pcRef.current.setLocalDescription(answer);
          socket.emit("video-answer", { appointmentId, answer });
        } catch (e) {
          console.error("[webrtc] createAnswer error:", e);
        }
      });

      socket.on("video-answer", async ({ answer }) => {
        if (!mounted) return;

        try {
          await pcRef.current.setRemoteDescription(
            new RTCSessionDescription(answer)
          );
          await drainIceQueue();
        } catch (e) {
          console.error("[webrtc] setRemoteDescription error:", e);
        }
      });

      socket.on("video-ice-candidate", async ({ candidate }) => {
        if (!mounted) return;

        if (pcRef.current?.remoteDescription) {
          try {
            await pcRef.current.addIceCandidate(
              new RTCIceCandidate(candidate)
            );
          } catch (e) {
            console.warn("[webrtc] addIceCandidate error:", e);
          }
        } else {
          iceCandidateQueueRef.current.push(candidate);
        }
      });

      socket.on("video-peer-left", () => {
        if (!mounted) return;
        setPeerConnected(false);
        setCallStatus("The other person has left the call");
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = null;
        }
      });
    };

    init();

    return () => {
      mounted = false;
      doCleanup();
    };
  }, [appointmentId, createPC, doCleanup, drainIceQueue, navigate, user]);

  const endCall = () => {
    doCleanup();
    navigate(-1);
  };

  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = muted;
    });
    setMuted((m) => !m);
  };

  const toggleVideo = () => {
    localStreamRef.current?.getVideoTracks().forEach((t) => {
      t.enabled = videoOff;
    });
    setVideoOff((v) => !v);
  };

  if (accessError) {
    return (
      <div className="vc-error-page">
        <div className="vc-error-box">
          <div className="vc-error-icon">🚫</div>
          <h2>Can't join call</h2>
          <p>{accessError}</p>
          <button className="vc-btn-back" onClick={() => navigate(-1)}>
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="vc-page">
      <div className="vc-topbar">
        <span className={`vc-dot ${peerConnected ? "green" : "yellow"}`} />
        <span className="vc-status-text">{callStatus}</span>
        {peerName && <span className="vc-peer-name">with {peerName}</span>}
        {peerConnected && (
          <span className="vc-timer">{formatDuration(callDuration)}</span>
        )}
        <span className="vc-appt-id">Appointment #{appointmentId}</span>
      </div>

      <div className="vc-videos">
        <div className="vc-remote-wrap">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="vc-remote"
          />
          {!peerConnected && (
            <div className="vc-overlay">
              <div className="vc-spinner" />
              <p className="vc-overlay-status">{callStatus}</p>
              {peerName && (
                <p className="vc-overlay-peer">Waiting for {peerName}…</p>
              )}
            </div>
          )}
        </div>

        <div className="vc-local-wrap">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`vc-local ${videoOff ? "vc-hidden" : ""}`}
          />
          {videoOff && (
            <div className="vc-pip-off">
              <span>👤</span>
              <span>Camera off</span>
            </div>
          )}
          <div className="vc-pip-label">You</div>
        </div>
      </div>

      <div className="vc-controls">
        <button
          onClick={toggleMute}
          className={`vc-ctrl-btn ${muted ? "vc-active" : ""}`}
          title={muted ? "Unmute" : "Mute"}
        >
          <span className="vc-ctrl-icon">{muted ? "🔇" : "🎤"}</span>
          <span className="vc-ctrl-label">{muted ? "Unmute" : "Mute"}</span>
        </button>

        <button
          onClick={toggleVideo}
          className={`vc-ctrl-btn ${videoOff ? "vc-active" : ""}`}
          title={videoOff ? "Turn camera on" : "Turn camera off"}
        >
          <span className="vc-ctrl-icon">{videoOff ? "📵" : "📹"}</span>
          <span className="vc-ctrl-label">
            {videoOff ? "Cam On" : "Cam Off"}
          </span>
        </button>

        <button
          onClick={endCall}
          className="vc-ctrl-btn vc-end"
          title="End call"
        >
          <span className="vc-ctrl-icon">📵</span>
          <span className="vc-ctrl-label">End Call</span>
        </button>
      </div>
    </div>
  );
}