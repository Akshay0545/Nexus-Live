import React, { useEffect, useRef, useState } from 'react'
import io from "socket.io-client";
import { AnimatePresence, motion } from 'framer-motion';
import {
    VideoCameraIcon,
    VideoCameraSlashIcon,
    PhoneXMarkIcon,
    MicrophoneIcon,
    NoSymbolIcon,
    ComputerDesktopIcon,
    ChatBubbleLeftRightIcon,
    StopCircleIcon,
    InformationCircleIcon,
    UserGroupIcon
} from '@heroicons/react/24/solid';
import server from '../environment';
import authService from '../services/auth.service';
import Chat from './Chat';
import Video from './Video';
import Lobby from './Lobby';

const server_url = server;

const peerConfigConnections = {
    "iceServers": [
        { "urls": "stun:stun.l.google.com:19302" }
    ]
}

export default function VideoMeetComponent() {

    var socketRef = useRef();
    let socketIdRef = useRef();

    let localVideoref = useRef();

    let [videoAvailable, setVideoAvailable] = useState(true);
    let [audioAvailable, setAudioAvailable] = useState(true);
    let [video, setVideo] = useState([]);
    let [audio, setAudio] = useState();
    let [screen, setScreen] = useState();
    let [showChat, setShowChat] = useState(false);
    let [screenAvailable, setScreenAvailable] = useState();
    let [messages, setMessages] = useState([]);
    let [message, setMessage] = useState("");
    let [newMessages, setNewMessages] = useState(0);
    let [askForUsername, setAskForUsername] = useState(true);
    let [username, setUsername] = useState("");
    const videoRef = useRef([]);
    let [videos, setVideos] = useState([]);
    const [peerNames, setPeerNames] = useState({});
    const connectionsRef = useRef({});
    const displayStreamRef = useRef(null);
    const cameraStreamRef = useRef(null);
    const [screenSharerId, setScreenSharerId] = useState(null);
    const [currentTime, setCurrentTime] = useState('');

    // Update clock every minute
    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        };
        updateTime();
        const interval = setInterval(updateTime, 60000);
        return () => clearInterval(interval);
    }, []);

    // Comprehensive cleanup on unmount: socket, peer connections, media tracks
    useEffect(() => {
        return () => {
            // 1. Disconnect socket and remove all listeners
            try {
                if (socketRef.current) {
                    socketRef.current.removeAllListeners();
                    socketRef.current.disconnect();
                    socketRef.current = null;
                }
            } catch (e) { }

            // 2. Close all RTCPeerConnections
            const conns = connectionsRef.current;
            for (let id in conns) {
                try { conns[id].close(); } catch (e) { }
            }
            connectionsRef.current = {};

            // 3. Stop all media tracks (camera, display, window.localStream)
            try {
                if (displayStreamRef.current) {
                    displayStreamRef.current.getTracks().forEach(t => t.stop());
                    displayStreamRef.current = null;
                }
            } catch (e) { }

            try {
                if (cameraStreamRef.current) {
                    cameraStreamRef.current.getTracks().forEach(t => t.stop());
                    cameraStreamRef.current = null;
                }
            } catch (e) { }

            try {
                if (window.localStream) {
                    window.localStream.getTracks().forEach(t => t.stop());
                    window.localStream = null;
                }
            } catch (e) { }
        };
    }, []);

    useEffect(() => {
        getPermissions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const getPermissions = async () => {
        try {
            const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoPermission) {
                setVideoAvailable(true);
            } else {
                setVideoAvailable(false);
            }

            const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (audioPermission) {
                setAudioAvailable(true);
            } else {
                setAudioAvailable(false);
            }

            if (navigator.mediaDevices.getDisplayMedia) {
                setScreenAvailable(true);
            } else {
                setScreenAvailable(false);
            }

            if (videoAvailable || audioAvailable) {
                const userMediaStream = await navigator.mediaDevices.getUserMedia({ video: videoAvailable, audio: audioAvailable });
                if (userMediaStream) {
                    window.localStream = userMediaStream;
                    cameraStreamRef.current = userMediaStream;
                    if (localVideoref.current) {
                        localVideoref.current.srcObject = userMediaStream;
                    }
                }
            }
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        if (video !== undefined && audio !== undefined) {
            getUserMedia();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [video, audio])

    let getMedia = () => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        connectToSocketServer();
    }

    let getUserMediaSuccess = (stream) => {
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        } catch (e) { console.log(e) }

        window.localStream = stream
        cameraStreamRef.current = stream;
        localVideoref.current.srcObject = stream

        const conns = connectionsRef.current;
        for (let id in conns) {
            if (id === socketIdRef.current) continue
            conns[id].addStream(window.localStream)
            conns[id].createOffer().then((description) => {
                conns[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': conns[id].localDescription }))
                    })
                    .catch(e => console.log(e))
            })
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setVideo(false);
            setAudio(false);
            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { console.log(e) }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSilence()
            localVideoref.current.srcObject = window.localStream

            const c = connectionsRef.current;
            for (let id in c) {
                c[id].addStream(window.localStream)
                c[id].createOffer().then((description) => {
                    c[id].setLocalDescription(description)
                        .then(() => {
                            socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': c[id].localDescription }))
                        })
                        .catch(e => console.log(e))
                })
            }
        })
    }

    let getUserMedia = () => {
        if ((video && videoAvailable) || (audio && audioAvailable)) {
            navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
                .then(getUserMediaSuccess)
                .then((stream) => { })
                .catch((e) => console.log(e))
        } else {
            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { }
        }
    }

    let getDislayMediaSuccess = (stream) => {
        // IMPORTANT: avoid stopping tracks + addStream renegotiation here.
        // That pattern commonly causes remote black video. Instead, replace the existing outgoing video track.
        window.localStream = stream
        if (localVideoref.current) localVideoref.current.srcObject = stream

        const screenVideoTrack = stream?.getVideoTracks?.()?.[0] || null;
        if (screenVideoTrack) {
            const conns = connectionsRef.current;
            for (let id in conns) {
                if (id === socketIdRef.current) continue
                try {
                    const sender = conns[id]?.getSenders?.()?.find((s) => s?.track?.kind === 'video');
                    if (sender) sender.replaceTrack(screenVideoTrack);
                } catch (e) { }
            }
        }

        stream.getTracks().forEach(track => track.onended = () => {
            displayStreamRef.current = null;
            try { socketRef.current?.emit('screen-share-stop'); } catch (e) { }
            setScreen(false)

            // Stop display tracks (if any) and restore camera preview + outgoing track.
            try {
                stream.getTracks().forEach((t) => t.stop());
            } catch (e) { }

            const cam = cameraStreamRef.current;
            const camVideoTrack = cam?.getVideoTracks?.()?.[0] || null;
            if (cam && localVideoref.current) {
                window.localStream = cam;
                localVideoref.current.srcObject = cam;
            }

            if (camVideoTrack) {
                const conns2 = connectionsRef.current;
                for (let id in conns2) {
                    if (id === socketIdRef.current) continue
                    try {
                        const sender = conns2[id]?.getSenders?.()?.find((s) => s?.track?.kind === 'video');
                        if (sender) sender.replaceTrack(camVideoTrack);
                    } catch (e) { }
                }
            } else {
                getUserMedia();
            }
        })
    }

    let gotMessageFromServer = (fromId, message) => {
        var signal = JSON.parse(message)

        const conns = connectionsRef.current;
        if (fromId !== socketIdRef.current && conns[fromId]) {
            if (signal.sdp) {
                conns[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                    if (signal.sdp.type === 'offer') {
                        conns[fromId].createAnswer().then((description) => {
                            conns[fromId].setLocalDescription(description).then(() => {
                                socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': conns[fromId].localDescription }))
                            }).catch(e => console.log(e))
                        }).catch(e => console.log(e))
                    }
                }).catch(e => console.log(e))
            }

            if (signal.ice) {
                conns[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e))
            }
        }
    }

    let connectToSocketServer = () => {
        // Clean up any existing connections
        const oldConns = connectionsRef.current;
        for (let id in oldConns) {
            try { oldConns[id].close(); } catch (e) { }
        }
        connectionsRef.current = {};

        // If there was a previous socket, remove all listeners and disconnect
        if (socketRef.current) {
            try { socketRef.current.removeAllListeners(); socketRef.current.disconnect(); } catch (e) { }
        }

        const token = authService.getToken();
        const socket = io.connect(server_url, {
            secure: false,
            auth: token ? { token } : {}
        });
        socketRef.current = socket;

        // ── Register ALL listeners ONCE on the socket (NOT inside 'connect') ──
        // This prevents duplicate listeners on reconnect.

        socket.on('signal', gotMessageFromServer);

        socket.on('chat-message', addMessage);

        socket.on('user-left', (id) => {
            setVideos((videos) => videos.filter((video) => video.socketId !== id));
            setPeerNames((prev) => { const next = { ...prev }; delete next[id]; return next; });
            setScreenSharerId((prev) => (prev === id ? null : prev));
            const conns = connectionsRef.current;
            if (conns[id]) { try { conns[id].close(); } catch (e) { } delete conns[id]; }
        });

        socket.on('participant-info', (socketId, name) => {
            setPeerNames((prev) => ({ ...prev, [socketId]: name }));
        });

        socket.on('screen-share-started', (socketId, name) => {
            setScreenSharerId(socketId);
            if (name) setPeerNames((prev) => ({ ...prev, [socketId]: name }));
        });

        socket.on('screen-share-stopped', (socketId) => {
            setScreenSharerId((prev) => (prev === socketId ? null : prev));
        });

        socket.on('user-joined', (id, clients, joiningUsername) => {
            if (joiningUsername) {
                setPeerNames((prev) => ({ ...prev, [id]: joiningUsername }));
            }
            const conns = connectionsRef.current;
            const selfId = socketIdRef.current;
            clients.forEach((socketListId) => {
                if (socketListId === selfId) return;
                if (conns[socketListId]) return;
                conns[socketListId] = new RTCPeerConnection(peerConfigConnections);
                conns[socketListId].onicecandidate = function (event) {
                    if (event.candidate != null) {
                        socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }));
                    }
                };

                conns[socketListId].onaddstream = (event) => {
                    let videoExists = videoRef.current.find(video => video.socketId === socketListId);

                    if (videoExists) {
                        setVideos(videos => {
                            const updatedVideos = videos.map(video =>
                                video.socketId === socketListId ? { ...video, stream: event.stream } : video
                            );
                            videoRef.current = updatedVideos;
                            return updatedVideos;
                        });
                    } else {
                        let newVideo = {
                            socketId: socketListId,
                            stream: event.stream,
                            autoplay: true,
                            playsinline: true
                        };

                        setVideos(videos => {
                            const updatedVideos = [...videos, newVideo];
                            videoRef.current = updatedVideos;
                            return updatedVideos;
                        });
                    }
                };

                if (window.localStream !== undefined && window.localStream !== null) {
                    conns[socketListId].addStream(window.localStream);
                } else {
                    let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
                    window.localStream = blackSilence();
                    conns[socketListId].addStream(window.localStream);
                }
            });

            if (id === selfId) {
                for (let id2 in conns) {
                    if (id2 === selfId) continue;
                    try {
                        conns[id2].addStream(window.localStream);
                    } catch (e) { }

                    conns[id2].createOffer().then((description) => {
                        conns[id2].setLocalDescription(description)
                            .then(() => {
                                socketRef.current.emit('signal', id2, JSON.stringify({ 'sdp': conns[id2].localDescription }));
                            })
                            .catch(e => console.log(e));
                    });
                }
            }
        });

        // ── 'connect' handler: only emit join-call and store socket ID ──
        // This fires on initial connect AND on reconnect.
        socket.on('connect', () => {
            const code = (window.location.pathname || '').replace(/^\/+/, '').trim() || 'default';
            socket.emit('join-call', code, username || 'Guest');
            socketIdRef.current = socket.id;
        });
    }

    let silence = () => {
        let ctx = new AudioContext()
        let oscillator = ctx.createOscillator()
        let dst = oscillator.connect(ctx.createMediaStreamDestination())
        oscillator.start()
        ctx.resume()
        return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false })
    }

    let black = ({ width = 640, height = 480 } = {}) => {
        let canvas = Object.assign(document.createElement("canvas"), { width, height })
        canvas.getContext('2d').fillRect(0, 0, width, height)
        let stream = canvas.captureStream()
        return Object.assign(stream.getVideoTracks()[0], { enabled: false })
    }

    let handleVideo = () => {
        setVideo(!video);
    }

    let handleAudio = () => {
        setAudio(!audio)
    }

    const stopScreenShare = () => {
        try {
            const s = displayStreamRef.current;
            if (s) s.getTracks().forEach((t) => t.stop());
        } catch (e) { }
        displayStreamRef.current = null;
        setScreen(false);
        try { socketRef.current?.emit('screen-share-stop'); } catch (e) { }

        // Restore camera video track without renegotiation (prevents black tiles on other participants).
        const cam = cameraStreamRef.current;
        const camVideoTrack = cam?.getVideoTracks?.()?.[0] || null;
        if (cam && localVideoref.current) {
            window.localStream = cam;
            localVideoref.current.srcObject = cam;
        }

        if (camVideoTrack) {
            const conns = connectionsRef.current;
            for (let id in conns) {
                if (id === socketIdRef.current) continue;
                try {
                    const sender = conns[id]?.getSenders?.()?.find((s) => s?.track?.kind === 'video');
                    if (sender) sender.replaceTrack(camVideoTrack);
                } catch (e) { }
            }
        } else {
            getUserMedia();
        }
    };

    const startScreenShare = async () => {
        const selfId = socketIdRef.current;
        if (screenSharerId && selfId && screenSharerId !== selfId) {
            const who = peerNames[screenSharerId] || 'Someone';
            alert(`${who} is already sharing the screen. Only one person can share at a time.`);
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
            displayStreamRef.current = stream;
            setScreen(true);
            getDislayMediaSuccess(stream);

            // Reserve the share on the server; if denied, revert immediately
            socketRef.current?.emit('screen-share-start', (res) => {
                if (!res?.ok) {
                    const who = res?.sharerName || 'Someone';
                    alert(`${who} is already sharing the screen. Try again later.`);
                    stopScreenShare();
                }
            });
        } catch (e) {
            setScreen(false);
        }
    };

    let handleScreen = () => {
        if (screen) {
            stopScreenShare();
        } else {
            startScreenShare();
        }
    }

    let handleEndCall = () => {
        try {
            let tracks = localVideoref.current.srcObject.getTracks()
            tracks.forEach(track => track.stop())
        } catch (e) { }
        window.location.href = "/home"
    }

    const addMessage = (data, sender, socketIdSender) => {
        setMessages((prevMessages) => [
            ...prevMessages,
            { sender: sender, data: data }
        ]);
        if (socketIdSender !== socketIdRef.current) {
            setNewMessages((prevNewMessages) => prevNewMessages + 1);
        }
    };

    let sendMessage = () => {
        socketRef.current.emit('chat-message', message, username)
        setMessage("");
    }

    let connect = () => {
        setAskForUsername(false);
        getMedia();
    }

    const handleToggleChat = () => {
        setShowChat(!showChat);
        if (!showChat) {
            setNewMessages(0);
        }
    }

    // Get meeting code from URL
    const meetingCode = window.location.pathname.replace('/', '');

    // Dynamic grid columns based on participant count
    const totalParticipants = 1 + videos.length;
    const getGridCols = () => {
        if (totalParticipants === 1) return 'grid-cols-1';
        if (totalParticipants === 2) return 'grid-cols-1 md:grid-cols-2';
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    };

    return (
        <div className="h-screen w-screen bg-ll-bg text-ll-text flex flex-col overflow-hidden">

            {askForUsername === true ? (
                <Lobby
                    username={username}
                    localVideoref={localVideoref}
                    setUsername={setUsername}
                    connect={connect}
                />
            ) : (
                <>
                    {/* Main content: video grid + chat sidebar */}
                    <div className="flex flex-1 min-h-0">

                        {/* Video area */}
                        <div className="flex-1 min-w-0 p-2 md:p-3 pb-20 md:pb-24 flex items-center justify-center overflow-auto">
                            {screenSharerId ? (
                                /* Screen-share layout: big shared screen on left, other tiles stacked on the right */
                                <div className="w-full h-full flex flex-col md:flex-row gap-2 md:gap-3 max-w-7xl">
                                    {/* Shared screen (large) */}
                                    {screenSharerId === socketIdRef.current ? (
                                        <div className="relative flex-1 min-w-0 rounded-2xl overflow-hidden bg-gray-800 shadow-lg border border-ll-border">
                                            <video
                                                className="w-full h-full object-contain bg-gray-800"
                                                ref={localVideoref}
                                                autoPlay
                                                muted
                                            ></video>
                                            <div className="absolute bottom-2 left-2 md:bottom-3 md:left-3 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-md text-white text-xs md:text-sm font-medium">
                                                {username || 'You'} (presenting)
                                            </div>
                                        </div>
                                    ) : (
                                        videos.filter((v) => v.socketId === screenSharerId).map((vid) => (
                                            <div key={vid.socketId} className="relative flex-1 min-w-0 rounded-2xl overflow-hidden bg-gray-800 shadow-lg border border-ll-border">
                                                <Video stream={vid.stream} />
                                                <div className="absolute bottom-2 left-2 md:bottom-3 md:left-3 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-md text-white text-xs md:text-sm font-medium">
                                                    {peerNames[vid.socketId] || 'User'} (presenting)
                                                </div>
                                            </div>
                                        ))
                                    )}

                                    {/* Other participants (stacked vertically on the right side) */}
                                    <div className="flex md:flex-col gap-2 md:gap-3 md:w-52 lg:w-64 flex-shrink-0 overflow-y-auto">
                                        {/* Show local tile if local user is NOT the sharer */}
                                        {screenSharerId !== socketIdRef.current && (
                                            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-gray-800 shadow border border-ll-border">
                                                <video
                                                    className="w-full h-full object-contain bg-gray-800"
                                                    ref={localVideoref}
                                                    autoPlay
                                                    muted
                                                ></video>
                                                {!video && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                                                        <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-ll-accent flex items-center justify-center text-white text-lg md:text-xl font-bold">
                                                            {username ? username.charAt(0).toUpperCase() : 'Y'}
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="absolute bottom-1 left-1 bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded text-white text-[10px] md:text-xs font-medium">
                                                    {username || 'You'}
                                                </div>
                                            </div>
                                        )}

                                        {/* Remote tiles that aren't the sharer */}
                                        {videos.filter((v) => v.socketId !== screenSharerId).map((vid, index) => (
                                            <div key={vid.socketId} className="relative aspect-video w-full rounded-xl overflow-hidden bg-gray-800 shadow border border-ll-border">
                                                <Video stream={vid.stream} />
                                                <div className="absolute bottom-1 left-1 bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded text-white text-[10px] md:text-xs font-medium">
                                                    {peerNames[vid.socketId] || `User ${index + 1}`}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                /* Normal grid layout - no screen sharing */
                                <div className={`w-full max-w-6xl grid ${getGridCols()} gap-2 md:gap-3 place-items-center content-center`}>
                                    {/* Local Video Tile */}
                                    <div className="relative w-full aspect-video max-h-full rounded-2xl overflow-hidden bg-gray-800 shadow-lg border border-ll-border">
                                        <video
                                            className="w-full h-full object-contain bg-gray-800"
                                            ref={localVideoref}
                                            autoPlay
                                            muted
                                        ></video>
                                        {!video && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                                                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-ll-accent flex items-center justify-center text-white text-2xl sm:text-3xl md:text-4xl font-bold">
                                                    {username ? username.charAt(0).toUpperCase() : 'Y'}
                                                </div>
                                            </div>
                                        )}
                                        <div className="absolute bottom-2 left-2 md:bottom-3 md:left-3 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-md text-white text-xs md:text-sm font-medium">
                                            {username || 'You'}
                                        </div>
                                    </div>

                                    {/* Remote Video Tiles */}
                                    {videos.map((vid, index) => (
                                        <div key={vid.socketId} className="relative w-full aspect-video max-h-full rounded-2xl overflow-hidden bg-gray-800 shadow-lg border border-ll-border">
                                            <Video stream={vid.stream} />
                                            <div className="absolute bottom-2 left-2 md:bottom-3 md:left-3 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-md text-white text-xs md:text-sm font-medium">
                                                {peerNames[vid.socketId] || `User ${index + 1}`}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Chat sidebar - desktop: side panel, mobile: full-screen overlay */}
                        <AnimatePresence>
                            {showChat && (
                                <>
                                    {/* Mobile overlay backdrop */}
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="md:hidden fixed inset-0 bg-black/30 z-40"
                                        onClick={handleToggleChat}
                                    />

                                    {/* Desktop chat panel - z-40 so it sits ABOVE the controls bar (z-30) */}
                                    <motion.div
                                        initial={{ width: 0, opacity: 0 }}
                                        animate={{ width: 'auto', opacity: 1 }}
                                        exit={{ width: 0, opacity: 0 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                        className="hidden md:flex w-80 lg:w-96 flex-shrink-0 border-l border-ll-border relative z-40"
                                    >
                                        <Chat
                                            messages={messages}
                                            message={message}
                                            setMessage={setMessage}
                                            sendMessage={sendMessage}
                                            onClose={handleToggleChat}
                                            username={username}
                                        />
                                    </motion.div>

                                    {/* Mobile full-screen chat */}
                                    <motion.div
                                        initial={{ y: '100%' }}
                                        animate={{ y: 0 }}
                                        exit={{ y: '100%' }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                        className="md:hidden fixed inset-0 z-50 bg-white"
                                    >
                                        <Chat
                                            messages={messages}
                                            message={message}
                                            setMessage={setMessage}
                                            sendMessage={sendMessage}
                                            onClose={handleToggleChat}
                                            username={username}
                                        />
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Bottom controls bar */}
                    <div className="absolute bottom-0 left-0 right-0 z-30">
                        <div className="bg-white/90 backdrop-blur-sm border-t border-ll-border flex items-center justify-between px-3 md:px-6 py-3 md:py-4">

                            {/* Left: time + meeting code */}
                            <div className="hidden md:flex items-center gap-3 text-ll-text-secondary text-sm">
                                <span className="font-medium">{currentTime}</span>
                                <span className="text-ll-border-strong">|</span>
                                <span className="font-mono tracking-wide text-ll-text">{meetingCode}</span>
                            </div>

                            {/* Center: control buttons */}
                            <div className="flex items-center gap-1.5 sm:gap-2 mx-auto md:mx-0">

                                {/* Microphone */}
                                <button
                                    onClick={handleAudio}
                                    className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm ${
                                        audio
                                            ? 'bg-ll-elevated hover:bg-ll-border text-ll-text'
                                            : 'bg-ll-danger hover:bg-ll-danger-hover text-white'
                                    }`}
                                    title={audio ? 'Mute microphone' : 'Unmute microphone'}
                                >
                                    {audio
                                        ? <MicrophoneIcon className="h-5 w-5 md:h-6 md:w-6" />
                                        : <NoSymbolIcon className="h-5 w-5 md:h-6 md:w-6" />
                                    }
                                </button>

                                {/* Camera */}
                                <button
                                    onClick={handleVideo}
                                    className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm ${
                                        video
                                            ? 'bg-ll-elevated hover:bg-ll-border text-ll-text'
                                            : 'bg-ll-danger hover:bg-ll-danger-hover text-white'
                                    }`}
                                    title={video ? 'Turn off camera' : 'Turn on camera'}
                                >
                                    {video
                                        ? <VideoCameraIcon className="h-5 w-5 md:h-6 md:w-6" />
                                        : <VideoCameraSlashIcon className="h-5 w-5 md:h-6 md:w-6" />
                                    }
                                </button>

                                {/* Screen share */}
                                {screenAvailable && (
                                    <button
                                        onClick={handleScreen}
                                        disabled={Boolean(screenSharerId && socketIdRef.current && screenSharerId !== socketIdRef.current)}
                                        className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed ${
                                            screen
                                                ? 'bg-ll-accent text-white'
                                                : 'bg-ll-elevated hover:bg-ll-border text-ll-text'
                                        }`}
                                        title={screen ? 'Stop presenting' : (screenSharerId && socketIdRef.current && screenSharerId !== socketIdRef.current ? 'Someone is already presenting' : 'Present now')}
                                    >
                                        {screen
                                            ? <StopCircleIcon className="h-5 w-5 md:h-6 md:w-6" />
                                            : <ComputerDesktopIcon className="h-5 w-5 md:h-6 md:w-6" />
                                        }
                                    </button>
                                )}

                                {/* End call */}
                                <button
                                    onClick={handleEndCall}
                                    className="h-10 md:h-12 px-5 md:px-6 rounded-full bg-ll-danger hover:bg-ll-danger-hover text-white flex items-center justify-center transition-all duration-200 ml-2 shadow-md hover:shadow-lg"
                                    title="Leave call"
                                >
                                    <PhoneXMarkIcon className="h-5 w-5 md:h-6 md:w-6" />
                                </button>
                            </div>

                            {/* Right: info, chat, participants */}
                            <div className="hidden md:flex items-center gap-1">
                                <button
                                    className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center hover:bg-ll-elevated text-ll-text-secondary transition-colors"
                                    title="Meeting details"
                                >
                                    <InformationCircleIcon className="h-5 w-5 md:h-6 md:w-6" />
                                </button>

                                <button
                                    className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center hover:bg-ll-elevated text-ll-text-secondary transition-colors"
                                    title="People"
                                >
                                    <UserGroupIcon className="h-5 w-5 md:h-6 md:w-6" />
                                </button>

                                {/* Chat toggle */}
                                <div className="relative">
                                    <button
                                        onClick={handleToggleChat}
                                        className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-colors ${
                                            showChat
                                                ? 'bg-ll-accent text-white'
                                                : 'hover:bg-ll-elevated text-ll-text-secondary'
                                        }`}
                                        title="Chat with everyone"
                                    >
                                        <ChatBubbleLeftRightIcon className="h-5 w-5 md:h-6 md:w-6" />
                                    </button>
                                    {newMessages > 0 && !showChat && (
                                        <span className="absolute -top-1 -right-1 bg-ll-accent text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                                            {newMessages}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Mobile-only chat toggle */}
                            <div className="md:hidden relative">
                                <button
                                    onClick={handleToggleChat}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-sm ${
                                        showChat
                                            ? 'bg-ll-accent text-white'
                                            : 'bg-ll-elevated text-ll-text'
                                    }`}
                                    title="Chat"
                                >
                                    <ChatBubbleLeftRightIcon className="h-5 w-5" />
                                </button>
                                {newMessages > 0 && !showChat && (
                                    <span className="absolute -top-1 -right-1 bg-ll-accent text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                                        {newMessages}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}