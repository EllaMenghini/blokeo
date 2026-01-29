document.addEventListener("DOMContentLoaded", () => {
  const materias = document.querySelectorAll(".materia");
  const promedioEl = document.getElementById("promedio");
  const avanceEl = document.getElementById("avance");
  const progressFill = document.getElementById("progress-fill");

  let estadoMaterias = JSON.parse(localStorage.getItem("estadoMaterias")) || {};

  /**************************************************
   * CORRELATIVIDADES
   **************************************************/
  const correlativas = {
    "historia-educacion-moderna": ["historia-general"],
    "filosofia-educacion": ["intro-filosofia"],
    "metodologia-investigacion": ["epistemologia"],

    "sociologia-educacion": ["intro-ciencia-politica"],
    "politica-legislacion": [
      "intro-ciencia-politica",
      "historia-educacion-arg"
    ],
    "analisis-institucional": ["intro-ciencia-politica"],

    "administracion-gestion": ["intro-organizaciones", "curriculo"],
    "investigacion-educativa": ["metodologia-investigacion"],

    "psicologia-desarrollo": ["intro-psicologia"],
    "psicologia-educacion": ["psicologia-desarrollo"],

    "curriculo": ["pedagogia-1", "sociologia-educacion"],
    "didactica-1": ["curriculo", "pedagogia-1"],
    "didactica-2": ["didactica-1"],
    "didactica-3": ["didactica-2"],

    "educacion-comparada": ["historia-educacion-moderna", "curriculo"],

    "practica-docente": [
      "filosofia-educacion",
      "politica-legislacion",
      "pedagogia-2",
      "didactica-3",
      "educacion-tic"
    ],

    "formacion-docente": [
      "politica-legislacion",
      "didactica-1",
      "formacion-capacitacion"
    ],

    "seminario-tesina": ["investigacion-educativa"],
    "tutoria-tesina": ["seminario-tesina"],

    "ingles-2": ["ingles-1"]
  };

  /**************************************************
   * MODALES
   **************************************************/
  const overlay = document.querySelector(".modal-overlay");
  const modalEstado = document.getElementById("modal-estado");
  const modalNota = document.getElementById("modal-nota");
  const inputNota = document.getElementById("input-nota");

  let materiaActiva = null;
  let estadoSeleccionado = null;

  /**************************************************
   * EVENTOS
   **************************************************/
  materias.forEach(materia => {
    materia.addEventListener("click", () => {
      if (materia.classList.contains("bloqueada")) return;
      materiaActiva = materia;
      abrirModalEstado();
    });
  });

  modalEstado.addEventListener("click", e => {
    if (!e.target.dataset.estado) return;

    estadoSeleccionado = e.target.dataset.estado;

    if (estadoSeleccionado === "reset") {
      delete estadoMaterias[materiaActiva.id];
      guardarStorage();
      cerrarModales();
      actualizarTodo();
      return;
    }

    // si solo es cursable, regular directo sin nota
    if (materiaActiva.dataset.nivel === "cursable") {
      estadoMaterias[materiaActiva.id] = {
        estado: "regular",
        nota: null
      };
      guardarStorage();
      cerrarModales();
      actualizarTodo();
      return;
    }

    cerrarModalEstado();
    abrirModalNota();
  });

  document.getElementById("guardar-nota").addEventListener("click", () => {
    const nota = parseInt(inputNota.value);
    if (!nota || nota < 1 || nota > 10) return;

    estadoMaterias[materiaActiva.id] = {
      estado: estadoSeleccionado,
      nota
    };

    guardarStorage();
    cerrarModales();
    actualizarTodo();
  });

  overlay.addEventListener("click", cerrarModales);

  /**************************************************
   * LÓGICA ACADÉMICA
   **************************************************/
  function evaluarCorrelativas(materiaId) {
    const reqs = correlativas[materiaId];
    if (!reqs || reqs.length === 0) return "aprobable";

    let todasRegular = true;
    let todasAprobadas = true;

    reqs.forEach(id => {
      const estado = estadoMaterias[id]?.estado;

      if (!estado) {
        todasRegular = false;
        todasAprobadas = false;
      } else if (estado === "regular") {
        todasAprobadas = false;
      } else if (estado !== "final" && estado !== "promocion") {
        todasRegular = false;
        todasAprobadas = false;
      }
    });

    if (todasAprobadas) return "aprobable";
    if (todasRegular) return "cursable";
    return "bloqueada";
  }

  function actualizarBloqueos() {
    materias.forEach(materia => {
      materia.classList.remove("bloqueada", "disponible");

      const nivel = evaluarCorrelativas(materia.id);
      materia.dataset.nivel = nivel;

      if (nivel === "bloqueada") {
        materia.classList.add("bloqueada");
      } else {
        materia.classList.add("disponible");
      }
    });
  }

  function aplicarEstadosVisuales() {
    materias.forEach(materia => {
      materia.classList.remove("regular", "final", "promocion");

      const badgeViejo = materia.querySelector(".nota-badge");
      if (badgeViejo) badgeViejo.remove();

      const data = estadoMaterias[materia.id];
      if (!data) return;

      materia.classList.add(data.estado);

      if (data.nota !== null) {
        const badge = document.createElement("div");
        badge.className = "nota-badge";
        badge.textContent = data.nota;
        materia.appendChild(badge);
      }
    });
  }

  /**************************************************
   * PROMEDIO Y AVANCE
   **************************************************/
  function calcularPromedio() {
    let suma = 0;
    let total = 0;

    for (const id in estadoMaterias) {
      const materia = document.getElementById(id);
      const data = estadoMaterias[id];

      if (
        materia.classList.contains("optativa") ||
        materia.classList.contains("idioma")
      ) continue;

      if (data.estado === "final" || data.estado === "promocion") {
        suma += data.nota;
        total++;
      }
    }

    promedioEl.textContent = total ? (suma / total).toFixed(2) : "–";
  }

  function calcularAvance() {
    const total = [...materias].filter(
      m => !m.classList.contains("idioma")
    ).length;

    const aprobadas = Object.values(estadoMaterias).filter(
      m => m.estado === "final" || m.estado === "promocion"
    ).length;

    const porcentaje = Math.round((aprobadas / total) * 100) || 0;

    avanceEl.textContent = `${porcentaje}%`;
    progressFill.style.width = `${porcentaje}%`;
  }

  /**************************************************
   * MODALES
   **************************************************/
  function abrirModalEstado() {
    const nivel = materiaActiva.dataset.nivel;

    modalEstado.querySelectorAll("button").forEach(btn => {
      const estado = btn.dataset.estado;
      btn.disabled = false;

      if (nivel === "cursable" && (estado === "final" || estado === "promocion")) {
        btn.disabled = true;
      }
    });

    overlay.classList.remove("hidden");
    modalEstado.classList.remove("hidden");
  }

  function cerrarModalEstado() {
    modalEstado.classList.add("hidden");
  }

  function abrirModalNota() {
    inputNota.value = "";
    modalNota.classList.remove("hidden");
  }

  function cerrarModales() {
    overlay.classList.add("hidden");
    modalEstado.classList.add("hidden");
    modalNota.classList.add("hidden");
  }

  function guardarStorage() {
    localStorage.setItem("estadoMaterias", JSON.stringify(estadoMaterias));
  }

  function actualizarTodo() {
    actualizarBloqueos();
    aplicarEstadosVisuales();
    calcularPromedio();
    calcularAvance();
  }

  actualizarTodo();
});
