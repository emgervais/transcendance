const ambient = new Audio('static/app/sound/ambient.ogg');
ambient.loop = true;
ambient.volume = 0.5;

const hurt = new Audio('static/app/sound/hurt.ogg');
hurt.volume = 0.2;

const bounce = new Audio('static/app/sound/beep.ogg');
bounce.volume = 0.4;

export { ambient, hurt, bounce };