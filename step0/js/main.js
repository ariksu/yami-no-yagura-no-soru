var canvas=document.getElementById('hworld');
var context=canvas.getContext('2d');
var color='blue';
var arcstart=0;
var Pi=Math.PI;
var rotate_angle = Pi/15;
var direction=1;
var actor_x=50;
var actor_y=50;
var Game={};
var mouse_x = 0;
var mouse_y = 0;
var KeyFlags={
    left:false,
    right:false,
    up:false,
    down:false
};



canvas.addEventListener('mousemove', function(evt) {
    var mousePos = getMousePos(canvas, evt);
    mouse_x=mousePos.x;
    mouse_y=mousePos.y;
},false);
window.addEventListener('keydown', function (evt) {
    switch (evt.keyCode){
        case 37: KeyFlags.left=true; break;
        case 38: KeyFlags.up=true; break;
        case 39: KeyFlags.right=true; break;
        case 40: KeyFlags.down=true; break;
    }
});

window.addEventListener('keyup', function (evt) {
    switch (evt.keyCode){
        case 37: KeyFlags.left=false; break;
        case 38: KeyFlags.up=false; break;
        case 39: KeyFlags.right=false; break;
        case 40: KeyFlags.down=false; break;
    }
});
Game.update= function() {
    // if (Math.abs(arcstart)<2*Pi){
    //     arcstart-=2*Pi*direction;
    // }
    arcstart=Math.atan2(mouse_y-actor_y,mouse_x-actor_x)+(Pi/2);
    move();
};
Game.fps = 30;
Game.draw= function () {
    context.beginPath();
    context.fillStyle = color;
    context.fillRect(0,0,1200,1300);

    context.strokeStyle = 'yellow';
    context.lineWidth = 5;
    context.lineCap = 'round';
    context.arc(actor_x,actor_y,20,arcstart,arcstart+Pi);
    context.stroke();
};


Game.run = function() {

    Game.update();
    Game.draw();
};

function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

function move(){
    if (KeyFlags.right==true) { actor_x+=1;}
    if (KeyFlags.left==true) { actor_x-=1;}
    if (KeyFlags.up==true) { actor_y-=1;}
    if (KeyFlags.down==true) { actor_y+=1;}
}

function colorChange(){
    if (color=='blue') {
        color='red';
    }
    else {
        color='blue';
    }
}

function rotationChange(){
    direction=-direction;
}

Game.started=false
function GameStart() {
    if (Game.started==false) {
        Game._intervalId = setInterval(Game.run, 1000 / Game.fps);
        Game.started=true;
        keyReset();
    }
}

function GameStop() {
    clearInterval(Game._intervalId);
    Game.started=false;
}

