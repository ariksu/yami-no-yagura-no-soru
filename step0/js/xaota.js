/**
 * Created by Aleksey.Petrov on 08.01.2017.
 */
class Game {
    constructor(context, size) {
        this.angle   =  0;            // [0 .. Math.PI * 2] начальный угол
        this.clock   = -1;            // [-1, 1] направление вращения по часовой
        this.speed   = Math.PI / 30;  // {Float} угловая скорость
        this.context = context.port(size).basis()
            .style({width: 5, cap: 'round', stroke: 'yellow', fill: 'white', align: 'center', font: 'normal 20px Tahoma'});
        this.PLAY    = false;
        this.RENDER  = 0;             // прошлый timestamp
        // FPS-meter
        this.LAST = 0;                // timestamp в момент предыдущего замера FPS
        this.FPS  = 0;
        this.fps  = 0;
        this.tick = 1000 / 60;        // ^_^
    }
    run(timestamp) {
        if (timestamp - this.LAST > 1000) {
            this.FPS  = this.fps;
            this.fps  = 0;
            this.LAST = timestamp;
        }
        ++this.fps;
        let render  = timestamp - this.RENDER;
        this.RENDER = timestamp;
        return this.update(render / this.tick).draw();
    }
    draw() {
        this.context.CLEAR().begin()
            .arc(60, this.angle, Math.PI) // рисует дугу радиусом 60, с угла this.angle и до угла this.angle + Math.PI
            .stroke().fillText(this.FPS.toString())
            .end();
        return this;
    }
    stop(button) {
        this.PLAY = false;
        button.innerHTML = 'start';
        if (this.loop) window.cancelAnimationFrame(this.loop);
        return this;
    }
    start(button) {
        let game = this;
        game.PLAY = true;
        button.innerHTML = 'stop';
        game.loop = window.requestAnimationFrame(frame);
        return this;
        function frame(timestamp) {
            game.run(timestamp).loop = window.requestAnimationFrame(frame);
        }
    }
    toggle(button) {
        return this.PLAY
            ? this.stop(button)
            : this.start(button);
    }
    change() {
        if (this.PLAY) this.clock = -this.clock;
        return this;
    }
    update(delta) { // delta = [0+ (faster) .. 1 (60 fps) .. 1+ (slower)]
        this.angle += this.speed * this.clock * delta;
        return this;
    }
}

window.onload = function() { // INIT
    let canvas = $('canvas'),
        context = new window.Canvas(canvas),
        game = new Game(context, Vector.from(640, 480)),
        btnState = $('#state'), // смена состояния (start / stop)
        btnColor = $('#color'), // цвет фона
        btnClock = $('#clock'); // направление вращения
    btnState.onclick = function(e) {
        game.toggle(this);
        return false;
    }
    btnColor.onclick = function(e) {
        canvas.style.backgroundColor = canvas.style.backgroundColor === 'blue' ? 'red' : 'blue';
        return false;
    }
    btnClock.onclick = function(e) {
        game.change();
        return false;
    }
    btnColor.click();       // цвет фона по-умолчанию
}

function $(e) { // DOM
    return typeof e === 'string'
        ? document.querySelector(e)
        : e;
}
