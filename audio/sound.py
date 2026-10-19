"""
Trilha sonora sintetizada do Reels "Raio-X do distribuidor #1".

Tudo é gerado por código (sem samples externos): música original em Ré menor
(pad, baixo, bateria eletrônica suave, arpejo) + efeitos sonoros sincronizados
com os eventos das animações (tempos globais, em segundos).

Saída: audio/out/music.wav, audio/out/sfx.wav, audio/out/mix.wav (48 kHz, estéreo)
Uso:   python3 audio/sound.py
"""
from pathlib import Path

import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve, sawtooth

SR = 48000
DUR = 41.6
N = int(SR * DUR)
OUT = Path(__file__).resolve().parent / "out"
rng = np.random.default_rng(1986)  # determinístico (ano de fundação da SAIB)


# ---------------------------------------------------------------- utilidades
def tt(d):
    return np.arange(int(d * SR)) / SR


def bus():
    return np.zeros((N, 2), np.float64)


def place(b, sig, at, gain=1.0, pan=0.0):
    """Soma `sig` (mono ou estéreo) em `b` a partir de `at` segundos, com pan -1..1 (lei de potência constante)."""
    i = int(round(at * SR))
    if sig.ndim == 1:
        a = (pan + 1) * np.pi / 4
        sig = np.stack([sig * np.cos(a), sig * np.sin(a)], 1) * np.sqrt(2)
    if i < 0:
        sig, i = sig[-i:], 0
    j = min(N, i + len(sig))
    if j > i:
        b[i:j] += sig[: j - i] * gain


def lp(x, f, order=2):
    return sosfilt(butter(order, min(f, SR / 2 * 0.95), "low", fs=SR, output="sos"), x, axis=0)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, "high", fs=SR, output="sos"), x, axis=0)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, min(hi, SR / 2 * 0.95)], "band", fs=SR, output="sos"), x, axis=0)


def sweep_filter(x, f_of_t, kind="low", block=256):
    """Filtro com corte variável no tempo (processa em blocos, mantendo o estado)."""
    y = np.zeros_like(x)
    zi = None
    for s in range(0, len(x), block):
        f = float(np.clip(f_of_t(s / SR), 40, SR / 2 * 0.9))
        sos = butter(2, f, kind, fs=SR, output="sos")
        if zi is None:
            zi = np.zeros((sos.shape[0], 2))
        y[s : s + block], zi = sosfilt(sos, x[s : s + block], zi=zi)
    return y


def env_exp(d, tau):
    return np.exp(-tt(d) / tau)


def env_ad(d, a, tau):
    t = tt(d)
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / tau)


def noise(d):
    return rng.standard_normal(int(d * SR))


def note(n):  # MIDI -> Hz
    return 440.0 * 2 ** ((n - 69) / 12)


def fade_edges(x, a=0.004, r=0.01):
    na, nr = max(1, int(a * SR)), max(1, int(r * SR))
    x = x.copy()
    x[:na] *= np.linspace(0, 1, na)[:, None] if x.ndim == 2 else np.linspace(0, 1, na)
    x[-nr:] *= np.linspace(1, 0, nr)[:, None] if x.ndim == 2 else np.linspace(1, 0, nr)
    return x


def reverb(x, seconds=2.4, damp=5500, mix=0.25, predelay=0.018):
    """Reverb por convolução com resposta impulsiva sintética (ruído decaindo, estéreo decorrelacionado)."""
    n = int(seconds * SR)
    t = np.arange(n) / SR
    ir = np.stack([rng.standard_normal(n), rng.standard_normal(n)], 1) * np.exp(-t / (seconds / 6.5))[:, None]
    ir = lp(ir, damp)
    ir[: int(predelay * SR)] = 0
    ir /= np.sqrt((ir**2).sum(0, keepdims=True))
    wet = np.stack([fftconvolve(x[:, 0], ir[:, 0])[: len(x)], fftconvolve(x[:, 1], ir[:, 1])[: len(x)]], 1)
    return x * (1 - mix) + wet * mix * 1.6


def soft_clip(x, drive=1.0):
    return np.tanh(x * drive) / np.tanh(drive)


