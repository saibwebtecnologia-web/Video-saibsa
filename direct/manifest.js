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
    { id: "S1", start: 0.0, end: 3.4, title: "Gancho" },
    { id: "S2", start: 3.4, end: 7.4, title: "Um app, dois lados" },
    { id: "S3", start: 7.4, end: 14.2, title: "Cliente pede" },
    { id: "S4", start: 14.2, end: 19.4, title: "Ofertas" },
    { id: "S5", start: 19.4, end: 25.2, title: "Aprovação" },
    { id: "S6", start: 25.2, end: 31.0, title: "Painel em tempo real" },
    { id: "S7", start: 31.0, end: 35.4, title: "Cliente acompanha" },
    { id: "S8", start: 35.4, end: 41.0, title: "Fechamento" },
  ],
};
