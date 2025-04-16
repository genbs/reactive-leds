;(() => {
	var t = {
			242: (t, e, n) => {
				t.exports = n(8499)
			},
			8499: t => {
				var e = null
				t.exports = function (t, n) {
					var r = t.length
					return (
						(n = n || 2),
						(e && e[r]) ||
							(function (t) {
								;(e = e || {})[t] = new Array(t * t)
								for (var n = Math.PI / t, r = 0; r < t; r++)
									for (var a = 0; a < t; a++) e[t][a + r * t] = Math.cos(n * (a + 0.5) * r)
							})(r),
						t
							.map(function () {
								return 0
							})
							.map(function (a, s) {
								return (
									n *
									t.reduce(function (t, n, a, i) {
										return t + n * e[r][a + s * r]
									}, 0)
								)
							})
					)
				}
			},
			9502: t => {
				"use strict"
				function e(t, e, r) {
					r = r || 2
					var s,
						i,
						o,
						u,
						l,
						f,
						d,
						p = e && e.length,
						v = p ? e[0] * r : t.length,
						g = n(t, 0, v, r, !0),
						y = []
					if (!g || g.next === g.prev) return y
					if (
						(p &&
							(g = (function (t, e, r, a) {
								var s,
									i,
									o,
									u = []
								for (s = 0, i = e.length; s < i; s++)
									(o = n(t, e[s] * a, s < i - 1 ? e[s + 1] * a : t.length, a, !1)) === o.next && (o.steiner = !0),
										u.push(m(o))
								for (u.sort(c), s = 0; s < u.length; s++) r = h(u[s], r)
								return r
							})(t, e, g, r)),
						t.length > 80 * r)
					) {
						;(s = o = t[0]), (i = u = t[1])
						for (var x = r; x < v; x += r)
							(l = t[x]) < s && (s = l), (f = t[x + 1]) < i && (i = f), l > o && (o = l), f > u && (u = f)
						d = 0 !== (d = Math.max(o - s, u - i)) ? 32767 / d : 0
					}
					return a(g, y, r, s, i, d, 0), y
				}
				function n(t, e, n, r, a) {
					var s, i
					if (a === w(t, e, n, r) > 0) for (s = e; s < n; s += r) i = $(s, t[s], t[s + 1], i)
					else for (s = n - r; s >= e; s -= r) i = $(s, t[s], t[s + 1], i)
					return i && g(i, i.next) && (A(i), (i = i.next)), i
				}
				function r(t, e) {
					if (!t) return t
					e || (e = t)
					var n,
						r = t
					do {
						if (((n = !1), r.steiner || (!g(r, r.next) && 0 !== v(r.prev, r, r.next)))) r = r.next
						else {
							if ((A(r), (r = e = r.prev) === r.next)) break
							n = !0
						}
					} while (n || r !== e)
					return e
				}
				function a(t, e, n, c, h, l, m) {
					if (t) {
						!m &&
							l &&
							(function (t, e, n, r) {
								var a = t
								do {
									0 === a.z && (a.z = f(a.x, a.y, e, n, r)), (a.prevZ = a.prev), (a.nextZ = a.next), (a = a.next)
								} while (a !== t)
								;(a.prevZ.nextZ = null),
									(a.prevZ = null),
									(function (t) {
										var e,
											n,
											r,
											a,
											s,
											i,
											o,
											u,
											c = 1
										do {
											for (n = t, t = null, s = null, i = 0; n; ) {
												for (i++, r = n, o = 0, e = 0; e < c && (o++, (r = r.nextZ)); e++);
												for (u = c; o > 0 || (u > 0 && r); )
													0 !== o && (0 === u || !r || n.z <= r.z)
														? ((a = n), (n = n.nextZ), o--)
														: ((a = r), (r = r.nextZ), u--),
														s ? (s.nextZ = a) : (t = a),
														(a.prevZ = s),
														(s = a)
												n = r
											}
											;(s.nextZ = null), (c *= 2)
										} while (i > 1)
									})(a)
							})(t, c, h, l)
						for (var d, p, v = t; t.prev !== t.next; )
							if (((d = t.prev), (p = t.next), l ? i(t, c, h, l) : s(t)))
								e.push((d.i / n) | 0), e.push((t.i / n) | 0), e.push((p.i / n) | 0), A(t), (t = p.next), (v = p.next)
							else if ((t = p) === v) {
								m
									? 1 === m
										? a((t = o(r(t), e, n)), e, n, c, h, l, 2)
										: 2 === m && u(t, e, n, c, h, l)
									: a(r(t), e, n, c, h, l, 1)
								break
							}
					}
				}
				function s(t) {
					var e = t.prev,
						n = t,
						r = t.next
					if (v(e, n, r) >= 0) return !1
					for (
						var a = e.x,
							s = n.x,
							i = r.x,
							o = e.y,
							u = n.y,
							c = r.y,
							h = a < s ? (a < i ? a : i) : s < i ? s : i,
							l = o < u ? (o < c ? o : c) : u < c ? u : c,
							f = a > s ? (a > i ? a : i) : s > i ? s : i,
							m = o > u ? (o > c ? o : c) : u > c ? u : c,
							p = r.next;
						p !== e;

					) {
						if (
							p.x >= h &&
							p.x <= f &&
							p.y >= l &&
							p.y <= m &&
							d(a, o, s, u, i, c, p.x, p.y) &&
							v(p.prev, p, p.next) >= 0
						)
							return !1
						p = p.next
					}
					return !0
				}
				function i(t, e, n, r) {
					var a = t.prev,
						s = t,
						i = t.next
					if (v(a, s, i) >= 0) return !1
					for (
						var o = a.x,
							u = s.x,
							c = i.x,
							h = a.y,
							l = s.y,
							m = i.y,
							p = o < u ? (o < c ? o : c) : u < c ? u : c,
							g = h < l ? (h < m ? h : m) : l < m ? l : m,
							y = o > u ? (o > c ? o : c) : u > c ? u : c,
							x = h > l ? (h > m ? h : m) : l > m ? l : m,
							b = f(p, g, e, n, r),
							_ = f(y, x, e, n, r),
							M = t.prevZ,
							$ = t.nextZ;
						M && M.z >= b && $ && $.z <= _;

					) {
						if (
							M.x >= p &&
							M.x <= y &&
							M.y >= g &&
							M.y <= x &&
							M !== a &&
							M !== i &&
							d(o, h, u, l, c, m, M.x, M.y) &&
							v(M.prev, M, M.next) >= 0
						)
							return !1
						if (
							((M = M.prevZ),
							$.x >= p &&
								$.x <= y &&
								$.y >= g &&
								$.y <= x &&
								$ !== a &&
								$ !== i &&
								d(o, h, u, l, c, m, $.x, $.y) &&
								v($.prev, $, $.next) >= 0)
						)
							return !1
						$ = $.nextZ
					}
					for (; M && M.z >= b; ) {
						if (
							M.x >= p &&
							M.x <= y &&
							M.y >= g &&
							M.y <= x &&
							M !== a &&
							M !== i &&
							d(o, h, u, l, c, m, M.x, M.y) &&
							v(M.prev, M, M.next) >= 0
						)
							return !1
						M = M.prevZ
					}
					for (; $ && $.z <= _; ) {
						if (
							$.x >= p &&
							$.x <= y &&
							$.y >= g &&
							$.y <= x &&
							$ !== a &&
							$ !== i &&
							d(o, h, u, l, c, m, $.x, $.y) &&
							v($.prev, $, $.next) >= 0
						)
							return !1
						$ = $.nextZ
					}
					return !0
				}
				function o(t, e, n) {
					var a = t
					do {
						var s = a.prev,
							i = a.next.next
						!g(s, i) &&
							y(s, a, a.next, i) &&
							_(s, i) &&
							_(i, s) &&
							(e.push((s.i / n) | 0), e.push((a.i / n) | 0), e.push((i.i / n) | 0), A(a), A(a.next), (a = t = i)),
							(a = a.next)
					} while (a !== t)
					return r(a)
				}
				function u(t, e, n, s, i, o) {
					var u = t
					do {
						for (var c = u.next.next; c !== u.prev; ) {
							if (u.i !== c.i && p(u, c)) {
								var h = M(u, c)
								return (u = r(u, u.next)), (h = r(h, h.next)), a(u, e, n, s, i, o, 0), void a(h, e, n, s, i, o, 0)
							}
							c = c.next
						}
						u = u.next
					} while (u !== t)
				}
				function c(t, e) {
					return t.x - e.x
				}
				function h(t, e) {
					var n = (function (t, e) {
						var n,
							r = e,
							a = t.x,
							s = t.y,
							i = -1 / 0
						do {
							if (s <= r.y && s >= r.next.y && r.next.y !== r.y) {
								var o = r.x + ((s - r.y) * (r.next.x - r.x)) / (r.next.y - r.y)
								if (o <= a && o > i && ((i = o), (n = r.x < r.next.x ? r : r.next), o === a)) return n
							}
							r = r.next
						} while (r !== e)
						if (!n) return null
						var u,
							c = n,
							h = n.x,
							f = n.y,
							m = 1 / 0
						r = n
						do {
							a >= r.x &&
								r.x >= h &&
								a !== r.x &&
								d(s < f ? a : i, s, h, f, s < f ? i : a, s, r.x, r.y) &&
								((u = Math.abs(s - r.y) / (a - r.x)),
								_(r, t) && (u < m || (u === m && (r.x > n.x || (r.x === n.x && l(n, r))))) && ((n = r), (m = u))),
								(r = r.next)
						} while (r !== c)
						return n
					})(t, e)
					if (!n) return e
					var a = M(n, t)
					return r(a, a.next), r(n, n.next)
				}
				function l(t, e) {
					return v(t.prev, t, e.prev) < 0 && v(e.next, t, t.next) < 0
				}
				function f(t, e, n, r, a) {
					return (
						(t =
							1431655765 &
							((t =
								858993459 &
								((t = 252645135 & ((t = 16711935 & ((t = ((t - n) * a) | 0) | (t << 8))) | (t << 4))) | (t << 2))) |
								(t << 1))) |
						((e =
							1431655765 &
							((e =
								858993459 &
								((e = 252645135 & ((e = 16711935 & ((e = ((e - r) * a) | 0) | (e << 8))) | (e << 4))) | (e << 2))) |
								(e << 1))) <<
							1)
					)
				}
				function m(t) {
					var e = t,
						n = t
					do {
						;(e.x < n.x || (e.x === n.x && e.y < n.y)) && (n = e), (e = e.next)
					} while (e !== t)
					return n
				}
				function d(t, e, n, r, a, s, i, o) {
					return (
						(a - i) * (e - o) >= (t - i) * (s - o) &&
						(t - i) * (r - o) >= (n - i) * (e - o) &&
						(n - i) * (s - o) >= (a - i) * (r - o)
					)
				}
				function p(t, e) {
					return (
						t.next.i !== e.i &&
						t.prev.i !== e.i &&
						!(function (t, e) {
							var n = t
							do {
								if (n.i !== t.i && n.next.i !== t.i && n.i !== e.i && n.next.i !== e.i && y(n, n.next, t, e)) return !0
								n = n.next
							} while (n !== t)
							return !1
						})(t, e) &&
						((_(t, e) &&
							_(e, t) &&
							(function (t, e) {
								var n = t,
									r = !1,
									a = (t.x + e.x) / 2,
									s = (t.y + e.y) / 2
								do {
									n.y > s != n.next.y > s &&
										n.next.y !== n.y &&
										a < ((n.next.x - n.x) * (s - n.y)) / (n.next.y - n.y) + n.x &&
										(r = !r),
										(n = n.next)
								} while (n !== t)
								return r
							})(t, e) &&
							(v(t.prev, t, e.prev) || v(t, e.prev, e))) ||
							(g(t, e) && v(t.prev, t, t.next) > 0 && v(e.prev, e, e.next) > 0))
					)
				}
				function v(t, e, n) {
					return (e.y - t.y) * (n.x - e.x) - (e.x - t.x) * (n.y - e.y)
				}
				function g(t, e) {
					return t.x === e.x && t.y === e.y
				}
				function y(t, e, n, r) {
					var a = b(v(t, e, n)),
						s = b(v(t, e, r)),
						i = b(v(n, r, t)),
						o = b(v(n, r, e))
					return (
						(a !== s && i !== o) ||
						!(0 !== a || !x(t, n, e)) ||
						!(0 !== s || !x(t, r, e)) ||
						!(0 !== i || !x(n, t, r)) ||
						!(0 !== o || !x(n, e, r))
					)
				}
				function x(t, e, n) {
					return (
						e.x <= Math.max(t.x, n.x) &&
						e.x >= Math.min(t.x, n.x) &&
						e.y <= Math.max(t.y, n.y) &&
						e.y >= Math.min(t.y, n.y)
					)
				}
				function b(t) {
					return t > 0 ? 1 : t < 0 ? -1 : 0
				}
				function _(t, e) {
					return v(t.prev, t, t.next) < 0
						? v(t, e, t.next) >= 0 && v(t, t.prev, e) >= 0
						: v(t, e, t.prev) < 0 || v(t, t.next, e) < 0
				}
				function M(t, e) {
					var n = new E(t.i, t.x, t.y),
						r = new E(e.i, e.x, e.y),
						a = t.next,
						s = e.prev
					return (
						(t.next = e),
						(e.prev = t),
						(n.next = a),
						(a.prev = n),
						(r.next = n),
						(n.prev = r),
						(s.next = r),
						(r.prev = s),
						r
					)
				}
				function $(t, e, n, r) {
					var a = new E(t, e, n)
					return (
						r ? ((a.next = r.next), (a.prev = r), (r.next.prev = a), (r.next = a)) : ((a.prev = a), (a.next = a)), a
					)
				}
				function A(t) {
					;(t.next.prev = t.prev),
						(t.prev.next = t.next),
						t.prevZ && (t.prevZ.nextZ = t.nextZ),
						t.nextZ && (t.nextZ.prevZ = t.prevZ)
				}
				function E(t, e, n) {
					;(this.i = t),
						(this.x = e),
						(this.y = n),
						(this.prev = null),
						(this.next = null),
						(this.z = 0),
						(this.prevZ = null),
						(this.nextZ = null),
						(this.steiner = !1)
				}
				function w(t, e, n, r) {
					for (var a = 0, s = e, i = n - r; s < n; s += r) (a += (t[i] - t[s]) * (t[s + 1] + t[i + 1])), (i = s)
					return a
				}
				;(t.exports = e),
					(t.exports.default = e),
					(e.deviation = function (t, e, n, r) {
						var a = e && e.length,
							s = a ? e[0] * n : t.length,
							i = Math.abs(w(t, 0, s, n))
						if (a)
							for (var o = 0, u = e.length; o < u; o++) {
								var c = e[o] * n,
									h = o < u - 1 ? e[o + 1] * n : t.length
								i -= Math.abs(w(t, c, h, n))
							}
						var l = 0
						for (o = 0; o < r.length; o += 3) {
							var f = r[o] * n,
								m = r[o + 1] * n,
								d = r[o + 2] * n
							l += Math.abs((t[f] - t[d]) * (t[m + 1] - t[f + 1]) - (t[f] - t[m]) * (t[d + 1] - t[f + 1]))
						}
						return 0 === i && 0 === l ? 0 : Math.abs((l - i) / i)
					}),
					(e.flatten = function (t) {
						for (
							var e = t[0][0].length, n = { vertices: [], holes: [], dimensions: e }, r = 0, a = 0;
							a < t.length;
							a++
						) {
							for (var s = 0; s < t[a].length; s++) for (var i = 0; i < e; i++) n.vertices.push(t[a][s][i])
							a > 0 && ((r += t[a - 1].length), n.holes.push(r))
						}
						return n
					})
			},
			902: (t, e, n) => {
				"use strict"
				var r = n(3824),
					a = function (t) {
						var e = {}
						void 0 === t.real || void 0 === t.imag
							? (e = r.constructComplexArray(t))
							: ((e.real = t.real.slice()), (e.imag = t.imag.slice()))
						var n = e.real.length,
							a = Math.log2(n)
						if (Math.round(a) != a) throw new Error("Input size must be a power of 2.")
						if (e.real.length != e.imag.length)
							throw new Error("Real and imaginary components must have the same length.")
						for (var s = r.bitReverseArray(n), i = { real: [], imag: [] }, o = 0; o < n; o++)
							(i.real[s[o]] = e.real[o]), (i.imag[s[o]] = e.imag[o])
						for (var u = 0; u < n; u++) (e.real[u] = i.real[u]), (e.imag[u] = i.imag[u])
						for (var c = 1; c <= a; c++)
							for (var h = Math.pow(2, c), l = 0; l < h / 2; l++)
								for (var f = r.euler(l, h), m = 0; m < n / h; m++) {
									var d = h * m + l,
										p = h * m + l + h / 2,
										v = { real: e.real[d], imag: e.imag[d] },
										g = { real: e.real[p], imag: e.imag[p] },
										y = r.multiply(f, g),
										x = r.subtract(v, y)
									;(e.real[p] = x.real), (e.imag[p] = x.imag)
									var b = r.add(y, v)
									;(e.real[d] = b.real), (e.imag[d] = b.imag)
								}
						return e
					}
				t.exports = {
					fft: a,
					ifft: function (t) {
						if (void 0 === t.real || void 0 === t.imag) throw new Error("IFFT only accepts a complex input.")
						for (var e = t.real.length, n = { real: [], imag: [] }, s = 0; s < e; s++) {
							var i = { real: t.real[s], imag: t.imag[s] },
								o = r.conj(i)
							;(n.real[s] = o.real), (n.imag[s] = o.imag)
						}
						var u = a(n)
						return (
							(n.real = u.real.map(function (t) {
								return t / e
							})),
							(n.imag = u.imag.map(function (t) {
								return t / e
							})),
							n
						)
					},
				}
			},
			3824: t => {
				"use strict"
				function e(t) {
					if (Array.isArray(t)) {
						for (var e = 0, n = Array(t.length); e < t.length; e++) n[e] = t[e]
						return n
					}
					return Array.from(t)
				}
				var n = {},
					r = {}
				t.exports = {
					bitReverseArray: function (t) {
						if (void 0 === n[t]) {
							for (var r = (t - 1).toString(2).length, a = "0".repeat(r), s = {}, i = 0; i < t; i++) {
								var o = i.toString(2)
								;(o = a.substr(o.length) + o), (o = [].concat(e(o)).reverse().join("")), (s[i] = parseInt(o, 2))
							}
							n[t] = s
						}
						return n[t]
					},
					multiply: function (t, e) {
						return { real: t.real * e.real - t.imag * e.imag, imag: t.real * e.imag + t.imag * e.real }
					},
					add: function (t, e) {
						return { real: t.real + e.real, imag: t.imag + e.imag }
					},
					subtract: function (t, e) {
						return { real: t.real - e.real, imag: t.imag - e.imag }
					},
					euler: function (t, e) {
						var n = (-2 * Math.PI * t) / e
						return { real: Math.cos(n), imag: Math.sin(n) }
					},
					conj: function (t) {
						return (t.imag *= -1), t
					},
					constructComplexArray: function (t) {
						var e = {}
						e.real = void 0 === t.real ? t.slice() : t.real.slice()
						var n = e.real.length
						return (
							void 0 === r[n] && (r[n] = Array.apply(null, Array(n)).map(Number.prototype.valueOf, 0)),
							(e.imag = r[n].slice()),
							e
						)
					},
				}
			},
			3406: (t, e, n) => {
				"use strict"
				n.r(e),
					n.d(e, {
						ARRAY_TYPE: () => a,
						EPSILON: () => r,
						RANDOM: () => s,
						equals: () => c,
						setMatrixArrayType: () => i,
						toRadian: () => u,
					})
				var r = 1e-6,
					a = "undefined" != typeof Float32Array ? Float32Array : Array,
					s = Math.random
				function i(t) {
					a = t
				}
				var o = Math.PI / 180
				function u(t) {
					return t * o
				}
				function c(t, e) {
					return Math.abs(t - e) <= r * Math.max(1, Math.abs(t), Math.abs(e))
				}
				Math.hypot ||
					(Math.hypot = function () {
						for (var t = 0, e = arguments.length; e--; ) t += arguments[e] * arguments[e]
						return Math.sqrt(t)
					})
			},
			3765: (t, e, n) => {
				"use strict"
				n.r(e),
					n.d(e, {
						glMatrix: () => h,
						mat2: () => r,
						mat2d: () => a,
						mat3: () => s,
						mat4: () => Ut,
						quat: () => o,
						quat2: () => u,
						vec2: () => c,
						vec3: () => Bt,
						vec4: () => i,
					})
				var r = {}
				n.r(r),
					n.d(r, {
						LDU: () => S,
						add: () => R,
						adjoint: () => x,
						clone: () => f,
						copy: () => m,
						create: () => l,
						determinant: () => b,
						equals: () => I,
						exactEquals: () => F,
						frob: () => T,
						fromRotation: () => A,
						fromScaling: () => E,
						fromValues: () => p,
						identity: () => d,
						invert: () => y,
						mul: () => z,
						multiply: () => _,
						multiplyScalar: () => P,
						multiplyScalarAndAdd: () => C,
						rotate: () => M,
						scale: () => $,
						set: () => v,
						str: () => w,
						sub: () => D,
						subtract: () => O,
						transpose: () => g,
					})
				var a = {}
				n.r(a),
					n.d(a, {
						add: () => tt,
						clone: () => N,
						copy: () => L,
						create: () => k,
						determinant: () => j,
						equals: () => st,
						exactEquals: () => at,
						frob: () => J,
						fromRotation: () => W,
						fromScaling: () => Z,
						fromTranslation: () => K,
						fromValues: () => B,
						identity: () => U,
						invert: () => Y,
						mul: () => it,
						multiply: () => X,
						multiplyScalar: () => nt,
						multiplyScalarAndAdd: () => rt,
						rotate: () => V,
						scale: () => G,
						set: () => q,
						str: () => Q,
						sub: () => ot,
						subtract: () => et,
						translate: () => H,
					})
				var s = {}
				n.r(s),
					n.d(s, {
						add: () => It,
						adjoint: () => gt,
						clone: () => ht,
						copy: () => lt,
						create: () => ut,
						determinant: () => yt,
						equals: () => kt,
						exactEquals: () => Dt,
						frob: () => Ft,
						fromMat2d: () => wt,
						fromMat4: () => ct,
						fromQuat: () => Tt,
						fromRotation: () => At,
						fromScaling: () => Et,
						fromTranslation: () => $t,
						fromValues: () => ft,
						identity: () => dt,
						invert: () => vt,
						mul: () => Nt,
						multiply: () => xt,
						multiplyScalar: () => Ct,
						multiplyScalarAndAdd: () => zt,
						normalFromMat4: () => St,
						projection: () => Rt,
						rotate: () => _t,
						scale: () => Mt,
						set: () => mt,
						str: () => Ot,
						sub: () => Lt,
						subtract: () => Pt,
						translate: () => bt,
						transpose: () => pt,
					})
				var i = {}
				n.r(i),
					n.d(i, {
						add: () => Gt,
						ceil: () => Kt,
						clone: () => Yt,
						copy: () => Xt,
						create: () => qt,
						cross: () => fe,
						dist: () => Ee,
						distance: () => ae,
						div: () => Ae,
						divide: () => Zt,
						dot: () => le,
						equals: () => be,
						exactEquals: () => xe,
						floor: () => Qt,
						forEach: () => Re,
						fromValues: () => jt,
						inverse: () => ce,
						len: () => Te,
						length: () => ie,
						lerp: () => me,
						max: () => te,
						min: () => Jt,
						mul: () => $e,
						multiply: () => Wt,
						negate: () => ue,
						normalize: () => he,
						random: () => de,
						round: () => ee,
						scale: () => ne,
						scaleAndAdd: () => re,
						set: () => Vt,
						sqrDist: () => we,
						sqrLen: () => Se,
						squaredDistance: () => se,
						squaredLength: () => oe,
						str: () => ye,
						sub: () => Me,
						subtract: () => Ht,
						transformMat4: () => pe,
						transformQuat: () => ve,
						zero: () => ge,
					})
				var o = {}
				n.r(o),
					n.d(o, {
						add: () => on,
						calculateW: () => Le,
						clone: () => nn,
						conjugate: () => Ve,
						copy: () => an,
						create: () => Oe,
						dot: () => hn,
						equals: () => yn,
						exactEquals: () => gn,
						exp: () => Ue,
						fromEuler: () => He,
						fromMat3: () => Ge,
						fromValues: () => rn,
						getAngle: () => Ce,
						getAxisAngle: () => Pe,
						identity: () => Fe,
						invert: () => Xe,
						len: () => mn,
						length: () => fn,
						lerp: () => ln,
						ln: () => Be,
						mul: () => un,
						multiply: () => ze,
						normalize: () => vn,
						pow: () => qe,
						random: () => je,
						rotateX: () => De,
						rotateY: () => ke,
						rotateZ: () => Ne,
						rotationTo: () => xn,
						scale: () => cn,
						set: () => sn,
						setAxes: () => _n,
						setAxisAngle: () => Ie,
						slerp: () => Ye,
						sqlerp: () => bn,
						sqrLen: () => pn,
						squaredLength: () => dn,
						str: () => We,
					})
				var u = {}
				n.r(u),
					n.d(u, {
						add: () => Xn,
						clone: () => $n,
						conjugate: () => Qn,
						copy: () => On,
						create: () => Mn,
						dot: () => Wn,
						equals: () => ir,
						exactEquals: () => sr,
						fromMat4: () => Rn,
						fromRotation: () => Sn,
						fromRotationTranslation: () => wn,
						fromRotationTranslationValues: () => En,
						fromTranslation: () => Tn,
						fromValues: () => An,
						getDual: () => Cn,
						getReal: () => Pn,
						getTranslation: () => kn,
						identity: () => Fn,
						invert: () => Kn,
						len: () => tr,
						length: () => Jn,
						lerp: () => Zn,
						mul: () => Gn,
						multiply: () => Vn,
						normalize: () => rr,
						rotateAroundAxis: () => jn,
						rotateByQuatAppend: () => qn,
						rotateByQuatPrepend: () => Yn,
						rotateX: () => Ln,
						rotateY: () => Un,
						rotateZ: () => Bn,
						scale: () => Hn,
						set: () => In,
						setDual: () => Dn,
						setReal: () => zn,
						sqrLen: () => nr,
						squaredLength: () => er,
						str: () => ar,
						translate: () => Nn,
					})
				var c = {}
				n.r(c),
					n.d(c, {
						add: () => fr,
						angle: () => Lr,
						ceil: () => vr,
						clone: () => ur,
						copy: () => hr,
						create: () => or,
						cross: () => Fr,
						dist: () => Hr,
						distance: () => $r,
						div: () => Gr,
						divide: () => pr,
						dot: () => Or,
						equals: () => Yr,
						exactEquals: () => qr,
						floor: () => gr,
						forEach: () => Kr,
						fromValues: () => cr,
						inverse: () => Sr,
						len: () => jr,
						length: () => Er,
						lerp: () => Ir,
						max: () => xr,
						min: () => yr,
						mul: () => Vr,
						multiply: () => dr,
						negate: () => Tr,
						normalize: () => Rr,
						random: () => Pr,
						rotate: () => Nr,
						round: () => br,
						scale: () => _r,
						scaleAndAdd: () => Mr,
						set: () => lr,
						sqrDist: () => Wr,
						sqrLen: () => Zr,
						squaredDistance: () => Ar,
						squaredLength: () => wr,
						str: () => Br,
						sub: () => Xr,
						subtract: () => mr,
						transformMat2: () => Cr,
						transformMat2d: () => zr,
						transformMat3: () => Dr,
						transformMat4: () => kr,
						zero: () => Ur,
					})
				var h = n(3406)
				function l() {
					var t = new h.ARRAY_TYPE(4)
					return h.ARRAY_TYPE != Float32Array && ((t[1] = 0), (t[2] = 0)), (t[0] = 1), (t[3] = 1), t
				}
				function f(t) {
					var e = new h.ARRAY_TYPE(4)
					return (e[0] = t[0]), (e[1] = t[1]), (e[2] = t[2]), (e[3] = t[3]), e
				}
				function m(t, e) {
					return (t[0] = e[0]), (t[1] = e[1]), (t[2] = e[2]), (t[3] = e[3]), t
				}
				function d(t) {
					return (t[0] = 1), (t[1] = 0), (t[2] = 0), (t[3] = 1), t
				}
				function p(t, e, n, r) {
					var a = new h.ARRAY_TYPE(4)
					return (a[0] = t), (a[1] = e), (a[2] = n), (a[3] = r), a
				}
				function v(t, e, n, r, a) {
					return (t[0] = e), (t[1] = n), (t[2] = r), (t[3] = a), t
				}
				function g(t, e) {
					if (t === e) {
						var n = e[1]
						;(t[1] = e[2]), (t[2] = n)
					} else (t[0] = e[0]), (t[1] = e[2]), (t[2] = e[1]), (t[3] = e[3])
					return t
				}
				function y(t, e) {
					var n = e[0],
						r = e[1],
						a = e[2],
						s = e[3],
						i = n * s - a * r
					return i ? ((i = 1 / i), (t[0] = s * i), (t[1] = -r * i), (t[2] = -a * i), (t[3] = n * i), t) : null
				}
				function x(t, e) {
					var n = e[0]
					return (t[0] = e[3]), (t[1] = -e[1]), (t[2] = -e[2]), (t[3] = n), t
				}
				function b(t) {
					return t[0] * t[3] - t[2] * t[1]
				}
				function _(t, e, n) {
					var r = e[0],
						a = e[1],
						s = e[2],
						i = e[3],
						o = n[0],
						u = n[1],
						c = n[2],
						h = n[3]
					return (t[0] = r * o + s * u), (t[1] = a * o + i * u), (t[2] = r * c + s * h), (t[3] = a * c + i * h), t
				}
				function M(t, e, n) {
					var r = e[0],
						a = e[1],
						s = e[2],
						i = e[3],
						o = Math.sin(n),
						u = Math.cos(n)
					return (t[0] = r * u + s * o), (t[1] = a * u + i * o), (t[2] = r * -o + s * u), (t[3] = a * -o + i * u), t
				}
				function $(t, e, n) {
					var r = e[0],
						a = e[1],
						s = e[2],
						i = e[3],
						o = n[0],
						u = n[1]
					return (t[0] = r * o), (t[1] = a * o), (t[2] = s * u), (t[3] = i * u), t
				}
				function A(t, e) {
					var n = Math.sin(e),
						r = Math.cos(e)
					return (t[0] = r), (t[1] = n), (t[2] = -n), (t[3] = r), t
				}
				function E(t, e) {
					return (t[0] = e[0]), (t[1] = 0), (t[2] = 0), (t[3] = e[1]), t
				}
				function w(t) {
					return "mat2(" + t[0] + ", " + t[1] + ", " + t[2] + ", " + t[3] + ")"
				}
				function T(t) {
					return Math.hypot(t[0], t[1], t[2], t[3])
				}
				function S(t, e, n, r) {
					return (t[2] = r[2] / r[0]), (n[0] = r[0]), (n[1] = r[1]), (n[3] = r[3] - t[2] * n[1]), [t, e, n]
				}
				function R(t, e, n) {
					return (t[0] = e[0] + n[0]), (t[1] = e[1] + n[1]), (t[2] = e[2] + n[2]), (t[3] = e[3] + n[3]), t
				}
				function O(t, e, n) {
					return (t[0] = e[0] - n[0]), (t[1] = e[1] - n[1]), (t[2] = e[2] - n[2]), (t[3] = e[3] - n[3]), t
				}
				function F(t, e) {
					return t[0] === e[0] && t[1] === e[1] && t[2] === e[2] && t[3] === e[3]
				}
				function I(t, e) {
					var n = t[0],
						r = t[1],
						a = t[2],
						s = t[3],
						i = e[0],
						o = e[1],
						u = e[2],
						c = e[3]
					return (
						Math.abs(n - i) <= h.EPSILON * Math.max(1, Math.abs(n), Math.abs(i)) &&
						Math.abs(r - o) <= h.EPSILON * Math.max(1, Math.abs(r), Math.abs(o)) &&
						Math.abs(a - u) <= h.EPSILON * Math.max(1, Math.abs(a), Math.abs(u)) &&
						Math.abs(s - c) <= h.EPSILON * Math.max(1, Math.abs(s), Math.abs(c))
					)
				}
				function P(t, e, n) {
					return (t[0] = e[0] * n), (t[1] = e[1] * n), (t[2] = e[2] * n), (t[3] = e[3] * n), t
				}
				function C(t, e, n, r) {
					return (
						(t[0] = e[0] + n[0] * r), (t[1] = e[1] + n[1] * r), (t[2] = e[2] + n[2] * r), (t[3] = e[3] + n[3] * r), t
					)
				}
				var z = _,
					D = O
				function k() {
					var t = new h.ARRAY_TYPE(6)
					return (
						h.ARRAY_TYPE != Float32Array && ((t[1] = 0), (t[2] = 0), (t[4] = 0), (t[5] = 0)), (t[0] = 1), (t[3] = 1), t
					)
				}
				function N(t) {
					var e = new h.ARRAY_TYPE(6)
					return (e[0] = t[0]), (e[1] = t[1]), (e[2] = t[2]), (e[3] = t[3]), (e[4] = t[4]), (e[5] = t[5]), e
				}
				function L(t, e) {
					return (t[0] = e[0]), (t[1] = e[1]), (t[2] = e[2]), (t[3] = e[3]), (t[4] = e[4]), (t[5] = e[5]), t
				}
				function U(t) {
					return (t[0] = 1), (t[1] = 0), (t[2] = 0), (t[3] = 1), (t[4] = 0), (t[5] = 0), t
				}
				function B(t, e, n, r, a, s) {
					var i = new h.ARRAY_TYPE(6)
					return (i[0] = t), (i[1] = e), (i[2] = n), (i[3] = r), (i[4] = a), (i[5] = s), i
				}
				function q(t, e, n, r, a, s, i) {
					return (t[0] = e), (t[1] = n), (t[2] = r), (t[3] = a), (t[4] = s), (t[5] = i), t
				}
				function Y(t, e) {
					var n = e[0],
						r = e[1],
						a = e[2],
						s = e[3],
						i = e[4],
						o = e[5],
						u = n * s - r * a
					return u
						? ((u = 1 / u),
						  (t[0] = s * u),
						  (t[1] = -r * u),
						  (t[2] = -a * u),
						  (t[3] = n * u),
						  (t[4] = (a * o - s * i) * u),
						  (t[5] = (r * i - n * o) * u),
						  t)
						: null
				}
				function j(t) {
					return t[0] * t[3] - t[1] * t[2]
				}
				function X(t, e, n) {
					var r = e[0],
						a = e[1],
						s = e[2],
						i = e[3],
						o = e[4],
						u = e[5],
						c = n[0],
						h = n[1],
						l = n[2],
						f = n[3],
						m = n[4],
						d = n[5]
					return (
						(t[0] = r * c + s * h),
						(t[1] = a * c + i * h),
						(t[2] = r * l + s * f),
						(t[3] = a * l + i * f),
						(t[4] = r * m + s * d + o),
						(t[5] = a * m + i * d + u),
						t
					)
				}
				function V(t, e, n) {
					var r = e[0],
						a = e[1],
						s = e[2],
						i = e[3],
						o = e[4],
						u = e[5],
						c = Math.sin(n),
						h = Math.cos(n)
					return (
						(t[0] = r * h + s * c),
						(t[1] = a * h + i * c),
						(t[2] = r * -c + s * h),
						(t[3] = a * -c + i * h),
						(t[4] = o),
						(t[5] = u),
						t
					)
				}
				function G(t, e, n) {
					var r = e[0],
						a = e[1],
						s = e[2],
						i = e[3],
						o = e[4],
						u = e[5],
						c = n[0],
						h = n[1]
					return (t[0] = r * c), (t[1] = a * c), (t[2] = s * h), (t[3] = i * h), (t[4] = o), (t[5] = u), t
				}
				function H(t, e, n) {
					var r = e[0],
						a = e[1],
						s = e[2],
						i = e[3],
						o = e[4],
						u = e[5],
						c = n[0],
						h = n[1]
					return (
						(t[0] = r), (t[1] = a), (t[2] = s), (t[3] = i), (t[4] = r * c + s * h + o), (t[5] = a * c + i * h + u), t
					)
				}
				function W(t, e) {
					var n = Math.sin(e),
						r = Math.cos(e)
					return (t[0] = r), (t[1] = n), (t[2] = -n), (t[3] = r), (t[4] = 0), (t[5] = 0), t
				}
				function Z(t, e) {
					return (t[0] = e[0]), (t[1] = 0), (t[2] = 0), (t[3] = e[1]), (t[4] = 0), (t[5] = 0), t
				}
				function K(t, e) {
					return (t[0] = 1), (t[1] = 0), (t[2] = 0), (t[3] = 1), (t[4] = e[0]), (t[5] = e[1]), t
				}
				function Q(t) {
					return "mat2d(" + t[0] + ", " + t[1] + ", " + t[2] + ", " + t[3] + ", " + t[4] + ", " + t[5] + ")"
				}
				function J(t) {
					return Math.hypot(t[0], t[1], t[2], t[3], t[4], t[5], 1)
				}
				function tt(t, e, n) {
					return (
						(t[0] = e[0] + n[0]),
						(t[1] = e[1] + n[1]),
						(t[2] = e[2] + n[2]),
						(t[3] = e[3] + n[3]),
						(t[4] = e[4] + n[4]),
						(t[5] = e[5] + n[5]),
						t
					)
				}
				function et(t, e, n) {
					return (
						(t[0] = e[0] - n[0]),
						(t[1] = e[1] - n[1]),
						(t[2] = e[2] - n[2]),
						(t[3] = e[3] - n[3]),
						(t[4] = e[4] - n[4]),
						(t[5] = e[5] - n[5]),
						t
					)
				}
				function nt(t, e, n) {
					return (
						(t[0] = e[0] * n),
						(t[1] = e[1] * n),
						(t[2] = e[2] * n),
						(t[3] = e[3] * n),
						(t[4] = e[4] * n),
						(t[5] = e[5] * n),
						t
					)
				}
				function rt(t, e, n, r) {
					return (
						(t[0] = e[0] + n[0] * r),
						(t[1] = e[1] + n[1] * r),
						(t[2] = e[2] + n[2] * r),
						(t[3] = e[3] + n[3] * r),
						(t[4] = e[4] + n[4] * r),
						(t[5] = e[5] + n[5] * r),
						t
					)
				}
				function at(t, e) {
					return t[0] === e[0] && t[1] === e[1] && t[2] === e[2] && t[3] === e[3] && t[4] === e[4] && t[5] === e[5]
				}
				function st(t, e) {
					var n = t[0],
						r = t[1],
						a = t[2],
						s = t[3],
						i = t[4],
						o = t[5],
						u = e[0],
						c = e[1],
						l = e[2],
						f = e[3],
						m = e[4],
						d = e[5]
					return (
						Math.abs(n - u) <= h.EPSILON * Math.max(1, Math.abs(n), Math.abs(u)) &&
						Math.abs(r - c) <= h.EPSILON * Math.max(1, Math.abs(r), Math.abs(c)) &&
						Math.abs(a - l) <= h.EPSILON * Math.max(1, Math.abs(a), Math.abs(l)) &&
						Math.abs(s - f) <= h.EPSILON * Math.max(1, Math.abs(s), Math.abs(f)) &&
						Math.abs(i - m) <= h.EPSILON * Math.max(1, Math.abs(i), Math.abs(m)) &&
						Math.abs(o - d) <= h.EPSILON * Math.max(1, Math.abs(o), Math.abs(d))
					)
				}
				var it = X,
					ot = et
				function ut() {
					var t = new h.ARRAY_TYPE(9)
					return (
						h.ARRAY_TYPE != Float32Array && ((t[1] = 0), (t[2] = 0), (t[3] = 0), (t[5] = 0), (t[6] = 0), (t[7] = 0)),
						(t[0] = 1),
						(t[4] = 1),
						(t[8] = 1),
						t
					)
				}
				function ct(t, e) {
					return (
						(t[0] = e[0]),
						(t[1] = e[1]),
						(t[2] = e[2]),
						(t[3] = e[4]),
						(t[4] = e[5]),
						(t[5] = e[6]),
						(t[6] = e[8]),
						(t[7] = e[9]),
						(t[8] = e[10]),
						t
					)
				}
				function ht(t) {
					var e = new h.ARRAY_TYPE(9)
					return (
						(e[0] = t[0]),
						(e[1] = t[1]),
						(e[2] = t[2]),
						(e[3] = t[3]),
						(e[4] = t[4]),
						(e[5] = t[5]),
						(e[6] = t[6]),
						(e[7] = t[7]),
						(e[8] = t[8]),
						e
					)
				}
				function lt(t, e) {
					return (
						(t[0] = e[0]),
						(t[1] = e[1]),
						(t[2] = e[2]),
						(t[3] = e[3]),
						(t[4] = e[4]),
						(t[5] = e[5]),
						(t[6] = e[6]),
						(t[7] = e[7]),
						(t[8] = e[8]),
						t
					)
				}
				function ft(t, e, n, r, a, s, i, o, u) {
					var c = new h.ARRAY_TYPE(9)
					return (
						(c[0] = t),
						(c[1] = e),
						(c[2] = n),
						(c[3] = r),
						(c[4] = a),
						(c[5] = s),
						(c[6] = i),
						(c[7] = o),
						(c[8] = u),
						c
					)
				}
				function mt(t, e, n, r, a, s, i, o, u, c) {
					return (
						(t[0] = e),
						(t[1] = n),
						(t[2] = r),
						(t[3] = a),
						(t[4] = s),
						(t[5] = i),
						(t[6] = o),
						(t[7] = u),
						(t[8] = c),
						t
					)
				}
				function dt(t) {
					return (
						(t[0] = 1),
						(t[1] = 0),
						(t[2] = 0),
						(t[3] = 0),
						(t[4] = 1),
						(t[5] = 0),
						(t[6] = 0),
						(t[7] = 0),
						(t[8] = 1),
						t
					)
				}
				function pt(t, e) {
					if (t === e) {
						var n = e[1],
							r = e[2],
							a = e[5]
						;(t[1] = e[3]), (t[2] = e[6]), (t[3] = n), (t[5] = e[7]), (t[6] = r), (t[7] = a)
					} else
						(t[0] = e[0]),
							(t[1] = e[3]),
							(t[2] = e[6]),
							(t[3] = e[1]),
							(t[4] = e[4]),
							(t[5] = e[7]),
							(t[6] = e[2]),
							(t[7] = e[5]),
							(t[8] = e[8])
					return t
				}
				function vt(t, e) {
					var n = e[0],
						r = e[1],
						a = e[2],
						s = e[3],
						i = e[4],
						o = e[5],
						u = e[6],
						c = e[7],
						h = e[8],
						l = h * i - o * c,
						f = -h * s + o * u,
						m = c * s - i * u,
						d = n * l + r * f + a * m
					return d
						? ((d = 1 / d),
						  (t[0] = l * d),
						  (t[1] = (-h * r + a * c) * d),
						  (t[2] = (o * r - a * i) * d),
						  (t[3] = f * d),
						  (t[4] = (h * n - a * u) * d),
						  (t[5] = (-o * n + a * s) * d),
						  (t[6] = m * d),
						  (t[7] = (-c * n + r * u) * d),
						  (t[8] = (i * n - r * s) * d),
						  t)
						: null
				}
				function gt(t, e) {
					var n = e[0],
						r = e[1],
						a = e[2],
						s = e[3],
						i = e[4],
						o = e[5],
						u = e[6],
						c = e[7],
						h = e[8]
					return (
						(t[0] = i * h - o * c),
						(t[1] = a * c - r * h),
						(t[2] = r * o - a * i),
						(t[3] = o * u - s * h),
						(t[4] = n * h - a * u),
						(t[5] = a * s - n * o),
						(t[6] = s * c - i * u),
						(t[7] = r * u - n * c),
						(t[8] = n * i - r * s),
						t
					)
				}
				function yt(t) {
					var e = t[0],
						n = t[1],
						r = t[2],
						a = t[3],
						s = t[4],
						i = t[5],
						o = t[6],
						u = t[7],
						c = t[8]
					return e * (c * s - i * u) + n * (-c * a + i * o) + r * (u * a - s * o)
				}
				function xt(t, e, n) {
					var r = e[0],
						a = e[1],
						s = e[2],
						i = e[3],
						o = e[4],
						u = e[5],
						c = e[6],
						h = e[7],
						l = e[8],
						f = n[0],
						m = n[1],
						d = n[2],
						p = n[3],
						v = n[4],
						g = n[5],
						y = n[6],
						x = n[7],
						b = n[8]
					return (
						(t[0] = f * r + m * i + d * c),
						(t[1] = f * a + m * o + d * h),
						(t[2] = f * s + m * u + d * l),
						(t[3] = p * r + v * i + g * c),
						(t[4] = p * a + v * o + g * h),
						(t[5] = p * s + v * u + g * l),
						(t[6] = y * r + x * i + b * c),
						(t[7] = y * a + x * o + b * h),
						(t[8] = y * s + x * u + b * l),
						t
					)
				}
				function bt(t, e, n) {
					var r = e[0],
						a = e[1],
						s = e[2],
						i = e[3],
						o = e[4],
						u = e[5],
						c = e[6],
						h = e[7],
						l = e[8],
						f = n[0],
						m = n[1]
					return (
						(t[0] = r),
						(t[1] = a),
						(t[2] = s),
						(t[3] = i),
						(t[4] = o),
						(t[5] = u),
						(t[6] = f * r + m * i + c),
						(t[7] = f * a + m * o + h),
						(t[8] = f * s + m * u + l),
						t
					)
				}
				function _t(t, e, n) {
					var r = e[0],
						a = e[1],
						s = e[2],
						i = e[3],
						o = e[4],
						u = e[5],
						c = e[6],
						h = e[7],
						l = e[8],
						f = Math.sin(n),
						m = Math.cos(n)
					return (
						(t[0] = m * r + f * i),
						(t[1] = m * a + f * o),
						(t[2] = m * s + f * u),
						(t[3] = m * i - f * r),
						(t[4] = m * o - f * a),
						(t[5] = m * u - f * s),
						(t[6] = c),
						(t[7] = h),
						(t[8] = l),
						t
					)
				}
				function Mt(t, e, n) {
					var r = n[0],
						a = n[1]
					return (
						(t[0] = r * e[0]),
						(t[1] = r * e[1]),
						(t[2] = r * e[2]),
						(t[3] = a * e[3]),
						(t[4] = a * e[4]),
						(t[5] = a * e[5]),
						(t[6] = e[6]),
						(t[7] = e[7]),
						(t[8] = e[8]),
						t
					)
				}
				function $t(t, e) {
					return (
						(t[0] = 1),
						(t[1] = 0),
						(t[2] = 0),
						(t[3] = 0),
						(t[4] = 1),
						(t[5] = 0),
						(t[6] = e[0]),
						(t[7] = e[1]),
						(t[8] = 1),
						t
					)
				}
				function At(t, e) {
					var n = Math.sin(e),
						r = Math.cos(e)
					return (
						(t[0] = r),
						(t[1] = n),
						(t[2] = 0),
						(t[3] = -n),
						(t[4] = r),
						(t[5] = 0),
						(t[6] = 0),
						(t[7] = 0),
						(t[8] = 1),
						t
					)
				}
				function Et(t, e) {
					return (
						(t[0] = e[0]),
						(t[1] = 0),
						(t[2] = 0),
						(t[3] = 0),
						(t[4] = e[1]),
						(t[5] = 0),
						(t[6] = 0),
						(t[7] = 0),
						(t[8] = 1),
						t
					)
				}
				function wt(t, e) {
					return (
						(t[0] = e[0]),
						(t[1] = e[1]),
						(t[2] = 0),
						(t[3] = e[2]),
						(t[4] = e[3]),
						(t[5] = 0),
						(t[6] = e[4]),
						(t[7] = e[5]),
						(t[8] = 1),
						t
					)
				}
				function Tt(t, e) {
					var n = e[0],
						r = e[1],
						a = e[2],
						s = e[3],
						i = n + n,
						o = r + r,
						u = a + a,
						c = n * i,
						h = r * i,
						l = r * o,
						f = a * i,
						m = a * o,
						d = a * u,
						p = s * i,
						v = s * o,
						g = s * u
					return (
						(t[0] = 1 - l - d),
						(t[3] = h - g),
						(t[6] = f + v),
						(t[1] = h + g),
						(t[4] = 1 - c - d),
						(t[7] = m - p),
						(t[2] = f - v),
						(t[5] = m + p),
						(t[8] = 1 - c - l),
						t
					)
				}
				function St(t, e) {
					var n = e[0],
						r = e[1],
						a = e[2],
						s = e[3],
						i = e[4],
						o = e[5],
						u = e[6],
						c = e[7],
						h = e[8],
						l = e[9],
						f = e[10],
						m = e[11],
						d = e[12],
						p = e[13],
						v = e[14],
						g = e[15],
						y = n * o - r * i,
						x = n * u - a * i,
						b = n * c - s * i,
						_ = r * u - a * o,
						M = r * c - s * o,
						$ = a * c - s * u,
						A = h * p - l * d,
						E = h * v - f * d,
						w = h * g - m * d,
						T = l * v - f * p,
						S = l * g - m * p,
						R = f * g - m * v,
						O = y * R - x * S + b * T + _ * w - M * E + $ * A
					return O
						? ((O = 1 / O),
						  (t[0] = (o * R - u * S + c * T) * O),
						  (t[1] = (u * w - i * R - c * E) * O),
						  (t[2] = (i * S - o * w + c * A) * O),
						  (t[3] = (a * S - r * R - s * T) * O),
						  (t[4] = (n * R - a * w + s * E) * O),
						  (t[5] = (r * w - n * S - s * A) * O),
						  (t[6] = (p * $ - v * M + g * _) * O),
						  (t[7] = (v * b - d * $ - g * x) * O),
						  (t[8] = (d * M - p * b + g * y) * O),
						  t)
						: null
				}
				function Rt(t, e, n) {
					return (
						(t[0] = 2 / e),
						(t[1] = 0),
						(t[2] = 0),
						(t[3] = 0),
						(t[4] = -2 / n),
						(t[5] = 0),
						(t[6] = -1),
						(t[7] = 1),
						(t[8] = 1),
						t
					)
				}
				function Ot(t) {
					return (
						"mat3(" +
						t[0] +
						", " +
						t[1] +
						", " +
						t[2] +
						", " +
						t[3] +
						", " +
						t[4] +
						", " +
						t[5] +
						", " +
						t[6] +
						", " +
						t[7] +
						", " +
						t[8] +
						")"
					)
				}
				function Ft(t) {
					return Math.hypot(t[0], t[1], t[2], t[3], t[4], t[5], t[6], t[7], t[8])
				}
				function It(t, e, n) {
					return (
						(t[0] = e[0] + n[0]),
						(t[1] = e[1] + n[1]),
						(t[2] = e[2] + n[2]),
						(t[3] = e[3] + n[3]),
						(t[4] = e[4] + n[4]),
						(t[5] = e[5] + n[5]),
						(t[6] = e[6] + n[6]),
						(t[7] = e[7] + n[7]),
						(t[8] = e[8] + n[8]),
						t
					)
				}
				function Pt(t, e, n) {
					return (
						(t[0] = e[0] - n[0]),
						(t[1] = e[1] - n[1]),
						(t[2] = e[2] - n[2]),
						(t[3] = e[3] - n[3]),
						(t[4] = e[4] - n[4]),
						(t[5] = e[5] - n[5]),
						(t[6] = e[6] - n[6]),
						(t[7] = e[7] - n[7]),
						(t[8] = e[8] - n[8]),
						t
					)
				}
				function Ct(t, e, n) {
					return (
						(t[0] = e[0] * n),
						(t[1] = e[1] * n),
						(t[2] = e[2] * n),
						(t[3] = e[3] * n),
						(t[4] = e[4] * n),
						(t[5] = e[5] * n),
						(t[6] = e[6] * n),
						(t[7] = e[7] * n),
						(t[8] = e[8] * n),
						t
					)
				}
				function zt(t, e, n, r) {
					return (
						(t[0] = e[0] + n[0] * r),
						(t[1] = e[1] + n[1] * r),
						(t[2] = e[2] + n[2] * r),
						(t[3] = e[3] + n[3] * r),
						(t[4] = e[4] + n[4] * r),
						(t[5] = e[5] + n[5] * r),
						(t[6] = e[6] + n[6] * r),
						(t[7] = e[7] + n[7] * r),
						(t[8] = e[8] + n[8] * r),
						t
					)
				}
				function Dt(t, e) {
					return (
						t[0] === e[0] &&
						t[1] === e[1] &&
						t[2] === e[2] &&
						t[3] === e[3] &&
						t[4] === e[4] &&
						t[5] === e[5] &&
						t[6] === e[6] &&
						t[7] === e[7] &&
						t[8] === e[8]
					)
				}
				function kt(t, e) {
					var n = t[0],
						r = t[1],
						a = t[2],
						s = t[3],
						i = t[4],
						o = t[5],
						u = t[6],
						c = t[7],
						l = t[8],
						f = e[0],
						m = e[1],
						d = e[2],
						p = e[3],
						v = e[4],
						g = e[5],
						y = e[6],
						x = e[7],
						b = e[8]
					return (
						Math.abs(n - f) <= h.EPSILON * Math.max(1, Math.abs(n), Math.abs(f)) &&
						Math.abs(r - m) <= h.EPSILON * Math.max(1, Math.abs(r), Math.abs(m)) &&
						Math.abs(a - d) <= h.EPSILON * Math.max(1, Math.abs(a), Math.abs(d)) &&
						Math.abs(s - p) <= h.EPSILON * Math.max(1, Math.abs(s), Math.abs(p)) &&
						Math.abs(i - v) <= h.EPSILON * Math.max(1, Math.abs(i), Math.abs(v)) &&
						Math.abs(o - g) <= h.EPSILON * Math.max(1, Math.abs(o), Math.abs(g)) &&
						Math.abs(u - y) <= h.EPSILON * Math.max(1, Math.abs(u), Math.abs(y)) &&
						Math.abs(c - x) <= h.EPSILON * Math.max(1, Math.abs(c), Math.abs(x)) &&
						Math.abs(l - b) <= h.EPSILON * Math.max(1, Math.abs(l), Math.abs(b))
					)
				}
				var Nt = xt,
					Lt = Pt,
					Ut = n(159),
					Bt = n(6867)
				function qt() {
					var t = new h.ARRAY_TYPE(4)
					return h.ARRAY_TYPE != Float32Array && ((t[0] = 0), (t[1] = 0), (t[2] = 0), (t[3] = 0)), t
				}
				function Yt(t) {
					var e = new h.ARRAY_TYPE(4)
					return (e[0] = t[0]), (e[1] = t[1]), (e[2] = t[2]), (e[3] = t[3]), e
				}
				function jt(t, e, n, r) {
					var a = new h.ARRAY_TYPE(4)
					return (a[0] = t), (a[1] = e), (a[2] = n), (a[3] = r), a
				}
				function Xt(t, e) {
					return (t[0] = e[0]), (t[1] = e[1]), (t[2] = e[2]), (t[3] = e[3]), t
				}
				function Vt(t, e, n, r, a) {
					return (t[0] = e), (t[1] = n), (t[2] = r), (t[3] = a), t
				}
				function Gt(t, e, n) {
					return (t[0] = e[0] + n[0]), (t[1] = e[1] + n[1]), (t[2] = e[2] + n[2]), (t[3] = e[3] + n[3]), t
				}
				function Ht(t, e, n) {
					return (t[0] = e[0] - n[0]), (t[1] = e[1] - n[1]), (t[2] = e[2] - n[2]), (t[3] = e[3] - n[3]), t
				}
				function Wt(t, e, n) {
					return (t[0] = e[0] * n[0]), (t[1] = e[1] * n[1]), (t[2] = e[2] * n[2]), (t[3] = e[3] * n[3]), t
				}
				function Zt(t, e, n) {
					return (t[0] = e[0] / n[0]), (t[1] = e[1] / n[1]), (t[2] = e[2] / n[2]), (t[3] = e[3] / n[3]), t
				}
				function Kt(t, e) {
					return (
						(t[0] = Math.ceil(e[0])), (t[1] = Math.ceil(e[1])), (t[2] = Math.ceil(e[2])), (t[3] = Math.ceil(e[3])), t
					)
				}
				function Qt(t, e) {
					return (
						(t[0] = Math.floor(e[0])),
						(t[1] = Math.floor(e[1])),
						(t[2] = Math.floor(e[2])),
						(t[3] = Math.floor(e[3])),
						t
					)
				}
				function Jt(t, e, n) {
					return (
						(t[0] = Math.min(e[0], n[0])),
						(t[1] = Math.min(e[1], n[1])),
						(t[2] = Math.min(e[2], n[2])),
						(t[3] = Math.min(e[3], n[3])),
						t
					)
				}
				function te(t, e, n) {
					return (
						(t[0] = Math.max(e[0], n[0])),
						(t[1] = Math.max(e[1], n[1])),
						(t[2] = Math.max(e[2], n[2])),
						(t[3] = Math.max(e[3], n[3])),
						t
					)
				}
				function ee(t, e) {
					return (
						(t[0] = Math.round(e[0])),
						(t[1] = Math.round(e[1])),
						(t[2] = Math.round(e[2])),
						(t[3] = Math.round(e[3])),
						t
					)
				}
				function ne(t, e, n) {
					return (t[0] = e[0] * n), (t[1] = e[1] * n), (t[2] = e[2] * n), (t[3] = e[3] * n), t
				}
				function re(t, e, n, r) {
					return (
						(t[0] = e[0] + n[0] * r), (t[1] = e[1] + n[1] * r), (t[2] = e[2] + n[2] * r), (t[3] = e[3] + n[3] * r), t
					)
				}
				function ae(t, e) {
					var n = e[0] - t[0],
						r = e[1] - t[1],
						a = e[2] - t[2],
						s = e[3] - t[3]
					return Math.hypot(n, r, a, s)
				}
				function se(t, e) {
					var n = e[0] - t[0],
						r = e[1] - t[1],
						a = e[2] - t[2],
						s = e[3] - t[3]
					return n * n + r * r + a * a + s * s
				}
				function ie(t) {
					var e = t[0],
						n = t[1],
						r = t[2],
						a = t[3]
					return Math.hypot(e, n, r, a)
				}
				function oe(t) {
					var e = t[0],
						n = t[1],
						r = t[2],
						a = t[3]
					return e * e + n * n + r * r + a * a
				}
				function ue(t, e) {
					return (t[0] = -e[0]), (t[1] = -e[1]), (t[2] = -e[2]), (t[3] = -e[3]), t
				}
				function ce(t, e) {
					return (t[0] = 1 / e[0]), (t[1] = 1 / e[1]), (t[2] = 1 / e[2]), (t[3] = 1 / e[3]), t
				}
				function he(t, e) {
					var n = e[0],
						r = e[1],
						a = e[2],
						s = e[3],
						i = n * n + r * r + a * a + s * s
					return i > 0 && (i = 1 / Math.sqrt(i)), (t[0] = n * i), (t[1] = r * i), (t[2] = a * i), (t[3] = s * i), t
				}
				function le(t, e) {
					return t[0] * e[0] + t[1] * e[1] + t[2] * e[2] + t[3] * e[3]
				}
				function fe(t, e, n, r) {
					var a = n[0] * r[1] - n[1] * r[0],
						s = n[0] * r[2] - n[2] * r[0],
						i = n[0] * r[3] - n[3] * r[0],
						o = n[1] * r[2] - n[2] * r[1],
						u = n[1] * r[3] - n[3] * r[1],
						c = n[2] * r[3] - n[3] * r[2],
						h = e[0],
						l = e[1],
						f = e[2],
						m = e[3]
					return (
						(t[0] = l * c - f * u + m * o),
						(t[1] = -h * c + f * i - m * s),
						(t[2] = h * u - l * i + m * a),
						(t[3] = -h * o + l * s - f * a),
						t
					)
				}
				function me(t, e, n, r) {
					var a = e[0],
						s = e[1],
						i = e[2],
						o = e[3]
					return (
						(t[0] = a + r * (n[0] - a)),
						(t[1] = s + r * (n[1] - s)),
						(t[2] = i + r * (n[2] - i)),
						(t[3] = o + r * (n[3] - o)),
						t
					)
				}
				function de(t, e) {
					var n, r, a, s, i, o
					e = e || 1
					do {
						i = (n = 2 * h.RANDOM() - 1) * n + (r = 2 * h.RANDOM() - 1) * r
					} while (i >= 1)
					do {
						o = (a = 2 * h.RANDOM() - 1) * a + (s = 2 * h.RANDOM() - 1) * s
					} while (o >= 1)
					var u = Math.sqrt((1 - i) / o)
					return (t[0] = e * n), (t[1] = e * r), (t[2] = e * a * u), (t[3] = e * s * u), t
				}
				function pe(t, e, n) {
					var r = e[0],
						a = e[1],
						s = e[2],
						i = e[3]
					return (
						(t[0] = n[0] * r + n[4] * a + n[8] * s + n[12] * i),
						(t[1] = n[1] * r + n[5] * a + n[9] * s + n[13] * i),
						(t[2] = n[2] * r + n[6] * a + n[10] * s + n[14] * i),
						(t[3] = n[3] * r + n[7] * a + n[11] * s + n[15] * i),
						t
					)
				}
				function ve(t, e, n) {
					var r = e[0],
						a = e[1],
						s = e[2],
						i = n[0],
						o = n[1],
						u = n[2],
						c = n[3],
						h = c * r + o * s - u * a,
						l = c * a + u * r - i * s,
						f = c * s + i * a - o * r,
						m = -i * r - o * a - u * s
					return (
						(t[0] = h * c + m * -i + l * -u - f * -o),
						(t[1] = l * c + m * -o + f * -i - h * -u),
						(t[2] = f * c + m * -u + h * -o - l * -i),
						(t[3] = e[3]),
						t
					)
				}
				function ge(t) {
					return (t[0] = 0), (t[1] = 0), (t[2] = 0), (t[3] = 0), t
				}
				function ye(t) {
					return "vec4(" + t[0] + ", " + t[1] + ", " + t[2] + ", " + t[3] + ")"
				}
				function xe(t, e) {
					return t[0] === e[0] && t[1] === e[1] && t[2] === e[2] && t[3] === e[3]
				}
				function be(t, e) {
					var n = t[0],
						r = t[1],
						a = t[2],
						s = t[3],
						i = e[0],
						o = e[1],
						u = e[2],
						c = e[3]
					return (
						Math.abs(n - i) <= h.EPSILON * Math.max(1, Math.abs(n), Math.abs(i)) &&
						Math.abs(r - o) <= h.EPSILON * Math.max(1, Math.abs(r), Math.abs(o)) &&
						Math.abs(a - u) <= h.EPSILON * Math.max(1, Math.abs(a), Math.abs(u)) &&
						Math.abs(s - c) <= h.EPSILON * Math.max(1, Math.abs(s), Math.abs(c))
					)
				}
				var _e,
					Me = Ht,
					$e = Wt,
					Ae = Zt,
					Ee = ae,
					we = se,
					Te = ie,
					Se = oe,
					Re =
						((_e = qt()),
						function (t, e, n, r, a, s) {
							var i, o
							for (e || (e = 4), n || (n = 0), o = r ? Math.min(r * e + n, t.length) : t.length, i = n; i < o; i += e)
								(_e[0] = t[i]),
									(_e[1] = t[i + 1]),
									(_e[2] = t[i + 2]),
									(_e[3] = t[i + 3]),
									a(_e, _e, s),
									(t[i] = _e[0]),
									(t[i + 1] = _e[1]),
									(t[i + 2] = _e[2]),
									(t[i + 3] = _e[3])
							return t
						})
				function Oe() {
					var t = new h.ARRAY_TYPE(4)
					return h.ARRAY_TYPE != Float32Array && ((t[0] = 0), (t[1] = 0), (t[2] = 0)), (t[3] = 1), t
				}
				function Fe(t) {
					return (t[0] = 0), (t[1] = 0), (t[2] = 0), (t[3] = 1), t
				}
				function Ie(t, e, n) {
					n *= 0.5
					var r = Math.sin(n)
					return (t[0] = r * e[0]), (t[1] = r * e[1]), (t[2] = r * e[2]), (t[3] = Math.cos(n)), t
				}
				function Pe(t, e) {
					var n = 2 * Math.acos(e[3]),
						r = Math.sin(n / 2)
					return (
						r > h.EPSILON
							? ((t[0] = e[0] / r), (t[1] = e[1] / r), (t[2] = e[2] / r))
							: ((t[0] = 1), (t[1] = 0), (t[2] = 0)),
						n
					)
				}
				function Ce(t, e) {
					var n = hn(t, e)
					return Math.acos(2 * n * n - 1)
				}
				function ze(t, e, n) {
					var r = e[0],
						a = e[1],
						s = e[2],
						i = e[3],
						o = n[0],
						u = n[1],
						c = n[2],
						h = n[3]
					return (
						(t[0] = r * h + i * o + a * c - s * u),
						(t[1] = a * h + i * u + s * o - r * c),
						(t[2] = s * h + i * c + r * u - a * o),
						(t[3] = i * h - r * o - a * u - s * c),
						t
					)
				}
				function De(t, e, n) {
					n *= 0.5
					var r = e[0],
						a = e[1],
						s = e[2],
						i = e[3],
						o = Math.sin(n),
						u = Math.cos(n)
					return (t[0] = r * u + i * o), (t[1] = a * u + s * o), (t[2] = s * u - a * o), (t[3] = i * u - r * o), t
				}
				function ke(t, e, n) {
					n *= 0.5
					var r = e[0],
						a = e[1],
						s = e[2],
						i = e[3],
						o = Math.sin(n),
						u = Math.cos(n)
					return (t[0] = r * u - s * o), (t[1] = a * u + i * o), (t[2] = s * u + r * o), (t[3] = i * u - a * o), t
				}
				function Ne(t, e, n) {
					n *= 0.5
					var r = e[0],
						a = e[1],
						s = e[2],
						i = e[3],
						o = Math.sin(n),
						u = Math.cos(n)
					return (t[0] = r * u + a * o), (t[1] = a * u - r * o), (t[2] = s * u + i * o), (t[3] = i * u - s * o), t
				}
				function Le(t, e) {
					var n = e[0],
						r = e[1],
						a = e[2]
					return (t[0] = n), (t[1] = r), (t[2] = a), (t[3] = Math.sqrt(Math.abs(1 - n * n - r * r - a * a))), t
				}
				function Ue(t, e) {
					var n = e[0],
						r = e[1],
						a = e[2],
						s = e[3],
						i = Math.sqrt(n * n + r * r + a * a),
						o = Math.exp(s),
						u = i > 0 ? (o * Math.sin(i)) / i : 0
					return (t[0] = n * u), (t[1] = r * u), (t[2] = a * u), (t[3] = o * Math.cos(i)), t
				}
				function Be(t, e) {
					var n = e[0],
						r = e[1],
						a = e[2],
						s = e[3],
						i = Math.sqrt(n * n + r * r + a * a),
						o = i > 0 ? Math.atan2(i, s) / i : 0
					return (
						(t[0] = n * o), (t[1] = r * o), (t[2] = a * o), (t[3] = 0.5 * Math.log(n * n + r * r + a * a + s * s)), t
					)
				}
				function qe(t, e, n) {
					return Be(t, e), cn(t, t, n), Ue(t, t), t
				}
				function Ye(t, e, n, r) {
					var a,
						s,
						i,
						o,
						u,
						c = e[0],
						l = e[1],
						f = e[2],
						m = e[3],
						d = n[0],
						p = n[1],
						v = n[2],
						g = n[3]
					return (
						(s = c * d + l * p + f * v + m * g) < 0 && ((s = -s), (d = -d), (p = -p), (v = -v), (g = -g)),
						1 - s > h.EPSILON
							? ((a = Math.acos(s)), (i = Math.sin(a)), (o = Math.sin((1 - r) * a) / i), (u = Math.sin(r * a) / i))
							: ((o = 1 - r), (u = r)),
						(t[0] = o * c + u * d),
						(t[1] = o * l + u * p),
						(t[2] = o * f + u * v),
						(t[3] = o * m + u * g),
						t
					)
				}
				function je(t) {
					var e = h.RANDOM(),
						n = h.RANDOM(),
						r = h.RANDOM(),
						a = Math.sqrt(1 - e),
						s = Math.sqrt(e)
					return (
						(t[0] = a * Math.sin(2 * Math.PI * n)),
						(t[1] = a * Math.cos(2 * Math.PI * n)),
						(t[2] = s * Math.sin(2 * Math.PI * r)),
						(t[3] = s * Math.cos(2 * Math.PI * r)),
						t
					)
				}
				function Xe(t, e) {
					var n = e[0],
						r = e[1],
						a = e[2],
						s = e[3],
						i = n * n + r * r + a * a + s * s,
						o = i ? 1 / i : 0
					return (t[0] = -n * o), (t[1] = -r * o), (t[2] = -a * o), (t[3] = s * o), t
				}
				function Ve(t, e) {
					return (t[0] = -e[0]), (t[1] = -e[1]), (t[2] = -e[2]), (t[3] = e[3]), t
				}
				function Ge(t, e) {
					var n,
						r = e[0] + e[4] + e[8]
					if (r > 0)
						(n = Math.sqrt(r + 1)),
							(t[3] = 0.5 * n),
							(n = 0.5 / n),
							(t[0] = (e[5] - e[7]) * n),
							(t[1] = (e[6] - e[2]) * n),
							(t[2] = (e[1] - e[3]) * n)
					else {
						var a = 0
						e[4] > e[0] && (a = 1), e[8] > e[3 * a + a] && (a = 2)
						var s = (a + 1) % 3,
							i = (a + 2) % 3
						;(n = Math.sqrt(e[3 * a + a] - e[3 * s + s] - e[3 * i + i] + 1)),
							(t[a] = 0.5 * n),
							(n = 0.5 / n),
							(t[3] = (e[3 * s + i] - e[3 * i + s]) * n),
							(t[s] = (e[3 * s + a] + e[3 * a + s]) * n),
							(t[i] = (e[3 * i + a] + e[3 * a + i]) * n)
					}
					return t
				}
				function He(t, e, n, r) {
					var a = (0.5 * Math.PI) / 180
					;(e *= a), (n *= a), (r *= a)
					var s = Math.sin(e),
						i = Math.cos(e),
						o = Math.sin(n),
						u = Math.cos(n),
						c = Math.sin(r),
						h = Math.cos(r)
					return (
						(t[0] = s * u * h - i * o * c),
						(t[1] = i * o * h + s * u * c),
						(t[2] = i * u * c - s * o * h),
						(t[3] = i * u * h + s * o * c),
						t
					)
				}
				function We(t) {
					return "quat(" + t[0] + ", " + t[1] + ", " + t[2] + ", " + t[3] + ")"
				}
				var Ze,
					Ke,
					Qe,
					Je,
					tn,
					en,
					nn = Yt,
					rn = jt,
					an = Xt,
					sn = Vt,
					on = Gt,
					un = ze,
					cn = ne,
					hn = le,
					ln = me,
					fn = ie,
					mn = fn,
					dn = oe,
					pn = dn,
					vn = he,
					gn = xe,
					yn = be,
					xn =
						((Ze = Bt.create()),
						(Ke = Bt.fromValues(1, 0, 0)),
						(Qe = Bt.fromValues(0, 1, 0)),
						function (t, e, n) {
							var r = Bt.dot(e, n)
							return r < -0.999999
								? (Bt.cross(Ze, Ke, e),
								  Bt.len(Ze) < 1e-6 && Bt.cross(Ze, Qe, e),
								  Bt.normalize(Ze, Ze),
								  Ie(t, Ze, Math.PI),
								  t)
								: r > 0.999999
								? ((t[0] = 0), (t[1] = 0), (t[2] = 0), (t[3] = 1), t)
								: (Bt.cross(Ze, e, n), (t[0] = Ze[0]), (t[1] = Ze[1]), (t[2] = Ze[2]), (t[3] = 1 + r), vn(t, t))
						}),
					bn =
						((Je = Oe()),
						(tn = Oe()),
						function (t, e, n, r, a, s) {
							return Ye(Je, e, a, s), Ye(tn, n, r, s), Ye(t, Je, tn, 2 * s * (1 - s)), t
						}),
					_n =
						((en = ut()),
						function (t, e, n, r) {
							return (
								(en[0] = n[0]),
								(en[3] = n[1]),
								(en[6] = n[2]),
								(en[1] = r[0]),
								(en[4] = r[1]),
								(en[7] = r[2]),
								(en[2] = -e[0]),
								(en[5] = -e[1]),
								(en[8] = -e[2]),
								vn(t, Ge(t, en))
							)
						})
				function Mn() {
					var t = new h.ARRAY_TYPE(8)
					return (
						h.ARRAY_TYPE != Float32Array &&
							((t[0] = 0), (t[1] = 0), (t[2] = 0), (t[4] = 0), (t[5] = 0), (t[6] = 0), (t[7] = 0)),
						(t[3] = 1),
						t
					)
				}
				function $n(t) {
					var e = new h.ARRAY_TYPE(8)
					return (
						(e[0] = t[0]),
						(e[1] = t[1]),
						(e[2] = t[2]),
						(e[3] = t[3]),
						(e[4] = t[4]),
						(e[5] = t[5]),
						(e[6] = t[6]),
						(e[7] = t[7]),
						e
					)
				}
				function An(t, e, n, r, a, s, i, o) {
					var u = new h.ARRAY_TYPE(8)
					return (u[0] = t), (u[1] = e), (u[2] = n), (u[3] = r), (u[4] = a), (u[5] = s), (u[6] = i), (u[7] = o), u
				}
				function En(t, e, n, r, a, s, i) {
					var o = new h.ARRAY_TYPE(8)
					;(o[0] = t), (o[1] = e), (o[2] = n), (o[3] = r)
					var u = 0.5 * a,
						c = 0.5 * s,
						l = 0.5 * i
					return (
						(o[4] = u * r + c * n - l * e),
						(o[5] = c * r + l * t - u * n),
						(o[6] = l * r + u * e - c * t),
						(o[7] = -u * t - c * e - l * n),
						o
					)
				}
				function wn(t, e, n) {
					var r = 0.5 * n[0],
						a = 0.5 * n[1],
						s = 0.5 * n[2],
						i = e[0],
						o = e[1],
						u = e[2],
						c = e[3]
					return (
						(t[0] = i),
						(t[1] = o),
						(t[2] = u),
						(t[3] = c),
						(t[4] = r * c + a * u - s * o),
						(t[5] = a * c + s * i - r * u),
						(t[6] = s * c + r * o - a * i),
						(t[7] = -r * i - a * o - s * u),
						t
					)
				}
				function Tn(t, e) {
					return (
						(t[0] = 0),
						(t[1] = 0),
						(t[2] = 0),
						(t[3] = 1),
						(t[4] = 0.5 * e[0]),
						(t[5] = 0.5 * e[1]),
						(t[6] = 0.5 * e[2]),
						(t[7] = 0),
						t
					)
				}
				function Sn(t, e) {
					return (
						(t[0] = e[0]),
						(t[1] = e[1]),
						(t[2] = e[2]),
						(t[3] = e[3]),
						(t[4] = 0),
						(t[5] = 0),
						(t[6] = 0),
						(t[7] = 0),
						t
					)
				}
				function Rn(t, e) {
					var n = Oe()
					Ut.getRotation(n, e)
					var r = new h.ARRAY_TYPE(3)
					return Ut.getTranslation(r, e), wn(t, n, r), t
				}
				function On(t, e) {
					return (
						(t[0] = e[0]),
						(t[1] = e[1]),
						(t[2] = e[2]),
						(t[3] = e[3]),
						(t[4] = e[4]),
						(t[5] = e[5]),
						(t[6] = e[6]),
						(t[7] = e[7]),
						t
					)
				}
				function Fn(t) {
					return (t[0] = 0), (t[1] = 0), (t[2] = 0), (t[3] = 1), (t[4] = 0), (t[5] = 0), (t[6] = 0), (t[7] = 0), t
				}
				function In(t, e, n, r, a, s, i, o, u) {
					return (t[0] = e), (t[1] = n), (t[2] = r), (t[3] = a), (t[4] = s), (t[5] = i), (t[6] = o), (t[7] = u), t
				}
				var Pn = an
				function Cn(t, e) {
					return (t[0] = e[4]), (t[1] = e[5]), (t[2] = e[6]), (t[3] = e[7]), t
				}
				var zn = an
				function Dn(t, e) {
					return (t[4] = e[0]), (t[5] = e[1]), (t[6] = e[2]), (t[7] = e[3]), t
				}
				function kn(t, e) {
					var n = e[4],
						r = e[5],
						a = e[6],
						s = e[7],
						i = -e[0],
						o = -e[1],
						u = -e[2],
						c = e[3]
					return (
						(t[0] = 2 * (n * c + s * i + r * u - a * o)),
						(t[1] = 2 * (r * c + s * o + a * i - n * u)),
						(t[2] = 2 * (a * c + s * u + n * o - r * i)),
						t
					)
				}
				function Nn(t, e, n) {
					var r = e[0],
						a = e[1],
						s = e[2],
						i = e[3],
						o = 0.5 * n[0],
						u = 0.5 * n[1],
						c = 0.5 * n[2],
						h = e[4],
						l = e[5],
						f = e[6],
						m = e[7]
					return (
						(t[0] = r),
						(t[1] = a),
						(t[2] = s),
						(t[3] = i),
						(t[4] = i * o + a * c - s * u + h),
						(t[5] = i * u + s * o - r * c + l),
						(t[6] = i * c + r * u - a * o + f),
						(t[7] = -r * o - a * u - s * c + m),
						t
					)
				}
				function Ln(t, e, n) {
					var r = -e[0],
						a = -e[1],
						s = -e[2],
						i = e[3],
						o = e[4],
						u = e[5],
						c = e[6],
						h = e[7],
						l = o * i + h * r + u * s - c * a,
						f = u * i + h * a + c * r - o * s,
						m = c * i + h * s + o * a - u * r,
						d = h * i - o * r - u * a - c * s
					return (
						De(t, e, n),
						(r = t[0]),
						(a = t[1]),
						(s = t[2]),
						(i = t[3]),
						(t[4] = l * i + d * r + f * s - m * a),
						(t[5] = f * i + d * a + m * r - l * s),
						(t[6] = m * i + d * s + l * a - f * r),
						(t[7] = d * i - l * r - f * a - m * s),
						t
					)
				}
				function Un(t, e, n) {
					var r = -e[0],
						a = -e[1],
						s = -e[2],
						i = e[3],
						o = e[4],
						u = e[5],
						c = e[6],
						h = e[7],
						l = o * i + h * r + u * s - c * a,
						f = u * i + h * a + c * r - o * s,
						m = c * i + h * s + o * a - u * r,
						d = h * i - o * r - u * a - c * s
					return (
						ke(t, e, n),
						(r = t[0]),
						(a = t[1]),
						(s = t[2]),
						(i = t[3]),
						(t[4] = l * i + d * r + f * s - m * a),
						(t[5] = f * i + d * a + m * r - l * s),
						(t[6] = m * i + d * s + l * a - f * r),
						(t[7] = d * i - l * r - f * a - m * s),
						t
					)
				}
				function Bn(t, e, n) {
					var r = -e[0],
						a = -e[1],
						s = -e[2],
						i = e[3],
						o = e[4],
						u = e[5],
						c = e[6],
						h = e[7],
						l = o * i + h * r + u * s - c * a,
						f = u * i + h * a + c * r - o * s,
						m = c * i + h * s + o * a - u * r,
						d = h * i - o * r - u * a - c * s
					return (
						Ne(t, e, n),
						(r = t[0]),
						(a = t[1]),
						(s = t[2]),
						(i = t[3]),
						(t[4] = l * i + d * r + f * s - m * a),
						(t[5] = f * i + d * a + m * r - l * s),
						(t[6] = m * i + d * s + l * a - f * r),
						(t[7] = d * i - l * r - f * a - m * s),
						t
					)
				}
				function qn(t, e, n) {
					var r = n[0],
						a = n[1],
						s = n[2],
						i = n[3],
						o = e[0],
						u = e[1],
						c = e[2],
						h = e[3]
					return (
						(t[0] = o * i + h * r + u * s - c * a),
						(t[1] = u * i + h * a + c * r - o * s),
						(t[2] = c * i + h * s + o * a - u * r),
						(t[3] = h * i - o * r - u * a - c * s),
						(o = e[4]),
						(u = e[5]),
						(c = e[6]),
						(h = e[7]),
						(t[4] = o * i + h * r + u * s - c * a),
						(t[5] = u * i + h * a + c * r - o * s),
						(t[6] = c * i + h * s + o * a - u * r),
						(t[7] = h * i - o * r - u * a - c * s),
						t
					)
				}
				function Yn(t, e, n) {
					var r = e[0],
						a = e[1],
						s = e[2],
						i = e[3],
						o = n[0],
						u = n[1],
						c = n[2],
						h = n[3]
					return (
						(t[0] = r * h + i * o + a * c - s * u),
						(t[1] = a * h + i * u + s * o - r * c),
						(t[2] = s * h + i * c + r * u - a * o),
						(t[3] = i * h - r * o - a * u - s * c),
						(o = n[4]),
						(u = n[5]),
						(c = n[6]),
						(h = n[7]),
						(t[4] = r * h + i * o + a * c - s * u),
						(t[5] = a * h + i * u + s * o - r * c),
						(t[6] = s * h + i * c + r * u - a * o),
						(t[7] = i * h - r * o - a * u - s * c),
						t
					)
				}
				function jn(t, e, n, r) {
					if (Math.abs(r) < h.EPSILON) return On(t, e)
					var a = Math.hypot(n[0], n[1], n[2])
					r *= 0.5
					var s = Math.sin(r),
						i = (s * n[0]) / a,
						o = (s * n[1]) / a,
						u = (s * n[2]) / a,
						c = Math.cos(r),
						l = e[0],
						f = e[1],
						m = e[2],
						d = e[3]
					;(t[0] = l * c + d * i + f * u - m * o),
						(t[1] = f * c + d * o + m * i - l * u),
						(t[2] = m * c + d * u + l * o - f * i),
						(t[3] = d * c - l * i - f * o - m * u)
					var p = e[4],
						v = e[5],
						g = e[6],
						y = e[7]
					return (
						(t[4] = p * c + y * i + v * u - g * o),
						(t[5] = v * c + y * o + g * i - p * u),
						(t[6] = g * c + y * u + p * o - v * i),
						(t[7] = y * c - p * i - v * o - g * u),
						t
					)
				}
				function Xn(t, e, n) {
					return (
						(t[0] = e[0] + n[0]),
						(t[1] = e[1] + n[1]),
						(t[2] = e[2] + n[2]),
						(t[3] = e[3] + n[3]),
						(t[4] = e[4] + n[4]),
						(t[5] = e[5] + n[5]),
						(t[6] = e[6] + n[6]),
						(t[7] = e[7] + n[7]),
						t
					)
				}
				function Vn(t, e, n) {
					var r = e[0],
						a = e[1],
						s = e[2],
						i = e[3],
						o = n[4],
						u = n[5],
						c = n[6],
						h = n[7],
						l = e[4],
						f = e[5],
						m = e[6],
						d = e[7],
						p = n[0],
						v = n[1],
						g = n[2],
						y = n[3]
					return (
						(t[0] = r * y + i * p + a * g - s * v),
						(t[1] = a * y + i * v + s * p - r * g),
						(t[2] = s * y + i * g + r * v - a * p),
						(t[3] = i * y - r * p - a * v - s * g),
						(t[4] = r * h + i * o + a * c - s * u + l * y + d * p + f * g - m * v),
						(t[5] = a * h + i * u + s * o - r * c + f * y + d * v + m * p - l * g),
						(t[6] = s * h + i * c + r * u - a * o + m * y + d * g + l * v - f * p),
						(t[7] = i * h - r * o - a * u - s * c + d * y - l * p - f * v - m * g),
						t
					)
				}
				var Gn = Vn
				function Hn(t, e, n) {
					return (
						(t[0] = e[0] * n),
						(t[1] = e[1] * n),
						(t[2] = e[2] * n),
						(t[3] = e[3] * n),
						(t[4] = e[4] * n),
						(t[5] = e[5] * n),
						(t[6] = e[6] * n),
						(t[7] = e[7] * n),
						t
					)
				}
				var Wn = hn
				function Zn(t, e, n, r) {
					var a = 1 - r
					return (
						Wn(e, n) < 0 && (r = -r),
						(t[0] = e[0] * a + n[0] * r),
						(t[1] = e[1] * a + n[1] * r),
						(t[2] = e[2] * a + n[2] * r),
						(t[3] = e[3] * a + n[3] * r),
						(t[4] = e[4] * a + n[4] * r),
						(t[5] = e[5] * a + n[5] * r),
						(t[6] = e[6] * a + n[6] * r),
						(t[7] = e[7] * a + n[7] * r),
						t
					)
				}
				function Kn(t, e) {
					var n = er(e)
					return (
						(t[0] = -e[0] / n),
						(t[1] = -e[1] / n),
						(t[2] = -e[2] / n),
						(t[3] = e[3] / n),
						(t[4] = -e[4] / n),
						(t[5] = -e[5] / n),
						(t[6] = -e[6] / n),
						(t[7] = e[7] / n),
						t
					)
				}
				function Qn(t, e) {
					return (
						(t[0] = -e[0]),
						(t[1] = -e[1]),
						(t[2] = -e[2]),
						(t[3] = e[3]),
						(t[4] = -e[4]),
						(t[5] = -e[5]),
						(t[6] = -e[6]),
						(t[7] = e[7]),
						t
					)
				}
				var Jn = fn,
					tr = Jn,
					er = dn,
					nr = er
				function rr(t, e) {
					var n = er(e)
					if (n > 0) {
						n = Math.sqrt(n)
						var r = e[0] / n,
							a = e[1] / n,
							s = e[2] / n,
							i = e[3] / n,
							o = e[4],
							u = e[5],
							c = e[6],
							h = e[7],
							l = r * o + a * u + s * c + i * h
						;(t[0] = r),
							(t[1] = a),
							(t[2] = s),
							(t[3] = i),
							(t[4] = (o - r * l) / n),
							(t[5] = (u - a * l) / n),
							(t[6] = (c - s * l) / n),
							(t[7] = (h - i * l) / n)
					}
					return t
				}
				function ar(t) {
					return (
						"quat2(" +
						t[0] +
						", " +
						t[1] +
						", " +
						t[2] +
						", " +
						t[3] +
						", " +
						t[4] +
						", " +
						t[5] +
						", " +
						t[6] +
						", " +
						t[7] +
						")"
					)
				}
				function sr(t, e) {
					return (
						t[0] === e[0] &&
						t[1] === e[1] &&
						t[2] === e[2] &&
						t[3] === e[3] &&
						t[4] === e[4] &&
						t[5] === e[5] &&
						t[6] === e[6] &&
						t[7] === e[7]
					)
				}
				function ir(t, e) {
					var n = t[0],
						r = t[1],
						a = t[2],
						s = t[3],
						i = t[4],
						o = t[5],
						u = t[6],
						c = t[7],
						l = e[0],
						f = e[1],
						m = e[2],
						d = e[3],
						p = e[4],
						v = e[5],
						g = e[6],
						y = e[7]
					return (
						Math.abs(n - l) <= h.EPSILON * Math.max(1, Math.abs(n), Math.abs(l)) &&
						Math.abs(r - f) <= h.EPSILON * Math.max(1, Math.abs(r), Math.abs(f)) &&
						Math.abs(a - m) <= h.EPSILON * Math.max(1, Math.abs(a), Math.abs(m)) &&
						Math.abs(s - d) <= h.EPSILON * Math.max(1, Math.abs(s), Math.abs(d)) &&
						Math.abs(i - p) <= h.EPSILON * Math.max(1, Math.abs(i), Math.abs(p)) &&
						Math.abs(o - v) <= h.EPSILON * Math.max(1, Math.abs(o), Math.abs(v)) &&
						Math.abs(u - g) <= h.EPSILON * Math.max(1, Math.abs(u), Math.abs(g)) &&
						Math.abs(c - y) <= h.EPSILON * Math.max(1, Math.abs(c), Math.abs(y))
					)
				}
				function or() {
					var t = new h.ARRAY_TYPE(2)
					return h.ARRAY_TYPE != Float32Array && ((t[0] = 0), (t[1] = 0)), t
				}
				function ur(t) {
					var e = new h.ARRAY_TYPE(2)
					return (e[0] = t[0]), (e[1] = t[1]), e
				}
				function cr(t, e) {
					var n = new h.ARRAY_TYPE(2)
					return (n[0] = t), (n[1] = e), n
				}
				function hr(t, e) {
					return (t[0] = e[0]), (t[1] = e[1]), t
				}
				function lr(t, e, n) {
					return (t[0] = e), (t[1] = n), t
				}
				function fr(t, e, n) {
					return (t[0] = e[0] + n[0]), (t[1] = e[1] + n[1]), t
				}
				function mr(t, e, n) {
					return (t[0] = e[0] - n[0]), (t[1] = e[1] - n[1]), t
				}
				function dr(t, e, n) {
					return (t[0] = e[0] * n[0]), (t[1] = e[1] * n[1]), t
				}
				function pr(t, e, n) {
					return (t[0] = e[0] / n[0]), (t[1] = e[1] / n[1]), t
				}
				function vr(t, e) {
					return (t[0] = Math.ceil(e[0])), (t[1] = Math.ceil(e[1])), t
				}
				function gr(t, e) {
					return (t[0] = Math.floor(e[0])), (t[1] = Math.floor(e[1])), t
				}
				function yr(t, e, n) {
					return (t[0] = Math.min(e[0], n[0])), (t[1] = Math.min(e[1], n[1])), t
				}
				function xr(t, e, n) {
					return (t[0] = Math.max(e[0], n[0])), (t[1] = Math.max(e[1], n[1])), t
				}
				function br(t, e) {
					return (t[0] = Math.round(e[0])), (t[1] = Math.round(e[1])), t
				}
				function _r(t, e, n) {
					return (t[0] = e[0] * n), (t[1] = e[1] * n), t
				}
				function Mr(t, e, n, r) {
					return (t[0] = e[0] + n[0] * r), (t[1] = e[1] + n[1] * r), t
				}
				function $r(t, e) {
					var n = e[0] - t[0],
						r = e[1] - t[1]
					return Math.hypot(n, r)
				}
				function Ar(t, e) {
					var n = e[0] - t[0],
						r = e[1] - t[1]
					return n * n + r * r
				}
				function Er(t) {
					var e = t[0],
						n = t[1]
					return Math.hypot(e, n)
				}
				function wr(t) {
					var e = t[0],
						n = t[1]
					return e * e + n * n
				}
				function Tr(t, e) {
					return (t[0] = -e[0]), (t[1] = -e[1]), t
				}
				function Sr(t, e) {
					return (t[0] = 1 / e[0]), (t[1] = 1 / e[1]), t
				}
				function Rr(t, e) {
					var n = e[0],
						r = e[1],
						a = n * n + r * r
					return a > 0 && (a = 1 / Math.sqrt(a)), (t[0] = e[0] * a), (t[1] = e[1] * a), t
				}
				function Or(t, e) {
					return t[0] * e[0] + t[1] * e[1]
				}
				function Fr(t, e, n) {
					var r = e[0] * n[1] - e[1] * n[0]
					return (t[0] = t[1] = 0), (t[2] = r), t
				}
				function Ir(t, e, n, r) {
					var a = e[0],
						s = e[1]
					return (t[0] = a + r * (n[0] - a)), (t[1] = s + r * (n[1] - s)), t
				}
				function Pr(t, e) {
					e = e || 1
					var n = 2 * h.RANDOM() * Math.PI
					return (t[0] = Math.cos(n) * e), (t[1] = Math.sin(n) * e), t
				}
				function Cr(t, e, n) {
					var r = e[0],
						a = e[1]
					return (t[0] = n[0] * r + n[2] * a), (t[1] = n[1] * r + n[3] * a), t
				}
				function zr(t, e, n) {
					var r = e[0],
						a = e[1]
					return (t[0] = n[0] * r + n[2] * a + n[4]), (t[1] = n[1] * r + n[3] * a + n[5]), t
				}
				function Dr(t, e, n) {
					var r = e[0],
						a = e[1]
					return (t[0] = n[0] * r + n[3] * a + n[6]), (t[1] = n[1] * r + n[4] * a + n[7]), t
				}
				function kr(t, e, n) {
					var r = e[0],
						a = e[1]
					return (t[0] = n[0] * r + n[4] * a + n[12]), (t[1] = n[1] * r + n[5] * a + n[13]), t
				}
				function Nr(t, e, n, r) {
					var a = e[0] - n[0],
						s = e[1] - n[1],
						i = Math.sin(r),
						o = Math.cos(r)
					return (t[0] = a * o - s * i + n[0]), (t[1] = a * i + s * o + n[1]), t
				}
				function Lr(t, e) {
					var n = t[0],
						r = t[1],
						a = e[0],
						s = e[1],
						i = Math.sqrt(n * n + r * r) * Math.sqrt(a * a + s * s),
						o = i && (n * a + r * s) / i
					return Math.acos(Math.min(Math.max(o, -1), 1))
				}
				function Ur(t) {
					return (t[0] = 0), (t[1] = 0), t
				}
				function Br(t) {
					return "vec2(" + t[0] + ", " + t[1] + ")"
				}
				function qr(t, e) {
					return t[0] === e[0] && t[1] === e[1]
				}
				function Yr(t, e) {
					var n = t[0],
						r = t[1],
						a = e[0],
						s = e[1]
					return (
						Math.abs(n - a) <= h.EPSILON * Math.max(1, Math.abs(n), Math.abs(a)) &&
						Math.abs(r - s) <= h.EPSILON * Math.max(1, Math.abs(r), Math.abs(s))
					)
				}
				var jr = Er,
					Xr = mr,
					Vr = dr,
					Gr = pr,
					Hr = $r,
					Wr = Ar,
					Zr = wr,
					Kr = (function () {
						var t = or()
						return function (e, n, r, a, s, i) {
							var o, u
							for (n || (n = 2), r || (r = 0), u = a ? Math.min(a * n + r, e.length) : e.length, o = r; o < u; o += n)
								(t[0] = e[o]), (t[1] = e[o + 1]), s(t, t, i), (e[o] = t[0]), (e[o + 1] = t[1])
							return e
						}
					})()
			},
			159: (t, e, n) => {
				"use strict"
				n.r(e),
					n.d(e, {
						add: () => G,
						adjoint: () => f,
						clone: () => s,
						copy: () => i,
						create: () => a,
						determinant: () => m,
						equals: () => Q,
						exactEquals: () => K,
						frob: () => V,
						fromQuat: () => C,
						fromQuat2: () => S,
						fromRotation: () => $,
						fromRotationTranslation: () => T,
						fromRotationTranslationScale: () => I,
						fromRotationTranslationScaleOrigin: () => P,
						fromScaling: () => M,
						fromTranslation: () => _,
						fromValues: () => o,
						fromXRotation: () => A,
						fromYRotation: () => E,
						fromZRotation: () => w,
						frustum: () => z,
						getRotation: () => F,
						getScaling: () => O,
						getTranslation: () => R,
						identity: () => c,
						invert: () => l,
						lookAt: () => Y,
						mul: () => J,
						multiply: () => d,
						multiplyScalar: () => W,
						multiplyScalarAndAdd: () => Z,
						ortho: () => B,
						orthoNO: () => U,
						orthoZO: () => q,
						perspective: () => k,
						perspectiveFromFieldOfView: () => L,
						perspectiveNO: () => D,
						perspectiveZO: () => N,
						rotate: () => g,
						rotateX: () => y,
						rotateY: () => x,
						rotateZ: () => b,
						scale: () => v,
						set: () => u,
						str: () => X,
						sub: () => tt,
						subtract: () => H,
						targetTo: () => j,
						translate: () => p,
						transpose: () => h,
					})
				var r = n(3406)
				function a() {
					var t = new r.ARRAY_TYPE(16)
					return (
						r.ARRAY_TYPE != Float32Array &&
							((t[1] = 0),
							(t[2] = 0),
							(t[3] = 0),
							(t[4] = 0),
							(t[6] = 0),
							(t[7] = 0),
							(t[8] = 0),
							(t[9] = 0),
							(t[11] = 0),
							(t[12] = 0),
							(t[13] = 0),
							(t[14] = 0)),
						(t[0] = 1),
						(t[5] = 1),
						(t[10] = 1),
						(t[15] = 1),
						t
					)
				}
				function s(t) {
					var e = new r.ARRAY_TYPE(16)
					return (
						(e[0] = t[0]),
						(e[1] = t[1]),
						(e[2] = t[2]),
						(e[3] = t[3]),
						(e[4] = t[4]),
						(e[5] = t[5]),
						(e[6] = t[6]),
						(e[7] = t[7]),
						(e[8] = t[8]),
						(e[9] = t[9]),
						(e[10] = t[10]),
						(e[11] = t[11]),
						(e[12] = t[12]),
						(e[13] = t[13]),
						(e[14] = t[14]),
						(e[15] = t[15]),
						e
					)
				}
				function i(t, e) {
					return (
						(t[0] = e[0]),
						(t[1] = e[1]),
						(t[2] = e[2]),
						(t[3] = e[3]),
						(t[4] = e[4]),
						(t[5] = e[5]),
						(t[6] = e[6]),
						(t[7] = e[7]),
						(t[8] = e[8]),
						(t[9] = e[9]),
						(t[10] = e[10]),
						(t[11] = e[11]),
						(t[12] = e[12]),
						(t[13] = e[13]),
						(t[14] = e[14]),
						(t[15] = e[15]),
						t
					)
				}
				function o(t, e, n, a, s, i, o, u, c, h, l, f, m, d, p, v) {
					var g = new r.ARRAY_TYPE(16)
					return (
						(g[0] = t),
						(g[1] = e),
						(g[2] = n),
						(g[3] = a),
						(g[4] = s),
						(g[5] = i),
						(g[6] = o),
						(g[7] = u),
						(g[8] = c),
						(g[9] = h),
						(g[10] = l),
						(g[11] = f),
						(g[12] = m),
						(g[13] = d),
						(g[14] = p),
						(g[15] = v),
						g
					)
				}
				function u(t, e, n, r, a, s, i, o, u, c, h, l, f, m, d, p, v) {
					return (
						(t[0] = e),
						(t[1] = n),
						(t[2] = r),
						(t[3] = a),
						(t[4] = s),
						(t[5] = i),
						(t[6] = o),
						(t[7] = u),
						(t[8] = c),
						(t[9] = h),
						(t[10] = l),
						(t[11] = f),
						(t[12] = m),
						(t[13] = d),
						(t[14] = p),
						(t[15] = v),
						t
					)
				}
				function c(t) {
					return (
						(t[0] = 1),
						(t[1] = 0),
						(t[2] = 0),
						(t[3] = 0),
						(t[4] = 0),
						(t[5] = 1),
						(t[6] = 0),
						(t[7] = 0),
						(t[8] = 0),
						(t[9] = 0),
						(t[10] = 1),
						(t[11] = 0),
						(t[12] = 0),
						(t[13] = 0),
						(t[14] = 0),
						(t[15] = 1),
						t
					)
				}
				function h(t, e) {
					if (t === e) {
						var n = e[1],
							r = e[2],
							a = e[3],
							s = e[6],
							i = e[7],
							o = e[11]
						;(t[1] = e[4]),
							(t[2] = e[8]),
							(t[3] = e[12]),
							(t[4] = n),
							(t[6] = e[9]),
							(t[7] = e[13]),
							(t[8] = r),
							(t[9] = s),
							(t[11] = e[14]),
							(t[12] = a),
							(t[13] = i),
							(t[14] = o)
					} else
						(t[0] = e[0]),
							(t[1] = e[4]),
							(t[2] = e[8]),
							(t[3] = e[12]),
							(t[4] = e[1]),
							(t[5] = e[5]),
							(t[6] = e[9]),
							(t[7] = e[13]),
							(t[8] = e[2]),
							(t[9] = e[6]),
							(t[10] = e[10]),
							(t[11] = e[14]),
							(t[12] = e[3]),
							(t[13] = e[7]),
							(t[14] = e[11]),
							(t[15] = e[15])
					return t
				}
				function l(t, e) {
					var n = e[0],
						r = e[1],
						a = e[2],
						s = e[3],
						i = e[4],
						o = e[5],
						u = e[6],
						c = e[7],
						h = e[8],
						l = e[9],
						f = e[10],
						m = e[11],
						d = e[12],
						p = e[13],
						v = e[14],
						g = e[15],
						y = n * o - r * i,
						x = n * u - a * i,
						b = n * c - s * i,
						_ = r * u - a * o,
						M = r * c - s * o,
						$ = a * c - s * u,
						A = h * p - l * d,
						E = h * v - f * d,
						w = h * g - m * d,
						T = l * v - f * p,
						S = l * g - m * p,
						R = f * g - m * v,
						O = y * R - x * S + b * T + _ * w - M * E + $ * A
					return O
						? ((O = 1 / O),
						  (t[0] = (o * R - u * S + c * T) * O),
						  (t[1] = (a * S - r * R - s * T) * O),
						  (t[2] = (p * $ - v * M + g * _) * O),
						  (t[3] = (f * M - l * $ - m * _) * O),
						  (t[4] = (u * w - i * R - c * E) * O),
						  (t[5] = (n * R - a * w + s * E) * O),
						  (t[6] = (v * b - d * $ - g * x) * O),
						  (t[7] = (h * $ - f * b + m * x) * O),
						  (t[8] = (i * S - o * w + c * A) * O),
						  (t[9] = (r * w - n * S - s * A) * O),
						  (t[10] = (d * M - p * b + g * y) * O),
						  (t[11] = (l * b - h * M - m * y) * O),
						  (t[12] = (o * E - i * T - u * A) * O),
						  (t[13] = (n * T - r * E + a * A) * O),
						  (t[14] = (p * x - d * _ - v * y) * O),
						  (t[15] = (h * _ - l * x + f * y) * O),
						  t)
						: null
				}
				function f(t, e) {
					var n = e[0],
						r = e[1],
						a = e[2],
						s = e[3],
						i = e[4],
						o = e[5],
						u = e[6],
						c = e[7],
						h = e[8],
						l = e[9],
						f = e[10],
						m = e[11],
						d = e[12],
						p = e[13],
						v = e[14],
						g = e[15]
					return (
						(t[0] = o * (f * g - m * v) - l * (u * g - c * v) + p * (u * m - c * f)),
						(t[1] = -(r * (f * g - m * v) - l * (a * g - s * v) + p * (a * m - s * f))),
						(t[2] = r * (u * g - c * v) - o * (a * g - s * v) + p * (a * c - s * u)),
						(t[3] = -(r * (u * m - c * f) - o * (a * m - s * f) + l * (a * c - s * u))),
						(t[4] = -(i * (f * g - m * v) - h * (u * g - c * v) + d * (u * m - c * f))),
						(t[5] = n * (f * g - m * v) - h * (a * g - s * v) + d * (a * m - s * f)),
						(t[6] = -(n * (u * g - c * v) - i * (a * g - s * v) + d * (a * c - s * u))),
						(t[7] = n * (u * m - c * f) - i * (a * m - s * f) + h * (a * c - s * u)),
						(t[8] = i * (l * g - m * p) - h * (o * g - c * p) + d * (o * m - c * l)),
						(t[9] = -(n * (l * g - m * p) - h * (r * g - s * p) + d * (r * m - s * l))),
						(t[10] = n * (o * g - c * p) - i * (r * g - s * p) + d * (r * c - s * o)),
						(t[11] = -(n * (o * m - c * l) - i * (r * m - s * l) + h * (r * c - s * o))),
						(t[12] = -(i * (l * v - f * p) - h * (o * v - u * p) + d * (o * f - u * l))),
						(t[13] = n * (l * v - f * p) - h * (r * v - a * p) + d * (r * f - a * l)),
						(t[14] = -(n * (o * v - u * p) - i * (r * v - a * p) + d * (r * u - a * o))),
						(t[15] = n * (o * f - u * l) - i * (r * f - a * l) + h * (r * u - a * o)),
						t
					)
				}
				function m(t) {
					var e = t[0],
						n = t[1],
						r = t[2],
						a = t[3],
						s = t[4],
						i = t[5],
						o = t[6],
						u = t[7],
						c = t[8],
						h = t[9],
						l = t[10],
						f = t[11],
						m = t[12],
						d = t[13],
						p = t[14],
						v = t[15]
					return (
						(e * i - n * s) * (l * v - f * p) -
						(e * o - r * s) * (h * v - f * d) +
						(e * u - a * s) * (h * p - l * d) +
						(n * o - r * i) * (c * v - f * m) -
						(n * u - a * i) * (c * p - l * m) +
						(r * u - a * o) * (c * d - h * m)
					)
				}
				function d(t, e, n) {
					var r = e[0],
						a = e[1],
						s = e[2],
						i = e[3],
						o = e[4],
						u = e[5],
						c = e[6],
						h = e[7],
						l = e[8],
						f = e[9],
						m = e[10],
						d = e[11],
						p = e[12],
						v = e[13],
						g = e[14],
						y = e[15],
						x = n[0],
						b = n[1],
						_ = n[2],
						M = n[3]
					return (
						(t[0] = x * r + b * o + _ * l + M * p),
						(t[1] = x * a + b * u + _ * f + M * v),
						(t[2] = x * s + b * c + _ * m + M * g),
						(t[3] = x * i + b * h + _ * d + M * y),
						(x = n[4]),
						(b = n[5]),
						(_ = n[6]),
						(M = n[7]),
						(t[4] = x * r + b * o + _ * l + M * p),
						(t[5] = x * a + b * u + _ * f + M * v),
						(t[6] = x * s + b * c + _ * m + M * g),
						(t[7] = x * i + b * h + _ * d + M * y),
						(x = n[8]),
						(b = n[9]),
						(_ = n[10]),
						(M = n[11]),
						(t[8] = x * r + b * o + _ * l + M * p),
						(t[9] = x * a + b * u + _ * f + M * v),
						(t[10] = x * s + b * c + _ * m + M * g),
						(t[11] = x * i + b * h + _ * d + M * y),
						(x = n[12]),
						(b = n[13]),
						(_ = n[14]),
						(M = n[15]),
						(t[12] = x * r + b * o + _ * l + M * p),
						(t[13] = x * a + b * u + _ * f + M * v),
						(t[14] = x * s + b * c + _ * m + M * g),
						(t[15] = x * i + b * h + _ * d + M * y),
						t
					)
				}
				function p(t, e, n) {
					var r,
						a,
						s,
						i,
						o,
						u,
						c,
						h,
						l,
						f,
						m,
						d,
						p = n[0],
						v = n[1],
						g = n[2]
					return (
						e === t
							? ((t[12] = e[0] * p + e[4] * v + e[8] * g + e[12]),
							  (t[13] = e[1] * p + e[5] * v + e[9] * g + e[13]),
							  (t[14] = e[2] * p + e[6] * v + e[10] * g + e[14]),
							  (t[15] = e[3] * p + e[7] * v + e[11] * g + e[15]))
							: ((r = e[0]),
							  (a = e[1]),
							  (s = e[2]),
							  (i = e[3]),
							  (o = e[4]),
							  (u = e[5]),
							  (c = e[6]),
							  (h = e[7]),
							  (l = e[8]),
							  (f = e[9]),
							  (m = e[10]),
							  (d = e[11]),
							  (t[0] = r),
							  (t[1] = a),
							  (t[2] = s),
							  (t[3] = i),
							  (t[4] = o),
							  (t[5] = u),
							  (t[6] = c),
							  (t[7] = h),
							  (t[8] = l),
							  (t[9] = f),
							  (t[10] = m),
							  (t[11] = d),
							  (t[12] = r * p + o * v + l * g + e[12]),
							  (t[13] = a * p + u * v + f * g + e[13]),
							  (t[14] = s * p + c * v + m * g + e[14]),
							  (t[15] = i * p + h * v + d * g + e[15])),
						t
					)
				}
				function v(t, e, n) {
					var r = n[0],
						a = n[1],
						s = n[2]
					return (
						(t[0] = e[0] * r),
						(t[1] = e[1] * r),
						(t[2] = e[2] * r),
						(t[3] = e[3] * r),
						(t[4] = e[4] * a),
						(t[5] = e[5] * a),
						(t[6] = e[6] * a),
						(t[7] = e[7] * a),
						(t[8] = e[8] * s),
						(t[9] = e[9] * s),
						(t[10] = e[10] * s),
						(t[11] = e[11] * s),
						(t[12] = e[12]),
						(t[13] = e[13]),
						(t[14] = e[14]),
						(t[15] = e[15]),
						t
					)
				}
				function g(t, e, n, a) {
					var s,
						i,
						o,
						u,
						c,
						h,
						l,
						f,
						m,
						d,
						p,
						v,
						g,
						y,
						x,
						b,
						_,
						M,
						$,
						A,
						E,
						w,
						T,
						S,
						R = a[0],
						O = a[1],
						F = a[2],
						I = Math.hypot(R, O, F)
					return I < r.EPSILON
						? null
						: ((R *= I = 1 / I),
						  (O *= I),
						  (F *= I),
						  (s = Math.sin(n)),
						  (o = 1 - (i = Math.cos(n))),
						  (u = e[0]),
						  (c = e[1]),
						  (h = e[2]),
						  (l = e[3]),
						  (f = e[4]),
						  (m = e[5]),
						  (d = e[6]),
						  (p = e[7]),
						  (v = e[8]),
						  (g = e[9]),
						  (y = e[10]),
						  (x = e[11]),
						  (b = R * R * o + i),
						  (_ = O * R * o + F * s),
						  (M = F * R * o - O * s),
						  ($ = R * O * o - F * s),
						  (A = O * O * o + i),
						  (E = F * O * o + R * s),
						  (w = R * F * o + O * s),
						  (T = O * F * o - R * s),
						  (S = F * F * o + i),
						  (t[0] = u * b + f * _ + v * M),
						  (t[1] = c * b + m * _ + g * M),
						  (t[2] = h * b + d * _ + y * M),
						  (t[3] = l * b + p * _ + x * M),
						  (t[4] = u * $ + f * A + v * E),
						  (t[5] = c * $ + m * A + g * E),
						  (t[6] = h * $ + d * A + y * E),
						  (t[7] = l * $ + p * A + x * E),
						  (t[8] = u * w + f * T + v * S),
						  (t[9] = c * w + m * T + g * S),
						  (t[10] = h * w + d * T + y * S),
						  (t[11] = l * w + p * T + x * S),
						  e !== t && ((t[12] = e[12]), (t[13] = e[13]), (t[14] = e[14]), (t[15] = e[15])),
						  t)
				}
				function y(t, e, n) {
					var r = Math.sin(n),
						a = Math.cos(n),
						s = e[4],
						i = e[5],
						o = e[6],
						u = e[7],
						c = e[8],
						h = e[9],
						l = e[10],
						f = e[11]
					return (
						e !== t &&
							((t[0] = e[0]),
							(t[1] = e[1]),
							(t[2] = e[2]),
							(t[3] = e[3]),
							(t[12] = e[12]),
							(t[13] = e[13]),
							(t[14] = e[14]),
							(t[15] = e[15])),
						(t[4] = s * a + c * r),
						(t[5] = i * a + h * r),
						(t[6] = o * a + l * r),
						(t[7] = u * a + f * r),
						(t[8] = c * a - s * r),
						(t[9] = h * a - i * r),
						(t[10] = l * a - o * r),
						(t[11] = f * a - u * r),
						t
					)
				}
				function x(t, e, n) {
					var r = Math.sin(n),
						a = Math.cos(n),
						s = e[0],
						i = e[1],
						o = e[2],
						u = e[3],
						c = e[8],
						h = e[9],
						l = e[10],
						f = e[11]
					return (
						e !== t &&
							((t[4] = e[4]),
							(t[5] = e[5]),
							(t[6] = e[6]),
							(t[7] = e[7]),
							(t[12] = e[12]),
							(t[13] = e[13]),
							(t[14] = e[14]),
							(t[15] = e[15])),
						(t[0] = s * a - c * r),
						(t[1] = i * a - h * r),
						(t[2] = o * a - l * r),
						(t[3] = u * a - f * r),
						(t[8] = s * r + c * a),
						(t[9] = i * r + h * a),
						(t[10] = o * r + l * a),
						(t[11] = u * r + f * a),
						t
					)
				}
				function b(t, e, n) {
					var r = Math.sin(n),
						a = Math.cos(n),
						s = e[0],
						i = e[1],
						o = e[2],
						u = e[3],
						c = e[4],
						h = e[5],
						l = e[6],
						f = e[7]
					return (
						e !== t &&
							((t[8] = e[8]),
							(t[9] = e[9]),
							(t[10] = e[10]),
							(t[11] = e[11]),
							(t[12] = e[12]),
							(t[13] = e[13]),
							(t[14] = e[14]),
							(t[15] = e[15])),
						(t[0] = s * a + c * r),
						(t[1] = i * a + h * r),
						(t[2] = o * a + l * r),
						(t[3] = u * a + f * r),
						(t[4] = c * a - s * r),
						(t[5] = h * a - i * r),
						(t[6] = l * a - o * r),
						(t[7] = f * a - u * r),
						t
					)
				}
				function _(t, e) {
					return (
						(t[0] = 1),
						(t[1] = 0),
						(t[2] = 0),
						(t[3] = 0),
						(t[4] = 0),
						(t[5] = 1),
						(t[6] = 0),
						(t[7] = 0),
						(t[8] = 0),
						(t[9] = 0),
						(t[10] = 1),
						(t[11] = 0),
						(t[12] = e[0]),
						(t[13] = e[1]),
						(t[14] = e[2]),
						(t[15] = 1),
						t
					)
				}
				function M(t, e) {
					return (
						(t[0] = e[0]),
						(t[1] = 0),
						(t[2] = 0),
						(t[3] = 0),
						(t[4] = 0),
						(t[5] = e[1]),
						(t[6] = 0),
						(t[7] = 0),
						(t[8] = 0),
						(t[9] = 0),
						(t[10] = e[2]),
						(t[11] = 0),
						(t[12] = 0),
						(t[13] = 0),
						(t[14] = 0),
						(t[15] = 1),
						t
					)
				}
				function $(t, e, n) {
					var a,
						s,
						i,
						o = n[0],
						u = n[1],
						c = n[2],
						h = Math.hypot(o, u, c)
					return h < r.EPSILON
						? null
						: ((o *= h = 1 / h),
						  (u *= h),
						  (c *= h),
						  (a = Math.sin(e)),
						  (i = 1 - (s = Math.cos(e))),
						  (t[0] = o * o * i + s),
						  (t[1] = u * o * i + c * a),
						  (t[2] = c * o * i - u * a),
						  (t[3] = 0),
						  (t[4] = o * u * i - c * a),
						  (t[5] = u * u * i + s),
						  (t[6] = c * u * i + o * a),
						  (t[7] = 0),
						  (t[8] = o * c * i + u * a),
						  (t[9] = u * c * i - o * a),
						  (t[10] = c * c * i + s),
						  (t[11] = 0),
						  (t[12] = 0),
						  (t[13] = 0),
						  (t[14] = 0),
						  (t[15] = 1),
						  t)
				}
				function A(t, e) {
					var n = Math.sin(e),
						r = Math.cos(e)
					return (
						(t[0] = 1),
						(t[1] = 0),
						(t[2] = 0),
						(t[3] = 0),
						(t[4] = 0),
						(t[5] = r),
						(t[6] = n),
						(t[7] = 0),
						(t[8] = 0),
						(t[9] = -n),
						(t[10] = r),
						(t[11] = 0),
						(t[12] = 0),
						(t[13] = 0),
						(t[14] = 0),
						(t[15] = 1),
						t
					)
				}
				function E(t, e) {
					var n = Math.sin(e),
						r = Math.cos(e)
					return (
						(t[0] = r),
						(t[1] = 0),
						(t[2] = -n),
						(t[3] = 0),
						(t[4] = 0),
						(t[5] = 1),
						(t[6] = 0),
						(t[7] = 0),
						(t[8] = n),
						(t[9] = 0),
						(t[10] = r),
						(t[11] = 0),
						(t[12] = 0),
						(t[13] = 0),
						(t[14] = 0),
						(t[15] = 1),
						t
					)
				}
				function w(t, e) {
					var n = Math.sin(e),
						r = Math.cos(e)
					return (
						(t[0] = r),
						(t[1] = n),
						(t[2] = 0),
						(t[3] = 0),
						(t[4] = -n),
						(t[5] = r),
						(t[6] = 0),
						(t[7] = 0),
						(t[8] = 0),
						(t[9] = 0),
						(t[10] = 1),
						(t[11] = 0),
						(t[12] = 0),
						(t[13] = 0),
						(t[14] = 0),
						(t[15] = 1),
						t
					)
				}
				function T(t, e, n) {
					var r = e[0],
						a = e[1],
						s = e[2],
						i = e[3],
						o = r + r,
						u = a + a,
						c = s + s,
						h = r * o,
						l = r * u,
						f = r * c,
						m = a * u,
						d = a * c,
						p = s * c,
						v = i * o,
						g = i * u,
						y = i * c
					return (
						(t[0] = 1 - (m + p)),
						(t[1] = l + y),
						(t[2] = f - g),
						(t[3] = 0),
						(t[4] = l - y),
						(t[5] = 1 - (h + p)),
						(t[6] = d + v),
						(t[7] = 0),
						(t[8] = f + g),
						(t[9] = d - v),
						(t[10] = 1 - (h + m)),
						(t[11] = 0),
						(t[12] = n[0]),
						(t[13] = n[1]),
						(t[14] = n[2]),
						(t[15] = 1),
						t
					)
				}
				function S(t, e) {
					var n = new r.ARRAY_TYPE(3),
						a = -e[0],
						s = -e[1],
						i = -e[2],
						o = e[3],
						u = e[4],
						c = e[5],
						h = e[6],
						l = e[7],
						f = a * a + s * s + i * i + o * o
					return (
						f > 0
							? ((n[0] = (2 * (u * o + l * a + c * i - h * s)) / f),
							  (n[1] = (2 * (c * o + l * s + h * a - u * i)) / f),
							  (n[2] = (2 * (h * o + l * i + u * s - c * a)) / f))
							: ((n[0] = 2 * (u * o + l * a + c * i - h * s)),
							  (n[1] = 2 * (c * o + l * s + h * a - u * i)),
							  (n[2] = 2 * (h * o + l * i + u * s - c * a))),
						T(t, e, n),
						t
					)
				}
				function R(t, e) {
					return (t[0] = e[12]), (t[1] = e[13]), (t[2] = e[14]), t
				}
				function O(t, e) {
					var n = e[0],
						r = e[1],
						a = e[2],
						s = e[4],
						i = e[5],
						o = e[6],
						u = e[8],
						c = e[9],
						h = e[10]
					return (t[0] = Math.hypot(n, r, a)), (t[1] = Math.hypot(s, i, o)), (t[2] = Math.hypot(u, c, h)), t
				}
				function F(t, e) {
					var n = new r.ARRAY_TYPE(3)
					O(n, e)
					var a = 1 / n[0],
						s = 1 / n[1],
						i = 1 / n[2],
						o = e[0] * a,
						u = e[1] * s,
						c = e[2] * i,
						h = e[4] * a,
						l = e[5] * s,
						f = e[6] * i,
						m = e[8] * a,
						d = e[9] * s,
						p = e[10] * i,
						v = o + l + p,
						g = 0
					return (
						v > 0
							? ((g = 2 * Math.sqrt(v + 1)),
							  (t[3] = 0.25 * g),
							  (t[0] = (f - d) / g),
							  (t[1] = (m - c) / g),
							  (t[2] = (u - h) / g))
							: o > l && o > p
							? ((g = 2 * Math.sqrt(1 + o - l - p)),
							  (t[3] = (f - d) / g),
							  (t[0] = 0.25 * g),
							  (t[1] = (u + h) / g),
							  (t[2] = (m + c) / g))
							: l > p
							? ((g = 2 * Math.sqrt(1 + l - o - p)),
							  (t[3] = (m - c) / g),
							  (t[0] = (u + h) / g),
							  (t[1] = 0.25 * g),
							  (t[2] = (f + d) / g))
							: ((g = 2 * Math.sqrt(1 + p - o - l)),
							  (t[3] = (u - h) / g),
							  (t[0] = (m + c) / g),
							  (t[1] = (f + d) / g),
							  (t[2] = 0.25 * g)),
						t
					)
				}
				function I(t, e, n, r) {
					var a = e[0],
						s = e[1],
						i = e[2],
						o = e[3],
						u = a + a,
						c = s + s,
						h = i + i,
						l = a * u,
						f = a * c,
						m = a * h,
						d = s * c,
						p = s * h,
						v = i * h,
						g = o * u,
						y = o * c,
						x = o * h,
						b = r[0],
						_ = r[1],
						M = r[2]
					return (
						(t[0] = (1 - (d + v)) * b),
						(t[1] = (f + x) * b),
						(t[2] = (m - y) * b),
						(t[3] = 0),
						(t[4] = (f - x) * _),
						(t[5] = (1 - (l + v)) * _),
						(t[6] = (p + g) * _),
						(t[7] = 0),
						(t[8] = (m + y) * M),
						(t[9] = (p - g) * M),
						(t[10] = (1 - (l + d)) * M),
						(t[11] = 0),
						(t[12] = n[0]),
						(t[13] = n[1]),
						(t[14] = n[2]),
						(t[15] = 1),
						t
					)
				}
				function P(t, e, n, r, a) {
					var s = e[0],
						i = e[1],
						o = e[2],
						u = e[3],
						c = s + s,
						h = i + i,
						l = o + o,
						f = s * c,
						m = s * h,
						d = s * l,
						p = i * h,
						v = i * l,
						g = o * l,
						y = u * c,
						x = u * h,
						b = u * l,
						_ = r[0],
						M = r[1],
						$ = r[2],
						A = a[0],
						E = a[1],
						w = a[2],
						T = (1 - (p + g)) * _,
						S = (m + b) * _,
						R = (d - x) * _,
						O = (m - b) * M,
						F = (1 - (f + g)) * M,
						I = (v + y) * M,
						P = (d + x) * $,
						C = (v - y) * $,
						z = (1 - (f + p)) * $
					return (
						(t[0] = T),
						(t[1] = S),
						(t[2] = R),
						(t[3] = 0),
						(t[4] = O),
						(t[5] = F),
						(t[6] = I),
						(t[7] = 0),
						(t[8] = P),
						(t[9] = C),
						(t[10] = z),
						(t[11] = 0),
						(t[12] = n[0] + A - (T * A + O * E + P * w)),
						(t[13] = n[1] + E - (S * A + F * E + C * w)),
						(t[14] = n[2] + w - (R * A + I * E + z * w)),
						(t[15] = 1),
						t
					)
				}
				function C(t, e) {
					var n = e[0],
						r = e[1],
						a = e[2],
						s = e[3],
						i = n + n,
						o = r + r,
						u = a + a,
						c = n * i,
						h = r * i,
						l = r * o,
						f = a * i,
						m = a * o,
						d = a * u,
						p = s * i,
						v = s * o,
						g = s * u
					return (
						(t[0] = 1 - l - d),
						(t[1] = h + g),
						(t[2] = f - v),
						(t[3] = 0),
						(t[4] = h - g),
						(t[5] = 1 - c - d),
						(t[6] = m + p),
						(t[7] = 0),
						(t[8] = f + v),
						(t[9] = m - p),
						(t[10] = 1 - c - l),
						(t[11] = 0),
						(t[12] = 0),
						(t[13] = 0),
						(t[14] = 0),
						(t[15] = 1),
						t
					)
				}
				function z(t, e, n, r, a, s, i) {
					var o = 1 / (n - e),
						u = 1 / (a - r),
						c = 1 / (s - i)
					return (
						(t[0] = 2 * s * o),
						(t[1] = 0),
						(t[2] = 0),
						(t[3] = 0),
						(t[4] = 0),
						(t[5] = 2 * s * u),
						(t[6] = 0),
						(t[7] = 0),
						(t[8] = (n + e) * o),
						(t[9] = (a + r) * u),
						(t[10] = (i + s) * c),
						(t[11] = -1),
						(t[12] = 0),
						(t[13] = 0),
						(t[14] = i * s * 2 * c),
						(t[15] = 0),
						t
					)
				}
				function D(t, e, n, r, a) {
					var s,
						i = 1 / Math.tan(e / 2)
					return (
						(t[0] = i / n),
						(t[1] = 0),
						(t[2] = 0),
						(t[3] = 0),
						(t[4] = 0),
						(t[5] = i),
						(t[6] = 0),
						(t[7] = 0),
						(t[8] = 0),
						(t[9] = 0),
						(t[11] = -1),
						(t[12] = 0),
						(t[13] = 0),
						(t[15] = 0),
						null != a && a !== 1 / 0
							? ((s = 1 / (r - a)), (t[10] = (a + r) * s), (t[14] = 2 * a * r * s))
							: ((t[10] = -1), (t[14] = -2 * r)),
						t
					)
				}
				var k = D
				function N(t, e, n, r, a) {
					var s,
						i = 1 / Math.tan(e / 2)
					return (
						(t[0] = i / n),
						(t[1] = 0),
						(t[2] = 0),
						(t[3] = 0),
						(t[4] = 0),
						(t[5] = i),
						(t[6] = 0),
						(t[7] = 0),
						(t[8] = 0),
						(t[9] = 0),
						(t[11] = -1),
						(t[12] = 0),
						(t[13] = 0),
						(t[15] = 0),
						null != a && a !== 1 / 0
							? ((s = 1 / (r - a)), (t[10] = a * s), (t[14] = a * r * s))
							: ((t[10] = -1), (t[14] = -r)),
						t
					)
				}
				function L(t, e, n, r) {
					var a = Math.tan((e.upDegrees * Math.PI) / 180),
						s = Math.tan((e.downDegrees * Math.PI) / 180),
						i = Math.tan((e.leftDegrees * Math.PI) / 180),
						o = Math.tan((e.rightDegrees * Math.PI) / 180),
						u = 2 / (i + o),
						c = 2 / (a + s)
					return (
						(t[0] = u),
						(t[1] = 0),
						(t[2] = 0),
						(t[3] = 0),
						(t[4] = 0),
						(t[5] = c),
						(t[6] = 0),
						(t[7] = 0),
						(t[8] = -(i - o) * u * 0.5),
						(t[9] = (a - s) * c * 0.5),
						(t[10] = r / (n - r)),
						(t[11] = -1),
						(t[12] = 0),
						(t[13] = 0),
						(t[14] = (r * n) / (n - r)),
						(t[15] = 0),
						t
					)
				}
				function U(t, e, n, r, a, s, i) {
					var o = 1 / (e - n),
						u = 1 / (r - a),
						c = 1 / (s - i)
					return (
						(t[0] = -2 * o),
						(t[1] = 0),
						(t[2] = 0),
						(t[3] = 0),
						(t[4] = 0),
						(t[5] = -2 * u),
						(t[6] = 0),
						(t[7] = 0),
						(t[8] = 0),
						(t[9] = 0),
						(t[10] = 2 * c),
						(t[11] = 0),
						(t[12] = (e + n) * o),
						(t[13] = (a + r) * u),
						(t[14] = (i + s) * c),
						(t[15] = 1),
						t
					)
				}
				var B = U
				function q(t, e, n, r, a, s, i) {
					var o = 1 / (e - n),
						u = 1 / (r - a),
						c = 1 / (s - i)
					return (
						(t[0] = -2 * o),
						(t[1] = 0),
						(t[2] = 0),
						(t[3] = 0),
						(t[4] = 0),
						(t[5] = -2 * u),
						(t[6] = 0),
						(t[7] = 0),
						(t[8] = 0),
						(t[9] = 0),
						(t[10] = c),
						(t[11] = 0),
						(t[12] = (e + n) * o),
						(t[13] = (a + r) * u),
						(t[14] = s * c),
						(t[15] = 1),
						t
					)
				}
				function Y(t, e, n, a) {
					var s,
						i,
						o,
						u,
						h,
						l,
						f,
						m,
						d,
						p,
						v = e[0],
						g = e[1],
						y = e[2],
						x = a[0],
						b = a[1],
						_ = a[2],
						M = n[0],
						$ = n[1],
						A = n[2]
					return Math.abs(v - M) < r.EPSILON && Math.abs(g - $) < r.EPSILON && Math.abs(y - A) < r.EPSILON
						? c(t)
						: ((f = v - M),
						  (m = g - $),
						  (d = y - A),
						  (s = b * (d *= p = 1 / Math.hypot(f, m, d)) - _ * (m *= p)),
						  (i = _ * (f *= p) - x * d),
						  (o = x * m - b * f),
						  (p = Math.hypot(s, i, o)) ? ((s *= p = 1 / p), (i *= p), (o *= p)) : ((s = 0), (i = 0), (o = 0)),
						  (u = m * o - d * i),
						  (h = d * s - f * o),
						  (l = f * i - m * s),
						  (p = Math.hypot(u, h, l)) ? ((u *= p = 1 / p), (h *= p), (l *= p)) : ((u = 0), (h = 0), (l = 0)),
						  (t[0] = s),
						  (t[1] = u),
						  (t[2] = f),
						  (t[3] = 0),
						  (t[4] = i),
						  (t[5] = h),
						  (t[6] = m),
						  (t[7] = 0),
						  (t[8] = o),
						  (t[9] = l),
						  (t[10] = d),
						  (t[11] = 0),
						  (t[12] = -(s * v + i * g + o * y)),
						  (t[13] = -(u * v + h * g + l * y)),
						  (t[14] = -(f * v + m * g + d * y)),
						  (t[15] = 1),
						  t)
				}
				function j(t, e, n, r) {
					var a = e[0],
						s = e[1],
						i = e[2],
						o = r[0],
						u = r[1],
						c = r[2],
						h = a - n[0],
						l = s - n[1],
						f = i - n[2],
						m = h * h + l * l + f * f
					m > 0 && ((h *= m = 1 / Math.sqrt(m)), (l *= m), (f *= m))
					var d = u * f - c * l,
						p = c * h - o * f,
						v = o * l - u * h
					return (
						(m = d * d + p * p + v * v) > 0 && ((d *= m = 1 / Math.sqrt(m)), (p *= m), (v *= m)),
						(t[0] = d),
						(t[1] = p),
						(t[2] = v),
						(t[3] = 0),
						(t[4] = l * v - f * p),
						(t[5] = f * d - h * v),
						(t[6] = h * p - l * d),
						(t[7] = 0),
						(t[8] = h),
						(t[9] = l),
						(t[10] = f),
						(t[11] = 0),
						(t[12] = a),
						(t[13] = s),
						(t[14] = i),
						(t[15] = 1),
						t
					)
				}
				function X(t) {
					return (
						"mat4(" +
						t[0] +
						", " +
						t[1] +
						", " +
						t[2] +
						", " +
						t[3] +
						", " +
						t[4] +
						", " +
						t[5] +
						", " +
						t[6] +
						", " +
						t[7] +
						", " +
						t[8] +
						", " +
						t[9] +
						", " +
						t[10] +
						", " +
						t[11] +
						", " +
						t[12] +
						", " +
						t[13] +
						", " +
						t[14] +
						", " +
						t[15] +
						")"
					)
				}
				function V(t) {
					return Math.hypot(
						t[0],
						t[1],
						t[2],
						t[3],
						t[4],
						t[5],
						t[6],
						t[7],
						t[8],
						t[9],
						t[10],
						t[11],
						t[12],
						t[13],
						t[14],
						t[15]
					)
				}
				function G(t, e, n) {
					return (
						(t[0] = e[0] + n[0]),
						(t[1] = e[1] + n[1]),
						(t[2] = e[2] + n[2]),
						(t[3] = e[3] + n[3]),
						(t[4] = e[4] + n[4]),
						(t[5] = e[5] + n[5]),
						(t[6] = e[6] + n[6]),
						(t[7] = e[7] + n[7]),
						(t[8] = e[8] + n[8]),
						(t[9] = e[9] + n[9]),
						(t[10] = e[10] + n[10]),
						(t[11] = e[11] + n[11]),
						(t[12] = e[12] + n[12]),
						(t[13] = e[13] + n[13]),
						(t[14] = e[14] + n[14]),
						(t[15] = e[15] + n[15]),
						t
					)
				}
				function H(t, e, n) {
					return (
						(t[0] = e[0] - n[0]),
						(t[1] = e[1] - n[1]),
						(t[2] = e[2] - n[2]),
						(t[3] = e[3] - n[3]),
						(t[4] = e[4] - n[4]),
						(t[5] = e[5] - n[5]),
						(t[6] = e[6] - n[6]),
						(t[7] = e[7] - n[7]),
						(t[8] = e[8] - n[8]),
						(t[9] = e[9] - n[9]),
						(t[10] = e[10] - n[10]),
						(t[11] = e[11] - n[11]),
						(t[12] = e[12] - n[12]),
						(t[13] = e[13] - n[13]),
						(t[14] = e[14] - n[14]),
						(t[15] = e[15] - n[15]),
						t
					)
				}
				function W(t, e, n) {
					return (
						(t[0] = e[0] * n),
						(t[1] = e[1] * n),
						(t[2] = e[2] * n),
						(t[3] = e[3] * n),
						(t[4] = e[4] * n),
						(t[5] = e[5] * n),
						(t[6] = e[6] * n),
						(t[7] = e[7] * n),
						(t[8] = e[8] * n),
						(t[9] = e[9] * n),
						(t[10] = e[10] * n),
						(t[11] = e[11] * n),
						(t[12] = e[12] * n),
						(t[13] = e[13] * n),
						(t[14] = e[14] * n),
						(t[15] = e[15] * n),
						t
					)
				}
				function Z(t, e, n, r) {
					return (
						(t[0] = e[0] + n[0] * r),
						(t[1] = e[1] + n[1] * r),
						(t[2] = e[2] + n[2] * r),
						(t[3] = e[3] + n[3] * r),
						(t[4] = e[4] + n[4] * r),
						(t[5] = e[5] + n[5] * r),
						(t[6] = e[6] + n[6] * r),
						(t[7] = e[7] + n[7] * r),
						(t[8] = e[8] + n[8] * r),
						(t[9] = e[9] + n[9] * r),
						(t[10] = e[10] + n[10] * r),
						(t[11] = e[11] + n[11] * r),
						(t[12] = e[12] + n[12] * r),
						(t[13] = e[13] + n[13] * r),
						(t[14] = e[14] + n[14] * r),
						(t[15] = e[15] + n[15] * r),
						t
					)
				}
				function K(t, e) {
					return (
						t[0] === e[0] &&
						t[1] === e[1] &&
						t[2] === e[2] &&
						t[3] === e[3] &&
						t[4] === e[4] &&
						t[5] === e[5] &&
						t[6] === e[6] &&
						t[7] === e[7] &&
						t[8] === e[8] &&
						t[9] === e[9] &&
						t[10] === e[10] &&
						t[11] === e[11] &&
						t[12] === e[12] &&
						t[13] === e[13] &&
						t[14] === e[14] &&
						t[15] === e[15]
					)
				}
				function Q(t, e) {
					var n = t[0],
						a = t[1],
						s = t[2],
						i = t[3],
						o = t[4],
						u = t[5],
						c = t[6],
						h = t[7],
						l = t[8],
						f = t[9],
						m = t[10],
						d = t[11],
						p = t[12],
						v = t[13],
						g = t[14],
						y = t[15],
						x = e[0],
						b = e[1],
						_ = e[2],
						M = e[3],
						$ = e[4],
						A = e[5],
						E = e[6],
						w = e[7],
						T = e[8],
						S = e[9],
						R = e[10],
						O = e[11],
						F = e[12],
						I = e[13],
						P = e[14],
						C = e[15]
					return (
						Math.abs(n - x) <= r.EPSILON * Math.max(1, Math.abs(n), Math.abs(x)) &&
						Math.abs(a - b) <= r.EPSILON * Math.max(1, Math.abs(a), Math.abs(b)) &&
						Math.abs(s - _) <= r.EPSILON * Math.max(1, Math.abs(s), Math.abs(_)) &&
						Math.abs(i - M) <= r.EPSILON * Math.max(1, Math.abs(i), Math.abs(M)) &&
						Math.abs(o - $) <= r.EPSILON * Math.max(1, Math.abs(o), Math.abs($)) &&
						Math.abs(u - A) <= r.EPSILON * Math.max(1, Math.abs(u), Math.abs(A)) &&
						Math.abs(c - E) <= r.EPSILON * Math.max(1, Math.abs(c), Math.abs(E)) &&
						Math.abs(h - w) <= r.EPSILON * Math.max(1, Math.abs(h), Math.abs(w)) &&
						Math.abs(l - T) <= r.EPSILON * Math.max(1, Math.abs(l), Math.abs(T)) &&
						Math.abs(f - S) <= r.EPSILON * Math.max(1, Math.abs(f), Math.abs(S)) &&
						Math.abs(m - R) <= r.EPSILON * Math.max(1, Math.abs(m), Math.abs(R)) &&
						Math.abs(d - O) <= r.EPSILON * Math.max(1, Math.abs(d), Math.abs(O)) &&
						Math.abs(p - F) <= r.EPSILON * Math.max(1, Math.abs(p), Math.abs(F)) &&
						Math.abs(v - I) <= r.EPSILON * Math.max(1, Math.abs(v), Math.abs(I)) &&
						Math.abs(g - P) <= r.EPSILON * Math.max(1, Math.abs(g), Math.abs(P)) &&
						Math.abs(y - C) <= r.EPSILON * Math.max(1, Math.abs(y), Math.abs(C))
					)
				}
				var J = d,
					tt = H
			},
			6867: (t, e, n) => {
				"use strict"
				n.r(e),
					n.d(e, {
						add: () => h,
						angle: () => L,
						bezier: () => F,
						ceil: () => d,
						clone: () => s,
						copy: () => u,
						create: () => a,
						cross: () => S,
						dist: () => H,
						distance: () => _,
						div: () => G,
						divide: () => m,
						dot: () => T,
						equals: () => Y,
						exactEquals: () => q,
						floor: () => p,
						forEach: () => Q,
						fromValues: () => o,
						hermite: () => O,
						inverse: () => E,
						len: () => Z,
						length: () => i,
						lerp: () => R,
						max: () => g,
						min: () => v,
						mul: () => V,
						multiply: () => f,
						negate: () => A,
						normalize: () => w,
						random: () => I,
						rotateX: () => D,
						rotateY: () => k,
						rotateZ: () => N,
						round: () => y,
						scale: () => x,
						scaleAndAdd: () => b,
						set: () => c,
						sqrDist: () => W,
						sqrLen: () => K,
						squaredDistance: () => M,
						squaredLength: () => $,
						str: () => B,
						sub: () => X,
						subtract: () => l,
						transformMat3: () => C,
						transformMat4: () => P,
						transformQuat: () => z,
						zero: () => U,
					})
				var r = n(3406)
				function a() {
					var t = new r.ARRAY_TYPE(3)
					return r.ARRAY_TYPE != Float32Array && ((t[0] = 0), (t[1] = 0), (t[2] = 0)), t
				}
				function s(t) {
					var e = new r.ARRAY_TYPE(3)
					return (e[0] = t[0]), (e[1] = t[1]), (e[2] = t[2]), e
				}
				function i(t) {
					var e = t[0],
						n = t[1],
						r = t[2]
					return Math.hypot(e, n, r)
				}
				function o(t, e, n) {
					var a = new r.ARRAY_TYPE(3)
					return (a[0] = t), (a[1] = e), (a[2] = n), a
				}
				function u(t, e) {
					return (t[0] = e[0]), (t[1] = e[1]), (t[2] = e[2]), t
				}
				function c(t, e, n, r) {
					return (t[0] = e), (t[1] = n), (t[2] = r), t
				}
				function h(t, e, n) {
					return (t[0] = e[0] + n[0]), (t[1] = e[1] + n[1]), (t[2] = e[2] + n[2]), t
				}
				function l(t, e, n) {
					return (t[0] = e[0] - n[0]), (t[1] = e[1] - n[1]), (t[2] = e[2] - n[2]), t
				}
				function f(t, e, n) {
					return (t[0] = e[0] * n[0]), (t[1] = e[1] * n[1]), (t[2] = e[2] * n[2]), t
				}
				function m(t, e, n) {
					return (t[0] = e[0] / n[0]), (t[1] = e[1] / n[1]), (t[2] = e[2] / n[2]), t
				}
				function d(t, e) {
					return (t[0] = Math.ceil(e[0])), (t[1] = Math.ceil(e[1])), (t[2] = Math.ceil(e[2])), t
				}
				function p(t, e) {
					return (t[0] = Math.floor(e[0])), (t[1] = Math.floor(e[1])), (t[2] = Math.floor(e[2])), t
				}
				function v(t, e, n) {
					return (t[0] = Math.min(e[0], n[0])), (t[1] = Math.min(e[1], n[1])), (t[2] = Math.min(e[2], n[2])), t
				}
				function g(t, e, n) {
					return (t[0] = Math.max(e[0], n[0])), (t[1] = Math.max(e[1], n[1])), (t[2] = Math.max(e[2], n[2])), t
				}
				function y(t, e) {
					return (t[0] = Math.round(e[0])), (t[1] = Math.round(e[1])), (t[2] = Math.round(e[2])), t
				}
				function x(t, e, n) {
					return (t[0] = e[0] * n), (t[1] = e[1] * n), (t[2] = e[2] * n), t
				}
				function b(t, e, n, r) {
					return (t[0] = e[0] + n[0] * r), (t[1] = e[1] + n[1] * r), (t[2] = e[2] + n[2] * r), t
				}
				function _(t, e) {
					var n = e[0] - t[0],
						r = e[1] - t[1],
						a = e[2] - t[2]
					return Math.hypot(n, r, a)
				}
				function M(t, e) {
					var n = e[0] - t[0],
						r = e[1] - t[1],
						a = e[2] - t[2]
					return n * n + r * r + a * a
				}
				function $(t) {
					var e = t[0],
						n = t[1],
						r = t[2]
					return e * e + n * n + r * r
				}
				function A(t, e) {
					return (t[0] = -e[0]), (t[1] = -e[1]), (t[2] = -e[2]), t
				}
				function E(t, e) {
					return (t[0] = 1 / e[0]), (t[1] = 1 / e[1]), (t[2] = 1 / e[2]), t
				}
				function w(t, e) {
					var n = e[0],
						r = e[1],
						a = e[2],
						s = n * n + r * r + a * a
					return s > 0 && (s = 1 / Math.sqrt(s)), (t[0] = e[0] * s), (t[1] = e[1] * s), (t[2] = e[2] * s), t
				}
				function T(t, e) {
					return t[0] * e[0] + t[1] * e[1] + t[2] * e[2]
				}
				function S(t, e, n) {
					var r = e[0],
						a = e[1],
						s = e[2],
						i = n[0],
						o = n[1],
						u = n[2]
					return (t[0] = a * u - s * o), (t[1] = s * i - r * u), (t[2] = r * o - a * i), t
				}
				function R(t, e, n, r) {
					var a = e[0],
						s = e[1],
						i = e[2]
					return (t[0] = a + r * (n[0] - a)), (t[1] = s + r * (n[1] - s)), (t[2] = i + r * (n[2] - i)), t
				}
				function O(t, e, n, r, a, s) {
					var i = s * s,
						o = i * (2 * s - 3) + 1,
						u = i * (s - 2) + s,
						c = i * (s - 1),
						h = i * (3 - 2 * s)
					return (
						(t[0] = e[0] * o + n[0] * u + r[0] * c + a[0] * h),
						(t[1] = e[1] * o + n[1] * u + r[1] * c + a[1] * h),
						(t[2] = e[2] * o + n[2] * u + r[2] * c + a[2] * h),
						t
					)
				}
				function F(t, e, n, r, a, s) {
					var i = 1 - s,
						o = i * i,
						u = s * s,
						c = o * i,
						h = 3 * s * o,
						l = 3 * u * i,
						f = u * s
					return (
						(t[0] = e[0] * c + n[0] * h + r[0] * l + a[0] * f),
						(t[1] = e[1] * c + n[1] * h + r[1] * l + a[1] * f),
						(t[2] = e[2] * c + n[2] * h + r[2] * l + a[2] * f),
						t
					)
				}
				function I(t, e) {
					e = e || 1
					var n = 2 * r.RANDOM() * Math.PI,
						a = 2 * r.RANDOM() - 1,
						s = Math.sqrt(1 - a * a) * e
					return (t[0] = Math.cos(n) * s), (t[1] = Math.sin(n) * s), (t[2] = a * e), t
				}
				function P(t, e, n) {
					var r = e[0],
						a = e[1],
						s = e[2],
						i = n[3] * r + n[7] * a + n[11] * s + n[15]
					return (
						(i = i || 1),
						(t[0] = (n[0] * r + n[4] * a + n[8] * s + n[12]) / i),
						(t[1] = (n[1] * r + n[5] * a + n[9] * s + n[13]) / i),
						(t[2] = (n[2] * r + n[6] * a + n[10] * s + n[14]) / i),
						t
					)
				}
				function C(t, e, n) {
					var r = e[0],
						a = e[1],
						s = e[2]
					return (
						(t[0] = r * n[0] + a * n[3] + s * n[6]),
						(t[1] = r * n[1] + a * n[4] + s * n[7]),
						(t[2] = r * n[2] + a * n[5] + s * n[8]),
						t
					)
				}
				function z(t, e, n) {
					var r = n[0],
						a = n[1],
						s = n[2],
						i = n[3],
						o = e[0],
						u = e[1],
						c = e[2],
						h = a * c - s * u,
						l = s * o - r * c,
						f = r * u - a * o,
						m = a * f - s * l,
						d = s * h - r * f,
						p = r * l - a * h,
						v = 2 * i
					return (
						(h *= v),
						(l *= v),
						(f *= v),
						(m *= 2),
						(d *= 2),
						(p *= 2),
						(t[0] = o + h + m),
						(t[1] = u + l + d),
						(t[2] = c + f + p),
						t
					)
				}
				function D(t, e, n, r) {
					var a = [],
						s = []
					return (
						(a[0] = e[0] - n[0]),
						(a[1] = e[1] - n[1]),
						(a[2] = e[2] - n[2]),
						(s[0] = a[0]),
						(s[1] = a[1] * Math.cos(r) - a[2] * Math.sin(r)),
						(s[2] = a[1] * Math.sin(r) + a[2] * Math.cos(r)),
						(t[0] = s[0] + n[0]),
						(t[1] = s[1] + n[1]),
						(t[2] = s[2] + n[2]),
						t
					)
				}
				function k(t, e, n, r) {
					var a = [],
						s = []
					return (
						(a[0] = e[0] - n[0]),
						(a[1] = e[1] - n[1]),
						(a[2] = e[2] - n[2]),
						(s[0] = a[2] * Math.sin(r) + a[0] * Math.cos(r)),
						(s[1] = a[1]),
						(s[2] = a[2] * Math.cos(r) - a[0] * Math.sin(r)),
						(t[0] = s[0] + n[0]),
						(t[1] = s[1] + n[1]),
						(t[2] = s[2] + n[2]),
						t
					)
				}
				function N(t, e, n, r) {
					var a = [],
						s = []
					return (
						(a[0] = e[0] - n[0]),
						(a[1] = e[1] - n[1]),
						(a[2] = e[2] - n[2]),
						(s[0] = a[0] * Math.cos(r) - a[1] * Math.sin(r)),
						(s[1] = a[0] * Math.sin(r) + a[1] * Math.cos(r)),
						(s[2] = a[2]),
						(t[0] = s[0] + n[0]),
						(t[1] = s[1] + n[1]),
						(t[2] = s[2] + n[2]),
						t
					)
				}
				function L(t, e) {
					var n = t[0],
						r = t[1],
						a = t[2],
						s = e[0],
						i = e[1],
						o = e[2],
						u = Math.sqrt(n * n + r * r + a * a) * Math.sqrt(s * s + i * i + o * o),
						c = u && T(t, e) / u
					return Math.acos(Math.min(Math.max(c, -1), 1))
				}
				function U(t) {
					return (t[0] = 0), (t[1] = 0), (t[2] = 0), t
				}
				function B(t) {
					return "vec3(" + t[0] + ", " + t[1] + ", " + t[2] + ")"
				}
				function q(t, e) {
					return t[0] === e[0] && t[1] === e[1] && t[2] === e[2]
				}
				function Y(t, e) {
					var n = t[0],
						a = t[1],
						s = t[2],
						i = e[0],
						o = e[1],
						u = e[2]
					return (
						Math.abs(n - i) <= r.EPSILON * Math.max(1, Math.abs(n), Math.abs(i)) &&
						Math.abs(a - o) <= r.EPSILON * Math.max(1, Math.abs(a), Math.abs(o)) &&
						Math.abs(s - u) <= r.EPSILON * Math.max(1, Math.abs(s), Math.abs(u))
					)
				}
				var j,
					X = l,
					V = f,
					G = m,
					H = _,
					W = M,
					Z = i,
					K = $,
					Q =
						((j = a()),
						function (t, e, n, r, a, s) {
							var i, o
							for (e || (e = 3), n || (n = 0), o = r ? Math.min(r * e + n, t.length) : t.length, i = n; i < o; i += e)
								(j[0] = t[i]),
									(j[1] = t[i + 1]),
									(j[2] = t[i + 2]),
									a(j, j, s),
									(t[i] = j[0]),
									(t[i + 1] = j[1]),
									(t[i + 2] = j[2])
							return t
						})
			},
			7691: function (t, e, n) {
				t.exports = (function (t, e) {
					"use strict"
					function n(t, e, n) {
						if (n || 2 === arguments.length)
							for (var r, a = 0, s = e.length; a < s; a++)
								(!r && a in e) || (r || (r = Array.prototype.slice.call(e, 0, a)), (r[a] = e[a]))
						return t.concat(r || Array.prototype.slice.call(e))
					}
					var r = Object.freeze({
							__proto__: null,
							blackman: function (t) {
								for (var e = new Float32Array(t), n = (2 * Math.PI) / (t - 1), r = 2 * n, a = 0; a < t / 2; a++)
									e[a] = 0.42 - 0.5 * Math.cos(a * n) + 0.08 * Math.cos(a * r)
								for (a = Math.ceil(t / 2); a > 0; a--) e[t - a] = e[a - 1]
								return e
							},
							hamming: function (t) {
								for (var e = new Float32Array(t), n = 0; n < t; n++)
									e[n] = 0.54 - 0.46 * Math.cos(2 * Math.PI * (n / t - 1))
								return e
							},
							hanning: function (t) {
								for (var e = new Float32Array(t), n = 0; n < t; n++)
									e[n] = 0.5 - 0.5 * Math.cos((2 * Math.PI * n) / (t - 1))
								return e
							},
							sine: function (t) {
								for (var e = Math.PI / (t - 1), n = new Float32Array(t), r = 0; r < t; r++) n[r] = Math.sin(e * r)
								return n
							},
						}),
						a = {}
					function s(t) {
						for (; t % 2 == 0 && t > 1; ) t /= 2
						return 1 === t
					}
					function i(t, e) {
						if ("rect" !== e) {
							if ((("" !== e && e) || (e = "hanning"), a[e] || (a[e] = {}), !a[e][t.length]))
								try {
									a[e][t.length] = r[e](t.length)
								} catch (t) {
									throw new Error("Invalid windowing function")
								}
							t = (function (t, e) {
								for (var n = [], r = 0; r < Math.min(t.length, e.length); r++) n[r] = t[r] * e[r]
								return n
							})(t, a[e][t.length])
						}
						return t
					}
					function o(t, e, n) {
						for (var r = new Float32Array(t), a = 0; a < r.length; a++)
							(r[a] = (a * e) / n), (r[a] = 13 * Math.atan(r[a] / 1315.8) + 3.5 * Math.atan(Math.pow(r[a] / 7518, 2)))
						return r
					}
					function u(t) {
						return Float32Array.from(t)
					}
					function c(t) {
						return 1125 * Math.log(1 + t / 700)
					}
					function h(t, e, n) {
						for (
							var r,
								a = new Float32Array(t + 2),
								s = new Float32Array(t + 2),
								i = e / 2,
								o = c(0),
								u = (c(i) - o) / (t + 1),
								h = new Array(t + 2),
								l = 0;
							l < a.length;
							l++
						)
							(a[l] = l * u),
								(s[l] = ((r = a[l]), 700 * (Math.exp(r / 1125) - 1))),
								(h[l] = Math.floor(((n + 1) * s[l]) / e))
						for (var f = new Array(t), m = 0; m < f.length; m++) {
							for (f[m] = new Array(n / 2 + 1).fill(0), l = h[m]; l < h[m + 1]; l++)
								f[m][l] = (l - h[m]) / (h[m + 1] - h[m])
							for (l = h[m + 1]; l < h[m + 2]; l++) f[m][l] = (h[m + 2] - l) / (h[m + 2] - h[m + 1])
						}
						return f
					}
					function l(t, e, r, a, s, i, o) {
						void 0 === a && (a = 5), void 0 === s && (s = 2), void 0 === i && (i = !0), void 0 === o && (o = 440)
						var u = Math.floor(r / 2) + 1,
							c = new Array(r).fill(0).map(function (n, a) {
								return (
									t *
									(function (t, e) {
										return Math.log2((16 * t) / e)
									})((e * a) / r, o)
								)
							})
						c[0] = c[1] - 1.5 * t
						var h,
							l,
							f,
							m = c
								.slice(1)
								.map(function (t, e) {
									return Math.max(t - c[e])
								}, 1)
								.concat([1]),
							d = Math.round(t / 2),
							p = new Array(t).fill(0).map(function (e, n) {
								return c.map(function (e) {
									return ((10 * t + d + e - n) % t) - d
								})
							}),
							v = p.map(function (t, e) {
								return t.map(function (t, n) {
									return Math.exp(-0.5 * Math.pow((2 * p[e][n]) / m[n], 2))
								})
							})
						if (
							((l = (h = v)[0].map(function () {
								return 0
							})),
							(f = h
								.reduce(function (t, e) {
									return (
										e.forEach(function (e, n) {
											t[n] += Math.pow(e, 2)
										}),
										t
									)
								}, l)
								.map(Math.sqrt)),
							(v = h.map(function (t, e) {
								return t.map(function (t, e) {
									return t / (f[e] || 1)
								})
							})),
							s)
						) {
							var g = c.map(function (e) {
								return Math.exp(-0.5 * Math.pow((e / t - a) / s, 2))
							})
							v = v.map(function (t) {
								return t.map(function (t, e) {
									return t * g[e]
								})
							})
						}
						return (
							i && (v = n(n([], v.slice(3), !0), v.slice(0, 3), !0)),
							v.map(function (t) {
								return t.slice(0, u)
							})
						)
					}
					function f(t, e) {
						for (var n = 0, r = 0, a = 0; a < e.length; a++) (n += Math.pow(a, t) * Math.abs(e[a])), (r += e[a])
						return n / r
					}
					function m(t) {
						var e = t.ampSpectrum,
							n = t.barkScale,
							r = t.numberOfBarkBands,
							a = void 0 === r ? 24 : r
						if ("object" != typeof e || "object" != typeof n) throw new TypeError()
						var s = a,
							i = new Float32Array(s),
							o = 0,
							u = e,
							c = new Int32Array(s + 1)
						c[0] = 0
						for (var h = n[u.length - 1] / s, l = 1, f = 0; f < u.length; f++)
							for (; n[f] > h; ) (c[l++] = f), (h = (l * n[u.length - 1]) / s)
						for (c[s] = u.length - 1, f = 0; f < s; f++) {
							for (var m = 0, d = c[f]; d < c[f + 1]; d++) m += u[d]
							i[f] = Math.pow(m, 0.23)
						}
						for (f = 0; f < i.length; f++) o += i[f]
						return { specific: i, total: o }
					}
					function d(t) {
						var e = t.ampSpectrum
						if ("object" != typeof e) throw new TypeError()
						for (var n = new Float32Array(e.length), r = 0; r < n.length; r++) n[r] = Math.pow(e[r], 2)
						return n
					}
					function p(t) {
						var e = t.ampSpectrum,
							n = t.melFilterBank,
							r = t.bufferSize
						if ("object" != typeof e) throw new TypeError("Valid ampSpectrum is required to generate melBands")
						if ("object" != typeof n) throw new TypeError("Valid melFilterBank is required to generate melBands")
						for (
							var a = d({ ampSpectrum: e }), s = n.length, i = Array(s), o = new Float32Array(s), u = 0;
							u < o.length;
							u++
						) {
							;(i[u] = new Float32Array(r / 2)), (o[u] = 0)
							for (var c = 0; c < r / 2; c++) (i[u][c] = n[u][c] * a[c]), (o[u] += i[u][c])
							o[u] = Math.log(o[u] + 1)
						}
						return Array.prototype.slice.call(o)
					}
					var v = Object.freeze({
							__proto__: null,
							amplitudeSpectrum: function (t) {
								return t.ampSpectrum
							},
							buffer: function (t) {
								return t.signal
							},
							chroma: function (t) {
								var e = t.ampSpectrum,
									n = t.chromaFilterBank
								if ("object" != typeof e) throw new TypeError("Valid ampSpectrum is required to generate chroma")
								if ("object" != typeof n) throw new TypeError("Valid chromaFilterBank is required to generate chroma")
								var r = n.map(function (t, n) {
										return e.reduce(function (e, n, r) {
											return e + n * t[r]
										}, 0)
									}),
									a = Math.max.apply(Math, r)
								return a
									? r.map(function (t) {
											return t / a
									  })
									: r
							},
							complexSpectrum: function (t) {
								return t.complexSpectrum
							},
							energy: function (t) {
								var e = t.signal
								if ("object" != typeof e) throw new TypeError()
								for (var n = 0, r = 0; r < e.length; r++) n += Math.pow(Math.abs(e[r]), 2)
								return n
							},
							loudness: m,
							melBands: p,
							mfcc: function (e) {
								var n = e.ampSpectrum,
									r = e.melFilterBank,
									a = e.numberOfMFCCCoefficients,
									s = e.bufferSize,
									i = Math.min(40, Math.max(1, a || 13))
								if (r.length < i) throw new Error("Insufficient filter bank for requested number of coefficients")
								var o = p({ ampSpectrum: n, melFilterBank: r, bufferSize: s })
								return t(o).slice(0, i)
							},
							perceptualSharpness: function (t) {
								for (
									var e = m({ ampSpectrum: t.ampSpectrum, barkScale: t.barkScale }), n = e.specific, r = 0, a = 0;
									a < n.length;
									a++
								)
									r += a < 15 ? (a + 1) * n[a + 1] : 0.066 * Math.exp(0.171 * (a + 1))
								return r * (0.11 / e.total)
							},
							perceptualSpread: function (t) {
								for (
									var e = m({ ampSpectrum: t.ampSpectrum, barkScale: t.barkScale }), n = 0, r = 0;
									r < e.specific.length;
									r++
								)
									e.specific[r] > n && (n = e.specific[r])
								return Math.pow((e.total - n) / e.total, 2)
							},
							powerSpectrum: d,
							rms: function (t) {
								var e = t.signal
								if ("object" != typeof e) throw new TypeError()
								for (var n = 0, r = 0; r < e.length; r++) n += Math.pow(e[r], 2)
								return (n /= e.length), Math.sqrt(n)
							},
							spectralCentroid: function (t) {
								var e = t.ampSpectrum
								if ("object" != typeof e) throw new TypeError()
								return f(1, e)
							},
							spectralCrest: function (t) {
								var e = t.ampSpectrum
								if ("object" != typeof e) throw new TypeError()
								var n = 0,
									r = -1 / 0
								return (
									e.forEach(function (t) {
										;(n += Math.pow(t, 2)), (r = t > r ? t : r)
									}),
									(n /= e.length),
									(n = Math.sqrt(n)),
									r / n
								)
							},
							spectralFlatness: function (t) {
								var e = t.ampSpectrum
								if ("object" != typeof e) throw new TypeError()
								for (var n = 0, r = 0, a = 0; a < e.length; a++) (n += Math.log(e[a])), (r += e[a])
								return (Math.exp(n / e.length) * e.length) / r
							},
							spectralFlux: function (t) {
								var e = t.signal,
									n = t.previousSignal,
									r = t.bufferSize
								if ("object" != typeof e || "object" != typeof n) throw new TypeError()
								for (var a = 0, s = -r / 2; s < e.length / 2 - 1; s++)
									(x = Math.abs(e[s]) - Math.abs(n[s])), (a += (x + Math.abs(x)) / 2)
								return a
							},
							spectralKurtosis: function (t) {
								var e = t.ampSpectrum
								if ("object" != typeof e) throw new TypeError()
								var n = e,
									r = f(1, n),
									a = f(2, n),
									s = f(3, n),
									i = f(4, n)
								return (-3 * Math.pow(r, 4) + 6 * r * a - 4 * r * s + i) / Math.pow(Math.sqrt(a - Math.pow(r, 2)), 4)
							},
							spectralRolloff: function (t) {
								var e = t.ampSpectrum,
									n = t.sampleRate
								if ("object" != typeof e) throw new TypeError()
								for (var r = e, a = n / (2 * (r.length - 1)), s = 0, i = 0; i < r.length; i++) s += r[i]
								for (var o = 0.99 * s, u = r.length - 1; s > o && u >= 0; ) (s -= r[u]), --u
								return (u + 1) * a
							},
							spectralSkewness: function (t) {
								var e = t.ampSpectrum
								if ("object" != typeof e) throw new TypeError()
								var n = f(1, e),
									r = f(2, e),
									a = f(3, e)
								return (2 * Math.pow(n, 3) - 3 * n * r + a) / Math.pow(Math.sqrt(r - Math.pow(n, 2)), 3)
							},
							spectralSlope: function (t) {
								var e = t.ampSpectrum,
									n = t.sampleRate,
									r = t.bufferSize
								if ("object" != typeof e) throw new TypeError()
								for (var a = 0, s = 0, i = new Float32Array(e.length), o = 0, u = 0, c = 0; c < e.length; c++) {
									a += e[c]
									var h = (c * n) / r
									;(i[c] = h), (o += h * h), (s += h), (u += h * e[c])
								}
								return (e.length * u - s * a) / (a * (o - Math.pow(s, 2)))
							},
							spectralSpread: function (t) {
								var e = t.ampSpectrum
								if ("object" != typeof e) throw new TypeError()
								return Math.sqrt(f(2, e) - Math.pow(f(1, e), 2))
							},
							zcr: function (t) {
								var e = t.signal
								if ("object" != typeof e) throw new TypeError()
								for (var n = 0, r = 1; r < e.length; r++)
									((e[r - 1] >= 0 && e[r] < 0) || (e[r - 1] < 0 && e[r] >= 0)) && n++
								return n
							},
						}),
						g = (function () {
							function t(t, e) {
								var n = this
								if (((this._m = e), !t.audioContext)) throw this._m.errors.noAC
								if (t.bufferSize && !s(t.bufferSize)) throw this._m._errors.notPow2
								if (!t.source) throw this._m._errors.noSource
								;(this._m.audioContext = t.audioContext),
									(this._m.bufferSize = t.bufferSize || this._m.bufferSize || 256),
									(this._m.hopSize = t.hopSize || this._m.hopSize || this._m.bufferSize),
									(this._m.sampleRate = t.sampleRate || this._m.audioContext.sampleRate || 44100),
									(this._m.callback = t.callback),
									(this._m.windowingFunction = t.windowingFunction || "hanning"),
									(this._m.featureExtractors = v),
									(this._m.EXTRACTION_STARTED = t.startImmediately || !1),
									(this._m.channel = "number" == typeof t.channel ? t.channel : 0),
									(this._m.inputs = t.inputs || 1),
									(this._m.outputs = t.outputs || 1),
									(this._m.numberOfMFCCCoefficients =
										t.numberOfMFCCCoefficients || this._m.numberOfMFCCCoefficients || 13),
									(this._m.numberOfBarkBands = t.numberOfBarkBands || this._m.numberOfBarkBands || 24),
									(this._m.spn = this._m.audioContext.createScriptProcessor(
										this._m.bufferSize,
										this._m.inputs,
										this._m.outputs
									)),
									this._m.spn.connect(this._m.audioContext.destination),
									(this._m._featuresToExtract = t.featureExtractors || []),
									(this._m.barkScale = o(this._m.bufferSize, this._m.sampleRate, this._m.bufferSize)),
									(this._m.melFilterBank = h(
										Math.max(this._m.melBands, this._m.numberOfMFCCCoefficients),
										this._m.sampleRate,
										this._m.bufferSize
									)),
									(this._m.inputData = null),
									(this._m.previousInputData = null),
									(this._m.frame = null),
									(this._m.previousFrame = null),
									this.setSource(t.source),
									(this._m.spn.onaudioprocess = function (t) {
										var e
										null !== n._m.inputData && (n._m.previousInputData = n._m.inputData),
											(n._m.inputData = t.inputBuffer.getChannelData(n._m.channel)),
											n._m.previousInputData
												? ((e = new Float32Array(
														n._m.previousInputData.length + n._m.inputData.length - n._m.hopSize
												  )).set(n._m.previousInputData.slice(n._m.hopSize)),
												  e.set(n._m.inputData, n._m.previousInputData.length - n._m.hopSize))
												: (e = n._m.inputData)
										var r = (function (t, e, n) {
											if (t.length < e) throw new Error("Buffer is too short for frame length")
											if (n < 1) throw new Error("Hop length cannot be less that 1")
											if (e < 1) throw new Error("Frame length cannot be less that 1")
											var r = 1 + Math.floor((t.length - e) / n)
											return new Array(r).fill(0).map(function (r, a) {
												return t.slice(a * n, a * n + e)
											})
										})(e, n._m.bufferSize, n._m.hopSize)
										r.forEach(function (t) {
											n._m.frame = t
											var e = n._m.extract(n._m._featuresToExtract, n._m.frame, n._m.previousFrame)
											"function" == typeof n._m.callback && n._m.EXTRACTION_STARTED && n._m.callback(e),
												(n._m.previousFrame = n._m.frame)
										})
									})
							}
							return (
								(t.prototype.start = function (t) {
									;(this._m._featuresToExtract = t || this._m._featuresToExtract), (this._m.EXTRACTION_STARTED = !0)
								}),
								(t.prototype.stop = function () {
									this._m.EXTRACTION_STARTED = !1
								}),
								(t.prototype.setSource = function (t) {
									this._m.source && this._m.source.disconnect(this._m.spn),
										(this._m.source = t),
										this._m.source.connect(this._m.spn)
								}),
								(t.prototype.setChannel = function (t) {
									t <= this._m.inputs
										? (this._m.channel = t)
										: console.error(
												"Channel "
													.concat(
														t,
														" does not exist. Make sure you've provided a value for 'inputs' that is greater than "
													)
													.concat(t, " when instantiating the MeydaAnalyzer")
										  )
								}),
								(t.prototype.get = function (t) {
									return this._m.inputData
										? this._m.extract(t || this._m._featuresToExtract, this._m.inputData, this._m.previousInputData)
										: null
								}),
								t
							)
						})(),
						y = {
							audioContext: null,
							spn: null,
							bufferSize: 512,
							sampleRate: 44100,
							melBands: 26,
							chromaBands: 12,
							callback: null,
							windowingFunction: "hanning",
							featureExtractors: v,
							EXTRACTION_STARTED: !1,
							numberOfMFCCCoefficients: 13,
							numberOfBarkBands: 24,
							_featuresToExtract: [],
							windowing: i,
							_errors: {
								notPow2: new Error("Meyda: Buffer size must be a power of 2, e.g. 64 or 512"),
								featureUndef: new Error("Meyda: No features defined."),
								invalidFeatureFmt: new Error("Meyda: Invalid feature format"),
								invalidInput: new Error("Meyda: Invalid input."),
								noAC: new Error("Meyda: No AudioContext specified."),
								noSource: new Error("Meyda: No source node specified."),
							},
							createMeydaAnalyzer: function (t) {
								return new g(t, Object.assign({}, y))
							},
							listAvailableFeatureExtractors: function () {
								return Object.keys(this.featureExtractors)
							},
							extract: function (t, e, n) {
								var r = this
								if (!e) throw this._errors.invalidInput
								if ("object" != typeof e) throw this._errors.invalidInput
								if (!t) throw this._errors.featureUndef
								if (!s(e.length)) throw this._errors.notPow2
								;(void 0 !== this.barkScale && this.barkScale.length == this.bufferSize) ||
									(this.barkScale = o(this.bufferSize, this.sampleRate, this.bufferSize)),
									(void 0 !== this.melFilterBank &&
										this.barkScale.length == this.bufferSize &&
										this.melFilterBank.length == this.melBands) ||
										(this.melFilterBank = h(
											Math.max(this.melBands, this.numberOfMFCCCoefficients),
											this.sampleRate,
											this.bufferSize
										)),
									(void 0 !== this.chromaFilterBank && this.chromaFilterBank.length == this.chromaBands) ||
										(this.chromaFilterBank = l(this.chromaBands, this.sampleRate, this.bufferSize)),
									"buffer" in e && void 0 === e.buffer ? (this.signal = u(e)) : (this.signal = e)
								var a = b(e, this.windowingFunction, this.bufferSize)
								if (
									((this.signal = a.windowedSignal),
									(this.complexSpectrum = a.complexSpectrum),
									(this.ampSpectrum = a.ampSpectrum),
									n)
								) {
									var i = b(n, this.windowingFunction, this.bufferSize)
									;(this.previousSignal = i.windowedSignal),
										(this.previousComplexSpectrum = i.complexSpectrum),
										(this.previousAmpSpectrum = i.ampSpectrum)
								}
								var c = function (t) {
									return r.featureExtractors[t]({
										ampSpectrum: r.ampSpectrum,
										chromaFilterBank: r.chromaFilterBank,
										complexSpectrum: r.complexSpectrum,
										signal: r.signal,
										bufferSize: r.bufferSize,
										sampleRate: r.sampleRate,
										barkScale: r.barkScale,
										melFilterBank: r.melFilterBank,
										previousSignal: r.previousSignal,
										previousAmpSpectrum: r.previousAmpSpectrum,
										previousComplexSpectrum: r.previousComplexSpectrum,
										numberOfMFCCCoefficients: r.numberOfMFCCCoefficients,
										numberOfBarkBands: r.numberOfBarkBands,
									})
								}
								if ("object" == typeof t)
									return t.reduce(function (t, e) {
										var n
										return Object.assign({}, t, (((n = {})[e] = c(e)), n))
									}, {})
								if ("string" == typeof t) return c(t)
								throw this._errors.invalidFeatureFmt
							},
						},
						b = function (t, n, r) {
							var a = {}
							void 0 === t.buffer ? (a.signal = u(t)) : (a.signal = t),
								(a.windowedSignal = i(a.signal, n)),
								(a.complexSpectrum = e.fft(a.windowedSignal)),
								(a.ampSpectrum = new Float32Array(r / 2))
							for (var s = 0; s < r / 2; s++)
								a.ampSpectrum[s] = Math.sqrt(
									Math.pow(a.complexSpectrum.real[s], 2) + Math.pow(a.complexSpectrum.imag[s], 2)
								)
							return a
						}
					return "undefined" != typeof window && (window.Meyda = y), y
				})(n(242), n(902))
			},
			1170: (t, e) => {
				"use strict"
				Object.defineProperty(e, "__esModule", { value: !0 }),
					(e.advanceAnimation = e.getActiveAnimations = e.pushAnimation = void 0)
				const n = {},
					r = (t, e, r = 0) =>
						void 0 === n[t] || void 0 === n[t][e] || n[t][e].length - r - 1 < 0 ? null : n[t][e][n[t][e].length - r - 1]
				;(e.pushAnimation = (t, e, a, s) => {
					var i
					const o = `${e}_${a}`
					n[t] || (n[t] = []),
						n[t][o] || (n[t][o] = []),
						(null === (i = r(t, o)) || void 0 === i ? void 0 : i.key) !== s &&
							(n[t][o].push({ key: s, elapsed: 0 }), n[t][o].slice(n[t][o].length - 2))
				}),
					(e.getActiveAnimations = (t, e) => {
						const r = `${t}_${e}`,
							a = {}
						return 0 === Object.keys(n).length
							? null
							: (Object.keys(n).forEach(t => {
									n[t][r] && (a[t] = n[t][r].slice(n[t][r].length - 2))
							  }),
							  a)
					}),
					(e.advanceAnimation = (t, e) => {
						Object.keys(n).forEach(a => {
							Object.keys(n[a]).forEach(n => {
								if (e && 0 !== n.indexOf(e)) return
								const s = r(a, n),
									i = r(a, n, 1)
								s && (s.elapsed += t), i && (i.elapsed += t)
							})
						})
					})
			},
			7421: (t, e, n) => {
				"use strict"
				Object.defineProperty(e, "__esModule", { value: !0 }), (e.applyToSkin = e.getAnimationTransforms = void 0)
				const r = n(3765),
					a = (t, e) => {
						if (1 === t.length)
							switch (t[0].type) {
								case "translation":
								case "scale":
								case "rotation":
									return t[0].transform
							}
						const n = (e / 1e3) % t[t.length - 1].time,
							a = ((t, e) => {
								let n = t[0],
									r = t[0]
								for (let a = 1; a < t.length && ((n = t[a]), !(n.time > e)); a++) r = t[a]
								return { previous: r, next: n }
							})(t, n),
							s = (n - a.previous.time) / (a.next.time - a.previous.time)
						switch (a.previous.type) {
							case "translation":
							case "scale": {
								const t = r.vec3.create()
								return r.vec3.lerp(t, a.previous.transform, a.next.transform, s), t
							}
							case "rotation": {
								const t = r.quat.create()
								return r.quat.slerp(t, a.previous.transform, a.next.transform, s), t
							}
						}
					},
					s = (t, e) => ({
						t: t && t.translation.length > 0 ? a(t.translation, e) : r.vec3.create(),
						r: t && t.rotation.length > 0 ? a(t.rotation, e) : r.quat.create(),
						s: t && t.scale.length > 0 ? a(t.scale, e) : r.vec3.fromValues(1, 1, 1),
					}),
					i = (t, e, n, a, s, o, u) => {
						const c = t.nodes[o],
							h = s.joints.indexOf(c.id)
						if ((void 0 !== n[c.id] && r.mat4.multiply(a, a, n[c.id]), u)) {
							const t = s.inverseBindTransforms[h]
							t && ((e[h] = r.mat4.create()), r.mat4.multiply(e[h], a, t))
						} else e[h] = a
						c.children.forEach(o => {
							i(t, e, n, r.mat4.clone(a), s, o, u)
						})
					}
				;(e.getAnimationTransforms = (t, e, n = 0) => {
					const a = {}
					return (
						Object.keys(e).forEach(i => {
							e[i].forEach(o => {
								const u = -(o.elapsed - n) / n
								Object.keys(t.animations[o.key]).forEach(n => {
									const c = s(t.animations[o.key][n], o.elapsed)
									e[i].forEach(e => {
										if (o.key == e.key || u <= 0) return
										const a = s(t.animations[e.key][n], e.elapsed)
										r.vec3.lerp(c.t, c.t, a.t, u), r.quat.slerp(c.r, c.r, a.r, u), r.vec3.lerp(c.s, c.s, a.s, u)
									})
									const h = r.mat4.create(),
										l = r.mat4.create()
									r.mat4.fromQuat(l, c.r),
										r.mat4.translate(h, h, c.t),
										r.mat4.multiply(h, h, l),
										r.mat4.scale(h, h, c.s),
										(a[n] = h)
								})
							})
						}),
						a
					)
				}),
					(e.applyToSkin = (t, e, n = !0) => {
						const a = []
						return (
							t.skins.forEach(s => {
								const o = t.rootNode
								i(t, a, e, r.mat4.create(), s, o, n)
							}),
							a
						)
					})
			},
			5785: function (t, e, n) {
				"use strict"
				var r =
					(this && this.__awaiter) ||
					function (t, e, n, r) {
						return new (n || (n = Promise))(function (a, s) {
							function i(t) {
								try {
									u(r.next(t))
								} catch (t) {
									s(t)
								}
							}
							function o(t) {
								try {
									u(r.throw(t))
								} catch (t) {
									s(t)
								}
							}
							function u(t) {
								var e
								t.done
									? a(t.value)
									: ((e = t.value),
									  e instanceof n
											? e
											: new n(function (t) {
													t(e)
											  })).then(i, o)
							}
							u((r = r.apply(t, e || [])).next())
						})
					}
				Object.defineProperty(e, "__esModule", { value: !0 }), (e.loadModel = e.dispose = e.BufferType = void 0)
				const a = n(3765),
					s = n(1850),
					i = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 }
				var o
				!(function (t) {
					;(t[(t.Float = 5126)] = "Float"), (t[(t.Short = 5123)] = "Short")
				})((o = e.BufferType || (e.BufferType = {})))
				const u = t => {
						const e = t.split(",")[1],
							n = atob(e),
							r = new ArrayBuffer(n.length),
							a = new Uint8Array(r)
						for (let t = 0; t < n.length; t++) a[t] = n.charCodeAt(t)
						const s = new Blob([a], { type: "application/octet-stream" })
						return URL.createObjectURL(s)
					},
					c = /(.*)data:(.*?)(;base64)?,(.*)$/,
					h = (t, e) =>
						r(void 0, void 0, void 0, function* () {
							return new Promise(n => {
								const r = new Image()
								;(r.onload = () => {
									const e = t.createTexture()
									t.bindTexture(t.TEXTURE_2D, e),
										t.texImage2D(t.TEXTURE_2D, 0, t.RGBA, t.RGBA, t.UNSIGNED_BYTE, r),
										t.texParameteri(t.TEXTURE_2D, t.TEXTURE_MIN_FILTER, t.LINEAR_MIPMAP_LINEAR),
										t.texParameteri(t.TEXTURE_2D, t.TEXTURE_MAG_FILTER, t.LINEAR)
									const a = t.getExtension("EXT_texture_filter_anisotropic")
									if (a) {
										const e = t.getParameter(a.MAX_TEXTURE_MAX_ANISOTROPY_EXT)
										t.texParameterf(t.TEXTURE_2D, a.TEXTURE_MAX_ANISOTROPY_EXT, e)
									}
									t.generateMipmap(t.TEXTURE_2D), n(e)
								}),
									(r.src = c.test(e) ? u(e) : e),
									(r.crossOrigin = "undefined")
							})
						}),
					l = (t, e, n) => {
						const r = t.bufferViews[n.bufferView],
							a = i[n.type],
							s = n.componentType,
							u = n.type
						return {
							size: a,
							data:
								s == o.Float
									? new Float32Array(e[r.buffer], (n.byteOffset || 0) + (r.byteOffset || 0), n.count * a)
									: new Int16Array(e[r.buffer], (n.byteOffset || 0) + (r.byteOffset || 0), n.count * a),
							type: u,
							componentType: s,
							target: r.target,
						}
					},
					f = (t, e, n) => {
						const r = e.primitives[0].attributes[n]
						return t.accessors[r]
					},
					m = (t, e, n, r, a) => {
						if (void 0 === r.primitives[0].attributes[a]) return null
						const s = f(e, r, a),
							i = l(e, n, s),
							o = t.createBuffer()
						return (
							t.bindBuffer(t.ARRAY_BUFFER, o),
							t.bufferData(t.ARRAY_BUFFER, i.data, t.STATIC_DRAW),
							{ buffer: o, size: i.size, type: i.componentType, target: i.target }
						)
					}
				;(e.loadModel = (t, e) =>
					r(void 0, void 0, void 0, function* () {
						var n
						const i = yield fetch(e),
							o = yield i.json()
						if (void 0 === o.accessors || 0 === o.accessors.length) throw new Error("GLTF File is missing accessors")
						const d = yield Promise.all(
								o.buffers.map(t =>
									r(void 0, void 0, void 0, function* () {
										return yield ((n = e),
										(a = t.uri),
										r(void 0, void 0, void 0, function* () {
											const t = n.split("/").slice(0, -1).join("/"),
												e = c.test(a) ? u(a) : `${t}/${a}`,
												r = yield fetch(e)
											return yield r.arrayBuffer()
										}))
										var n, a
									})
								)
							),
							p = o.scenes[o.scene || 0],
							v = o.meshes.map(e =>
								((t, e, n, r) => {
									let a = null,
										s = 0
									if (void 0 !== n.primitives[0].indices) {
										const i = e.accessors[n.primitives[0].indices],
											o = l(e, r, i),
											u = t.createBuffer()
										t.bindBuffer(t.ELEMENT_ARRAY_BUFFER, u),
											t.bufferData(t.ELEMENT_ARRAY_BUFFER, o.data, t.STATIC_DRAW),
											(a = { buffer: u, size: o.size, type: o.componentType, target: t.ELEMENT_ARRAY_BUFFER }),
											(s = o.data.length)
									} else s = f(e, n, "POSITION").count
									return {
										indices: a,
										elementCount: s,
										positions: m(t, e, r, n, "POSITION"),
										normals: m(t, e, r, n, "NORMAL"),
										tangents: m(t, e, r, n, "TANGENT"),
										texCoord: m(t, e, r, n, "TEXCOORD_0"),
										joints: m(t, e, r, n, "JOINTS_0"),
										weights: m(t, e, r, n, "WEIGHTS_0"),
										material: n.primitives[0].material,
									}
								})(t, o, e, d)
							),
							g = o.materials
								? yield Promise.all(
										o.materials.map(n =>
											r(void 0, void 0, void 0, function* () {
												return yield ((t, e, n, s) =>
													r(void 0, void 0, void 0, function* () {
														const r = n.split("/").slice(0, -1).join("/")
														let i = null,
															o = null,
															u = null,
															c = null,
															l = null,
															f = a.vec4.fromValues(1, 1, 1, 1),
															m = 0,
															d = 1,
															p = a.vec3.fromValues(1, 1, 1)
														const v = e.pbrMetallicRoughness
														if (v) {
															if (v.baseColorTexture) {
																const e = s[v.baseColorTexture.index].uri
																i = yield h(t, `${r}/${e}`)
															}
															if (
																(v.baseColorFactor &&
																	(f = a.vec4.fromValues(
																		v.baseColorFactor[0],
																		v.baseColorFactor[1],
																		v.baseColorFactor[2],
																		v.baseColorFactor[3]
																	)),
																v.metallicRoughnessTexture)
															) {
																const e = s[v.metallicRoughnessTexture.index].uri
																o = yield h(t, `${r}/${e}`)
															}
															;(d = void 0 !== v.metallicFactor ? v.metallicFactor : 1),
																(m = void 0 !== v.roughnessFactor ? v.roughnessFactor : 1)
														}
														if (e.emissiveTexture) {
															const n = s[e.emissiveTexture.index].uri
															u = yield h(t, `${r}/${n}`)
														}
														if (e.normalTexture) {
															const n = s[e.normalTexture.index].uri
															c = yield h(t, `${r}/${n}`)
														}
														if (e.occlusionTexture) {
															const n = s[e.occlusionTexture.index].uri
															l = yield h(t, `${r}/${n}`)
														}
														return (
															e.emissiveFactor &&
																(p = a.vec3.fromValues(e.emissiveFactor[0], e.emissiveFactor[1], e.emissiveFactor[2])),
															{
																baseColorTexture: i,
																baseColorFactor: f,
																metallicRoughnessTexture: o,
																metallicFactor: d,
																roughnessFactor: m,
																emissiveTexture: u,
																emissiveFactor: p,
																normalTexture: c,
																occlusionTexture: l,
															}
														)
													}))(t, n, e, o.images)
											})
										)
								  )
								: [],
							y = p.nodes[0],
							x = o.nodes.map((t, e) =>
								((t, e) => {
									const n = a.mat4.create()
									return (
										void 0 !== e.translation &&
											a.mat4.translate(n, n, a.vec3.fromValues(e.translation[0], e.translation[1], e.translation[1])),
										void 0 !== e.rotation && (0, s.applyRotationFromQuat)(n, e.rotation),
										void 0 !== e.scale && a.mat4.scale(n, n, a.vec3.fromValues(e.scale[0], e.scale[1], e.scale[1])),
										void 0 !== e.matrix && (0, s.createMat4FromArray)(e.matrix),
										{
											id: t,
											name: e.name,
											children: e.children || [],
											localBindTransform: n,
											animatedTransform: a.mat4.create(),
											skin: e.skin,
											mesh: e.mesh,
										}
									)
								})(e, t)
							),
							b = {}
						null === (n = o.animations) ||
							void 0 === n ||
							n.forEach(
								t =>
									(b[t.name] = ((t, e, n) => {
										const r = e.channels.map(r => {
												const a = e.samplers[r.sampler],
													s = l(t, n, t.accessors[a.input]),
													i = l(t, n, t.accessors[a.output])
												return {
													node: r.target.node,
													type: r.target.path,
													time: s,
													buffer: i,
													interpolation: a.interpolation ? a.interpolation : "LINEAR",
												}
											}),
											s = {}
										return (
											r.forEach(t => {
												void 0 === s[t.node] && (s[t.node] = { translation: [], rotation: [], scale: [] })
												for (let e = 0; e < t.time.data.length; e++) {
													const n = "CUBICSPLINE" === t.interpolation ? 3 * t.buffer.size : t.buffer.size,
														r = "CUBICSPLINE" === t.interpolation ? t.buffer.size : 0,
														i =
															"rotation" === t.type
																? a.quat.fromValues(
																		t.buffer.data[e * n + r],
																		t.buffer.data[e * n + r + 1],
																		t.buffer.data[e * n + r + 2],
																		t.buffer.data[e * n + r + 3]
																  )
																: a.vec3.fromValues(
																		t.buffer.data[e * n + r],
																		t.buffer.data[e * n + r + 1],
																		t.buffer.data[e * n + r + 2]
																  )
													s[t.node][t.type].push({ time: t.time.data[e], transform: i, type: t.type })
												}
											}),
											s
										)
									})(o, t, d))
							)
						const _ = o.skins
							? o.skins.map(t => {
									const e = l(o, d, o.accessors[t.inverseBindMatrices]),
										n = t.joints.map((t, n) => (0, s.createMat4FromArray)(e.data.slice(16 * n, 16 * n + 16)))
									return { joints: t.joints, inverseBindTransforms: n }
							  })
							: []
						return {
							name: e.split("/").slice(-1)[0],
							meshes: v,
							nodes: x,
							rootNode: y,
							animations: b,
							skins: _,
							materials: g,
						}
					})),
					(e.dispose = (t, e) => {
						e.meshes.forEach(e => {
							t.deleteBuffer(e.indices),
								e.joints && t.deleteBuffer(e.joints.buffer),
								e.normals && t.deleteBuffer(e.normals.buffer),
								e.positions && t.deleteBuffer(e.positions.buffer),
								e.tangents && t.deleteBuffer(e.tangents.buffer),
								e.texCoord && t.deleteBuffer(e.texCoord.buffer),
								e.weights && t.deleteBuffer(e.weights.buffer),
								(e.indices = null),
								(e.joints = null),
								(e.normals = null),
								(e.tangents = null),
								(e.texCoord = null),
								(e.weights = null)
						}),
							e.materials.forEach(e => {
								e.baseColorTexture && t.deleteTexture(e.baseColorTexture),
									e.emissiveTexture && t.deleteTexture(e.emissiveTexture),
									e.normalTexture && t.deleteTexture(e.normalTexture),
									e.occlusionTexture && t.deleteTexture(e.occlusionTexture),
									e.metallicRoughnessTexture && t.deleteTexture(e.metallicRoughnessTexture),
									(e.baseColorTexture = null),
									(e.emissiveTexture = null),
									(e.normalTexture = null),
									(e.occlusionTexture = null),
									(e.metallicRoughnessTexture = null)
							})
					})
			},
			7788: (t, e, n) => {
				"use strict"
				e.u7 = void 0
				var r = n(5785)
				Object.defineProperty(e, "u7", {
					enumerable: !0,
					get: function () {
						return r.loadModel
					},
				})
				n(7421), n(1170)
			},
			1850: (t, e, n) => {
				"use strict"
				Object.defineProperty(e, "__esModule", { value: !0 }),
					(e.applyRotationFromQuat = e.createMat4FromArray = void 0)
				const r = n(3765)
				;(e.createMat4FromArray = t =>
					r.mat4.fromValues(
						t[0],
						t[1],
						t[2],
						t[3],
						t[4],
						t[5],
						t[6],
						t[7],
						t[8],
						t[9],
						t[10],
						t[11],
						t[12],
						t[13],
						t[14],
						t[15]
					)),
					(e.applyRotationFromQuat = (t, e) => {
						const n = r.mat4.create()
						r.mat4.fromQuat(n, r.quat.fromValues(e[0], e[1], e[2], e[3])), r.mat4.multiply(t, n, t)
					})
			},
		},
		e = {}
	function n(r) {
		var a = e[r]
		if (void 0 !== a) return a.exports
		var s = (e[r] = { exports: {} })
		return t[r].call(s.exports, s, s.exports, n), s.exports
	}
	;(n.n = t => {
		var e = t && t.__esModule ? () => t.default : () => t
		return n.d(e, { a: e }), e
	}),
		(n.d = (t, e) => {
			for (var r in e) n.o(e, r) && !n.o(t, r) && Object.defineProperty(t, r, { enumerable: !0, get: e[r] })
		}),
		(n.g = (function () {
			if ("object" == typeof globalThis) return globalThis
			try {
				return this || new Function("return this")()
			} catch (t) {
				if ("object" == typeof window) return window
			}
		})()),
		(n.o = (t, e) => Object.prototype.hasOwnProperty.call(t, e)),
		(n.r = t => {
			"undefined" != typeof Symbol &&
				Symbol.toStringTag &&
				Object.defineProperty(t, Symbol.toStringTag, { value: "Module" }),
				Object.defineProperty(t, "__esModule", { value: !0 })
		})
	var r = {}
	;(() => {
		"use strict"
		n.d(r, { default: () => Be })
		const t = {
				linear: t => t,
				quadraticIn: t => t ** 2,
				quadraticOut: t => t * (2 - t),
				quadraticInOut: t => (t < 0.5 ? 2 * t ** 2 : (4 - 2 * t) * t - 1),
				cubicIn: t => t ** 3,
				cubicOut: t => --t * t * t + 1,
				cubicInOut: t => (t < 0.5 ? 4 * t ** 3 : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1),
				quarticIn: t => t ** 4,
				quarticOut: t => 1 - (1 - t) ** 4,
				quarticInOut: t => (t < 0.5 ? 8 * t ** 4 : 1 - 8 * (1 - t) ** 4),
				quinticIn: t => t ** 5,
				quinticOut: t => 1 + (t - 1) ** 5,
				quinticInOut: t => (t < 0.5 ? 16 * t ** 5 : 1 + 16 * (t - 1) ** 5),
				sinusoidalIn: t => 1 - Math.cos((t * Math.PI) / 2),
				sinusoidalOut: t => Math.sin((t * Math.PI) / 2),
				sinusoidalInOut: t => 0.5 * (1 - Math.cos(Math.PI * t)),
				exponentialIn: t => 2 ** (10 * (t - 1)),
				exponentialOut: t => 1 - 2 ** (-10 * t),
				exponentialInOut: t => ((t /= 0.5) < 1 ? 0.5 * 2 ** (10 * (t - 1)) : 0.5 * (2 - 2 ** (-10 * --t))),
				circularIn: t => 1 - Math.sqrt(1 - t ** 2),
				circularOut: t => Math.sqrt(1 - (t - 1) ** 2),
				circularInOut: t =>
					t < 0.5 ? 0.5 * (1 - Math.sqrt(1 - 4 * t ** 2)) : 0.5 * (Math.sqrt(1 - (2 * t - 2) ** 2) + 1),
				elasticIn: (t, e = 1, n = 0.5) => {
					if (0 === t) return 0
					if (1 == (t /= 1)) return 1
					const r = (n / (2 * Math.PI)) * Math.asin(1 / e)
					return -e * 2 ** (10 * (t - 1)) * Math.sin(((t - r) * (2 * Math.PI)) / n)
				},
				elasticOut: (t, e = 1, n = 0.5) => {
					if (0 === t) return 0
					if (1 == (t /= 1)) return 1
					const r = (n / (2 * Math.PI)) * Math.asin(1 / e)
					return e * 2 ** (-10 * t) * Math.sin(((t - r) * (2 * Math.PI)) / n) + 1
				},
				elasticInOut: (t, e = 1, n = 0.5) => {
					if (0 === t) return 0
					if (2 == (t /= 0.5)) return 1
					const r = (n / (2 * Math.PI)) * Math.asin(1 / e)
					return t < 1
						? e * 2 ** (10 * (t - 1)) * Math.sin(((t - r) * (2 * Math.PI)) / n) * -0.5
						: e * 2 ** (-10 * (t - 1)) * Math.sin(((t - r) * (2 * Math.PI)) / n) * 0.5 + 1
				},
				backIn: (t, e = 1.70158) => t ** 2 * ((e + 1) * t - e),
				backOut: (t, e = 1.70158) => (t -= 1) * t * ((e + 1) * t + e) + 1,
				backInOut: (t, e = 1.70158) =>
					(t /= 0.5) < 1
						? t ** 2 * ((1 + (e *= 1.525)) * t - e) * 0.5
						: 0.5 * ((t -= 2) * t * ((1 + (e *= 1.525)) * t + e) + 2),
				bounceIn: e => 1 - t.bounceOut(1 - e),
				bounceOut: t =>
					t < 1 / 2.75
						? 7.5625 * t ** 2
						: t < 2 / 2.75
						? 7.5625 * (t -= 1.5 / 2.75) * t + 0.75
						: t < 2.5 / 2.75
						? 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375
						: 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375,
				bounceInOut: e => (e < 0.5 ? 0.5 * t.bounceIn(2 * e) : 0.5 * t.bounceOut(2 * e - 1) + 0.5),
			},
			e = t,
			a = { 1: "float", 2: "vec2", 3: "vec3", 4: "vec4", 9: "mat3", 16: "mat4" },
			s = "tex",
			i = "st",
			o = "c0",
			u = "c1",
			c = {
				src: { returnType: "vec4", args: [`vec3 ${i}`] },
				coord: { returnType: "vec3", args: [`vec3 ${i}`] },
				color: { returnType: "vec4", args: [`vec4 ${o}`] },
				combine: { returnType: "vec4", args: [`vec4 ${o}`, `vec4 ${u}`] },
				combineCoord: { returnType: "vec3", args: [`vec3 ${i}`, `vec4 ${o}`] },
				value: { returnType: "float", args: [`vec3 ${i}`] },
			},
			h = [
				{
					name: "color",
					type: "color",
					inputs: { r: 1, g: 1, b: 1, a: 1 },
					glsl: `\n            vec4 _c0 = ${o};\n            \n            vec4 c = vec4(r, g, b, a);\n            vec4 pos = step(0.0, c); // detect whether negative\n            // if > 0, return r * _c0\n            // if < 0 return (1.0-r) * _c0\n        \n            return vec4(mix((1.0-_c0)*abs(c), c*_c0, pos));\n        `,
				},
				{
					name: "posterize",
					type: "color",
					inputs: { bins: 3, gamma: 0.6 },
					glsl: `\n            vec4 c2 = pow(${o}, vec4(gamma));\n            c2 *= vec4(bins);\n            c2 = floor(c2);\n            c2/= vec4(bins);\n            c2 = pow(c2, vec4(1.0/gamma));\n            \n            return vec4(c2.xyz, ${o}.a);\n        `,
				},
				{
					name: "shift",
					type: "color",
					inputs: { r: 0.5, g: 0, b: 0, a: 0 },
					glsl: `\n            vec4 c2 = vec4(${o});\n            \n            c2.r = fract(c2.r + r);\n            c2.g = fract(c2.g + g);\n            c2.b = fract(c2.b + b);\n            c2.a = fract(c2.a + a);\n\n            return vec4(c2.rgba);\n        `,
				},
				{
					name: "invert",
					type: "color",
					inputs: { amount: 1 },
					glsl: `\n            vec4 _c0 = ${o};\n            return vec4( (1.0 - _c0.rgb) * amount + _c0.rgb * ( 1.0 - amount), _c0.a);\n        `,
				},
				{
					name: "contrast",
					type: "color",
					inputs: { amount: 1.6 },
					glsl: `\n            vec4 _c0 = ${o};\n\t\t\tvec4 mid = vec4(0.5);\n            vec4 c = (_c0 - mid) * amount + mid;\n            return vec4(c.rgb, _c0.a);\n        `,
				},
				{
					name: "brightness",
					type: "color",
					inputs: { amount: 0.4 },
					glsl: `\n            vec4 _c0 = ${o};\n            return vec4(_c0.rgb + vec3(amount), _c0.a);\n        `,
				},
				{
					name: "luma",
					type: "color",
					inputs: { threshold: 0.5, tolerance: 0.1 },
					glsl: `\n            vec4 _c0 = ${o};\n            float a = smoothstep(threshold-(tolerance+0.0000001), threshold+(tolerance+0.0000001), luminance(_c0.rgb));\n            \n            return vec4(_c0.rgb*a, a);\n        `,
					require: ["luminance"],
				},
				{
					name: "thresh",
					type: "color",
					inputs: { threshold: 0.5, tolerance: 0.04 },
					glsl: `\n            vec4 _c0 = ${o};\n            \n            return vec4(vec3(smoothstep(threshold-(tolerance+0.0000001), threshold+(tolerance+0.0000001), luminance(_c0.rgb))), _c0.a);\n        `,
					require: ["luminance"],
				},
				{
					name: "saturate",
					type: "color",
					inputs: { amount: 2 },
					glsl: `\n\t\t\tvec4 _c0 = ${o};\n\t\t\t\n         \tfloat lum = luminance(_c0.rgb);\n\t\t\t\n         \treturn vec4(mix(vec3(lum), _c0.rgb, amount), _c0.a);\n\t\t`,
					require: ["luminance"],
				},
				{
					name: "hue",
					type: "color",
					inputs: { hue: 0.4 },
					glsl: `\n\t\t\tvec4 _c0 = ${o};\n\t\t\tvec3 c = rgbToHsv(_c0.rgb);\n\t\t\tc.r += hue;\n\t\t\t//  c.r = fract(c.r);\n\n\t\t\treturn vec4(hsvToRgb(c), _c0.a);\n\t\t`,
					require: ["rgbToHsv", "hsvToRgb"],
				},
				{
					name: "colorama",
					type: "color",
					inputs: { amount: 0.005 },
					glsl: `\n\t\t\tvec4 _c0 = ${o};\n\n\t\t\tif (amount == 0.) {\n\t\t\t\treturn c0;\n\t\t\t}\n\n\t\t\tvec3 c = rgbToHsv(_c0.rgb);\n\t\t\tc += vec3(amount);\n\t\t\tc = hsvToRgb(c);\n\t\t\tc = fract(c);\n\t\t\t\n\t\t\treturn vec4(c, _c0.a);\n\t\t`,
					require: ["rgbToHsv", "hsvToRgb"],
					lang: "!",
				},
				{
					name: "sum",
					type: "color",
					inputs: { scale: 1 },
					glsl: `   \n\t\t\tvec4 _c0 = ${o};\n            vec4 v = _c0 * s;\n\t\t\t\n            return _c0 + v.r + v.g + v.b + v.a;\n\t\t`,
				},
				{ name: "r", type: "color", inputs: { scale: 1, offset: 0 }, glsl: `return vec4(${o}.r * scale + offset);` },
				{ name: "g", type: "color", inputs: { scale: 1, offset: 0 }, glsl: `return vec4(${o}.g * scale + offset);` },
				{ name: "b", type: "color", inputs: { scale: 1, offset: 0 }, glsl: `return vec4(${o}.b * scale + offset);` },
				{ name: "a", type: "color", inputs: { scale: 1, offset: 0 }, glsl: `return vec4(${o}.a * scale + offset);` },
			],
			l = [
				{
					name: "mask",
					type: "combine",
					inputs: {},
					glsl: `\n\t\t\tvec4 _c0 = ${o};\n\t\t\tvec4 _c1 = ${u};\n\t\t\t\n\t\t\tfloat a = luminance(_c1.rgb);\n\t\t\treturn vec4(_c0.rgb*a, a*_c0.a);\n\t\t`,
					require: ["luminance"],
					lang: "<",
				},
				{
					name: "add",
					type: "combine",
					inputs: { amount: 1 },
					glsl: `\n\t\t\tvec4 _c0 = ${o};\n\t\t\tvec4 _c1 = ${u};\n\n\t\t\treturn (_c0 + _c1) * amount + _c0 * (1.0 - amount);\n\t\t`,
					lang: ".+",
				},
				{
					name: "sub",
					type: "combine",
					inputs: { amount: 1 },
					glsl: `\n\t\t\tvec4 _c0 = ${o};\n\t\t\tvec4 _c1 = ${u};\n\n\t\t\treturn (_c0 - _c1) * amount + _c0 * (1.0 - amount);\n\t\t`,
					lang: ".-",
				},
				{
					name: "layer",
					type: "combine",
					inputs: [],
					glsl: `\n\t\t\tvec4 _c0 = ${o};\n\t\t\tvec4 _c1 = ${u};\n\t\t\n\t\t\treturn vec4(mix(_c0.rgb, _c1.rgb, _c1.a), clamp(_c0.a + _c1.a, 0.0, 1.0));\n\t\t`,
					lang: "..",
				},
				{
					name: "blend",
					type: "combine",
					inputs: { amount: 0.5 },
					glsl: `\n\t\t\treturn ${o} * (1.0 - amount) + ${u} * amount;\n\t\t`,
					lang: "§",
				},
				{
					name: "mult",
					type: "combine",
					inputs: { amount: 1 },
					glsl: `\n\t\t\tvec4 _c0 = ${o};\n\t\t\tvec4 _c1 = ${u};\n\n\t\t\treturn _c0 * (1.0 - amount) + (_c0 * _c1) * amount;\n\t\t`,
					lang: ".*",
				},
				{
					name: "diff",
					type: "combine",
					inputs: [],
					glsl: `\n\t\t\tvec4 _c0 = ${o};\n\t\t\tvec4 _c1 = ${u};\n\n\t\t\treturn vec4(abs(_c0.rgb-_c1.rgb), max(_c0.a, _c1.a));\n\t\t`,
					lang: "./",
				},
			],
			f = [
				{
					name: "modulateRepeat",
					type: "combineCoord",
					inputs: { repeatX: 3, repeatY: 3, offsetX: 0.5, offsetY: 0.5 },
					glsl: `   \n\t\t\tvec2 _st = ${i}.xy * vec2(repeatX, repeatY);\n\t\t\t_st.x += step(1., mod(_st.y,2.0)) + ${o}.r * offsetX;\n\t\t\t_st.y += step(1., mod(_st.x,2.0)) + ${o}.g * offsetY;\n\t\t\t${i}.xy = fract(_st);\n\t\t\treturn vec3(_st, ${i}.z);\n\t\t`,
					lang: "~#",
				},
				{
					name: "modulateRepeatX",
					type: "combineCoord",
					inputs: { reps: 3, offset: 0.5 },
					glsl: `   \n\t\t\tvec2 _st = ${i}.xy * vec2(reps, 1.0);\n\t\t \t//  float f =  mod(_st.y, 2.0);\n\t\t \t_st.y += step(1., mod(_st.x, 2.0)) + ${o}.r * offset;\n\t\t\treturn vec3(fract(_st), ${i}.z);\n\t\t`,
				},
				{
					name: "modulateRepeatY",
					type: "combineCoord",
					inputs: { reps: 3, offset: 0.5 },
					glsl: `   \n\t\t\tvec2 _st = ${i}.xy * vec2(reps, 1.0);\n\t\t\t//  float f =  mod(_st.y,2.0);\n\t\t\t_st.x += step(1., mod(_st.y, 2.0)) + ${o}.r * offset;\n\t\t\treturn vec3(fract(_st), ${i}.z);\n\t\t`,
				},
				{
					name: "modulateKaleid",
					type: "combineCoord",
					inputs: { nSides: 4 },
					defines: ["TWO_PI"],
					glsl: `\n\t\t\tvec2 _st = ${i}.xy - 0.5;\n\t\t\tfloat r = length(_st);\n\t\t\tfloat a = atan(_st.y, _st.x);\n\n\t\t\ta = mod(a, TWO_PI / nSides);\n\t\t\ta = abs(a - TWO_PI / nSides / 2.);\n\n\t\t\treturn (${o}.r+r) * vec3(cos(a), sin(a), ${i}.z);\n\t\t`,
					lang: "~@@",
				},
				{
					name: "modulateScrollX",
					type: "combineCoord",
					inputs: { scrollX: 0.5, speed: 0 },
					glsl: `   \n\t\t\tvec2 _st = ${i}.xy;\t\n\t\t\t_st.x += ${o}.r*scrollX + time * speed;\n\n\t\t\treturn vec3(fract(_st), ${i}.z);\n\t\t`,
					lang: "~++",
				},
				{
					name: "modulateScrollY",
					type: "combineCoord",
					inputs: { scrollY: 0.5, speed: 0 },
					glsl: `   \n\t\t\tvec2 _st = ${i}.xy;\n\t\t\t_st.y += ${o}.r*scrollY + time * speed;\n\n\t\t\treturn vec3(fract(_st), ${i}.z);\n\t\t`,
					lang: "~--",
				},
				{
					name: "modulate",
					type: "combineCoord",
					inputs: { amountX: 0.1, amountY: 0.1, amountZ: 0.1 },
					glsl: `   \n\t\t\t//  return fract(st+(${o}.xy-0.5) * vec3(amountX, amountY, amountZ));\n\t\t\treturn ${i} + ${o}.xyz * vec3(amountX, amountY, amountZ);\n\t\t`,
					transform: (t, e = 0.1, n = e, r = n) => [t, e, n, r],
					lang: "~",
				},
				{
					name: "modulateScale",
					type: "combineCoord",
					inputs: { multiple: 1, offset: 1 },
					glsl: `   \n\t\t\tvec3 _st = ${i} - .5;\n\t\t\t_st *= 1.0 / (offset + vec3(${o}.rgb) * multiple);\n\t\t\treturn _st + .5;\n\t\t`,
					lang: "~^",
				},
				{
					name: "modulatePixelate",
					type: "combineCoord",
					inputs: { multiple: 10, offset: 3 },
					glsl: `\n\t\t\tvec3 _st = vec3(offset + ${o}.x*multiple, offset + ${o}.y*multiple, offset + ${o}.z*multiple);\n\t\t\treturn (floor(${i} * _st) + 0.5) / _st;\n\t\t`,
					lang: "~##",
				},
				{
					name: "modulateRotate",
					type: "combineCoord",
					inputs: { multiple: 1, offset: 0 },
					require: ["rotate3d"],
					defines: ["FORWARD"],
					glsl: `\n\t\t\tvec3 _st = ${i} - .5;\n\t\t\tfloat angle = offset + ${o}.x * multiple * -1.;\n\t\t\t_st = rotate3d(_st, FORWARD, angle);\n\t\t\treturn _st + 0.5;\n\t\t`,
					lang: "~@",
				},
				{
					name: "modulateHue",
					type: "combineCoord",
					inputs: { amount: 1 },
					glsl: `\n\t\t\tvec4 c = ${o};\n\t\t\treturn ${i} + vec3((vec2(c.g - c.r, c.b - c.g) * amount * 1.0 / resolution), ${i}.z);\n\t\t`,
				},
			],
			m = [
				{
					name: "scroll",
					type: "coord",
					inputs: { scrollX: 0.5, scrollY: 0.5, speedX: 0, speedY: 0 },
					glsl: `\n\t\t\tvec2 _st = ${i}.xy;\n\t\t \t_st.x += scrollX + time*speedX;\n\t\t \t_st.y += scrollY + time*speedY;\n\t\t\treturn vec3(fract(_st), ${i}.z);\n\t\t`,
					lang: "--++",
				},
				{
					name: "scrollY",
					type: "coord",
					inputs: { scrollY: 0.5, speed: 0 },
					glsl: `\n\t\t\tvec2 _st = ${i}.xy;\n\t\t\t_st.y += scrollY + time * speed;\n\t\t\treturn vec3(fract(_st), ${i}.z);\n\t\t`,
					lang: "--",
				},
				{
					name: "scrollX",
					type: "coord",
					inputs: { scrollX: 0.5, speed: 0 },
					glsl: `\n\t\t\tvec2 _st = ${i}.xy;\n\t\t\t_st.x += scrollX + time * speed;\n\t\t\treturn vec3(fract(_st), ${i}.z);\n\t\t`,
					lang: "++",
				},
				{
					name: "repeat",
					type: "coord",
					inputs: { repeatX: 3, repeatY: 3, repeatZ: 3, offsetX: 0, offsetY: 0, offsetZ: 0 },
					glsl: `\n\t\t\tvec3 _st = ${i} * vec3(repeatX, repeatY, repeatZ);\n\t\t\t_st.x += step(1., mod(_st.y,2.0)) * offsetX;\n\t\t\t_st.y += step(1., mod(_st.x,2.0)) * offsetY;\n\t\t\t_st.z += step(1., mod(_st.z,2.0)) * offsetZ;\n\t\t\treturn fract(_st);\n\t\t`,
					lang: "#",
				},
				{
					name: "repeatX",
					type: "coord",
					inputs: { reps: 3, offset: 0 },
					glsl: `\n\t\t\tvec2 _st = ${i}.xy * vec2(reps, 1.0);\n\t\t\t//  float f =  mod(_st.y,2.0);\n\t\t\t_st.x += step(1., mod(_st.y, 2.0)) * offset;\n\t\t\treturn vec3(fract(_st), ${i}.z);\n\t\t`,
					lang: "#x",
				},
				{
					name: "repeatY",
					type: "coord",
					inputs: { reps: 3, offset: 0 },
					glsl: `\n\t\t\tvec2 _st = ${i}.xy * vec2(1.0, reps);\n\t\t\t//  float f =  mod(_st.y,2.0);\n\t\t\t_st.y += step(1., mod(_st.x, 2.0)) * offset;\n\t\t\treturn vec3(fract(_st), ${i}.z);\n\t\t`,
					lang: "#y",
				},
				{
					name: "rotate",
					type: "coord",
					inputs: { angle: 10, speed: 0 },
					require: ["rotate3d"],
					defines: ["FORWARD"],
					glsl: `\n\t\t\tvec3 _st = ${i} - 0.5;\n\t\t\t_st = rotate3d(_st, FORWARD, (time * speed + angle) * -1.);\n\t\t\treturn _st + 0.5;\n\t\t`,
					lang: "@",
				},
				{
					name: "scale",
					type: "coord",
					inputs: { amount: 1.5, xMult: 1, yMult: 1, zMult: 1, offsetX: 0.5, offsetY: 0.5, offsetZ: 0.5 },
					glsl: `   \n\t\t\tvec3 offset = vec3(offsetX, offsetY, offsetZ);\n\t\t\tvec3 a = vec3(xMult, yMult, zMult) * amount;\n\n\t\t\tvec3 xyz = ${i} - offset.xyz;\n\n\t\t\txyz *= 1.0 / a;\n\t\t\txyz += offset;\n\t\t\t\n\t\t\treturn xyz;\n\t\t`,
					lang: "^",
				},
				{
					name: "pixelate",
					type: "coord",
					inputs: { pixelX: 20, pixelY: 20, pixelZ: 20 },
					glsl: `\n\t\t\tvec3 xyz = vec3(pixelX, pixelY, pixelZ);\n\t\t\n\t\t\treturn floor(${i} * xyz) / xyz;\n\t\t`,
					lang: "##",
				},
				{
					name: "kaleid",
					type: "coord",
					inputs: { nSides: 4 },
					glsl: `\n\t\t\tvec2 _st = ${i}.xy - 0.5;\n\t\t\tfloat r = length(_st);\n\t\t\tfloat a = atan(_st.y, _st.x);\n\t\t\ta = mod(a,TWO_PI / nSides);\n\t\t\ta = abs(a-TWO_PI / nSides / 2.);\n\t\t\treturn vec3(r*vec2(cos(a), sin(a)), ${i}.z);\n\t\t`,
					defines: ["TWO_PI"],
					lang: "@@",
				},
			],
			d = [
				{
					name: "boost",
					type: "color",
					inputs: { refColor: [0, 0, 0], amount: 32 },
					glsl: `\n\t\t\tvec4 color = ${o};\n\n\t\t\tfloat weight = dot(normalize(color.rgb), normalize(refColor));\n\t\t\tweight = pow(weight, amount);\n\n\t\t\treturn vec4(mix(vec3(luminance(color.rgb)), color.rgb, weight), color.a);\n\t\t`,
					require: ["luminance"],
				},
				{
					name: "isolate",
					type: "color",
					inputs: { toIsolate: [0, 0, 0], threshold: 0.1 },
					glsl: `\n            vec4 color = ${o};\n\n            if (abs(color.r - toIsolate.r) < threshold && abs(color.g - toIsolate.g) < threshold && abs(color.b - toIsolate.b) < threshold) {\n                return vec4(1.);\n            }\n\n            return vec4(0.0);  \n        `,
					transform: (t, e) => (
						"string" == typeof t &&
							(t = t
								.replaceAll("#", "")
								.match(/.{1,2}/g)
								.map(t => parseInt(t, 16) / 255)),
						[t, e]
					),
				},
				{
					name: "clear",
					type: "color",
					inputs: { toClear: [0, 0, 0], threshold: 0.1 },
					glsl: `\n            vec4 color = ${o};\n\n            if (abs(color.r - toClear.r) > threshold && abs(color.g - toClear.g) > threshold && abs(color.b - toClear.b) > threshold) {\n                return color;\n            }\n\n            return vec4(color.rgb, .0);  \n        `,
					transform: (t, e) => (
						"string" == typeof t &&
							(t = t
								.replaceAll("#", "")
								.match(/.{1,2}/g)
								.map(t => parseInt(t, 16) / 255)),
						[t, e]
					),
				},
				{
					name: "alpha",
					type: "color",
					inputs: { amount: 1 },
					glsl: `\n\t\t\tfloat alpha = ${o}.a * amount;\n\t\t\treturn vec4(${o}.rgb, alpha);\n\t\t`,
				},
			],
			p = [
				{
					name: "add2",
					type: "combine",
					inputs: [{ name: "amount", type: "float", default: 1 }],
					glsl: `vec3 rgb;\n            rgb.r = min(${o}.r+${u}.r,1.0);rgb.g = min(${o}.g+${u}.g,1.0);rgb.b = min(${o}.b+${u}.b,1.0);\n            ${u}.a *= amount;\n            vec4 blended = vec4(mix(${o}.rgb, rgb, ${u}.a), 1.0);\n            vec4 over = ${u}+(${o}*(1.0-${u}.a));\n            return mix(blended, over, 1.0-${o}.a);\n      `,
				},
				{
					name: "average",
					type: "combine",
					inputs: [{ name: "amount", type: "float", default: 1 }],
					glsl: `vec3 rgb;\n            rgb.r = (${o}.r+${u}.r)/2.0;rgb.g = (${o}.g+${u}.g)/2.0;rgb.b = (${o}.b+${u}.b)/2.0;\n            ${u}.a *= amount;\n            vec4 blended = vec4(mix(${o}.rgb, rgb, ${u}.a), 1.0);\n            vec4 over = ${u}+(${o}*(1.0-${u}.a));\n            return mix(blended, over, 1.0-${o}.a);\n      `,
				},
				{
					name: "colorBurn",
					type: "combine",
					inputs: [{ name: "amount", type: "float", default: 1 }],
					glsl: `vec3 rgb;\n            rgb.r = (${u}.r==0.0)?${u}.r:max((1.0-((1.0-${o}.r)/${u}.r)),0.0);rgb.g = (${u}.g==0.0)?${u}.g:max((1.0-((1.0-${o}.g)/${u}.g)),0.0);rgb.b = (${u}.b==0.0)?${u}.b:max((1.0-((1.0-${o}.b)/${u}.b)),0.0);\n            ${u}.a *= amount;\n            vec4 blended = vec4(mix(${o}.rgb, rgb, ${u}.a), 1.0);\n            vec4 over = ${u}+(${o}*(1.0-${u}.a));\n            return mix(blended, over, 1.0-${o}.a);\n      `,
				},
				{
					name: "colorDodge",
					type: "combine",
					inputs: [{ name: "amount", type: "float", default: 1 }],
					glsl: `vec3 rgb;\n            rgb.r = (${u}.r==1.0)?${u}.r:min(${o}.r/(1.0-${u}.r),1.0);rgb.g = (${u}.g==1.0)?${u}.g:min(${o}.g/(1.0-${u}.g),1.0);rgb.b = (${u}.b==1.0)?${u}.b:min(${o}.b/(1.0-${u}.b),1.0);\n            ${u}.a *= amount;\n            vec4 blended = vec4(mix(${o}.rgb, rgb, ${u}.a), 1.0);\n            vec4 over = ${u}+(${o}*(1.0-${u}.a));\n            return mix(blended, over, 1.0-${o}.a);\n      `,
				},
				{
					name: "darken",
					type: "combine",
					inputs: [{ name: "amount", type: "float", default: 1 }],
					glsl: `vec3 rgb;\n            rgb.r = min(${u}.r,${o}.r);rgb.g = min(${u}.g,${o}.g);rgb.b = min(${u}.b,${o}.b);\n            ${u}.a *= amount;\n            vec4 blended = vec4(mix(${o}.rgb, rgb, ${u}.a), 1.0);\n            vec4 over = ${u}+(${o}*(1.0-${u}.a));\n            return mix(blended, over, 1.0-${o}.a);\n      `,
				},
				{
					name: "difference",
					type: "combine",
					inputs: [{ name: "amount", type: "float", default: 1 }],
					glsl: `vec3 rgb;\n            rgb.r = abs(${o}.r-${u}.r);rgb.g = abs(${o}.g-${u}.g);rgb.b = abs(${o}.b-${u}.b);\n            ${u}.a *= amount;\n            vec4 blended = vec4(mix(${o}.rgb, rgb, ${u}.a), 1.0);\n            vec4 over = ${u}+(${o}*(1.0-${u}.a));\n            return mix(blended, over, 1.0-${o}.a);\n      `,
				},
				{
					name: "divide",
					type: "combine",
					inputs: [{ name: "amount", type: "float", default: 1 }],
					glsl: `vec3 rgb;\n            rgb.r = min(${o}.r/(${u}.r+0.00000001),1.0);rgb.g = min(${o}.g/(${u}.g+0.00000001),1.0);rgb.b = min(${o}.b/(${u}.b+0.00000001),1.0);\n            ${u}.a *= amount;\n            vec4 blended = vec4(mix(${o}.rgb, rgb, ${u}.a), 1.0);\n            vec4 over = ${u}+(${o}*(1.0-${u}.a));\n            return mix(blended, over, 1.0-${o}.a);\n      `,
				},
				{
					name: "exclusion",
					type: "combine",
					inputs: [{ name: "amount", type: "float", default: 1 }],
					glsl: `vec3 rgb;\n            rgb.r = ${o}.r+${u}.r-2.0*${o}.r*${u}.r;rgb.g = ${o}.g+${u}.g-2.0*${o}.g*${u}.g;rgb.b = ${o}.b+${u}.b-2.0*${o}.b*${u}.b;\n            ${u}.a *= amount;\n            vec4 blended = vec4(mix(${o}.rgb, rgb, ${u}.a), 1.0);\n            vec4 over = ${u}+(${o}*(1.0-${u}.a));\n            return mix(blended, over, 1.0-${o}.a);\n      `,
				},
				{
					name: "glow",
					type: "combine",
					inputs: [{ name: "amount", type: "float", default: 1 }],
					glsl: `vec3 rgb;\n            rgb.r = (${o}.r==1.0)?${o}.r:min(${u}.r*${u}.r/(1.0-${o}.r),1.0);rgb.g = (${o}.g==1.0)?${o}.g:min(${u}.g*${u}.g/(1.0-${o}.g),1.0);rgb.b = (${o}.b==1.0)?${o}.b:min(${u}.b*${u}.b/(1.0-${o}.b),1.0);\n            ${u}.a *= amount;\n            vec4 blended = vec4(mix(${o}.rgb, rgb, ${u}.a), 1.0);\n            vec4 over = ${u}+(${o}*(1.0-${u}.a));\n            return mix(blended, over, 1.0-${o}.a);\n      `,
				},
				{
					name: "hardLight",
					type: "combine",
					inputs: [{ name: "amount", type: "float", default: 1 }],
					glsl: `vec3 rgb;\n            rgb.r = ${u}.r<0.5?(2.0*${u}.r*${o}.r):(1.0-2.0*(1.0-${u}.r)*(1.0-${o}.r));rgb.g = ${u}.g<0.5?(2.0*${u}.g*${o}.g):(1.0-2.0*(1.0-${u}.g)*(1.0-${o}.g));rgb.b = ${u}.b<0.5?(2.0*${u}.b*${o}.b):(1.0-2.0*(1.0-${u}.b)*(1.0-${o}.b));\n            ${u}.a *= amount;\n            vec4 blended = vec4(mix(${o}.rgb, rgb, ${u}.a), 1.0);\n            vec4 over = ${u}+(${o}*(1.0-${u}.a));\n            return mix(blended, over, 1.0-${o}.a);\n      `,
				},
				{
					name: "hardMix",
					type: "combine",
					inputs: [{ name: "amount", type: "float", default: 1 }],
					glsl: `vec3 rgb;\n            rgb.r = (((${u}.r<0.5)?((${u}.r==0.0)?(${u}.r):max((1.0-((1.0-${o}.r)/(2.0*${u}.r))),0.0)):(((2.0*(${u}.r-0.5))==1.0)?(2.0*(${u}.r-0.5)):min(${o}.r/(1.0-(2.0*(${u}.r-0.5))),1.0)))<0.5)?0.0:1.0;rgb.g = (((${u}.g<0.5)?((${u}.g==0.0)?(${u}.g):max((1.0-((1.0-${o}.g)/(2.0*${u}.g))),0.0)):(((2.0*(${u}.g-0.5))==1.0)?(2.0*(${u}.g-0.5)):min(${o}.g/(1.0-(2.0*(${u}.g-0.5))),1.0)))<0.5)?0.0:1.0;rgb.b = (((${u}.b<0.5)?((${u}.b==0.0)?(${u}.b):max((1.0-((1.0-${o}.b)/(2.0*${u}.b))),0.0)):(((2.0*(${u}.b-0.5))==1.0)?(2.0*(${u}.b-0.5)):min(${o}.b/(1.0-(2.0*(${u}.b-0.5))),1.0)))<0.5)?0.0:1.0;\n            ${u}.a *= amount;\n            vec4 blended = vec4(mix(${o}.rgb, rgb, ${u}.a), 1.0);\n            vec4 over = ${u}+(${o}*(1.0-${u}.a));\n            return mix(blended, over, 1.0-${o}.a);\n      `,
				},
				{
					name: "lighten",
					type: "combine",
					inputs: [{ name: "amount", type: "float", default: 1 }],
					glsl: `vec3 rgb;\n            rgb.r = max(${u}.r,${o}.r);rgb.g = max(${u}.g,${o}.g);rgb.b = max(${u}.b,${o}.b);\n            ${u}.a *= amount;\n            vec4 blended = vec4(mix(${o}.rgb, rgb, ${u}.a), 1.0);\n            vec4 over = ${u}+(${o}*(1.0-${u}.a));\n            return mix(blended, over, 1.0-${o}.a);\n      `,
				},
				{
					name: "linearBurn",
					type: "combine",
					inputs: [{ name: "amount", type: "float", default: 1 }],
					glsl: `vec3 rgb;\n            rgb.r = max(${o}.r+${u}.r-1.0,0.0);rgb.g = max(${o}.g+${u}.g-1.0,0.0);rgb.b = max(${o}.b+${u}.b-1.0,0.0);\n            ${u}.a *= amount;\n            vec4 blended = vec4(mix(${o}.rgb, rgb, ${u}.a), 1.0);\n            vec4 over = ${u}+(${o}*(1.0-${u}.a));\n            return mix(blended, over, 1.0-${o}.a);\n      `,
				},
				{
					name: "linearDodge",
					type: "combine",
					inputs: [{ name: "amount", type: "float", default: 1 }],
					glsl: `vec3 rgb;\n            rgb.r = min(${o}.r+${u}.r,1.0);rgb.g = min(${o}.g+${u}.g,1.0);rgb.b = min(${o}.b+${u}.b,1.0);\n            ${u}.a *= amount;\n            vec4 blended = vec4(mix(${o}.rgb, rgb, ${u}.a), 1.0);\n            vec4 over = ${u}+(${o}*(1.0-${u}.a));\n            return mix(blended, over, 1.0-${o}.a);\n      `,
				},
				{
					name: "linearLight",
					type: "combine",
					inputs: [{ name: "amount", type: "float", default: 1 }],
					glsl: `vec3 rgb;\n            rgb.r = ${u}.r<0.5?(max(${o}.r+(2.0*${u}.r)-1.0,0.0)):min(${o}.r+(2.0*(${u}.r-0.5)),1.0);rgb.g = ${u}.g<0.5?(max(${o}.g+(2.0*${u}.g)-1.0,0.0)):min(${o}.g+(2.0*(${u}.g-0.5)),1.0);rgb.b = ${u}.b<0.5?(max(${o}.b+(2.0*${u}.b)-1.0,0.0)):min(${o}.b+(2.0*(${u}.b-0.5)),1.0);\n            ${u}.a *= amount;\n            vec4 blended = vec4(mix(${o}.rgb, rgb, ${u}.a), 1.0);\n            vec4 over = ${u}+(${o}*(1.0-${u}.a));\n            return mix(blended, over, 1.0-${o}.a);\n      `,
				},
				{
					name: "multiply",
					type: "combine",
					inputs: [{ name: "amount", type: "float", default: 1 }],
					glsl: `vec3 rgb;\n            rgb.r = ${o}.r*${u}.r;rgb.g = ${o}.g*${u}.g;rgb.b = ${o}.b*${u}.b;\n            ${u}.a *= amount;\n            vec4 blended = vec4(mix(${o}.rgb, rgb, ${u}.a), 1.0);\n            vec4 over = ${u}+(${o}*(1.0-${u}.a));\n            return mix(blended, over, 1.0-${o}.a);\n      `,
				},
				{
					name: "negation",
					type: "combine",
					inputs: [{ name: "amount", type: "float", default: 1 }],
					glsl: `vec3 rgb;\n            rgb.r = 1.0-abs(1.0-${o}.r-${u}.r);rgb.g = 1.0-abs(1.0-${o}.g-${u}.g);rgb.b = 1.0-abs(1.0-${o}.b-${u}.b);\n            ${u}.a *= amount;\n            vec4 blended = vec4(mix(${o}.rgb, rgb, ${u}.a), 1.0);\n            vec4 over = ${u}+(${o}*(1.0-${u}.a));\n            return mix(blended, over, 1.0-${o}.a);\n      `,
				},
				{
					name: "overlay",
					type: "combine",
					inputs: [{ name: "amount", type: "float", default: 1 }],
					glsl: `vec3 rgb;\n            rgb.r = ${o}.r<0.5?(2.0*${o}.r*${u}.r):(1.0-2.0*(1.0-${o}.r)*(1.0-${u}.r));rgb.g = ${o}.g<0.5?(2.0*${o}.g*${u}.g):(1.0-2.0*(1.0-${o}.g)*(1.0-${u}.g));rgb.b = ${o}.b<0.5?(2.0*${o}.b*${u}.b):(1.0-2.0*(1.0-${o}.b)*(1.0-${u}.b));\n            ${u}.a *= amount;\n            vec4 blended = vec4(mix(${o}.rgb, rgb, ${u}.a), 1.0);\n            vec4 over = ${u}+(${o}*(1.0-${u}.a));\n            return mix(blended, over, 1.0-${o}.a);\n      `,
				},
				{
					name: "phoenix",
					type: "combine",
					inputs: [{ name: "amount", type: "float", default: 1 }],
					glsl: `vec3 rgb;\n            rgb.r = min(${o}.r,${u}.r)-max(${o}.r,${u}.r)+vec3(1.0);rgb.g = min(${o}.g,${u}.g)-max(${o}.g,${u}.g)+vec3(1.0);rgb.b = min(${o}.b,${u}.b)-max(${o}.b,${u}.b)+vec3(1.0);\n            ${u}.a *= amount;\n            vec4 blended = vec4(mix(${o}.rgb, rgb, ${u}.a), 1.0);\n            vec4 over = ${u}+(${o}*(1.0-${u}.a));\n            return mix(blended, over, 1.0-${o}.a);\n      `,
				},
				{
					name: "pinLight",
					type: "combine",
					inputs: [{ name: "amount", type: "float", default: 1 }],
					glsl: `vec3 rgb;\n            rgb.r = (${u}.r<0.5)?min(${o}.r,2.0*${u}.r):max(${o}.r,2.0*(${u}.r-0.5));rgb.g = (${u}.g<0.5)?min(${o}.g,2.0*${u}.g):max(${o}.g,2.0*(${u}.g-0.5));rgb.b = (${u}.b<0.5)?min(${o}.b,2.0*${u}.b):max(${o}.b,2.0*(${u}.b-0.5));\n            ${u}.a *= amount;\n            vec4 blended = vec4(mix(${o}.rgb, rgb, ${u}.a), 1.0);\n            vec4 over = ${u}+(${o}*(1.0-${u}.a));\n            return mix(blended, over, 1.0-${o}.a);\n      `,
				},
				{
					name: "reflect",
					type: "combine",
					inputs: [{ name: "amount", type: "float", default: 1 }],
					glsl: `vec3 rgb;\n            rgb.r = (${u}.r==1.0)?${u}.r:min(${o}.r*${o}.r/(1.0-${u}.r),1.0);rgb.g = (${u}.g==1.0)?${u}.g:min(${o}.g*${o}.g/(1.0-${u}.g),1.0);rgb.b = (${u}.b==1.0)?${u}.b:min(${o}.b*${o}.b/(1.0-${u}.b),1.0);\n            ${u}.a *= amount;\n            vec4 blended = vec4(mix(${o}.rgb, rgb, ${u}.a), 1.0);\n            vec4 over = ${u}+(${o}*(1.0-${u}.a));\n            return mix(blended, over, 1.0-${o}.a);\n      `,
				},
				{
					name: "screen",
					type: "combine",
					inputs: [{ name: "amount", type: "float", default: 1 }],
					glsl: `vec3 rgb;\n            rgb.r = 1.0-((1.0-${o}.r)*(1.0-${u}.r));rgb.g = 1.0-((1.0-${o}.g)*(1.0-${u}.g));rgb.b = 1.0-((1.0-${o}.b)*(1.0-${u}.b));\n            ${u}.a *= amount;\n            vec4 blended = vec4(mix(${o}.rgb, rgb, ${u}.a), 1.0);\n            vec4 over = ${u}+(${o}*(1.0-${u}.a));\n            return mix(blended, over, 1.0-${o}.a);\n      `,
				},
				{
					name: "softLight",
					type: "combine",
					inputs: [{ name: "amount", type: "float", default: 1 }],
					glsl: `vec3 rgb;\n            rgb.r = (${u}.r<0.5)?(2.0*${o}.r*${u}.r+${o}.r*${o}.r*(1.0-2.0*${u}.r)):(sqrt(${o}.r)*(2.0*${u}.r-1.0)+2.0*${o}.r*(1.0-${u}.r));rgb.g = (${u}.g<0.5)?(2.0*${o}.g*${u}.g+${o}.g*${o}.g*(1.0-2.0*${u}.g)):(sqrt(${o}.g)*(2.0*${u}.g-1.0)+2.0*${o}.g*(1.0-${u}.g));rgb.b = (${u}.b<0.5)?(2.0*${o}.b*${u}.b+${o}.b*${o}.b*(1.0-2.0*${u}.b)):(sqrt(${o}.b)*(2.0*${u}.b-1.0)+2.0*${o}.b*(1.0-${u}.b));\n            ${u}.a *= amount;\n            vec4 blended = vec4(mix(${o}.rgb, rgb, ${u}.a), 1.0);\n            vec4 over = ${u}+(${o}*(1.0-${u}.a));\n            return mix(blended, over, 1.0-${o}.a);\n      `,
				},
				{
					name: "subtract",
					type: "combine",
					inputs: [{ name: "amount", type: "float", default: 1 }],
					glsl: `vec3 rgb;\n            rgb.r = max(${o}.r+${u}.r-1.0,0.0);rgb.g = max(${o}.g+${u}.g-1.0,0.0);rgb.b = max(${o}.b+${u}.b-1.0,0.0);\n            ${u}.a *= amount;\n            vec4 blended = vec4(mix(${o}.rgb, rgb, ${u}.a), 1.0);\n            vec4 over = ${u}+(${o}*(1.0-${u}.a));\n            return mix(blended, over, 1.0-${o}.a);\n      `,
				},
				{
					name: "vividLight",
					type: "combine",
					inputs: [{ name: "amount", type: "float", default: 1 }],
					glsl: `vec3 rgb;\n            rgb.r = (${u}.r<0.5)?((${u}.r==0.0)?(${u}.r):max((1.0-((1.0-${o}.r)/(2.0*${u}.r))),0.0)):(((2.0*(${u}.r-0.5))==1.0)?(2.0*(${u}.r-0.5)):min(${o}.r/(1.0-(2.0*(${u}.r-0.5))),1.0));rgb.g = (${u}.g<0.5)?((${u}.g==0.0)?(${u}.g):max((1.0-((1.0-${o}.g)/(2.0*${u}.g))),0.0)):(((2.0*(${u}.g-0.5))==1.0)?(2.0*(${u}.g-0.5)):min(${o}.g/(1.0-(2.0*(${u}.g-0.5))),1.0));rgb.b = (${u}.b<0.5)?((${u}.b==0.0)?(${u}.b):max((1.0-((1.0-${o}.b)/(2.0*${u}.b))),0.0)):(((2.0*(${u}.b-0.5))==1.0)?(2.0*(${u}.b-0.5)):min(${o}.b/(1.0-(2.0*(${u}.b-0.5))),1.0));\n            ${u}.a *= amount;\n            vec4 blended = vec4(mix(${o}.rgb, rgb, ${u}.a), 1.0);\n            vec4 over = ${u}+(${o}*(1.0-${u}.a));\n            return mix(blended, over, 1.0-${o}.a);\n      `,
				},
			],
			v = [
				{
					name: "translate",
					type: "coord",
					inputs: { translateX: 0.5, translateY: 0.5, translateZ: 0.5, speedX: 0, speedY: 0, speedZ: 0 },
					glsl: `\n\t\t\tvec3 _st = ${i};\n\t\t \t_st.x += translateX + time * speedX;\n\t\t \t_st.y += translateY + time * speedY;\n\t\t \t_st.z += translateZ + time * speedZ;\n\t\t\treturn _st;\n\t\t`,
				},
				{
					name: "translateY",
					type: "coord",
					inputs: { translateY: 0.5, speed: 0 },
					glsl: `\n\t\t\tvec3 _st = ${i};\n\t\t\t_st.y += translateY + time * speed;\n\t\t\treturn _st;\n\t\t`,
				},
				{
					name: "translateX",
					type: "coord",
					inputs: { translateX: 0.5, speed: 0 },
					glsl: `\n\t\t\tvec3 _st = ${i};\n\t\t\t_st.x += translateX + time * speed;\n\t\t\treturn _st;\n\t\t`,
				},
				{
					name: "translateZ",
					type: "coord",
					inputs: { translateZ: 0.5, speed: 0 },
					glsl: `\n\t\t\tvec3 _st = ${i};\n\t\t\t_st.z += translateZ + time * speed;\n\t\t\treturn _st;\n\t\t`,
				},
				{
					name: "rotateX",
					type: "coord",
					inputs: { angle: 10, speed: 0 },
					require: ["rotate3d"],
					defines: ["RIGHT"],
					glsl: `\n\t\t\treturn rotate3d(${i}, RIGHT, (time * speed + angle) * -1.);\n\t\t`,
				},
				{
					name: "rotateY",
					type: "coord",
					inputs: { angle: 10, speed: 0 },
					require: ["rotate3d"],
					defines: ["UP"],
					glsl: `\n\t\t\treturn rotate3d(${i}, UP, (time * speed + angle) * -1.);\n\t\t`,
				},
				{
					name: "rotateZ",
					type: "coord",
					inputs: { angle: 10, speed: 0 },
					require: ["rotate3d"],
					defines: ["FORWARD"],
					glsl: `\n\t\t\treturn rotate3d(${i}, FORWARD, (time * speed + angle) * -1.);\n\t\t`,
				},
				{
					name: "ripple",
					type: "coord",
					inputs: { amount: 1, speed: 1, phase: 0, f: 0.05, k: 1 },
					glsl: `\n\t\t\tfloat dist = pow(length(${i} - .5), k);\n\t\t\tfloat d = sin(dist * amount - time * 2. * speed + phase);\n\t\t\tvec3 dir = normalize(${i} - .5);\n\n\t\t\treturn ${i} + d * dir * f;\n\t\t`,
				},
				{
					name: "glitch",
					type: "coord",
					inputs: { amount: 1, offset: 0.1, gap: 0.05, gapOffset: 0.5 },
					require: ["luminance"],
					glsl: `\n\t\t\tvec3 sum = vec3(.0);\n\t\t\tfor (int t = 0; t < 5; t++) {\n\t\t\t\tvec3 off = ${i} + vec3((float(t) - 2.5) * offset);\n\t\t\t\tsum += luminance(texture(prevFrame, off).rgb);\n\t\t\t}\n\n\t\t\tsum /= float(5.);\n\t\t\tsum = max(sum, gapOffset - gap);\n\t\t\tsum = min(sum, gapOffset + gap);\n\t\t\t\n\t\t\treturn _st + sum * amount;\n\t\t`,
				},
				{
					name: "polar",
					type: "coord",
					inputs: { reps: 1 },
					glsl: `\n\t\t\tvec2 _st = ${i}.xy - 0.5;\n\t\n\t\t\t_st = toPolar(_st);\n\t\t\t_st.x *= reps;\n\t\t\t_st.x = fract(_st.x);\n\n\t\t\treturn vec3(_st, ${i}.z);\n\t\t`,
					require: ["polar"],
					defines: ["TWO_PI"],
				},
				{
					name: "mirrorX",
					type: "coord",
					inputs: { pos: 0, coverage: 1, invert: 0 },
					glsl: `\n\t\t\tvec3 _st = ${i};\n\t\t\tfloat k = abs( fract(_st.x / coverage) - (1.0 - 0.5 - pos) ) + 0.5 - pos;\n\t\t\t_st.x = ( 0.0 + mix(-k, k, invert) ) * coverage;\n\t\t\treturn _st;\n\t\t`,
				},
				{
					name: "mirrorY",
					type: "coord",
					inputs: { pos: 0, coverage: 1, invert: 0 },
					glsl: `\n\t\t\tvec3 _st = ${i};\n\t\t\tfloat k = abs( fract(_st.y / coverage) - (1.0 - 0.5 - pos) ) + 0.5 - pos;\n\t\t\t_st.y = ( 0.0 + mix(-k, k, invert) ) * coverage; \n\t\t\treturn _st;\n\t\t`,
				},
				{
					name: "inversion",
					type: "coord",
					inputs: { amount: 1 },
					glsl: `\n\t\t\tvec3 _st = ${i};\n\t\t\t_st /= dot(_st, _st) * amount; \n\t\t\treturn _st;\n\t\t`,
				},
			],
			g = {
				NORMAL: [0, 0, 0, 0, 1, 0, 0, 0, 0],
				GAUSSIAN_BLUR: [0.045, 0.122, 0.045, 0.122, 0.332, 0.122, 0.045, 0.122, 0.045],
				GAUSSIAN_BLUR_2: [1, 2, 1, 2, 4, 2, 1, 2, 1],
				GAUSSIAN_BLUR_3: [0, 1, 0, 1, 1, 1, 0, 1, 0],
				UNSHARPEN: [-1, -1, -1, -1, 9, -1, -1, -1, -1],
				SHARPNESS: [0, -1, 0, -1, 5, -1, 0, -1, 0],
				SHARPEN: [-1, -1, -1, -1, 16, -1, -1, -1, -1],
				EDGE_DETECT: [-0.125, -0.125, -0.125, -0.125, 1, -0.125, -0.125, -0.125, -0.125],
				EDGE_DETECT_2: [-1, -1, -1, -1, 8, -1, -1, -1, -1],
				EDGE_DETECT_3: [-5, 0, 0, 0, 0, 0, 0, 0, 5],
				EDGE_DETECT_4: [-1, -1, -1, 0, 0, 0, 1, 1, 1],
				EDGE_DETECT_5: [-1, -1, -1, 2, 2, 2, -1, -1, -1],
				EDGE_DETECT_6: [-5, -5, -5, -5, 39, -5, -5, -5, -5],
				SOBEL_HORIZONTAL: [1, 2, 1, 0, 0, 0, -1, -2, -1],
				SOBEL_VERTICAL: [1, 0, -1, 2, 0, -2, 1, 0, -1],
				PREV_IT_HORIZONTAL: [1, 1, 1, 0, 0, 0, -1, -1, -1],
				PREV_IT_VERTICAL: [1, 0, -1, 1, 0, -1, 1, 0, -1],
				BOX_BLUR: [0.111, 0.111, 0.111, 0.111, 0.111, 0.111, 0.111, 0.111, 0.111],
				TRIANGLE_BLUR: [0.0625, 0.125, 0.0625, 0.125, 0.25, 0.125, 0.0625, 0.125, 0.0625],
				EMBOSS: [-2, -1, 0, -1, 1, 1, 0, 1, 2],
			},
			y = [
				{
					name: "sobel",
					type: "src",
					inputs: [
						{ type: "sampler2D", name: s, default: NaN },
						{ type: "float", name: "spread", default: 2 },
						{ type: "float", name: "gain", default: 0.5 },
						{ type: "float", name: "slopeness", default: 1 },
						{ type: "float", name: "octaveFactor", default: 1 },
					],
					glsl: `\n\t\t\tvec3 sob = vec3(0.0);\n\t\t\tvec2 derivative = vec2(0.0);\n\t\t\t\n\t\t\tfloat amplitude = gain;\n\t\t\tvec2 p = ${i}.xy;\n\t\t\tfor (int i = 0; i < 20; i++)\n\t\t\t{\n\t\t\t\tvec3 color = texture(${s}, p).rgb;\n\t\t\t\tvec2 grad = _sobel(${s}, p, spread);\n\t\t\t\tderivative += grad;\n\t\t\t\tsob += amplitude * color / (1.0 + mix(0.0, dot(derivative, derivative), slopeness));\n\t\t\t\tamplitude = pow(amplitude * gain, octaveFactor);\n\t\t\t}\n\n\t\t\treturn vec4(sob, texture(${s}, ${i}.xy).a);\n        `,
					require: ["luminance", "sobel"],
				},
				{
					name: "convolution",
					type: "src",
					inputs: [
						{ type: "sampler2D", name: s, default: NaN },
						{ type: "float[9]", name: "kernel", default: g.NORMAL },
						{ type: "float", name: "spread", default: 1 },
					],
					glsl: `\n\t\t\tvec2 _spread = (vec2(1.0, 1.0) / resolution) * spread;\n\t\t\treturn _convolution(${s}, ${i}.xy, kernel, _spread);\n\t\t`,
					require: ["convolution"],
					transform: (t, e = "NORMAL", n = 1) => (
						"string" == typeof e &&
							((e = e.toUpperCase()) in g ||
								(console.warn(`kernel ${e} not found, using NORMAL instead`), (e = "NORMAL")),
							(e = g[e])),
						Array.isArray(e) && 9 !== e.length && (e = new Array(9).fill(0).map((t, n) => e[n % e.length] || 0)),
						[t, e, n]
					),
					help: `\n\t\t\tusage: convolution(<out or source>, <kernel_name> , <spread>)\n\t\t\tdefault: convolution(NaN, 'normal', 1)\n\t\t\texample: convolution(o0, 'normal', 1)\n\n\t\t\tkernels: ${Object.keys(
						g
					)
						.map(t => t.toLowerCase())
						.join(", ")} \n\t\t`,
				},
				{
					name: "ascii",
					type: "src",
					inputs: [
						{ name: "source", default: NaN, type: "sampler2D" },
						{ name: "asciiTexture", default: NaN, type: "sampler2D" },
						{ name: "charLen", default: [1, 1], type: "vec2", description: "[row, cols] of asciiTexture" },
						{ name: "pixelateX", default: 20, type: "float" },
						{ name: "pixelateY", default: 20, type: "float" },
						{ name: "multiplier", default: 1, type: "float" },
					],
					glsl: `\n\t\t\tvec2 _st = ${i}.xy;\n\t\t\tfloat rows = charLen.x;\n\t\t\tfloat cols = charLen.y;\n\t\t\tfloat chars = (rows * cols);\n\t\t\tvec2 pixelate = vec2(pixelateX, pixelateY);\n            vec2 xy = (floor(_st * pixelate) + 0.5) / pixelate;\n            vec4 color = texture(source, xy);\n\t\t\n           \tfloat luminosity = pow(luminance(color.rgb), multiplier) * chars;\n\t\t\tfloat luminosityCols = floor(mod(luminosity, cols));\n\t\t\tfloat luminosityRows = floor(luminosity / cols);\n\n            float asciiCharOffsetX = luminosityCols / cols;\n\t\t\tfloat asciiCharOffsetY = luminosityRows / rows;\n            \n\t\t\tvec2 position = vec2(\n                fract(_st.x * pixelate.x) * (1. / cols) + asciiCharOffsetX,\n\t\t\t\tfract(_st.y  * pixelate.y) * (1. / rows) + asciiCharOffsetY\n            );\n\n            vec3 charColor = texture(asciiTexture, position).xyz;\n\t\t\t\n            return vec4(charColor, color.a);\n\t\t`,
					require: ["luminance"],
					transform: (t, e, n, r, a, s) => ("number" == typeof n && (n = [1, n]), [t, e, n, r, a, s]),
				},
				{
					name: "bloom",
					type: "src",
					inputs: { source: NaN, intensity: 2, spread: 1, threshold: 0.5 },
					glsl: `\n\t\t\tvec2 _st = ${i}.xy;\n\t\t\tvec4 sum = vec4(0.0);\n\n\t\t\tfloat uv_x = _st.x;\n\t\t\tfloat uv_y = _st.y;\n\n\t\t\tfloat spread_x = spread / resolution.x;\n\t\t\tfloat spread_y = spread / resolution.y;\n\n\t\t\tfor (int n = 0; n < 9; ++n) {\n\t\t\t\tuv_y = _st.y + (spread_y * float(n - 4));\n\t\t\t\tvec4 h_sum = vec4(0.0);\n\t\t\t\th_sum += texture(source, vec2(uv_x - (4.0 * spread_x), uv_y));\n\t\t\t\th_sum += texture(source, vec2(uv_x - (3.0 * spread_x), uv_y));\n\t\t\t\th_sum += texture(source, vec2(uv_x - (2.0 * spread_x), uv_y));\n\t\t\t\th_sum += texture(source, vec2(uv_x - spread_x, uv_y));\n\t\t\t\th_sum += texture(source, vec2(uv_x, uv_y));\n\t\t\t\th_sum += texture(source, vec2(uv_x + spread_x, uv_y));\n\t\t\t\th_sum += texture(source, vec2(uv_x + (2.0 * spread_x), uv_y));\n\t\t\t\th_sum += texture(source, vec2(uv_x + (3.0 * spread_x), uv_y));\n\t\t\t\th_sum += texture(source, vec2(uv_x + (4.0 * spread_x), uv_y));\n\t\t\t\tsum += h_sum / 9.0;\n\t\t\t}\n\t\t\t\n\t\t\tvec4 color = texture(source, _st);\n\n\t\t\tif (luminance(color) < threshold) {\n\t\t\t\treturn color + ((sum / 9.0) * intensity);\n\t\t\t}\n\n\t\t\treturn color;\n\t\t`,
					require: ["luminance"],
				},
				{
					name: "grid",
					type: "src",
					inputs: { scale: [10, 10], threshold: [0.1, 0.1] },
					glsl: `\n\t\t\tvec2 _st = ${i}.xy + vec2(threshold / scale / 2.);\n\t\t\tvec2 _grid = fract(_st * scale);\n\t\t\tvec2 _lines = step(threshold, _grid);\n\t\t\tfloat _line = min(_lines.x, _lines.y);\n\t\t\treturn vec4(vec3(_line), 1.0);\n\n\t\t`,
					transform: (t, e) => ("number" == typeof t && (t = [t, t]), "number" == typeof e && (e = [e, e]), [t, e]),
				},
				...v,
				...d,
				...p,
			],
			x = [
				{
					name: "src",
					type: "src",
					inputs: [{ type: "sampler2D", name: s, default: NaN }],
					glsl: `return texture(${s}, fract(${i}.xy));`,
					lang: "$",
				},
				{
					name: "noise",
					type: "src",
					inputs: { scale: 10, offset: 0.1 },
					glsl: `return vec4(vec3(noise3d(vec3(${i}.xy * scale, offset * time))), 1.0);`,
					require: ["noise3d"],
				},
				{
					name: "osc",
					type: "src",
					inputs: { frequency: 60, sync: 0.1, offset: 0 },
					glsl: `\n\t\t\tvec2 _st = ${i}.xy;\n\t\t\tfloat r = sin((_st.x-offset/frequency+time*sync)*frequency)*0.5  + 0.5;\n\t\t\tfloat g = sin((_st.x+time*sync)*frequency)*0.5 + 0.5;\n\t\t\tfloat b = sin((_st.x+offset/frequency+time*sync)*frequency)*0.5  + 0.5;\n\n            return vec4(r, g, b, 1.0);\n        `,
				},
				{
					name: "shape",
					type: "src",
					inputs: { sides: 3, radius: 0.3, smoothing: 0.005 },
					glsl: `\n\t\t\tvec3 _st = ${i} * 2. - 1.;\n\t\t\t// Angle and radius from the current pixel\n\t\t\tfloat a = atan(_st.x, _st.y) + PI;\n\t\t\tfloat r = TWO_PI / sides;\n\t\t\tfloat d = cos(floor(.5 + a/r) * r-a) * length(_st.xy);\n\t\t\tfloat color = 1.0 - smoothstep(radius, radius + smoothing + 0.000000001, d);\n\t\t\t\n\t\t\treturn vec4(vec3(color), 1.0);\n\t\t`,
					defines: ["TWO_PI", "PI"],
				},
				{ name: "gradient", type: "src", inputs: { speed: 0 }, glsl: `return vec4(${i}.xy, sin(time * speed), 1.0);` },
				{
					name: "voronoi",
					type: "src",
					inputs: { scale: 5, speed: 0.3, blending: 0.3 },
					glsl: `   \n\t\t\tvec2 _st = ${i}.xy;\n\t\t\t\n\t\t\tvec3 color = vec3(.0);\n\t\t \t// Scale\n\t\t \t_st *= scale;\n\t\t \t\n\t\t\t// Tile the space\n\t\t\tvec2 i_st = floor(_st);\n\t\t\tvec2 f_st = fract(_st);\n\n\t\t\tfloat m_dist = 10.;  // minimun distance\n\t\t\tvec2 m_point;        // minimum point\n\n\t\t\tfor (int j=-1; j<=1; j++ ) {\n\t\t\t\tfor (int i=-1; i<=1; i++ ) {\n\t\t\t\t\tvec2 neighbor = vec2(float(i), float(j));\n\t\t\t\t\tvec2 p = i_st + neighbor;\n\t\t\t\t\tvec2 point = fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);\n\t\t\t\t\tpoint = 0.5 + 0.5  * sin(time*speed + 6.2831*point);\n\t\t\t\t\tvec2 diff = neighbor + point - f_st;\n\t\t\t\t\tfloat dist = length(diff);\n\t\t\t\t\tif( dist < m_dist ) {\n\t\t\t\t\t\tm_dist = dist;\n\t\t\t\t\t\tm_point = point;\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t\t\n\t\t\t// Assign a color using the closest point position\n\t\t\tcolor += dot(m_point,vec2(.3,.6));\n\t\t\tcolor *= 1.0 - blending*m_dist;\n\t\t\t\n\t\t\treturn vec4(color, 1.0);\n\t\t`,
				},
				{
					name: "solid",
					type: "src",
					inputs: { r: 0, g: 0, b: 0, a: 1 },
					glsl: "return vec4(r, g, b, a);",
					transform: (...t) => {
						if (1 === t.length && "string" == typeof t[0]) {
							let e = t[0].replace("#", "")
							return (
								3 === e.length &&
									(e = e
										.split("")
										.map(t => t + t)
										.join("")),
								[
									parseInt(e.substring(0, 2), 16) / 255,
									parseInt(e.substring(2, 4), 16) / 255,
									parseInt(e.substring(4, 6), 16) / 255,
								]
							)
						}
						return t
					},
				},
				{ name: "prev", type: "src", inputs: {}, glsl: `return texture(prevFrame, fract(${i}).xy);` },
			],
			b = [
				...x,
				...h,
				...m,
				...f,
				...l,
				{ name: "glsl", type: "code", codeType: "src" },
				{ name: "glslColor", type: "code", codeType: "color" },
				{ name: "glslCoord", type: "code", codeType: "coord" },
				{ name: "glslCombine", type: "code", codeType: "combine" },
				{ name: "glslCombineCoord", type: "code", codeType: "combineCoord" },
				...y,
			]
		function _(t) {
			;-1 === b.findIndex(({ name: e }) => e === t.name) ? b.push(t) : console.warn(`Function ${t.name} already exists`)
		}
		let M = 1
		class $ {
			constructor(t, e) {
				;(this.synth = t), (this.name = ("object" == typeof e && e.name) || "buffer_" + M++)
				const n = t.renderer.gl
				"number" == typeof e
					? (e = { data: e })
					: Array.isArray(e)
					? (e = { data: new Float32Array(e) })
					: ArrayBuffer.isView(e) && (e = { data: e }),
					(this._usage = e.usage ?? P),
					(this._target = e.target ?? A),
					(this._divisor = e.divisor ?? 0),
					(this._size = e.size ?? 1),
					(this._buffer = e.buffer ?? n.createBuffer()),
					(e.buffer || e.data) && this.data(e.buffer ? U(n, e.buffer, e.type, e.target) : e.data, e.size, e.type)
			}
			data(t, e = this._size, n = this._type) {
				const r = this.synth.renderer.gl
				return (
					(n = D(n)),
					Array.isArray(t) && (t = new (L(n))(t)),
					(this._data = t),
					(this._size = e),
					(this._type = n),
					this._type || (this._type = N[this._data.constructor.name]),
					r.bindBuffer(this._target, this._buffer),
					r.bufferData(this._target, this._data, this._usage),
					r.bindBuffer(this._target, null),
					this
				)
			}
			size(t) {
				return (this._size = t), this
			}
			usage(t) {
				return (
					(this._usage = "string" == typeof t ? C[t] : t),
					this._data ? this.data(this._data, this._size, this._type) : this
				)
			}
			target(t) {
				return (
					(this._target = "attr" === t ? A : "indices" === t ? E : t),
					this._data ? this.data(this._data, this._size, this._type) : this
				)
			}
			divisor(t) {
				return (this._divisor = t), this
			}
			type(t) {
				return (this._type = D(t)), this._data ? this.data(this._data, this._size, this._type) : this
			}
			destroy() {
				this.synth.renderer.gl.deleteBuffer(this._buffer), (this._data = null)
			}
			async print() {
				const t = await this.read()
				console.log(this.name, t)
			}
			async read(t = !1) {
				const e = this.synth.renderer.gl
				return new Promise(n => {
					const r = e.fenceSync(e.SYNC_GPU_COMMANDS_COMPLETE, 0),
						a = () => {
							const s = e.clientWaitSync(r, e.SYNC_FLUSH_COMMANDS_BIT, 0)
							if (s === e.TIMEOUT_EXPIRED) setTimeout(a)
							else if (s === e.WAIT_FAILED) console.error("Something went wrong with the sync object")
							else {
								const r = U(e, this._buffer, this._type, this._target)
								t && (this._data = r), n(r)
							}
						}
					a()
				})
			}
			clone() {
				return new $(this.synth, {
					buffer: this._buffer,
					data: this._data,
					type: this._type,
					size: this._size,
					target: this._target,
					usage: this._usage,
					divisor: this._divisor,
				})
			}
		}
		const A = 34962,
			E = 34963,
			w = 5120,
			T = 5121,
			S = 5122,
			R = 5123,
			O = 5124,
			F = 5125,
			I = 5126,
			P = 35044,
			C = { static: P, dynamic: 35048, stream: 35040 },
			z = { byte: w, ubyte: T, short: S, ushort: R, int: O, uint: F, float: I }
		function D(t) {
			return "string" == typeof t ? z[t] : t
		}
		const k = {
				[w]: Int8Array,
				[T]: Uint8Array,
				[S]: Int16Array,
				[R]: Uint16Array,
				[O]: Int32Array,
				[F]: Uint32Array,
				[I]: Float32Array,
			},
			N = { Int8Array: w, Uint8Array: T, Int16Array: S, Uint16Array: R, Int32Array: O, Uint32Array: F, Float32Array: I }
		function L(t) {
			if (!(t in k)) throw new Error(`glTypeToTypedArray no key: ${t}`)
			return k[t]
		}
		function U(t, e, n, r = t.ARRAY_BUFFER) {
			const a = L(n)
			t.bindBuffer(r, e)
			const s = new a(t.getBufferParameter(r, t.BUFFER_SIZE) / a.BYTES_PER_ELEMENT)
			return t.getBufferSubData(r, 0, s), t.bindBuffer(r, null), s
		}
		const B = { debug: !0 },
			q = {
				36054: "FRAMEBUFFER_INCOMPLETE_ATTACHMENT",
				36055: "FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT",
				36057: "FRAMEBUFFER_INCOMPLETE_DIMENSIONS",
				36061: "FRAMEBUFFER_UNSUPPORTED",
				36063: "FRAMEBUFFER_INCOMPLETE_MULTISAMPLE",
			}
		class Y {
			constructor(t) {
				;(t = { ...B, ...t }), (this.debug = t.debug), (this.settings = t), this.setCanvas(t.canvas)
			}
			setCanvas(t) {
				;(this.canvas = t),
					this.canvas instanceof OffscreenCanvas || this.canvas.setAttribute("data-id", this.settings.id)
				const e = { alpha: !0, desynchronized: !0, powerPreference: "high-performance" }
				if (
					((this.gl = this.canvas.getContext("webgl2", e)),
					!this.gl && ((this.gl = this.canvas.getContext("webgl", e)), !this.gl))
				)
					throw new Error("Failed to create WebGL2 | WebGL context")
				const n = this.gl,
					r = n.getSupportedExtensions()
				r.includes("OES_texture_float_linear") && n.getExtension("OES_texture_float_linear"),
					this.debug && (console.log("available_extensions", r), n.getExtension("WEBGL_debug_shaders")),
					n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL, 1),
					n.enable(n.DEPTH_TEST),
					n.enable(n.CULL_FACE),
					n.cullFace(n.BACK),
					n.enable(n.BLEND),
					n.blendFunc(n.SRC_ALPHA, n.ONE_MINUS_SRC_ALPHA),
					n.disable(n.DITHER),
					(this.textureInternalFormat = n.RGBA8),
					(this.textureFormat = n.RGBA),
					(this.textureType = n.UNSIGNED_BYTE)
			}
			resize(t, e) {
				const n = this.canvas,
					r = this.gl
				;(n.width = t), (n.height = e), r.viewport(0, 0, t, e)
			}
			createCubeTexture(
				t,
				e = Math.min(this.canvas.width, this.canvas.height),
				n = this.textureInternalFormat,
				r = this.textureType,
				a = this.textureFormat
			) {
				const s = this.gl,
					i = s.createTexture()
				s.bindTexture(s.TEXTURE_CUBE_MAP, i)
				for (let t = 0; t < 6; t++) s.texStorage2D(s.TEXTURE_2D, 1, n, e, e)
				function o(t) {
					s.pixelStorei(s.UNPACK_FLIP_Y_WEBGL, 0),
						t.forEach((t, e) => {
							s.bindTexture(s.TEXTURE_CUBE_MAP, i),
								s.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X + e, 0, n, a, r, t),
								s.generateMipmap(s.TEXTURE_CUBE_MAP)
						}),
						s.pixelStorei(s.UNPACK_FLIP_Y_WEBGL, 1)
				}
				if (
					(s.generateMipmap(s.TEXTURE_CUBE_MAP),
					s.texParameteri(s.TEXTURE_CUBE_MAP, s.TEXTURE_MIN_FILTER, s.LINEAR_MIPMAP_LINEAR),
					"string" == typeof t)
				) {
					const n = new Image()
					;(n.onload = () => {
						const t = n.width / 4,
							r = []
						r.push(vt(n, e, e, 2 * t, t, t, t)),
							r.push(vt(n, e, e, 0, t, t, t)),
							r.push(vt(n, e, e, t, 0, t, t)),
							r.push(vt(n, e, e, t, 2 * t, t, t)),
							r.push(vt(n, e, e, t, t, t, t)),
							r.push(vt(n, e, e, 3 * t, t, t, t)),
							o(r)
					}),
						(n.onerror = () => console.error("Failed to load image", t)),
						(n.src = t)
				} else {
					const n = t.map(
						(t, n) =>
							new Promise((n, r) => {
								const a = new Image()
								;(a.onload = () => n(vt(a, e, e))),
									(a.onerror = () => console.error("Failed to load image", t)),
									(a.src = t)
							})
					)
					Promise.all(n).then(o)
				}
				return i
			}
			createFramebufferAndTexture(
				t = null,
				e = this.canvas.width,
				n = this.canvas.height,
				r = this.textureInternalFormat,
				a = this.textureType,
				s = this.textureFormat,
				i = !1,
				o = { clamp: !1, filter: "linear" }
			) {
				const u = this.gl,
					c = u.createTexture()
				u.bindTexture(u.TEXTURE_2D, c),
					t instanceof $
						? u.texImage2D(u.TEXTURE_2D, 0, r, e, n, 0, s, a, t._data)
						: u.texImage2D(u.TEXTURE_2D, 0, r, e, n, 0, s, a, t),
					u.texParameteri(u.TEXTURE_2D, u.TEXTURE_WRAP_S, o.clamp ? u.CLAMP_TO_EDGE : u.REPEAT),
					u.texParameteri(u.TEXTURE_2D, u.TEXTURE_WRAP_T, o.clamp ? u.CLAMP_TO_EDGE : u.REPEAT),
					u.texParameteri(u.TEXTURE_2D, u.TEXTURE_MIN_FILTER, "linear" === o.filter ? u.LINEAR : u.NEAREST),
					u.texParameteri(u.TEXTURE_2D, u.TEXTURE_MAG_FILTER, "linear" === o.filter ? u.LINEAR : u.NEAREST)
				const h = u.createFramebuffer()
				u.bindFramebuffer(u.FRAMEBUFFER, h),
					u.framebufferTexture2D(u.FRAMEBUFFER, u.COLOR_ATTACHMENT0, u.TEXTURE_2D, c, 0)
				const l = u.checkFramebufferStatus(u.FRAMEBUFFER)
				if (
					(l !== u.FRAMEBUFFER_COMPLETE && console.log(`WARN: There is a problem with the framebuffer: ${q[l]}`), i)
				) {
					const t = u.createRenderbuffer()
					u.bindRenderbuffer(u.RENDERBUFFER, t),
						u.renderbufferStorage(u.RENDERBUFFER, u.DEPTH_COMPONENT16, e, n),
						u.framebufferRenderbuffer(u.FRAMEBUFFER, u.DEPTH_ATTACHMENT, u.RENDERBUFFER, t),
						u.bindRenderbuffer(u.RENDERBUFFER, null)
				}
				return u.bindFramebuffer(u.FRAMEBUFFER, null), u.bindTexture(u.TEXTURE_2D, null), [h, c]
			}
			bindUniform(t, e, n, r, a, s = 0) {
				switch (!0) {
					case "bool" === n:
						return t.uniform1i(r, a)
					case "float" === n:
						return t.uniform1f(r, a)
					case /float\[\d+\]/.test(n):
						return t.uniform1fv(r, a)
					case "int" === n:
						return t.uniform1i(r, a)
					case "vec2" === n:
						return t.uniform2fv(r, a)
					case "vec3" === n:
						return t.uniform3fv(r, a)
					case "vec4" === n:
						return t.uniform4fv(r, a)
					case "mat4" === n:
						return t.uniformMatrix4fv(r, !1, a)
					case "sampler2D" === n:
						return (
							this.gl.activeTexture(this.gl.TEXTURE0 + s), this.gl.bindTexture(this.gl.TEXTURE_2D, a), t.uniform1i(r, s)
						)
					case "samplerCube" === n:
						return (
							this.gl.activeTexture(this.gl.TEXTURE0 + s),
							this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, a),
							t.uniform1i(r, s)
						)
					default:
						console.warn("Unknown uniform type", n)
				}
			}
			static createShader(t, e, n) {
				const r = t.createShader(e)
				if (!r) return void console.error("Failed to create shader", { type: e, source: n })
				if ((t.shaderSource(r, n), t.compileShader(r), t.getShaderParameter(r, t.COMPILE_STATUS))) return [r, null]
				const a = t.getShaderInfoLog(r)
				return t.deleteShader(r), [null, a]
			}
			static createProgram(t, e, n, r = null, a = 35981) {
				var s = t.createProgram()
				if (s) {
					if (
						(t.attachShader(s, e),
						t.attachShader(s, n),
						r && t.transformFeedbackVaryings(s, r, a),
						t.linkProgram(s),
						t.getProgramParameter(s, t.LINK_STATUS))
					)
						return s
					console.log(t.getProgramInfoLog(s)), t.deleteProgram(s)
				} else console.error("Failed to create program")
			}
		}
		const j = {
				PI: "radians(180.0)",
				HALF_PI: "radians(90.0)",
				TWO_PI: "radians(360.0)",
				RIGHT: "vec3(1.0, 0.0, 0.0)",
				UP: "vec3(0.0, 1.0, 0.0)",
				FORWARD: "vec3(0.0, 0.0, 1.0)",
			},
			X = b.find(t => "src" === t.name)
		let V = 1
		class G {
			constructor(t, e = {}) {
				if (e instanceof $) {
					const [n, r] = ft(e._size)
					e = {
						data: e,
						type: e._type,
						internalFormat: e._type === I ? t.renderer.gl.RGBA32F : t.renderer.gl.RGBA8,
						format: t.renderer.gl.RGBA,
						width: n,
						height: r,
					}
				}
				;(this.name = e.name || "texture_" + V++),
					(this.synth = t),
					(this.width = e.width || t.width),
					(this.height = e.height || t.height),
					(this.ratio = this.width / this.height),
					(this._internalFormat = e.internalFormat || t.renderer.textureInternalFormat),
					(this._format = e.format || t.renderer.textureFormat),
					(this._type = D(e.type || t.renderer.textureType)),
					(this.len = e.len || 1),
					(this.index = 0),
					(this.textures = new Array(this.len)),
					(this.framebuffers = new Array(this.len)),
					(this.updates = 0),
					this.create(e.data),
					this.synth.textures.push(this)
			}
			float() {
				const t = this.synth.renderer.gl
				return (this._internalFormat = t.RGBA32F), (this._format = t.RGBA), (this._type = t.FLOAT), this
			}
			ubyte() {
				const t = this.synth.renderer.gl
				return (this._internalFormat = t.RGBA8), (this._format = t.RGBA), (this._type = t.UNSIGNED_BYTE), this
			}
			type(t) {
				return (this._type = D(t)), this
			}
			format(t, e) {
				return (this._format = t), (this._internalFormat = e || t), this
			}
			internalFormat(t) {
				return (this._internalFormat = t), this
			}
			realloc(t) {
				return (
					(this.len = t),
					(this.textures = new Array(this.len)),
					(this.framebuffers = new Array(this.len)),
					this.create(this.source)
				)
			}
			create(t = null, e) {
				const n = this.synth.renderer.gl
				t && "width" in t && t.width && "height" in t && t.height
					? ((this.width = t.width), (this.height = t.height))
					: t &&
					  "videoWidth" in t &&
					  t.videoWidth &&
					  "videoHeight" in t &&
					  t.videoHeight &&
					  ((this.width = t.videoWidth), (this.height = t.videoHeight)),
					(this.ratio = this.width / this.height)
				for (let t = 0; t < this.len; t++)
					this.textures[t] && (n.deleteTexture(this.textures[t]), (this.textures[t] = null)),
						this.framebuffers[t] && (n.deleteFramebuffer(this.framebuffers[t]), (this.framebuffers[t] = null))
				for (let n = 0; n < this.len; n++) {
					const [r, a] = this.synth.renderer.createFramebufferAndTexture(
						t,
						this.width,
						this.height,
						this._internalFormat,
						this._type,
						this._format,
						!0,
						e
					)
					;(a.name = this.len > 1 ? this.name + "_" + n : this.name), (this.textures[n] = a), (this.framebuffers[n] = r)
				}
				return (
					(this.source = t),
					(this.pixelsData = new (L(this._type))(this.width * this.height * 4)),
					(this.updates = 0),
					this
				)
			}
			components() {
				const t = this.synth.renderer.gl
				switch (this._format) {
					case t.ALPHA:
					case t.LUMINANCE:
					case t.RED:
						return 1
					case t.LUMINANCE_ALPHA:
					case t.RG:
						return 2
					case t.RGB:
						return 3
					case t.RGBA:
						return 4
					default:
						throw new Error("Formato di texture sconosciuto: " + this._format)
				}
			}
			update() {
				if (!this.source) return this
				const t = this.synth.renderer.gl
				return (
					t.bindTexture(t.TEXTURE_2D, this.texture()),
					this.source instanceof $
						? t.texImage2D(
								t.TEXTURE_2D,
								0,
								this._internalFormat,
								this.width,
								this.height,
								0,
								this._format,
								this._type,
								this.source._data
						  )
						: t.texImage2D(t.TEXTURE_2D, 0, this._internalFormat, this._format, this._type, this.source),
					this.updates++,
					this
				)
			}
			texture(t = this.index, e = !1) {
				const n = (t + this.len) % this.len
				return e && (this.index = n), this.textures[n]
			}
			framebuffer(t = this.index, e = !1) {
				const n = (t + this.len) % this.len
				return e && (this.index = n), this.framebuffers[n]
			}
			next() {
				return (this.index = (this.index + 1) % this.len), this
			}
			length(t) {
				return (this.len = t), this.create(this.source)
			}
			pixels(t = this.pixelsData, e = !0) {
				const n = this.synth.renderer.gl,
					r = this.width,
					a = this.height
				if (
					(n.bindFramebuffer(n.FRAMEBUFFER, this.framebuffer()),
					n.readPixels(0, 0, r, a, this._format, this._type, t),
					n.bindFramebuffer(n.FRAMEBUFFER, null),
					e)
				) {
					const e = 4 * r,
						n = Math.floor(a / 2)
					for (let r = 0; r < n; r++) {
						const n = r * e,
							s = (a - r - 1) * e,
							i = t.slice(n, n + e)
						t.copyWithin(n, s, s + e), t.set(i, s)
					}
				}
				return t
			}
			resize(t, e) {
				return (
					(t === this.width && e === this.height) ||
						((this.width = t),
						(this.height = e),
						(this.ratio = this.width / this.height),
						this.source &&
							!(
								this.source instanceof $ ||
								this.source instanceof ImageBitmap ||
								this.source instanceof ImageData ||
								this.source instanceof VideoFrame
							) &&
							((this.source.width = t), (this.source.height = e)),
						this.create(this.source)),
					this
				)
			}
			toGLSLSource() {
				return new ot(this.synth, X, [this])
			}
			init(t) {
				if (t instanceof G) return t.out(this, 0, 0, t.width, t.height, 0, 0, this.width, this.height), this
				this.source = t
				const e = this.synth.renderer.gl
				return (
					e.bindTexture(e.TEXTURE_2D, this.texture()),
					this.source instanceof $
						? e.texImage2D(
								e.TEXTURE_2D,
								0,
								this._internalFormat,
								this.width,
								this.height,
								0,
								this._format,
								this._type,
								this.source._data
						  )
						: e.texImage2D(e.TEXTURE_2D, 0, this._internalFormat, this._format, this._type, this.source),
					e.bindTexture(e.TEXTURE_2D, null),
					this.updates++,
					this
				)
			}
			out(t, e = 0, n = 0, r = this.width, a = this.height, s = e, i = n, o = t.width, u = t.height) {
				const c = this.synth.renderer.gl
				return (
					c.bindFramebuffer(c.READ_FRAMEBUFFER, this.framebuffer()),
					c.bindFramebuffer(c.DRAW_FRAMEBUFFER, t.framebuffer()),
					c.blitFramebuffer(e, n, e + r, n + a, s, i, s + o, i + u, c.COLOR_BUFFER_BIT, c.LINEAR),
					c.bindFramebuffer(c.READ_FRAMEBUFFER, null),
					c.bindFramebuffer(c.DRAW_FRAMEBUFFER, null),
					t.updates++,
					this
				)
			}
			toImage() {
				const t = this.pixels(),
					e = document.createElement("canvas"),
					n = e.getContext("2d")
				;(e.width = this.width), (e.height = this.height)
				const r = n.createImageData(this.width, this.height)
				r.data.set(t), n.putImageData(r, 0, 0)
				const a = new Image()
				return (a.src = e.toDataURL("image/png")), a
			}
			clear() {
				const t = this.synth.renderer.gl
				for (let e = 0; e < this.len; e++)
					this.textures[e] && (t.deleteTexture(this.textures[e]), (this.textures[e] = null)),
						this.framebuffers[e] && (t.deleteFramebuffer(this.framebuffers[e]), (this.framebuffers[e] = null))
			}
		}
		const H = {
				version: "300 es",
				function(t, e, n, r = "", a = !1) {
					const s = H.sanitizeInput(n).map(({ name: t, type: e }) => `${e} ${t}`),
						i = `${c[t].returnType} ${e}(${[...c[t].args, ...s].join(", ")})`
					return a
						? i
						: `${i}{\n\t${(function (t) {
								return t
									.trim()
									.split("\n")
									.map(t => t.replaceAll("\t", "").replaceAll("  ", ""))
									.join("\n\t")
						  })(r)}\n}`
				},
				fragment: (t, e, n = [], r = {}, a = {}) => (
					(e = { ...e }).code || (e.code = []),
					(e.code = e.code.filter(t => "generate" !== t.name)),
					e.code.push({
						type: "src",
						inputs: [],
						name: "generate",
						source: `return ${e && e.value ? e.value(i) : `vec4(${i}, 1.)`};`,
					}),
					H.glsl(
						et,
						t,
						e,
						n,
						r,
						a,
						`\t\t\n\t\t\t\tvec3 ${i} = vec3(gl_FragCoord.xy, .0);\n\t\t\t\t#ifdef HAS_POSITION\n\t\t\t\t${i} = vPosition;\n\t\t\t\t#endif\n\t\t\t\t#ifdef HAS_TEXCOORD\n\t\t\t\t${i} = vec3(vTexcoord, 0.0);\n\t\t\t\t#endif\n\t\t\t\tvec2 uv = ${i}.xy;\n\t\t\t\t\n\t\t\t\tvec4 _color = vec4(1.0);\n\t\t\t\t#ifdef HAS_VERTEXCOLOR\n\t\t\t\t_color = vVertexcolor;\n\t\t\t\t#endif\n\t\t\t\t_color = generate(${i});\n\t\t\t\tfragColor = _color;\n\t\t\t`
					)
				),
				vertex: (t, e, n = [], r = {}, a = {}) => (
					(e = { ...e }).code || (e.code = []),
					(e.code = e.code.filter(t => "generate" !== t.name)),
					e.code.push({
						type: "src",
						inputs: [],
						name: "generate",
						source: `return ${e && e.value ? e.value(i) : `vec4(${i}, 1.)`};`,
					}),
					H.glsl(
						nt,
						t,
						e,
						n,
						r,
						a,
						"\t\n\t\t\t\tmat4 modelViewMatrix = mat4(\n\t\t\t\t\t1.0f, 0.0f, 0.0f, 0.0f,\n\t\t\t\t\t0.0f, 1.0f, 0.0f, 0.0f,\n\t\t\t\t\t0.0f, 0.0f, 1.0f, 0.0f,\n\t\t\t\t\t0.0f, 0.0f, 0.0f, 1.0f\n\t\t\t\t);\n\n\t\t\t\t#ifdef HAS_CAMERA\n\t\t\t\tmodelViewMatrix *= viewMatrix;\n\t\t\t\t#endif\n\n\t\t\t\t#ifdef HAS_MODEL_MATRIX\n\t\t\t\tmodelViewMatrix *= modelMatrix;\n\t\t\t\t#endif\n\n\t\t\t\t#ifdef HAS_NORMAL\n\t\t\t\tvNormal = transpose(inverse(mat3(modelViewMatrix))) * generate(normal).xyz;\n\t\t\t\t#endif\n\t\t\t\t#ifdef HAS_TANGENT\n\t\t\t\tvTangent = generate(tangent.xyz); \n\t\t\t\t#endif\n\n\t\t\t\tvec4 generatedPosition = generate(position);\n\t\t\t\tvPosition = generatedPosition.xyz * 0.5 + 0.5;\n\t\t\t\t#ifdef HAS_CAMERA\n\t\t\t\tgl_Position = projectionMatrix * modelViewMatrix * generatedPosition;\n\t\t\t\t#else\n\t\t\t\tgl_Position = modelViewMatrix * generatedPosition;\n\t\t\t\t#endif\n\n\t\t\t\t#ifdef HAS_TEXCOORD\n\t\t\t\tvTexcoord = texCoord;\n\t\t\t\t#endif\n\t\n\t\t\t\t#ifdef HAS_VERTEXCOLOR\n\t\t\t\tvVertexcolor = vertexColor;\n\t\t\t\t#endif\n\n\t\t\t\t#ifdef HAS_INSTANCE\n\t\t\t\tvInstance = instance;\n\t\t\t\t#endif\n\n\t\t\t\t#ifdef HAS_POINTSIZE\n\t\t\t\t\tgl_PointSize = pointSize;\n\t\t\t\t#endif\n\t\t\t"
					)
				),
				generator(t, e, n = [], r = {}, a = {}) {
					const s = [...(t.defines || [])]
							.map(t => (j[t] ? `#define ${t} ${j[t]}` : t))
							.concat(Object.keys(r).map(t => `#define ${t} ${"boolean" == typeof r[t] ? (r[t] ? 1 : 0) : r[t]}`)),
						i = [...(t.uniforms || []), ...n]
							.filter((t, e, n) => n.findIndex(e => e.name === t.name) === e)
							.map(t => `uniform ${t.type} ${t.name}`)
							.sort((t, e) => t.localeCompare(e)),
						o = [...(t.varyings || []), ...(e ? H.varyngs(e, a) : [])].sort((t, e) => t.localeCompare(e)),
						u = [...(t.utilities || [])].map(t => ut[t] ?? t),
						c = [...(t.functions || [])].map(t => {
							const e = "string" == typeof t ? b.find(e => e.name === t && "code" !== e.type) : t
							return H.function(e.type, e.name, e.inputs, e.glsl)
						}),
						h = [...u, ...c, ...[...(t.code || [])].map(t => H.function(t.type, t.name, t.inputs, t.source))],
						l = (t, e = "") => t.join(e + "\n") + (t.length > 0 ? e : "") + "\n"
					return [l(s), l(i, ";"), l([], ";"), l(o, ";"), l(h)].join("\n").replaceAll(/\n\n\n/g, "\n\n")
				},
				glsl(t, e, n, r = [], a = {}, s = {}, i) {
					const o = H.generator(n, t, r, a, s)
					return [
						`#version ${H.version}`,
						`precision ${e} float;`,
						o,
						"void main() {",
						i.trim().replaceAll(/\t/g, "").replaceAll(/\n/g, "\n\t"),
						"}",
					]
						.join("\n")
						.replaceAll(/\n\n\n/g, "\n\n")
				},
				uniforms(t, e = {}) {
					if (!Array.isArray(e)) return e
					const n = {}
					for (let r = 0, a = e.length; r < a; r++) {
						const a = e[r]
						let s = "function" == typeof a.value ? a.value(t) : a.value
						s instanceof G
							? (s = s.texture())
							: "float" === a.type && Array.isArray(s) && (s = yt(s, { time: t.time, bpm: t.bpm })),
							(n[a.name] = [a.type, s])
					}
					return n
				},
				varyngs(t, e) {
					const n = []
					return (
						Object.keys(e).forEach(r => {
							const { type: a, shader: s, mode: i } = e[r]
							if (void 0 === s || t === s)
								switch (!0) {
									case i === rt.IN || (i === rt.SHARED && t === et):
										n.push(`in ${a} ${r}`)
										break
									case i === rt.OUT || (i === rt.SHARED && t === nt):
										n.push(`out ${a} ${r}`)
								}
						}),
						n
					)
				},
				merge(t, e) {
					t.uniforms || (t.uniforms = []),
						t.functions || (t.functions = []),
						t.utilities || (t.utilities = []),
						t.varyings || (t.varyings = []),
						t.code || (t.code = []),
						t.defines || (t.defines = []),
						(e.uniforms || []).forEach(e => {
							t.uniforms.find(({ name: t }) => t === e.name) || t.uniforms.push(e)
						}),
						(e.functions || []).forEach(e => {
							t.functions.includes(e) || t.functions.push(e)
						}),
						(e.utilities || []).forEach(e => {
							t.utilities.includes(e) || t.utilities.push(e)
						}),
						(e.code || []).forEach(e => {
							t.code.find(t => t.name === e.name) || t.code.push(e)
						}),
						(e.defines || []).forEach(e => {
							t.defines.includes(e) || t.defines.push(e)
						}),
						(e.varyings || []).forEach(e => {
							t.varyings.includes(e) || t.varyings.push(e)
						})
				},
				toUniformType: t => (
					"function" == typeof t && (t = t()),
					Number.isNaN(t) ||
					t instanceof WebGLTexture ||
					t instanceof WebGLFramebuffer ||
					t instanceof G ||
					("number" == typeof t && isNaN(t))
						? "sampler2D"
						: "number" == typeof t
						? "float"
						: (Array.isArray(t) || t instanceof Float32Array) && "number" == typeof t[0]
						? t.length in a
							? a[t.length]
							: `float[${t.length}]`
						: (console.warn(`Uniform type not supported for value "${t}(${typeof t})"`, t), -1)
				),
				sanitizeInput: t =>
					t
						? Array.isArray(t)
							? t
							: Object.entries(t).map(([t, e]) => {
									const n = H.toUniformType(e)
									if (-1 === n)
										throw (
											(console.warn("Generate.sanitizeInput", t, e, n), new Error(`Uniform '${t}' is not supported`))
										)
									return { name: t, default: e, type: n }
							  })
						: [],
				sanitizeUniforms(t) {
					const e = []
					return Array.isArray(t)
						? t
								.map(t => ({ name: t.name, value: t.value || t.default, type: t.type }))
								.filter(({ value: t }) => null !== t)
						: ("object" == typeof t &&
								Object.entries(t).forEach(([t, n]) => {
									if (null !== n) {
										const r = H.toUniformType(n)
										;-1 !== r && e.push({ name: t, value: n, type: r })
									}
								}),
						  e.filter(({ value: t }) => null !== t))
				},
				sanitizeShaderString: (t, e) => (
					t.includes("main") || (t = `void main(){\n${H.sanitizeFunctionCode(t, "")}\n}`),
					t.trim().startsWith("#version") || (t = `#version ${H.version}\n${t}`),
					t.trim().startsWith(`#version ${H.version}\nprecision ${e} float;`) ||
						(t = t.replace(`#version ${H.version}`, `#version ${H.version}\nprecision ${e} float;`)),
					t
				),
				sanitizeFunctionCode(t, e = "return") {
					if (t.length < 1) return t
					const n = (t = (t = t.trim()).replaceAll("\n\n", "\n")).split("\n"),
						r = n.length - 1
					let a = n[r].trim()
					return (
						a || (n.pop(), (a = n[r - 1].trim())),
						t.includes(e) || a.substring(0, 6) === e || (n[r] = e + " " + a),
						";" != (t = n.join("\n")).substring(t.length - 1) && (t += ";"),
						t
					)
				},
				numberFormatter: t => (Number.isInteger(t) ? t + "." : t.toString()),
			},
			W = H
		let Z = 1
		class K {
			constructor(t, e = {}) {
				;(this.synth = t),
					(this.name = e.name || "transformFeedback_" + Z++),
					(this.mode = e.mode || 35981),
					(this._buffers = {}),
					(this.buffer = this.synth.renderer.gl.createTransformFeedback()),
					this.buffers(e.buffers || {})
			}
			buffers(t) {
				const e = this.synth.renderer.gl
				for (const [n, r] of Object.entries(t))
					this._buffers[n] && e.deleteBuffer(this._buffers[n]._buffer),
						(this._buffers[n] = r instanceof $ ? r : new $(this.synth, r))
				return this.bindBuffers()
			}
			keys() {
				return Object.keys(this._buffers)
			}
			bindBuffers() {
				const t = this.synth.renderer.gl
				t.bindTransformFeedback(t.TRANSFORM_FEEDBACK, this.buffer)
				let e = 0
				for (const [n, r] of Object.entries(this._buffers))
					t.bindBuffer(r._target, r._buffer),
						t.bufferData(r._target, r._data, r._usage),
						t.bindBufferBase(t.TRANSFORM_FEEDBACK_BUFFER, e++, r._buffer)
				return t.bindTransformFeedback(t.TRANSFORM_FEEDBACK, null), t.bindBuffer(t.ARRAY_BUFFER, null), this
			}
		}
		let Q = 1
		class J {
			constructor(t, e = {}) {
				;(this.synth = t),
					(this.name = e.name || "vao_" + Q++),
					(this.attributes = {}),
					e.attrs && this.attrs(e.attrs),
					e.cells && this.cells(e.cells),
					(this._elements = e.elements),
					(this._count = e.count),
					(this._rasterizerDiscard = e.rasterizerDiscard ?? !1),
					(this._primitive = e.primitive ?? tt),
					(this.buffer = this.synth.renderer.gl.createVertexArray())
			}
			bindBuffers() {
				const t = this.synth.renderer.gl
				this.buffer && t.deleteVertexArray(this.buffer),
					(this.buffer = t.createVertexArray()),
					t.bindVertexArray(this.buffer)
				for (const [e, n] of Object.entries(this.attributes))
					t.bindBuffer(n._target, n._buffer), t.bufferData(n._target, n._data, n._usage)
				return (
					this.indices &&
						(t.bindBuffer(this.indices._target, this.indices._buffer),
						t.bufferData(this.indices._target, this.indices._data, this.indices._usage)),
					t.bindVertexArray(null),
					this
				)
			}
			attrs(t) {
				for (const [e, n] of Object.entries(t))
					this.attributes[e] && this.attributes[e].destroy(),
						(this.attributes[e] = n instanceof $ ? n : new $(this.synth, n))
				return this.bindBuffers()
			}
			cells(t) {
				return (
					(this.indices =
						t instanceof $
							? t
							: new $(this.synth, { ...(Array.isArray(t) ? { data: Uint16Array.from(t) } : t), target: E })),
					this.bindBuffers()
				)
			}
			elements(t) {
				return (this._elements = t), this
			}
			count(t) {
				return (this._count = t), this
			}
			primitive(t) {
				return (this._primitive = t), this
			}
			rasterizerDiscard(t = !0) {
				return (this._rasterizerDiscard = t), this
			}
			instances(t = 0) {
				return (
					(this._instances = t),
					this._instances > 0
						? this.attrs({
								instance: { data: new Uint8Array([...Array(t).keys()]), size: 1, divisor: 1, type: T, target: A },
								instanceOffset: {
									data: new Float32Array([...Array(t).keys()].map(e => e / t)),
									size: 1,
									divisor: 1,
									type: I,
									target: A,
								},
						  })
						: (delete this.attributes.instance, delete this.attributes.instanceOffset),
					this
				)
			}
			bindVertexAttrs(t) {
				if (!t || !t.program) return console.warn("shader not found or not compiled"), this
				const e = this.synth.renderer.gl
				e.bindVertexArray(this.buffer)
				for (let n in this.attributes) {
					const r = this.attributes[n],
						a = e.getAttribLocation(t.program, n)
					;-1 !== a
						? (e.bindBuffer(r._target, r._buffer),
						  e.enableVertexAttribArray(a),
						  e.vertexAttribPointer(a, r._size, r._type, !1, 0, 0),
						  e.vertexAttribDivisor(a, r._divisor))
						: console.warn(`location ${n} not found`)
				}
				return e.bindVertexArray(null), this
			}
			clone() {
				return new J(this.synth, {
					name: this.name + "_cloned",
					attrs: this.attributes,
					cells: this.indices,
					elements: this._elements,
					count: this._count,
					primitive: this._primitive,
					instances: this._instances,
					rasterizerDiscard: this._rasterizerDiscard,
				})
			}
		}
		const tt = 0,
			et = 35632,
			nt = 35633
		var rt
		!(function (t) {
			;(t[(t.IN = 1)] = "IN"), (t[(t.OUT = 2)] = "OUT"), (t[(t.SHARED = 3)] = "SHARED")
		})(rt || (rt = {}))
		class at {
			constructor(t, e = {}) {
				;(this.program = null),
					(this.uniformsLocation = {}),
					(e = { ...at.defaultGydraShader, ...e }),
					(this.name = e.name),
					(this.synth = t),
					(this.gl = t.renderer.gl),
					(this.drawCalls = 0),
					(this.needsUpdate = !1),
					(this.precision = e.precision || t.precision),
					(this.width = e.width ?? t.width),
					(this.height = e.height ?? t.height),
					(this.defines = { ...(e.defines || {}) }),
					(this._varyings = { ...(e.varyings || {}) }),
					(this.shaderUniforms = {}),
					(this.uniforms = W.sanitizeUniforms(e.uniforms || [])),
					(this._autoClear = !1 !== e.autoClear),
					e.vao && (this.VAO = e.vao instanceof J ? e.vao : new J(this.synth, e.vao)),
					e.transformFeedback &&
						(this._transformFeedback =
							e.transformFeedback instanceof K ? e.transformFeedback : new K(this.synth, e.transformFeedback)),
					void 0 !== e.fragment && this.fragment(e.fragment),
					e.vertex && this.vertex(e.vertex),
					t.shaders.push(this)
			}
			compile() {
				if (this.VAO) {
					for (const [e, n] of Object.entries(this.VAO.attributes))
						(this.defines["HAS_" + e.toUpperCase()] = !0),
							(this._varyings[e] = { type: a[n._size], mode: rt.IN, shader: nt }),
							(this._varyings["v" + ((t = e.toLowerCase()), t.charAt(0).toUpperCase() + t.slice(1))] = {
								type: a[n._size],
								mode: rt.SHARED,
							})
					this.VAO._instances ? (this.defines.INSTANCES = this.VAO._instances) : delete this.defines.INSTANCES
				}
				var t
				this.#t(), this.#e(), this.#n()
			}
			vao(t) {
				return (
					t
						? ((this.VAO = t instanceof J ? t : new J(this.synth, t)), this.program && this.VAO.bindVertexAttrs(this))
						: (this.VAO = null),
					this
				)
			}
			attrs(t) {
				return this.VAO && this.VAO.attrs(t), this
			}
			transformFeedback(t) {
				return (this._transformFeedback = t instanceof K ? t : new K(this.synth, t)), this
			}
			#n() {
				if (
					(this.program && this.gl.deleteProgram(this.program),
					(this.program = Y.createProgram(
						this.gl,
						this.vertexShader,
						this.fragmentShader,
						this._transformFeedback?.keys(),
						this._transformFeedback?.mode
					)),
					!this.program)
				)
					throw new Error("Failed to create program")
				return this.VAO && this.VAO.bindVertexAttrs(this), (this.uniformsLocation = {}), this
			}
			fragment(t) {
				return (
					(this.fragmentSource =
						"boolean" == typeof t
							? W.sanitizeShaderString("", this.precision)
							: "string" == typeof t
							? W.sanitizeShaderString(t, this.precision)
							: t instanceof ot
							? t.generator()
							: t),
					t instanceof ot && (this._varyings = { ...this._varyings, ...at.defaultGydraShader.varyings }),
					this
				)
			}
			vertex(t) {
				return (
					(this.vertexSource =
						"string" == typeof t ? W.sanitizeShaderString(t, this.precision) : t instanceof ot ? t.generator() : t),
					this
				)
			}
			#e() {
				const t =
						"string" != typeof this.fragmentSource
							? W.fragment(this.precision, this.fragmentSource, this.uniforms, this.defines, this._varyings)
							: this.fragmentSource,
					e = this.gl
				this.fragmentShader &&
					this.program &&
					(e.detachShader(this.program, this.fragmentShader), e.deleteShader(this.fragmentShader))
				const [n, r] = Y.createShader(e, e.FRAGMENT_SHADER, t)
				if (r) throw (console.log(ht(t)), new Error(r))
				return (this.fragmentGenerated = t), (this.fragmentShader = n), this
			}
			#t() {
				const t =
					"string" != typeof this.vertexSource
						? W.vertex(this.precision, this.vertexSource, this.uniforms, this.defines, this._varyings)
						: this.vertexSource
				if (this.vertexGenerated === t) return this
				const e = this.gl
				this.vertexShader &&
					this.program &&
					(e.detachShader(this.program, this.vertexShader), e.deleteShader(this.vertexShader))
				const [n, r] = Y.createShader(e, e.VERTEX_SHADER, t)
				if (r) throw (console.log(ht(t)), new Error(r))
				return (this.vertexGenerated = t), (this.vertexShader = n), this
			}
			define(t, e) {
				"string" == typeof t && (t = { [t]: e })
				for (const [e, n] of Object.entries(t)) null !== n ? (this.defines[e] = n) : delete this.defines[e]
				return this
			}
			varyngs(t) {
				return (this._varyings = { ...this._varyings, ...t }), this
			}
			uniform(t, e) {
				t = "string" == typeof t ? { [t]: e } : t
				const n = W.sanitizeUniforms(t)
				for (const t of n) {
					const e = this.uniforms.findIndex(e => e.name === t.name)
					if (e >= 0) {
						if (null === t.value) {
							this.uniforms.splice(e, 1)
							continue
						}
						this.uniforms[e].value = t.value
					} else null !== t && this.uniforms.push(t)
				}
				return this
			}
			resize(t, e) {
				return (
					(this.width = t),
					(this.height = e),
					this.shaderUniforms.resolution && (this.shaderUniforms.resolution = ["vec2", [t, e]]),
					!this.texture || this.texture instanceof st || this.texture.resize(t, e),
					this
				)
			}
			update(t = []) {
				return !1 === this.needsUpdate
					? this
					: ((t = [...t, ...this.uniforms]),
					  "string" != typeof this.fragmentSource &&
							this.fragmentSource &&
							this.fragmentSource.uniforms &&
							(t = [...t, ...this.fragmentSource.uniforms]),
					  "string" != typeof this.vertexSource &&
							this.vertexSource &&
							this.vertexSource.uniforms &&
							(t = [...t, ...this.vertexSource.uniforms]),
					  (this.shaderUniforms = { ...this.shaderUniforms, ...W.uniforms(this.synth, t) }),
					  this.texture &&
							this.uniformsLocation.prevFrame &&
							(this.shaderUniforms.prevFrame = ["sampler2D", this.texture.texture()]),
					  this.draw(this.texture))
			}
			forceUpdate() {
				const t = this.needsUpdate
				return (this.needsUpdate = !0), this.update(), (this.needsUpdate = t), this
			}
			autoClear(t = !0) {
				return (this._autoClear = t), this
			}
			draw(t = this.texture) {
				if (!this.VAO || !this.program)
					return console.warn(`[${this.name}] ${this.VAO ? "Program" : "VAO"} not defined`), this
				const e = this.gl
				e.useProgram(this.program)
				const n = this.bindUniforms(0)
				!t ||
					(this.VAO && this.VAO._rasterizerDiscard) ||
					(t.next(), t.updates++, e.bindFramebuffer(e.FRAMEBUFFER, t.framebuffer())),
					this.VAO &&
						(this.VAO._rasterizerDiscard && e.enable(e.RASTERIZER_DISCARD),
						e.viewport(0, 0, this.width, this.height),
						this._autoClear && (e.clearColor(0, 0, 0, 0), e.clear(e.COLOR_BUFFER_BIT | e.DEPTH_BUFFER_BIT)),
						e.bindVertexArray(this.VAO.buffer),
						this._transformFeedback
							? (e.bindTransformFeedback(e.TRANSFORM_FEEDBACK, this._transformFeedback.buffer),
							  e.beginTransformFeedback(this.VAO._primitive))
							: this.VAO.indices && e.bindBuffer(this.VAO.indices._target, this.VAO.indices._buffer),
						this.VAO._elements > 0
							? this.VAO._instances > 0
								? e.drawElementsInstanced(
										this.VAO._primitive,
										this.VAO._elements,
										this.VAO.indices._type,
										0,
										this.VAO._instances
								  )
								: e.drawElements(this.VAO._primitive, this.VAO._elements, this.VAO.indices._type, 0)
							: e.drawArrays(this.VAO._primitive, 0, this.VAO._count),
						this._transformFeedback && (e.endTransformFeedback(), e.bindTransformFeedback(e.TRANSFORM_FEEDBACK, null)),
						e.bindBuffer(e.ARRAY_BUFFER, null),
						e.bindBuffer(e.ELEMENT_ARRAY_BUFFER, null),
						e.bindVertexArray(null),
						this.VAO._rasterizerDiscard && e.disable(e.RASTERIZER_DISCARD))
				for (let t = 0; t < n; t++) e.activeTexture(e.TEXTURE0 + t), e.bindTexture(e.TEXTURE_2D, null)
				return (
					!t || (this.VAO && this.VAO._rasterizerDiscard) || e.bindFramebuffer(e.FRAMEBUFFER, null),
					this.drawCalls++,
					this
				)
			}
			out(t) {
				return (
					this.compile(),
					t
						? (t instanceof st && (t.attachedSequence && t.attachedSequence.stop(), (t.attachedShader = this)),
						  (this.texture = t))
						: (this.texture && this.texture instanceof st && (this.texture.attachedShader = null),
						  (this.texture = null)),
					this.forceUpdate()
				)
			}
			clear() {
				;(this.uniforms = []),
					(this.shaderUniforms = {}),
					(this.defines = {}),
					(this._varyings = {}),
					(this.vertexSource = null),
					(this.fragmentSource = null),
					(this.vertexGenerated = null),
					(this.fragmentGenerated = null),
					this.activate(!1)
			}
			activate(t = !0, e = !1) {
				if (this.needsUpdate === t && !1 === e) return this
				function n(e) {
					for (const n of e)
						n.value instanceof at || n.value instanceof st
							? n.value.activate(t)
							: n.value instanceof st &&
							  ((n.value.needsUpdate = t), n.value.attachedShader && (n.value.attachedShader.needsUpdate = t))
				}
				;(this.needsUpdate = t),
					"string" != typeof this.fragmentSource &&
						this.fragmentSource &&
						this.fragmentSource.uniforms &&
						n(this.fragmentSource.uniforms),
					"string" != typeof this.vertexSource &&
						this.vertexSource &&
						this.vertexSource.uniforms &&
						n(this.vertexSource.uniforms),
					this.uniforms && n(this.uniforms)
			}
			bindUniforms(t = 0) {
				const e = this.gl
				let n = t
				for (let t = 0, r = Object.keys(this.shaderUniforms), a = r.length; t < a; t++) {
					const a = r[t]
					this.uniformsLocation[a] || (this.uniformsLocation[a] = e.getUniformLocation(this.program, a)),
						null !== this.uniformsLocation[a] &&
							(this.synth.renderer.bindUniform(
								e,
								a,
								this.shaderUniforms[a][0],
								this.uniformsLocation[a],
								this.shaderUniforms[a][1],
								n
							),
							this.shaderUniforms[a][1] instanceof WebGLTexture && n++)
				}
				return n
			}
			static {
				this.defaultGydraShader = {
					vertex: { value: () => `vec4(${i}, 1.0)` },
					varyings: { fragColor: { type: "vec4", mode: rt.OUT, shader: et } },
					uniforms: {},
					defines: {},
				}
			}
			static {
				this.defaultGydraVAO = null
			}
		}
		const st = class extends G {
				constructor(t, e) {
					super(t, { name: "o" + e, len: 2 }), (this.needsUpdate = !0), (this.synth = t)
				}
				generate(t) {
					this.attachedSequence && this.attachedSequence.stop(),
						this.attachedShader
							? (this.attachedShader.clear(),
							  this.attachedShader.define({ ...at.defaultGydraShader.defines }),
							  this.attachedShader.varyngs({ ...at.defaultGydraShader.varyings }),
							  this.attachedShader.uniform({ ...at.defaultGydraShader.uniforms }),
							  this.attachedShader.vao(at.defaultGydraShader.vao),
							  this.attachedShader.vertex({ ...at.defaultGydraShader.vertex }),
							  this.attachedShader.fragment(t))
							: (this.attachedShader = new at(this.synth, {
									name: "shader_output_" + this.name,
									...at.defaultGydraShader,
									fragment: t,
							  })),
						(this.attachedShader.name = "shader_output_" + this.name),
						this.attachedShader.out(this),
						(this.attachedShader.drawCalls = 0),
						this.activate()
				}
				update(t = []) {
					return this.needsUpdate, this
				}
				forceUpdate() {
					this.attachedShader && (this.activate(), this.attachedShader.forceUpdate())
				}
				clear() {
					this.attachedShader?.clear()
				}
				activate(t = !0) {
					;(this.needsUpdate = t), this.attachedShader && this.attachedShader.activate(t)
				}
				resize(t, e) {
					return super.resize(t, e), this.attachedShader && this.attachedShader.resize(t, e), this.forceUpdate(), this
				}
			},
			it = {}
		class ot {
			constructor(t, e, n = [], r) {
				;(this.glsl = ""),
					(this.uniforms = [
						{ name: "time", type: "float", value: () => this.synth.time },
						{ name: "resolution", type: "vec2", value: () => [this.synth.width, this.synth.height] },
						{ name: "mouse", type: "vec2", value: () => [this.synth.mouseX, this.synth.mouseY] },
					]),
					(it[e.name] = (it[e.name] || 0) + 1),
					(this.id = `${r ? r.fn.name + "_" : ""}${e.name}${it[e.name]}`),
					(this.fn = e),
					(this.synth = t),
					(this.name = e.name),
					(this.type = e.type),
					(this.codeType = "code" === e.type ? e.codeType : null),
					(this.glsl = "code" === e.type ? "" : e.glsl),
					(n = "transform" in e ? e.transform(...n) : n),
					(this.inputs =
						("code" === e.type
							? W.sanitizeInput(
									n.slice("combineCoord" === this.codeType || "combine" === this.codeType ? 2 : 1).length > 0
										? n
												.slice("combineCoord" === this.codeType || "combine" === this.codeType ? 2 : 1)
												.reduce((t, e, n) => ((t["t" + n] = e), t), {})
										: {}
							  )
							: W.sanitizeInput(e.inputs)) || []),
					(this.utilities = e.require || []),
					(this.defines = e.defines || []),
					(this.functions = []),
					(this.varyings = []),
					(this.args = n),
					(this.parent = r)
			}
			out(t = this.synth.defaultOutput) {
				t instanceof st
					? ((this.output = t), this.output.generate(this.generator()))
					: t instanceof G
					? new at(this.synth, { fragment: this.generator(), ...at.defaultGydraShader }).out(t)
					: console.warn("Invalid output", t)
			}
			generator() {
				return this.getRoot().generate()
			}
			getRoot() {
				return this.parent ? this.parent.getRoot() : this
			}
			generate(t = t => t) {
				let e = {
						uniforms: this.uniforms,
						utilities: this.utilities,
						functions: [...this.functions, this.name],
						defines: this.defines,
						varyings: this.varyings,
						code: [],
						value: t,
					},
					n = this.name,
					r = this.type,
					a = this.args
				if ("code" === this.type) {
					const t = W.sanitizeFunctionCode(this.args[0])
					;(a = this.args.slice(1)),
						(e.functions = [...this.functions]),
						(e.code = [{ type: this.codeType, name: this.id, source: t, inputs: this.inputs }]),
						(n = this.id),
						(r = this.codeType)
				}
				switch (r) {
					case "src": {
						if (this.parent) {
							const e = this.getRoot()
							;(this.parent.child = null), (this.parent = null)
							const n = new ot(this.synth, this.fn, [e, ...a])
							return (n.id = this.id), this.child && ((this.child.parent = n), (n.child = this.child)), n.generate(t)
						}
						const r = ot.resolveArguments(this.synth, this.id, e, a, this.inputs),
							s = r.length ? ", " + r.join(", ") : ""
						e.value = t => `${n}(${t}${s})`
						break
					}
					case "coord": {
						const r = ot.resolveArguments(this.synth, this.id, e, a, this.inputs),
							s = r.length ? ", " + r.join(", ") : ""
						e.value = e => t(`${n}(${e}${s})`)
						break
					}
					case "color": {
						const r = ot.resolveArguments(this.synth, this.id, e, a, this.inputs),
							s = r.length ? ", " + r.join(", ") : ""
						e.value = e => `${n}(${t(e)}${s})`
						break
					}
					case "combine": {
						const r = ot.resolve(this.synth, a[0], t)
						W.merge(e, r)
						const s = ot.resolveArguments(this.synth, this.id, e, a.slice(1), this.inputs),
							i = s.length ? ", " + s.join(", ") : ""
						e.value = e => `${n}(${t(e)}, ${r.value(e)}${i})`
						break
					}
					case "combineCoord": {
						const r = ot.resolve(this.synth, a[0], t)
						W.merge(e, r)
						const s = ot.resolveArguments(this.synth, this.id, e, a.slice(1), this.inputs),
							i = s.length ? ", " + s.join(", ") : ""
						e.value = e => t(`${n}(${e}, ${r.value(e)}${i})`)
						break
					}
				}
				if (this.child) {
					const t = this.child.generate(e.value)
					W.merge(e, t), (e.value = t.value)
				}
				return e
			}
			static resolve(t, e, n) {
				switch (!0) {
					case e instanceof at:
						e.texture || e.out(new G(t)), (e = e.texture)
					case e instanceof G:
						e = e.toGLSLSource()
					case e instanceof ot:
						return e.getRoot().generate(n)
				}
				return "string" == typeof e
					? { value: () => e }
					: (console.log("GLSLSource resolve warn", [e], "is not type Shader | Texture | GLSLSource"), { value: n })
			}
			static resolveArguments(t, e, n, r, a) {
				return a.map(({ name: a, type: s, default: i }, o) => {
					let u = void 0 === r[o] ? i : r[o]
					if (u instanceof at) {
						const r = `S${e}_${u.name}`
						return (
							void 0 === n.uniforms.find(({ name: t }) => t === r) &&
								(u.texture || u.out(new G(t, { name: r })),
								n.uniforms.push({ type: "sampler2D", name: r, value: u.texture })),
							r
						)
					}
					if (u instanceof ot) {
						const r = `G${e}_${u.name}`
						if (void 0 === n.uniforms.find(({ name: t }) => t === r)) {
							const e = new at(t, { precision: t.precision, name: r, ...at.defaultGydraShader }).fragment(
								u.getRoot().generate()
							)
							e.out(new G(t, { name: r })), n.uniforms.push({ type: "sampler2D", name: r, value: e.texture })
						}
						return r
					}
					if (u instanceof G) {
						const t = `T${e}_${u.name}`
						return (
							n.uniforms.find(({ name: e }) => e === t) || n.uniforms.push({ type: "sampler2D", name: t, value: u }), t
						)
					}
					if (typeof i != typeof u) {
						if ("string" == typeof u) return u
						{
							const t = `U${e}_${a}_${o}`
							return n.uniforms.push({ type: s, name: t, value: u }), t
						}
					}
					return "number" == typeof u
						? "int" === s
							? Math.floor(u)
							: W.numberFormatter(u)
						: Array.isArray(u)
						? /float\[\d+\]/.test(s)
							? `float[${u.length}](${u.map(t => W.numberFormatter(t)).join(", ")})`
							: `vec${u.length}(${u.map((t, e) => ("int" === s ? Math.floor(t) : W.numberFormatter(t))).join(", ")})`
						: (console.warn(`Invalid argument value ${u} for argument ${a}`), i)
				})
			}
			require(...t) {
				return (
					t.forEach(t => {
						let e = b.findIndex(({ name: e }) => e === t)
						if (e >= 0) {
							if (!this.functions.includes(t)) {
								const t = b[e]
								this.functions.push(t.name), t.defines && this.defines.push(...t.defines)
							}
						} else
							"string" == typeof t && t in j
								? this.defines.includes(t) || this.defines.push(t)
								: this.utilities.includes(t) || this.utilities.push(t)
					}),
					this
				)
			}
			uniform(t) {
				return (
					W.sanitizeUniforms(t).forEach(t => {
						void 0 === this.uniforms.find(({ name: e }) => t.name === e) && this.uniforms.push(t)
					}),
					this
				)
			}
		}
		b.map(t => {
			0 !== t.type.indexOf("sd") &&
				(ot.prototype[t.name] = function (...e) {
					const n = this
					return (n.child = new ot(n.synth, t, e, n))
				})
		})
		const ut = {
			noise3d:
				"\n    //\tSimplex 3D Noise\n    //\tby Ian McEwan, Ashima Arts\n    vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}\n\n    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}\n\n    float noise3d(vec3 v) {\n        const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;\n        const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);\n\n        // First corner\n        vec3 i  = floor(v + dot(v, C.yyy) );\n        vec3 x0 =   v - i + dot(i, C.xxx) ;\n\n        // Other corners\n        vec3 g = step(x0.yzx, x0.xyz);\n        vec3 l = 1.0 - g;\n        vec3 i1 = min( g.xyz, l.zxy );\n        vec3 i2 = max( g.xyz, l.zxy );\n\n        //  x0 = x0 - 0. + 0.0 * C\n        vec3 x1 = x0 - i1 + 1.0 * C.xxx;\n        vec3 x2 = x0 - i2 + 2.0 * C.xxx;\n        vec3 x3 = x0 - 1. + 3.0 * C.xxx;\n\n        // Permutations\n        i = mod(i, 289.0 );\n        vec4 p = permute( permute( permute(\n               i.z + vec4(0.0, i1.z, i2.z, 1.0 ))\n             + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))\n             + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));\n\n        // Gradients\n        // ( N*N points uniformly over a square, mapped onto an octahedron.)\n        float n_ = 1.0/7.0; // N=7\n        vec3  ns = n_ * D.wyz - D.xzx;\n\n        vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)\n\n        vec4 x_ = floor(j * ns.z);\n        vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)\n\n        vec4 x = x_ *ns.x + ns.yyyy;\n        vec4 y = y_ *ns.x + ns.yyyy;\n        vec4 h = 1.0 - abs(x) - abs(y);\n\n        vec4 b0 = vec4( x.xy, y.xy );\n        vec4 b1 = vec4( x.zw, y.zw );\n\n        vec4 s0 = floor(b0)*2.0 + 1.0;\n        vec4 s1 = floor(b1)*2.0 + 1.0;\n        vec4 sh = -step(h, vec4(0.0));\n\n        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;\n        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;\n\n        vec3 p0 = vec3(a0.xy,h.x);\n        vec3 p1 = vec3(a0.zw,h.y);\n        vec3 p2 = vec3(a1.xy,h.z);\n        vec3 p3 = vec3(a1.zw,h.w);\n\n        //Normalise gradients\n        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));\n        p0 *= norm.x;\n        p1 *= norm.y;\n        p2 *= norm.z;\n        p3 *= norm.w;\n\n        // Mix final noise value\n        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);\n        m = m * m;\n        return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );\n    }\n    \n    float noise3d(float v) {\n        return noise3d(vec3(v, 0.0, 0.0));\n    }\n\n    float noise3d(float v, float z) {\n        return noise3d(vec3(v, z, 0.0));\n    }\n\n    float noise3d(vec2 v, float z) {\n        return noise3d(vec3(v, z));\n    }\n\n    float noise3d(float x, float y, float z) {\n        return noise3d(vec3(x, y, z));\n    }\n    ",
			luminance:
				"\n        float luminance(vec3 rgb) {\n            const vec3 W = vec3(0.2125, 0.7154, 0.0721);\n\n            return dot(rgb, W);\n        }\n\n        float luminance(vec4 rgba) {\n            return luminance(rgba.rgb);\n        }\n    ",
			rgbToHsv:
				"\n        vec3 rgbToHsv(vec3 c){\n            vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);\n            vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));\n            vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));\n\n            float d = q.x - min(q.w, q.y);\n            float e = 1.0e-10;\n            return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);\n        }\n    ",
			hsvToRgb:
				"\n        vec3 hsvToRgb(vec3 c){\n            vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);\n            vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);\n            return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);\n        }\n    ",
			palette:
				"\n        vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d){\n            return a + b * cos(6.28318*(c*t+d));\n        }\n    ",
			rotate3d:
				"\n    mat2 rotate2d(float angle) {\n        float s = sin(angle);\n        float c = cos(angle);\n        return mat2(c, -s, s, c);\n    }\n\n    mat4 rotationMatrix(vec3 axis, float angle) {\n        axis = normalize(axis);\n        float s = sin(angle);\n        float c = cos(angle);\n        float oc = 1.0 - c;\n        \n        return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,\n                    oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,\n                    oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,\n                    0.0,                                0.0,                                0.0,                                1.0);\n    }\n    \n    vec3 rotate3d(vec3 v, vec3 axis, float angle) {\n        mat4 m = rotationMatrix(axis, angle);\n        return (m * vec4(v, 1.0)).xyz;\n    }\n    ",
			polar:
				"\n    vec2 toPolar(vec2 cartesian){\n        float distance = length(cartesian);\n        float angle = atan(cartesian.y, cartesian.x);\n        return vec2(angle / TWO_PI, distance);\n    }\n    \n    vec2 toCartesian(vec2 polar){\n        vec2 cartesian;\n        cartesian.x = cos(polar.x * TWO_PI);\n        cartesian.y = sin(polar.x * TWO_PI);\n        return cartesian * polar.y;\n    }\n    ",
			map: "\n        float map( float v, float in_min, float in_max, float out_min, float out_max ) {\n            float norm = 0.0;\n            if ( in_min < in_max ) {\n                norm = min(in_max,max(in_min,v)) - in_min;\n                norm /= (in_max-in_min);\n            } else if ( in_min > in_max ) {\n                norm = min(in_min,max(in_max,v)) - in_max;\n                norm /= (in_min-in_max);\n                norm = 1.0-norm;\n            }\n\n            float result = norm * (out_max-out_min) + out_min;\n            float mmin = out_min;\n            float mmax = out_max;\n            if ( out_min > out_max ) {\n                mmin = out_max;\n                mmax = out_min;\n                result = (1.-norm) * (out_min-out_max) + out_max;\n            }\n            return min(mmax,max(mmin,result));\n        }\n    ",
			rand: "\n    float rand(vec2 co) {\n        return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);\n    }\n\n    float rand(float co) {\n        return rand(vec2(co, 0.0));\n    }\n\n    float rand(float x, float y) {\n        return rand(vec2(x, y));\n    }\n    ",
			tuv: "\n    vec2 tuv(float index, vec2 size) {\n        float column = mod(index, size.x);\n        float row    = floor(index / size.y);\n        return vec2(\n            column / (size.y - 1.),\n            row / (size.y - 1.)\n        );\n    }\n    vec2 tuv(float index, ivec2 size) {\n        return tuv(index, vec2(size));\n    }\n    vec2 vuv(float index, float count){\n        float h = floor(sqrt(count));\n        float w = floor(count / h);\n        \n        return tuv(index, vec2(w, h));\n    }\n    ",
			sobel:
				"\n        vec2 _sobel(sampler2D tex, vec2 uv, float spread)\n        {\n            vec3 offset = vec3(1.0 / resolution, 0.0) * spread;\n            vec2 grad = vec2(0.0);\n            grad.x -= luminance(texture(tex, uv - offset.xy)) * 1.0;\n            grad.x -= luminance(texture(tex, uv - offset.xz)) * 2.0;\n            grad.x -= luminance(texture(tex, uv + offset.xy * vec2(-1.0, 1.0))) * 1.0;\n            grad.x += luminance(texture(tex, uv + offset.xy * vec2(1.0, -1.0))) * 1.0;\n            grad.x += luminance(texture(tex, uv + offset.xz)) * 2.0;\n            grad.x += luminance(texture(tex, uv + offset.xy)) * 1.0;\n            grad.y -= luminance(texture(tex, uv - offset.xy)) * 1.0;\n            grad.y -= luminance(texture(tex, uv - offset.zy)) * 2.0;\n            grad.y -= luminance(texture(tex, uv + offset.xy * vec2(1.0, -1.0))) * 1.0;\n            grad.y += luminance(texture(tex, uv + offset.xy * vec2(-1.0, 1.0))) * 1.0;\n            grad.y += luminance(texture(tex, uv + offset.zy)) * 2.0;\n            grad.y += luminance(texture(tex, uv + offset.xy)) * 1.0;\n            return grad;\n        }\t\n    ",
			convolution:
				"\n        vec4 _convolution(sampler2D tex, vec2 st, float kernel[9], vec2 spread) {\n            float kernelWeight = .0;\n            for (int i = 0; i < 9; i++)\n                kernelWeight += kernel[i];\n\n            kernelWeight = max(kernelWeight, 1.0);\n\n            float a = texture(tex, st).a;\n\n            vec4 colorSum =\n                texture(tex, st + spread * vec2(-1, -1)) * kernel[0] +\n                texture(tex, st + spread * vec2( 0, -1)) * kernel[1] +\n                texture(tex, st + spread * vec2( 1, -1)) * kernel[2] +\n                texture(tex, st + spread * vec2(-1,  0)) * kernel[3] +\n                texture(tex, st + spread * vec2( 0,  0)) * kernel[4] +\n                texture(tex, st + spread * vec2( 1,  0)) * kernel[5] +\n                texture(tex, st + spread * vec2(-1,  1)) * kernel[6] +\n                texture(tex, st + spread * vec2( 0,  1)) * kernel[7] +\n                texture(tex, st + spread * vec2( 1,  1)) * kernel[8] ;\n            \n            return vec4((colorSum / kernelWeight).rgb, a);\n        }\n    ",
			drawLine:
				"\n    float drawLine(vec2 st, vec2 resolution, vec2 p1, vec2 p2, float size)\n    {\n        float r = 0.;\n        float one_px = 1. / resolution.x; //not really one px\n        \n        // get dist between points\n        float d = distance(p1, p2);\n        \n        // get dist between current pixel and p1\n        float dst = distance(p1, st);\n\n        //if point is on line, according to dist, it should match current uv \n        r = 1.-floor(1.-(size*one_px)+distance (mix(p1, p2, clamp(dst/d, 0., 1.)),  st));\n            \n        return r;\n    }",
			drawCircle:
				"\n    float drawCircle(vec2 st, vec2 point, float radius) {\n        return (distance(point, st) <= radius) ? 1. : 0.;\n    }",
			opUnion:
				"\n        vec4 opUnion(vec4 d1, vec4 d2, float smth) {\n            if (smth == 0.0) return d1.w < d2.w ? d1 : d2;\n\n            float h = clamp(0.5 + 0.5 * (d2.w - d1.w) / smth, 0.0, 1.0);\n            return mix(d2, d1, h) - smth * h * (1.0 - h);\n        }\n        vec4 opUnion(vec4 d1, vec4 d2) { return opUnion(d1, d2, 0.0);  }\n        float opUnion(float d1, float d2, float smth) { return opUnion(vec4(d1), vec4(d2), smth).w; }\n        float opUnion(float d1, float d2) { return opUnion(d1, d2, 0.0); }\n    ",
			opSub:
				"\n    vec4 opSub(vec4 d1, vec4 d2, float smth) {\n            if (smth == 0.0) return d1.w > -d2.w? d1 : vec4(d2.rgb,-d2.w);\n\n            float h = max(smth-abs(-d1.w-d2.w),0.0);\n            return max(-d1, d2) + h*h*0.25/smth;\n        }\n        vec4 opSub(vec4 d1, vec4 d2) { return opSub(d1, d2, 0.0); }\n        float opSub(float d1, float d2, float smth) { return opSub(vec4(d1), vec4(d2), smth).w; }\n        float opSub(float d1, float d2) { return opSub(d1, d2, 0.0); }\n    ",
			opIntersect:
				"\n        float opIntersect(float d1, float d2, float smth) {\n            if (smth == 0.0) return max(d1,d2);\n\n            float h = clamp(0.5 - 0.5 * (d2 - d1) / smth, 0.0, 1.0);\n            return mix(d2, d1, h) + smth * h * (1.0 - h);\n        }\n        float opIntersect(float d1, float d2) { return opIntersect(d1, d2, 0.0); }\n    ",
			opXor:
				"\n        float opXor(float d1, float d2) {\n            return max(min(d1,d2),-max(d1,d2));\n        }\n    ",
			sdBox:
				"\n        float sdBox(vec3 p, vec3 size) {\n            vec3 q = abs(p) - size;\n            return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);\n        }\n        float sdBox(vec3 p) { return sdBox(p, vec3(0.5)); }\n        float sdBox(vec3 p, float s) { return sdBox(p, vec3(s)); }\n    ",
			sdSphere:
				"\n        float sdSphere(vec3 p, float radius) {\n            return length(p) - radius;\n        }\n        float sdSphere(vec3 p) { return sdSphere(p, .5); }\n    ",
			opRepeat:
				"\n        vec3 opRepeat(vec3 pos, vec3 distance, vec3 limit) {\n            return pos - distance * clamp(round(pos / distance), -limit, limit);\n        }\n        vec3 opRepeat(vec3 pos, float distance, float limit) {\n            return opRepeat(pos, vec3(distance), vec3(limit));\n        }\n        vec3 opRepeat(vec3 pos, vec3 distance, float limit) {\n            return opRepeat(pos, distance, vec3(limit));\n        }\n        vec3 opRepeat(vec3 pos, float distance, vec3 limit) {\n            return opRepeat(pos, vec3(distance), limit);\n        }\n        vec3 opRepeat(vec3 pos) {\n            return opRepeat(pos, 1., 1.);\n        }\n        vec3 opRepeat(vec3 pos, float distance) {\n            return opRepeat(pos, distance, 1.);\n        }\n        vec3 opRepeat(vec3 pos, vec3 distance) {\n            return opRepeat(pos, distance, 1.);\n        }\n    ",
		}
		function ct(t) {
			return new Promise(e => setTimeout(e, t))
		}
		function ht(t = "") {
			return t
				.split("\n")
				.map((t, e) => `${"0".repeat(3 - (e + 1).toString().length) + (e + 1).toString()}: ${t}`)
				.join("\n")
		}
		function lt(t, e) {
			return ((t % e) + e) % e
		}
		function ft(t) {
			const e = Math.sqrt(t)
			let n = 1
			for (let r = Math.floor(e); r > 1; r--)
				if (t % r == 0) {
					n = r
					break
				}
			return [t / n, n]
		}
		const mt = /^(\/)?(.+\/)*(.+)\.(.+)$/i
		function dt(t, e = [-1, 1], n = !1) {
			const r = [],
				a = (e = Array.isArray(e) ? e : [e]).length
			for (let s = 0; s < t; s++) {
				const t = 2 * s,
					i = e[t % a],
					o = e[(t + 1) % a]
				let u = "number" == typeof e ? e : Math.random() * (o - i) + i
				r.push(n ? Math.round(u) : u)
			}
			return r
		}
		function pt([t, e]) {
			for (var n = [], r = 0; r < e; r++)
				for (var a = 0; a < t; a++) {
					var s = (a / (t - 1)) * 2 - 1,
						i = (r / (e - 1)) * 2 - 1
					n.push(s, i)
				}
			return new Float32Array(n)
		}
		function vt(t, e = t.width, n = t.height, r = 0, a = 0, s = t.width, i = t.height) {
			const o = document.createElement("canvas")
			return (
				(o.width = e),
				(o.height = n),
				console.log(s, i, r, a),
				o.getContext("2d").drawImage(t, r, a, s, i, 0, 0, e, n),
				o
			)
		}
		function gt(t = {}) {
			return "string" == typeof t ? { name: t } : t
		}
		function yt(t = [], { time: n, bpm: r }) {
			if ("number" == typeof t) return t
			const a = void 0 !== t._speed ? t._speed : 1,
				s = void 0 !== t._smooth ? t._smooth : 0,
				i = n * a * (r / 60) + (void 0 !== t._offset ? t._offset : 0)
			if (0 !== s) {
				const n = t._ease ? t._ease : e.linear,
					r = i - s / 2,
					a = t[Math.floor(lt(r, t.length))],
					o = t[Math.floor(lt(r + 1, t.length))]
				return n(Math.min(lt(r, 1) / s, 1)) * (o - a) + a
			}
			return t[Math.floor(lt(i, t.length))]
		}
		;(Array.prototype.fast = function (t = 1) {
			return (this._speed = t), this
		}),
			(Array.prototype.smooth = function (t = 1) {
				return (this._smooth = t), this
			}),
			(Array.prototype.ease = function (t = "linear") {
				return (
					"function" == typeof t
						? ((this._smooth = 1), (this._ease = t))
						: e[t]
						? ((this._smooth = 1), (this._ease = e[t]))
						: console.warn(`Unknown easing function: ${t}`),
					this
				)
			}),
			(Array.prototype.offset = function (t = 0.5) {
				return (this._offset = t % 1), this
			}),
			(Array.prototype.fit = function (t = 0, e = 1) {
				let n = Math.min(...this),
					r = Math.max(...this)
				var a = this.map(a => {
					return ((a - (s = n)) * (e - (i = t))) / (r - s) + i
					var s, i
				})
				return (a._speed = this._speed), (a._smooth = this._smooth), (a._ease = this._ease), a
			})
		var xt = n(7691),
			bt = n.n(xt)
		class _t {
			constructor(t, e = 4) {
				;(this.numSlots = 4),
					(this.vol = 0),
					(this.prevBins = []),
					(this.bins = []),
					(this.fft = []),
					(this.settings = []),
					(this.showCanvas = !1),
					(this.isConnected = !1),
					(this.synth = t),
					(this.beat = { holdFrames: 20, threshold: 40, _cutoff: 0, decay: 0.98, _framesSinceBeat: 0 }),
					(this.prevSpectrum = new Float32Array(256)),
					this.setBins(e),
					this.#r(),
					this.createTexture(),
					this.synth.sandbox.export("a", this)
			}
			async start() {
				if (!this.isConnected)
					try {
						const t = new AudioContext(),
							e = await navigator.mediaDevices.getUserMedia({ audio: !0 }),
							n = t.createMediaStreamSource(e)
						;(this.meyda = bt().createMeydaAnalyzer({
							audioContext: t,
							source: n,
							featureExtractors: ["loudness", "amplitudeSpectrum"],
							bufferSize: 512,
						})),
							this.#a(),
							(this.isConnected = !0)
					} catch (t) {
						console.error("Errore nell'ottenere l'accesso al microfono:", t)
					}
			}
			createTexture() {
				const t = this.synth.renderer.gl,
					e = t.createTexture()
				t.bindTexture(t.TEXTURE_2D, e),
					t.texParameteri(t.TEXTURE_2D, t.TEXTURE_WRAP_S, t.CLAMP_TO_EDGE),
					t.texParameteri(t.TEXTURE_2D, t.TEXTURE_WRAP_T, t.CLAMP_TO_EDGE),
					t.texParameteri(t.TEXTURE_2D, t.TEXTURE_MIN_FILTER, t.LINEAR),
					t.texParameteri(t.TEXTURE_2D, t.TEXTURE_MAG_FILTER, t.LINEAR),
					t.texImage2D(t.TEXTURE_2D, 0, t.R32F, 256, 1, 0, t.RED, t.FLOAT, null),
					(this.texture = e)
			}
			#a() {
				var t = this.meyda.get()
				if (t && null !== t) {
					const e = this.settings[0].smooth
					;(this.vol = t.loudness.total * (1 - e) + this.vol * e), this.detectBeat(this.vol)
					const n = (t, e) => t + e,
						r = Math.floor(t.loudness.specific.length / this.bins.length)
					;(this.prevBins = [...this.bins]),
						(this.bins = this.bins
							.map((e, a) => t.loudness.specific.slice(a * r, (a + 1) * r).reduce(n))
							.map((t, e) => t * (1 - this.settings[e].smooth) + this.prevBins[e] * this.settings[e].smooth)),
						(this.fft = this.bins.map((t, e) => Math.max(0, (t - this.settings[e].cutoff) / this.settings[e].scale)))
					const a = this.synth.renderer.gl
					null === this.prevSpectrum && (this.prevSpectrum = new Float32Array(t.amplitudeSpectrum))
					const s = t.amplitudeSpectrum.map(
						(t, e) =>
							t * (1 - this.prevSpectrum[e]) + this.prevSpectrum[e] * this.settings[e % this.settings.length].smooth
					)
					;(this.prevSpectrum = new Float32Array(s)),
						a.bindTexture(a.TEXTURE_2D, this.texture),
						a.texSubImage2D(a.TEXTURE_2D, 0, 0, 0, 256, 1, a.RED, a.FLOAT, s),
						a.bindTexture(a.TEXTURE_2D, null),
						this.draw()
				}
				requestAnimationFrame(() => this.#a())
			}
			setBins(t) {
				;(this.bins = Array(t).fill(0)),
					(this.prevBins = Array(t).fill(0)),
					(this.fft = Array(t).fill(0)),
					(this.settings = Array(t)
						.fill(0)
						.map((t, e) => ({
							cutoff: this.settings[e] && void 0 !== this.settings[e].cutoff ? this.settings[e].cutoff : 2,
							scale: this.settings[e] && void 0 !== this.settings[e].scale ? this.settings[e].scale : 10,
							smooth: this.settings[e] && void 0 !== this.settings[e].smooth ? this.settings[e].smooth : 0.4,
						})))
			}
			setCutoff(t) {
				"number" == typeof t && (t = Array(this.settings.length).fill(t)),
					(this.settings = this.settings.map((e, n) => ((e.cutoff = t[n % this.settings.length]), e)))
			}
			setSmooth(t) {
				"number" == typeof t && (t = Array(this.settings.length).fill(t)),
					(this.settings = this.settings.map((e, n) => ((e.smooth = t[n % this.settings.length]), e)))
			}
			setScale(t) {
				"number" == typeof t && (t = Array(this.settings.length).fill(t)),
					(this.settings = this.settings.map((e, n) => ((e.scale = t[n % this.settings.length]), e)))
			}
			#r() {
				;(this.canvas = document.createElement("canvas")),
					(this.canvas.width = 128),
					(this.canvas.height = 60),
					(this.canvas.style.position = "absolute"),
					(this.canvas.style.right = "0"),
					(this.canvas.style.bottom = "0"),
					(this.canvas.style.top = "auto"),
					(this.canvas.style.left = "auto")
			}
			draw() {
				if (!this.showCanvas || !this.canvas.parentElement) return
				const t = this.canvas.getContext("2d")
				t.clearRect(0, 0, this.canvas.width, this.canvas.height),
					(t.fillStyle = "rgb(200, 200, 200, 0.2)"),
					t.fillRect(0, 0, this.canvas.width, this.canvas.height)
				var e = this.canvas.width / this.bins.length
				this.bins.forEach((n, r) => {
					var a = 4 * n
					;(t.fillStyle = "red"), t.fillRect(r * e, this.canvas.height - a, e, a)
					var s = this.canvas.height - 4 * this.settings[r].cutoff
					t.beginPath(), t.moveTo(r * e, s), t.lineTo((r + 1) * e, s), t.stroke()
					var i = this.canvas.height - 4 * (this.settings[r].scale + this.settings[r].cutoff)
					t.beginPath(), t.moveTo(r * e, i), t.lineTo((r + 1) * e, i), t.stroke()
				})
			}
			setBeat(t) {
				this.beat = { ...this.beat, ...t }
			}
			detectBeat(t) {
				t > this.beat._cutoff && t > this.beat.threshold
					? (this.onBeat(), (this.beat._cutoff = 1.2 * t), (this.beat._framesSinceBeat = 0))
					: this.beat._framesSinceBeat <= this.beat.holdFrames
					? this.beat._framesSinceBeat++
					: ((this.beat._cutoff *= this.beat.decay),
					  (this.beat._cutoff = Math.max(this.beat._cutoff, this.beat.threshold)))
			}
			onBeat() {
				const t = this.synth.sandbox.varyng("onBeat")
				t && t()
			}
			hide() {
				;(this.showCanvas = !1), this.canvas.remove()
			}
			show() {
				;(this.showCanvas = !0), this.canvas.parentElement || document.body.appendChild(this.canvas), this.draw()
			}
		}
		var Mt = n(3765),
			$t = n(159),
			At = n(6867)
		const Et = { fov: (45 * Math.PI) / 180, near: 0.1, far: 1e3, position: [0, 0, 3], target: [0, 0, 0], up: [0, 1, 0] }
		class wt {
			constructor(t, e, n, r) {
				this.synth = t
				const a = { ...Et, ...n }
				switch (
					("perspective" === e && (a.aspect = a.aspect ?? t.width / t.height),
					(this.viewMatrix = $t.create()),
					(this.projectionMatrix = $t.create()),
					(this.props = a),
					(this._position = a.position || [0, 0, 6]),
					(this._target = a.target || [0, 0, 0]),
					(this._up = a.up || [0, 1, 0]),
					e)
				) {
					case "perspective":
						this.perspective(a, r)
						break
					case "orthographic":
						this.orthographic(a)
				}
			}
			perspective(t, e) {
				this.type = "perspective"
				const { fov: n, aspect: r, near: a, far: s } = t
				return (
					$t.perspective(this.projectionMatrix, n, r, a, s),
					$t.lookAt(this.viewMatrix, this._position, this._target, this._up),
					e && (this.control = new St({ element: e, camera: this })),
					this
				)
			}
			orthographic(t) {
				this.type = "orthographic"
				const { left: e, right: n, top: r, bottom: a, near: s, far: i } = t
				return (
					$t.ortho(this.projectionMatrix, e, n, r, a, s, i),
					$t.lookAt(this.viewMatrix, this._position, this._target, this._up),
					this
				)
			}
			static isPerspective(t) {
				return "perspective" === t.type
			}
			updateMatrix() {
				if (wt.isPerspective(this)) {
					const { fov: t, aspect: e, near: n, far: r } = this.props
					$t.perspective(this.projectionMatrix, t, e, n, r),
						$t.lookAt(this.viewMatrix, this._position, this._target, this._up)
				} else {
					const { left: t, right: e, top: n, bottom: r, near: a, far: s } = this.props
					$t.ortho(this.projectionMatrix, t, e, n, r, a, s),
						$t.lookAt(this.viewMatrix, this._position, this._target, this._up)
				}
			}
			resize(t, e) {
				if (wt.isPerspective(this)) this.props.aspect = t / e
				else {
					const n = this.props
					;(n.left = t / -2), (n.right = t / 2), (n.top = e / 2), (n.bottom = e / -2), (this.props = n)
				}
				this.updateMatrix()
			}
			position(t) {
				return (this._position[0] = t[0]), (this._position[1] = t[1]), (this._position[2] = t[2]), this
			}
			target(t) {
				return (this._target[0] = t[0]), (this._target[1] = t[1]), (this._target[2] = t[2]), this
			}
			move(t) {
				return At.add(this._position, this._position, t), this
			}
			rotate(t) {
				return At.add(this._target, this._target, t), this
			}
			update() {}
			zoom() {
				return this.control?.spherical.distance
			}
		}
		const Tt = { minDistance: 0.01, maxDistance: 1e25, sensitivity: { zoom: 0.05, rotate: 0.01 } }
		class St {
			constructor(t) {
				t.sensitivity &&
					"number" == typeof t.sensitivity &&
					(t.sensitivity = { zoom: t.sensitivity, rotate: t.sensitivity }),
					(t = { ...Tt, ...t }),
					(this.element = t.element),
					(this.camera = t.camera),
					(this.minDistance = t.minDistance),
					(this.maxDistance = t.maxDistance),
					(this.sensitivity = t.sensitivity),
					(this.dragging = !1),
					(this.spherical = { distance: this.camera._position[2], polar: Math.PI / 2, azimuth: Math.PI / 2 }),
					(this.truckDistance = 0),
					(this.pedestalDistance = 0),
					(this.onDragStart = this.onDragStart.bind(this)),
					(this.onDragEnd = this.onDragEnd.bind(this)),
					(this.onMove = this.onMove.bind(this)),
					(this.onWheel = this.onWheel.bind(this)),
					this.bindEvents(),
					this.update()
			}
			bindEvents() {
				this.element.addEventListener("wheel", this.onWheel, { passive: !1 }),
					this.element.addEventListener("pointerdown", this.onDragStart, { passive: !1 }),
					this.element.addEventListener("pointermove", this.onMove, { passive: !1 }),
					this.element.addEventListener("pointerup", this.onDragEnd, { passive: !1 })
			}
			update() {
				const { distance: t, polar: e, azimuth: n } = this.spherical,
					r = t * Math.sin(e) * Math.cos(n),
					a = t * Math.cos(e),
					s = t * Math.sin(e) * Math.sin(n)
				;(this.camera._position[0] = r),
					(this.camera._position[1] = a),
					(this.camera._position[2] = s),
					this.camera.updateMatrix()
			}
			onWheel(t) {
				this.adjustSphericalCoordinates(0, 0, -t.deltaY * (t.shiftKey ? 5 : 1)), this.update()
			}
			onDragStart(t) {
				this.dragging = !0
			}
			onMove(t) {
				if (this.dragging) {
					const e = t.movementX,
						n = t.movementY
					t.shiftKey
						? ((this.truckDistance += e * this.sensitivity.rotate),
						  (this.pedestalDistance -= n * this.sensitivity.rotate))
						: this.adjustSphericalCoordinates(e, -n, 0),
						this.update()
				}
			}
			onDragEnd(t) {
				this.dragging = !1
			}
			adjustSphericalCoordinates(t, e, n) {
				const r = this.sensitivity
				;(this.spherical.azimuth += t * r.rotate),
					(this.spherical.polar += e * r.rotate),
					(this.spherical.polar = Math.max(
						this.minDistance,
						Math.min(Math.PI - this.minDistance, this.spherical.polar)
					)),
					(this.spherical.distance -= n * r.zoom),
					(this.spherical.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.spherical.distance)))
			}
		}
		var Rt = n(7788)
		class Ot extends ot {
			constructor(t, e, n, r) {
				super(t, e, n, r), (this.materialUniforms = {}), (this.materialDefines = {}), (this.materialVaryings = {})
			}
			generator() {
				const t = super.generator()
				return (
					W.merge(t, {
						uniforms: Object.keys(this.materialUniforms).map(t => ({
							name: t,
							type: this.materialUniforms[t][0],
							value: this.materialUniforms[t][1],
						})),
						defines: Object.keys(this.materialDefines).map(t => `#define ${t} ${this.materialDefines[t]}`),
					}),
					t
				)
			}
		}
		const Ft = {
			name: "pbr",
			type: "src",
			glsl: `\n\t\tvec2 uv = ${i}.xy;\n\n\t#ifdef HAS_TEXCOORD\n\t\tuv = vTexcoord;\n\t#endif\n\n\t\tvec4 color = vec4(1.0);\n\t#ifdef HAS_BASECOLOR\n\t\tcolor = baseColor;\n\t#endif\n\t#ifdef HAS_VERTEXCOLOR\n\t\tcolor = vVertexcolor;\n\t#endif\n\t#ifdef HAS_BASECOLORTEXTURE\n\t\tcolor = texture(baseColorTexture, vec2(uv.x, 1. - uv.y));\n\t#ifdef HAS_BASECOLORFACTOR\n\t\tcolor *= baseColorFactor;\n\t#endif\n\t#endif\n\n\t#ifdef HAS_NORMAL\n\t\tvec3 normal = normalize(vNormal);\n\t#else\n\t\tvec3 normal = vec3(0.0, 0.0, 1.0);\n\t#endif\n\n\t\tvec3 lightDirection = normalize(vec3(0.5, 0.5, 1.0));\n\t\tfloat light = dot(normal, lightDirection);\n\n\t\treturn vec4(color.rgb * light, color.a);\n\t`,
		}
		_(Ft)
		class It extends Ot {
			constructor(t, e = {}) {
				super(t, Ft),
					(e.baseColor = e.baseColor || [1, 1, 1, 1]),
					Object.keys(e).forEach(t => {
						const n = e[t]
						if (n) {
							const e = W.toUniformType(n)
							;-1 !== e && ((this.materialUniforms[t] = [e, n]), (this.materialDefines["HAS_" + t.toUpperCase()] = 1))
						}
					})
			}
		}
		const Pt = $t.create()
		$t.identity(Pt)
		class Ct extends at {
			constructor(t, e = {}) {
				;(e.vertex = { value: null }),
					(e.fragment = e.fragment ?? { value: () => "vec4(1.)" }),
					super(t, e),
					(this.modelMatrix = $t.clone(Pt)),
					(this.material = e.fragment),
					this.camera(null),
					Object.assign(
						Ct.prototype,
						(function (t, e, n) {
							const r = {
								matrix: t,
								index: 0,
								offset: 1,
								count: 1,
								identity: () => ($t.identity(r.matrix), e || r),
								rotateX: t => ($t.rotateX(r.matrix, r.matrix, t), e || r),
								rotateY: t => ($t.rotateY(r.matrix, r.matrix, t), e || r),
								rotateZ: t => ($t.rotateZ(r.matrix, r.matrix, t), e || r),
								translate: (t, n, a) => ($t.translate(r.matrix, r.matrix, [t, n, a]), e || r),
								translateX: t => ($t.translate(r.matrix, r.matrix, [t, 0, 0]), e || r),
								translateY: t => ($t.translate(r.matrix, r.matrix, [0, 0, t]), e || r),
								translateZ: t => ($t.translate(r.matrix, r.matrix, [0, t, 0]), e || r),
								scale: (t, n = t, a = n) => ($t.scale(r.matrix, r.matrix, [t, n, a]), e || r),
							}
							return r
						})(this.modelMatrix, this)
					),
					(this.defines.HAS_MODEL_MATRIX = !0),
					this.uniforms.push({ name: "modelMatrix", type: "mat4", value: this.modelMatrix })
			}
			vertexColor(...t) {
				if (!this.VAO) return this
				const e = this.VAO._elements || this.VAO._count,
					n = new Float32Array(4 * e)
				for (let e = 0; e < n.length; e += 4)
					(n[e + 0] = t[(e + 0) % t.length]),
						(n[e + 1] = t[(e + 1) % t.length]),
						(n[e + 2] = t[(e + 2) % t.length]),
						(n[e + 3] = t[(e + 3) % t.length])
				return this.VAO.attrs({ vertexColor: { data: n, size: 4 } }), this
			}
			wireframe(t = !0) {
				return (this.VAO._primitive = t ? this.synth.renderer.gl.LINE_LOOP : this.synth.renderer.gl.TRIANGLES), this
			}
			primitive(t = this.synth.renderer.gl.TRIANGLES) {
				return (this.VAO._primitive = t), this
			}
			point(t = 1) {
				return (
					t
						? ((this.VAO._primitive = this.synth.renderer.gl.POINTS),
						  this.uniform({ pointSize: t }),
						  (this.defines.HAS_POINTSIZE = !0))
						: ((this.VAO._primitive = this.synth.renderer.gl.TRIANGLES),
						  this.uniform({ pointSize: null }),
						  delete this.defines.HAS_POINTSIZE),
					this
				)
			}
			camera(t = this.synth._camera) {
				return (
					t
						? ((this.defines.HAS_CAMERA = !0),
						  this.uniform({ viewMatrix: t.viewMatrix, projectionMatrix: t.projectionMatrix }))
						: this.uniform({ viewMatrix: null, projectionMatrix: null }),
					this
				)
			}
			out(t = this.synth.defaultOutput) {
				return super.out(t)
			}
			clear() {
				return (this.modelMatrix = $t.clone(Pt)), this.camera(null), super.clear()
			}
			instances(t = 0) {
				return this.VAO.instances(t), this
			}
		}
		const zt = {
			name: "_flat",
			type: "src",
			glsl: "\n\t\tvec3 pos = vPosition;\n\t\tvec3 fdx = vec3(dFdx(pos.x), dFdx(pos.y), dFdx(pos.z));\n\t\tvec3 fdy = vec3(dFdy(pos.x), dFdy(pos.y), dFdy(pos.z));\n\t\tvec3 normal = normalize(cross(fdx, fdy));\n\t\treturn vec4(normal * 0.5 + 0.5, 1.0);\n\t",
		}
		_(zt)
		class Dt extends Ot {
			constructor(t) {
				super(t, zt)
			}
		}
		var kt = n(9502),
			Nt = n.n(kt)
		const Lt = 2 * Math.PI,
			Ut = Math.PI / 2,
			Bt = Math.sqrt(2)
		function qt(t) {
			const e = 1 / (Math.sqrt(t[0] * t[0] + t[1] * t[1] + t[2] * t[2]) || 1)
			return (t[0] *= e), (t[1] *= e), (t[2] *= e), t
		}
		function Yt(t) {
			const e = typeof t[0]
			"object" !== e && "undefined" !== e && console.error("First argument must be an object.")
		}
		const jt = t => (t <= 255 ? Uint8Array : t <= 65535 ? Uint16Array : Uint32Array),
			Xt = [0, 0, 0],
			Vt = {
				z: [0, 1, 2, 1, -1, 1],
				"-z": [0, 1, 2, -1, -1, -1],
				"-x": [2, 1, 0, 1, -1, -1],
				x: [2, 1, 0, -1, -1, 1],
				y: [0, 2, 1, 1, 1, 1],
				"-y": [0, 2, 1, 1, -1, -1],
			}
		function Gt(t, e, n, r, a, s, i = "z", o = 0, u = !1, c = [1, 1], h = [0, 0], l = [0, 0, 0], f = !0) {
			const { positions: m, normals: d, uvs: p, cells: v } = t,
				[g, y, x, b, _, M] = Vt[i],
				$ = e.vertex
			for (let t = 0; t <= s; t++)
				for (let i = 0; i <= a; i++)
					if (
						((m[3 * e.vertex + g] = (-n / 2 + (i * n) / a) * b + l[g]),
						(m[3 * e.vertex + y] = (-r / 2 + (t * r) / s) * _ + l[y]),
						(m[3 * e.vertex + x] = o + l[x]),
						(d[3 * e.vertex + x] = M),
						(p[2 * e.vertex] = (i / a) * c[0] + h[0]),
						(p[2 * e.vertex + 1] = (1 - t / s) * c[1] + h[1]),
						e.vertex++,
						t < s && i < a)
					) {
						const n = $ + t * (a + 1) + i
						if (u) {
							const r = $ + (t + 1) * (a + 1) + i
							;(v[e.cell] = n), (v[e.cell + 1] = r), (v[e.cell + 2] = r + 1), (v[e.cell + 3] = n + 1)
						} else
							(v[e.cell] = n),
								(v[e.cell + (f ? 1 : 2)] = n + a + 1),
								(v[e.cell + (f ? 2 : 1)] = n + a + 2),
								(v[e.cell + 3] = n),
								(v[e.cell + (f ? 4 : 5)] = n + a + 2),
								(v[e.cell + (f ? 5 : 4)] = n + 1)
						e.cell += u ? 4 : 6
					}
			return t
		}
		const Ht = function ({ sx: t = 1, sy: e = t, sz: n = t } = {}) {
				Yt(arguments)
				const r = t / 2,
					a = e / 2,
					s = n / 2
				return {
					positions: Float32Array.of(
						-r,
						a,
						s,
						-r,
						-a,
						s,
						r,
						-a,
						s,
						r,
						a,
						s,
						r,
						a,
						-s,
						r,
						-a,
						-s,
						-r,
						-a,
						-s,
						-r,
						a,
						-s
					),
					cells: Uint8Array.of(0, 1, 2, 3, 3, 2, 5, 4, 4, 5, 6, 7, 7, 6, 1, 0, 7, 0, 3, 4, 1, 6, 5, 2),
				}
			},
			Wt = function ({ radius: t = 0.5, segments: e = 32, theta: n = Lt, thetaOffset: r = 0, closed: a = !1 } = {}) {
				Yt(arguments)
				const s = new Float32Array(3 * e),
					i = new (jt(e))(2 * (e - (a ? 0 : 1)))
				for (let a = 0; a < e; a++) {
					const o = (a / e) * n + r
					;(s[3 * a] = t * Math.cos(o)),
						(s[3 * a + 1] = t * Math.sin(o)),
						a > 0 && ((i[2 * (a - 1)] = a - 1), (i[2 * (a - 1) + 1] = a))
				}
				return a && ((i[2 * (e - 1)] = e - 1), (i[2 * (e - 1) + 1] = 0)), { positions: s, cells: i }
			},
			Zt = function ({ scale: t = 0.5 } = {}) {
				return (
					Yt(arguments),
					{
						positions: Float32Array.of(-t, -t, 0, t, -t, 0, t, t, 0, -t, t, 0),
						normals: Int8Array.of(0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1),
						uvs: Uint8Array.of(0, 0, 1, 0, 1, 1, 0, 1),
						cells: jt(12).of(0, 1, 2, 2, 3, 0),
					}
				)
			},
			Kt = function ({ sx: t = 1, sy: e = t, nx: n = 1, ny: r = n, direction: a = "z", quads: s = !1 } = {}) {
				Yt(arguments)
				const i = (n + 1) * (r + 1)
				return Gt(
					{
						positions: new Float32Array(3 * i),
						normals: new Float32Array(3 * i),
						uvs: new Float32Array(2 * i),
						cells: new (jt(i))(n * r * (s ? 4 : 6)),
					},
					{ vertex: 0, cell: 0 },
					t,
					e,
					n,
					r,
					a,
					0,
					s
				)
			},
			Qt = function ({
				sx: t = 1,
				sy: e = t,
				nx: n = 1,
				ny: r = n,
				radius: a = 0.25 * t,
				roundSegments: s = 8,
				edgeSegments: i = 1,
			} = {}) {
				Yt(arguments)
				const o = (n + 1) * (r + 1) + (s + 1) * (s + 1) * 4 + (s + 1) * (i + 1) * 4,
					u = {
						positions: new Float32Array(3 * o),
						normals: new Float32Array(3 * o),
						uvs: new Float32Array(2 * o),
						cells: new (jt(o))(6 * (n * r + s * s * 4 + s * i * 4)),
					},
					c = 2 * a,
					h = t - c,
					l = e - c,
					f = h / t,
					m = l / e,
					d = a / t,
					p = a / e,
					v = { vertex: 0, cell: 0 },
					g = (t, e) => [
						[a / (t + c), 0],
						[1 - a / (t + c), 0],
						[1, 1 - a / (e + c)],
						[0, 1 - a / (e + c)],
					],
					y = (t, e) => [0, a / (e + c)],
					x = (t, e) => [1 - a / (t + c), a / (e + c)],
					[b, _, M, $, A, E, w, T, S] = [h, l, n, r, "z", 0, [f, m], [d, p], (t, e) => [t, e, 0]]
				Gt(u, v, b, _, M, $, A, E, !1, w, T)
				for (let t = 0; t < 4; t++) {
					const e = Math.ceil(t / 2) % 2,
						n = Math.floor(t / 2) % 2,
						r = (0 === e ? -1 : 1) * (b + a) * 0.5,
						o = (0 === n ? -1 : 1) * (_ + a) * 0.5,
						h = t % 2 == 0
					Gt(
						u,
						v,
						a,
						a,
						s,
						s,
						h ? "-z" : "z",
						E,
						!1,
						[(a / (b + c)) * (h ? -1 : 1), a / (_ + c)],
						g(b, _)[t],
						S(r, o),
						!h
					),
						(0 !== t && 2 !== t) ||
							(Gt(u, v, a, _, s, i, A, E, !1, [T[0], w[1]], 0 === e ? y(0, _) : x(b, _), S(r, 0)),
							Gt(
								u,
								v,
								b,
								a,
								i,
								s,
								A,
								E,
								!1,
								[w[0], T[1]],
								0 === n ? [...y(0, b)].reverse() : [...x(_, b)].reverse(),
								S(0, o)
							))
				}
				const R = 0.5 * h,
					O = 0.5 * l
				for (let t = 0; t < u.positions.length; t += 3) {
					const e = [u.positions[t], u.positions[t + 1], u.positions[t + 2]]
					;(Xt[0] = e[0]), (Xt[1] = e[1]), (Xt[2] = e[2])
					let n = !1
					if (
						(e[0] < -R
							? e[1] < -O
								? ((e[0] = -R), (e[1] = -O), (n = !0))
								: e[1] > O && ((e[0] = -R), (e[1] = O), (n = !0))
							: e[0] > R &&
							  (e[1] < -O ? ((e[0] = R), (e[1] = -O), (n = !0)) : e[1] > O && ((e[0] = R), (e[1] = O), (n = !0))),
						(Xt[0] -= e[0]),
						(Xt[1] -= e[1]),
						(u.normals[t + 2] = 1),
						n)
					) {
						const n = Math.sqrt(Xt[0] ** 2 + Xt[1] ** 2) / Math.max(Math.abs(Xt[0]), Math.abs(Xt[1]))
						;(u.positions[t] = e[0] + Xt[0] / n), (u.positions[t + 1] = e[1] + Xt[1] / n)
					}
				}
				return u
			},
			Jt = function ({ sx: t = 1, sy: e = 0.5, nx: n, ny: r, roundSegments: a, edgeSegments: s } = {}) {
				return (
					Yt(arguments),
					Qt({ sx: t, sy: e, nx: n, ny: r, radius: 0.5 * Math.min(t, e), roundSegments: a, edgeSegments: s })
				)
			},
			te = t => Math.sqrt(Math.max(t, 0)),
			ee = t => Math.abs(t) < 2 * Number.EPSILON,
			ne = t => (t + 1) / 2,
			re = 4 / Math.PI
		function ae({ uvs: t, index: e, u: n, v: r, radius: a }) {
			const s = n ** 2,
				i = r ** 2,
				o = Math.sqrt(s + i)
			s > i
				? ((t[e] = ne(o * Math.sign(n), a)), (t[e + 1] = ne(o * (re * Math.atan(r / Math.abs(n))), a)))
				: ((t[e] = ne(o * (re * Math.atan(n / (Math.abs(r) + Number.EPSILON))), a)),
				  (t[e + 1] = ne(o * Math.sign(r), a)))
		}
		function se({ uvs: t, index: e, u: n, v: r, radius: a }) {
			const s = n ** 2,
				i = r ** 2
			;(t[e] = ne(Math.sign(n) * Math.abs(n) ** (1 - s - i), a)),
				(t[e + 1] = ne(Math.sign(r) * Math.abs(r) ** (1 - s - i), a))
		}
		function ie({ uvs: t, index: e, u: n, v: r, radius: a }) {
			const s = n ** 2 - r ** 2,
				i = 0.5 * te(2 + s + 2 * Bt * n),
				o = 0.5 * te(2 + s - 2 * Bt * n),
				u = 0.5 * te(2 - s + 2 * Bt * r),
				c = 0.5 * te(2 - s - 2 * Bt * r)
			;(t[e] = ne(i - o, a)), (t[e + 1] = ne(u - c, a))
		}
		function oe({ uvs: t, index: e, u: n, v: r, radius: a }) {
			if (
				(function (t, e, n, r, a) {
					if (!ee(n) && !ee(r)) return !0
					;(t[e] = ne(n, a)), (t[e + 1] = ne(r, a))
				})(t, e, n, r, a)
			) {
				const s = n ** 2,
					i = r ** 2,
					o = Math.sign(n * r),
					u = s + i,
					c = Math.sqrt(u - te(u * (u - 4 * s * i)))
				;(t[e] = ne((o / (r * Bt)) * c, a)), (t[e + 1] = ne((o / (n * Bt)) * c, a))
			}
		}
		const ue = function ({
				sx: t = 1,
				sy: e = 0.5,
				radius: n = 0.5,
				segments: r = 32,
				innerSegments: a = 16,
				theta: s = Lt,
				thetaOffset: i = 0,
				mapping: o = ie,
				equation: u = ({ rx: t, ry: e, cosTheta: n, sinTheta: r }) => [t * n, e * r],
			} = {}) {
				Yt(arguments)
				const c = 1 + (r + 1) + (a - 1) * (r + 1),
					h = new Float32Array(3 * c),
					l = new Float32Array(3 * c),
					f = new Float32Array(2 * c),
					m = new (jt(c))(3 * r + (a - 1) * r * 6)
				;(l[2] = 1), (f[0] = 0.5), (f[1] = 0.5)
				let d = 1,
					p = 0
				for (let c = 0; c < a; c++) {
					const v = (c + 1) / a,
						g = n * v
					for (let y = 0; y <= r; y++, d++) {
						const x = (y / r) * s + i,
							b = Math.cos(x),
							_ = Math.sin(x),
							[M, $] = u({ rx: t * g, ry: e * g, cosTheta: b, sinTheta: _, s: v, t: x })
						if (
							((h[3 * d] = M),
							(h[3 * d + 1] = $),
							(l[3 * d + 2] = 1),
							o({ uvs: f, index: 2 * d, u: v * b, v: v * _, radius: n, t: x, x: M, y: $, sx: t, sy: e }),
							y < r)
						)
							if (0 === c) (m[p] = y + 1), (m[p + 1] = y + 2), (p += 3)
							else if (c < a) {
								const t = 1 + (c - 1) * (r + 1) + y,
									e = t + r + 1,
									n = t + r + 2,
									a = t + 1
								;(m[p] = t), (m[p + 1] = e), (m[p + 2] = a), (m[p + 3] = e), (m[p + 4] = n), (m[p + 5] = a), (p += 6)
							}
					}
				}
				return { positions: h, normals: l, uvs: f, cells: m }
			},
			ce = function ({
				radius: t = 0.5,
				segments: e = 32,
				innerSegments: n = 16,
				theta: r = Lt,
				thetaOffset: a = 0,
				mapping: s = ae,
			} = {}) {
				return (
					Yt(arguments),
					ue({ sx: 1, sy: 1, radius: t, segments: e, innerSegments: n, theta: r, thetaOffset: a, mapping: s })
				)
			},
			he = function ({
				sx: t = 1,
				sy: e = 0.5,
				radius: n = 0.5,
				segments: r = 32,
				innerSegments: a = 16,
				theta: s = Lt,
				thetaOffset: i = 0,
				mapping: o = se,
				m: u = 2,
				n: c = u,
			} = {}) {
				return (
					Yt(arguments),
					ue({
						sx: t,
						sy: e,
						radius: n,
						segments: r,
						innerSegments: a,
						theta: s,
						thetaOffset: i,
						mapping: o,
						equation: ({ rx: t, ry: e, cosTheta: n, sinTheta: r }) => [
							t * Math.abs(n) ** (2 / u) * Math.sign(n),
							e * Math.abs(r) ** (2 / c) * Math.sign(r),
						],
					})
				)
			},
			le = function ({
				sx: t = 1,
				sy: e = 1,
				radius: n = 0.5,
				segments: r = 128,
				innerSegments: a = 16,
				theta: s = Lt,
				thetaOffset: i = 0,
				mapping: o = oe,
				squareness: u = 0.95,
			} = {}) {
				return (
					Yt(arguments),
					ue({
						sx: t,
						sy: e,
						radius: n,
						segments: r,
						innerSegments: a,
						theta: s,
						thetaOffset: i,
						mapping: o,
						equation: ({ rx: t, ry: e, cosTheta: n, sinTheta: r, t: a }) => {
							if (0 === a || a === Lt) return [t, 0]
							if (a === Ut) return [0, e]
							if (a === Math.PI) return [-t, 0]
							if (a === Lt - Ut) return [0, -e]
							{
								const s = Math.sqrt(1 - Math.sqrt(1 - u ** 2 * Math.sin(2 * a) ** 2))
								return [
									((t * Math.sign(n)) / (u * Bt * Math.abs(r))) * s,
									((e * Math.sign(r)) / (u * Bt * Math.abs(n))) * s,
								]
							}
						},
					})
				)
			},
			fe = function ({
				radius: t = 0.5,
				segments: e = 32,
				innerSegments: n = 16,
				theta: r = Lt,
				thetaOffset: a = 0,
				innerRadius: s = 0.5 * t,
				mapping: i = ae,
			} = {}) {
				Yt(arguments)
				const o = (e + 1) * (n + 1),
					u = new Float32Array(3 * o),
					c = new Float32Array(3 * o),
					h = new Float32Array(2 * o),
					l = new (jt(o))(6 * o)
				let f = 0,
					m = 0
				for (let o = 0; o <= n; o++) {
					const d = s + (o / n) * (t - s),
						p = (o + 1) / (n + 1)
					for (let s = 0; s <= e; s++, f++) {
						const v = (s / e) * r + a,
							g = Math.cos(v),
							y = Math.sin(v),
							x = d * g,
							b = d * y
						if (
							((u[3 * f] = x),
							(u[3 * f + 1] = b),
							(c[3 * f + 2] = 1),
							i({ uvs: h, index: 2 * f, u: p * g, v: p * y, radius: t, t: v, x, y: b }),
							s < e && o < n)
						) {
							const t = o * (e + 1) + s,
								n = t + e + 1,
								r = t + e + 2,
								a = t + 1
							;(l[m] = t), (l[m + 1] = n), (l[m + 2] = a), (l[m + 3] = n), (l[m + 4] = r), (l[m + 5] = a), (m += 6)
						}
					}
				}
				return { positions: u, normals: c, uvs: h, cells: l }
			},
			me = function ({
				radius: t = 0.5,
				segments: e = 32,
				innerSegments: n = 16,
				theta: r = Lt,
				thetaOffset: a = 0,
				mapping: s = ae,
				n: i = 3,
			} = {}) {
				Yt(arguments)
				const o = 2 * Math.cos(Math.PI / (2 * i)),
					u = Math.PI / i
				return ue({
					sx: 1,
					sy: 1,
					radius: t,
					segments: e,
					innerSegments: n,
					theta: r,
					thetaOffset: a,
					mapping: s,
					equation: ({ rx: t, ry: e, t: n }) => [
						t *
							(o * Math.cos(0.5 * (n + u * (2 * Math.floor((i * n) / Lt) + 1))) -
								Math.cos(u * (2 * Math.floor((i * n) / Lt) + 1))),
						e *
							(o * Math.sin(0.5 * (n + u * (2 * Math.floor((i * n) / Lt) + 1))) -
								Math.sin(u * (2 * Math.floor((i * n) / Lt) + 1))),
					],
				})
			},
			de = function ({ sx: t = 1, sy: e = t, sz: n = t, nx: r = 1, ny: a = r, nz: s = r } = {}) {
				Yt(arguments)
				const i = (r + 1) * (a + 1) * 2 + (r + 1) * (s + 1) * 2 + (s + 1) * (a + 1) * 2,
					o = {
						positions: new Float32Array(3 * i),
						normals: new Float32Array(3 * i),
						uvs: new Float32Array(2 * i),
						cells: new (jt(i))(6 * (r * a * 2 + r * s * 2 + s * a * 2)),
					},
					u = 0.5 * t,
					c = 0.5 * e,
					h = 0.5 * n,
					l = { vertex: 0, cell: 0 }
				return (
					Gt(o, l, t, e, r, a, "z", h),
					Gt(o, l, t, e, r, a, "-z", -h),
					Gt(o, l, n, e, s, a, "-x", -u),
					Gt(o, l, n, e, s, a, "x", u),
					Gt(o, l, t, n, r, s, "y", c),
					Gt(o, l, t, n, r, s, "-y", -c),
					o
				)
			},
			pe = function ({
				sx: t = 1,
				sy: e = t,
				sz: n = t,
				nx: r = 1,
				ny: a = r,
				nz: s = r,
				radius: i = 0.25 * t,
				roundSegments: o = 8,
				edgeSegments: u = 1,
			} = {}) {
				Yt(arguments)
				const c =
						(r + 1) * (a + 1) * 2 +
						(r + 1) * (s + 1) * 2 +
						(s + 1) * (a + 1) * 2 +
						(o + 1) * (o + 1) * 24 +
						(o + 1) * (u + 1) * 24,
					h = {
						positions: new Float32Array(3 * c),
						normals: new Float32Array(3 * c),
						uvs: new Float32Array(2 * c),
						cells: new (jt(c))(6 * (r * a * 2 + r * s * 2 + s * a * 2 + o * o * 24 + o * u * 24)),
					},
					l = 0.5 * t,
					f = 0.5 * e,
					m = 0.5 * n,
					d = 2 * i,
					p = t - d,
					v = e - d,
					g = n - d,
					y = p / t,
					x = v / e,
					b = g / n,
					_ = i / t,
					M = i / e,
					$ = i / n,
					A = { vertex: 0, cell: 0 },
					E = [
						[p, v, r, a, "z", m, [y, x], [_, M], (t, e) => [t, e, 0]],
						[p, v, r, a, "-z", -m, [y, x], [_, M], (t, e) => [-t, e, 0]],
						[g, v, s, a, "-x", -l, [b, x], [$, M], (t, e) => [0, e, t]],
						[g, v, s, a, "x", l, [b, x], [$, M], (t, e) => [0, e, -t]],
						[p, g, r, s, "y", f, [y, b], [_, $], (t, e) => [t, 0, -e]],
						[p, g, r, s, "-y", -f, [y, b], [_, $], (t, e) => [t, 0, e]],
					],
					w = (t, e) => [
						[0, 0],
						[1 - i / (t + d), 0],
						[1 - i / (t + d), 1 - i / (e + d)],
						[0, 1 - i / (e + d)],
					],
					T = (t, e) => [0, i / (e + d)],
					S = (t, e) => [1 - i / (t + d), i / (e + d)]
				for (let t = 0; t < E.length; t++) {
					const [e, n, r, a, s, c, l, f, m] = E[t]
					Gt(h, A, e, n, r, a, s, c, !1, l, f)
					for (let t = 0; t < 4; t++) {
						const r = Math.ceil(t / 2) % 2,
							a = Math.floor(t / 2) % 2,
							p = (0 === r ? -1 : 1) * (e + i) * 0.5,
							v = (0 === a ? -1 : 1) * (n + i) * 0.5
						Gt(h, A, i, i, o, o, s, c, !1, [i / (e + d), i / (n + d)], w(e, n)[t], m(p, v)),
							(0 !== t && 2 !== t) ||
								(Gt(h, A, i, n, o, u, s, c, !1, [f[0], l[1]], 0 === r ? T(0, n) : S(e, n), m(p, 0)),
								Gt(
									h,
									A,
									e,
									i,
									u,
									o,
									s,
									c,
									!1,
									[l[0], f[1]],
									0 === a ? [...T(0, e)].reverse() : [...S(n, e)].reverse(),
									m(0, v)
								))
					}
				}
				const R = 0.5 * p,
					O = 0.5 * v,
					F = 0.5 * g
				for (let t = 0; t < h.positions.length; t += 3) {
					const e = [h.positions[t], h.positions[t + 1], h.positions[t + 2]]
					;(Xt[0] = e[0]),
						(Xt[1] = e[1]),
						(Xt[2] = e[2]),
						e[0] < -R ? (e[0] = -R) : e[0] > R && (e[0] = R),
						e[1] < -O ? (e[1] = -O) : e[1] > O && (e[1] = O),
						e[2] < -F ? (e[2] = -F) : e[2] > F && (e[2] = F),
						(Xt[0] -= e[0]),
						(Xt[1] -= e[1]),
						(Xt[2] -= e[2]),
						qt(Xt),
						(h.normals[t] = Xt[0]),
						(h.normals[t + 1] = Xt[1]),
						(h.normals[t + 2] = Xt[2]),
						(h.positions[t] = e[0] + i * Xt[0]),
						(h.positions[t + 1] = e[1] + i * Xt[1]),
						(h.positions[t + 2] = e[2] + i * Xt[2])
				}
				return h
			},
			ve = function ({
				radius: t = 1,
				nx: e = 32,
				ny: n = 16,
				rx: r = 0.5,
				ry: a = 0.25,
				rz: s = a,
				theta: i = Math.PI,
				thetaOffset: o = 0,
				phi: u = Lt,
				phiOffset: c = 0,
			} = {}) {
				Yt(arguments)
				const h = (n + 1) * (e + 1),
					l = new Float32Array(3 * h),
					f = new Float32Array(3 * h),
					m = new Float32Array(2 * h),
					d = new (jt(h))(n * e * 6)
				let p = 0,
					v = 0
				for (let h = 0; h <= n; h++) {
					const g = h / n,
						y = g * i + o,
						x = Math.cos(y),
						b = Math.sin(y)
					for (let n = 0; n <= e; n++) {
						const i = n / e,
							o = i * u + c,
							h = Math.cos(o),
							d = Math.sin(o)
						;(Xt[0] = -r * h * b),
							(Xt[1] = -a * x),
							(Xt[2] = s * d * b),
							(l[3 * p] = t * Xt[0]),
							(l[3 * p + 1] = t * Xt[1]),
							(l[3 * p + 2] = t * Xt[2]),
							qt(Xt),
							(f[3 * p] = Xt[0]),
							(f[3 * p + 1] = Xt[1]),
							(f[3 * p + 2] = Xt[2]),
							(m[2 * p] = i),
							(m[2 * p + 1] = g),
							p++
					}
					if (h > 0)
						for (let t = p - 2 * (e + 1); t + e + 2 < p; t++) {
							const n = t,
								r = t + 1,
								a = t + e + 1,
								s = t + e + 2
							;(d[v] = n), (d[v + 1] = r), (d[v + 2] = a), (d[v + 3] = a), (d[v + 4] = r), (d[v + 5] = s), (v += 6)
						}
				}
				return { positions: l, normals: f, uvs: m, cells: d }
			},
			ge = function ({ radius: t = 0.5, nx: e = 32, ny: n = 16, theta: r, thetaOffset: a, phi: s, phiOffset: i } = {}) {
				return (
					Yt(arguments), ve({ radius: t, nx: e, ny: n, theta: r, thetaOffset: a, phi: s, phiOffset: i, rx: 1, ry: 1 })
				)
			},
			ye = 0.5 + Math.sqrt(5) / 2,
			xe = function ({ radius: t = 0.5, subdivisions: e = 2 } = {}) {
				if ((Yt(arguments), e > 10)) throw new Error("Max subdivisions is 10.")
				const n = 10 * Math.pow(4, e) + 2,
					r = n + (0 === e ? 3 : 3 * Math.pow(2, e) + 9),
					a = new Float32Array(3 * r),
					s = new Float32Array(2 * r)
				a.set(
					Float32Array.of(
						-1,
						ye,
						0,
						1,
						ye,
						0,
						-1,
						-ye,
						0,
						1,
						-ye,
						0,
						0,
						-1,
						ye,
						0,
						1,
						ye,
						0,
						-1,
						-ye,
						0,
						1,
						-ye,
						ye,
						0,
						-1,
						ye,
						0,
						1,
						-ye,
						0,
						-1,
						-ye,
						0,
						1
					)
				)
				let i = Uint16Array.of(
						0,
						11,
						5,
						0,
						5,
						1,
						0,
						1,
						7,
						0,
						7,
						10,
						0,
						10,
						11,
						11,
						10,
						2,
						5,
						11,
						4,
						1,
						5,
						9,
						7,
						1,
						8,
						10,
						7,
						6,
						3,
						9,
						4,
						3,
						4,
						2,
						3,
						2,
						6,
						3,
						6,
						8,
						3,
						8,
						9,
						9,
						8,
						1,
						4,
						9,
						5,
						2,
						4,
						11,
						6,
						2,
						10,
						8,
						6,
						7
					),
					o = 12
				const u = e ? {} : null
				function c(t, e) {
					const n = Math.floor(((t + e) * (t + e + 1)) / 2 + Math.min(t, e)),
						r = u[n]
					return void 0 !== r
						? (delete u[n], r)
						: ((u[n] = o),
						  (a[3 * o + 0] = 0.5 * (a[3 * t + 0] + a[3 * e + 0])),
						  (a[3 * o + 1] = 0.5 * (a[3 * t + 1] + a[3 * e + 1])),
						  (a[3 * o + 2] = 0.5 * (a[3 * t + 2] + a[3 * e + 2])),
						  o++)
				}
				let h = i
				const l = e > 5 ? Uint32Array : jt(r)
				for (let t = 0; t < e; t++) {
					const t = h.length
					i = new l(4 * t)
					for (let e = 0; e < t; e += 3) {
						const t = h[e + 0],
							n = h[e + 1],
							r = h[e + 2],
							a = c(t, n),
							s = c(n, r),
							o = c(r, t)
						;(i[4 * e + 0] = t),
							(i[4 * e + 1] = a),
							(i[4 * e + 2] = o),
							(i[4 * e + 3] = n),
							(i[4 * e + 4] = s),
							(i[4 * e + 5] = a),
							(i[4 * e + 6] = r),
							(i[4 * e + 7] = o),
							(i[4 * e + 8] = s),
							(i[4 * e + 9] = a),
							(i[4 * e + 10] = s),
							(i[4 * e + 11] = o)
					}
					h = i
				}
				for (let t = 0; t < 3 * n; t += 3) {
					const e = a[t + 0],
						n = a[t + 1],
						r = a[t + 2],
						s = 1 / Math.sqrt(e * e + n * n + r * r)
					;(a[t + 0] *= s), (a[t + 1] *= s), (a[t + 2] *= s)
				}
				for (let t = 0; t < n; t++)
					(s[2 * t + 0] = -Math.atan2(a[3 * t + 2], a[3 * t]) / Lt + 0.5),
						(s[2 * t + 1] = Math.asin(a[3 * t + 1]) / Math.PI + 0.5)
				const f = {}
				function m(t, e, n, r) {
					if (r) {
						const e = f[t]
						if (void 0 !== e) return e
					}
					return (
						(a[3 * o + 0] = a[3 * t + 0]),
						(a[3 * o + 1] = a[3 * t + 1]),
						(a[3 * o + 2] = a[3 * t + 2]),
						(s[2 * o + 0] = e),
						(s[2 * o + 1] = n),
						r && (f[t] = o),
						o++
					)
				}
				for (let t = 0; t < i.length; t += 3) {
					const e = i[t + 0],
						n = i[t + 1],
						r = i[t + 2]
					let a = s[2 * e],
						o = s[2 * n],
						u = s[2 * r]
					const c = s[2 * e + 1],
						h = s[2 * n + 1],
						l = s[2 * r + 1]
					a - o >= 0.5 && 1 !== c && (o += 1),
						o - u > 0.5 && (u += 1),
						((a < 0.5 && u - a > 0.5) || (1 === a && 0 === l)) && (a += 1),
						o < 0.5 && a - o > 0.5 && (o += 1)
					const f = 0 === c || 1 === c,
						d = 0 === h || 1 === h,
						p = 0 === l || 1 === l
					f
						? ((a = 0.5 * (o + u)), c === 1 - o ? (s[2 * e] = a) : (i[t + 0] = m(e, a, c, !1)))
						: d
						? ((o = 0.5 * (a + u)), h === a ? (s[2 * n] = o) : (i[t + 1] = m(n, o, h, !1)))
						: p && ((u = 0.5 * (a + o)), l === a ? (s[2 * r] = u) : (i[t + 2] = m(r, u, l, !1))),
						a === s[2 * e] || f || (i[t + 0] = m(e, a, c, !0)),
						o === s[2 * n] || d || (i[t + 1] = m(n, o, h, !0)),
						u === s[2 * r] || p || (i[t + 2] = m(r, u, l, !0))
				}
				return { positions: a.map(e => e * t), normals: a, uvs: s, cells: i }
			},
			be = function ({
				height: t = 1,
				radius: e = 0.25,
				nx: n = 16,
				ny: r = 1,
				radiusApex: a = e,
				capSegments: s = 1,
				capApex: i = !0,
				capBase: o = !0,
				capBaseSegments: u = s,
				phi: c = Lt,
			} = {}) {
				Yt(arguments)
				let h = 0
				i && (h += s), o && (h += u)
				const l = n + 1,
					f = r + 1,
					m = l * f + 2 * l * h,
					d = new Float32Array(3 * m),
					p = new Float32Array(3 * m),
					v = new Float32Array(2 * m),
					g = new (jt(m))(6 * (n * r + n * h))
				let y = 0,
					x = 0
				const b = t / 2,
					_ = 1 / (l - 1),
					M = 1 / (f - 1)
				for (let n = 0; n < l; n++) {
					const r = n * _
					for (let n = 0; n < f; n++) {
						const s = n * M,
							i = r * c,
							o = -Math.cos(i),
							u = Math.sin(i),
							h = e * (1 - s) + a * s
						;(d[3 * y] = h * o),
							(d[3 * y + 1] = t * s - b),
							(d[3 * y + 2] = h * u),
							(Xt[0] = t * o),
							(Xt[1] = e - a),
							(Xt[2] = t * u),
							qt(Xt),
							(p[3 * y] = Xt[0]),
							(p[3 * y + 1] = Xt[1]),
							(p[3 * y + 2] = Xt[2]),
							(v[2 * y] = r),
							(v[2 * y + 1] = s),
							y++
					}
				}
				for (let t = 0; t < f - 1; t++)
					for (let e = 0; e < l - 1; e++)
						(g[x + 0] = (e + 0) * f + (t + 0)),
							(g[x + 1] = (e + 1) * f + (t + 0)),
							(g[x + 2] = (e + 1) * f + (t + 1)),
							(g[x + 3] = (e + 0) * f + (t + 0)),
							(g[x + 4] = (e + 1) * f + (t + 1)),
							(g[x + 5] = (e + 0) * f + (t + 1)),
							(x += 6)
				function $(t, e, n, r) {
					const a = y,
						s = 1 / (l - 1)
					for (let a = 0; a < r; a++)
						for (let i = 0; i < l; i++) {
							const o = i * s * c,
								u = -Math.cos(o),
								h = Math.sin(o)
							;(d[3 * y] = (n * u * a) / r),
								(d[3 * y + 1] = e),
								(d[3 * y + 2] = (n * h * a) / r),
								(p[3 * y + 1] = -t),
								(v[2 * y] = (0.5 * u * a) / r + 0.5),
								(v[2 * y + 1] = (0.5 * h * a) / r + 0.5),
								y++,
								(d[3 * y] = (n * u * (a + 1)) / r),
								(d[3 * y + 1] = e),
								(d[3 * y + 2] = (n * h * (a + 1)) / r),
								(p[3 * y + 1] = -t),
								(v[2 * y] = (u * (a + 1) * 0.5) / r + 0.5),
								(v[2 * y + 1] = (h * (a + 1) * 0.5) / r + 0.5),
								y++
						}
					for (let e = 0; e < r; e++)
						for (let n = 0; n < l - 1; n++) {
							const r = a + e * l * 2 + 2 * n,
								s = r + 0,
								i = r + 1,
								o = r + 2,
								u = r + 3
							1 === t
								? ((g[x] = s), (g[x + 1] = o), (g[x + 2] = u), (g[x + 3] = s), (g[x + 4] = u), (g[x + 5] = i))
								: ((g[x + 0] = s), (g[x + 1] = u), (g[x + 2] = o), (g[x + 3] = s), (g[x + 4] = i), (g[x + 5] = u)),
								(x += 6)
						}
				}
				return o && $(1, -b, e, u), i && $(-1, b, a, s), { positions: d, normals: p, uvs: v, cells: g }
			},
			_e = function ({ height: t, radius: e, nx: n, ny: r, capSegments: a, capBase: s, phi: i } = {}) {
				return (
					Yt(arguments),
					be({ height: t, radius: e, nx: n, ny: r, capSegments: a, capBase: s, phi: i, radiusApex: 0, capApex: !1 })
				)
			},
			Me = function ({
				height: t = 0.5,
				radius: e = 0.25,
				nx: n = 16,
				ny: r = 1,
				roundSegments: a = 16,
				phi: s = Lt,
			} = {}) {
				Yt(arguments)
				const i = r + 1,
					o = 2 * a,
					u = o + i,
					c = u * n,
					h = new Float32Array(3 * c),
					l = new Float32Array(3 * c),
					f = new Float32Array(2 * c),
					m = new (jt(c))((u - 1) * (n - 1) * 6)
				let d = 0,
					p = 0
				const v = 1 / (n - 1),
					g = 1 / (o - 1),
					y = 1 / (i - 1)
				function x(r, a, i) {
					for (let o = 0; o < n; o++, d++) {
						const n = -Math.cos(o * v * s) * r,
							u = Math.sin(o * v * s) * r,
							c = e * a + t * i
						;(h[3 * d] = e * n),
							(h[3 * d + 1] = c),
							(h[3 * d + 2] = e * u),
							(l[3 * d] = n),
							(l[3 * d + 1] = a),
							(l[3 * d + 2] = u),
							(f[2 * d] = o * v),
							(f[2 * d + 1] = 1 - (0.5 - c / (2 * e + t)))
					}
				}
				for (let t = 0; t < a; t++) x(Math.sin(Math.PI * t * g), Math.sin(Math.PI * (t * g - 0.5)), -0.5)
				for (let t = 0; t < i; t++) x(1, 0, t * y - 0.5)
				for (let t = a; t < o; t++) x(Math.sin(Math.PI * t * g), Math.sin(Math.PI * (t * g - 0.5)), 0.5)
				for (let t = 0; t < u - 1; t++)
					for (let e = 0; e < n - 1; e++) {
						const r = t * n,
							a = (t + 1) * n,
							s = e + 1
						;(m[p] = r + e),
							(m[p + 1] = r + s),
							(m[p + 2] = a + s),
							(m[p + 3] = r + e),
							(m[p + 4] = a + s),
							(m[p + 5] = a + e),
							(p += 6)
					}
				return { positions: h, normals: l, uvs: f, cells: m }
			},
			$e = function ({
				radius: t = 0.4,
				segments: e = 64,
				minorRadius: n = 0.1,
				minorSegments: r = 32,
				theta: a = Lt,
				thetaOffset: s = 0,
				phi: i = Lt,
				phiOffset: o = 0,
			} = {}) {
				Yt(arguments)
				const u = (r + 1) * (e + 1),
					c = new Float32Array(3 * u),
					h = new Float32Array(3 * u),
					l = new Float32Array(2 * u),
					f = new (jt(u))(r * e * 6)
				let m = 0,
					d = 0
				for (let u = 0; u <= r; u++) {
					const p = u / r
					for (let r = 0; r <= e; r++, m++) {
						const v = r / e,
							g = v * i + o,
							y = -Math.cos(g),
							x = Math.sin(g),
							b = p * a + s,
							_ = -Math.cos(b),
							M = Math.sin(b)
						if (
							((Xt[0] = (t + n * _) * y),
							(Xt[1] = (t + n * _) * x),
							(Xt[2] = n * M),
							(c[3 * m] = Xt[0]),
							(c[3 * m + 1] = Xt[1]),
							(c[3 * m + 2] = Xt[2]),
							(Xt[0] -= t * y),
							(Xt[1] -= t * x),
							qt(Xt),
							(h[3 * m] = Xt[0]),
							(h[3 * m + 1] = Xt[1]),
							(h[3 * m + 2] = Xt[2]),
							(l[2 * m] = v),
							(l[2 * m + 1] = p),
							u > 0 && r > 0)
						) {
							const t = (e + 1) * u + r - 1,
								n = (e + 1) * (u - 1) + r - 1,
								a = (e + 1) * (u - 1) + r,
								s = (e + 1) * u + r
							;(f[d] = t), (f[d + 1] = n), (f[d + 2] = s), (f[d + 3] = n), (f[d + 4] = a), (f[d + 5] = s), (d += 6)
						}
					}
				}
				return { positions: c, normals: h, uvs: l, cells: f }
			},
			Ae = function ({ radius: t = 0.5 } = {}) {
				return (
					Yt(arguments),
					be({
						height: 1.5 * t,
						radius: t,
						nx: 3,
						ny: 1,
						radiusApex: 0,
						capSegments: 0,
						capApex: !1,
						capBaseSegments: 1,
					})
				)
			},
			Ee = function ({ radius: t } = {}) {
				return Yt(arguments), xe({ subdivisions: 0, radius: t })
			},
			we = {
				box: (t, e) => Se(t, "box", Ht, e),
				circle: (t, e) => Se(t, "circle", Wt, e),
				quad: (t, e) => Se(t, "quad", Zt, e),
				plane: (t, e) => Se(t, "plane", Kt, e),
				roundedRectangle: (t, e) => Se(t, "roundedRectangle", Qt, e),
				stadium: (t, e) => Se(t, "stadium", Jt, e),
				ellipse: (t, e) => Se(t, "ellipse", ue, e),
				disc: (t, e) => Se(t, "disc", ce, e),
				superellipse: (t, e) => Se(t, "superellipse", he, e),
				squircle: (t, e) => Se(t, "squircle", le, e),
				annulus: (t, e) => Se(t, "annulus", fe, e),
				reuleux: (t, e) => Se(t, "reuleux", me, e),
				cube: (t, e) => Se(t, "cube", de, e),
				roundedCube: (t, e) => Se(t, "roundedCube", pe, e),
				sphere: (t, e) => Se(t, "sphere", ge, e),
				icosphere: (t, e) => Se(t, "icosphere", xe, e),
				ellipsoid: (t, e) => Se(t, "ellipsoid", ve, e),
				cylinder: (t, e) => Se(t, "cylinder", be, e),
				cone: (t, e) => Se(t, "cone", _e, e),
				capsule: (t, e) => Se(t, "capsule", Me, e),
				torus: (t, e) => Se(t, "torus", $e, e),
				tetrahedron: (t, e) => Se(t, "tetrahedron", Ae, e),
				icosahedron: (t, e) => Se(t, "icosahedron", Ee, e),
				poly: (t, e) => Re(t, e),
				polygon: (t, e) => Re(t, e),
				triangle: (t, e) => Re(t, { ...e, sides: 3 }),
				rect: (t, e) => Re(t, { ...e, sides: 4 }),
				line: (t, e) => Re(t, { ...e, sides: 2 }),
			}
		function Te(t, e, n = 3) {
			return Uint8Array.from(Nt()(t, e, n))
		}
		function Se(t, e, n, r) {
			const a = n((r = gt(r))),
				s = {}
			let i = null
			"positions" in a && (s.position = new $(t, { data: a.positions, size: 3 })),
				"cells" in a && (i = new $(t, { data: a.cells, size: 3, target: E })),
				"normals" in a && (s.normal = new $(t, { data: a.normals, size: 3 })),
				"uvs" in a && (s.texCoord = new $(t, { data: a.uvs, size: 2 }))
			const o = new J(t, { attrs: s, cells: i, elements: a.cells.length, primitive: 4 })
			return new Ct(t, { name: r.name ?? e, ...at.defaultGydraShader, vao: o })
		}
		function Re(t, e) {
			const n = { sides: 5, s: 0.5, a: 0, adaptScale: -Math.PI / 2 }
			let { sides: r, s: a, sx: s, sy: i, a: o, adaptScale: u } = { ...n, ...e }
			;(s = "number" == typeof s ? s : a), (i = "number" == typeof i ? i : a)
			const c = [],
				h = [],
				l = []
			switch (r) {
				case 2:
					c.push(-0.5, 0, 0, 0.5, 0, 0), h.push(0, 0, 1, 0, 0, 1), l.push(0, 0, 1, 0)
					break
				case 3:
					c.push(-0.5, -0.5, 0, 0.5, -0.5, 0, 0, 0.5, 0), h.push(0, 0, 1, 0, 0, 1, 0, 0, 1), l.push(0, 0, 1, 0, 0.5, 1)
					break
				case 4:
					c.push(-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0),
						h.push(0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1),
						l.push(0, 0, 1, 0, 1, 1, 0, 1)
					break
				default:
					for (let t = 0; t < r; t++) {
						const e = o + (t / r) * Math.PI * 2,
							n = Math.cos(e),
							a = Math.sin(e)
						c.push(n * s, a * s, 0), l.push(0.5 * n + 0.5, 0.5 * a + 0.5), h.push(0, 0, 1)
					}
			}
			return Te(c, null, 3), new Ct(t, { name: "polygon" })
		}
		const Oe = we
		class Fe {
			constructor(t, e) {
				;(this.inputs = []),
					(this.values = {}),
					(this.inputChangeCallbacks = {}),
					(this.lastInputs = {}),
					(this.bLoadedScripts = !1),
					(this.started = !1),
					(this.synth = t),
					(this.name = e)
			}
			async loadScripts(t, e = !1) {
				if (((this.scritps = Array.isArray(t) ? t : [t]), e && !this.bLoadedScripts)) {
					if (this.scritps) for (const t of this.scritps) await this.synth.loadScript(t)
					this.bLoadedScripts = !0
				}
			}
			setInput(t, e = void 0, n = !1) {
				this.inputs.push({ name: t, required: n, defaultValue: e })
			}
			onInputChange(t, e) {
				let n = t,
					r = e
				"function" == typeof t && ((n = this.inputs.map(({ name: t }) => t)), (r = t))
				for (const t of n)
					this.inputChangeCallbacks[t] || (this.inputChangeCallbacks[t] = []), this.inputChangeCallbacks[t].push(r)
			}
			async bind(t = {}) {
				if (this.inputs)
					for (const e of this.inputs) {
						let n = t[e.name]
						if (void 0 === n) {
							if (e.required) throw new Error(`Module "${this.name}" init: missing required input "${e.name}"`)
							n = e.defaultValue
						}
						this.values[e.name] = n
					}
				this.createCallback
					? await this.start()
					: console.log(`[MODULE] Module "${this.name}" init: missing create callback`)
			}
			getInputs() {
				return this.inputs.reduce((t, e) => {
					const n = this.values[e.name]
					return (t[e.name] = "function" == typeof n ? n(this.synth) : n), t
				}, {})
			}
			async create(t) {
				this.createCallback = t
			}
			async start() {
				if (!this.bLoadedScripts) {
					if (this.scritps) for (const t of this.scritps) await this.synth.loadScript(t)
					this.bLoadedScripts = !0
				}
				if (Object.keys(this.values).length < this.inputs.filter(({ required: t }) => t).length)
					throw new Error(`Module "${this.name}" init: missing required inputs ` + Object.keys(this.values).join(", "))
				this.createCallback && (await this.createCallback(this.getInputs()), (this.started = !0))
			}
			resize(t, e) {
				this.start()
			}
			async stop() {
				this.started = !1
			}
			onUpdate(t) {
				this.updateCallback = t
			}
			update() {
				if (!this.started) return
				const t = this.getInputs()
				for (const e in t) t[e] !== this.lastInputs[e] && this.inputChangeCallbacks[e]?.forEach(e => e(t))
				;(this.lastInputs = { ...t }), this.updateCallback(this.lastInputs)
			}
			help() {
				const t = this.inputs
						.sort((t, e) => (t.required && !e.required ? -1 : !t.required && e.required ? 1 : 0))
						.map(({ name: t, defaultValue: e, required: n }) => `${t}${n ? "*" : `=${e}`}`),
					e = `${this.name}.bind(\n\t${t.join(",\n\t")}\n)`
				console.log(e)
			}
		}
		class Ie {
			constructor(t = self) {
				;(this.onUnload = null), (this.global = t)
			}
			export(t, e) {
				this.global[t] = e
			}
			remove(t) {
				delete this.global[t]
			}
			varyng(t, e) {
				return this.global[t] || (this.global[t] = e)
			}
			async eval(t) {
				try {
					const e = this.generateCode(t)
					this.onUnload && this.onUnload()
					const n = new Function(e),
						r = await n.call(this.global)
					return r instanceof Error
						? (console.log(ht(n.toString())), r)
						: ((this.onUnload = "function" == typeof r ? r : null), null)
				} catch (t) {
					return t
				}
			}
			generateCode(t) {
				return `\n\t\t\ttry{ \n\t\t\t\twith(this) {\n\t\t\t\t\tasync function code() {\n\t\t\t\t\t\t${t} \n\t\t\t\t\t\treturn null\n\t\t\t\t\t}; \n\t\t\t\t\treturn code();\n\t\t\t\t}\n\t\t\t} catch(e) { return e }\n\t\t`
			}
		}
		class Pe {
			constructor(t, e) {
				;(this.synth = t),
					(this.name = `seq${e}`),
					(this.layers = []),
					(this.currentIndex = 0),
					(this.currentTime = 0),
					(this.layerDuration = []),
					(this.layerSpeed = []),
					(this.running = !1)
			}
			init(...t) {
				return (
					(this.layers = t.map(t => (t instanceof G ? t.toGLSLSource() : t).generator())),
					(this.layerDuration = this.layers.map((t, e) => this.layerDuration[e] ?? 1)),
					(this.layerSpeed = this.layers.map((t, e) => this.layerSpeed[e] ?? 1)),
					(this.currentIndex = (this.currentIndex + this.layers.length) % this.layers.length),
					(this.runnableIndex = this.layers.map((t, e) => e)),
					this
				)
			}
			out(t = this.synth.defaultOutput) {
				return (this.output = t), (this.output.attachedSequence = this), this.start()
			}
			duration(...t) {
				return (this.layerDuration = this.layers.map((e, n) => t[n % t.length] ?? 1)), this
			}
			speed(...t) {
				return (this.layerSpeed = this.layers.map((e, n) => t[n % t.length] ?? 1)), this
			}
			start(...t) {
				return (
					(this.currentTime = 0),
					(this.runnableIndex = t.length > 0 ? t : this.layers.map((t, e) => e)),
					(this.running = !0),
					this.next(this.currentIndex, this.currentIndex)
				)
			}
			stop() {
				return (this.running = !1), this.output && (this.output.attachedSequence = null), this
			}
			update(t) {
				if (!this.running || void 0 === this.output) return
				const e = yt(this.layerSpeed[this.runnableIndex[this.currentIndex]] ?? 1, {
					time: this.synth.time,
					bpm: this.synth.bpm,
				})
				this.currentTime += t * this.synth.speed * e
				const n =
					yt(this.layerDuration[this.runnableIndex[this.currentIndex]] ?? 1, {
						time: this.synth.time,
						bpm: this.synth.bpm,
					}) * e
				this.currentTime > n &&
					((this.currentTime = 0), this.next(this.currentIndex, (this.currentIndex + 1) % this.runnableIndex.length))
			}
			next(t, e) {
				const n = this.layers[this.runnableIndex[e]]
				return (
					n &&
						((n.uniforms = n.uniforms.filter(({ name: t }) => "time" !== t)),
						n.uniforms.push({
							type: "float",
							name: "time",
							value: () => {
								const t = yt(this.layerSpeed[this.runnableIndex[this.currentIndex]] ?? 1, {
									time: this.synth.time,
									bpm: this.synth.bpm,
								})
								return this.synth.time * t * this.synth.speed
							},
						}),
						this.output.generate(n),
						(this.output.attachedSequence = this),
						(this.running = !0),
						(this.currentIndex = e)),
					this
				)
			}
		}
		class Ce extends G {
			constructor(t, e) {
				super(t, { name: "s" + e }), (this.dynamic = !1)
			}
			init(t, e = !1) {
				if ("object" == typeof t && "src" in t) {
					const { src: e, dynamic: n } = t
					return (this.dynamic = n), super.create(e)
				}
				return (this.dynamic = e), super.create(t)
			}
			async initImage(t, e) {
				return new Promise(n => {
					const r = new Image()
					;(r.crossOrigin = "anonymous"),
						(r.src = t),
						r.addEventListener("load", () => {
							;(this.dynamic = !1), this.create(r, e), n(this)
						})
				})
			}
			initText(t, e = "14px monospace", n = "#fff") {
				const r = document.createElement("canvas"),
					a = r.getContext("2d", { alpha: !0 })
				return (
					(r.width = this.synth.width),
					(r.height = this.synth.height),
					(a.fillStyle = n),
					(a.font = e),
					(a.textAlign = "center"),
					(a.textBaseline = "middle"),
					a.fillText(t, r.width / 2, r.height / 2),
					(this.dynamic = !1),
					this.create(r)
				)
			}
			async initCam(
				t,
				e = {
					height: this.synth.height,
					width: this.synth.width,
					aspectRatio: this.synth.width / this.synth.height,
					frameRate: 60,
				}
			) {
				return (function (t, e = {}) {
					return new Promise((n, r) => {
						navigator.mediaDevices
							.enumerateDevices()
							.then(t => t.filter(t => "videoinput" === t.kind))
							.then(n => {
								const r = { audio: !1, video: e }
								return (
									n[t] && (r.video.deviceId = { exact: n[t].deviceId }), window.navigator.mediaDevices.getUserMedia(r)
								)
							})
							.then(t => {
								const e = document.createElement("video")
								;(e.srcObject = t), n(e)
							})
							.catch(console.log.bind(console))
					})
				})(t, e)
					.then(t => this.initVideo(t))
					.catch(t => console.log("could not get camera", t))
			}
			async initScreen(t = { width: this.synth.width, height: this.synth.height, frameRate: 60 }) {
				return ((e = t),
				new Promise(function (t, n) {
					navigator.mediaDevices
						.getDisplayMedia({ video: e })
						.then(e => {
							const n = document.createElement("video")
							;(n.srcObject = e), t(n)
						})
						.catch(t => n(t))
				}))
					.then(t => this.initVideo(t))
					.catch(t => console.log("could not get screen", t))
				var e
			}
			async initVideo(t, e = {}) {
				return new Promise(n => {
					const r = "string" == typeof t ? document.createElement("video") : t
					"string" == typeof t && ((r.src = t), (r.preload = "auto"), (r.playsInline = !0)),
						(r.crossOrigin = "anonymous"),
						(r.muted = void 0 === e.muted || e.muted),
						(r.loop = void 0 === e.loop || e.loop),
						(this.dynamic = !0),
						r.addEventListener("canplay", async () => {
							;(void 0 === e.autoPlay || e.autoPlay) && (await r.play()), n(this.create(r))
						})
				})
			}
			update() {
				if (this.source && this.dynamic) {
					if (this.source instanceof HTMLVideoElement && this.source.readyState === this.source.HAVE_ENOUGH_DATA) {
						const t = this.source,
							e = Math.max(0.1, Math.min(16, this.synth.speed))
						e != t.playbackRate && (t.playbackRate = e)
					}
					super.update()
				}
				return this
			}
			resize(t, e) {
				return this
			}
			clear() {
				if (this.source && this.source instanceof HTMLVideoElement && (this.source.pause(), this.source.srcObject)) {
					const t = this.source.srcObject
					t instanceof MediaStream && t.getTracks().forEach(t => t.stop())
				}
				super.clear()
			}
		}
		function ze(t, e) {
			const [n, r] = ft(e)
			let a = `#version 300 es\n\t\n\t  precision ${t} float;\n\n\t  in vec3 vPosition;\n\t`
			for (let t = 0; t < e; t++) a += `\n\t\tuniform sampler2D o${t};`
			return (
				(a += `\n\t\tout vec4 fragColor;\n\t\t\n\t\tvoid main() {\n\t\t\tvec2 st = vPosition.xy;\n\t\t\t//st.y = 1. - st.y;\n\t\t\tvec2 texSize = vec2(1.0 / ${n.toFixed(
					6
				)}, 1.0 / ${r.toFixed(
					6
				)});\n\t\t\tvec2 texCoord = floor(st / texSize);\n\t\n\t\t\t// Calculate the index based on the texture coordinates\n\t\t\tfloat index = texCoord.x + texCoord.y * ${n.toFixed(
					6
				)};\n\t\t\tindex = mod(index, float(${e.toFixed(
					6
				)}));\n\n\t\t\t// Calculate the row and column indices\n\t\t\tint rowIndex = int(index / ${n.toFixed(
					6
				)});\n\t\t\tint colIndex = int(mod(index, ${n.toFixed(
					6
				)}));\n\n\t\t\t// Calculate the UV coordinates for the selected texture\n\t\t\tvec2 uvCoord = (st - vec2(texSize.x * float(colIndex), texSize.y * float(rowIndex))) / texSize;\n\t\t\t\n\t\t\t// Assign textures based on index\n\t\t\t${Array.from(
					{ length: e },
					(t, e) => `\n\t\t\tif (index == ${e}.0) {\n\t\t\t\tfragColor = texture(o${e}, uvCoord);\n\t\t\t}`
				).join("\n")}\n\t\t}\n\t`),
				a
			)
		}
		const De = class {
				constructor(t) {
					;(this.time = 0),
						(this.deltaTime = 0),
						(this.mouseX = 0),
						(this.mouseY = 0),
						(this.speed = 1),
						(this.bpm = 60),
						(this.s = []),
						(this.o = []),
						(this.seq = []),
						(this.t = []),
						(this.shaders = []),
						(this.textures = []),
						(this.lastTime = 0),
						(this.modules = {}),
						(this.id = Math.random().toString(36).substr(2, 9)),
						(this.settings = t),
						(this.width = this.settings.width || 400),
						(this.height = this.settings.height || this.width),
						(this.precision = this.settings.precision || "highp"),
						(this.sandbox = new Ie(this.settings.makeGlobal ? n.g : this))
					const e = this.settings.canvas
					e instanceof OffscreenCanvas || (e.style.imageRendering = "pixelated"),
						this.canvas(e),
						this.createHelpers(),
						b
							.filter(t => "src" === t.type || ("code" === t.type && "src" === t.codeType))
							.forEach(t => this.export(t.name, (...e) => new ot(this, t, e))),
						this.export("require", this.require),
						this.export("include", this.include),
						Object.keys(Oe).forEach(t => {
							this.export(t, e => Oe[t](this, e))
						}),
						this.export("time", this.time),
						this.export("deltaTime", this.deltaTime),
						this.export("mouseX", this.mouseX),
						this.export("mouseY", this.mouseY),
						this.sandbox.varyng("speed", this.speed),
						this.sandbox.varyng("bpm", this.bpm),
						this.sandbox.varyng("precision", this.precision),
						this.sandbox.varyng("update", null),
						this.sandbox.varyng("setFunction", _),
						this.export("resize", this.resize.bind(this)),
						this.export("render", this.render.bind(this)),
						this.export("loadScript", this.loadScript),
						this.export("hush", this.hush.bind(this)),
						this.export("module", this.module.bind(this)),
						this.export("texture", t => new G(this, gt(t))),
						this.export("cubemap", t => this.renderer.createCubeTexture(t)),
						this.export("buffer", t => new $(this, gt(t))),
						this.export("vao", t => new J(this, gt(t))),
						this.export("baseVao", () => at.defaultGydraVAO),
						this.export("transformFeedback", t => new K(this, t)),
						this.export("triangulate", Te),
						this.export("shader", t => new at(this, gt(t))),
						this.export("camera", (t, e, n) => (t ? new wt(this, t, e, n) : this._camera)),
						this.export("model", t => new Ct(this, gt(t))),
						this.export("gltf", t =>
							(function (t, e) {
								return new Promise((n, r) => {
									const a = t.renderer.gl
									Rt.u7(a, e)
										.then(r => {
											const a = (function (t) {
													const e = mt.exec(t)
													return e ? e[3] : null
												})(e),
												s = void 0 !== r.meshes[0].material ? r.materials[r.meshes[0].material] : null
											let i = null
											s && (i = new It(t, s))
											const o = {}
											let u = null
											r.meshes[0].positions && (o.position = new $(t, r.meshes[0].positions)),
												r.meshes[0].indices && (u = new $(t, r.meshes[0].indices)),
												r.meshes[0].normals && (o.normal = new $(t, r.meshes[0].normals)),
												r.meshes[0].texCoord && (o.texCoord = new $(t, r.meshes[0].texCoord)),
												r.meshes[0].tangents && (o.tangent = new $(t, r.meshes[0].tangents)),
												Object.keys(o).forEach(t => {
													o[t].name = a + "_" + t
												}),
												u && (u.name = a + "_indices")
											const c = new Ct(t, {
												name: a,
												...at.defaultGydraShader,
												fragment: i,
												vao: { attrs: o, cells: u, elements: r.meshes[0].elementCount || u._data.length, primitive: 4 },
											})
											n(c)
										})
										.catch(r)
								})
							})(this, t)
						),
						this.export("frag", (t, e) =>
							(function (t, e, n) {
								return new Promise((r, a) => {
									fetch(e)
										.then(t => t.text())
										.then(e => {
											const a = new at(t, {
												...n,
												fragment: e,
												uniforms: [
													{ name: "time", type: "float", value: () => t.time },
													{ name: "resolution", type: "vec2", value: () => [t.width, t.height] },
													{ name: "mouse", type: "vec2", value: () => [t.mouseX, t.mouseY] },
												],
											})
											r(a)
										})
										.catch(a)
								})
							})(this, t, gt(e))
						),
						this.export("flat", () => new Dt(this)),
						this.export("pbr", t => new It(this, t)),
						this.export("renderer", this.renderer),
						this.export("gridSize", t => ft(t)),
						Object.keys(Mt).forEach(t => this.export(t, Mt[t])),
						Object.getOwnPropertyNames(Math).forEach(t => this.export(t, Math[t])),
						this.export("synth", this),
						this.export("log", console.log.bind(console)),
						this.export("tick", this.tick.bind(this)),
						this.export("array", dt),
						this.export("texCoords", pt),
						this.export("sleep", ct),
						(this.autoTick = this.autoTick.bind(this)),
						this.settings.autoTick && this.start()
				}
				export(t, e) {
					this.sandbox.export(t, e)
				}
				canvas(t) {
					const e = !!this.tickItv
					e && cancelAnimationFrame(this.tickItv),
						(this.renderer = new Y({ id: this.id, canvas: t, debug: this.settings.debug })),
						(at.defaultGydraVAO = new J(this, {
							name: "baseVao",
							attrs: { position: { data: new Float32Array([-1, 1, 0, 1, 1, 0, -1, -1, 0, 1, -1, 0]), size: 3 } },
							cells: { data: new Uint16Array([0, 2, 3, 0, 3, 1]), size: 1, type: R, target: E },
							elements: 6,
							primitive: 4,
						})),
						(at.defaultGydraShader.vao = at.defaultGydraVAO),
						this.export("gl", this.renderer.gl),
						(this._camera = new wt(
							this,
							"perspective",
							{},
							this.settings.cameraControl ? this.settings.cameraControl : t instanceof OffscreenCanvas ? null : t
						))
					for (let t = 0; t < this.settings.outputs; t++)
						delete this.o[t], (this.o[t] = new st(this, t)), this.export("o" + t, this.o[t])
					;(this.defaultOutput = this.o[0]), (this.renderOutput = this.defaultOutput)
					for (let t = 0; t < this.settings.sources; t++)
						delete this.s[t], (this.s[t] = new Ce(this, t)), this.export("s" + t, this.s[t])
					for (let t = 0; t < this.settings.sequences; t++)
						delete this.seq[t], (this.seq[t] = new Pe(this, t)), this.export("seq" + t, this.seq[t])
					;(this.drawer = new at(this, {
						name: "drawer",
						...at.defaultGydraShader,
						fragment: `#version 300 es\n\t\t\t\tprecision ${this.precision} float;\n\t\t\t\tuniform sampler2D tex;\n\t\t\t\tin vec3 vPosition;\n\t\t\t\tout vec4 fragColor;\n\t\t\t\tvoid main() {\n\t\t\t\t\tfragColor = texture(tex, vPosition.xy);\n\t\t\t\t\t//fragColor = vec4(vec3(vPosition.xy, 0.0), 1.0);\n\t\t\t\t}\n\t\t\t`,
					}).out()),
						(this.drawerAll = new at(this, {
							name: "drawer_all",
							...at.defaultGydraShader,
							fragment: ze(this.precision, this.settings.outputs),
						}).out()),
						this.resize(this.width, this.height),
						(this.autoTick = this.autoTick.bind(this)),
						e && this.settings.autoTick && (this.tickItv = requestAnimationFrame(this.autoTick)),
						this.render(this.renderOutput)
				}
				createHelpers() {
					const t = {}
					let e = ""
					b.forEach(n => {
						const r = (() => {
							let t = n.name + "\n"
							if (
								((t += n.lang ? "lang: " + n.lang + "\n" : ""),
								(t += "help" in n ? n.help + "\n\n" : ""),
								"code" === n.type)
							)
								return `raw code of type ${n.codeType}`
							const e = W.sanitizeInput(n.inputs).reduce((t, e) => ((t[e.name] = [e.default, e.description]), t), {})
							return `${t}usage:\n${n.name}(${Object.keys(e)
								.map(
									t => `\n\t${t}=${Array.isArray(e[t][0]) ? `[${e[t][0]}]` : e[t][0]}${e[t][1] ? " // " + e[t][1] : ""}`
								)
								.join(", ")}\n)`
						})()
						;(t[n.name] = () => console.log(r)), n.lang && (e += `${n.lang}: ${n.name}\n`)
					}),
						(t.modules = () =>
							console.log(
								`modules:\n\n\t\t\t\tusage: [module].help()\n${Object.keys(this.modules)
									.map(t => `\t${t}`)
									.join("\n")}`
							)),
						this.export("help", t),
						this.export("lang", e)
				}
				render(t) {
					if (
						(void 0 === t && (t = this.o.filter(t => t.attachedShader)),
						this.o.forEach(t => t.activate(!1)),
						this.shaders.forEach(t => t.activate(!1)),
						Array.isArray(t) || void 0 === t)
					) {
						const e = Array.isArray(t) ? t : this.o
						this.drawerAll.fragment(ze(this.precision, e.length)).out(),
							(this.drawerAll.uniforms = e.map((t, e) => ({ name: "o" + e, type: "sampler2D", value: t }))),
							this.drawerAll.activate(!0, !0)
					} else (this.drawer.uniforms = [{ name: "tex", type: "sampler2D", value: t }]), this.drawer.activate(!0, !0)
					return (this.renderOutput = t), this
				}
				hush() {
					this.s.forEach(t => t.clear()), this.o.forEach(t => t.clear()), this.seq.forEach(t => t.stop())
					for (let t = 0; t < this.shaders.length; t++) this.shaders[t].clear(), delete this.shaders[t]
					this.shaders = []
					for (let t = 0; t < this.textures.length; t++) this.textures[t].clear(), delete this.textures[t]
					;(this.textures = []),
						(this.defaultOutput = this.o[0]),
						this.render(this.o[0]),
						this.sandbox.varyng("update", null),
						(this.speed = 1)
				}
				stop() {
					this.hush(), this.tickItv && cancelAnimationFrame(this.tickItv)
				}
				resize(t, e) {
					;(t = Math.round(t)),
						(e = Math.round(e)),
						this.export("width", t),
						this.export("height", e),
						this.export("ratio", t / e),
						(this.width = t),
						(this.height = e),
						this.o.forEach(n => n.resize(t, e)),
						this.s.forEach(n => n.resize(t, e)),
						this.shaders.forEach(n => n.resize(t, e)),
						Object.keys(this.modules).forEach(n => this.modules[n].resize(t, e)),
						this.renderer.resize(t, e),
						this._camera.resize(t, e)
				}
				tick(t = (1e3 / 60) * 0.001) {
					;(this.speed = this.sandbox.varyng("speed")),
						(this.bpm = this.sandbox.varyng("bpm")),
						(this.time += t * this.speed),
						(this.deltaTime = t * this.speed),
						this.export("time", this.time),
						this.export("deltaTime", this.deltaTime),
						this.export("mouseX", this.mouseX),
						this.export("mouseY", this.mouseY),
						this._camera.update(),
						!1 !== this.sandbox.varyng("update", () => {})(t) &&
							(this.shaders.forEach(t => t.update()),
							this.o.forEach(t => t.update()),
							this.s.forEach(t => t.update()),
							this.seq.forEach(e => e.update(t * this.speed)),
							Object.keys(this.modules).forEach(t => this.modules[t].update()))
				}
				start() {
					this.tickItv && cancelAnimationFrame(this.tickItv), (this.tickItv = requestAnimationFrame(this.autoTick))
				}
				autoTick(t) {
					const e = (t *= 0.001) - this.lastTime
					;(this.lastTime = t), this.tick(e), (this.tickItv = requestAnimationFrame(this.autoTick))
				}
				eval(t, e = !0) {
					let n = t
					return (
						this.sandbox.varyng("update", null),
						new Promise(t => {
							this.sandbox
								.eval(n)
								.then(e => {
									e ? (console.log(e), t(e)) : (this.render(this.renderOutput), (this.source = n), t(!1))
								})
								.catch(e => {
									console.log(e), t(e)
								})
						})
					)
				}
				loadScript(t, e = !1) {
					return !t || document.querySelector(`script[src="${t}"]`)
						? (console.log(`script ${t} already loaded`), Promise.resolve())
						: new Promise((n, r) => {
								const a = document.createElement("script")
								a.setAttribute("crossorigin", "anonymous"),
									e
										? ((a.innerHTML = `\n\t\t\t\t\timport Module from "${t}"\n\t\t\t\t\tconsole.log([Module])\n\t\t\t\t\tObject.keys(Module).forEach(key => {\n\t\t\t\t\t\twindow[key] = Module[key]\n\t\t\t\t\t})\n\t\t\t\t`),
										  a.setAttribute("type", "module"),
										  document.head.append(a),
										  console.log(`script module ${t} loaded`),
										  n())
										: (a.addEventListener("load", () => {
												console.log(`script ${t} loaded`), n()
										  }),
										  a.addEventListener("error", () => r()),
										  (a.src = t),
										  document.head.append(a))
						  })
				}
				module(t) {
					this.modules[t] || (this.modules[t] = new Fe(this, t))
					const e = this.modules[t]
					return e ? this.export(t, e) : this.sandbox.remove(t), e
				}
				include(...t) {
					return this.require(...t)
				}
				require(...t) {
					const e = { functions: [], defines: [], utilities: [] }
					return (
						t.forEach(t => {
							let n = b.findIndex(({ name: e }) => e === t)
							if (n >= 0) {
								if (!e.functions.includes(t)) {
									const t = b[n]
									e.functions.push(t.name), t.defines && e.defines.push(...t.defines)
								}
							} else
								"string" == typeof t && t in j
									? e.defines.includes(t) || e.defines.push(t)
									: e.utilities.includes(t) || e.utilities.push(t)
						}),
						W.generator(e)
					)
				}
				debugger(t) {
					if (!t) return void (this.debuggerItv && (clearInterval(this.debuggerItv), (this.debuggerItv = null)))
					const e = (t, n) =>
							Array.isArray(t)
								? n
									? t
											.map(e)
											.map(t => `<li>${t}</li>`)
											.join("")
									: `[${t.map(e).join(", ")}]`
								: `${"number" == typeof t ? t.toFixed(2) : t}`,
						n = [],
						r = (t, r = !1) => (
							n.push(n => (a.querySelector(`#gy_d_${t}`).innerHTML = e(n[t], r))),
							r ? `<ul id="gy_d_${t}"></ul>` : `<span id="gy_d_${t}"></span>`
						),
						a = document.createElement("div")
					a.innerHTML = `\n\t\t<div id="gy_d_time">time: ${r("time")}</div>\n\t\t<div>fps: <span id="gy_d_fps">${r(
						"fps"
					)}</span></div>\n\t\t<div id="gy_d_mouse">mouse: ${r("mouse")}</div>\n\t\t<div id="gy_d_speed">speed: ${r(
						"speed"
					)}</div>\n\t\t<div>\n\t\t\tShaders:\n\t\t\t${r(
						"shaders",
						!0
					)}\n\t\t</div>\n\t\t<div>\n\t\t\tTextures:\n\t\t\t${r("textures", !0)}\n\t\t</div>\n\t`
					const s = () => {
						const t = {
							time: this.time,
							fps: 1 / this.deltaTime,
							mouse: [this.mouseX, this.mouseY],
							speed: this.speed,
							shaders: this.shaders.map(t => t.name + " " + t.drawCalls),
							textures: this.textures.map(t => t.name + " " + t.updates),
						}
						n.forEach(e => e(t)), (this.debuggerItv = requestAnimationFrame(s))
					}
					;(t.innerHTML = ""), t.append(a), (this.debuggerItv = requestAnimationFrame(s))
				}
			},
			ke = {
				outputs: 4,
				sources: 4,
				sequences: 4,
				textures: 4,
				makeGlobal: !0,
				detectAudio: !0,
				precision: "highp",
				debug: !0,
				autoTick: !0,
				autoResize: !0,
				useWorker: !1,
				workerPath: "gydra.worker.js",
			}
		class Ne {
			static {
				this.functions = b
			}
			constructor(t = {}) {
				if (
					((this.worker = null),
					(this.synth = null),
					(t = { ...ke, ...t }).makeGlobal
						? t.width ||
						  t.height ||
						  ((t.width = "undefined" != typeof window ? window.innerWidth * window.devicePixelRatio : 400),
						  (t.height = "undefined" != typeof window ? window.innerHeight * window.devicePixelRatio : 400))
						: (t.width && t.height) || ((t.width = t.canvas?.width || 400), (t.height = t.canvas?.height || 400)),
					t.useWorker)
				)
					try {
						this.initWithWorker(t)
					} catch (e) {
						console.log("Failed to create worker", e), this.initWithoutWorker(t)
					}
				else this.initWithoutWorker(t)
				return (this.proxy = new Proxy(this, this.proxyHandler())), this.proxy
			}
			getCanvasAndSize(t) {
				let e = t.width,
					n = t.height,
					r = t.canvas
				return (
					e ||
						n ||
						((e = "undefined" != typeof window ? window.innerWidth * window.devicePixelRatio : 400),
						(n = "undefined" != typeof window ? window.innerHeight * window.devicePixelRatio : 400)),
					r ||
						((r = document.createElement("canvas")),
						(r.style.width = "100%"),
						(r.style.height = "100%"),
						document.body.appendChild(r)),
					{ canvas: r, width: e, height: n }
				)
			}
			initWithWorker(t) {
				const { canvas: e, width: n, height: r } = this.getCanvasAndSize(t)
				this.worker = new Worker(t.workerPath)
				const a = e.transferControlToOffscreen()
				t.makeGlobal && (this.onMouse(e), t.autoResize && this.onResize()),
					this.worker.postMessage({ event: "init", settings: { ...t, canvas: a, width: n, height: r } }, [a]),
					console.log("Gydra initialized with worker")
			}
			initWithoutWorker(t) {
				const { canvas: e, width: n, height: r } = this.getCanvasAndSize(t)
				;(this.synth = new De({ ...t, canvas: e, width: n, height: r })),
					t.detectAudio && (this.synth.audio = new _t(this.synth)),
					t.makeGlobal && (this.onMouse(e), t.autoResize && this.onResize()),
					console.log("Gydra initialized in local")
			}
			onMouse(t) {
				const e = t.getBoundingClientRect()
				t.addEventListener(
					"mousemove",
					t => {
						;(this.proxy.mouseX = -0.5 * (((t.clientX - e.left) / e.width) * 2 - 1)),
							(this.proxy.mouseY = 0.5 * (((t.clientY - e.top) / e.height) * 2 - 1))
					},
					{ passive: !0 }
				)
			}
			onResize() {
				window.addEventListener(
					"resize",
					() => {
						const t = window.innerWidth * devicePixelRatio,
							e = window.innerHeight * devicePixelRatio
						this.proxy.resize(t, e)
					},
					{ passive: !0 }
				)
			}
			proxyHandler() {
				return this.worker
					? {
							get:
								(t, e, n) =>
								(...t) => {
									let n = t
									if ("export" === e) {
										const e = t[1]
										n[1] =
											((r = e),
											JSON.stringify(r, function (t, e) {
												return "function" == typeof e ? e.toString() : e
											}))
									}
									var r
									this.worker.postMessage({ event: "call", method: e, args: n })
								},
							set: (t, e, n, r) => (this.worker.postMessage({ event: "set", property: e, args: n }), !0),
					  }
					: { get: (t, e, n) => this.synth[e], set: (t, e, n, r) => ((this.synth[e] = n), !0) }
			}
		}
		const Le = Ne,
			Ue = (t = {}) => new Le(t)
		;(Ue.functions = Le.functions), (Ue.version = "1.2.0")
		const Be = Ue
	})(),
		(this.Gydra = r.default)
})()
//# sourceMappingURL=gydra.js.map