# ---------------------------------------------------------------- instrumentos de efeito
def whoosh(d=0.95, f0=250, f1=5200, peak=0.55):
    """Varredura de ar: ruído em passa-banda que sobe e desce, pico em `peak` (fração)."""
    x = noise(d)
    t = tt(d)
    p = t / d
    shape = np.where(p < peak, (p / peak) ** 2.2, ((1 - p) / (1 - peak)) ** 1.6)
    fc = lambda s: f0 * (f1 / f0) ** min(1, (s / d) / peak) if s / d < peak else f1 * 0.55
    y = sweep_filter(x, fc, "low") - 0.6 * sweep_filter(x, lambda s: fc(s) * 0.25, "low")
    return y * shape * 0.9


def scan_sweep(d=0.95):
    """Whoosh do scan de raio-X: ar + tom eletrônico que desce + brilho."""
    w = whoosh(d, 300, 7000, 0.5)
    t = tt(d)
    f = 1400 * (0.35 ** (t / d))
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / d) ** 2 * 0.12
    shimmer = hp(noise(d), 6000) * np.sin(np.pi * t / d) ** 4 * 0.18
    return w + tone + shimmer


def pop(f=900, d=0.16, drop=0.55, bright=0.25):
    """Pop curto (bolha/clique tonal) para elementos que surgem."""
    t = tt(d)
    fr = f * (1 + (1 / drop - 1) * np.exp(-t / 0.012)) * drop / drop
    ph = 2 * np.pi * np.cumsum(f * (1 + 0.8 * np.exp(-t / 0.01))) / SR
    y = np.sin(ph) * env_ad(d, 0.002, 0.035)
    y += bright * hp(noise(d), 3000) * env_exp(d, 0.004)
    return y


def tick(d=0.03, f=4200):
    t = tt(d)
    return (np.sin(2 * np.pi * f * t) * 0.6 + hp(noise(d), 5000) * 0.5) * env_exp(d, 0.0045)


def chime(f=1318.5, d=1.6, partials=((1, 1), (2.01, 0.42), (3.0, 0.2), (4.2, 0.12), (5.43, 0.06)), tau=0.45):
    """Sino/vidro: parciais com decaimentos diferentes."""
    t = tt(d)
    y = sum(a * np.sin(2 * np.pi * f * k * t) * np.exp(-t / (tau / (1 + 0.6 * i))) for i, (k, a) in enumerate(partials))
    return y * np.minimum(1, t / 0.003)


def blip(f=1760, d=0.12):
    t = tt(d)
    return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t)) * env_ad(d, 0.002, 0.03)


def thud(f=70, d=0.5, click=0.3):
    t = tt(d)
    ph = 2 * np.pi * np.cumsum(f * (1 + 1.8 * np.exp(-t / 0.025))) / SR
    y = np.sin(ph) * env_ad(d, 0.002, 0.12)
    y += click * lp(noise(d), 2500) * env_exp(d, 0.008)
    return y


def ghost(d=0.35):
    """'Não comprou': tom âmbar abafado que desafina para baixo + chiado curto."""
    t = tt(d)
    f = 330 * (0.82 ** (t / d))
    y = (sawtooth(2 * np.pi * np.cumsum(f) / SR) * 0.5)
    y = lp(y, 900) * env_ad(d, 0.004, 0.09)
    y += 0.25 * bp(noise(d), 800, 2500) * env_exp(d, 0.02)
    return y


def stamp(d=0.45):
    """Carimbo: baque grave + papel."""
    return thud(95, d, 0.0) * 0.9 + 0.45 * bp(noise(d), 600, 4500) * env_ad(d, 0.001, 0.03)


def impact(d=3.2):
    """Impacto cinematográfico suave: sub + corpo + ar."""
    t = tt(d)
    ph = 2 * np.pi * np.cumsum(48 * (1 + 2.5 * np.exp(-t / 0.05))) / SR
    sub = np.sin(ph) * env_ad(d, 0.003, 0.4)
    body = lp(noise(d), 1800) * env_ad(d, 0.001, 0.09) * 0.5
    air = hp(noise(d), 5000) * env_ad(d, 0.002, 0.6) * 0.12
    return sub + body + air


def riser(d, f0=180, f1=1500):
    t = tt(d)
    p = t / d
    x = noise(d)
    y = sweep_filter(x, lambda s: 300 * (9000 / 300) ** ((s / d) ** 1.6), "low")
    y = hp(y, 150) * p**2.4 * 0.5
    f = f0 * (f1 / f0) ** (p**1.5)
    y += np.sin(2 * np.pi * np.cumsum(f) / SR) * p**2 * 0.18
    y += np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR) * p**3 * 0.08
    return y


