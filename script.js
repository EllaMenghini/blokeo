document.addEventListener("DOMContentLoaded", () => {
  const materias = document.querySelectorAll(".materia");
  const promedioEl = document.getElementById("promedio");
  const avanceEl = document.getElementById("avance");
  const progressFill = document.getElementById("progress-fill");

  let estadoMaterias = JSON.parse(localStorage.getItem("estadoMaterias")) || {};

  /***********************
   CORRELATIVIDADES
  ************************/
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

  /***********************
   MODALES
  ************************/
  const overlay = document.querySelector(".modal-overlay");
  const modalEstado = document.getElementById("modal-estado");
  const modalNota = document.getElementById("modal-nota");

  let materiaActiva = null;
  let estadoSeleccionado = null;

  /***********************
   EVENTOS
  ************************/
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

    cerrarModalEstado();
    abrirModalNota();
  });

  document.getElementById("guardar-nota").addEventListener("click", () => {
    const nota = parseInt(document.getElementById("input-nota").value);
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

  /***********************
   FUNCIONES CLAVE
  ************************/
  function guardarStorage() {
    localStorage.setItem("estadoMaterias", JSON.stringify(estadoMaterias));
  }

  function actualizarTodo() {
    actualizarBloqueos();
    aplicarEstadosVisuales();
    calcularPromedio();
    calcularAvance();
  }

  function actualizarBloqueos() {
    materias.forEach(materia => {
      materia.classList.remove("bloqueada", "disponible");

      const reqs = correlativas[materia.id];
      if (!reqs || reqs.length === 0) {
        materia.classList.add("disponible");
        return;
      }

      const habilitada = reqs.every(id =>
        estadoMaterias[id] &&
        (estadoMaterias[id].estado === "promocion" ||
         estadoMaterias[id].estado === "final")
      );

      materia.classList.add(habilitada ? "disponible" : "bloqueada");
    });
  }

  function aplicarEstadosVisuales() {
    materias.forEach(materia => {
      materia.classList.remove("regular", "promocion", "final");

      const badge = materia.querySelector(".nota-badge");
      if (badge) badge.remove();

      const data = estadoMaterias[materia.id];
      if (!data) return;

      materia.classList.add(data.estado);

      const nota = document.createElement("div");
      nota.className = "nota-badge";
      nota.textContent = data.nota;
      materia.appendChild(nota);
    });
  }

  function calcularPromedio() {
    let suma = 0;
    let total = 0;

    for (const id in estadoMaterias) {
      const mat = document.getElementById(id);
      const data = estadoMaterias[id];

      if (
        mat.classList.contains("optativa") ||
        mat.classList.contains("idioma")
      ) continue;

      if (data.estado === "promocion" || data.estado === "final") {
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
      m => m.estado === "promocion" || m.estado === "final"
    ).length;

    const porcentaje = Math.round((aprobadas / total) * 100) || 0;

    avanceEl.textContent = `${porcentaje}%`;
    progressFill.style.width = `${porcentaje}%`;
  }

  function abrirModalEstado() {
    overlay.classList.remove("hidden");
    modalEstado.classList.remove("hidden");
  }

  function cerrarModalEstado() {
    modalEstado.classList.add("hidden");
  }

  function abrirModalNota() {
    modalNota.classList.remove("hidden");
    document.getElementById("input-nota").value = "";
  }

  function cerrarModales() {
    overlay.classList.add("hidden");
    modalEstado.classList.add("hidden");
    modalNota.classList.add("hidden");
  }

  actualizarTodo();
});
