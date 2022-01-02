
class DoublePendulum {
	constructor(r1, r2, m1, m2, a1, a2, g) {
		// Radius (m)
		this.r1 = r1;
		this.r2 = r2;
		// Mass (kg)
		this.m1 = m1;
		this.m2 = m2;
		// Angle (rad)
		this.a1 = a1;
		this.a2 = a2;
		// Angular velocity
		this.v1 = 0;
		this.v2 = 0;
		// Gravity
		this.g = g;
	}


	// Pedulums coordinates
	get x1() {
		return this.r1 * Math.sin(this.a1);
	}
	get y1() {
		return this.r1 * Math.cos(this.a1);
	}
	get x2() {
		return this.x1 + this.r2 * Math.sin(this.a2);
	}
	get y2() {
		return this.y1 + this.r2 * Math.cos(this.a2);
	}

	// Energies
	get mechanicalE() {
		return this.kineticE - this.potentialE;
	}

	get kineticE() {
		return (1 / 2) * this.m1 * this.r1 * this.r1 * this.v1 * this.v1 + (1 / 2) * this.m2 * (this.r1 * this.r1 * this.v1 * this.v1 + this.r2 * this.r2 * this.v2 * this.v2 + 2 * this.r1 * this.r2 * this.v1 * this.v2 * Math.cos(this.a1 - this.a2));
	}

	get potentialE() {
		return -(this.m1 + this.m2) * g * this.r1 * Math.cos(this.a1) - this.m2 * g * this.r2 * Math.cos(this.a2);
	}


	// Numerical approximation methods
	runForwardEuler() {
		const [acc1, acc2] = this._eulerAccs();

		this.a1 += this.v1;
		this.a2 += this.v2;

		this.v1 += acc1;
		this.v2 += acc2;
	}


	runBackwardEuler() {
		const [acc1, acc2] = this._eulerAccs();

		this.v1 += acc1;
		this.v2 += acc2;

		this.a1 += this.v1;
		this.a2 += this.v2;
	}


	_eulerAccs() {
		let
			num1 = -this.g * (2 * this.m1 + this.m2) * Math.sin(this.a1),
			num2 = -this.m2 * this.g * Math.sin(this.a1 - 2 * this.a2),
			num3 = -2 * Math.sin(this.a1 - this.a2) * this.m2,
			num4 = this.v2 * this.v2 * this.r2 + this.v1 * this.v1 * this.r1 * Math.cos(this.a1 - this.a2),
			den = this.r1 * (2 * this.m1 + this.m2 - this.m2 * Math.cos(2 * this.a1 - 2 * this.a2)),
			acc1 = (num1 + num2 + num3 * num4) / den,
			acc2;

		num1 = 2 * Math.sin(this.a1 - this.a2);
		num2 = this.v1 * this.v1 * this.r1 * (this.m1 + this.m2);
		num3 = this.g * (this.m1 + this.m2) * Math.cos(this.a1);
		num4 = this.v2 * this.v2 * this.r2 * this.m2 * Math.cos(this.a1 - this.a2);
		den = this.r2 * (2 * this.m1 + this.m2 - this.m2 * Math.cos(2 * this.a1 - 2 * this.a2));
		acc2 = (num1 * (num2 + num3 + num4)) / den;

		return [acc1, acc2]
	}


	runRK4(dt) {
		let l = [this.a1, this.a2, this.v1, this.v2],
			k1, k2, k3, k4, ret;

		k1 = this._lagrange(l);

		k2 = this._lagrange(l.map((x, i) =>
			x + (k1[i] / 2)
		));

		k3 = this._lagrange(l.map((x, i) =>
			x + (k2[i] / 2)
		));

		k4 = this._lagrange(l.map((x, i) =>
			x + k3[i]
		));

		ret = k1.map((x, i) =>
			(1 / 6) * (x + 2 * k2[i] + 2 * k3[i] + k4[i])
		);

		this.a1 += ret[0];
		this.a2 += ret[1];
		this.v1 += ret[2];
		this.v2 += ret[3];
	}


	_lagrange(f) {
		let [t1, t2, w1, w2] = f,
			delta_t = t1 - t2,

			an1 = (this.r2 / this.r1) * (this.m2 / (this.m1 + this.m2)) * Math.cos(t1 - t2),
			an2 = (this.r1 / this.r2) * Math.cos(t1 - t2),

			f1 = -(this.r2 / this.r1) * (this.m2 / (this.m1 + this.m2)) * (w2 ** 2) * Math.sin(t1 - t2) - (this.g / this.r1) * Math.sin(t1),
			f2 = (this.r1 / this.r2) * (w1 * w1) * Math.sin(t1 - t2) - (this.g / this.r2) * Math.sin(t2),

			g1 = (f1 - an1 * f2) / (1 - an1 * an2),
			g2 = (f2 - an2 * f1) / (1 - an1 * an2);

		return [w1, w2, g1, g2];
	}

}
