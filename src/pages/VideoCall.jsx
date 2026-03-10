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
  const navigate          = useNavigate();

  /* ── Refs ─────────────────────────────────────────────────── */
  const localVideoRef        = useRef(null);
  const remoteVideoRef       = useRef(null);
  const pcRef                = useRef(null);   // RTCPeerConnection
  const localStreamRef       = useRef(null);   // local camera/mic stream
  const iceCandidateQueueRef = useRef([]);      // holds ICE before remote desc ready
  const cleanedUpRef         = useRef(false);  // prevent double cleanup

  /* ── State ────────────────────────────────────────────────── */
  const [callStatus,    setCallStatus]    = useState("Checking access…");
  const [accessError,   setAccessError]   = useState("");
  const [peerName,      setPeerName]      = useState("");
  const [peerConnected, setPeerConnected] = useState(false);
  const [muted,         setMuted]         = useState(false);
  const [videoOff,      setVideoOff]      = useState(false);
  const [callDuration,  setCallDuration]  = useState(0); // seconds

  /* ── Timer ────────────────────────────────────────────────── */
  useEffect(() => {
    if (!peerConnected) return;
    const timer = setInterval(() => setCallDuration((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [peerConnected]);

  const formatDuration = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  /* ── Logged-in user ───────────────────────────────────────── */
  const user = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); }
    catch { return null; }
  })();

  /* ── Drain queued ICE candidates ──────────────────────────── */
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

  /* ── Build RTCPeerConnection ──────────────────────────────── */
  const createPC = useCallback(() => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Send our ICE candidates to the other peer via socket
    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        socket.emit("video-ice-candidate", { appointmentId, candidate });
      }
    };

    // When remote stream arrives — show it in the big video
    pc.ontrack = ({ streams }) => {
      if (remoteVideoRef.current && streams[0]) {
        remoteVideoRef.current.srcObject = streams[0];
        setPeerConnected(true);
        setCallStatus("Connected ✅");
      }
    };

    // Watch for disconnection
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

  /* ── Cleanup ──────────────────────────────────────────────── */
  const doCleanup = useCallback(() => {
    if (cleanedUpRef.current) return;
    cleanedUpRef.current = true;

    socket.emit("leave-video-room", { appointmentId });

    // Remove all video socket listeners
    socket.off("video-peer-joined");
    socket.off("video-offer");
    socket.off("video-answer");
    socket.off("video-ice-candidate");
    socket.off("video-peer-left");
    socket.off("video-room-full");

    // Stop all camera/mic tracks
    localStreamRef.current?.getTracks().forEach((t) => t.stop());

    // Close peer connection
    pcRef.current?.close();
  }, [appointmentId]);

  /* ── Main effect — runs once on mount ────────────────────── */
  useEffect(() => {
    if (!user) { navigate("/login"); return; }

    let mounted = true;

    const init = async () => {

      /* 1. Backend check — does this user have access? */
      try {
        const res = await api.get(`/api/video/check/${appointmentId}`);
        if (!res.data.ok) throw new Error(res.data.error);
        if (mounted) {
          setPeerName(res.data.appointment.peerName || "");
          setCallStatus("Starting camera…");
        }
      } catch (err) {
        if (mounted)
          setAccessError(err.response?.data?.error || err.message);
        return;
      }

      /* 2. Get local camera + mic */
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });
        localStreamRef.current = stream;
        if (localVideoRef.current)
          localVideoRef.current.srcObject = stream;
      } catch (err) {
        if (mounted)
          setAccessError(
            "Camera/microphone access denied. Please allow access and try again."
          );
        return;
      }

      /* 3. Create RTCPeerConnection and add local tracks */
      const pc = createPC();
      pcRef.current = pc;

      localStreamRef.current
        .getTracks()
        .forEach((track) =>
          pc.addTrack(track, localStreamRef.current)
        );

      /* 4. Join the socket room */
      socket.emit("join-video-room", { appointmentId });
      if (mounted) setCallStatus("Waiting for the other person…");

      /* 5. Room full */
      socket.on("video-room-full", () => {
        if (mounted)
          setAccessError("This call is already full (max 2 participants).");
      });

      /* 6. A peer joined — WE create the WebRTC offer (we were first) */
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

      /* 7. We joined second — receive offer, create answer */
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

      /* 8. We offered — receive the answer */
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

      /* 9. ICE candidates — queue if remote desc not set yet */
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

      /* 10. Peer left or hung up */
      socket.on("video-peer-left", () => {
        if (!mounted) return;
        setPeerConnected(false);
        setCallStatus("The other person has left the call");
        if (remoteVideoRef.current)
          remoteVideoRef.current.srcObject = null;
      });
    };

    init();

    return () => {
      mounted = false;
      doCleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId]);

  /* ── Controls ─────────────────────────────────────────────── */
  const endCall = () => {
    doCleanup();
    navigate(-1);
  };

  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = muted; // if muted=true, re-enable
    });
    setMuted((m) => !m);
  };

  const toggleVideo = () => {
    localStreamRef.current?.getVideoTracks().forEach((t) => {
      t.enabled = videoOff; // if videoOff=true, re-enable
    });
    setVideoOff((v) => !v);
  };

  /* ── Access error screen ──────────────────────────────────── */
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

  /* ── Main call UI ─────────────────────────────────────────── */
  return (
    <div className="vc-page">

      {/* Status bar */}
      <div className="vc-topbar">
        <span className={`vc-dot ${peerConnected ? "green" : "yellow"}`} />
        <span className="vc-status-text">{callStatus}</span>
        {peerName && (
          <span className="vc-peer-name">with {peerName}</span>
        )}
        {peerConnected && (
          <span className="vc-timer">{formatDuration(callDuration)}</span>
        )}
        <span className="vc-appt-id">Appointment #{appointmentId}</span>
      </div>

      {/* Video area */}
      <div className="vc-videos">

        {/* Remote (full screen) */}
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
                <p className="vc-overlay-peer">
                  Waiting for {peerName}…
                </p>
              )}
            </div>
          )}
        </div>

        {/* Local (picture-in-picture) */}
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

      {/* Controls */}
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
