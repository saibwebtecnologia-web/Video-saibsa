"""
Trilha sonora do Reels "SAIB Direct: um app, dois lados" (41 s).

Tudo sintetizado por código, reaproveitando os instrumentos de audio/sound.py: trilha original
corporativa/tech em Ré maior a 120 BPM (pad, baixo, bateria eletrônica suave, pluck) + efeitos sutis
sincronizados com as animações (toque, clique, notificação, sucesso, whoosh). Tempos globais em segundos.

Saída: direct/audio/out/music.wav, sfx.wav, mix.wav (48 kHz, estéreo)
Uso:   python3 direct/audio/sound.py
"""
import sys
from pathlib import Path

import numpy as np
from scipy.signal import sawtooth

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "audio"))
import sound as base  # noqa: E402  (instrumentos e utilidades do vídeo #1)

DUR = 41.0
base.DUR = DUR
base.N = int(base.SR * DUR)
SR, N = base.SR, base.N
OUT = Path(__file__).resolve().parent / "out"
rng = np.random.default_rng(2026)
tt, bus, place, lp, hp, bp = base.tt, base.bus, base.place, base.lp, base.hp, base.bp
env_ad, env_exp, note, reverb, soft_clip, sweep_filter = base.env_ad, base.env_exp, base.note, base.reverb, base.soft_clip, base.sweep_filter


def noise(d):
    return rng.standard_normal(int(d * SR))


# ---------------------------------------------------------------- efeitos de interface
def tap(f=2300, d=0.07):
    """Toque na tela: clique curto e limpo (tom + transiente)."""
    t = tt(d)
    return np.sin(2 * np.pi * f * t) * env_ad(d, 0.0008, 0.012) * 0.8 + hp(noise(d), 4000) * env_exp(d, 0.003) * 0.5


def click(d=0.06):
    """Clique de mouse: dois estalos pequenos (aperta/solta)."""
    y = np.zeros(int(d * SR))
    for o, g in ((0.0, 1.0), (0.032, 0.55)):
        i = int(o * SR)
        s = bp(noise(0.012), 1800, 7000) * env_exp(0.012, 0.0018) * g
        y[i : i + len(s)] += s[: len(y) - i]
    return y


def bell(f, d=1.4, tau=0.5, bright=0.35):
    t = tt(d)
    y = np.sin(2 * np.pi * f * t) + bright * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t / (tau * 0.4)) + 0.12 * np.sin(2 * np.pi * 3.01 * f * t) * np.exp(-t / (tau * 0.25))
    return y * env_ad(d, 0.002, tau)


def notify():
    """Notificação suave (oferta chegou): duas notas de vidro."""
    y = np.zeros(int(1.6 * SR))
    for o, n_, g in ((0.0, 83, 0.7), (0.11, 88, 1.0)):  # B5 → E6
        s = bell(note(n_), 1.4, 0.45)
        i = int(o * SR)
        y[i : i + len(s)] += s[: len(y) - i] * g
    return y


def success(notes=(74, 78, 81, 86)):
    """Sucesso (pedido enviado/aprovado/entregue): arpejo rápido brilhante em Ré maior."""
    y = np.zeros(int(1.9 * SR))
    for k, n_ in enumerate(notes):
        s = bell(note(n_), 1.5, 0.5, 0.25) * (0.6 + 0.12 * k)
        i = int(k * 0.06 * SR)
        y[i : i + len(s)] += s[: len(y) - i]
    return y


def swish(d=0.38, f0=900, f1=6500):
    """Whoosh curto para textos e elementos pequenos."""
    return base.whoosh(d, f0, f1, 0.45) * 0.8


def shimmer(d=0.9, seed=0):
    """Brilho holográfico: chuva de senos agudos curtíssimos + ar."""
    g = np.random.default_rng(seed)
    y = np.zeros(int(d * SR))
    for _ in range(int(d * 26)):
        f = g.uniform(3200, 9000)
        L = int(g.uniform(0.03, 0.09) * SR)
        i = int(g.uniform(0, d - 0.1) * SR)
        s = np.sin(2 * np.pi * f * np.arange(L) / SR) * np.hanning(L) * g.uniform(0.15, 0.5)
        y[i : i + L] += s
    t = tt(d)
    y += hp(noise(d), 7000) * np.sin(np.pi * t / d) ** 2 * 0.12
    return y