def glitch(d=0.12, seed=0):
    g = np.random.default_rng(seed)
    n = int(d * SR)
    y = np.zeros(n)
    s = 0
    while s < n:
        L = int(g.uniform(0.004, 0.02) * SR)
        f = g.choice([220, 440, 880, 1760, 3520]) * g.uniform(0.98, 1.02)
        seg = np.sign(np.sin(2 * np.pi * f * np.arange(L) / SR)) * g.uniform(0.2, 0.6)
        if g.random() < 0.35:
            seg = g.standard_normal(L) * 0.4
        y[s : s + L] = seg[: n - s]
        s += L + int(g.uniform(0, 0.01) * SR)
    return lp(y, 7000) * env_ad(d, 0.001, d / 2)


def tick_train(start, end, count, ease_pow=2.2, f=3600):
    """Cliques de contador desacelerando (como um odômetro com outCubic)."""
    out = []
    for k in range(count):
        p = 1 - (1 - (k + 1) / count) ** (1 / ease_pow)
        out.append((start + (end - start) * p, f * (1 + 0.15 * (k % 2))))
    return out


# ---------------------------------------------------------------- música
BEAT = 29.0 / 46  # 46 tempos entre 9.8 s (entra a bateria) e 38.8 s (impacto final) ~ 95 BPM
ORIGIN = 9.8
BAR = 4 * BEAT
# Ré menor: i – VI – III – VII  (Dm9, Bbmaj7, Fadd9, Cadd9)
CHORDS = [
    [50, 53, 57, 60, 64],  # D3 F3 A3 C4 E4
    [46, 50, 53, 57, 60],  # Bb2 D3 F3 A3 C4
    [53, 57, 60, 64, 67],  # F3 A3 C4 E4 G4
    [48, 52, 55, 62, 64],  # C3 E3 G3 D4 E4
]
ROOTS = [38, 34, 41, 36]  # D2 Bb1 F2 C2


def bar_index(T):
    return int(np.floor((T - ORIGIN) / BAR))


