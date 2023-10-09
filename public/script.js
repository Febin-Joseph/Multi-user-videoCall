const socket = io('/');
const videoGrid = document.getElementById('video-grid');
const peer = new Peer(undefined, {
    host: '/',
    port: '3001',
    iceServers: [
        {
            urls: [
                "stun:stun.l.google.com:19302",
                "stun:global.stun.twilio.com:3478",
            ],
        },
    ],
});

const peers = {};

navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream => {
    const myVideo = document.createElement('video');
    myVideo.muted = true;
    addVideoStream(myVideo, stream);

    socket.emit('join-room', ROOM_ID, peer.id);

    peer.on('call', call => {
        call.answer(stream);
        const video = document.createElement('video');
        call.on('stream', userVideoStream => {
            addVideoStream(video, userVideoStream);
        });
    });

    socket.on('user-connected', userId => {
        console.log('User connected:', userId);

        if (userId !== peer.id) {
            connectToNewUser(userId, stream);
        } else {
            console.log('You joined the room with the same ID as an existing user.');
        }
    });

    socket.on('user-disconnected', userId => {
        console.log('User disconnected:', userId);
        if (peers[userId]) {
            peers[userId].close();
            delete peers[userId];
        }
    });

    peer.on('open', id => {
        console.log('My PeerJS ID:', id);
    });
});

peer.on('connection', conn => {
    conn.on('data', data => {
        console.log('Received data:', data); // Log received data
    });
});

function connectToNewUser(userId, stream) {
    const call = peer.call(userId, stream);
    const video = document.createElement('video');
    call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream);
    });
    call.on('close', () => {
        video.remove();
    });
    peers[userId] = call;
}

function addVideoStream(video, stream) {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
        video.play();
    });
    videoGrid.append(video);
}