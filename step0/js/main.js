var canvas=document.getElementById('hworld');
var context=canvas.getContext('2d');
context.lineWidth = 5;
context.lineCap = 'round';
var color='blue';
var Pi=Math.PI;
var Game={
    arcstart:0,
    direction:1,
    actor_x:50,
    actor_y:50,
    mouse_x:0,
    mouse_y:0,
    draw_color:'yellow',
    started:false,
    fps:30
};



var KeyFlags={
    left:false,
    right:false,
    up:false,
    down:false
};



canvas.addEventListener('mousemove', function(evt) {
    var mousePos = getMousePos(canvas, evt);
    Game.mouse_x=mousePos.x;
    Game.mouse_y=mousePos.y;
});

//TODO replace to array
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

//TODO create actor class
Game.update= function() {
    Game.arcstart=Math.atan2(Game.mouse_y - Game.actor_y, Game.mouse_x - Game.actor_x)+(Pi/2);
    move();
};

Game.draw= function () {
    context.beginPath();
    context.fillStyle = color;
    context.fillRect(0,0,1200,1300);
    context.strokeStyle = Game.draw_color;
    context.arc(Game.actor_x,Game.actor_y,20,Game.arcstart,Game.arcstart+Pi);
    console.log(Game.actor_x);
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
    if (KeyFlags.right==true) { Game.actor_x+=1;}
    if (KeyFlags.left==true) { Game.actor_x-=1;}
    if (KeyFlags.up==true) { Game.actor_y-=1;}
    if (KeyFlags.down==true) { Game.actor_y+=1;}
}



function GameStart() {
    if (Game.started==false) {
        Game._intervalId = setInterval(Game.run, 1000 / Game.fps);
        Game.started=true;
    }
}

function GameStop() {
    clearInterval(Game._intervalId);
    Game.started=false;
}

