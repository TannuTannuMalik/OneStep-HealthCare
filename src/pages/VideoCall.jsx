import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../utils/api";
import AgoraRTC from "agora-rtc-sdk-ng";
import "./VideoCall.css";

const FALLBACK_APP_ID = "820bbb9a81444e008d79131d1393e9de";


const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

export default function VideoCall() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localTracksRef = useRef({ audio: null, video: null });

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

  // ── Call timer ────────────────────────────────────────────────
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

  // ── Main init ─────────────────────────────────────────────────
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    let mounted = true;

    const init = async () => {

      // 1. Check access + get peer name
      try {
        const res = await api.get(`/video/check/${appointmentId}`);
        if (!res.data.ok) throw new Error(res.data.error);
        if (mounted) {
          setPeerName(res.data.appointment.peerName || "");
          setCallStatus("Starting camera…");
        }
      } catch (err) {
        if (mounted) setAccessError(err.response?.data?.error || err.message);
        return;
      }

      // 2. Get Agora channel + appId from backend
      let channelName, appId;
      try {
        const tokenRes = await api.get(`/video/token/${appointmentId}`);
        if (!tokenRes.data.ok) throw new Error(tokenRes.data.error);
        channelName = tokenRes.data.channelName;
        appId = tokenRes.data.appId || FALLBACK_APP_ID;
      } catch (err) {
        if (mounted) setAccessError("Failed to get call session: " + (err.response?.data?.error || err.message));
        return;
      }

      // 3. Create local audio + video tracks
      try {
        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        localTracksRef.current = { audio: audioTrack, video: videoTrack };

        if (localVideoRef.current) {
          videoTrack.play(localVideoRef.current);
        }
      } catch (err) {
        if (mounted) setAccessError("Camera/microphone access failed. Please allow access and try again.");
        return;
      }

      // 4. Listen for remote user joining
      client.on("user-published", async (remoteUser, mediaType) => {
        await client.subscribe(remoteUser, mediaType);

        if (mediaType === "video" && remoteVideoRef.current) {
          remoteUser.videoTrack.play(remoteVideoRef.current);
          if (mounted) {
            setPeerConnected(true);
            setCallStatus("Connected ✅");
          }
        }

        if (mediaType === "audio") {
          remoteUser.audioTrack.play();
        }
      });

      client.on("user-unpublished", () => {
        if (mounted) {
          setPeerConnected(false);
          setCallStatus("The other person has left the call");
        }
      });

      client.on("user-left", () => {
        if (mounted) {
          setPeerConnected(false);
          setCallStatus("The other person has left the call");
          if (remoteVideoRef.current) remoteVideoRef.current.innerHTML = "";
        }
      });

      // 5. Join Agora channel using backend-provided appId + channelName
      try {
        const uid = Math.floor(Math.random() * 100000);
        await client.join(appId, channelName, null, uid);
        await client.publish([
          localTracksRef.current.audio,
          localTracksRef.current.video,
        ]);

        if (mounted) {
          setCallStatus("Waiting for the other person…");
        }
      } catch (err) {
        if (mounted) setAccessError("Failed to join call: " + err.message);
      }
    };

    init();

    return () => {
      mounted = false;
      cleanup();
    };
  }, [appointmentId]);

  // ── Cleanup on unmount ────────────────────────────────────────
  const cleanup = async () => {
    try {
      if (localTracksRef.current.audio) {
        localTracksRef.current.audio.stop();
        localTracksRef.current.audio.close();
      }
      if (localTracksRef.current.video) {
        localTracksRef.current.video.stop();
        localTracksRef.current.video.close();
      }
      await client.leave();
    } catch {}
  };

  const endCall = async () => {
    await cleanup();
    navigate(-1);
  };

  const toggleMute = async () => {
    const audioTrack = localTracksRef.current.audio;
    if (!audioTrack) return;
    await audioTrack.setEnabled(muted);
    setMuted((m) => !m);
  };

  const toggleVideo = async () => {
    const videoTrack = localTracksRef.current.video;
    if (!videoTrack) return;
    await videoTrack.setEnabled(videoOff);
    setVideoOff((v) => !v);
  };

  // ── Error screen ──────────────────────────────────────────────
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
      {/* Top bar */}
      <div className="vc-topbar">
        <span className={`vc-dot ${peerConnected ? "green" : "yellow"}`} />
        <span className="vc-status-text">{callStatus}</span>
        {peerName && <span className="vc-peer-name">with {peerName}</span>}
        {peerConnected && (
          <span className="vc-timer">{formatDuration(callDuration)}</span>
        )}
        <span className="vc-appt-id">Appointment #{appointmentId}</span>
      </div>

      {/* Videos */}
      <div className="vc-videos">
        <div className="vc-remote-wrap">
          <div ref={remoteVideoRef} className="vc-remote" />

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
          <div
            ref={localVideoRef}
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
