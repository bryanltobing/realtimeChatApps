const socket = io();

// Elements
const $messageForm = document.querySelector('#messageForm');
const $messageFormInput = document.querySelector('#message');
const $messageFormButton = document.querySelector('button');
const $sendLocationButton = document.querySelector('#share-location');
const $messages = document.querySelector('#messages');

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix : true });

const autoScroll = () => {
    // New message
    const $newMessage = $messages.lastElementChild;

    // Height of the last message
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offSetHeight + newMessageMargin;

    // Visible Height
    const visibleHeight = $messages.offSetHeight;

    // Height of messages container
    const containerHeight = $messages.scrollHeight;

    // How far have i scrolled ?
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if(containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight;
    }


}

socket.on('message', (message) => {
    console.log(message);
    const html = Mustache.render(messageTemplate, {
        username : message.username,
        message : message.text,
        createdAt : moment(message.createdAt).format('h:mm a') 
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoScroll();
});

socket.on('welcome', (welcomeMessage) => {
    console.log(welcomeMessage);
    const html = Mustache.render(messageTemplate, {
        username : welcomeMessage.username,
        message : welcomeMessage.text,
        createdAt : moment(welcomeMessage.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoScroll();
});

socket.on('locationMessage', (locationMessage) => {
    console.log(locationMessage);
    const html = Mustache.render(locationMessageTemplate, {
        username : locationMessage.username,
        location : locationMessage.url,
        createdAt : moment(locationMessage.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoScroll();
});

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });
    document.querySelector('#sidebar').innerHTML = html;
    console.log(users);
});

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // disable button
    $messageFormButton.setAttribute('disabled','disabled');

    let message = e.target.elements.message.value;
    socket.emit('sendMessage', message, (error) => {
        // enable button
        $messageFormButton.removeAttribute('disabled');
        $messageFormInput.value = '';
        $messageFormInput.focus();
        if(error) {
            console.log(error);
        }
    });

});

$sendLocationButton.addEventListener('click', () => {
    if(!navigator.geolocation) {
        return alert('your browser doesn\'t support geolocation');
    }

    $sendLocationButton.setAttribute('disabled', 'disabled');

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            lattitude : position.coords.latitude,
            longitude : position.coords.longitude
        }, () => {
            setTimeout(() => {
                $sendLocationButton.removeAttribute('disabled');
            }, 4000);
            console.log('Location shared!');
        });
    });
});

socket.emit('join', {
    username, room
}, (error) => {
    if(error) {
        alert(error);
        location.href = '/'
    }
})





