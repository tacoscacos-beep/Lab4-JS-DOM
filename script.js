// Глобальные переменные для выбранного события, списка регистраций и уведомлений
let selectedEventName = '';
let registrations = JSON.parse(localStorage.getItem('registrations')) || [];

let notifications = JSON.parse(localStorage.getItem('notifications')) || [
    { text: "👋 Welcome! The platform has been successfully updated to version 1.1.", date: "Developer Update" }
];

// Инициализация страницы при загрузке (проверка темы и отрисовка данных из localStorage)
window.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
        document.querySelector('.theme-toggle-btn').textContent = '☀️';
    }
    renderRegistrations();
    renderNotifications();
});

// Функция переключения светлой и темной темы
function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-theme');
    document.body.classList.toggle('light-theme', !isDark);
    document.querySelector('.theme-toggle-btn').textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// Открытие и закрытие выпадающего меню уведомлений
function toggleNotifications(event) {
    if (event) event.stopPropagation();
    const dropdown = document.getElementById('notif-dropdown');
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
}

// Закрытие выпадающего списка уведомлений при клике вне его области
window.addEventListener('click', (e) => {
    const dropdown = document.getElementById('notif-dropdown');
    const notifBtn = document.getElementById('notif-btn');
    if (dropdown.style.display === 'block' && !dropdown.contains(e.target) && !notifBtn.contains(e.target)) {
        dropdown.style.display = 'none';
    }
});

// Добавление нового системного уведомления
function addNotification(text) {
    notifications.unshift({ text, date: "Just now" });
    localStorage.setItem('notifications', JSON.stringify(notifications));
    renderNotifications();
}

// Очистка всех уведомлений
function clearNotifications() {
    notifications = [];
    localStorage.setItem('notifications', JSON.stringify(notifications));
    renderNotifications();
}

// Отрисовка списка уведомлений и бейджика непрочитанных
function renderNotifications() {
    const listEl = document.getElementById('notif-list');
    const badgeEl = document.getElementById('notif-badge');
    listEl.innerHTML = '';

    if (notifications.length === 0) {
        listEl.innerHTML = '<p class="no-notifs">No new notifications</p>';
        badgeEl.style.display = 'none';
        return;
    }

    badgeEl.style.display = 'inline-block';
    badgeEl.textContent = notifications.length;

    notifications.forEach(notif => {
        const div = document.createElement('div');
        div.className = 'notif-item';
        div.innerHTML = `<strong>${notif.date}</strong><br>${notif.text}`;
        listEl.appendChild(div);
    });
}

// Логика выбора карточки мероприятия (выделение только одной карточки)
function selectEvent(eventName, btnElement) {
    selectedEventName = eventName;
    document.getElementById('selected-event-input').value = eventName;
    document.querySelectorAll('.event-card').forEach(card => card.classList.remove('selected-event'));
    btnElement.closest('.event-card').classList.add('selected-event');
    document.getElementById('event-error').textContent = '';
}

// Элементы формы
const nameInput = document.getElementById('full-name');
const emailInput = document.getElementById('email');
const groupInput = document.getElementById('student-group');
const agreementCheck = document.getElementById('agreement');

// Живые счетчики и валидация через вспомогательную функцию
function setupField(input, counterId, errorId, validator) {
    const counter = document.getElementById(counterId);
    input.addEventListener('input', () => {
        counter.textContent = `${input.value.length} characters`;
        if (validator(input.value.trim())) clearError(input, errorId);
    });
}

setupField(nameInput, 'name-counter', 'name-error', val => val.length >= 3);
setupField(emailInput, 'email-counter', 'email-error', val => val.includes('@') && val.includes('.'));
setupField(groupInput, 'group-counter', 'group-error', val => val !== '');

// Обработка изменения состояния чекбокса согласия
agreementCheck.addEventListener('change', () => {
    if (agreementCheck.checked) document.getElementById('agreement-error').textContent = '';
});

// Обработка отправки формы регистрации
const form = document.getElementById('registration-form');

form.addEventListener('submit', (e) => {
    e.preventDefault();

    const nameVal = nameInput.value.trim();
    const emailVal = emailInput.value.trim();
    const groupVal = groupInput.value.trim();
    const eventVal = document.getElementById('selected-event-input').value.trim();
    const isAgreed = agreementCheck.checked;

    let isValid = true;

    if (nameVal.length < 3) {
        showError(nameInput, 'name-error', 'Name must be at least 3 characters.');
        isValid = false;
    }

    if (!emailVal.includes('@') || !emailVal.includes('.')) {
        showError(emailInput, 'email-error', 'Please enter a valid email.');
        isValid = false;
    }

    if (groupVal === '') {
        showError(groupInput, 'group-error', 'Group is required.');
        isValid = false;
    }

    if (eventVal === '') {
        document.getElementById('event-error').textContent = 'Please select an event.';
        isValid = false;
    } else {
        document.getElementById('event-error').textContent = '';
    }

    if (!isAgreed) {
        document.getElementById('agreement-error').textContent = 'You must agree to the rules.';
        isValid = false;
    } else {
        document.getElementById('agreement-error').textContent = '';
    }

    // Если всё валидно — сохраняем данные и обновляем DOM без перезагрузки
    if (isValid) {
        registrations.push({ name: nameVal, email: emailVal, group: groupVal, event: eventVal });
        localStorage.setItem('registrations', JSON.stringify(registrations));
        renderRegistrations();

        addNotification(`🎉 Success! You are registered for "${eventVal}".`);

        form.reset();
        document.querySelectorAll('.counter-text').forEach(el => el.textContent = '0 characters');
        document.querySelectorAll('.event-card').forEach(card => card.classList.remove('selected-event'));
    }
});

// Вспомогательные функции для показа и скрытия ошибок
function showError(input, errorId, msg) {
    input.classList.add('error');
    document.getElementById(errorId).textContent = msg;
}

function clearError(input, errorId) {
    input.classList.remove('error');
    document.getElementById(errorId).textContent = '';
}

// Динамическое создание элементов списка регистраций в DOM
function renderRegistrations() {
    const listElement = document.getElementById('registration-list');
    listElement.innerHTML = '';

    if (registrations.length === 0) {
        listElement.innerHTML = '<p style="color: #6b7280; font-style: italic;">No registrations yet.</p>';
        return;
    }

    registrations.forEach((reg, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div>
                <strong>${reg.name}</strong> (${reg.group}) — <em>${reg.event}</em><br>
                <small style="color: #6b7280;">📧 ${reg.email}</small>
            </div>
            <button class="delete-btn" onclick="deleteRegistration(${index})">Cancel</button>
        `;
        listElement.appendChild(li);
    });
}

// Удаление отдельной регистрации из списка и localStorage
function deleteRegistration(index) {
    registrations.splice(index, 1);
    localStorage.setItem('registrations', JSON.stringify(registrations));
    renderRegistrations();
}