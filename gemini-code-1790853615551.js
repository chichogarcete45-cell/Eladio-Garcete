// Configuración de Supabase
// REEMPLAZAR con tus credenciales de proyecto de Supabase
const SUPABASE_URL = 'https://TU-PROYECTO.supabase.co';
const SUPABASE_KEY = 'TU-ANON-PUBLIC-KEY';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Referencias del DOM
const form = document.getElementById('component-form');
const componentIdInput = document.getElementById('component-id');
const codigoInput = document.getElementById('codigo');
const nombreInput = document.getElementById('nombre');
const categoriaInput = document.getElementById('categoria');
const marcaInput = document.getElementById('marca');
const cantidadInput = document.getElementById('cantidad');
const estadoInput = document.getElementById('estado');
const descripcionInput = document.getElementById('descripcion');

const searchInput = document.getElementById('search-input');
const filterCategoria = document.getElementById('filter-categoria');
const filterEstado = document.getElementById('filter-estado');

const tableBody = document.getElementById('inventory-table-body');
const alertBox = document.getElementById('alert-box');
const formTitle = document.getElementById('form-title');
const btnCancel = document.getElementById('btn-cancel');

// Event Listener Inicial
document.addEventListener('DOMContentLoaded', () => {
  fetchComponents();

  form.addEventListener('submit', handleFormSubmit);
  searchInput.addEventListener('input', fetchComponents);
  filterCategoria.addEventListener('change', fetchComponents);
  filterEstado.addEventListener('change', fetchComponents);
  btnCancel.addEventListener('click', resetForm);
});

// Mostrar Alertas
function showAlert(message, type = 'success') {
  alertBox.textContent = message;
  alertBox.className = `alert alert-${type}`;
  alertBox.classList.remove('hidden');
  setTimeout(() => alertBox.classList.add('hidden'), 4000);
}

// B: Consultar / Listar con Filtros
async function fetchComponents() {
  try {
    let query = supabase.from('componentes').select('*').order('fecha_registro', { ascending: false });

    // Filtro por categoría
    if (filterCategoria.value) {
      query = query.eq('categoria', filterCategoria.value);
    }

    // Filtro por estado
    if (filterEstado.value) {
      query = query.eq('estado', filterEstado.value);
    }

    // Búsqueda en texto
    const searchTerm = searchInput.value.trim();
    if (searchTerm) {
      query = query.or(`codigo.ilike.%${searchTerm}%,nombre.ilike.%${searchTerm}%,marca.ilike.%${searchTerm}%`);
    }

    const { data, error } = await query;

    if (error) throw error;
    renderTable(data);
  } catch (err) {
    showAlert('Error al cargar datos: ' + err.message, 'error');
  }
}

// Renderizar Tabla
function renderTable(data) {
  tableBody.innerHTML = '';

  if (data.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No se encontraron componentes.</td></tr>';
    return;
  }

  data.forEach(item => {
    const tr = document.createElement('tr');

    const stateClass = item.estado.toLowerCase().replace(' ', '-');

    tr.innerHTML = `
      <td><strong>${item.codigo}</strong></td>
      <td>${item.nombre}</td>
      <td>${item.categoria}</td>
      <td>${item.marca}</td>
      <td>${item.cantidad}</td>
      <td><span class="badge badge-${stateClass}">${item.estado}</span></td>
      <td>
        <button class="btn btn-edit" onclick="editComponent('${item.id}')">Editar</button>
        <button class="btn btn-danger" onclick="deleteComponent('${item.id}', '${item.nombre}')">Eliminar</button>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

// A y C: Alta y Modificación
async function handleFormSubmit(e) {
  e.preventDefault();

  const id = componentIdInput.value;
  const payload = {
    codigo: codigoInput.value.trim(),
    nombre: nombreInput.value.trim(),
    categoria: categoriaInput.value,
    marca: marcaInput.value.trim(),
    cantidad: parseInt(cantidadInput.value, 10),
    estado: estadoInput.value,
    descripcion: descripcionInput.value.trim()
  };

  // Validaciones mínimas obligatorias
  if (!payload.codigo || !payload.nombre || !payload.categoria || !payload.marca || isNaN(payload.cantidad) || payload.cantidad < 0) {
    showAlert('Por favor complete todos los campos obligatorios válidamente.', 'error');
    return;
  }

  try {
    if (id) {
      // Modificar / Actualizar
      const { error } = await supabase.from('componentes').update(payload).eq('id', id);
      if (error) throw error;
      showAlert('Registro actualizado exitosamente.');
    } else {
      // Alta / Crear
      const { error } = await supabase.from('componentes').insert([payload]);
      if (error) throw error;
      showAlert('Registro creado exitosamente.');
    }

    resetForm();
    fetchComponents();
  } catch (err) {
    showAlert('Error al guardar datos: ' + err.message, 'error');
  }
}

// Cargar Datos en Formulario para Editar
async function editComponent(id) {
  try {
    const { data, error } = await supabase.from('componentes').select('*').eq('id', id).single();
    if (error) throw error;

    componentIdInput.value = data.id;
    codigoInput.value = data.codigo;
    nombreInput.value = data.nombre;
    categoriaInput.value = data.categoria;
    marcaInput.value = data.marca;
    cantidadInput.value = data.cantidad;
    estadoInput.value = data.estado;
    descripcionInput.value = data.descripcion || '';

    formTitle.textContent = '✏️ Editar Componente';
    btnCancel.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    showAlert('Error al recuperar registro: ' + err.message, 'error');
  }
}

// D: Baja / Eliminar
async function deleteComponent(id, nombre) {
  const confirmDelete = confirm(`¿Está seguro de que desea eliminar el componente "${nombre}"?`);
  if (!confirmDelete) return;

  try {
    const { error } = await supabase.from('componentes').delete().eq('id', id);
    if (error) throw error;

    showAlert('Registro eliminado correctamente.');
    fetchComponents();
  } catch (err) {
    showAlert('Error al eliminar: ' + err.message, 'error');
  }
}

// Resetear Formulario
function resetForm() {
  componentIdInput.value = '';
  form.reset();
  formTitle.textContent = '➕ Registrar Nuevo Componente';
  btnCancel.classList.add('hidden');
}