def travel(d=0.8):
    """Algo viajando pela linha holográfica: tom que sobe + whoosh + brilho."""
    t = tt(d)
    f = 600 * (2.6 ** (t / d))
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / d) ** 2 * 0.22
    return tone + base.whoosh(d, 400, 7000, 0.6) * 0.7 + shimmer(d, 7) * 0.5


def lid(d=0.9):
    """Tampa do notebook abrindo: atrito grave suave."""
    t = tt(d)
    return lp(noise(d), 700) * np.sin(np.pi * t / d) ** 1.5 * 0.35


# ---------------------------------------------------------------- música
BPM = 120
BEAT = 60 / BPM
ORIGIN = 3.6  # primeiro tempo forte = entrada dos dois lados
BAR = 4 * BEAT
HIT = 37.75  # "SAIB Direct." (impacto final)
# Ré maior: IV – I – vi – V  (Gmaj9, Dadd9, Bm7, Asus)
CHORDS = [
    [55, 59, 62, 66, 69],  # G3 B3 D4 F#4 A4
    [50, 57, 62, 64, 66],  # D3 A3 D4 E4 F#4
    [47, 54, 57, 62, 66],  # B2 F#3 A3 D4 F#4
    [45, 52, 57, 59, 64],  # A2 E3 A3 B3 E4
]
ROOTS = [43, 38, 47, 45]  # G2 D2 B2 A2


def bar_index(T):
    return int(np.floor((T - ORIGIN) / BAR))


def energy(T):
    pts = [(0, 0.25), (3.5, 0.45), (3.6, 0.6), (7.4, 0.8), (20.8, 0.7), (21.6, 0.85), (26.2, 1.0), (31.4, 0.9), (35.8, 0.6), (37.7, 0.35), (37.75, 1.0), (41.0, 0.7)]
    xs, ys = zip(*pts)
    return float(np.interp(T, xs, ys))


