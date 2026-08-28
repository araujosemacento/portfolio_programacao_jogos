/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
// @ts-nocheck
let estrelas = [];
let slider;

function setup() {
	slider = createSlider(0, 2, 1);
	slider.position(300, 475);
	slider.style('width', '300px');

	createCanvas(500, 500);

	for (let i = 0; i < (width + height) / 2; i++) {
		estrelas[i] = new Estrela();
	}
}

function draw() {
	translate(width / 2, height / 2);
	background(0);

	for (let i = 0; i < estrelas.length; i++) {
		estrelas[i].mostrar();
		estrelas[i].atualizar();
	}
}

function Estrela() {
	this.x = random(-width / 2, width / 2);
	this.y = random(-height / 2, height / 2);
	this.z = random(width);
	this.zanterior = this.z;
	this.accel = 0;

	this.mostrar = function () {
		fill(255);
		stroke(255);

		let movimento_x = map(this.x / this.z, 0, 1, 0, width);
		let movimento_y = map(this.y / this.z, 0, 1, 0, height);
		let diametro = map(this.z, 0, width, 10, 0);

		circle(movimento_x, movimento_y, diametro);
	};

	this.atualizar = function () {
		if (slider.value() === 2) {
			this.accel += 0.05;
			this.accel = constrain(this.accel, 1, 20);
		} else if (slider.value() === 1) {
			this.accel = 1;
		} else {
			this.accel = 0;
		}

		this.z -= slider.value() * this.accel;
		if (this.z <= 0) {
			this.x = random(-width / 2, width / 2);
			this.y = random(-height / 2, height / 2);
			this.z = width;
		}
	};
}
