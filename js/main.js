let activities = [];
let nextId = 1;
const activityForm = document.getElementById('activityForm');
const activityTableBody = document.getElementById('activityTableBody');
const emptyState = document.getElementById('emptyState');
const rowTemplate = document.getElementById('rowTemplate');
let currentFilter = 'todas';
let currentSort = 'fecha';
const searchInput = document.getElementById('search');
const filterButtons = document.querySelectorAll('.btn-filter');
const sortSelect = document.getElementById('sort');
const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');
let editingActivityId = null;
const btnToggleTheme = document.getElementById('btnToggleTheme');
const BODY = document.body;
const THEME_KEY = 'studyPlannerTheme';

activityForm.addEventListener('submit', handleFormSubmit);
function validateActivity(title, time) {
    if (title.trim() === '') {
        alert('El título de la actividad es obligatorio.'); 
        return false;
    }
    if (time !== '' && (isNaN(parseFloat(time)) || parseFloat(time) < 0)) {
        alert('El tiempo estimado debe ser un número positivo.');
        return false;
    }
    
    return true;
}

function handleFormSubmit(event) {
    event.preventDefault();

    const formData = new FormData(activityForm);
    const title = formData.get('title');
    const estimatedTime = formData.get('estimatedTime'); 

    if (!validateActivity(title, estimatedTime)) {
        return; 
    }

    const newActivity = {
        id: nextId++,
        title: title,
        subject: formData.get('subject').trim(),
        type: formData.get('type'),
        difficulty: formData.get('difficulty'),
        priority: formData.get('priority'),
        deadline: formData.get('deadline'),
        estimatedTime: estimatedTime ? parseFloat(estimatedTime) : 0, 
        notes: formData.get('notes').trim(),
        isImportant: formData.get('isImportant') === 'on',
        completed: false,
    };

    activities.push(newActivity);

    renderTable(); 
    updateStats(); 
    activityForm.reset();
}

function toggleActivityCompleted(id, isCompleted) {
    const activityId = parseInt(id);
    const activity = activities.find(a => a.id === activityId);

    if (activity) {
        activity.completed = isCompleted;
        renderTable(); 
        updateStats(); 
    }
}

function deleteActivity(id) {
    const activityId = parseInt(id); 

    if (confirm('¿Estás seguro de que quieres eliminar esta actividad?')) {
        activities = activities.filter(a => a.id !== activityId); 
        
        renderTable(); 
        updateStats();
    }
}

function updateStats() {
    const total = activities.length;
    const completed = activities.filter(a => a.completed).length;
    const pending = total - completed;
    
    const totalHours = activities.reduce((sum, activity) => {
        return sum + (activity.estimatedTime || 0);
    }, 0);

    document.getElementById('statTotal').textContent = total;
    document.getElementById('statCompleted').textContent = completed;
    document.getElementById('statPending').textContent = pending;
    document.getElementById('statHours').textContent = totalHours.toFixed(1);
}

function filterByStatus(activity) {
    switch (currentFilter) {
        case 'pendientes':
            return !activity.completed;
        case 'completadas':
            return activity.completed;
        case 'todas':
        default:
            return true;
    }
}

function filterBySearch(activity) {
    const searchTerm = searchInput.value.toLowerCase().trim();
    if (searchTerm === '') {
        return true;
    }
    return activity.title.toLowerCase().includes(searchTerm) || 
           activity.subject.toLowerCase().includes(searchTerm);
}

