import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { socket } from "../utils/socket";
import { api } from "../utils/api";
import "./VideoCall.css";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
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
  const initializedRef = useRef(false);

  const [callStatus, setCallStatus] = useState("Checking access…");
  const [accessError, setAccessError] = useState("");
  const [peerName, setPeerName] = useState("");
  const [peerConnected, setPeerConnected] = useState(false);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();

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

  const getMediaErrorMessage = (err) => {
    console.error("getUserMedia error:", err);

    if (!window.isSecureContext) {
      return "Camera/microphone is unavailable on this page because the browser requires localhost or HTTPS for media access.";
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return "Camera/microphone API is unavailable here. Open the app on localhost or HTTPS.";
    }

    if (!err) return "Camera/microphone access failed.";

    if (err.message?.includes("localhost or HTTPS")) {
      return err.message;
    }

    switch (err.name) {
      case "NotAllowedError":
        return "Camera/microphone permission was blocked. Please allow access in browser site settings.";
      case "NotReadableError":
        return "Camera or microphone is already being used by another app or browser tab.";
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
      const candidate = iceCandidateQueueRef.current.shift();
      try {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
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

      if (state === "connected") {
        setPeerConnected(true);
        setCallStatus("Connected ✅");
      }

      if (state === "disconnected" || state === "failed" || state === "closed") {
        setPeerConnected(false);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = null;
        }
        if (state !== "closed") {
          setCallStatus("Peer disconnected");
        }
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

    try {
      socket.emit("leave-video-room", { appointmentId });
    } catch {}

    socket.off("video-room-full");
    socket.off("video-peer-joined");
    socket.off("video-offer");
    socket.off("video-answer");
    socket.off("video-ice-candidate");
    socket.off("video-peer-left");

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      localStreamRef.current = null;
    }

    if (pcRef.current) {
      try {
        pcRef.current.close();
      } catch {}
      pcRef.current = null;
    }

    iceCandidateQueueRef.current = [];
  }, [appointmentId]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (initializedRef.current) return;
    initializedRef.current = true;
    cleanedUpRef.current = false;

    let mounted = true;

    socket.off("video-room-full");
    socket.off("video-peer-joined");
    socket.off("video-offer");
    socket.off("video-answer");
    socket.off("video-ice-candidate");
    socket.off("video-peer-left");

    const onRoomFull = () => {
      if (mounted) {
        setAccessError("This call is already full (max 2 participants).");
      }
    };

    const onPeerJoined = async () => {
      if (!mounted || !pcRef.current) return;
      setCallStatus("Peer joined — connecting…");

      try {
        const offer = await pcRef.current.createOffer();
        await pcRef.current.setLocalDescription(offer);
        socket.emit("video-offer", { appointmentId, offer });
      } catch (e) {
        console.error("[webrtc] createOffer error:", e);
      }
    };

    const onOffer = async ({ offer }) => {
      if (!mounted || !pcRef.current) return;
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
    };

    const onAnswer = async ({ answer }) => {
      if (!mounted || !pcRef.current) return;

      try {
        await pcRef.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
        await drainIceQueue();
      } catch (e) {
        console.error("[webrtc] setRemoteDescription error:", e);
      }
    };

    const onIceCandidate = async ({ candidate }) => {
      if (!mounted || !pcRef.current) return;

      if (pcRef.current.remoteDescription) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn("[webrtc] addIceCandidate error:", e);
        }
      } else {
        iceCandidateQueueRef.current.push(candidate);
      }
    };

    const onPeerLeft = () => {
      if (!mounted) return;
      setPeerConnected(false);
      setCallStatus("The other person has left the call");
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    };

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
        if (!window.isSecureContext) {
          throw new Error(
            "Camera/microphone is only available on localhost or HTTPS. Open this app on localhost, or use HTTPS for other devices."
          );
        }

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error(
            "Camera/microphone API is unavailable here. Open this app on localhost or HTTPS."
          );
        }

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

      socket.on("video-room-full", onRoomFull);
      socket.on("video-peer-joined", onPeerJoined);
      socket.on("video-offer", onOffer);
      socket.on("video-answer", onAnswer);
      socket.on("video-ice-candidate", onIceCandidate);
      socket.on("video-peer-left", onPeerLeft);

      socket.emit("join-video-room", { appointmentId });

      if (mounted) {
        setCallStatus("Waiting for the other person…");
      }
    };

    init();

    return () => {
      mounted = false;
      doCleanup();
    };
  }, [appointmentId, navigate, user, createPC, doCleanup, drainIceQueue]);

  useEffect(() => {
    const onConnect = () => console.log("socket connected:", socket.id);
    const onDisconnect = (reason) =>
      console.log("socket disconnected:", reason);
    const onConnectError = (err) =>
      console.error("socket connect error:", err.message);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
    };
  }, []);

  const endCall = () => {
    doCleanup();
    navigate(-1);
  };

  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = muted;
    });
    setMuted((m) => !m);
  };

  const toggleVideo = () => {
    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = videoOff;
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