document.addEventListener("DOMContentLoaded", () => {

  /* =========================
     CONFIGURACIÓN DE ESTADOS
  ========================== */

  const ESTADOS = {
    promocion: { label: "Promoción", aprueba: true, permiteNota: true },
    final: { label: "Final", aprueba: true, permiteNota: true },
    regular: { label: "Regular", aprueba: false, permiteNota: false },
    reset: { label: "Reset", aprueba: false, permiteNota: false }
  };

  /* =========================
     MODELO DE DATOS
  ========================== */

  const materias = {};

  document.querySelectorAll(".materia").forEach(el => {
    const id = el.dataset.id;

    materias[id] = {
      id,
      nombre: el.dataset.nombre,
      creditos: Number(el.dataset.creditos || 0),
      correlativas: el.dataset.correlativas
        ? el.dataset.correlativas.split(",")
        : [],
      optativa: el.dataset.optativa === "true",
      estado: null,
      nota: null,
      el
    };
  });

  /* =========================
     BLOQUEO / DESBLOQUEO
  ========================== */

  function correlativasCumplidas(materia) {
    if (materia.correlativas.length === 0) return true;

    return materia.correlativas.every(idCorrelativa => {
      const corr = materias[idCorrelativa];
      return corr && corr.estado && ESTADOS[corr.estado].aprueba;
    });
  }

  function actualizarBloqueos() {
    Object.values(materias).forEach(m => {
      if (correlativasCumplidas(m)) {
        m.el.classList.remove("bloqueada");
      } else {
        m.el.classList.add("bloqueada");
      }
    });
  }

  /* =========================
     MODAL DE ESTADO
  ========================== */

  let materiaActiva = null;

  const modalEstado = document.getElementById("modal-estado");
  const modalNota = document.getElementById("modal-nota");

  document.querySelectorAll(".materia").forEach(el => {
    el.addEventListener("click", () => {
      const id = el.dataset.id;
      const materia = materias[id];

      if (el.classList.contains("bloqueada")) return;

      materiaActiva = materia;
      abrirModalEstado();
    });
  });

  function abrirModalEstado() {
    modalEstado.classList.add("visible");
  }

  function cerrarModalEstado() {
    modalEstado.classList.remove("visible");
  }

  function abrirModalNota() {
    modalNota.classList.add("visible");
  }

  function cerrarModalNota() {
    modalNota.classList.remove("visible");
  }

  /* =========================
     SELECCIÓN DE ESTADO
  ========================== */

  document.querySelectorAll(".btn-estado").forEach(btn => {
    btn.addEventListener("click", () => {
      const estado = btn.dataset.estado;

      materiaActiva.estado = estado;

      if (estado === "reset") {
        materiaActiva.nota = null;
        eliminarNotaVisual(materiaActiva);
      }

      cerrarModalEstado();
      actualizarBloqueos();

      if (ESTADOS[estado].permiteNota) {
        abrirModalNota();
      }
    });
  });

  /* =========================
     CARGA DE NOTA
  ========================== */

  document.getElementById("guardar-nota").addEventListener("click", () => {
    const input = document.getElementById("input-nota");
    const nota = Number(input.value);

    if (nota >= 1 && nota <= 10) {
      materiaActiva.nota = nota;
      mostrarNotaVisual(materiaActiva, nota);
    }

    input.value = "";
    cerrarModalNota();
  });

  /* =========================
     VISUAL DE NOTA
  ========================== */

  function mostrarNotaVisual(materia, nota) {
    eliminarNotaVisual(materia);

    const notaBox = document.createElement("div");
    notaBox.className = "nota-box";
    notaBox.textContent = nota;

    materia.el.appendChild(notaBox);
  }

  function eliminarNotaVisual(materia) {
    const vieja = materia.el.querySelector(".nota-box");
    if (vieja) vieja.remove();
  }

  /* =========================
     INIT
  ========================== */

  actualizarBloqueos();

});
