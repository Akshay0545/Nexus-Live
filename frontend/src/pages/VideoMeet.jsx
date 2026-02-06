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
import Chat from './Chat';
import Video from './Video';
import Lobby from './Lobby';

const server_url = server;

var connections = {};

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

    useEffect(() => {
        getPermissions();
    }, []);

    let getDislayMedia = () => {
        if (screen) {
            if (navigator.mediaDevices.getDisplayMedia) {
                navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                    .then(getDislayMediaSuccess)
                    .then((stream) => { })
                    .catch((e) => console.log(e))
            }
        }
    }

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
        localVideoref.current.srcObject = stream

        for (let id in connections) {
            if (id === socketIdRef.current) continue
            connections[id].addStream(window.localStream)
            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
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

            for (let id in connections) {
                connections[id].addStream(window.localStream)
                connections[id].createOffer().then((description) => {
                    connections[id].setLocalDescription(description)
                        .then(() => {
                            socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
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
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        } catch (e) { console.log(e) }

        window.localStream = stream
        localVideoref.current.srcObject = stream

        for (let id in connections) {
            if (id === socketIdRef.current) continue
            connections[id].addStream(window.localStream)
            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                    })
                    .catch(e => console.log(e))
            })
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setScreen(false)
            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { console.log(e) }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSilence()
            localVideoref.current.srcObject = window.localStream
            getUserMedia()
        })
    }

    let gotMessageFromServer = (fromId, message) => {
        var signal = JSON.parse(message)

        if (fromId !== socketIdRef.current) {
            if (signal.sdp) {
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                    if (signal.sdp.type === 'offer') {
                        connections[fromId].createAnswer().then((description) => {
                            connections[fromId].setLocalDescription(description).then(() => {
                                socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': connections[fromId].localDescription }))
                            }).catch(e => console.log(e))
                        }).catch(e => console.log(e))
                    }
                }).catch(e => console.log(e))
            }

            if (signal.ice) {
                connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e))
            }
        }
    }

    let connectToSocketServer = () => {
        socketRef.current = io.connect(server_url, { secure: false })

        socketRef.current.on('signal', gotMessageFromServer)

        socketRef.current.on('connect', () => {
            socketRef.current.emit('join-call', window.location.href)
            socketIdRef.current = socketRef.current.id

            socketRef.current.on('chat-message', addMessage)

            socketRef.current.on('user-left', (id) => {
                setVideos((videos) => videos.filter((video) => video.socketId !== id))
            })

            socketRef.current.on('user-joined', (id, clients) => {
                clients.forEach((socketListId) => {
                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections)
                    connections[socketListId].onicecandidate = function (event) {
                        if (event.candidate != null) {
                            socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }))
                        }
                    }

                    connections[socketListId].onaddstream = (event) => {
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
                        connections[socketListId].addStream(window.localStream)
                    } else {
                        let blackSilence = (...args) => new MediaStream([black(...args), silence()])
                        window.localStream = blackSilence()
                        connections[socketListId].addStream(window.localStream)
                    }
                })

                if (id === socketIdRef.current) {
                    for (let id2 in connections) {
                        if (id2 === socketIdRef.current) continue
                        try {
                            connections[id2].addStream(window.localStream)
                        } catch (e) { }

                        connections[id2].createOffer().then((description) => {
                            connections[id2].setLocalDescription(description)
                                .then(() => {
                                    socketRef.current.emit('signal', id2, JSON.stringify({ 'sdp': connections[id2].localDescription }))
                                })
                                .catch(e => console.log(e))
                        })
                    }
                }
            })
        })
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

    useEffect(() => {
        if (screen !== undefined) {
            getDislayMedia();
        }
    }, [screen])

    let handleScreen = () => {
        setScreen(!screen);
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

                        {/* Video grid area */}
                        <div className="flex-1 min-w-0 p-2 md:p-3 pb-20 md:pb-24 flex items-center justify-center">
                            <div className={`w-full h-full grid ${getGridCols()} gap-2 md:gap-3 auto-rows-fr`}>

                                {/* Local Video Tile */}
                                <div className="relative bg-gray-800 rounded-2xl overflow-hidden min-h-0 shadow-lg border border-ll-border">
                                    <video
                                        className="w-full h-full object-cover"
                                        ref={localVideoref}
                                        autoPlay
                                        muted
                                    ></video>

                                    {/* Avatar fallback when video is off */}
                                    {!video && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                                            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-ll-accent flex items-center justify-center text-white text-2xl sm:text-3xl md:text-4xl font-bold">
                                                {username ? username.charAt(0).toUpperCase() : 'Y'}
                                            </div>
                                        </div>
                                    )}

                                    {/* Name badge */}
                                    <div className="absolute bottom-2 left-2 md:bottom-3 md:left-3 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-md text-white text-xs md:text-sm font-medium">
                                        {username || 'You'}
                                    </div>
                                </div>

                                {/* Remote Video Tiles */}
                                {videos.map((vid, index) => (
                                    <div key={vid.socketId} className="relative bg-gray-800 rounded-2xl overflow-hidden min-h-0 shadow-lg border border-ll-border">
                                        <Video stream={vid.stream} />
                                        <div className="absolute bottom-2 left-2 md:bottom-3 md:left-3 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-md text-white text-xs md:text-sm font-medium">
                                            User {index + 1}
                                        </div>
                                    </div>
                                ))}
                            </div>
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

                                    {/* Desktop chat panel */}
                                    <motion.div
                                        initial={{ width: 0, opacity: 0 }}
                                        animate={{ width: 'auto', opacity: 1 }}
                                        exit={{ width: 0, opacity: 0 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                        className="hidden md:flex w-80 lg:w-96 flex-shrink-0 border-l border-ll-border"
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
                                        className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm ${
                                            screen
                                                ? 'bg-ll-accent text-white'
                                                : 'bg-ll-elevated hover:bg-ll-border text-ll-text'
                                        }`}
                                        title={screen ? 'Stop presenting' : 'Present now'}
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