def make_music():
    m = bus()
    # --- pad: um acorde por compasso, serras desafinadas com filtro que abre com a energia
    for b in range(bar_index(0) - 1, bar_index(DUR) + 1):
        T0 = ORIGIN + b * BAR
        if T0 > DUR:
            break
        if T0 + BAR < 0:
            continue
        ch = CHORDS[b % 4]
        d = BAR + 1.2
        t = tt(d)
        v = np.zeros(len(t))
        for n_ in ch:
            for det in (-0.08, 0.0, 0.08):
                v += sawtooth(2 * np.pi * note(n_) * 2 ** (det / 12) * t + rng.uniform(0, 6.28)) * (0.55 if det else 1)
        v /= len(ch) * 2.2
        v *= np.minimum(1, t / 0.6) * np.minimum(1, np.maximum(0, d - t) / 1.1)
        v = sweep_filter(v, lambda s: 380 + 3000 * energy(T0 + s) ** 2.2, "low")
        place(m, v, T0, 0.5, pan=-0.12 if b % 2 else 0.12)

    # --- gancho (0–3,6): pulso de colcheias filtrado + riser até a entrada
    for k in range(int(3.6 / (BEAT / 2))):
        T = 3.6 - (k + 1) * (BEAT / 2)
        if T < 0.05:
            continue
        d = 0.18
        t = tt(d)
        y = sawtooth(2 * np.pi * note(62) * t) * env_ad(d, 0.002, 0.05)
        place(m, lp(y, 1400 + 900 * (T / 3.6)), T, 0.07 * (0.5 + T / 3.6), pan=0.3 if k % 2 else -0.3)
    place(m, base.riser(1.6, 220, 1600), 2.0, 0.42)

    # --- baixo: colcheias com "pumping"
    for k in range(int((DUR - 3.6) / (BEAT / 2)) + 1):
        T = 3.6 + k * (BEAT / 2)
        if T > DUR or 36.6 <= T < HIT:
            continue
        r = ROOTS[bar_index(T) % 4]
        d = BEAT / 2
        t = tt(d)
        f = note(r + (12 if (k % 4 == 3) else 0))
        y = np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * 2 * f * t) + 0.18 * np.sin(2 * np.pi * 3 * f * t)
        y *= np.minimum(1, t / 0.025) * np.exp(-t / 0.2)
        g = 0.3 * energy(T) * (0.6 if T < 7.4 else 1.0) * (0.75 if T >= HIT else 1)
        place(m, soft_clip(y, 1.3), T, g)

    # --- bateria
    def kick():
        d = 0.4
        t = tt(d)
        ph = 2 * np.pi * np.cumsum(50 * (1 + 2.4 * np.exp(-t / 0.028))) / SR
        return np.sin(ph) * env_ad(d, 0.001, 0.15) + 0.14 * lp(noise(d), 3500) * env_exp(d, 0.004)

    def clap():
        d = 0.28
        y = bp(noise(d), 1000, 6000)
        e = np.zeros(int(d * SR))
        for o in (0.0, 0.01, 0.02):
            i = int(o * SR)
            e[i:] += np.exp(-np.arange(len(e) - i) / SR / 0.016) * 0.6
        e += np.exp(-tt(d) / 0.1) * 0.22
        return y * e

    def hat(open_=False):
        d = 0.22 if open_ else 0.05
        return hp(noise(d), 8000) * env_exp(d, 0.07 if open_ else 0.01)

    drums = bus()
    for k in range(int((DUR - ORIGIN) / BEAT) + 2):
        T = ORIGIN + k * BEAT
        if T > DUR:
            break
        bb = k % 4
        groove = 3.6 <= T < 36.6 or T >= HIT + 1.9
        if not groove:
            continue
        morning_break = 20.8 <= T < 21.8
        if T < 7.4:
            if bb in (0, 2):
                place(drums, kick(), T, 0.5)
        elif not morning_break:
            place(drums, kick(), T, 0.55 if T < HIT else 0.4)
        if T >= 9.4 and bb in (1, 3) and not morning_break:
            place(drums, clap(), T, 0.2, pan=0.05)
        place(drums, hat(), T + BEAT / 2, 0.09 if T < 7.4 else 0.13, pan=0.25)
        if 26.2 <= T < 35.8:
            place(drums, hat(), T + BEAT / 4, 0.05, pan=-0.25)
            place(drums, hat(), T + 3 * BEAT / 4, 0.05, pan=-0.25)
        if 7.4 <= T < 36.6 and bb == 3:
            place(drums, hat(True), T + BEAT / 2, 0.06, pan=0.3)
    m += reverb(drums, 1.0, 6500, 0.1)

    # --- pluck em semicolcheias (pedido, painel e final)
    arp = bus()
    seq = [0, 2, 4, 2, 1, 3, 4, 3]
    for k in range(int((DUR - ORIGIN) / (BEAT / 2)) + 1):
        T = ORIGIN + k * (BEAT / 2)
        on = 11.4 <= T < 20.8 or 22.0 <= T < 35.8 or T >= HIT
        if not on or T > DUR:
            continue
        ch = CHORDS[bar_index(T) % 4]
        n_ = ch[seq[k % 8]] + 12
        d = 0.3
        t = tt(d)
        f = note(n_)
        y = 0.6 * np.sin(2 * np.pi * f * t) + 0.35 * sawtooth(2 * np.pi * f * t) * np.exp(-t / 0.025)
        y *= env_ad(d, 0.002, 0.1)
        g = 0.075 * (1.15 if 26.2 <= T < 31.4 else 1) * (max(0, 1 - (T - HIT) / 3.3) if T >= HIT else 1)
        place(arp, lp(y, 4600), T, g, pan=0.4 * np.sin(k * 0.8))
    m += reverb(arp, 1.8, 7500, 0.33)

    # --- manhã (20,8): sino suave de "nascer do sol"
    for o, n_ in ((0.0, 74), (0.25, 78), (0.5, 81)):
        place(m, bell(note(n_), 2.2, 0.9, 0.2), 20.95 + o, 0.06, pan=-0.2 + o)

    # --- quebra + riser até o impacto final
    place(m, base.riser(1.4, 200, 1800), HIT - 1.4, 0.5)
    t = tt(3.4)
    fin = sum(np.sin(2 * np.pi * note(n_) * t) for n_ in [55, 62, 66, 69, 74]) / 5
    fin *= np.minimum(1, t / 0.02) * np.exp(-t / 1.9)
    place(m, fin, HIT, 0.32)

    m = reverb(m, 2.4, 5500, 0.2)
    fo = np.ones(N)
    k0 = int((DUR - 0.6) * SR)
    fo[k0:] = np.linspace(1, 0, N - k0) ** 1.5
    return m * fo[:, None]