function sortActivities(arr) {
    const priorityOrder = { 'alta': 3, 'media': 2, 'baja': 1 };

    return [...arr].sort((a, b) => {
        switch (currentSort) {
            case 'prioridad':
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            case 'titulo':
                return a.title.localeCompare(b.title);
            case 'fecha':
            default:
                if (!a.deadline) return 1;
                if (!b.deadline) return -1;
                return new Date(a.deadline) - new Date(b.deadline);
        }
    });
}
function renderTable() {
    let displayList = activities
        .filter(filterByStatus)
        .filter(filterBySearch);
    displayList = sortActivities(displayList);

    activityTableBody.innerHTML = ''; 
    if (activities.length === 0 || displayList.length === 0) {
        emptyState.style.display = 'block'; 
    } else {
        emptyState.style.display = 'none'; 
    }

    displayList.forEach(activity => {
        const row = rowTemplate.content.cloneNode(true).querySelector('tr');
        row.dataset.id = activity.id;
        row.dataset.status = activity.completed ? 'completada' : 'pendiente';

        if (activity.completed) {
            row.classList.add('completed');
            row.querySelector('.row-complete').checked = true;
        }

        if (activity.isImportant) {
            row.classList.add('is-important'); 
        }

        row.querySelector('.row-title').textContent = activity.title;
        row.querySelector('.row-subject').textContent = activity.subject;
        row.querySelector('.row-type').textContent = activity.type;
        row.querySelector('.row-deadline').textContent = activity.deadline || 'N/A';
        row.querySelector('.row-time').textContent = activity.estimatedTime > 0 ? activity.estimatedTime.toFixed(1) : '-';
        
        const priorityBadge = row.querySelector('.badge--priority');
        priorityBadge.textContent = activity.priority.toUpperCase();
        priorityBadge.classList.add(`priority-${activity.priority}`); 

        row.querySelector('.row-complete').addEventListener('change', (e) => toggleActivityCompleted(activity.id, e.target.checked));
        row.querySelector('.btn-delete').addEventListener('click', () => deleteActivity(activity.id));
        row.querySelector('.btn-edit').addEventListener('click', () => openEditModal(activity.id));

        activityTableBody.appendChild(row);
    });
}

filterButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        const newFilter = e.target.dataset.filter;
        currentFilter = newFilter;
        filterButtons.forEach(btn => btn.classList.remove('is-active'));
        e.target.classList.add('is-active');

        renderTable();
    });
});
searchInput.addEventListener('input', renderTable);
sortSelect.addEventListener('change', (e) => {
    currentSort = e.target.value;
    renderTable();
});

document.getElementById('btnCloseModal').addEventListener('click', closeEditModal);
document.getElementById('btnCancelEdit').addEventListener('click', closeEditModal);
editModal.querySelector('.modal__backdrop').addEventListener('click', closeEditModal);

function closeEditModal() {
    editModal.setAttribute('aria-hidden', 'true');
    editModal.classList.remove('is-open');
    editingActivityId = null; 
    editForm.reset();
}

function openEditModal(id) {
    const activityToEdit = activities.find(a => a.id == id);
    if (!activityToEdit) return;

    editingActivityId = id; 
    document.getElementById('editTitle').value = activityToEdit.title;
    document.getElementById('editSubject').value = activityToEdit.subject;
    document.getElementById('editType').value = activityToEdit.type;
    document.getElementById('editDeadline').value = activityToEdit.deadline;

    editModal.setAttribute('aria-hidden', 'false');
    editModal.classList.add('is-open');
}

editForm.addEventListener('submit', handleEditSubmit);

function handleEditSubmit(event) {
    event.preventDefault();

    const activityIndex = activities.findIndex(a => a.id == editingActivityId);
    if (activityIndex === -1) return;

    const updatedTitle = document.getElementById('editTitle').value.trim();

    if (updatedTitle === '') {
        alert('El título no puede estar vacío.');
        return;
    }

    activities[activityIndex].title = updatedTitle;
    activities[activityIndex].subject = document.getElementById('editSubject').value.trim();
    activities[activityIndex].type = document.getElementById('editType').value;
    activities[activityIndex].deadline = document.getElementById('editDeadline').value;

    renderTable();
    closeEditModal();
}

function loadThemePreference() {
    const savedTheme = localStorage.getItem(THEME_KEY); 
    if (savedTheme === 'theme-light') {
        BODY.classList.add('theme-light');
    }
}

btnToggleTheme.addEventListener('click', () => { 
    const isLight = BODY.classList.toggle('theme-light');
    const currentTheme = isLight ? 'theme-light' : ''; 
    localStorage.setItem(THEME_KEY, currentTheme);
});

loadThemePreference();
renderTable();
updateStats();