def make_music():
    m = bus()
    # energia por seção (controla filtro do pad, volume da bateria etc.)
    def energy(T):
        pts = [(0, 0.35), (4.0, 0.5), (9.8, 0.7), (20.0, 0.85), (29.4, 1.0), (36.2, 0.55), (38.75, 0.9), (38.8, 0.75), (41.6, 0.6)]
        xs, ys = zip(*pts)
        return float(np.interp(T, xs, ys))

    # --- pad: por compasso, 3 serras desafinadas por voz, ataque lento, sobreposição
    first = bar_index(0.0) - 1
    last = bar_index(DUR) + 1
    for b in range(first, last + 1):
        T0 = ORIGIN + b * BAR
        if T0 > DUR:
            break
        ch = CHORDS[b % 4]
        d = BAR + 1.4
        t = tt(d)
        voice = np.zeros(len(t))
        for n_ in ch:
            for det in (-0.07, 0.0, 0.07):
                f = note(n_) * 2 ** (det / 12)
                voice += sawtooth(2 * np.pi * f * t + rng.uniform(0, 6.28)) * (0.6 if det else 1)
        voice /= len(ch) * 2.2
        e = np.minimum(1, t / 0.9) * np.minimum(1, np.maximum(0, (d - t)) / 1.3)
        sig = voice * e
        sig = sweep_filter(sig, lambda s: 500 + 2400 * energy(T0 + s) ** 2, "low")
        place(m, sig, T0, 0.55, pan=-0.15 if b % 2 else 0.15)

    # --- sub baixo: colcheias com "pumping" (sidechain imitado), a partir de 4.0 s
    for k in range(int((DUR - 4.0) / (BEAT / 2)) + 1):
        T = ORIGIN + np.ceil((4.0 - ORIGIN) / (BEAT / 2)) * (BEAT / 2) + k * (BEAT / 2)
        if T >= 36.2 and T < 38.8 or T > DUR:
            continue
        r = ROOTS[bar_index(T) % 4]
        d = BEAT / 2
        t = tt(d)
        f = note(r + (12 if k % 2 else 0) * 0)
        # harmônicos extras para o baixo "aparecer" em alto-falante de celular
        y = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2 * f * t) + 0.15 * np.sin(2 * np.pi * 3 * f * t)
        y *= np.minimum(1, t / 0.03) * np.exp(-t / 0.22)
        g = 0.32 * energy(T) * (0.55 if T < 9.8 else 1.0)
        place(m, soft_clip(y, 1.4), T, g)

    # --- bateria
    def kick():
        d = 0.42
        t = tt(d)
        ph = 2 * np.pi * np.cumsum(46 * (1 + 2.6 * np.exp(-t / 0.03))) / SR
        return np.sin(ph) * env_ad(d, 0.001, 0.16) + 0.15 * lp(noise(d), 3000) * env_exp(d, 0.004)

    def clap():
        d = 0.3
        y = bp(noise(d), 900, 5000)
        e = np.zeros(int(d * SR))
        for o in (0.0, 0.011, 0.022):
            i = int(o * SR)
            e[i:] += np.exp(-np.arange(len(e) - i) / SR / 0.018) * 0.6
        e += np.exp(-tt(d) / 0.12) * 0.25
        return y * e

    def hat(open_=False):
        d = 0.25 if open_ else 0.06
        return hp(noise(d), 7500) * env_exp(d, 0.08 if open_ else 0.012)

    drums = bus()
    nb = int((DUR - ORIGIN) / BEAT) + 2
    for k in range(-16, nb):
        T = ORIGIN + k * BEAT
        if T < 0 or T > DUR:
            continue
        beat_in_bar = k % 4
        if 9.8 <= T < 36.2:
            if T < 20.0:
                if beat_in_bar in (0, 2):
                    place(drums, kick(), T, 0.55)
            else:
                place(drums, kick(), T, 0.6)
            if T >= 14.3 and beat_in_bar in (1, 3):
                place(drums, clap(), T, 0.22, pan=0.05)
        # chimbal
        if 4.0 <= T < 36.2:
            place(drums, hat(), T + BEAT / 2, 0.10 if T < 9.8 else 0.14, pan=0.25)
            if T >= 20.0:
                place(drums, hat(), T + BEAT / 4, 0.06, pan=-0.25)
                place(drums, hat(), T + 3 * BEAT / 4, 0.06, pan=-0.25)
            if T >= 29.4 and beat_in_bar == 3:
                place(drums, hat(True), T + BEAT / 2, 0.08, pan=0.3)
    m += reverb(drums, 1.2, 6000, 0.12)

    # --- arpejo (pluck) nas partes de maior energia e no final
    arp = bus()
    for k in range(int(DUR / (BEAT / 4)) + 1):
        T = ORIGIN + k * (BEAT / 4) - 64 * (BEAT / 4)
        if not (29.4 <= T < 36.2 or 38.8 <= T < 41.2) or T > DUR:
            continue
        ch = CHORDS[bar_index(T) % 4]
        seq = [0, 2, 4, 2, 1, 3, 4, 3]
        n_ = ch[seq[k % 8]] + 12
        d = 0.32
        t = tt(d)
        f = note(n_)
        y = 0.6 * np.sin(2 * np.pi * f * t) + 0.4 * sawtooth(2 * np.pi * f * t) * np.exp(-t / 0.03)
        y *= env_ad(d, 0.002, 0.11)
        g = 0.09 if T < 36.2 else 0.07 * max(0, 1 - (T - 38.8) / 2.6)
        place(arp, lp(y, 4200), T, g, pan=0.45 * np.sin(k * 0.7))
    m += reverb(arp, 2.0, 7000, 0.35)

    # --- breakdown + riser até o impacto final (38.8)
    place(m, riser(2.6, 160, 1400), 36.2, 0.55)
    # acorde final (pad brilhante sustentado + sino)
    t = tt(2.8)
    fin = sum(np.sin(2 * np.pi * note(n_) * t) for n_ in [62, 65, 69, 72, 76]) / 5
    fin *= np.minimum(1, t / 0.02) * np.exp(-t / 1.6)
    place(m, fin, 38.8, 0.35)

    m = reverb(m, 2.6, 5000, 0.22)
    # fade de saída nos últimos 0.6 s
    fo = np.ones(N)
    k0 = int((DUR - 0.6) * SR)
    fo[k0:] = np.linspace(1, 0, N - k0) ** 1.5
    return m * fo[:, None]


