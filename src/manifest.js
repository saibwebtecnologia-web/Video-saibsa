/*
 * Roteiro-mestre: tempos globais de cada ato (segundos).
 * A transição entre atos é o "scan de raio-X" do motor: uma linha de luz
 * desce pela tela em [fronteira - 0.45, fronteira + 0.45] revelando o ato seguinte.
 */
window.SAIB = window.SAIB || {};
SAIB.manifest = {
  width: 1080,
  height: 1920,
  fps: 60,
  duration: 41.6,
  transition: 0.45, // meia-janela do scan
  acts: [
    { id: "A", start: 0.0, end: 9.8, title: "O número" },
    { id: "B", start: 9.8, end: 20.0, title: "A conta" },
    { id: "C", start: 20.0, end: 29.4, title: "Abra o número" },
    { id: "D", start: 29.4, end: 36.2, title: "Mãos à obra" },
    { id: "E", start: 36.2, end: 41.6, title: "Vem aí" },
  ],
};
