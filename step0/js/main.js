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
mouse_x = 0;
mouse_y = 0;

function keyReset() {
 this.key.left=false;
 this.key.right=false;
 this.key.up=false;
 this.key.down=false;
}


canvas.addEventListener('mousemove', function(evt) {
    var mousePos = getMousePos(canvas, evt);
    mouse_x=mousePos.x;
    mouse_y=mousePos.y;
},false);
window.addEventListener('keydown', function (evt) {
    switch (evt.keyCode){
        case 37: this.key.left=true; break;
        case 38: this.key.up=true; break;
        case 39: this.key.right=true; break;
        case 40: this.key.down=true; break;
    }
});
Game.update= function() {
    // if (Math.abs(arcstart)<2*Pi){
    //     arcstart-=2*Pi*direction;
    // }
    arcstart=Math.atan2(mouse_y-50,mouse_x-50)+(Pi/2);
    keyReset();
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
    if (this.key.right==true) { actor_x+=1;}
    if (this.key.left==true) { actor_x-=1;}
    if (this.key.up==true) { actor_y-=1;}
    if (this.key.down==true) { actor_y+=1;}
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

