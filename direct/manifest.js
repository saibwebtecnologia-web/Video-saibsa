/*
 * SAIB Direct: um app, dois lados. Tempos globais de cada cena (segundos).
 * Transição: fusão de 0,5 s (meia-janela 0,25). Nas emendas os dois atos desenham o mesmo quadro.
 */
window.SAIB = window.SAIB || {};
SAIB.manifest = {
  width: 1080,
  height: 1920,
  fps: 60,
  duration: 41.0,
  transition: 0.25,
  transitionMode: "dissolve",
  acts: [
    { id: "S1", start: 0.0, end: 3.6, title: "Gancho" },
    { id: "S2", start: 3.6, end: 7.4, title: "Um app, dois lados" },
    { id: "S3", start: 7.4, end: 15.0, title: "Cliente pede" },
    { id: "S4", start: 15.0, end: 20.8, title: "Ofertas" },
    { id: "S5", start: 20.8, end: 26.2, title: "Aprovação" },
    { id: "S6", start: 26.2, end: 31.4, title: "Painel em tempo real" },
    { id: "S7", start: 31.4, end: 35.8, title: "Cliente acompanha" },
    { id: "S8", start: 35.8, end: 41.0, title: "Fechamento" },
  ],
};
