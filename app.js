const SUPABASE_URL = "https://jojullesgwljkvfexpkl.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvanVsbGVzZ3dsamt2ZmV4cGtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyODUyNjIsImV4cCI6MjA4OTg2MTI2Mn0.2C40ZYd2dQYxHd7FG2oRL-IWa7H_uMvUVj0Enz4B4ZA";

// Auth elements
const authSection = document.getElementById("auth-section");
const appSection = document.getElementById("app-section");
const authForm = document.getElementById("auth-form");
const authEmail = document.getElementById("auth-email");
const authPassword = document.getElementById("auth-password");
const authSubmit = document.getElementById("auth-submit");
const authMessage = document.getElementById("auth-message");
const toggleLink = document.getElementById("toggle-link");
const userEmailSpan = document.getElementById("user-email");
const logoutBtn = document.getElementById("logout-btn");

// Todo elements
const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const list = document.getElementById("todo-list");
const footer = document.getElementById("footer");
const count = document.getElementById("count");
const clearBtn = document.getElementById("clear-done");

let todos = [];
let isLoginMode = true;
let accessToken = null;

function authHeaders() {
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    };
}

function showMessage(text, type) {
    authMessage.textContent = text;
    authMessage.className = type;
    authMessage.classList.remove("hidden");
}

function hideMessage() {
    authMessage.classList.add("hidden");
}

// Auth mode toggle
const toggleText = document.getElementById("toggle-text");
toggleLink.addEventListener("click", (e) => {
    e.preventDefault();
    isLoginMode = !isLoginMode;
    hideMessage();
    if (isLoginMode) {
        authSubmit.textContent = "Giriş Yap";
        toggleLink.textContent = "Kayıt Ol";
        toggleText.textContent = "Hesabın yok mu? ";
    } else {
        authSubmit.textContent = "Kayıt Ol";
        toggleLink.textContent = "Giriş Yap";
        toggleText.textContent = "Zaten hesabın var mı? ";
    }
});

// Sign up / Sign in
authForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideMessage();
    const email = authEmail.value.trim();
    const password = authPassword.value;

    if (isLoginMode) {
        const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
            method: "POST",
            headers: { "apikey": SUPABASE_KEY, "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) {
            showMessage(data.error_description || data.msg || "Giriş başarısız.", "error");
        } else {
            accessToken = data.access_token;
            localStorage.setItem("sb_access_token", data.access_token);
            localStorage.setItem("sb_refresh_token", data.refresh_token);
            showApp(data.user);
        }
    } else {
        const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
            method: "POST",
            headers: { "apikey": SUPABASE_KEY, "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) {
            showMessage(data.error_description || data.msg || "Kayıt başarısız.", "error");
        } else if (data.identities && data.identities.length === 0) {
            showMessage("Bu e-posta zaten kayıtlı.", "error");
        } else {
            showMessage("Kayıt başarılı! Lütfen e-postanızı kontrol edip onay linkine tıklayın.", "success");
            authForm.reset();
        }
    }
});

// Logout
logoutBtn.addEventListener("click", () => {
    accessToken = null;
    localStorage.removeItem("sb_access_token");
    localStorage.removeItem("sb_refresh_token");
    todos = [];
    authSection.classList.remove("hidden");
    appSection.classList.add("hidden");
    authForm.reset();
    hideMessage();
});

// Show app after login
function showApp(user) {
    authSection.classList.add("hidden");
    appSection.classList.remove("hidden");
    userEmailSpan.textContent = user.email;
    fetchTodos();
}

// Check existing session on load
async function checkSession() {
    const token = localStorage.getItem("sb_access_token");
    const refreshToken = localStorage.getItem("sb_refresh_token");
    if (!token) return;

    // Try to get user with stored token
    let res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${token}` }
    });

    if (res.ok) {
        accessToken = token;
        const user = await res.json();
        showApp(user);
        return;
    }

    // Token expired, try refresh
    if (refreshToken) {
        res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
            method: "POST",
            headers: { "apikey": SUPABASE_KEY, "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: refreshToken })
        });
        if (res.ok) {
            const data = await res.json();
            accessToken = data.access_token;
            localStorage.setItem("sb_access_token", data.access_token);
            localStorage.setItem("sb_refresh_token", data.refresh_token);
            showApp(data.user);
        }
    }
}

// ---- Todo CRUD ----

async function fetchTodos() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/todos?order=created_at.asc`, { headers: authHeaders() });
    todos = await res.json();
    render();
}

async function addTodo(text) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/todos`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ text, done: false })
    });
    if (!res.ok) return;
    const data = await res.json();
    if (data.length) {
        todos.push(data[0]);
        render();
    }
}

async function updateTodo(id, updates) {
    await fetch(`${SUPABASE_URL}/rest/v1/todos?id=eq.${id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(updates)
    });
}

async function deleteTodo(id) {
    await fetch(`${SUPABASE_URL}/rest/v1/todos?id=eq.${id}`, {
        method: "DELETE",
        headers: authHeaders()
    });
}

function render() {
    list.innerHTML = "";
    todos.forEach((todo, i) => {
        const li = document.createElement("li");
        if (todo.done) li.classList.add("done");

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = todo.done;
        checkbox.addEventListener("change", async () => {
            todos[i].done = checkbox.checked;
            await updateTodo(todo.id, { done: checkbox.checked });
            render();
        });

        const span = document.createElement("span");
        span.textContent = todo.text;
        span.addEventListener("dblclick", () => {
            li.classList.add("editing");
            const editInput = document.createElement("input");
            editInput.type = "text";
            editInput.className = "edit-input";
            editInput.value = todo.text;
            li.appendChild(editInput);
            editInput.focus();

            const finishEdit = async () => {
                const newText = editInput.value.trim();
                if (newText) {
                    todos[i].text = newText;
                    await updateTodo(todo.id, { text: newText });
                    render();
                } else {
                    todos.splice(i, 1);
                    await deleteTodo(todo.id);
                    render();
                }
            };

            editInput.addEventListener("blur", finishEdit);
            editInput.addEventListener("keydown", (e) => {
                if (e.key === "Enter") editInput.blur();
                if (e.key === "Escape") {
                    editInput.value = todo.text;
                    editInput.blur();
                }
            });
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-btn";
        deleteBtn.textContent = "\u00D7";
        deleteBtn.addEventListener("click", async () => {
            todos.splice(i, 1);
            await deleteTodo(todo.id);
            render();
        });

        li.append(checkbox, span, deleteBtn);
        list.appendChild(li);
    });

    const remaining = todos.filter((t) => !t.done).length;
    count.textContent = `${remaining} görev kaldı`;
    footer.classList.toggle("hidden", todos.length === 0);
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    await addTodo(text);
});

clearBtn.addEventListener("click", async () => {
    const doneTodos = todos.filter((t) => t.done);
    todos = todos.filter((t) => !t.done);
    render();
    await Promise.all(doneTodos.map((t) => deleteTodo(t.id)));
});

// Handle email confirmation redirect
if (window.location.hash.includes("access_token")) {
    const params = new URLSearchParams(window.location.hash.substring(1));
    const token = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    if (token) {
        localStorage.setItem("sb_access_token", token);
        if (refreshToken) localStorage.setItem("sb_refresh_token", refreshToken);
        window.location.hash = "";
    }
}

checkSession();
