// @ts-nocheck
/* eslint-disable */

let movendo = false;
let ball_pos, ball_vel, ball_size;
let player_pos, adv_pos, paddle_height, paddle_width;
let input_stack, meio_da_tela;

function setup() {
    createCanvas(windowWidth, windowHeight);
    strokeWeight(3);
    stroke(255);

    // Inicializando as coordenadas
    meio_da_tela = createVector(width / 2, height / 2);
    input_stack = [];

    // Coordenadas da bola
    ball_size = height / 25;
    ball_pos = createVector(meio_da_tela.x, meio_da_tela.y);
    ball_vel = createVector(height / 100, height / 100);

    // Coordenadas das raquetes
    paddle_height = height / 5;
    paddle_width = height / 75;
    paddle_vel = height / 133;
    player_pos = createVector(
        ball_size + paddle_width / 2,
        height / 2 - paddle_height / 2,
    );
    adv_pos = createVector(
        width - paddle_width - ball_size,
        height / 2 - paddle_height / 2,
    );
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function draw() {
    // Desenhando o meio da mesa
    background(0);
    for (i = 0; i < height / 10; i++) {
        if (i % 2 == 0) {
            line(width / 2, i * 10, width / 2, i * 10 + 10);
        }
    }

    // Desenhando a bola
    circle(ball_pos.x, ball_pos.y, ball_size);

    // Desenhar as raquetes
    for (let i = 0; i <= 2; i++) {
        i % 2 == 0
            ? rect(player_pos.x, player_pos.y, paddle_width, paddle_height)
            : rect(adv_pos.x, adv_pos.y, paddle_width, paddle_height);
    }

    // Atualizando as coordenadas da bola
    if (movendo) {
        ball_pos.add(ball_vel);
    }

    // Movendo as raquetes
    if (input_stack.length > 0) {
        let tecla = input_stack[input_stack.length - 1];
        if (tecla == 87) {
            player_pos.y -= paddle_vel;
        } else if (tecla == 83) {
            player_pos.y += paddle_vel;
        }

    // input_stack funciona como uma pilha (LIFO)
    // Pra que a raquete possa processar inputs
    // rápidos e discordantes simultanemaente sem "engasgar"
    // Ex.: Segurar W, apertar S, soltar S e só então soltar W.
    }

    player_pos.y = constrain(player_pos.y, 0, height - paddle_height);
    adv_pos.y = constrain(adv_pos.y, 0, height - paddle_height);

    // Detecção de colisão com a borda horizontal
    if (
        ball_pos.x - ball_size / 2 <= 0 ||
        ball_pos.x + ball_size / 2 >= width
    ) {
        ball_vel.x = ball_vel.x * -1;
    }

    // Detecção de colisão com a borda vertical
    if (
        ball_pos.y - ball_size / 2 <= 0 ||
        ball_pos.y + ball_size / 2 >= height
    ) {
        ball_vel.y = ball_vel.y * -1;
    }
}

function keyPressed(event) {
    if (key == " ") {
        movendo = !movendo;
    }

    // Adiciona a tecla pressionada ao input stack
    const code = event.which || event.keyCode;
    if (code == 87) {
        input_stack.includes(87) ? null : input_stack.push(87);
    }
    if (code == 83) {
        input_stack.includes(83) ? null : input_stack.push(83);
    }

}

// Remove a tecla pressionada do input stack
function keyReleased(event) {
    const code = event.which || event.keyCode;
    input_stack = input_stack.filter((tecla) => tecla != code);
}