# ---------------------------------------------------------------- efeitos sincronizados
def make_sfx():
    s = bus()
    S = lambda sig, at, g=1.0, pan=0.0: place(s, fade_edges(sig) if sig.ndim == 1 else sig, at, g, pan)

    # ===== transições (scan de raio-X) — pico no instante da fronteira
    for b in (9.8, 20.0, 29.4, 36.2):
        S(scan_sweep(0.95), b - 0.5, 0.55)

    # ===== ATO A (0–9.8)
    S(chime(587.3, 2.0, tau=0.6), 0.0, 0.10)  # "liga" o scanner
    S(hp(noise(0.6), 4000) * np.linspace(0, 1, int(0.6 * SR)) ** 2 * env_exp(0.6, 0.8), 0.0, 0.04)
    cols = [-0.6, -0.3, 0.0, 0.3, 0.6]
    for i in range(10):  # 10 fachadas em mola diagonal
        r, c = divmod(i, 5)
        S(pop(700 + 60 * c + 120 * r, 0.14), 0.12 + (r + c) * 0.075, 0.16, cols[c])
    S(whoosh(0.5, 400, 3000, 0.4), 0.80, 0.12)  # pergunta entra
    S(chime(1760, 1.2, tau=0.3), 1.6, 0.07, 0.2)  # sublinhado "este mês"
    S(blip(2093, 0.1), 2.5, 0.08, 0.5)  # SCAN · PRONTO
    S(whoosh(0.6, 300, 2500, 0.5), 3.40, 0.18)  # morph do "10"
    S(tick(0.04, 3000), 3.75, 0.25)  # "0" do odômetro
    # varredura local (3.95–5.35)
    sw = sweep_filter(noise(1.45), lambda q: 500 + 5000 * (q / 1.45), "low")
    S(hp(sw, 300) * np.sin(np.pi * tt(1.45) / 1.45) ** 1.5, 3.95, 0.10, 0.0)
    # colunas tocadas: acesas = sino brilhante, fantasma = tom âmbar abafado
    lit_cols = {0: 2, 1: 1, 2: 1, 3: 2, 4: 1}
    ghost_cols = {1, 2, 4}
    col_t = [4.33, 4.58, 4.84, 5.09, 5.33]
    notes_up = [74, 76, 77, 79, 81]
    for c, T in enumerate(col_t):
        S(chime(note(notes_up[c]), 1.0, tau=0.22), T, 0.10 * lit_cols[c], cols[c])
        S(tick(0.03, 4800), T, 0.20, 0)  # contador rola
        if c in ghost_cols:
            S(ghost(), T + 0.03, 0.22, cols[c])
    # batida do "7"
    S(impact(1.8), 5.40, 0.45)
    S(chime(note(86), 1.8, tau=0.5), 5.40, 0.12, 0.1)
    S(chime(note(81), 1.8, tau=0.5), 5.42, 0.10, -0.1)
    S(whoosh(0.45, 500, 3500, 0.4), 5.50, 0.08)  # frase do faturamento
    # mini gráfico (tesoura)
    t = tt(1.2)
    S(np.sin(2 * np.pi * np.cumsum(500 * 2 ** (t / 1.2)) / SR) * np.sin(np.pi * t / 1.2) ** 2 * 0.5, 6.0, 0.06, 0.3)
    S(np.sin(2 * np.pi * np.cumsum(500 * 2 ** (-t / 1.2)) / SR) * np.sin(np.pi * t / 1.2) ** 2 * 0.5, 6.0, 0.06, -0.3)
    S(blip(1318, 0.1), 6.58, 0.10)  # cruzamento
    S(pop(1000, 0.12), 7.20, 0.10, 0.4)
    S(pop(620, 0.12), 7.26, 0.10, 0.4)
    S(ghost(0.5), 6.55, 0.10, 0.2)  # "encolhendo"

    # ===== ATO B (9.8–20.0) — local + 9.8
    B = 9.8
    for k in range(11):  # "Positivação" por letra: tiques bem sutis
        S(tick(0.02, 2600 + 90 * k), B - 0.25 + k * 0.04, 0.05, -0.3 + 0.06 * k)
    S(whoosh(0.5, 600, 6000, 0.3), B + 0.30, 0.10)  # barra da fração se desenha
    S(chime(note(81), 1.4, tau=0.35), B + 0.40, 0.06)
    S(pop(1100, 0.12), B + 1.00, 0.14, -0.05)  # pontos do ÷
    S(pop(1200, 0.12), B + 1.06, 0.14, 0.05)
    S(chime(note(88), 1.0, tau=0.25), B + 2.3, 0.03, 0.4)  # brilho na barra
    S(stamp(), B + 4.10, 0.55, 0.45)  # carimbo EXEMPLO
    sw = sweep_filter(noise(0.8), lambda q: 800 + 7000 * (q / 0.8), "low")
    S(hp(sw, 400) * np.sin(np.pi * tt(0.8) / 0.8) ** 1.5, B + 4.50, 0.12, 0)  # feixe vertical
    for T, f in tick_train(B + 4.75, B + 5.72, 22, 2.4, 3300):
        S(tick(0.025, f), T, 0.13, -0.2)
    for T, f in tick_train(B + 4.90, B + 5.75, 18, 2.4, 3900):
        S(tick(0.025, f), T, 0.11, 0.2)
    S(chime(note(84), 1.2, tau=0.35), B + 5.75, 0.08)
    S(whoosh(0.7, 300, 3000, 0.45), B + 6.30, 0.20)  # colapso
    S(thud(110, 0.3, 0.1), B + 6.75, 0.15)  # anel fecha
    t = tt(0.95)  # arco preenche 0→70%: tom subindo + tiques de régua
    S(np.sin(2 * np.pi * np.cumsum(300 * 2.6 ** (1 - (1 - t / 0.95) ** 3)) / SR) * (0.2 + 0.8 * t / 0.95) * 0.35, B + 7.0, 0.10)
    for T, f in tick_train(B + 7.0, B + 7.85, 14, 2.0, 4400):
        S(tick(0.02, f), T, 0.07, 0.3)
    S(impact(2.0), B + 7.90, 0.30)
    S(chime(note(81), 2.2, tau=0.7), B + 7.90, 0.12, -0.15)
    S(chime(note(88), 2.2, tau=0.7), B + 7.93, 0.09, 0.15)
    S(blip(2637, 0.09), B + 8.2, 0.06, 0.5)  # LEITURA CONCLUÍDA

    # ===== ATO C (20.0–29.4)
    C = 20.0
    S(whoosh(0.4, 600, 5000, 0.3), C + 0.30, 0.07)  # linha da média
    t = tt(0.9)
    S(np.sin(2 * np.pi * np.cumsum(350 * 2.2 ** (t / 0.9)) / SR) * np.sin(np.pi * t / 0.9) * 0.4, C + 0.38, 0.07, -0.2)
    for T, f in tick_train(C + 0.4, C + 1.3, 14, 2.2, 3600):
        S(tick(0.02, f), T, 0.08, 0)
    S(stamp(), C + 0.80, 0.45, 0.4)
    S(pop(900, 0.12), C + 1.35, 0.12, -0.35)  # balões
    S(pop(760, 0.12), C + 1.45, 0.12, -0.35)
    S(chime(note(86), 1.4, tau=0.4), C + 1.70, 0.10, 0.2)  # A acima da média
    S(ghost(0.45), C + 1.95, 0.16, 0.2)  # B abaixo
    S(chime(note(93), 0.9, tau=0.25), C + 2.70, 0.03, 0.3)  # brilho do vidro
    S(whoosh(0.8, 250, 3200, 0.6), C + 3.85, 0.22)  # cartões deitam no mapa
    S(impact(1.6), C + 4.50, 0.35)  # CD acende
    S(chime(note(74), 1.6, tau=0.5), C + 4.50, 0.08)
    S(ghost(0.5), C + 4.62, 0.12, -0.3)  # impacto âmbar
    for k in range(4):  # rotas desenhando
        sw = sweep_filter(noise(0.7), lambda q: 1500 + 6000 * (q / 0.7), "low")
        S(hp(sw, 1200) * np.sin(np.pi * tt(0.7) / 0.7) ** 2, C + 4.62 + k * 0.09, 0.035, [-0.6, -0.2, 0.2, 0.6][k])
    for k in range(7):
        S(blip(1568 + 140 * k, 0.07), C + 4.75 + k * 0.1, 0.035, -0.5 + k * 0.16)
    S(whoosh(0.45, 500, 3500, 0.4), C + 5.15, 0.07)  # frase
    # alerta da rota 3: duplo tom âmbar
    S(lp(sawtooth(2 * np.pi * 440 * tt(0.18)) * env_ad(0.18, 0.004, 0.06), 1400), C + 5.44, 0.10, -0.4)
    S(lp(sawtooth(2 * np.pi * 349 * tt(0.22)) * env_ad(0.22, 0.004, 0.08), 1400), C + 5.62, 0.10, -0.4)
    for k, T in enumerate([5.90, 6.27, 6.64]):  # motivos 01–03 + faísca na parada
        S(pop(820 + 90 * k, 0.13), C + T, 0.15, 0.1)
        S(chime(note(76 + 3 * k), 0.9, tau=0.2), C + T + 0.70, 0.06, -0.4)
    S(stamp(), C + 7.60, 0.40, 0.4)
    S(chime(note(88), 1.0, tau=0.3), C + 8.10, 0.03, 0.2)

    # ===== ATO D (29.4–36.2)
    D = 29.4
    for k in range(10):
        S(tick(0.02, 2500 + 80 * k), D - 0.38 + k * 0.045, 0.04, 0.2)
    S(whoosh(0.5, 300, 3000, 0.45), D - 0.16, 0.10)  # cartão sobe
    for T, f in tick_train(D + 0.35, D + 1.25, 24, 2.6, 3500):
        S(tick(0.02, f), T, 0.11, 0)
    S(pop(980, 0.18), D + 1.25, 0.25)
    S(chime(note(84), 1.2, tau=0.35), D + 1.25, 0.09)
    S(whoosh(1.0, 300, 4000, 0.4), D + 1.0, 0.10, -0.2)  # lista rola
    t = tt(0.8)  # barra de prazo âmbar
    S(np.sin(2 * np.pi * np.cumsum(260 * 1.8 ** (t / 0.8)) / SR) * np.sin(np.pi * t / 0.8) * 0.4, D + 1.15, 0.06, 0.3)
    S(pop(700, 0.14), D + 1.95, 0.12, 0.5)  # bandeira DIA 30
    S(ghost(0.3), D + 2.05, 0.10, 0.4)  # linha em foco fica âmbar
    S(pop(1300, 0.12), D + 2.20, 0.15, 0.5)  # botão de ligar
    for k in range(2):  # pulsos de "chamando"
        S(blip(1480, 0.08) + blip(1175, 0.08) * 0.7, D + 2.32 + k * 0.3, 0.06, 0.5)
    S(whoosh(0.8, 250, 3200, 0.5), D + 3.20, 0.20)  # transformação lista → checklist
    S(chime(note(79), 1.0, tau=0.3), D + 3.55, 0.05)  # marcador desenha
    steps = np.linspace(D + 4.10, D + 5.12, 5)
    pent = [74, 77, 79, 81, 84]  # pentatônica ascendente: satisfação crescente
    for k, T in enumerate(steps):
        S(pop(900 + 70 * k, 0.12), T, 0.12, -0.3)
        S(chime(note(pent[k]), 1.1, tau=0.28), T + 0.01, 0.09, -0.3 + 0.15 * k)
    S(impact(2.0), D + 5.25, 0.30)  # clímax: salvo
    S(chime(note(86), 2.0, tau=0.6), D + 5.25, 0.10, -0.1)
    S(chime(note(93), 2.0, tau=0.6), D + 5.28, 0.07, 0.1)

    # ===== ATO E (36.2–41.6)
    E = 36.2
    for k in range(14):  # dashboard se constrói: dados digitais sutis
        S(blip(1200 + 200 * (k % 5), 0.05), E - 0.2 + k * 0.12, 0.03, -0.6 + 0.09 * k)
    for k, T in enumerate([0.12, 0.45, 0.83, 1.2, 1.58, 1.95]):  # tarja embaralhando
        S(glitch(0.09, k), E + T, 0.10, 0.25)
    S(whoosh(0.4, 500, 3500, 0.4), E + 0.35, 0.07)  # "Fique de olho."
    S(thud(85, 0.35, 0.05), E + 0.48, 0.20)  # pálpebras se encontram
    t = tt(0.6)
    S(np.sin(2 * np.pi * np.cumsum(400 * 2 ** (t / 0.6)) / SR) * np.sin(np.pi * t / 0.6) ** 2 * 0.4, E + 0.68, 0.07)  # íris
    S(whoosh(0.3, 800, 4000, 0.5), E + 1.15, 0.04, 0.4)  # olhar de lado
    S(tick(0.03, 2200) * 1.0, E + 1.85, 0.25)  # piscada
    S(tick(0.03, 2600) * 1.0, E + 1.97, 0.18)
    S(chime(note(88), 1.0, tau=0.3), E + 1.98, 0.06)
    # impacto final: selo 40 anos + logo (o riser da música termina aqui)
    S(impact(3.2), E + 2.60, 0.55)
    S(chime(note(74), 3.0, tau=1.0), E + 2.60, 0.10, -0.2)
    S(chime(note(81), 3.0, tau=1.0), E + 2.62, 0.08, 0.2)
    S(chime(note(86), 3.0, tau=1.0), E + 2.64, 0.06, 0)
    S(whoosh(0.5, 400, 3500, 0.4), E + 2.65, 0.08)  # CTA entra
    S(pop(1050, 0.14), E + 2.94, 0.16, 0.0)  # pílula link na bio
    shimmer = hp(noise(0.7), 6000) * np.sin(np.pi * tt(0.7) / 0.7) ** 2
    S(shimmer, E + 3.45, 0.06, -0.3)  # brilho no "saib"
    S(shimmer, E + 3.62, 0.06, 0.3)  # brilho no selo
    S(chime(note(98), 1.6, tau=0.5), E + 3.62, 0.03, 0.3)
    S(blip(1760, 0.08), E + 3.5, 0.03)  # pulso da pílula
    S(blip(1760, 0.08), E + 4.5, 0.02)

    # ===== elementos de clareza (rodada 2)
    S(blip(1760, 0.07), 5.45, 0.05, 0.5)  # legenda "7 compraram"
    S(ghost(0.25), 5.55, 0.08, 0.5)  # legenda "3 não compraram"
    S(whoosh(0.5, 600, 4000, 0.35), B + 0.35, 0.06)  # definição sob "Positivação"
    t = tt(0.65)  # contorno âmbar desenhando os 30% que não compraram
    S(lp(sawtooth(2 * np.pi * np.cumsum(300 * 1.25 ** (t / 0.65)) / SR), 1200) * np.sin(np.pi * t / 0.65) ** 2 * 0.35, B + 7.75, 0.07, 0.3)
    S(ghost(0.4), B + 7.85, 0.16, 0)  # "30% · 180 não compraram"
    S(pop(760, 0.13), B + 7.88, 0.10, 0)
    S(pop(1150, 0.12), D + 1.30, 0.12, 0)  # pílula "= 600 ativos − 420 que compraram"
    for k in range(6):
        S(tick(0.02, 3000 + 120 * k), D + 1.35 + k * 0.05, 0.05, -0.1 + 0.04 * k)
    S(whoosh(0.5, 500, 3500, 0.4), E + 3.05, 0.06)  # frase do SAIB Vendas

    s = reverb(s, 1.8, 7000, 0.18)
    return s


def write_wav(path, x):
    import wave

    x = np.clip(x, -1, 1)
    pcm = (x * 32767).astype("<i2")
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    # corta o subgrave inaudível no celular (libera headroom para o volume percebido)
    music = hp(make_music(), 38, 4)
    sfx = hp(make_sfx(), 32, 4)
    peak = lambda x: 20 * np.log10(np.abs(x).max() + 1e-9)
    # normaliza cada stem num pico de referência e mistura (efeitos à frente, música de cama)
    music = music / np.abs(music).max() * 10 ** (-9 / 20)
    sfx = sfx / np.abs(sfx).max() * 10 ** (-3 / 20)
    mix = soft_clip(music * 0.9 + sfx * 0.92, 1.1)
    write_wav(OUT / "music.wav", music)
    write_wav(OUT / "sfx.wav", sfx)
    write_wav(OUT / "mix.wav", mix * 0.95)
    print("ok", {k: round(peak(v), 1) for k, v in dict(music=music, sfx=sfx, mix=mix).items()})
