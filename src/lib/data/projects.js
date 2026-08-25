/**
 * Lista de projetos e sketches para o portfólio de Programação para Jogos I.
 */
export const projects = [
	{
		id: 'starfield',
		slug: 'starfield',
		title: 'Campo de Estrelas',
		description: 'Simulação de viagem espacial por um campo de estrelas.',
		accentColor: '#c7d2fe',
		textColor: '#f4f4f5',
		icon: 'sparkles',
		/** @param {any} p5 */
		thumbnailSketch: (p5) => {
			p5.setup = () => {
				p5.createCanvas(480, 300);
				p5.noLoop();
			};
			p5.draw = () => {
				p5.background(0);
				p5.translate(p5.width / 2, p5.height / 2);
				p5.fill(255);
				p5.stroke(255);

				for (let i = 0; i < 200; i++) {
					let x = p5.random(-p5.width / 2, p5.width / 2);
					let y = p5.random(-p5.height / 2, p5.height / 2);
					let z = p5.random(10, p5.width);

					let sx = p5.map(x / z, 0, 1, 0, p5.width);
					let sy = p5.map(y / z, 0, 1, 0, p5.height);
					let d = p5.map(z, 0, p5.width, 8, 0);

					p5.circle(sx, sy, d);
				}
			};
		},
		/** @param {any} p5 */
		sketchFunction: (p5) => {
			/** @type {any[]} */
			let estrelas = [];
			/** @type {any} */
			let slider;

			function Estrela() {
				// @ts-ignore
				this.x = p5.random(-p5.width / 2, p5.width / 2);
				// @ts-ignore
				this.y = p5.random(-p5.height / 2, p5.height / 2);
				// @ts-ignore
				this.z = p5.random(p5.width);
				// @ts-ignore
				this.zanterior = this.z;
				// @ts-ignore
				this.accel = 0;

				// @ts-ignore
				this.mostrar = function () {
					p5.fill(255);
					p5.stroke(255);

					let movimento_x = p5.map(this.x / this.z, 0, 1, 0, p5.width);
					let movimento_y = p5.map(this.y / this.z, 0, 1, 0, p5.height);
					let diametro = p5.map(this.z, 0, p5.width, 10, 0);

					p5.circle(movimento_x, movimento_y, diametro);
				};

				// @ts-ignore
				this.atualizar = function () {
					let val = slider ? slider.value() : 1;
					if (val === 2) {
						// @ts-ignore
						this.accel += 0.05;
						this.accel = p5.constrain(this.accel, 1, 20);
					} else if (val === 1) {
						this.accel = 1;
					} else {
						this.accel = 0;
					}
					// @ts-ignore
					this.z -= val * this.accel;
					// @ts-ignore
					if (this.z <= 0) {
						this.x = p5.random(-p5.width / 2, p5.width / 2);
						this.y = p5.random(-p5.height / 2, p5.height / 2);
						this.z = p5.width;
					}
				};
			}

			p5.setup = () => {
				p5.createCanvas(500, 500);

				slider = p5.createSlider(0, 2, 1);
				slider.style('width', '200px');
				slider.style('accent-color', '#ed225d');

				for (let i = 0; i < (p5.width + p5.height) / 2; i++) {
					// @ts-ignore
					estrelas[i] = new Estrela();
				}
			};

			p5.draw = () => {
				p5.background(0);
				p5.translate(p5.width / 2, p5.height / 2);

				for (let i = 0; i < estrelas.length; i++) {
					estrelas[i].mostrar();
					estrelas[i].atualizar();
				}
			};
		},
		code: `let estrelas = [];
let slider;

function setup() {
  createCanvas(500, 500);

  slider = createSlider(0, 2, 1);
  slider.position(150, 450);
  slider.style("width", "200px");
  
  for (let i = 0; i < (width + height) / 2; i++) {
    estrelas[i] = new Estrela();
  }
}

function draw() {
  background(0);
  translate(width / 2, height / 2);

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
}`
	}
];