# ---------------------------------------------------------------- efeitos sincronizados
def make_sfx():
    s = bus()
    S = lambda sig, at, g=1.0, pan=0.0: place(s, sig, at, g, pan)

    # S1 · gancho
    S(swish(0.4, 700, 5000), 0.0, 0.10, -0.2)
    S(swish(0.4, 800, 5500), 0.08, 0.10, 0.0)
    S(swish(0.45, 900, 6000), 0.42, 0.12, 0.2)
    t = tt(0.8)  # "WhatsApp?" ganha peso
    S(lp(sawtooth(2 * np.pi * np.cumsum(180 * 1.6 ** (t / 0.8)) / SR), 900) * np.sin(np.pi * t / 0.8) ** 2, 0.55, 0.05)
    S(swish(0.35, 2000, 9000), 1.6, 0.16, 0.3)  # risco holográfico
    S(base.glitch(0.14, 3), 2.3, 0.10)
    S(base.whoosh(0.8, 300, 6000, 0.55), 2.36, 0.22)  # letras voam para o celular
    S(shimmer(0.7, 1), 2.45, 0.22, 0.1)
    S(base.thud(68, 0.6, 0.15), 2.95, 0.22)
    S(bell(note(86), 1.6, 0.6), 2.97, 0.07, 0.15)

    # S2 · dois lados
    S(base.whoosh(1.3, 200, 4500, 0.5), 3.62, 0.22)
    S(swish(), 4.05, 0.09, -0.3)
    S(lid(1.2), 4.25, 0.5, 0.2)
    S(base.pop(1300, 0.12), 5.05, 0.08, 0.2)
    S(shimmer(0.75, 2), 5.2, 0.18, 0.0)
    S(travel(0.9), 5.95, 0.2, -0.1)
    S(base.pop(980, 0.12), 5.45, 0.08, 0.35)
    S(base.pop(860, 0.12), 5.7, 0.08, -0.35)

    # S3 · o cliente pede
    S(base.whoosh(1.3, 220, 4800, 0.55), 7.42, 0.22)
    S(swish(), 7.95, 0.08, -0.3)
    S(tap(), 8.95, 0.32, 0.1)
    S(base.pop(1150, 0.12), 9.1, 0.08, 0.1)
    S(swish(0.3, 500, 2500), 9.1, 0.07)
    S(swish(), 10.35, 0.08, -0.3)
    S(base.tick(0.03, 3800), 10.4, 0.12, -0.25)
    S(base.tick(0.03, 3200), 10.52, 0.08, -0.25)
    S(shimmer(0.55, 3), 10.9, 0.18, 0.0)
    S(tap(2500), 11.4, 0.34, 0.0)
    for k, at in enumerate((11.55, 11.7, 11.85)):
        S(base.pop(900 + 220 * k, 0.12), at, 0.11, -0.15 + 0.15 * k)
    S(swish(), 12.0, 0.08, -0.3)
    S(tap(2200), 13.4, 0.32, 0.2)
    S(swish(0.4, 600, 4000), 13.65, 0.08)
    S(success(), 13.76, 0.2)

    # S4 · ofertas
    S(base.whoosh(1.3, 200, 4500, 0.5), 15.02, 0.2)
    S(lid(0.9), 15.3, 0.25, 0.25)
    S(swish(), 15.45, 0.08, -0.3)
    S(shimmer(0.6, 4), 15.9, 0.16, 0.1)
    S(click(), 16.95, 0.4, 0.2)
    S(swish(0.45, 500, 6000), 17.15, 0.12, 0.2)
    S(travel(0.85), 17.55, 0.24, -0.1)
    S(notify(), 18.35, 0.17, -0.15)
    S(swish(), 18.45, 0.08, -0.3)
    S(base.whoosh(1.1, 260, 4200, 0.5), 18.55, 0.16)

    # S5 · aprovação
    S(base.whoosh(1.3, 220, 4500, 0.5), 20.82, 0.2)
    S(lid(1.0), 21.0, 0.3, 0.2)
    S(swish(), 21.15, 0.08, -0.3)
    S(base.pop(1050, 0.12), 21.55, 0.08, -0.3)
    S(shimmer(0.6, 5), 22.1, 0.12, 0.0)
    S(swish(0.5, 1200, 3500), 22.85, 0.05, 0.3)  # cursor deslizando
    S(click(), 23.8, 0.42, 0.15)
    S(success((74, 78, 81)), 23.95, 0.18)
    S(swish(), 24.15, 0.08, -0.3)

    # S6 · painel em tempo real
    S(base.whoosh(1.2, 200, 4000, 0.5), 26.25, 0.18)
    S(swish(), 26.5, 0.08, -0.3)
    S(base.pop(1200, 0.12), 27.0, 0.08, 0.3)
    S(shimmer(1.0, 6), 26.85, 0.16, 0.0)
    for k in range(4):
        S(base.pop(700 + 120 * k, 0.12), 27.2 + 0.12 * k, 0.09, -0.4 + 0.1 * k)
    for k in range(3):
        S(base.pop(1000 + 140 * k, 0.12), 27.55 + 0.12 * k, 0.09, 0.2 + 0.1 * k)
    t = tt(1.0)  # linha das faixas horárias desenhando
    S(np.sin(2 * np.pi * np.cumsum(500 * 2 ** (t / 1.0)) / SR) * np.sin(np.pi * t / 1.0) ** 2 * 0.3 + shimmer(1.0, 8) * 0.4, 27.9, 0.12, 0.0)
    S(swish(0.5, 400, 3000), 30.95, 0.07)

    # S7 · o cliente acompanha
    S(base.whoosh(1.2, 220, 4600, 0.55), 31.2, 0.2)
    S(swish(), 31.65, 0.08, -0.3)
    for k, at in enumerate((32.2, 32.85, 33.5)):
        S(base.tick(0.03, 3400 + 300 * k), at, 0.14, 0.1)
        S(bell(note(74 + 4 * k), 0.9, 0.3), at, 0.05, 0.1)
    S(success((76, 81, 85, 88)), 34.15, 0.2)

    # S8 · fechamento
    S(base.whoosh(1.2, 220, 4500, 0.5), 35.82, 0.2)
    S(lid(0.9), 36.1, 0.25, 0.25)
    S(shimmer(0.6, 9), 36.6, 0.15)
    S(travel(0.75), 37.0, 0.18)
    S(base.whoosh(0.9, 300, 3000, 0.6), 37.35, 0.12)
    S(base.impact(3.2), HIT, 0.5)
    S(shimmer(1.2, 10), HIT + 0.05, 0.2)
    S(swish(), 38.35, 0.08, -0.2)
    S(base.pop(1100, 0.13), 38.85, 0.09)
    S(bell(note(81), 2.0, 0.8), 39.2, 0.06, 0.1)
    S(bell(note(86), 2.0, 0.8), 39.28, 0.05, -0.1)

    return reverb(s, 1.6, 7500, 0.16)


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    music = hp(make_music(), 38, 4)
    sfx = hp(make_sfx(), 40, 4)
    peak = lambda x: 20 * np.log10(np.abs(x).max() + 1e-9)
    music = music / np.abs(music).max() * 10 ** (-9 / 20)
    sfx = sfx / np.abs(sfx).max() * 10 ** (-3 / 20)
    mix = soft_clip(music * 0.92 + sfx * 0.85, 1.1)
    base.write_wav(OUT / "music.wav", music)
    base.write_wav(OUT / "sfx.wav", sfx)
    base.write_wav(OUT / "mix.wav", mix * 0.95)
    print("ok", {k: round(peak(v), 1) for k, v in dict(music=music, sfx=sfx, mix=mix).items()})
